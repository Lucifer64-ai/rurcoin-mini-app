// ============================================================
//  gps.js — GPS-привязка месторождений, бонусы добычи, карта
//  RURCoin Mini App
// ============================================================

const GPS = (function () {

  // ── Константы ──────────────────────────────────────────────
  const FIELD_RADIUS_KM   = 50;    // радиус месторождения (км)
  const MAX_BONUS         = 3.0;   // максимальный множитель добычи
  const BASE_BONUS        = 1.0;   // базовый множитель (без GPS)
  const UPDATE_INTERVAL   = 30000; // обновление позиции (мс)
  const WATCH_TIMEOUT     = 10000; // таймаут геолокации (мс)

  // ── Месторождения ──────────────────────────────────────────
  const FIELDS = [
    { id: 'siberia',    name: 'Сибирское',      lat: 60.9,  lon: 76.6,  type: 'oil',  bonus: 2.5, icon: '🛢️' },
    { id: 'sakhalin',   name: 'Сахалинское',    lat: 51.0,  lon: 143.0, type: 'gas',  bonus: 2.8, icon: '⛽' },
    { id: 'urals',      name: 'Уральское',       lat: 56.8,  lon: 60.6,  type: 'oil',  bonus: 2.0, icon: '🛢️' },
    { id: 'volga',      name: 'Волжское',        lat: 51.5,  lon: 46.0,  type: 'oil',  bonus: 1.8, icon: '🛢️' },
    { id: 'yamal',      name: 'Ямальское',       lat: 70.0,  lon: 68.0,  type: 'gas',  bonus: 3.0, icon: '⛽' },
    { id: 'caspian',    name: 'Каспийское',      lat: 42.0,  lon: 51.0,  type: 'oil',  bonus: 2.2, icon: '🛢️' },
    { id: 'khanty',     name: 'Ханты-Мансийское',lat: 61.0,  lon: 69.0,  type: 'oil',  bonus: 2.6, icon: '🛢️' },
    { id: 'kovykta',    name: 'Ковыктинское',    lat: 54.3,  lon: 104.5, type: 'gas',  bonus: 2.4, icon: '⛽' },
    { id: 'astrakhan',  name: 'Астраханское',    lat: 46.3,  lon: 48.0,  type: 'gas',  bonus: 1.9, icon: '⛽' },
    { id: 'timan',      name: 'Тимано-Печорское',lat: 65.0,  lon: 57.0,  type: 'oil',  bonus: 2.1, icon: '🛢️' },
  ];

  // ── Состояние ──────────────────────────────────────────────
  let state = {
    enabled:      false,
    watching:     false,
    watchId:      null,
    lat:          null,
    lon:          null,
    accuracy:     null,
    nearestField: null,
    bonus:        BASE_BONUS,
    lastUpdate:   null,
    error:        null,
  };

  // ── Утилиты ────────────────────────────────────────────────

  /** Расстояние между двумя точками (км, формула Haversine) */
  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2)
            + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180)
            * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  /** Найти ближайшее месторождение и рассчитать бонус */
  function calcBonus(lat, lon) {
    let nearest = null;
    let minDist = Infinity;

    FIELDS.forEach(function(f) {
      const d = haversine(lat, lon, f.lat, f.lon);
      if (d < minDist) { minDist = d; nearest = f; }
    });

    if (!nearest || minDist > FIELD_RADIUS_KM) {
      return { field: null, bonus: BASE_BONUS, dist: minDist };
    }

    // Бонус убывает линейно от центра к краю
    const ratio  = 1 - (minDist / FIELD_RADIUS_KM);
    const bonus  = BASE_BONUS + (nearest.bonus - BASE_BONUS) * ratio;
    return { field: nearest, bonus: parseFloat(bonus.toFixed(2)), dist: Math.round(minDist) };
  }

  // ── Геолокация ─────────────────────────────────────────────

  function onPosition(pos) {
    state.lat       = pos.coords.latitude;
    state.lon       = pos.coords.longitude;
    state.accuracy  = Math.round(pos.coords.accuracy);
    state.lastUpdate = new Date();
    state.error     = null;

    const result      = calcBonus(state.lat, state.lon);
    state.nearestField = result.field;
    state.bonus        = result.bonus;

    // Применяем бонус к игре
    applyBonus(state.bonus, result.field, result.dist);
    renderMap();
    renderStatus();

    if (typeof window.NotificationSystem !== 'undefined' && result.field) {
      window.NotificationSystem.show(
        result.field.icon + ' Месторождение рядом!',
        result.field.name + ' — бонус добычи ×' + state.bonus,
        'success'
      );
    }
  }

  function onError(err) {
    const msgs = {
      1: 'Доступ к геолокации запрещён',
      2: 'Позиция недоступна',
      3: 'Таймаут геолокации',
    };
    state.error   = msgs[err.code] || 'Ошибка геолокации';
    state.bonus   = BASE_BONUS;
    state.enabled = false;
    renderStatus();
    console.warn('[GPS]', state.error);
  }

  function startWatching() {
    if (!navigator.geolocation) {
      state.error = 'Геолокация не поддерживается';
      renderStatus();
      return;
    }
    if (state.watchId !== null) return;

    state.watching = true;
    state.watchId  = navigator.geolocation.watchPosition(
      onPosition,
      onError,
      { enableHighAccuracy: true, timeout: WATCH_TIMEOUT, maximumAge: UPDATE_INTERVAL }
    );
  }

  function stopWatching() {
    if (state.watchId !== null) {
      navigator.geolocation.clearWatch(state.watchId);
      state.watchId  = null;
      state.watching = false;
    }
    state.bonus   = BASE_BONUS;
    state.enabled = false;
    applyBonus(BASE_BONUS, null, null);
    renderStatus();
  }

  // ── Применение бонуса к игре ───────────────────────────────

  function applyBonus(bonus, field, dist) {
    if (window.rurcoinApp) {
      window.rurcoinApp.gpsBonus       = bonus;
      window.rurcoinApp.gpsField       = field ? field.name : null;
      window.rurcoinApp.gpsDist        = dist;
    }

    // Обновляем отображение бонуса в UI добычи
    const el = document.getElementById('gpsBonusDisplay');
    if (el) {
      if (bonus > BASE_BONUS && field) {
        el.innerHTML = field.icon + ' <b>×' + bonus + '</b> — ' + field.name
          + (dist !== null ? ' (' + dist + ' км)' : '');
        el.style.color = '#00D4FF';
      } else {
        el.innerHTML = '📍 GPS-бонус не активен';
        el.style.color = '#888';
      }
    }
  }

  // ── Рендер карты ───────────────────────────────────────────

  function renderMap() {
    const container = document.getElementById('gpsMapContainer');
    if (!container) return;

    const W = container.offsetWidth  || 320;
    const H = container.offsetHeight || 260;

    // Проекция: Россия примерно 40°–180° lon, 45°–75° lat
    const LON_MIN = 28, LON_MAX = 190, LAT_MIN = 42, LAT_MAX = 78;

    function project(lat, lon) {
      const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * W;
      const y = H - ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * H;
      return { x: Math.round(x), y: Math.round(y) };
    }

    let html = '<svg width="' + W + '" height="' + H + '" style="display:block;background:#0a0a1a;border-radius:12px;">';

    // Сетка
    html += '<g opacity="0.15">';
    for (let lon = 40; lon <= 180; lon += 20) {
      const p1 = project(LAT_MIN, lon), p2 = project(LAT_MAX, lon);
      html += '<line x1="'+p1.x+'" y1="'+p1.y+'" x2="'+p2.x+'" y2="'+p2.y+'" stroke="#00D4FF" stroke-width="0.5"/>';
    }
    for (let lat = 45; lat <= 75; lat += 10) {
      const p1 = project(lat, LON_MIN), p2 = project(lat, LON_MAX);
      html += '<line x1="'+p1.x+'" y1="'+p1.y+'" x2="'+p2.x+'" y2="'+p2.y+'" stroke="#00D4FF" stroke-width="0.5"/>';
    }
    html += '</g>';

    // Месторождения
    FIELDS.forEach(function(f) {
      const p = project(f.lat, f.lon);
      const isNearest = state.nearestField && state.nearestField.id === f.id;
      const r = isNearest ? 10 : 7;
      const color = f.type === 'oil' ? '#FF6B00' : '#00D4FF';
      const pulse = isNearest ? '<animate attributeName="r" values="'+r+';'+(r+5)+';'+r+'" dur="1.5s" repeatCount="indefinite"/>' : '';

      html += '<circle cx="'+p.x+'" cy="'+p.y+'" r="'+r+'" fill="'+color+'" opacity="0.85">'+pulse+'</circle>';
      html += '<text x="'+(p.x+r+3)+'" y="'+(p.y+4)+'" fill="#fff" font-size="9" font-family="monospace">'+f.name+'</text>';
    });

    // Позиция игрока
    if (state.lat !== null) {
      const pp = project(state.lat, state.lon);
      if (pp.x >= 0 && pp.x <= W && pp.y >= 0 && pp.y <= H) {
        html += '<circle cx="'+pp.x+'" cy="'+pp.y+'" r="6" fill="#fff" stroke="#FF6B00" stroke-width="2">';
        html += '<animate attributeName="r" values="6;10;6" dur="1s" repeatCount="indefinite"/>';
        html += '</circle>';
        html += '<text x="'+(pp.x+9)+'" y="'+(pp.y+4)+'" fill="#FF6B00" font-size="10" font-weight="bold">ВЫ</text>';
      }
    }

    html += '</svg>';
    container.innerHTML = html;
  }

  // ── Рендер статуса ─────────────────────────────────────────

  function renderStatus() {
    const statusEl = document.getElementById('gpsStatus');
    if (!statusEl) return;

    if (state.error) {
      statusEl.innerHTML = '❌ ' + state.error;
      statusEl.style.color = '#ff4444';
      return;
    }
    if (!state.enabled) {
      statusEl.innerHTML = '📍 GPS отключён';
      statusEl.style.color = '#888';
      return;
    }
    if (state.lat === null) {
      statusEl.innerHTML = '🔄 Определяем позицию...';
      statusEl.style.color = '#FFD700';
      return;
    }

    const timeStr = state.lastUpdate
      ? state.lastUpdate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : '—';

    statusEl.innerHTML = '✅ GPS активен · точность ' + state.accuracy + ' м · ' + timeStr;
    statusEl.style.color = '#00D4FF';
  }

  // ── Публичный API ──────────────────────────────────────────

  function enable() {
    state.enabled = true;
    startWatching();
    renderStatus();
  }

  function disable() {
    stopWatching();
    renderStatus();
  }

  function toggle() {
    state.enabled ? disable() : enable();
  }

  function getBonus()  { return state.bonus; }
  function getState()  { return Object.assign({}, state); }
  function getFields() { return FIELDS.slice(); }

  // ── Инициализация вкладки GPS ──────────────────────────────

  function initTab() {
    renderMap();
    renderStatus();

    const toggleBtn = document.getElementById('gpsToggleBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function() {
        toggle();
        toggleBtn.textContent = state.enabled ? '⏹ Отключить GPS' : '▶ Включить GPS';
      });
    }

    // Список месторождений
    const listEl = document.getElementById('gpsFieldsList');
    if (listEl) {
      let html = '';
      FIELDS.forEach(function(f) {
        html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #1a1a2e;">'
          + '<span style="font-size:20px;">' + f.icon + '</span>'
          + '<div style="flex:1;">'
          + '<div style="font-weight:bold;color:#fff;">' + f.name + '</div>'
          + '<div style="font-size:12px;color:#888;">' + (f.type === 'oil' ? 'Нефть' : 'Газ') + ' · радиус ' + FIELD_RADIUS_KM + ' км</div>'
          + '</div>'
          + '<div style="color:#FF6B00;font-weight:bold;">×' + f.bonus + '</div>'
          + '</div>';
      });
      listEl.innerHTML = html;
    }

    // Обновляем карту при ресайзе
    window.addEventListener('resize', renderMap);
  }

  // Автоинициализация при переключении на вкладку GPS
  document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function(e) {
      if (e.target && e.target.dataset && e.target.dataset.tab === 'gps') {
        setTimeout(initTab, 100);
      }
    });
  });

  return { enable, disable, toggle, getBonus, getState, getFields, initTab, renderMap };

})();

window.GPS = GPS;
