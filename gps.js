// ============================================================
//  gps.js v2.0 — Leaflet карта + захват месторождений
//  + адаптивный трекинг + геозоны + антифрод + квесты
//  RURCoin Mini App
// ============================================================

const GPS = (function () {

  // ── Константы ──────────────────────────────────────────────
  const FIELD_RADIUS_KM    = 50;
  const CAPTURE_RADIUS_KM  = 5;      // радиус захвата месторождения
  const MAX_BONUS          = 3.0;
  const BASE_BONUS         = 1.0;
  const CACHE_TTL_MS       = 300000; // 5 мин — держим позицию после потери GPS
  const CAPTURE_TTL_MS     = 86400000; // 24 ч — захват сбрасывается
  const MAX_SPEED_KMH      = 300;    // антифрод: выше = телепорт
  const LEAFLET_CSS        = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  const LEAFLET_JS         = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

  // ── Месторождения ──────────────────────────────────────────
  const FIELDS = [
    { id: 'siberia',    name: 'Сибирское',       lat: 60.9,  lon: 76.6,  type: 'oil', bonus: 2.5, icon: '🛢️' },
    { id: 'sakhalin',   name: 'Сахалинское',     lat: 51.0,  lon: 143.0, type: 'gas', bonus: 2.8, icon: '⛽' },
    { id: 'urals',      name: 'Уральское',        lat: 56.8,  lon: 60.6,  type: 'oil', bonus: 2.0, icon: '🛢️' },
    { id: 'volga',      name: 'Волжское',         lat: 51.5,  lon: 46.0,  type: 'oil', bonus: 1.8, icon: '🛢️' },
    { id: 'yamal',      name: 'Ямальское',        lat: 70.0,  lon: 68.0,  type: 'gas', bonus: 3.0, icon: '⛽' },
    { id: 'caspian',    name: 'Каспийское',       lat: 42.0,  lon: 51.0,  type: 'oil', bonus: 2.2, icon: '🛢️' },
    { id: 'khanty',     name: 'Ханты-Мансийское', lat: 61.0,  lon: 69.0,  type: 'oil', bonus: 2.6, icon: '🛢️' },
    { id: 'kovykta',    name: 'Ковыктинское',     lat: 54.3,  lon: 104.5, type: 'gas', bonus: 2.4, icon: '⛽' },
    { id: 'astrakhan',  name: 'Астраханское',     lat: 46.3,  lon: 48.0,  type: 'gas', bonus: 1.9, icon: '⛽' },
    { id: 'timan',      name: 'Тимано-Печорское', lat: 65.0,  lon: 57.0,  type: 'oil', bonus: 2.1, icon: '🛢️' },
  ];

  // ── GPS-квесты ─────────────────────────────────────────────
  const QUESTS = [
    { id: 'visit3cities',  name: '🏙️ Посети 3 города',      target: 3,  reward: 500,  unit: 'cities',  desc: 'Открой редкий ресурс' },
    { id: 'walk10km',      name: '🚶 Пройди 10 км',          target: 10, reward: 300,  unit: 'km',      desc: 'Разблокируй новое оборудование' },
    { id: 'capture3',      name: '🚩 Захвати 3 месторождения',target: 3,  reward: 1000, unit: 'captures',desc: '+20% к добыче на 1 час' },
    { id: 'noon',          name: '☀️ Онлайн в полдень',      target: 1,  reward: 200,  unit: 'checkins',desc: 'Дневной бонус ×1.5' },
  ];

  // ── Состояние ──────────────────────────────────────────────
  let state = {
    enabled:       false,
    watchId:       null,
    lat:           null,
    lon:           null,
    accuracy:      null,
    speed:         null,         // км/ч
    lastUpdate:    null,
    lastValidPos:  null,         // кэш позиции
    nearestField:  null,
    bonus:         BASE_BONUS,
    error:         null,
    totalDistKm:   0,
    prevLat:       null,
    prevLon:       null,
    prevTime:      null,
    captures:      {},           // { fieldId: { owner, ts } }
    visitedCities: new Set(),
    questProgress: {},
    anomalyCount:  0,
  };

  // ── Leaflet карта ──────────────────────────────────────────
  let map        = null;
  let playerMarker = null;
  let fieldMarkers = {};
  let fieldCircles = {};
  let captureCircles = {};
  let leafletReady = false;

  // ── Утилиты ────────────────────────────────────────────────

  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2
            + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180)
            * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  function calcBonus(lat, lon) {
    let nearest = null, minDist = Infinity;
    FIELDS.forEach(f => {
      const d = haversine(lat, lon, f.lat, f.lon);
      if (d < minDist) { minDist = d; nearest = f; }
    });
    if (!nearest || minDist > FIELD_RADIUS_KM) {
      return { field: null, bonus: BASE_BONUS, dist: Math.round(minDist) };
    }
    const ratio = 1 - (minDist / FIELD_RADIUS_KM);
    // Учитываем точность GPS
    const accPenalty = state.accuracy
      ? (state.accuracy < 20 ? 1.0 : state.accuracy < 100 ? 0.85 : state.accuracy < 500 ? 0.65 : 0.4)
      : 1.0;
    const bonus = BASE_BONUS + (nearest.bonus - BASE_BONUS) * ratio * accPenalty;
    return { field: nearest, bonus: parseFloat(bonus.toFixed(2)), dist: Math.round(minDist) };
  }

  // ── Антифрод ───────────────────────────────────────────────

  function checkAntifraud(lat, lon, ts) {
    if (state.prevLat === null) return true;
    const dist  = haversine(state.prevLat, state.prevLon, lat, lon);
    const dtSec = (ts - state.prevTime) / 1000;
    if (dtSec < 1) return false;
    const speedKmh = (dist / dtSec) * 3600;
    if (speedKmh > MAX_SPEED_KMH) {
      state.anomalyCount++;
      console.warn('[GPS] Антифрод: скорость', Math.round(speedKmh), 'км/ч — возможный телепорт');
      if (state.anomalyCount >= 3) {
        notify('⚠️ Подозрительная активность', 'GPS-бонус временно заморожен', 'error');
        return false;
      }
    } else {
      state.anomalyCount = Math.max(0, state.anomalyCount - 1);
    }
    return true;
  }

  // ── Адаптивный трекинг ─────────────────────────────────────

  function getTrackingOptions() {
    const speed = state.speed || 0;
    // Едет — обновляем чаще, стоит — реже (экономия батареи)
    const maxAge = speed > 10 ? 5000 : speed > 2 ? 15000 : 60000;
    return { enableHighAccuracy: true, timeout: 10000, maximumAge: maxAge };
  }

  // ── Захват месторождений ───────────────────────────────────

  function tryCapture(field, dist) {
    if (dist > CAPTURE_RADIUS_KM) return;

    const now      = Date.now();
    const existing = state.captures[field.id];
    const playerId = getPlayerId();

    // Уже захвачено мной и не истекло
    if (existing && existing.owner === playerId && (now - existing.ts) < CAPTURE_TTL_MS) return;

    // Захватываем
    state.captures[field.id] = { owner: playerId, ts: now, fieldName: field.name };
    saveCaptures();

    // Обновляем прогресс квеста
    updateQuestProgress('capture3', Object.keys(state.captures).length);

    notify(
      '🚩 Месторождение захвачено!',
      field.name + ' — вы получаете +15% от добычи всех игроков рядом на 24 ч',
      'success'
    );

    updateCaptureMarkers();
  }

  function getPlayerId() {
    let id = localStorage.getItem('rurc_player_id');
    if (!id) {
      id = 'player_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('rurc_player_id', id);
    }
    return id;
  }

  function getCaptureBonus() {
    const now = Date.now();
    let bonus = 0;
    const playerId = getPlayerId();
    Object.values(state.captures).forEach(c => {
      if (c.owner === playerId && (now - c.ts) < CAPTURE_TTL_MS) bonus += 0.15;
    });
    return bonus;
  }

  function saveCaptures() {
    try { localStorage.setItem('rurc_captures', JSON.stringify(state.captures)); } catch(e) {}
  }

  function loadCaptures() {
    try {
      const raw = localStorage.getItem('rurc_captures');
      if (raw) state.captures = JSON.parse(raw);
    } catch(e) {}
  }

  // ── Квесты ─────────────────────────────────────────────────

  function updateQuestProgress(questId, value) {
    const quest = QUESTS.find(q => q.id === questId);
    if (!quest) return;
    const prev = state.questProgress[questId] || 0;
    state.questProgress[questId] = value;
    if (prev < quest.target && value >= quest.target) {
      onQuestComplete(quest);
    }
    renderQuests();
  }

  function onQuestComplete(quest) {
    notify('🎉 Квест выполнен!', quest.name + ' — награда: ' + quest.reward + ' RURC', 'success');
    if (window.rurcoinApp) {
      window.rurcoinApp.balance = (window.rurcoinApp.balance || 0) + quest.reward;
    }
  }

  function checkNoonQuest() {
    const h = new Date().getHours();
    if (h === 12) updateQuestProgress('noon', 1);
  }

  // ── Геолокация ─────────────────────────────────────────────

  function onPosition(pos) {
    const { latitude: lat, longitude: lon, accuracy, speed } = pos.coords;
    const now = Date.now();

    // Антифрод
    if (!checkAntifraud(lat, lon, now)) return;

    // Скорость
    state.speed = speed ? Math.round(speed * 3.6) : 0;

    // Дистанция
    if (state.prevLat !== null) {
      const d = haversine(state.prevLat, state.prevLon, lat, lon);
      state.totalDistKm += d;
      updateQuestProgress('walk10km', parseFloat(state.totalDistKm.toFixed(2)));
    }

    // Обновляем состояние
    state.lat        = lat;
    state.lon        = lon;
    state.accuracy   = Math.round(accuracy);
    state.lastUpdate = new Date(now);
    state.lastValidPos = { lat, lon, ts: now };
    state.error      = null;
    state.prevLat    = lat;
    state.prevLon    = lon;
    state.prevTime   = now;

    // Бонус
    const result       = calcBonus(lat, lon);
    state.nearestField = result.field;
    state.bonus        = result.bonus + getCaptureBonus();

    // Захват
    if (result.field) tryCapture(result.field, result.dist);

    // Квест полдень
    checkNoonQuest();

    // Применяем
    applyBonus(state.bonus, result.field, result.dist);

    // Обновляем карту
    if (leafletReady) updateLeafletMap(lat, lon);
    renderStatus();
    renderQuests();
  }

  function onError(err) {
    const msgs = { 1: 'Доступ запрещён', 2: 'Позиция недоступна', 3: 'Таймаут' };
    state.error = msgs[err.code] || 'Ошибка GPS';

    // Используем кэш позиции если свежий
    if (state.lastValidPos && (Date.now() - state.lastValidPos.ts) < CACHE_TTL_MS) {
      const cached = state.lastValidPos;
      const age    = Math.round((Date.now() - cached.ts) / 60000);
      const result = calcBonus(cached.lat, cached.lon);
      // Плавно снижаем бонус
      const decay  = Math.max(0, 1 - (Date.now() - cached.ts) / CACHE_TTL_MS);
      state.bonus  = BASE_BONUS + (result.bonus - BASE_BONUS) * decay;
      applyBonus(state.bonus, result.field, result.dist);
      renderStatus('⚠️ GPS потерян, кэш ' + age + ' мин назад');
    } else {
      state.bonus = BASE_BONUS;
      applyBonus(BASE_BONUS, null, null);
      renderStatus();
    }
    console.warn('[GPS]', state.error);
  }

  function startWatching() {
    if (!navigator.geolocation) { state.error = 'Геолокация не поддерживается'; renderStatus(); return; }
    if (state.watchId !== null) return;
    state.watchId = navigator.geolocation.watchPosition(onPosition, onError, getTrackingOptions());
  }

  function stopWatching() {
    if (state.watchId !== null) { navigator.geolocation.clearWatch(state.watchId); state.watchId = null; }
    state.bonus = BASE_BONUS;
    state.enabled = false;
    applyBonus(BASE_BONUS, null, null);
    renderStatus();
  }

  // ── Применение бонуса ──────────────────────────────────────

  function applyBonus(bonus, field, dist) {
    if (window.rurcoinApp) {
      window.rurcoinApp.gpsBonus  = bonus;
      window.rurcoinApp.gpsField  = field ? field.name : null;
      window.rurcoinApp.gpsDist   = dist;
    }
    const el = document.getElementById('gpsBonusDisplay');
    if (!el) return;
    if (bonus > BASE_BONUS && field) {
      el.innerHTML = field.icon + ' <b>×' + bonus.toFixed(2) + '</b> — ' + field.name
        + (dist !== null ? ' (' + dist + ' км)' : '')
        + (state.speed > 0 ? ' · ' + state.speed + ' км/ч' : '');
      el.style.color = '#00D4FF';
    } else {
      el.innerHTML = '📍 GPS-бонус не активен';
      el.style.color = '#888';
    }
  }

  // ── Уведомления ────────────────────────────────────────────

  function notify(title, msg, type) {
    if (window.NotificationSystem) window.NotificationSystem.show(title, msg, type || 'info');
    else console.log('[GPS]', title, msg);
  }

  // ── Leaflet карта ──────────────────────────────────────────

  function loadLeaflet(cb) {
    if (window.L) { leafletReady = true; cb(); return; }

    // CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id   = 'leaflet-css';
      link.rel  = 'stylesheet';
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    // JS
    const script  = document.createElement('script');
    script.src    = LEAFLET_JS;
    script.onload = function() { leafletReady = true; cb(); };
    script.onerror = function() { console.error('[GPS] Leaflet не загружен'); };
    document.head.appendChild(script);
  }

  function initLeafletMap() {
    const container = document.getElementById('gpsMapContainer');
    if (!container || map) return;

    container.style.height = '320px';
    container.style.borderRadius = '12px';
    container.style.overflow = 'hidden';

    // Центр России
    map = L.map('gpsMapContainer', { zoomControl: true, attributionControl: false })
            .setView([62, 90], 3);

    // Тёмная тема тайлов
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      subdomains: 'abcd'
    }).addTo(map);

    // Месторождения
    FIELDS.forEach(f => {
      const color  = f.type === 'oil' ? '#FF6B00' : '#00D4FF';
      const isCaptured = isCapturedByMe(f.id);

      // Зона месторождения
      fieldCircles[f.id] = L.circle([f.lat, f.lon], {
        radius:      FIELD_RADIUS_KM * 1000,
        color:       color,
        fillColor:   color,
        fillOpacity: 0.08,
        weight:      1,
        dashArray:   '4 4'
      }).addTo(map);

      // Зона захвата
      captureCircles[f.id] = L.circle([f.lat, f.lon], {
        radius:      CAPTURE_RADIUS_KM * 1000,
        color:       isCaptured ? '#FFD700' : color,
        fillColor:   isCaptured ? '#FFD700' : color,
        fillOpacity: isCaptured ? 0.25 : 0.12,
        weight:      2
      }).addTo(map);

      // Маркер
      const icon = L.divIcon({
        html: '<div style="font-size:22px;filter:drop-shadow(0 0 6px ' + color + ');">' + f.icon + '</div>',
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      fieldMarkers[f.id] = L.marker([f.lat, f.lon], { icon })
        .addTo(map)
        .bindPopup(buildFieldPopup(f));
    });

    // Позиция игрока (если уже есть)
    if (state.lat !== null) updateLeafletMap(state.lat, state.lon);
  }

  function buildFieldPopup(f) {
    const captured  = state.captures[f.id];
    const now       = Date.now();
    const isMine    = captured && captured.owner === getPlayerId() && (now - captured.ts) < CAPTURE_TTL_MS;
    const timeLeft  = captured ? Math.max(0, Math.round((CAPTURE_TTL_MS - (now - captured.ts)) / 3600000)) : 0;

    return '<div style="font-family:monospace;min-width:160px;">'
      + '<b>' + f.icon + ' ' + f.name + '</b><br>'
      + '<span style="color:' + (f.type==='oil'?'#FF6B00':'#00D4FF') + ';">'
      + (f.type === 'oil' ? '🛢️ Нефть' : '⛽ Газ') + '</span><br>'
      + 'Бонус: <b>×' + f.bonus + '</b><br>'
      + 'Радиус: ' + FIELD_RADIUS_KM + ' км<br>'
      + (isMine
          ? '<span style="color:#FFD700;">🚩 Захвачено вами (' + timeLeft + ' ч)</span>'
          : captured
            ? '<span style="color:#ff4444;">🔒 Захвачено другим игроком</span>'
            : '<span style="color:#888;">Свободно (подойди на ' + CAPTURE_RADIUS_KM + ' км)</span>')
      + '</div>';
  }

  function updateLeafletMap(lat, lon) {
    if (!map) return;

    // Маркер игрока
    const playerIcon = L.divIcon({
      html: '<div style="width:16px;height:16px;background:#fff;border:3px solid #FF6B00;border-radius:50%;box-shadow:0 0 12px #FF6B00;"></div>',
      className: '',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    if (playerMarker) {
      playerMarker.setLatLng([lat, lon]);
    } else {
      playerMarker = L.marker([lat, lon], { icon: playerIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup('<b>📍 Вы здесь</b><br>Точность: ' + state.accuracy + ' м');
      map.setView([lat, lon], 6);
    }

    // Обновляем попапы месторождений
    FIELDS.forEach(f => {
      if (fieldMarkers[f.id]) fieldMarkers[f.id].setPopupContent(buildFieldPopup(f));
    });
  }

  function updateCaptureMarkers() {
    if (!map) return;
    FIELDS.forEach(f => {
      if (!captureCircles[f.id]) return;
      const isMine = isCapturedByMe(f.id);
      const color  = f.type === 'oil' ? '#FF6B00' : '#00D4FF';
      captureCircles[f.id].setStyle({
        color:       isMine ? '#FFD700' : color,
        fillColor:   isMine ? '#FFD700' : color,
        fillOpacity: isMine ? 0.25 : 0.12,
      });
    });
  }

  function isCapturedByMe(fieldId) {
    const c = state.captures[fieldId];
    return c && c.owner === getPlayerId() && (Date.now() - c.ts) < CAPTURE_TTL_MS;
  }

  // ── Рендер статуса ─────────────────────────────────────────

  function renderStatus(override) {
    const el = document.getElementById('gpsStatus');
    if (!el) return;
    if (override) { el.innerHTML = override; el.style.color = '#FFD700'; return; }
    if (state.error && !state.lastValidPos) {
      el.innerHTML = '❌ ' + state.error; el.style.color = '#ff4444'; return;
    }
    if (!state.enabled) { el.innerHTML = '📍 GPS отключён'; el.style.color = '#888'; return; }
    if (state.lat === null) { el.innerHTML = '🔄 Определяем позицию...'; el.style.color = '#FFD700'; return; }
    const t = state.lastUpdate
      ? state.lastUpdate.toLocaleTimeString('ru-RU', {hour:'2-digit',minute:'2-digit',second:'2-digit'})
      : '—';
    el.innerHTML = '✅ GPS · ±' + state.accuracy + ' м · ' + t
      + (state.speed > 0 ? ' · ' + state.speed + ' км/ч' : '')
      + ' · ' + state.totalDistKm.toFixed(1) + ' км пройдено';
    el.style.color = '#00D4FF';
  }

  // ── Рендер квестов ─────────────────────────────────────────

  function renderQuests() {
    const el = document.getElementById('gpsQuestsList');
    if (!el) return;
    let html = '';
    QUESTS.forEach(q => {
      const progress = state.questProgress[q.id] || 0;
      const done     = progress >= q.target;
      const pct      = Math.min(100, Math.round((progress / q.target) * 100));
      html += '<div style="padding:10px 0;border-bottom:1px solid #1a1a2e;">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;">'
        + '<span style="font-weight:bold;color:' + (done ? '#FFD700' : '#fff') + ';">' + q.name + '</span>'
        + '<span style="color:#FF6B00;font-size:13px;">+' + q.reward + ' RURC</span>'
        + '</div>'
        + '<div style="font-size:12px;color:#888;margin:3px 0;">' + q.desc + '</div>'
        + '<div style="background:#1a1a2e;border-radius:4px;height:6px;margin-top:6px;">'
        + '<div style="background:' + (done ? '#FFD700' : '#FF6B00') + ';width:' + pct + '%;height:100%;border-radius:4px;transition:width 0.5s;"></div>'
        + '</div>'
        + '<div style="font-size:11px;color:#666;margin-top:3px;">' + progress + ' / ' + q.target + ' ' + q.unit + '</div>'
        + '</div>';
    });
    el.innerHTML = html;
  }

  // ── Рендер захватов ────────────────────────────────────────

  function renderCaptures() {
    const el = document.getElementById('gpsCapturesList');
    if (!el) return;
    const now = Date.now();
    const mine = Object.entries(state.captures).filter(([id, c]) =>
      c.owner === getPlayerId() && (now - c.ts) < CAPTURE_TTL_MS
    );
    if (!mine.length) {
      el.innerHTML = '<div style="color:#888;text-align:center;padding:16px;">Нет захваченных месторождений</div>';
      return;
    }
    let html = '';
    mine.forEach(([id, c]) => {
      const f       = FIELDS.find(f => f.id === id);
      const timeLeft = Math.max(0, Math.round((CAPTURE_TTL_MS - (now - c.ts)) / 3600000));
      html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #1a1a2e;">'
        + '<span style="font-size:20px;">' + (f ? f.icon : '🚩') + '</span>'
        + '<div style="flex:1;">'
        + '<div style="font-weight:bold;color:#FFD700;">' + (f ? f.name : id) + '</div>'
        + '<div style="font-size:12px;color:#888;">Осталось: ' + timeLeft + ' ч · +15% к добыче</div>'
        + '</div>'
        + '</div>';
    });
    el.innerHTML = html;
  }

  // ── Инициализация вкладки ──────────────────────────────────

  function initTab() {
    loadCaptures();

    loadLeaflet(function() {
      initLeafletMap();
      if (map) setTimeout(function() { map.invalidateSize(); }, 200);
    });

    renderStatus();
    renderQuests();
    renderCaptures();

    const toggleBtn = document.getElementById('gpsToggleBtn');
    if (toggleBtn) {
      toggleBtn.textContent = state.enabled ? '⏹ Отключить GPS' : '▶ Включить GPS';
      toggleBtn.onclick = function() {
        state.enabled ? disable() : enable();
        toggleBtn.textContent = state.enabled ? '⏹ Отключить GPS' : '▶ Включить GPS';
      };
    }

    // Список месторождений
    const listEl = document.getElementById('gpsFieldsList');
    if (listEl) {
      let html = '';
      FIELDS.forEach(f => {
        const isMine = isCapturedByMe(f.id);
        const color  = f.type === 'oil' ? '#FF6B00' : '#00D4FF';
        html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #1a1a2e;">'
          + '<span style="font-size:20px;">' + f.icon + '</span>'
          + '<div style="flex:1;">'
          + '<div style="font-weight:bold;color:#fff;">' + f.name
          + (isMine ? ' <span style="color:#FFD700;font-size:11px;">🚩 МОЁ</span>' : '') + '</div>'
          + '<div style="font-size:12px;color:#888;">' + (f.type==='oil'?'Нефть':'Газ') + ' · ' + FIELD_RADIUS_KM + ' км</div>'
          + '</div>'
          + '<div style="color:' + color + ';font-weight:bold;">×' + f.bonus + '</div>'
          + '</div>';
      });
      listEl.innerHTML = html;
    }

    window.addEventListener('resize', function() { if (map) map.invalidateSize(); });
  }

  // ── Публичный API ──────────────────────────────────────────

  function enable()   { state.enabled = true;  startWatching(); renderStatus(); }
  function disable()  { stopWatching(); }
  function toggle()   { state.enabled ? disable() : enable(); }
  function getBonus() { return state.bonus; }
  function getState() { return Object.assign({}, state); }
  function getFields(){ return FIELDS.slice(); }

  // Автоинициализация при переключении на вкладку GPS
  document.addEventListener('DOMContentLoaded', function() {
    loadCaptures();
    document.addEventListener('click', function(e) {
      if (e.target && e.target.dataset && e.target.dataset.tab === 'gps') {
        setTimeout(initTab, 150);
      }
    });
  });

  return { enable, disable, toggle, getBonus, getState, getFields, initTab };

})();

window.GPS = GPS;
