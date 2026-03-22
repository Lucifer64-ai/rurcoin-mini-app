// ============================================================
//  gps.js v3.0 — Глобальная карта + Сканер + Платформы
//  Месторождения по всей планете, мультиплеер через localStorage
//  RURCoin Mini App
// ============================================================

const GPS = (function () {

  // ── Константы ──────────────────────────────────────────────
  const SCAN_RADIUS_KM     = 200;   // радиус сканера
  const FIELD_RADIUS_KM    = 80;    // зона бонуса месторождения
  const CAPTURE_RADIUS_KM  = 10;    // радиус захвата/строительства
  const PLATFORM_BUILD_SEC = 30;    // секунд на строительство платформы
  const CAPTURE_TTL_MS     = 86400000; // 24ч — захват
  const CACHE_TTL_MS       = 300000;
  const MAX_SPEED_KMH      = 300;
  const LEAFLET_CSS        = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  const LEAFLET_JS         = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  const SHARED_KEY         = 'rurc_world_state'; // общий ключ для всех игроков

  // ── 60 месторождений по всей планете ──────────────────────
  const FIELDS = [
    // Россия
    { id: 'siberia',     name: 'Сибирское',        lat: 60.9,  lon: 76.6,   type: 'oil', bonus: 2.5, icon: '🛢️', region: 'Россия' },
    { id: 'sakhalin',    name: 'Сахалинское',      lat: 51.0,  lon: 143.0,  type: 'gas', bonus: 2.8, icon: '⛽', region: 'Россия' },
    { id: 'yamal',       name: 'Ямальское',         lat: 70.0,  lon: 68.0,   type: 'gas', bonus: 3.0, icon: '⛽', region: 'Россия' },
    { id: 'khanty',      name: 'Ханты-Мансийское', lat: 61.0,  lon: 69.0,   type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Россия' },
    { id: 'kovykta',     name: 'Ковыктинское',     lat: 54.3,  lon: 104.5,  type: 'gas', bonus: 2.4, icon: '⛽', region: 'Россия' },
    { id: 'timan',       name: 'Тимано-Печорское', lat: 65.0,  lon: 57.0,   type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Россия' },
    // Ближний Восток
    { id: 'ghawar',      name: 'Гавар',            lat: 25.1,  lon: 49.2,   type: 'oil', bonus: 3.5, icon: '🛢️', region: 'Саудовская Аравия' },
    { id: 'rumaila',     name: 'Румайла',           lat: 30.5,  lon: 47.5,   type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Ирак' },
    { id: 'burgan',      name: 'Бурган',            lat: 28.9,  lon: 47.9,   type: 'oil', bonus: 3.3, icon: '🛢️', region: 'Кувейт' },
    { id: 'north_dome',  name: 'Северный купол',   lat: 26.1,  lon: 51.5,   type: 'gas', bonus: 3.8, icon: '⛽', region: 'Катар' },
    { id: 'kirkuk',      name: 'Киркук',            lat: 35.5,  lon: 44.4,   type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Ирак' },
    { id: 'ahvaz',       name: 'Ахваз',             lat: 31.3,  lon: 48.7,   type: 'oil', bonus: 3.1, icon: '🛢️', region: 'Иран' },
    // Африка
    { id: 'hassi',       name: 'Хасси-Мессауд',    lat: 31.7,  lon: 6.1,    type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Алжир' },
    { id: 'jubilee',     name: 'Джубили',           lat: 4.6,   lon: -2.5,   type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Гана' },
    { id: 'agbami',      name: 'Агбами',            lat: 3.8,   lon: 5.5,    type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Нигерия' },
    { id: 'bonga',       name: 'Бонга',             lat: 3.5,   lon: 4.8,    type: 'oil', bonus: 2.2, icon: '🛢️', region: 'Нигерия' },
    { id: 'tahe',        name: 'Большой Зунтур',   lat: -8.0,  lon: 14.0,   type: 'gas', bonus: 2.0, icon: '⛽', region: 'Ангола' },
    { id: 'mozambique',  name: 'Мозамбикское',     lat: -15.0, lon: 40.5,   type: 'gas', bonus: 2.6, icon: '⛽', region: 'Мозамбик' },
    // Северная Америка
    { id: 'permian',     name: 'Пермский бассейн', lat: 31.8,  lon: -102.5, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'США' },
    { id: 'eagle_ford',  name: 'Игл Форд',         lat: 28.5,  lon: -98.5,  type: 'oil', bonus: 2.7, icon: '🛢️', region: 'США' },
    { id: 'bakken',      name: 'Баккен',            lat: 47.5,  lon: -103.0, type: 'oil', bonus: 2.5, icon: '🛢️', region: 'США' },
    { id: 'prudhoe',     name: 'Прудо-Бэй',        lat: 70.3,  lon: -148.5, type: 'oil', bonus: 2.8, icon: '🛢️', region: 'США (Аляска)' },
    { id: 'athabasca',   name: 'Атабаска',          lat: 57.0,  lon: -111.5, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Канада' },
    { id: 'marcellus',   name: 'Марселлус',         lat: 41.5,  lon: -77.5,  type: 'gas', bonus: 2.4, icon: '⛽', region: 'США' },
    // Южная Америка
    { id: 'lula',        name: 'Лула',              lat: -22.5, lon: -40.5,  type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Бразилия' },
    { id: 'orinoco',     name: 'Ориноко',           lat: 8.0,   lon: -63.5,  type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Венесуэла' },
    { id: 'carabobo',    name: 'Карабобо',          lat: 8.5,   lon: -64.0,  type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Венесуэла' },
    { id: 'vaca_muerta', name: 'Вака Муэрта',      lat: -38.5, lon: -69.5,  type: 'gas', bonus: 2.7, icon: '⛽', region: 'Аргентина' },
    { id: 'cano_limon',  name: 'Каньо-Лимон',      lat: 6.8,   lon: -71.5,  type: 'oil', bonus: 2.2, icon: '🛢️', region: 'Колумбия' },
    // Европа
    { id: 'ekofisk',     name: 'Экофиск',           lat: 56.5,  lon: 3.2,    type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Норвегия' },
    { id: 'statfjord',   name: 'Статфьорд',         lat: 61.2,  lon: 1.8,    type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Норвегия' },
    { id: 'groningen',   name: 'Гронинген',         lat: 53.2,  lon: 6.8,    type: 'gas', bonus: 2.1, icon: '⛽', region: 'Нидерланды' },
    { id: 'forties',     name: 'Фортис',            lat: 57.7,  lon: 0.8,    type: 'oil', bonus: 2.0, icon: '🛢️', region: 'Великобритания' },
    // Азия
    { id: 'daqing',      name: 'Дацин',             lat: 46.6,  lon: 125.0,  type: 'oil', bonus: 2.5, icon: '🛢️', region: 'Китай' },
    { id: 'tarim',       name: 'Таримский',         lat: 39.5,  lon: 83.5,   type: 'gas', bonus: 2.6, icon: '⛽', region: 'Китай' },
    { id: 'minas',       name: 'Минас',             lat: 0.8,   lon: 101.5,  type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Индонезия' },
    { id: 'bombay',      name: 'Бомбейский',        lat: 19.1,  lon: 71.5,   type: 'oil', bonus: 2.2, icon: '🛢️', region: 'Индия' },
    { id: 'tengiz',      name: 'Тенгиз',            lat: 47.5,  lon: 53.5,   type: 'oil', bonus: 2.8, icon: '🛢️', region: 'Казахстан' },
    { id: 'kashagan',    name: 'Кашаган',           lat: 45.5,  lon: 52.5,   type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Казахстан' },
    { id: 'galkynysh',   name: 'Галкыныш',          lat: 37.5,  lon: 62.5,   type: 'gas', bonus: 3.1, icon: '⛽', region: 'Туркменистан' },
    // Австралия / Океания
    { id: 'gorgon',      name: 'Горгон',            lat: -21.5, lon: 114.5,  type: 'gas', bonus: 2.9, icon: '⛽', region: 'Австралия' },
    { id: 'ichthys',     name: 'Ихтис',             lat: -14.0, lon: 124.0,  type: 'gas', bonus: 2.7, icon: '⛽', region: 'Австралия' },
    { id: 'cooper',      name: 'Купер',             lat: -28.0, lon: 140.5,  type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Австралия' },
    // Арктика / Шельф
    { id: 'arctic_1',    name: 'Арктика-1',         lat: 80.0,  lon: 30.0,   type: 'oil', bonus: 3.5, icon: '🛢️', region: 'Арктика' },
    { id: 'arctic_2',    name: 'Арктика-2',         lat: 78.0,  lon: 100.0,  type: 'gas', bonus: 3.6, icon: '⛽', region: 'Арктика' },
    { id: 'arctic_3',    name: 'Арктика-3',         lat: 75.0,  lon: -10.0,  type: 'gas', bonus: 3.4, icon: '⛽', region: 'Арктика' },
    // Глубоководные
    { id: 'deepwater_1', name: 'Атлантис',          lat: 27.5,  lon: -90.5,  type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Мексиканский залив' },
    { id: 'deepwater_2', name: 'Тупи',              lat: -24.0, lon: -42.0,  type: 'oil', bonus: 3.3, icon: '🛢️', region: 'Атлантика' },
    { id: 'deepwater_3', name: 'Левиафан',          lat: 31.5,  lon: 33.5,   type: 'gas', bonus: 2.8, icon: '⛽', region: 'Средиземноморье' },
    { id: 'deepwater_4', name: 'Зохр',              lat: 29.5,  lon: 28.5,   type: 'gas', bonus: 2.9, icon: '⛽', region: 'Египет' },
    // Центральная Азия
    { id: 'karachaganak',name: 'Карачаганак',       lat: 51.5,  lon: 53.0,   type: 'gas', bonus: 2.7, icon: '⛽', region: 'Казахстан' },
    { id: 'dauletabad',  name: 'Даулетабад',        lat: 36.5,  lon: 62.0,   type: 'gas', bonus: 2.5, icon: '⛽', region: 'Туркменистан' },
    // Африка (доп)
    { id: 'hassi_r',     name: 'Хасси-Рмель',      lat: 32.9,  lon: 3.3,    type: 'gas', bonus: 2.6, icon: '⛽', region: 'Алжир' },
    { id: 'suez',        name: 'Суэцкий',           lat: 28.0,  lon: 33.0,   type: 'oil', bonus: 2.0, icon: '🛢️', region: 'Египет' },
    // Азия (доп)
    { id: 'maui',        name: 'Мауи',              lat: -39.5, lon: 173.5,  type: 'gas', bonus: 2.0, icon: '⛽', region: 'Новая Зеландия' },
    { id: 'natuna',      name: 'Натуна',            lat: 4.5,   lon: 108.5,  type: 'gas', bonus: 2.4, icon: '⛽', region: 'Индонезия' },
    { id: 'yadavaran',   name: 'Ядаваран',          lat: 32.0,  lon: 47.5,   type: 'oil', bonus: 2.8, icon: '🛢️', region: 'Иран' },
    { id: 'azadegan',    name: 'Азадеган',          lat: 31.5,  lon: 48.0,   type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Иран' },
    { id: 'west_qurna',  name: 'Западная Курна',   lat: 30.8,  lon: 47.2,   type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Ирак' },
    { id: 'majnoon',     name: 'Маджнун',           lat: 31.0,  lon: 47.8,   type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Ирак' },
  ];

  // ── Квесты (бафы к добыче) ─────────────────────────────────
  const QUESTS = [
    {
      id: 'visit3cities', name: '🏙️ Посети 3 города',
      target: 3, unit: 'cities',
      buff: { type: 'mining', value: 0.25, durationMs: 3600000 },
      buffDesc: '+25% к добыче на 1 час',
      desc: 'Побывай в 3 разных городах'
    },
    {
      id: 'walk10km', name: '🚶 Пройди 10 км',
      target: 10, unit: 'km',
      buff: { type: 'mining', value: 0.30, durationMs: 7200000 },
      buffDesc: '+30% к добыче на 2 часа',
      desc: 'Пройди суммарно 10 км'
    },
    {
      id: 'capture3', name: '🚩 Захвати 3 месторождения',
      target: 3, unit: 'captures',
      buff: { type: 'mining', value: 0.50, durationMs: 3600000 },
      buffDesc: '+50% к добыче на 1 час',
      desc: 'Захвати 3 разных месторождения'
    },
    {
      id: 'noon', name: '☀️ Онлайн в полдень',
      target: 1, unit: 'checkins',
      buff: { type: 'mining', value: 0.20, durationMs: 1800000 },
      buffDesc: '+20% к добыче на 30 минут',
      desc: 'Зайди в игру в 12:00'
    },
    {
      id: 'build3', name: '🏗️ Построй 3 платформы',
      target: 3, unit: 'platforms',
      buff: { type: 'mining', value: 1.00, durationMs: 86400000 },
      buffDesc: '+100% к добыче на 24 часа',
      desc: 'Построй платформы на 3 месторождениях'
    },
    {
      id: 'scan5', name: '📡 Просканируй 5 раз',
      target: 5, unit: 'scans',
      buff: { type: 'mining', value: 0.15, durationMs: 3600000 },
      buffDesc: '+15% к добыче на 1 час',
      desc: 'Используй сканер 5 раз'
    },
  ];

  // ── Состояние ──────────────────────────────────────────────
  let state = {
    enabled: false, watchId: null,
    lat: null, lon: null, accuracy: null, speed: null,
    lastUpdate: null, lastValidPos: null,
    nearestField: null, bonus: 1.0, error: null,
    totalDistKm: 0, prevLat: null, prevLon: null, prevTime: null,
    captures: {}, platforms: {},
    visitedCities: new Set(), questProgress: {},
    activeBuffs: [],   // [{ type, value, expiresAt, name }]
    anomalyCount: 0,
    scanCount: 0,
    scannedFields: [], // поля в радиусе сканера
    scanning: false,
  };

  let map = null, playerMarker = null;
  let fieldMarkers = {}, fieldCircles = {}, captureCircles = {};
  let scanCircle = null, scanRipple = null;
  let leafletReady = false;

  // ── Утилиты ────────────────────────────────────────────────
  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLon = (lon2-lon1)*Math.PI/180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  function getPlayerId() {
    let id = localStorage.getItem('rurc_player_id');
    if (!id) { id = 'player_' + Math.random().toString(36).substr(2,9); localStorage.setItem('rurc_player_id', id); }
    return id;
  }

  function getPlayerName() {
    return localStorage.getItem('rurc_player_name') || ('Игрок#' + getPlayerId().slice(-4));
  }

  // ── Общий мировой стейт (симуляция мультиплеера через localStorage) ──
  function loadWorldState() {
    try {
      const raw = localStorage.getItem(SHARED_KEY);
      const world = raw ? JSON.parse(raw) : { platforms: {}, captures: {} };
      state.platforms = world.platforms || {};
      state.captures  = world.captures  || {};
    } catch(e) { state.platforms = {}; state.captures = {}; }
  }

  function saveWorldState() {
    try {
      localStorage.setItem(SHARED_KEY, JSON.stringify({
        platforms: state.platforms,
        captures:  state.captures,
        updatedAt: Date.now()
      }));
    } catch(e) {}
  }

  // ── Бафы к добыче ─────────────────────────────────────────
  function addBuff(quest) {
    const b = quest.buff;
    const buff = { type: b.type, value: b.value, expiresAt: Date.now() + b.durationMs, name: quest.buffDesc };
    state.activeBuffs.push(buff);
    saveBuffs();
    notify('⚡ Баф активирован!', quest.name + ' → ' + quest.buffDesc, 'success');
    applyBuffsToGame();
  }

  function saveBuffs() {
    try { localStorage.setItem('rurc_buffs', JSON.stringify(state.activeBuffs)); } catch(e) {}
  }

  function loadBuffs() {
    try {
      const raw = localStorage.getItem('rurc_buffs');
      if (raw) state.activeBuffs = JSON.parse(raw).filter(b => b.expiresAt > Date.now());
    } catch(e) {}
  }

  function applyBuffsToGame() {
    const now = Date.now();
    state.activeBuffs = state.activeBuffs.filter(b => b.expiresAt > now);
    const totalBuff = state.activeBuffs.reduce((sum, b) => sum + b.value, 0);
    if (window.rurcoinApp) {
      window.rurcoinApp.questBuff = totalBuff;
    }
    renderBuffs();
  }

  function getTotalBuff() {
    const now = Date.now();
    return state.activeBuffs.filter(b => b.expiresAt > now).reduce((s, b) => s + b.value, 0);
  }

  // ── Сканер месторождений ───────────────────────────────────
  function runScan() {
    if (!state.lat) { notify('❌ GPS не активен', 'Включи GPS для сканирования', 'error'); return; }
    if (state.scanning) return;
    state.scanning = true;

    const btn = document.getElementById('gpsScanBtn');
    if (btn) { btn.disabled = true; btn.textContent = '📡 Сканирование...'; }

    // Анимация сканера на карте
    if (map && scanCircle) { map.removeLayer(scanCircle); scanCircle = null; }
    if (map) {
      scanCircle = L.circle([state.lat, state.lon], {
        radius: SCAN_RADIUS_KM * 1000,
        color: '#00D4FF', fillColor: '#00D4FF', fillOpacity: 0.04,
        weight: 2, dashArray: '6 4', className: 'scan-pulse'
      }).addTo(map);
    }

    // Находим поля в радиусе
    state.scannedFields = FIELDS.filter(f => haversine(state.lat, state.lon, f.lat, f.lon) <= SCAN_RADIUS_KM);

    // Обновляем прогресс квеста
    state.scanCount++;
    updateQuestProgress('scan5', state.scanCount);

    setTimeout(function() {
      state.scanning = false;
      if (btn) { btn.disabled = false; btn.textContent = '📡 Сканировать'; }
      renderScanResults();
      // Подсвечиваем найденные поля на карте
      highlightScannedFields();
    }, 2000);
  }

  function highlightScannedFields() {
    if (!map) return;
    state.scannedFields.forEach(f => {
      if (fieldMarkers[f.id]) {
        fieldMarkers[f.id].setOpacity(1);
        if (fieldCircles[f.id]) {
          fieldCircles[f.id].setStyle({ fillOpacity: 0.15, weight: 2 });
        }
      }
    });
  }

  function renderScanResults() {
    const el = document.getElementById('gpsScanResults');
    if (!el) return;
    if (!state.scannedFields.length) {
      el.innerHTML = '<div style="color:#888;text-align:center;padding:16px;">📡 Месторождений в радиусе ' + SCAN_RADIUS_KM + ' км не найдено</div>';
      return;
    }
    const now = Date.now();
    let html = '<div style="color:#00D4FF;font-size:12px;margin-bottom:8px;">📡 Найдено: ' + state.scannedFields.length + ' месторождений в радиусе ' + SCAN_RADIUS_KM + ' км</div>';
    state.scannedFields.sort((a,b) => {
      const da = haversine(state.lat, state.lon, a.lat, a.lon);
      const db = haversine(state.lat, state.lon, b.lat, b.lon);
      return da - db;
    }).forEach(f => {
      const dist = Math.round(haversine(state.lat, state.lon, f.lat, f.lon));
      const platform = state.platforms[f.id];
      const capture  = state.captures[f.id];
      const isMine   = capture && capture.owner === getPlayerId() && (now - capture.ts) < CAPTURE_TTL_MS;
      const hasPlatform = platform && (now - platform.builtAt) >= 0;
      const myPlatform  = hasPlatform && platform.owner === getPlayerId();
      const color = f.type === 'oil' ? '#FF6B00' : '#00D4FF';
      const inCapture = dist <= CAPTURE_RADIUS_KM;

      html += '<div style="background:#0d1117;border:1px solid ' + (isMine?'#FFD700':hasPlatform?'#9B59B6':'#1a1a2e') + ';border-radius:10px;padding:12px;margin-bottom:8px;">'
        + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">'
        + '<span style="font-size:20px;">' + f.icon + '</span>'
        + '<div style="flex:1;">'
        + '<div style="font-weight:bold;color:#fff;font-size:14px;">' + f.name + '</div>'
        + '<div style="font-size:11px;color:#888;">' + f.region + ' · ' + dist + ' км · ×' + f.bonus + '</div>'
        + '</div>'
        + '<span style="font-size:11px;padding:2px 8px;border-radius:12px;background:' + color + '22;color:' + color + ';">'
        + (f.type==='oil'?'Нефть':'Газ') + '</span>'
        + '</div>';

      // Статус платформы
      if (hasPlatform) {
        html += '<div style="font-size:12px;color:#9B59B6;margin-bottom:6px;">🏗️ Платформа: ' + platform.ownerName
          + (myPlatform ? ' (вы)' : '') + ' · +' + Math.round(platform.bonusPct*100) + '% к добыче</div>';
      }

      // Статус захвата
      if (isMine) {
        html += '<div style="font-size:12px;color:#FFD700;margin-bottom:6px;">🚩 Захвачено вами</div>';
      } else if (capture && (now - capture.ts) < CAPTURE_TTL_MS) {
        html += '<div style="font-size:12px;color:#ff4444;margin-bottom:6px;">🔒 Захвачено: ' + capture.ownerName + '</div>';
      }

      // Кнопки действий
      if (inCapture) {
        html += '<div style="display:flex;gap:6px;flex-wrap:wrap;">';
        if (!isMine) {
          html += '<button onclick="GPS.captureField(\'' + f.id + '\')" style="flex:1;padding:6px;background:#FFD70022;border:1px solid #FFD700;border-radius:6px;color:#FFD700;font-size:12px;cursor:pointer;">🚩 Захватить</button>';
        }
        if (!hasPlatform) {
          html += '<button onclick="GPS.buildPlatform(\'' + f.id + '\')" style="flex:1;padding:6px;background:#9B59B622;border:1px solid #9B59B6;border-radius:6px;color:#9B59B6;font-size:12px;cursor:pointer;">🏗️ Построить платформу</button>';
        } else if (myPlatform) {
          html += '<button onclick="GPS.upgradePlatform(\'' + f.id + '\')" style="flex:1;padding:6px;background:#00D4FF22;border:1px solid #00D4FF;border-radius:6px;color:#00D4FF;font-size:12px;cursor:pointer;">⬆️ Улучшить</button>';
        }
        html += '</div>';
      } else {
        html += '<div style="font-size:11px;color:#555;">Подойди на ' + CAPTURE_RADIUS_KM + ' км для действий</div>';
      }
      html += '</div>';
    });
    el.innerHTML = html;
  }

  // ── Строительство платформ ─────────────────────────────────
  function buildPlatform(fieldId) {
    const f = FIELDS.find(f => f.id === fieldId);
    if (!f) return;
    if (!state.lat) { notify('❌ GPS не активен', '', 'error'); return; }
    const dist = haversine(state.lat, state.lon, f.lat, f.lon);
    if (dist > CAPTURE_RADIUS_KM) { notify('❌ Слишком далеко', 'Подойди на ' + CAPTURE_RADIUS_KM + ' км', 'error'); return; }
    if (state.platforms[fieldId]) { notify('⚠️ Платформа уже есть', 'На этом месторождении уже построена платформа', 'warning'); return; }

    notify('🏗️ Строительство начато', f.name + ' — займёт ' + PLATFORM_BUILD_SEC + ' сек', 'info');

    // Прогресс строительства
    let elapsed = 0;
    const interval = setInterval(function() {
      elapsed++;
      const pct = Math.round((elapsed / PLATFORM_BUILD_SEC) * 100);
      const progressEl = document.getElementById('buildProgress_' + fieldId);
      if (progressEl) progressEl.style.width = pct + '%';
      if (elapsed >= PLATFORM_BUILD_SEC) {
        clearInterval(interval);
        onPlatformBuilt(fieldId, f);
      }
    }, 1000);

    // Показываем прогресс в UI
    renderBuildProgress(fieldId, f.name);
  }

  function renderBuildProgress(fieldId, fieldName) {
    const el = document.getElementById('gpsBuildQueue');
    if (!el) return;
    const div = document.createElement('div');
    div.id = 'buildItem_' + fieldId;
    div.style.cssText = 'background:#0d1117;border:1px solid #9B59B6;border-radius:8px;padding:10px;margin-bottom:8px;';
    div.innerHTML = '<div style="font-size:13px;color:#9B59B6;margin-bottom:6px;">🏗️ Строим: ' + fieldName + '</div>'
      + '<div style="background:#1a1a2e;border-radius:4px;height:8px;">'
      + '<div id="buildProgress_' + fieldId + '" style="background:#9B59B6;width:0%;height:100%;border-radius:4px;transition:width 1s;"></div>'
      + '</div>';
    el.appendChild(div);
  }

  function onPlatformBuilt(fieldId, field) {
    const platform = {
      owner: getPlayerId(), ownerName: getPlayerName(),
      builtAt: Date.now(), level: 1, bonusPct: 0.20
    };
    state.platforms[fieldId] = platform;
    saveWorldState();

    // Убираем прогресс
    const item = document.getElementById('buildItem_' + fieldId);
    if (item) item.remove();

    // Обновляем маркер на карте
    updateFieldMarker(field);

    // Квест
    const builtCount = Object.values(state.platforms).filter(p => p.owner === getPlayerId()).length;
    updateQuestProgress('build3', builtCount);

    notify('✅ Платформа построена!', field.name + ' — +20% к добыче нефти/газа', 'success');
    applyPlatformBonuses();
    renderScanResults();
    renderPlatformsList();
  }

  function upgradePlatform(fieldId) {
    const p = state.platforms[fieldId];
    const f = FIELDS.find(f => f.id === fieldId);
    if (!p || p.owner !== getPlayerId()) return;
    if (p.level >= 5) { notify('⚠️ Максимальный уровень', 'Платформа уже прокачана до максимума', 'warning'); return; }
    p.level++;
    p.bonusPct = p.level * 0.20; // +20% за каждый уровень
    saveWorldState();
    updateFieldMarker(f);
    notify('⬆️ Платформа улучшена!', f.name + ' — уровень ' + p.level + ' · +' + Math.round(p.bonusPct*100) + '% к добыче', 'success');
    applyPlatformBonuses();
    renderScanResults();
    renderPlatformsList();
  }

  function applyPlatformBonuses() {
    const myPlatforms = Object.values(state.platforms).filter(p => p.owner === getPlayerId());
    const totalBonus = myPlatforms.reduce((s, p) => s + p.bonusPct, 0);
    if (window.rurcoinApp) window.rurcoinApp.platformBonus = totalBonus;
  }

  // ── Захват месторождений ───────────────────────────────────
  function captureField(fieldId) {
    const f = FIELDS.find(f => f.id === fieldId);
    if (!f || !state.lat) return;
    const dist = haversine(state.lat, state.lon, f.lat, f.lon);
    if (dist > CAPTURE_RADIUS_KM) { notify('❌ Слишком далеко', 'Подойди на ' + CAPTURE_RADIUS_KM + ' км', 'error'); return; }
    const now = Date.now();
    const existing = state.captures[fieldId];
    if (existing && existing.owner === getPlayerId() && (now - existing.ts) < CAPTURE_TTL_MS) {
      notify('⚠️ Уже захвачено', 'Это месторождение уже ваше', 'warning'); return;
    }
    state.captures[fieldId] = { owner: getPlayerId(), ownerName: getPlayerName(), ts: now, fieldName: f.name };
    saveWorldState();
    const captureCount = Object.keys(state.captures).filter(id => {
      const c = state.captures[id];
      return c.owner === getPlayerId() && (now - c.ts) < CAPTURE_TTL_MS;
    }).length;
    updateQuestProgress('capture3', captureCount);
    updateFieldMarker(f);
    notify('🚩 Захвачено!', f.name + ' — +15% к добыче на 24 ч', 'success');
    renderScanResults();
    renderCaptures();
  }

  // ── Бонус от GPS-позиции ───────────────────────────────────
  function calcBonus(lat, lon) {
    let nearest = null, minDist = Infinity;
    FIELDS.forEach(f => {
      const d = haversine(lat, lon, f.lat, f.lon);
      if (d < minDist) { minDist = d; nearest = f; }
    });
    if (!nearest || minDist > FIELD_RADIUS_KM) return { field: null, bonus: 1.0, dist: Math.round(minDist) };
    const ratio = 1 - (minDist / FIELD_RADIUS_KM);
    const accPenalty = state.accuracy ? (state.accuracy < 20 ? 1.0 : state.accuracy < 100 ? 0.85 : state.accuracy < 500 ? 0.65 : 0.4) : 1.0;
    const bonus = 1.0 + (nearest.bonus - 1.0) * ratio * accPenalty;
    return { field: nearest, bonus: parseFloat(bonus.toFixed(2)), dist: Math.round(minDist) };
  }

  function getCaptureBonus() {
    const now = Date.now();
    return Object.values(state.captures).filter(c => c.owner === getPlayerId() && (now - c.ts) < CAPTURE_TTL_MS).length * 0.15;
  }

  // ── Антифрод ───────────────────────────────────────────────
  function checkAntifraud(lat, lon, ts) {
    if (state.prevLat === null) return true;
    const dist = haversine(state.prevLat, state.prevLon, lat, lon);
    const dtSec = (ts - state.prevTime) / 1000;
    if (dtSec < 1) return false;
    const speedKmh = (dist / dtSec) * 3600;
    if (speedKmh > MAX_SPEED_KMH) {
      state.anomalyCount++;
      if (state.anomalyCount >= 3) { notify('⚠️ Антифрод', 'GPS-бонус заморожен', 'error'); return false; }
    } else { state.anomalyCount = Math.max(0, state.anomalyCount - 1); }
    return true;
  }

  // ── Геолокация ─────────────────────────────────────────────
  function onPosition(pos) {
    const { latitude: lat, longitude: lon, accuracy, speed } = pos.coords;
    const now = Date.now();
    if (!checkAntifraud(lat, lon, now)) return;
    state.speed = speed ? Math.round(speed * 3.6) : 0;
    if (state.prevLat !== null) {
      const d = haversine(state.prevLat, state.prevLon, lat, lon);
      state.totalDistKm += d;
      updateQuestProgress('walk10km', parseFloat(state.totalDistKm.toFixed(2)));
    }
    state.lat = lat; state.lon = lon; state.accuracy = Math.round(accuracy);
    state.lastUpdate = new Date(now); state.lastValidPos = { lat, lon, ts: now }; state.error = null;
    state.prevLat = lat; state.prevLon = lon; state.prevTime = now;
    const result = calcBonus(lat, lon);
    state.nearestField = result.field;
    state.bonus = result.bonus + getCaptureBonus();
    if (result.field && result.dist <= CAPTURE_RADIUS_KM) captureField(result.field.id);
    if (new Date().getHours() === 12) updateQuestProgress('noon', 1);
    applyBonus(state.bonus, result.field, result.dist);
    applyBuffsToGame();
    if (leafletReady) updateLeafletMap(lat, lon);
    renderStatus();
    renderBuffs();
  }

  function onError(err) {
    const msgs = { 1: 'Доступ запрещён', 2: 'Позиция недоступна', 3: 'Таймаут' };
    state.error = msgs[err.code] || 'Ошибка GPS';
    if (state.lastValidPos && (Date.now() - state.lastValidPos.ts) < CACHE_TTL_MS) {
      const cached = state.lastValidPos;
      const result = calcBonus(cached.lat, cached.lon);
      const decay = Math.max(0, 1 - (Date.now() - cached.ts) / CACHE_TTL_MS);
      state.bonus = 1.0 + (result.bonus - 1.0) * decay;
      applyBonus(state.bonus, result.field, result.dist);
      renderStatus('⚠️ GPS потерян, кэш ' + Math.round((Date.now()-cached.ts)/60000) + ' мин назад');
    } else { state.bonus = 1.0; applyBonus(1.0, null, null); renderStatus(); }
  }

  function startWatching() {
    if (!navigator.geolocation) { state.error = 'Геолокация не поддерживается'; renderStatus(); return; }
    if (state.watchId !== null) return;
    state.watchId = navigator.geolocation.watchPosition(onPosition, onError, { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 });
  }

  function stopWatching() {
    if (state.watchId !== null) { navigator.geolocation.clearWatch(state.watchId); state.watchId = null; }
    state.bonus = 1.0; state.enabled = false; applyBonus(1.0, null, null); renderStatus();
  }

  // ── Применение бонуса ──────────────────────────────────────
  function applyBonus(bonus, field, dist) {
    if (window.rurcoinApp) { window.rurcoinApp.gpsBonus = bonus; window.rurcoinApp.gpsField = field ? field.name : null; }
    const el = document.getElementById('gpsBonusDisplay');
    if (!el) return;
    const totalBuff = getTotalBuff();
    const totalBonus = bonus + totalBuff + (window.rurcoinApp ? (window.rurcoinApp.platformBonus || 0) : 0);
    if (bonus > 1.0 && field) {
      el.innerHTML = field.icon + ' <b>×' + bonus.toFixed(2) + '</b> — ' + field.name
        + (dist !== null ? ' (' + dist + ' км)' : '')
        + (totalBuff > 0 ? ' <span style="color:#FFD700;">+' + Math.round(totalBuff*100) + '% баф</span>' : '')
        + '<br><small style="color:#888;">Итого к добыче: ×' + totalBonus.toFixed(2) + '</small>';
      el.style.color = '#00D4FF';
    } else {
      el.innerHTML = '📍 GPS-бонус не активен'
        + (totalBuff > 0 ? ' · <span style="color:#FFD700;">+' + Math.round(totalBuff*100) + '% баф</span>' : '');
      el.style.color = '#888';
    }
  }

  // ── Уведомления ────────────────────────────────────────────
  function notify(title, msg, type) {
    if (window.NotificationSystem) window.NotificationSystem.show(title, msg, type || 'info');
    else console.log('[GPS]', title, msg);
  }

  // ── Квесты ─────────────────────────────────────────────────
  function updateQuestProgress(questId, value) {
    const quest = QUESTS.find(q => q.id === questId);
    if (!quest) return;
    const prev = state.questProgress[questId] || 0;
    state.questProgress[questId] = value;
    if (prev < quest.target && value >= quest.target) addBuff(quest);
    renderQuests();
  }

  // ── Leaflet карта ──────────────────────────────────────────
  function loadLeaflet(cb) {
    if (window.L) { leafletReady = true; cb(); return; }
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css'; link.rel = 'stylesheet'; link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.onload = function() { leafletReady = true; cb(); };
    document.head.appendChild(script);
  }

  function initLeafletMap() {
    const container = document.getElementById('gpsMapContainer');
    if (!container || map) return;
    container.style.cssText = 'height:380px;border-radius:12px;overflow:hidden;border:1px solid #1a1a2e;';
    map = L.map('gpsMapContainer', { zoomControl: true, attributionControl: false }).setView([20, 0], 2);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 18, subdomains: 'abcd' }).addTo(map);

    // Все месторождения
    FIELDS.forEach(f => addFieldToMap(f));

    if (state.lat !== null) updateLeafletMap(state.lat, state.lon);
  }

  function addFieldToMap(f) {
    const now = Date.now();
    const color = f.type === 'oil' ? '#FF6B00' : '#00D4FF';
    const platform = state.platforms[f.id];
    const capture  = state.captures[f.id];
    const isMine   = capture && capture.owner === getPlayerId() && (now - capture.ts) < CAPTURE_TTL_MS;
    const hasPlatform = !!platform;
    const myPlatform  = hasPlatform && platform.owner === getPlayerId();

    // Зона бонуса
    fieldCircles[f.id] = L.circle([f.lat, f.lon], {
      radius: FIELD_RADIUS_KM * 1000, color, fillColor: color,
      fillOpacity: 0.05, weight: 1, dashArray: '4 4', opacity: 0.4
    }).addTo(map);

    // Зона захвата
    captureCircles[f.id] = L.circle([f.lat, f.lon], {
      radius: CAPTURE_RADIUS_KM * 1000,
      color: isMine ? '#FFD700' : hasPlatform ? '#9B59B6' : color,
      fillColor: isMine ? '#FFD700' : hasPlatform ? '#9B59B6' : color,
      fillOpacity: isMine ? 0.2 : hasPlatform ? 0.15 : 0.08, weight: 2
    }).addTo(map);

    // Иконка
    let badge = '';
    if (hasPlatform) badge = '<div style="position:absolute;top:-4px;right:-4px;font-size:10px;">🏗️</div>';
    if (isMine) badge = '<div style="position:absolute;top:-4px;right:-4px;font-size:10px;">🚩</div>';

    const icon = L.divIcon({
      html: '<div style="position:relative;font-size:' + (hasPlatform?'26px':'20px') + ';filter:drop-shadow(0 0 6px ' + color + ');">'
        + f.icon + badge + '</div>',
      className: '', iconSize: [30, 30], iconAnchor: [15, 15]
    });

    fieldMarkers[f.id] = L.marker([f.lat, f.lon], { icon })
      .addTo(map)
      .bindPopup(buildFieldPopup(f));
  }

  function updateFieldMarker(f) {
    if (!map) return;
    if (fieldMarkers[f.id]) { map.removeLayer(fieldMarkers[f.id]); delete fieldMarkers[f.id]; }
    if (fieldCircles[f.id]) { map.removeLayer(fieldCircles[f.id]); delete fieldCircles[f.id]; }
    if (captureCircles[f.id]) { map.removeLayer(captureCircles[f.id]); delete captureCircles[f.id]; }
    addFieldToMap(f);
  }

  function buildFieldPopup(f) {
    const now = Date.now();
    const platform = state.platforms[f.id];
    const capture  = state.captures[f.id];
    const isMine   = capture && capture.owner === getPlayerId() && (now - capture.ts) < CAPTURE_TTL_MS;
    const color = f.type === 'oil' ? '#FF6B00' : '#00D4FF';
    let html = '<div style="font-family:monospace;min-width:180px;">'
      + '<b>' + f.icon + ' ' + f.name + '</b><br>'
      + '<span style="color:#888;font-size:11px;">' + f.region + '</span><br>'
      + '<span style="color:' + color + ';">' + (f.type==='oil'?'🛢️ Нефть':'⛽ Газ') + '</span> · Бонус: <b>×' + f.bonus + '</b><br>';
    if (platform) {
      html += '🏗️ Платформа: <b>' + platform.ownerName + '</b> (ур.' + platform.level + ') · +' + Math.round(platform.bonusPct*100) + '%<br>';
    }
    if (isMine) html += '<span style="color:#FFD700;">🚩 Захвачено вами</span><br>';
    else if (capture && (now - capture.ts) < CAPTURE_TTL_MS) html += '<span style="color:#ff4444;">🔒 ' + capture.ownerName + '</span><br>';
    else html += '<span style="color:#555;">Свободно</span><br>';
    html += '</div>';
    return html;
  }

  function updateLeafletMap(lat, lon) {
    if (!map) return;
    const playerIcon = L.divIcon({
      html: '<div style="width:14px;height:14px;background:#fff;border:3px solid #FF6B00;border-radius:50%;box-shadow:0 0 12px #FF6B00;"></div>',
      className: '', iconSize: [14, 14], iconAnchor: [7, 7]
    });
    if (playerMarker) playerMarker.setLatLng([lat, lon]);
    else {
      playerMarker = L.marker([lat, lon], { icon: playerIcon, zIndexOffset: 1000 }).addTo(map)
        .bindPopup('<b>📍 Вы здесь</b><br>±' + state.accuracy + ' м');
      map.setView([lat, lon], 5);
    }
    // Обновляем попапы
    FIELDS.forEach(f => { if (fieldMarkers[f.id]) fieldMarkers[f.id].setPopupContent(buildFieldPopup(f)); });
  }

  // ── Рендер ─────────────────────────────────────────────────
  function renderStatus(override) {
    const el = document.getElementById('gpsStatus');
    if (!el) return;
    if (override) { el.innerHTML = override; el.style.color = '#FFD700'; return; }
    if (!state.enabled) { el.innerHTML = '📍 GPS отключён'; el.style.color = '#888'; return; }
    if (state.lat === null) { el.innerHTML = '🔄 Определяем позицию...'; el.style.color = '#FFD700'; return; }
    const t = state.lastUpdate ? state.lastUpdate.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit',second:'2-digit'}) : '—';
    el.innerHTML = '✅ GPS · ±' + state.accuracy + ' м · ' + t + (state.speed > 0 ? ' · ' + state.speed + ' км/ч' : '') + ' · ' + state.totalDistKm.toFixed(1) + ' км';
    el.style.color = '#00D4FF';
  }

  function renderBuffs() {
    const el = document.getElementById('gpsActiveBuffs');
    if (!el) return;
    const now = Date.now();
    const active = state.activeBuffs.filter(b => b.expiresAt > now);
    if (!active.length) { el.innerHTML = '<div style="color:#555;font-size:12px;">Нет активных бафов</div>'; return; }
    el.innerHTML = active.map(b => {
      const left = Math.round((b.expiresAt - now) / 60000);
      return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1a1a2e;">'
        + '<span style="font-size:18px;">⚡</span>'
        + '<div style="flex:1;"><div style="color:#FFD700;font-size:13px;">' + b.name + '</div>'
        + '<div style="color:#888;font-size:11px;">Осталось: ' + left + ' мин</div></div>'
        + '</div>';
    }).join('');
  }

  function renderQuests() {
    const el = document.getElementById('gpsQuestsList');
    if (!el) return;
    el.innerHTML = QUESTS.map(q => {
      const progress = state.questProgress[q.id] || 0;
      const done = progress >= q.target;
      const pct = Math.min(100, Math.round((progress / q.target) * 100));
      return '<div style="padding:10px 0;border-bottom:1px solid #1a1a2e;">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;">'
        + '<span style="font-weight:bold;color:' + (done?'#FFD700':'#fff') + ';font-size:13px;">' + q.name + '</span>'
        + '<span style="color:#9B59B6;font-size:12px;">⚡ ' + q.buffDesc + '</span>'
        + '</div>'
        + '<div style="font-size:11px;color:#888;margin:3px 0;">' + q.desc + '</div>'
        + '<div style="background:#1a1a2e;border-radius:4px;height:5px;margin-top:5px;">'
        + '<div style="background:' + (done?'#FFD700':'#FF6B00') + ';width:' + pct + '%;height:100%;border-radius:4px;transition:width 0.5s;"></div>'
        + '</div>'
        + '<div style="font-size:11px;color:#555;margin-top:2px;">' + progress + ' / ' + q.target + ' ' + q.unit + (done?' ✅':'') + '</div>'
        + '</div>';
    }).join('');
  }

  function renderCaptures() {
    const el = document.getElementById('gpsCapturesList');
    if (!el) return;
    const now = Date.now();
    const mine = Object.entries(state.captures).filter(([id,c]) => c.owner === getPlayerId() && (now-c.ts) < CAPTURE_TTL_MS);
    if (!mine.length) { el.innerHTML = '<div style="color:#888;text-align:center;padding:16px;">Нет захваченных месторождений</div>'; return; }
    el.innerHTML = mine.map(([id,c]) => {
      const f = FIELDS.find(f => f.id === id);
      const left = Math.max(0, Math.round((CAPTURE_TTL_MS - (now-c.ts)) / 3600000));
      return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #1a1a2e;">'
        + '<span style="font-size:20px;">' + (f?f.icon:'🚩') + '</span>'
        + '<div style="flex:1;"><div style="font-weight:bold;color:#FFD700;">' + (f?f.name:id) + '</div>'
        + '<div style="font-size:12px;color:#888;">' + (f?f.region:'') + ' · Осталось: ' + left + ' ч · +15%</div></div>'
        + '</div>';
    }).join('');
  }

  function renderPlatformsList() {
    const el = document.getElementById('gpsPlatformsList');
    if (!el) return;
    const mine = Object.entries(state.platforms).filter(([id,p]) => p.owner === getPlayerId());
    if (!mine.length) { el.innerHTML = '<div style="color:#888;text-align:center;padding:16px;">Нет построенных платформ</div>'; return; }
    el.innerHTML = mine.map(([id,p]) => {
      const f = FIELDS.find(f => f.id === id);
      return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #1a1a2e;">'
        + '<span style="font-size:20px;">🏗️</span>'
        + '<div style="flex:1;"><div style="font-weight:bold;color:#9B59B6;">' + (f?f.name:id) + '</div>'
        + '<div style="font-size:12px;color:#888;">' + (f?f.region:'') + ' · Ур.' + p.level + ' · +' + Math.round(p.bonusPct*100) + '% к добыче</div></div>'
        + (p.level < 5 ? '<button onclick="GPS.upgradePlatform(\'' + id + '\')" style="padding:4px 10px;background:#9B59B622;border:1px solid #9B59B6;border-radius:6px;color:#9B59B6;font-size:11px;cursor:pointer;">⬆️</button>' : '<span style="color:#FFD700;font-size:11px;">MAX</span>')
        + '</div>';
    }).join('');
  }

  // ── Инициализация вкладки ──────────────────────────────────
  function initTab() {
    loadWorldState();
    loadBuffs();
    loadLeaflet(function() {
      initLeafletMap();
      setTimeout(function() { if (map) map.invalidateSize(); }, 300);
    });
    renderStatus(); renderQuests(); renderCaptures(); renderPlatformsList(); renderBuffs();
    applyPlatformBonuses(); applyBuffsToGame();

    const toggleBtn = document.getElementById('gpsToggleBtn');
    if (toggleBtn) {
      toggleBtn.textContent = state.enabled ? '⏹ Отключить GPS' : '▶ Включить GPS';
      toggleBtn.onclick = function() {
        state.enabled ? disable() : enable();
        toggleBtn.textContent = state.enabled ? '⏹ Отключить GPS' : '▶ Включить GPS';
      };
    }
    const scanBtn = document.getElementById('gpsScanBtn');
    if (scanBtn) scanBtn.onclick = runScan;

    window.addEventListener('resize', function() { if (map) map.invalidateSize(); });
    // Обновляем мировой стейт каждые 30 сек
    setInterval(function() { loadWorldState(); FIELDS.forEach(f => { if (map) updateFieldMarker(f); }); }, 30000);
    // Обновляем бафы каждую минуту
    setInterval(function() { applyBuffsToGame(); renderBuffs(); }, 60000);
  }

  // ── Публичный API ──────────────────────────────────────────
  function enable()   { state.enabled = true; startWatching(); renderStatus(); }
  function disable()  { stopWatching(); }
  function toggle()   { state.enabled ? disable() : enable(); }
  function getBonus() { return state.bonus + getTotalBuff() + (window.rurcoinApp ? (window.rurcoinApp.platformBonus||0) : 0); }
  function getState() { return Object.assign({}, state); }

  document.addEventListener('DOMContentLoaded', function() {
    loadWorldState(); loadBuffs();
    document.addEventListener('click', function(e) {
      if (e.target && e.target.dataset && e.target.dataset.tab === 'gps') setTimeout(initTab, 150);
    });
  });

  return { enable, disable, toggle, getBonus, getState, initTab, runScan, captureField, buildPlatform, upgradePlatform };
})();

window.GPS = GPS;
