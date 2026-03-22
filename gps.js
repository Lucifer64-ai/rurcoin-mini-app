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
  const PLATFORM_EXCL_KM   = 150;   // радиус эксклюзивности платформы (км)
  const FIELD_RESERVE_INIT = 1000;  // начальный запас месторождения
  const FIELD_DRAIN_PER_SEC = 0.5;  // расход запаса в сек при активной платформе
  const FIELD_REGEN_PER_SEC  = 0.05;  // восстановление без платформы
  const PLATFORM_HP_MAX      = 100;   // максимальное HP платформы
  const PLATFORM_HP_DRAIN    = 0.005; // потеря HP/сек (~5.5 часов до 0)
  const PLATFORM_REPAIR_COST = 50;   // стоимость ремонта (RURC)
  const PLATFORM_HP_WARN     = 30;   // % HP — порог предупреждения
  const CAPTURE_TTL_MS     = 86400000; // 24ч — захват
  const CACHE_TTL_MS       = 300000;
  const MAX_SPEED_KMH      = 300;
  const LEAFLET_CSS        = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  const LEAFLET_JS         = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  const SHARED_KEY         = 'rurc_world_state';
  const FOG_KEY            = 'rurc_fog_state';
  const SCAN_COST_RURC = 30;
  const RADAR_LEVELS = [
    { level: 1, radius:  50, tonCost: 0,   label: 'Базовый',     color: '#00D4FF' },
    { level: 2, radius: 100, tonCost: 0.5, label: 'Улучшенный',  color: '#2ECC71' },
    { level: 3, radius: 200, tonCost: 1.5, label: 'Продвинутый', color: '#FFD700' },
    { level: 4, radius: 350, tonCost: 3.0, label: 'Экспертный',  color: '#FF6B00' },
    { level: 5, radius: 500, tonCost: 7.0, label: 'Легендарный', color: '#FF00FF' },
,

  // ── Городские месторождения ──────────────────────────────────────
    { id: 'urban_москва_1', name: 'Москва-У1 (нефть)', lat: 55.7115, lon: 37.6424, type: 'oil', bonus: 1.9, icon: '🛢️', region: 'Москва (город)', reserve: 564.4, area: 237.4, depth: 2148 },
    { id: 'urban_москва_2', name: 'Москва-У2 (газ)', lat: 55.8171, lon: 37.7013, type: 'gas', bonus: 1.5, icon: '⛽', region: 'Москва (город)', reserve: 175.2, area: 669.2, depth: 4272 },
    { id: 'urban_москва_3', name: 'Москва-У3 (газ)', lat: 55.8406, lon: 37.6969, type: 'gas', bonus: 3.5, icon: '⛽', region: 'Москва (город)', reserve: 239.2, area: 268.5, depth: 1160 },
    { id: 'urban_москва_4', name: 'Москва-У4 (газ)', lat: 55.8039, lon: 37.7575, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Москва (город)', reserve: 143.1, area: 62.1, depth: 1839 },
    { id: 'urban_санктпетербург_1', name: 'Санкт-Петербург-У1 (газ)', lat: 59.855, lon: 30.2806, type: 'gas', bonus: 2.9, icon: '⛽', region: 'Санкт-Петербург (город)', reserve: 55.0, area: 672.4, depth: 1937 },
    { id: 'urban_санктпетербург_2', name: 'Санкт-Петербург-У2 (нефть)', lat: 59.8547, lon: 30.3282, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Санкт-Петербург (город)', reserve: 498.1, area: 733.9, depth: 1072 },
    { id: 'urban_санктпетербург_3', name: 'Санкт-Петербург-У3 (газ)', lat: 59.9954, lon: 30.3182, type: 'gas', bonus: 3.5, icon: '⛽', region: 'Санкт-Петербург (город)', reserve: 217.3, area: 426.1, depth: 3510 },
    { id: 'urban_санктпетербург_4', name: 'Санкт-Петербург-У4 (газ)', lat: 59.8468, lon: 30.3363, type: 'gas', bonus: 2.0, icon: '⛽', region: 'Санкт-Петербург (город)', reserve: 347.9, area: 325.1, depth: 1333 },
    { id: 'urban_новосибирск_1', name: 'Новосибирск-У1 (нефть)', lat: 54.9607, lon: 82.9264, type: 'oil', bonus: 1.6, icon: '🛢️', region: 'Новосибирск (город)', reserve: 383.2, area: 597.9, depth: 3745 },
    { id: 'urban_новосибирск_2', name: 'Новосибирск-У2 (газ)', lat: 55.0293, lon: 82.9985, type: 'gas', bonus: 2.9, icon: '⛽', region: 'Новосибирск (город)', reserve: 43.0, area: 379.9, depth: 979 },
    { id: 'urban_новосибирск_3', name: 'Новосибирск-У3 (нефть)', lat: 55.0172, lon: 82.9583, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Новосибирск (город)', reserve: 550.0, area: 739.3, depth: 3603 },
    { id: 'urban_екатеринбург_1', name: 'Екатеринбург-У1 (нефть)', lat: 56.8347, lon: 60.5907, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Екатеринбург (город)', reserve: 498.9, area: 724.4, depth: 267 },
    { id: 'urban_екатеринбург_2', name: 'Екатеринбург-У2 (нефть)', lat: 56.8767, lon: 60.6101, type: 'oil', bonus: 1.7, icon: '🛢️', region: 'Екатеринбург (город)', reserve: 240.3, area: 383.3, depth: 1311 },
    { id: 'urban_екатеринбург_3', name: 'Екатеринбург-У3 (нефть)', lat: 56.8551, lon: 60.6077, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Екатеринбург (город)', reserve: 98.0, area: 45.2, depth: 2111 },
    { id: 'urban_казань_1', name: 'Казань-У1 (газ)', lat: 55.7983, lon: 49.0349, type: 'gas', bonus: 2.9, icon: '⛽', region: 'Казань (город)', reserve: 364.7, area: 394.2, depth: 2393 },
    { id: 'urban_казань_2', name: 'Казань-У2 (нефть)', lat: 55.8065, lon: 49.0061, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Казань (город)', reserve: 184.1, area: 224.6, depth: 3917 },
    { id: 'urban_казань_3', name: 'Казань-У3 (нефть)', lat: 55.826, lon: 49.0738, type: 'oil', bonus: 1.6, icon: '🛢️', region: 'Казань (город)', reserve: 21.1, area: 117.4, depth: 936 },
    { id: 'urban_нижний_новгород_1', name: 'Нижний Новгород-У1 (нефть)', lat: 56.2882, lon: 43.9265, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Нижний Новгород (город)', reserve: 469.6, area: 136.5, depth: 3348 },
    { id: 'urban_нижний_новгород_2', name: 'Нижний Новгород-У2 (газ)', lat: 56.3365, lon: 43.9205, type: 'gas', bonus: 2.9, icon: '⛽', region: 'Нижний Новгород (город)', reserve: 463.3, area: 159.2, depth: 3707 },
    { id: 'urban_нижний_новгород_3', name: 'Нижний Новгород-У3 (нефть)', lat: 56.2825, lon: 43.9533, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Нижний Новгород (город)', reserve: 200.8, area: 731.5, depth: 2502 },
    { id: 'urban_челябинск_1', name: 'Челябинск-У1 (газ)', lat: 55.1577, lon: 61.4987, type: 'gas', bonus: 2.5, icon: '⛽', region: 'Челябинск (город)', reserve: 452.1, area: 626.0, depth: 4496 },
    { id: 'urban_челябинск_2', name: 'Челябинск-У2 (нефть)', lat: 55.1811, lon: 61.3996, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Челябинск (город)', reserve: 450.5, area: 451.7, depth: 2732 },
    { id: 'urban_челябинск_3', name: 'Челябинск-У3 (нефть)', lat: 55.1569, lon: 61.4626, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Челябинск (город)', reserve: 222.1, area: 626.3, depth: 601 },
    { id: 'urban_самара_1', name: 'Самара-У1 (газ)', lat: 53.2315, lon: 50.1627, type: 'gas', bonus: 2.6, icon: '⛽', region: 'Самара (город)', reserve: 409.5, area: 50.3, depth: 381 },
    { id: 'urban_самара_2', name: 'Самара-У2 (нефть)', lat: 53.171, lon: 50.1881, type: 'oil', bonus: 2.8, icon: '🛢️', region: 'Самара (город)', reserve: 495.7, area: 220.4, depth: 1518 },
    { id: 'urban_уфа_1', name: 'Уфа-У1 (газ)', lat: 54.7256, lon: 55.9561, type: 'gas', bonus: 2.5, icon: '⛽', region: 'Уфа (город)', reserve: 378.1, area: 764.3, depth: 909 },
    { id: 'urban_уфа_2', name: 'Уфа-У2 (нефть)', lat: 54.7288, lon: 55.9906, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Уфа (город)', reserve: 375.9, area: 679.8, depth: 586 },
    { id: 'urban_ростовнадону_1', name: 'Ростов-на-Дону-У1 (нефть)', lat: 47.2459, lon: 39.6553, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Ростов-на-Дону (город)', reserve: 588.9, area: 681.1, depth: 828 },
    { id: 'urban_ростовнадону_2', name: 'Ростов-на-Дону-У2 (нефть)', lat: 47.2392, lon: 39.6906, type: 'oil', bonus: 3.1, icon: '🛢️', region: 'Ростов-на-Дону (город)', reserve: 32.6, area: 629.0, depth: 2343 },
    { id: 'urban_тюмень_1', name: 'Тюмень-У1 (газ)', lat: 57.1259, lon: 68.022, type: 'gas', bonus: 3.3, icon: '⛽', region: 'Тюмень (город)', reserve: 112.9, area: 713.8, depth: 919 },
    { id: 'urban_тюмень_2', name: 'Тюмень-У2 (газ)', lat: 57.16, lon: 68.0309, type: 'gas', bonus: 2.3, icon: '⛽', region: 'Тюмень (город)', reserve: 431.7, area: 146.8, depth: 4145 },
    { id: 'urban_сургут_1', name: 'Сургут-У1 (газ)', lat: 61.2636, lon: 73.4251, type: 'gas', bonus: 2.1, icon: '⛽', region: 'Сургут (город)', reserve: 286.6, area: 156.0, depth: 3773 },
    { id: 'urban_когалым_1', name: 'Когалым-У1 (газ)', lat: 62.2641, lon: 74.4973, type: 'gas', bonus: 3.2, icon: '⛽', region: 'Когалым (город)', reserve: 472.4, area: 324.5, depth: 989 },
    { id: 'urban_нефтеюганск_1', name: 'Нефтеюганск-У1 (газ)', lat: 61.1098, lon: 72.605, type: 'gas', bonus: 2.1, icon: '⛽', region: 'Нефтеюганск (город)', reserve: 404.5, area: 275.0, depth: 3716 },
    { id: 'urban_хантымансийск_1', name: 'Ханты-Мансийск-У1 (газ)', lat: 61.0122, lon: 69.0106, type: 'gas', bonus: 1.9, icon: '⛽', region: 'Ханты-Мансийск (город)', reserve: 219.2, area: 184.5, depth: 1495 },
    { id: 'urban_лондон_1', name: 'Лондон-У1 (нефть)', lat: 51.5308, lon: -0.1533, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Лондон (город)', reserve: 273.7, area: 245.5, depth: 2160 },
    { id: 'urban_лондон_2', name: 'Лондон-У2 (газ)', lat: 51.4857, lon: -0.1401, type: 'gas', bonus: 2.9, icon: '⛽', region: 'Лондон (город)', reserve: 174.6, area: 142.6, depth: 275 },
    { id: 'urban_лондон_3', name: 'Лондон-У3 (нефть)', lat: 51.4684, lon: -0.0295, type: 'oil', bonus: 2.5, icon: '🛢️', region: 'Лондон (город)', reserve: 373.9, area: 554.5, depth: 1037 },
    { id: 'urban_лондон_4', name: 'Лондон-У4 (газ)', lat: 51.4197, lon: -0.1867, type: 'gas', bonus: 2.2, icon: '⛽', region: 'Лондон (город)', reserve: 299.2, area: 309.2, depth: 1588 },
    { id: 'urban_париж_1', name: 'Париж-У1 (нефть)', lat: 48.9099, lon: 2.2592, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Париж (город)', reserve: 164.1, area: 774.0, depth: 2699 },
    { id: 'urban_париж_2', name: 'Париж-У2 (нефть)', lat: 48.8414, lon: 2.4188, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Париж (город)', reserve: 22.1, area: 65.8, depth: 2908 },
    { id: 'urban_париж_3', name: 'Париж-У3 (нефть)', lat: 48.8338, lon: 2.4041, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Париж (город)', reserve: 517.4, area: 283.4, depth: 1397 },
    { id: 'urban_париж_4', name: 'Париж-У4 (нефть)', lat: 48.9037, lon: 2.4255, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Париж (город)', reserve: 300.8, area: 238.8, depth: 3126 },
    { id: 'urban_берлин_1', name: 'Берлин-У1 (газ)', lat: 52.4934, lon: 13.5332, type: 'gas', bonus: 2.0, icon: '⛽', region: 'Берлин (город)', reserve: 475.6, area: 142.5, depth: 3693 },
    { id: 'urban_берлин_2', name: 'Берлин-У2 (нефть)', lat: 52.4735, lon: 13.3787, type: 'oil', bonus: 2.5, icon: '🛢️', region: 'Берлин (город)', reserve: 264.7, area: 164.3, depth: 491 },
    { id: 'urban_берлин_3', name: 'Берлин-У3 (нефть)', lat: 52.4876, lon: 13.5365, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Берлин (город)', reserve: 260.4, area: 22.3, depth: 445 },
    { id: 'urban_берлин_4', name: 'Берлин-У4 (нефть)', lat: 52.5342, lon: 13.4662, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Берлин (город)', reserve: 327.3, area: 697.5, depth: 4375 },
    { id: 'urban_мадрид_1', name: 'Мадрид-У1 (газ)', lat: 40.4355, lon: -3.7248, type: 'gas', bonus: 1.6, icon: '⛽', region: 'Мадрид (город)', reserve: 401.3, area: 463.2, depth: 1550 },
    { id: 'urban_мадрид_2', name: 'Мадрид-У2 (нефть)', lat: 40.4591, lon: -3.6772, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Мадрид (город)', reserve: 569.4, area: 46.8, depth: 908 },
    { id: 'urban_мадрид_3', name: 'Мадрид-У3 (нефть)', lat: 40.4122, lon: -3.7477, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Мадрид (город)', reserve: 292.8, area: 199.9, depth: 4128 },
    { id: 'urban_мадрид_4', name: 'Мадрид-У4 (нефть)', lat: 40.4279, lon: -3.7473, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Мадрид (город)', reserve: 66.7, area: 138.6, depth: 4270 },
    { id: 'urban_рим_1', name: 'Рим-У1 (газ)', lat: 41.966, lon: 12.5052, type: 'gas', bonus: 3.4, icon: '⛽', region: 'Рим (город)', reserve: 449.7, area: 267.2, depth: 4104 },
    { id: 'urban_рим_2', name: 'Рим-У2 (нефть)', lat: 41.9254, lon: 12.4694, type: 'oil', bonus: 1.6, icon: '🛢️', region: 'Рим (город)', reserve: 581.0, area: 447.8, depth: 405 },
    { id: 'urban_рим_3', name: 'Рим-У3 (нефть)', lat: 41.9098, lon: 12.4784, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Рим (город)', reserve: 408.3, area: 343.7, depth: 4188 },
    { id: 'urban_рим_4', name: 'Рим-У4 (нефть)', lat: 41.8777, lon: 12.4889, type: 'oil', bonus: 2.0, icon: '🛢️', region: 'Рим (город)', reserve: 460.9, area: 97.8, depth: 2932 },
    { id: 'urban_варшава_1', name: 'Варшава-У1 (нефть)', lat: 52.2324, lon: 20.9497, type: 'oil', bonus: 3.4, icon: '🛢️', region: 'Варшава (город)', reserve: 295.4, area: 330.3, depth: 1734 },
    { id: 'urban_варшава_2', name: 'Варшава-У2 (нефть)', lat: 52.2314, lon: 21.0269, type: 'oil', bonus: 1.5, icon: '🛢️', region: 'Варшава (город)', reserve: 225.6, area: 644.8, depth: 2286 },
    { id: 'urban_варшава_3', name: 'Варшава-У3 (нефть)', lat: 52.2169, lon: 20.9595, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Варшава (город)', reserve: 542.5, area: 438.4, depth: 4038 },
    { id: 'urban_вена_1', name: 'Вена-У1 (нефть)', lat: 48.2213, lon: 16.4574, type: 'oil', bonus: 3.4, icon: '🛢️', region: 'Вена (город)', reserve: 118.2, area: 610.9, depth: 2406 },
    { id: 'urban_вена_2', name: 'Вена-У2 (нефть)', lat: 48.1511, lon: 16.3768, type: 'oil', bonus: 3.4, icon: '🛢️', region: 'Вена (город)', reserve: 227.3, area: 671.1, depth: 2309 },
    { id: 'urban_вена_3', name: 'Вена-У3 (нефть)', lat: 48.2104, lon: 16.408, type: 'oil', bonus: 1.9, icon: '🛢️', region: 'Вена (город)', reserve: 159.6, area: 275.3, depth: 254 },
    { id: 'urban_амстердам_1', name: 'Амстердам-У1 (нефть)', lat: 52.3508, lon: 4.8288, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Амстердам (город)', reserve: 120.0, area: 646.2, depth: 465 },
    { id: 'urban_амстердам_2', name: 'Амстердам-У2 (газ)', lat: 52.3602, lon: 4.9076, type: 'gas', bonus: 2.9, icon: '⛽', region: 'Амстердам (город)', reserve: 389.1, area: 172.9, depth: 3442 },
    { id: 'urban_амстердам_3', name: 'Амстердам-У3 (нефть)', lat: 52.4038, lon: 4.9602, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Амстердам (город)', reserve: 552.3, area: 178.5, depth: 4010 },
    { id: 'urban_брюссель_1', name: 'Брюссель-У1 (газ)', lat: 50.8348, lon: 4.3876, type: 'gas', bonus: 2.3, icon: '⛽', region: 'Брюссель (город)', reserve: 85.5, area: 621.3, depth: 1159 },
    { id: 'urban_брюссель_2', name: 'Брюссель-У2 (нефть)', lat: 50.8498, lon: 4.3414, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Брюссель (город)', reserve: 275.1, area: 499.7, depth: 2166 },
    { id: 'urban_брюссель_3', name: 'Брюссель-У3 (нефть)', lat: 50.8259, lon: 4.3341, type: 'oil', bonus: 3.1, icon: '🛢️', region: 'Брюссель (город)', reserve: 428.7, area: 484.7, depth: 4476 },
    { id: 'urban_прага_1', name: 'Прага-У1 (нефть)', lat: 50.1151, lon: 14.4472, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Прага (город)', reserve: 244.5, area: 24.8, depth: 1912 },
    { id: 'urban_прага_2', name: 'Прага-У2 (нефть)', lat: 50.0792, lon: 14.4621, type: 'oil', bonus: 1.7, icon: '🛢️', region: 'Прага (город)', reserve: 334.2, area: 421.5, depth: 3133 },
    { id: 'urban_прага_3', name: 'Прага-У3 (газ)', lat: 50.0571, lon: 14.4005, type: 'gas', bonus: 3.0, icon: '⛽', region: 'Прага (город)', reserve: 100.4, area: 765.6, depth: 3911 },
    { id: 'urban_будапест_1', name: 'Будапест-У1 (газ)', lat: 47.4517, lon: 19.0169, type: 'gas', bonus: 1.6, icon: '⛽', region: 'Будапест (город)', reserve: 10.6, area: 622.6, depth: 2396 },
    { id: 'urban_будапест_2', name: 'Будапест-У2 (газ)', lat: 47.5061, lon: 19.0249, type: 'gas', bonus: 2.0, icon: '⛽', region: 'Будапест (город)', reserve: 541.4, area: 659.7, depth: 3553 },
    { id: 'urban_будапест_3', name: 'Будапест-У3 (нефть)', lat: 47.4775, lon: 19.0629, type: 'oil', bonus: 2.2, icon: '🛢️', region: 'Будапест (город)', reserve: 425.2, area: 544.5, depth: 1184 },
    { id: 'urban_бухарест_1', name: 'Бухарест-У1 (газ)', lat: 44.4357, lon: 26.104, type: 'gas', bonus: 3.1, icon: '⛽', region: 'Бухарест (город)', reserve: 595.6, area: 657.1, depth: 972 },
    { id: 'urban_бухарест_2', name: 'Бухарест-У2 (нефть)', lat: 44.4368, lon: 26.0675, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Бухарест (город)', reserve: 552.1, area: 230.6, depth: 2795 },
    { id: 'urban_бухарест_3', name: 'Бухарест-У3 (нефть)', lat: 44.4129, lon: 26.1227, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Бухарест (город)', reserve: 396.4, area: 289.8, depth: 1861 },
    { id: 'urban_стокгольм_1', name: 'Стокгольм-У1 (нефть)', lat: 59.3131, lon: 18.1424, type: 'oil', bonus: 2.5, icon: '🛢️', region: 'Стокгольм (город)', reserve: 290.8, area: 554.3, depth: 3010 },
    { id: 'urban_стокгольм_2', name: 'Стокгольм-У2 (газ)', lat: 59.2863, lon: 18.1442, type: 'gas', bonus: 1.6, icon: '⛽', region: 'Стокгольм (город)', reserve: 448.0, area: 610.3, depth: 3291 },
    { id: 'urban_стокгольм_3', name: 'Стокгольм-У3 (газ)', lat: 59.3121, lon: 18.0886, type: 'gas', bonus: 3.2, icon: '⛽', region: 'Стокгольм (город)', reserve: 426.6, area: 466.7, depth: 307 },
    { id: 'urban_осло_1', name: 'Осло-У1 (нефть)', lat: 59.9461, lon: 10.6731, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Осло (город)', reserve: 399.8, area: 751.9, depth: 3263 },
    { id: 'urban_осло_2', name: 'Осло-У2 (нефть)', lat: 59.8993, lon: 10.723, type: 'oil', bonus: 3.5, icon: '🛢️', region: 'Осло (город)', reserve: 323.5, area: 697.8, depth: 3334 },
    { id: 'urban_осло_3', name: 'Осло-У3 (нефть)', lat: 59.9128, lon: 10.7127, type: 'oil', bonus: 2.0, icon: '🛢️', region: 'Осло (город)', reserve: 228.2, area: 547.0, depth: 4416 },
    { id: 'urban_хельсинки_1', name: 'Хельсинки-У1 (газ)', lat: 60.2048, lon: 24.8925, type: 'gas', bonus: 2.7, icon: '⛽', region: 'Хельсинки (город)', reserve: 258.2, area: 549.4, depth: 3667 },
    { id: 'urban_хельсинки_2', name: 'Хельсинки-У2 (нефть)', lat: 60.1725, lon: 24.926, type: 'oil', bonus: 3.4, icon: '🛢️', region: 'Хельсинки (город)', reserve: 64.9, area: 381.3, depth: 1857 },
    { id: 'urban_хельсинки_3', name: 'Хельсинки-У3 (нефть)', lat: 60.1863, lon: 24.9181, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Хельсинки (город)', reserve: 114.9, area: 777.3, depth: 3227 },
    { id: 'urban_копенгаген_1', name: 'Копенгаген-У1 (нефть)', lat: 55.7148, lon: 12.5162, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Копенгаген (город)', reserve: 88.6, area: 307.3, depth: 3502 },
    { id: 'urban_копенгаген_2', name: 'Копенгаген-У2 (газ)', lat: 55.7165, lon: 12.598, type: 'gas', bonus: 1.7, icon: '⛽', region: 'Копенгаген (город)', reserve: 461.0, area: 740.8, depth: 3661 },
    { id: 'urban_копенгаген_3', name: 'Копенгаген-У3 (нефть)', lat: 55.7076, lon: 12.6175, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Копенгаген (город)', reserve: 514.4, area: 107.9, depth: 3487 },
    { id: 'urban_лиссабон_1', name: 'Лиссабон-У1 (нефть)', lat: 38.7317, lon: -9.1266, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Лиссабон (город)', reserve: 124.8, area: 619.5, depth: 3386 },
    { id: 'urban_лиссабон_2', name: 'Лиссабон-У2 (газ)', lat: 38.7234, lon: -9.1282, type: 'gas', bonus: 2.7, icon: '⛽', region: 'Лиссабон (город)', reserve: 417.3, area: 698.7, depth: 4439 },
    { id: 'urban_лиссабон_3', name: 'Лиссабон-У3 (нефть)', lat: 38.7074, lon: -9.108, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Лиссабон (город)', reserve: 104.5, area: 222.5, depth: 681 },
    { id: 'urban_афины_1', name: 'Афины-У1 (нефть)', lat: 38.0058, lon: 23.7668, type: 'oil', bonus: 2.5, icon: '🛢️', region: 'Афины (город)', reserve: 579.5, area: 295.3, depth: 966 },
    { id: 'urban_афины_2', name: 'Афины-У2 (газ)', lat: 37.9279, lon: 23.7132, type: 'gas', bonus: 2.7, icon: '⛽', region: 'Афины (город)', reserve: 91.6, area: 92.9, depth: 3090 },
    { id: 'urban_афины_3', name: 'Афины-У3 (нефть)', lat: 37.9723, lon: 23.7051, type: 'oil', bonus: 3.4, icon: '🛢️', region: 'Афины (город)', reserve: 197.8, area: 561.2, depth: 3921 },
    { id: 'urban_киев_1', name: 'Киев-У1 (нефть)', lat: 50.4499, lon: 30.6286, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Киев (город)', reserve: 36.5, area: 89.0, depth: 413 },
    { id: 'urban_киев_2', name: 'Киев-У2 (газ)', lat: 50.4801, lon: 30.5015, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Киев (город)', reserve: 347.5, area: 196.1, depth: 3805 },
    { id: 'urban_киев_3', name: 'Киев-У3 (газ)', lat: 50.4484, lon: 30.4805, type: 'gas', bonus: 3.3, icon: '⛽', region: 'Киев (город)', reserve: 449.7, area: 125.4, depth: 1711 },
    { id: 'urban_минск_1', name: 'Минск-У1 (газ)', lat: 53.8925, lon: 27.6212, type: 'gas', bonus: 2.8, icon: '⛽', region: 'Минск (город)', reserve: 344.7, area: 768.5, depth: 3063 },
    { id: 'urban_минск_2', name: 'Минск-У2 (газ)', lat: 53.9281, lon: 27.5748, type: 'gas', bonus: 2.1, icon: '⛽', region: 'Минск (город)', reserve: 260.2, area: 309.5, depth: 3215 },
    { id: 'urban_минск_3', name: 'Минск-У3 (газ)', lat: 53.902, lon: 27.5827, type: 'gas', bonus: 2.6, icon: '⛽', region: 'Минск (город)', reserve: 146.8, area: 616.5, depth: 481 },
    { id: 'urban_баку_1', name: 'Баку-У1 (нефть)', lat: 40.4, lon: 49.8961, type: 'oil', bonus: 3.1, icon: '🛢️', region: 'Баку (город)', reserve: 204.7, area: 300.1, depth: 656 },
    { id: 'urban_баку_2', name: 'Баку-У2 (нефть)', lat: 40.421, lon: 49.9206, type: 'oil', bonus: 1.6, icon: '🛢️', region: 'Баку (город)', reserve: 333.5, area: 286.7, depth: 646 },
    { id: 'urban_тбилиси_1', name: 'Тбилиси-У1 (нефть)', lat: 41.6865, lon: 44.8106, type: 'oil', bonus: 2.8, icon: '🛢️', region: 'Тбилиси (город)', reserve: 573.2, area: 795.5, depth: 1593 },
    { id: 'urban_тбилиси_2', name: 'Тбилиси-У2 (нефть)', lat: 41.7114, lon: 44.8324, type: 'oil', bonus: 3.3, icon: '🛢️', region: 'Тбилиси (город)', reserve: 292.5, area: 521.7, depth: 1418 },
    { id: 'urban_ереван_1', name: 'Ереван-У1 (нефть)', lat: 40.1573, lon: 44.4961, type: 'oil', bonus: 2.5, icon: '🛢️', region: 'Ереван (город)', reserve: 400.1, area: 729.4, depth: 4158 },
    { id: 'urban_ереван_2', name: 'Ереван-У2 (нефть)', lat: 40.2, lon: 44.5555, type: 'oil', bonus: 3.3, icon: '🛢️', region: 'Ереван (город)', reserve: 555.3, area: 434.4, depth: 3175 },
    { id: 'urban_токио_1', name: 'Токио-У1 (нефть)', lat: 35.7334, lon: 139.7141, type: 'oil', bonus: 3.5, icon: '🛢️', region: 'Токио (город)', reserve: 270.2, area: 537.5, depth: 4498 },
    { id: 'urban_токио_2', name: 'Токио-У2 (нефть)', lat: 35.6637, lon: 139.6009, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Токио (город)', reserve: 543.9, area: 519.6, depth: 4077 },
    { id: 'urban_токио_3', name: 'Токио-У3 (нефть)', lat: 35.7261, lon: 139.6199, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Токио (город)', reserve: 348.9, area: 257.2, depth: 388 },
    { id: 'urban_токио_4', name: 'Токио-У4 (газ)', lat: 35.7352, lon: 139.7537, type: 'gas', bonus: 2.3, icon: '⛽', region: 'Токио (город)', reserve: 360.7, area: 744.8, depth: 4492 },
    { id: 'urban_пекин_1', name: 'Пекин-У1 (нефть)', lat: 39.854, lon: 116.336, type: 'oil', bonus: 1.9, icon: '🛢️', region: 'Пекин (город)', reserve: 514.9, area: 20.3, depth: 2932 },
    { id: 'urban_пекин_2', name: 'Пекин-У2 (нефть)', lat: 40.0238, lon: 116.4268, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Пекин (город)', reserve: 106.9, area: 295.3, depth: 1406 },
    { id: 'urban_пекин_3', name: 'Пекин-У3 (нефть)', lat: 39.925, lon: 116.3189, type: 'oil', bonus: 1.5, icon: '🛢️', region: 'Пекин (город)', reserve: 587.8, area: 272.5, depth: 4092 },
    { id: 'urban_пекин_4', name: 'Пекин-У4 (нефть)', lat: 39.8661, lon: 116.5364, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Пекин (город)', reserve: 310.4, area: 191.6, depth: 3701 },
    { id: 'urban_шанхай_1', name: 'Шанхай-У1 (нефть)', lat: 31.2106, lon: 121.4873, type: 'oil', bonus: 3.1, icon: '🛢️', region: 'Шанхай (город)', reserve: 417.3, area: 633.0, depth: 4359 },
    { id: 'urban_шанхай_2', name: 'Шанхай-У2 (нефть)', lat: 31.2395, lon: 121.4518, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Шанхай (город)', reserve: 597.0, area: 367.0, depth: 844 },
    { id: 'urban_шанхай_3', name: 'Шанхай-У3 (нефть)', lat: 31.2433, lon: 121.4474, type: 'oil', bonus: 1.9, icon: '🛢️', region: 'Шанхай (город)', reserve: 368.0, area: 224.8, depth: 3053 },
    { id: 'urban_шанхай_4', name: 'Шанхай-У4 (нефть)', lat: 31.3231, lon: 121.5856, type: 'oil', bonus: 3.4, icon: '🛢️', region: 'Шанхай (город)', reserve: 93.6, area: 754.0, depth: 2826 },
    { id: 'urban_сеул_1', name: 'Сеул-У1 (нефть)', lat: 37.5506, lon: 127.033, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Сеул (город)', reserve: 415.1, area: 395.2, depth: 2359 },
    { id: 'urban_сеул_2', name: 'Сеул-У2 (газ)', lat: 37.5525, lon: 126.9994, type: 'gas', bonus: 3.1, icon: '⛽', region: 'Сеул (город)', reserve: 184.1, area: 408.1, depth: 4308 },
    { id: 'urban_сеул_3', name: 'Сеул-У3 (нефть)', lat: 37.4689, lon: 126.9154, type: 'oil', bonus: 3.4, icon: '🛢️', region: 'Сеул (город)', reserve: 560.4, area: 16.6, depth: 1215 },
    { id: 'urban_сеул_4', name: 'Сеул-У4 (газ)', lat: 37.5855, lon: 126.9845, type: 'gas', bonus: 3.0, icon: '⛽', region: 'Сеул (город)', reserve: 462.4, area: 343.3, depth: 2600 },
    { id: 'urban_мумбаи_1', name: 'Мумбаи-У1 (нефть)', lat: 19.0932, lon: 72.8248, type: 'oil', bonus: 3.3, icon: '🛢️', region: 'Мумбаи (город)', reserve: 208.6, area: 613.2, depth: 2555 },
    { id: 'urban_мумбаи_2', name: 'Мумбаи-У2 (нефть)', lat: 19.1044, lon: 72.9014, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Мумбаи (город)', reserve: 378.1, area: 95.9, depth: 3070 },
    { id: 'urban_мумбаи_3', name: 'Мумбаи-У3 (нефть)', lat: 19.1261, lon: 72.8088, type: 'oil', bonus: 1.9, icon: '🛢️', region: 'Мумбаи (город)', reserve: 249.8, area: 565.3, depth: 2624 },
    { id: 'urban_мумбаи_4', name: 'Мумбаи-У4 (нефть)', lat: 19.0628, lon: 72.859, type: 'oil', bonus: 3.5, icon: '🛢️', region: 'Мумбаи (город)', reserve: 27.0, area: 243.7, depth: 561 },
    { id: 'urban_дели_1', name: 'Дели-У1 (нефть)', lat: 28.6724, lon: 77.238, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Дели (город)', reserve: 54.6, area: 133.6, depth: 932 },
    { id: 'urban_дели_2', name: 'Дели-У2 (нефть)', lat: 28.5415, lon: 77.1455, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Дели (город)', reserve: 264.4, area: 211.5, depth: 422 },
    { id: 'urban_дели_3', name: 'Дели-У3 (нефть)', lat: 28.7093, lon: 77.2569, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Дели (город)', reserve: 142.4, area: 418.0, depth: 1587 },
    { id: 'urban_дели_4', name: 'Дели-У4 (нефть)', lat: 28.5984, lon: 77.2029, type: 'oil', bonus: 2.0, icon: '🛢️', region: 'Дели (город)', reserve: 341.2, area: 206.5, depth: 3453 },
    { id: 'urban_джакарта_1', name: 'Джакарта-У1 (газ)', lat: -6.304, lon: 106.8723, type: 'gas', bonus: 3.3, icon: '⛽', region: 'Джакарта (город)', reserve: 335.5, area: 693.2, depth: 3118 },
    { id: 'urban_джакарта_2', name: 'Джакарта-У2 (газ)', lat: -6.2275, lon: 106.8316, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Джакарта (город)', reserve: 568.3, area: 454.9, depth: 981 },
    { id: 'urban_джакарта_3', name: 'Джакарта-У3 (нефть)', lat: -6.1078, lon: 106.8153, type: 'oil', bonus: 2.0, icon: '🛢️', region: 'Джакарта (город)', reserve: 493.9, area: 325.8, depth: 2473 },
    { id: 'urban_джакарта_4', name: 'Джакарта-У4 (нефть)', lat: -6.1757, lon: 106.7776, type: 'oil', bonus: 1.6, icon: '🛢️', region: 'Джакарта (город)', reserve: 310.0, area: 759.0, depth: 274 },
    { id: 'urban_бангкок_1', name: 'Бангкок-У1 (нефть)', lat: 13.6755, lon: 100.4993, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Бангкок (город)', reserve: 28.6, area: 93.6, depth: 1312 },
    { id: 'urban_бангкок_2', name: 'Бангкок-У2 (нефть)', lat: 13.7672, lon: 100.4388, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Бангкок (город)', reserve: 132.9, area: 28.7, depth: 689 },
    { id: 'urban_бангкок_3', name: 'Бангкок-У3 (нефть)', lat: 13.7864, lon: 100.4915, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Бангкок (город)', reserve: 366.7, area: 31.1, depth: 1219 },
    { id: 'urban_бангкок_4', name: 'Бангкок-У4 (нефть)', lat: 13.788, lon: 100.5511, type: 'oil', bonus: 2.2, icon: '🛢️', region: 'Бангкок (город)', reserve: 209.3, area: 68.3, depth: 4353 },
    { id: 'urban_сингапур_1', name: 'Сингапур-У1 (газ)', lat: 1.319, lon: 103.7835, type: 'gas', bonus: 1.5, icon: '⛽', region: 'Сингапур (город)', reserve: 568.0, area: 522.8, depth: 1673 },
    { id: 'urban_сингапур_2', name: 'Сингапур-У2 (нефть)', lat: 1.3674, lon: 103.7481, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Сингапур (город)', reserve: 498.9, area: 664.5, depth: 999 },
    { id: 'urban_сингапур_3', name: 'Сингапур-У3 (нефть)', lat: 1.3706, lon: 103.8916, type: 'oil', bonus: 1.6, icon: '🛢️', region: 'Сингапур (город)', reserve: 558.7, area: 769.5, depth: 2138 },
    { id: 'urban_сингапур_4', name: 'Сингапур-У4 (газ)', lat: 1.3827, lon: 103.7758, type: 'gas', bonus: 2.0, icon: '⛽', region: 'Сингапур (город)', reserve: 176.9, area: 676.8, depth: 3927 },
    { id: 'urban_куалалумпур_1', name: 'Куала-Лумпур-У1 (нефть)', lat: 3.153, lon: 101.665, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Куала-Лумпур (город)', reserve: 15.4, area: 787.2, depth: 3934 },
    { id: 'urban_куалалумпур_2', name: 'Куала-Лумпур-У2 (нефть)', lat: 3.1308, lon: 101.6985, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Куала-Лумпур (город)', reserve: 224.9, area: 455.3, depth: 914 },
    { id: 'urban_куалалумпур_3', name: 'Куала-Лумпур-У3 (газ)', lat: 3.1908, lon: 101.6373, type: 'gas', bonus: 2.9, icon: '⛽', region: 'Куала-Лумпур (город)', reserve: 173.3, area: 258.2, depth: 1565 },
    { id: 'urban_манила_1', name: 'Манила-У1 (нефть)', lat: 14.5446, lon: 121.0124, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Манила (город)', reserve: 273.0, area: 495.3, depth: 3237 },
    { id: 'urban_манила_2', name: 'Манила-У2 (газ)', lat: 14.5892, lon: 120.9884, type: 'gas', bonus: 2.0, icon: '⛽', region: 'Манила (город)', reserve: 28.9, area: 448.6, depth: 3315 },
    { id: 'urban_манила_3', name: 'Манила-У3 (газ)', lat: 14.5886, lon: 120.9884, type: 'gas', bonus: 1.7, icon: '⛽', region: 'Манила (город)', reserve: 160.7, area: 607.7, depth: 2362 },
    { id: 'urban_манила_4', name: 'Манила-У4 (нефть)', lat: 14.571, lon: 121.0028, type: 'oil', bonus: 3.5, icon: '🛢️', region: 'Манила (город)', reserve: 81.2, area: 442.0, depth: 1219 },
    { id: 'urban_карачи_1', name: 'Карачи-У1 (нефть)', lat: 24.8304, lon: 67.0297, type: 'oil', bonus: 2.2, icon: '🛢️', region: 'Карачи (город)', reserve: 527.3, area: 206.4, depth: 3493 },
    { id: 'urban_карачи_2', name: 'Карачи-У2 (газ)', lat: 24.8528, lon: 66.979, type: 'gas', bonus: 2.1, icon: '⛽', region: 'Карачи (город)', reserve: 236.6, area: 483.2, depth: 2893 },
    { id: 'urban_карачи_3', name: 'Карачи-У3 (газ)', lat: 24.7999, lon: 67.0681, type: 'gas', bonus: 2.6, icon: '⛽', region: 'Карачи (город)', reserve: 292.3, area: 633.5, depth: 1421 },
    { id: 'urban_карачи_4', name: 'Карачи-У4 (газ)', lat: 24.8544, lon: 66.9848, type: 'gas', bonus: 2.9, icon: '⛽', region: 'Карачи (город)', reserve: 222.5, area: 223.9, depth: 2608 },
    { id: 'urban_тегеран_1', name: 'Тегеран-У1 (нефть)', lat: 35.7109, lon: 51.5132, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Тегеран (город)', reserve: 497.1, area: 500.3, depth: 3860 },
    { id: 'urban_тегеран_2', name: 'Тегеран-У2 (газ)', lat: 35.5955, lon: 51.3489, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Тегеран (город)', reserve: 466.5, area: 74.6, depth: 2849 },
    { id: 'urban_тегеран_3', name: 'Тегеран-У3 (газ)', lat: 35.7052, lon: 51.4141, type: 'gas', bonus: 3.1, icon: '⛽', region: 'Тегеран (город)', reserve: 594.7, area: 684.2, depth: 294 },
    { id: 'urban_тегеран_4', name: 'Тегеран-У4 (нефть)', lat: 35.6502, lon: 51.3302, type: 'oil', bonus: 2.5, icon: '🛢️', region: 'Тегеран (город)', reserve: 42.6, area: 554.5, depth: 2670 },
    { id: 'urban_багдад_1', name: 'Багдад-У1 (нефть)', lat: 33.3977, lon: 44.3492, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Багдад (город)', reserve: 440.2, area: 153.9, depth: 3565 },
    { id: 'urban_багдад_2', name: 'Багдад-У2 (нефть)', lat: 33.2878, lon: 44.3692, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Багдад (город)', reserve: 405.0, area: 270.3, depth: 2985 },
    { id: 'urban_багдад_3', name: 'Багдад-У3 (нефть)', lat: 33.3138, lon: 44.3047, type: 'oil', bonus: 2.5, icon: '🛢️', region: 'Багдад (город)', reserve: 163.6, area: 309.4, depth: 3773 },
    { id: 'urban_багдад_4', name: 'Багдад-У4 (газ)', lat: 33.2842, lon: 44.4348, type: 'gas', bonus: 2.0, icon: '⛽', region: 'Багдад (город)', reserve: 319.2, area: 290.5, depth: 2336 },
    { id: 'urban_эррияд_1', name: 'Эр-Рияд-У1 (нефть)', lat: 24.6927, lon: 46.7244, type: 'oil', bonus: 1.5, icon: '🛢️', region: 'Эр-Рияд (город)', reserve: 542.7, area: 259.7, depth: 2477 },
    { id: 'urban_эррияд_2', name: 'Эр-Рияд-У2 (нефть)', lat: 24.7261, lon: 46.6795, type: 'oil', bonus: 1.9, icon: '🛢️', region: 'Эр-Рияд (город)', reserve: 46.2, area: 496.8, depth: 2347 },
    { id: 'urban_эррияд_3', name: 'Эр-Рияд-У3 (нефть)', lat: 24.6896, lon: 46.5789, type: 'oil', bonus: 3.1, icon: '🛢️', region: 'Эр-Рияд (город)', reserve: 268.3, area: 515.2, depth: 1484 },
    { id: 'urban_эррияд_4', name: 'Эр-Рияд-У4 (нефть)', lat: 24.7288, lon: 46.7033, type: 'oil', bonus: 2.8, icon: '🛢️', region: 'Эр-Рияд (город)', reserve: 531.0, area: 734.0, depth: 4441 },
    { id: 'urban_дубай_1', name: 'Дубай-У1 (газ)', lat: 25.2259, lon: 55.2706, type: 'gas', bonus: 3.2, icon: '⛽', region: 'Дубай (город)', reserve: 256.5, area: 316.6, depth: 1289 },
    { id: 'urban_дубай_2', name: 'Дубай-У2 (газ)', lat: 25.1949, lon: 55.2531, type: 'gas', bonus: 1.7, icon: '⛽', region: 'Дубай (город)', reserve: 553.5, area: 308.3, depth: 3138 },
    { id: 'urban_дубай_3', name: 'Дубай-У3 (нефть)', lat: 25.1822, lon: 55.253, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Дубай (город)', reserve: 588.5, area: 257.9, depth: 959 },
    { id: 'urban_абудаби_1', name: 'Абу-Даби-У1 (нефть)', lat: 24.4662, lon: 54.3923, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Абу-Даби (город)', reserve: 245.4, area: 142.4, depth: 581 },
    { id: 'urban_абудаби_2', name: 'Абу-Даби-У2 (нефть)', lat: 24.4577, lon: 54.3916, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Абу-Даби (город)', reserve: 527.2, area: 780.5, depth: 624 },
    { id: 'urban_абудаби_3', name: 'Абу-Даби-У3 (газ)', lat: 24.4265, lon: 54.4226, type: 'gas', bonus: 2.6, icon: '⛽', region: 'Абу-Даби (город)', reserve: 480.9, area: 343.4, depth: 2751 },
    { id: 'urban_доха_1', name: 'Доха-У1 (газ)', lat: 25.3024, lon: 51.5246, type: 'gas', bonus: 2.3, icon: '⛽', region: 'Доха (город)', reserve: 226.4, area: 515.9, depth: 623 },
    { id: 'urban_доха_2', name: 'Доха-У2 (нефть)', lat: 25.2519, lon: 51.497, type: 'oil', bonus: 1.9, icon: '🛢️', region: 'Доха (город)', reserve: 581.3, area: 31.7, depth: 1359 },
    { id: 'urban_доха_3', name: 'Доха-У3 (нефть)', lat: 25.2827, lon: 51.5621, type: 'oil', bonus: 2.2, icon: '🛢️', region: 'Доха (город)', reserve: 373.1, area: 705.9, depth: 2781 },
    { id: 'urban_кувейт_1', name: 'Кувейт-У1 (нефть)', lat: 29.3556, lon: 47.926, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Кувейт (город)', reserve: 46.5, area: 58.4, depth: 2346 },
    { id: 'urban_кувейт_2', name: 'Кувейт-У2 (нефть)', lat: 29.3838, lon: 48.022, type: 'oil', bonus: 2.8, icon: '🛢️', region: 'Кувейт (город)', reserve: 120.8, area: 239.5, depth: 2348 },
    { id: 'urban_кувейт_3', name: 'Кувейт-У3 (газ)', lat: 29.3513, lon: 47.9983, type: 'gas', bonus: 2.8, icon: '⛽', region: 'Кувейт (город)', reserve: 111.2, area: 687.6, depth: 1174 },
    { id: 'urban_стамбул_1', name: 'Стамбул-У1 (нефть)', lat: 41.0538, lon: 28.9217, type: 'oil', bonus: 3.3, icon: '🛢️', region: 'Стамбул (город)', reserve: 443.1, area: 616.1, depth: 2627 },
    { id: 'urban_стамбул_2', name: 'Стамбул-У2 (газ)', lat: 41.0077, lon: 28.8371, type: 'gas', bonus: 2.3, icon: '⛽', region: 'Стамбул (город)', reserve: 80.4, area: 237.6, depth: 1096 },
    { id: 'urban_стамбул_3', name: 'Стамбул-У3 (нефть)', lat: 41.0932, lon: 28.9176, type: 'oil', bonus: 2.2, icon: '🛢️', region: 'Стамбул (город)', reserve: 81.4, area: 764.2, depth: 984 },
    { id: 'urban_стамбул_4', name: 'Стамбул-У4 (нефть)', lat: 41.0106, lon: 29.0037, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Стамбул (город)', reserve: 296.8, area: 577.4, depth: 2614 },
    { id: 'urban_анкара_1', name: 'Анкара-У1 (нефть)', lat: 39.9234, lon: 32.8463, type: 'oil', bonus: 2.5, icon: '🛢️', region: 'Анкара (город)', reserve: 363.8, area: 669.0, depth: 484 },
    { id: 'urban_анкара_2', name: 'Анкара-У2 (нефть)', lat: 39.9519, lon: 32.8937, type: 'oil', bonus: 1.5, icon: '🛢️', region: 'Анкара (город)', reserve: 72.9, area: 86.1, depth: 1531 },
    { id: 'urban_анкара_3', name: 'Анкара-У3 (нефть)', lat: 39.9426, lon: 32.8658, type: 'oil', bonus: 3.3, icon: '🛢️', region: 'Анкара (город)', reserve: 353.4, area: 346.2, depth: 1856 },
    { id: 'urban_каир_1', name: 'Каир-У1 (газ)', lat: 30.0728, lon: 31.231, type: 'gas', bonus: 3.1, icon: '⛽', region: 'Каир (город)', reserve: 400.1, area: 787.7, depth: 1518 },
    { id: 'urban_каир_2', name: 'Каир-У2 (нефть)', lat: 30.0578, lon: 31.2271, type: 'oil', bonus: 2.5, icon: '🛢️', region: 'Каир (город)', reserve: 410.6, area: 767.1, depth: 3015 },
    { id: 'urban_каир_3', name: 'Каир-У3 (нефть)', lat: 30.088, lon: 31.1981, type: 'oil', bonus: 2.5, icon: '🛢️', region: 'Каир (город)', reserve: 45.0, area: 154.9, depth: 4371 },
    { id: 'urban_каир_4', name: 'Каир-У4 (газ)', lat: 29.9757, lon: 31.2694, type: 'gas', bonus: 3.3, icon: '⛽', region: 'Каир (город)', reserve: 48.6, area: 683.9, depth: 1911 },
    { id: 'urban_лагос_1', name: 'Лагос-У1 (нефть)', lat: 6.5472, lon: 3.4065, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Лагос (город)', reserve: 229.0, area: 472.1, depth: 247 },
    { id: 'urban_лагос_2', name: 'Лагос-У2 (нефть)', lat: 6.6057, lon: 3.3742, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Лагос (город)', reserve: 247.9, area: 74.2, depth: 1374 },
    { id: 'urban_лагос_3', name: 'Лагос-У3 (газ)', lat: 6.4687, lon: 3.3362, type: 'gas', bonus: 1.8, icon: '⛽', region: 'Лагос (город)', reserve: 59.6, area: 468.0, depth: 2348 },
    { id: 'urban_лагос_4', name: 'Лагос-У4 (газ)', lat: 6.4619, lon: 3.426, type: 'gas', bonus: 2.9, icon: '⛽', region: 'Лагос (город)', reserve: 292.8, area: 245.0, depth: 1751 },
    { id: 'urban_йоханнесбург_1', name: 'Йоханнесбург-У1 (нефть)', lat: -26.226, lon: 28.0205, type: 'oil', bonus: 3.5, icon: '🛢️', region: 'Йоханнесбург (город)', reserve: 54.0, area: 540.0, depth: 4205 },
    { id: 'urban_йоханнесбург_2', name: 'Йоханнесбург-У2 (нефть)', lat: -26.2321, lon: 28.1036, type: 'oil', bonus: 1.5, icon: '🛢️', region: 'Йоханнесбург (город)', reserve: 29.6, area: 179.0, depth: 530 },
    { id: 'urban_йоханнесбург_3', name: 'Йоханнесбург-У3 (нефть)', lat: -26.2293, lon: 27.9693, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Йоханнесбург (город)', reserve: 170.0, area: 476.4, depth: 2029 },
    { id: 'urban_йоханнесбург_4', name: 'Йоханнесбург-У4 (нефть)', lat: -26.2489, lon: 28.0404, type: 'oil', bonus: 1.6, icon: '🛢️', region: 'Йоханнесбург (город)', reserve: 191.1, area: 454.3, depth: 1968 },
    { id: 'urban_найроби_1', name: 'Найроби-У1 (нефть)', lat: -1.2719, lon: 36.8209, type: 'oil', bonus: 2.0, icon: '🛢️', region: 'Найроби (город)', reserve: 234.2, area: 795.2, depth: 1029 },
    { id: 'urban_найроби_2', name: 'Найроби-У2 (нефть)', lat: -1.3406, lon: 36.8079, type: 'oil', bonus: 2.8, icon: '🛢️', region: 'Найроби (город)', reserve: 424.6, area: 774.6, depth: 3124 },
    { id: 'urban_найроби_3', name: 'Найроби-У3 (газ)', lat: -1.2807, lon: 36.8249, type: 'gas', bonus: 2.0, icon: '⛽', region: 'Найроби (город)', reserve: 445.7, area: 491.1, depth: 1503 },
    { id: 'urban_ньюйорк_1', name: 'Нью-Йорк-У1 (нефть)', lat: 40.7542, lon: -73.9709, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Нью-Йорк (город)', reserve: 338.9, area: 161.5, depth: 2260 },
    { id: 'urban_ньюйорк_2', name: 'Нью-Йорк-У2 (нефть)', lat: 40.6927, lon: -73.9318, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Нью-Йорк (город)', reserve: 243.4, area: 582.0, depth: 2028 },
    { id: 'urban_ньюйорк_3', name: 'Нью-Йорк-У3 (нефть)', lat: 40.8073, lon: -74.1015, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Нью-Йорк (город)', reserve: 350.8, area: 587.3, depth: 2599 },
    { id: 'urban_ньюйорк_4', name: 'Нью-Йорк-У4 (нефть)', lat: 40.6735, lon: -73.9212, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Нью-Йорк (город)', reserve: 270.6, area: 412.6, depth: 3232 },
    { id: 'urban_лосанджелес_1', name: 'Лос-Анджелес-У1 (нефть)', lat: 34.0714, lon: -118.2453, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Лос-Анджелес (город)', reserve: 116.5, area: 85.1, depth: 2190 },
    { id: 'urban_лосанджелес_2', name: 'Лос-Анджелес-У2 (газ)', lat: 34.1142, lon: -118.2565, type: 'gas', bonus: 2.6, icon: '⛽', region: 'Лос-Анджелес (город)', reserve: 326.3, area: 393.3, depth: 3021 },
    { id: 'urban_лосанджелес_3', name: 'Лос-Анджелес-У3 (нефть)', lat: 34.1307, lon: -118.2817, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Лос-Анджелес (город)', reserve: 283.4, area: 606.3, depth: 1351 },
    { id: 'urban_лосанджелес_4', name: 'Лос-Анджелес-У4 (газ)', lat: 34.0639, lon: -118.229, type: 'gas', bonus: 2.3, icon: '⛽', region: 'Лос-Анджелес (город)', reserve: 350.9, area: 517.3, depth: 2435 },
    { id: 'urban_чикаго_1', name: 'Чикаго-У1 (газ)', lat: 41.8674, lon: -87.5675, type: 'gas', bonus: 3.4, icon: '⛽', region: 'Чикаго (город)', reserve: 550.7, area: 377.3, depth: 2170 },
    { id: 'urban_чикаго_2', name: 'Чикаго-У2 (газ)', lat: 41.9326, lon: -87.6515, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Чикаго (город)', reserve: 93.0, area: 342.6, depth: 1916 },
    { id: 'urban_чикаго_3', name: 'Чикаго-У3 (нефть)', lat: 41.8194, lon: -87.6004, type: 'oil', bonus: 1.9, icon: '🛢️', region: 'Чикаго (город)', reserve: 99.4, area: 654.9, depth: 500 },
    { id: 'urban_чикаго_4', name: 'Чикаго-У4 (нефть)', lat: 41.836, lon: -87.5478, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Чикаго (город)', reserve: 168.6, area: 168.9, depth: 3062 },
    { id: 'urban_хьюстон_1', name: 'Хьюстон-У1 (нефть)', lat: 29.7028, lon: -95.4708, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Хьюстон (город)', reserve: 62.9, area: 111.5, depth: 953 },
    { id: 'urban_хьюстон_2', name: 'Хьюстон-У2 (нефть)', lat: 29.765, lon: -95.3896, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Хьюстон (город)', reserve: 142.8, area: 83.1, depth: 4014 },
    { id: 'urban_хьюстон_3', name: 'Хьюстон-У3 (нефть)', lat: 29.7499, lon: -95.3958, type: 'oil', bonus: 3.4, icon: '🛢️', region: 'Хьюстон (город)', reserve: 330.9, area: 729.6, depth: 1081 },
    { id: 'urban_хьюстон_4', name: 'Хьюстон-У4 (нефть)', lat: 29.7719, lon: -95.2784, type: 'oil', bonus: 2.8, icon: '🛢️', region: 'Хьюстон (город)', reserve: 549.8, area: 212.4, depth: 2164 },
    { id: 'urban_даллас_1', name: 'Даллас-У1 (нефть)', lat: 32.7874, lon: -96.8008, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Даллас (город)', reserve: 154.8, area: 349.5, depth: 1870 },
    { id: 'urban_даллас_2', name: 'Даллас-У2 (газ)', lat: 32.7438, lon: -96.8003, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Даллас (город)', reserve: 332.1, area: 292.6, depth: 2546 },
    { id: 'urban_даллас_3', name: 'Даллас-У3 (газ)', lat: 32.7458, lon: -96.8951, type: 'gas', bonus: 3.4, icon: '⛽', region: 'Даллас (город)', reserve: 496.6, area: 267.9, depth: 2281 },
    { id: 'urban_даллас_4', name: 'Даллас-У4 (газ)', lat: 32.7734, lon: -96.8854, type: 'gas', bonus: 2.5, icon: '⛽', region: 'Даллас (город)', reserve: 149.3, area: 575.7, depth: 1541 },
    { id: 'urban_майами_1', name: 'Майами-У1 (нефть)', lat: 25.7498, lon: -80.1351, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Майами (город)', reserve: 136.9, area: 513.4, depth: 2544 },
    { id: 'urban_майами_2', name: 'Майами-У2 (нефть)', lat: 25.749, lon: -80.178, type: 'oil', bonus: 1.5, icon: '🛢️', region: 'Майами (город)', reserve: 527.9, area: 441.7, depth: 1334 },
    { id: 'urban_майами_3', name: 'Майами-У3 (нефть)', lat: 25.7259, lon: -80.1941, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Майами (город)', reserve: 11.8, area: 329.9, depth: 913 },
    { id: 'urban_мехико_1', name: 'Мехико-У1 (нефть)', lat: 19.4408, lon: -99.1614, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Мехико (город)', reserve: 345.9, area: 351.1, depth: 3625 },
    { id: 'urban_мехико_2', name: 'Мехико-У2 (нефть)', lat: 19.4434, lon: -99.0653, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Мехико (город)', reserve: 261.1, area: 741.2, depth: 1294 },
    { id: 'urban_мехико_3', name: 'Мехико-У3 (нефть)', lat: 19.499, lon: -99.2399, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Мехико (город)', reserve: 173.1, area: 154.3, depth: 384 },
    { id: 'urban_мехико_4', name: 'Мехико-У4 (газ)', lat: 19.44, lon: -99.2739, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Мехико (город)', reserve: 329.8, area: 228.0, depth: 1242 },
    { id: 'urban_богота_1', name: 'Богота-У1 (нефть)', lat: 4.6581, lon: -74.048, type: 'oil', bonus: 2.2, icon: '🛢️', region: 'Богота (город)', reserve: 68.3, area: 478.1, depth: 2804 },
    { id: 'urban_богота_2', name: 'Богота-У2 (газ)', lat: 4.6925, lon: -74.1177, type: 'gas', bonus: 3.5, icon: '⛽', region: 'Богота (город)', reserve: 509.8, area: 319.2, depth: 1366 },
    { id: 'urban_богота_3', name: 'Богота-У3 (газ)', lat: 4.7903, lon: -74.1127, type: 'gas', bonus: 3.2, icon: '⛽', region: 'Богота (город)', reserve: 233.6, area: 467.4, depth: 3116 },
    { id: 'urban_богота_4', name: 'Богота-У4 (нефть)', lat: 4.625, lon: -74.075, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Богота (город)', reserve: 250.2, area: 229.3, depth: 4060 },
    { id: 'urban_лима_1', name: 'Лима-У1 (нефть)', lat: -12.047, lon: -77.1202, type: 'oil', bonus: 3.3, icon: '🛢️', region: 'Лима (город)', reserve: 236.5, area: 631.4, depth: 1964 },
    { id: 'urban_лима_2', name: 'Лима-У2 (нефть)', lat: -12.0275, lon: -76.9674, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Лима (город)', reserve: 594.0, area: 495.9, depth: 456 },
    { id: 'urban_лима_3', name: 'Лима-У3 (нефть)', lat: -11.9859, lon: -76.9855, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Лима (город)', reserve: 92.5, area: 308.0, depth: 1756 },
    { id: 'urban_лима_4', name: 'Лима-У4 (нефть)', lat: -12.0756, lon: -77.118, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Лима (город)', reserve: 118.2, area: 354.8, depth: 1599 },
    { id: 'urban_буэносайрес_1', name: 'Буэнос-Айрес-У1 (нефть)', lat: -34.6669, lon: -58.2893, type: 'oil', bonus: 1.6, icon: '🛢️', region: 'Буэнос-Айрес (город)', reserve: 266.1, area: 273.6, depth: 2397 },
    { id: 'urban_буэносайрес_2', name: 'Буэнос-Айрес-У2 (нефть)', lat: -34.6969, lon: -58.3995, type: 'oil', bonus: 3.3, icon: '🛢️', region: 'Буэнос-Айрес (город)', reserve: 540.4, area: 439.3, depth: 1500 },
    { id: 'urban_буэносайрес_3', name: 'Буэнос-Айрес-У3 (газ)', lat: -34.6042, lon: -58.4037, type: 'gas', bonus: 1.7, icon: '⛽', region: 'Буэнос-Айрес (город)', reserve: 28.1, area: 14.3, depth: 204 },
    { id: 'urban_буэносайрес_4', name: 'Буэнос-Айрес-У4 (нефть)', lat: -34.614, lon: -58.3506, type: 'oil', bonus: 2.0, icon: '🛢️', region: 'Буэнос-Айрес (город)', reserve: 90.3, area: 197.5, depth: 627 },
    { id: 'urban_санпаулу_1', name: 'Сан-Паулу-У1 (нефть)', lat: -23.5534, lon: -46.6859, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Сан-Паулу (город)', reserve: 205.5, area: 413.1, depth: 4070 },
    { id: 'urban_санпаулу_2', name: 'Сан-Паулу-У2 (газ)', lat: -23.4867, lon: -46.5229, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Сан-Паулу (город)', reserve: 301.6, area: 578.6, depth: 1118 },
    { id: 'urban_санпаулу_3', name: 'Сан-Паулу-У3 (нефть)', lat: -23.5684, lon: -46.7193, type: 'oil', bonus: 2.2, icon: '🛢️', region: 'Сан-Паулу (город)', reserve: 538.2, area: 235.0, depth: 3378 },
    { id: 'urban_санпаулу_4', name: 'Сан-Паулу-У4 (нефть)', lat: -23.4681, lon: -46.6823, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Сан-Паулу (город)', reserve: 267.2, area: 473.0, depth: 1401 },
    { id: 'urban_риодежанейро_1', name: 'Рио-де-Жанейро-У1 (нефть)', lat: -22.8963, lon: -43.1804, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Рио-де-Жанейро (город)', reserve: 348.4, area: 583.5, depth: 3290 },
    { id: 'urban_риодежанейро_2', name: 'Рио-де-Жанейро-У2 (газ)', lat: -22.8202, lon: -43.1794, type: 'gas', bonus: 3.4, icon: '⛽', region: 'Рио-де-Жанейро (город)', reserve: 456.1, area: 546.5, depth: 498 },
    { id: 'urban_риодежанейро_3', name: 'Рио-де-Жанейро-У3 (нефть)', lat: -22.8498, lon: -43.1375, type: 'oil', bonus: 3.3, icon: '🛢️', region: 'Рио-де-Жанейро (город)', reserve: 226.4, area: 233.6, depth: 4485 },
    { id: 'urban_риодежанейро_4', name: 'Рио-де-Жанейро-У4 (нефть)', lat: -22.9347, lon: -43.2423, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Рио-де-Жанейро (город)', reserve: 315.4, area: 409.8, depth: 935 },
    { id: 'urban_сантьяго_1', name: 'Сантьяго-У1 (нефть)', lat: -33.4806, lon: -70.7119, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Сантьяго (город)', reserve: 105.6, area: 641.5, depth: 3165 },
    { id: 'urban_сантьяго_2', name: 'Сантьяго-У2 (газ)', lat: -33.488, lon: -70.6797, type: 'gas', bonus: 3.2, icon: '⛽', region: 'Сантьяго (город)', reserve: 392.2, area: 175.0, depth: 2745 },
    { id: 'urban_сантьяго_3', name: 'Сантьяго-У3 (нефть)', lat: -33.4349, lon: -70.733, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Сантьяго (город)', reserve: 61.2, area: 710.0, depth: 3009 },
    { id: 'urban_сантьяго_4', name: 'Сантьяго-У4 (нефть)', lat: -33.4402, lon: -70.612, type: 'oil', bonus: 1.9, icon: '🛢️', region: 'Сантьяго (город)', reserve: 390.8, area: 146.1, depth: 1487 },
    { id: 'urban_сидней_1', name: 'Сидней-У1 (газ)', lat: -33.8241, lon: 151.1303, type: 'gas', bonus: 3.0, icon: '⛽', region: 'Сидней (город)', reserve: 229.5, area: 118.2, depth: 1804 },
    { id: 'urban_сидней_2', name: 'Сидней-У2 (нефть)', lat: -33.8588, lon: 151.1931, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Сидней (город)', reserve: 417.1, area: 159.6, depth: 2028 },
    { id: 'urban_сидней_3', name: 'Сидней-У3 (нефть)', lat: -33.8739, lon: 151.23, type: 'oil', bonus: 1.9, icon: '🛢️', region: 'Сидней (город)', reserve: 145.2, area: 708.1, depth: 1097 },
    { id: 'urban_сидней_4', name: 'Сидней-У4 (газ)', lat: -33.8963, lon: 151.2877, type: 'gas', bonus: 2.7, icon: '⛽', region: 'Сидней (город)', reserve: 467.8, area: 260.2, depth: 3054 },
    { id: 'urban_мельбурн_1', name: 'Мельбурн-У1 (нефть)', lat: -37.8053, lon: 144.9939, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Мельбурн (город)', reserve: 249.1, area: 678.2, depth: 3051 },
    { id: 'urban_мельбурн_2', name: 'Мельбурн-У2 (нефть)', lat: -37.8061, lon: 144.8858, type: 'oil', bonus: 1.6, icon: '🛢️', region: 'Мельбурн (город)', reserve: 329.7, area: 499.9, depth: 3327 },
    { id: 'urban_мельбурн_3', name: 'Мельбурн-У3 (нефть)', lat: -37.81, lon: 144.9471, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Мельбурн (город)', reserve: 29.6, area: 431.6, depth: 4349 },
    { id: 'urban_мельбурн_4', name: 'Мельбурн-У4 (нефть)', lat: -37.8487, lon: 144.9584, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Мельбурн (город)', reserve: 375.2, area: 251.4, depth: 2621 }
  ];

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
    // ── Городские месторождения (авто-генерация) ──────────────────
    { id: 'moscow_1', name: 'Москва-1 (нефть)', lat: 56.0204, lon: 37.6961, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Москва', reserve: 627.3, area: 1695.0, depth: 4767 },
    { id: 'moscow_2', name: 'Москва-2 (нефть)', lat: 55.6115, lon: 37.4628, type: 'oil', bonus: 1.7, icon: '🛢️', region: 'Москва', reserve: 201.6, area: 1509.0, depth: 4897 },
    { id: 'moscow_3', name: 'Москва-3 (нефть)', lat: 55.6513, lon: 36.8115, type: 'oil', bonus: 2.5, icon: '🛢️', region: 'Москва', reserve: 384.6, area: 702.7, depth: 353 },
    { id: 'moscow_4', name: 'Москва-4 (нефть)', lat: 55.653, lon: 37.1098, type: 'oil', bonus: 1.9, icon: '🛢️', region: 'Москва', reserve: 813.8, area: 848.1, depth: 1059 },
    { id: 'moscow_5', name: 'Москва-5 (газ)', lat: 56.1862, lon: 38.1591, type: 'gas', bonus: 3.0, icon: '⛽', region: 'Москва', reserve: 687.0, area: 1827.0, depth: 4692 },
    { id: 'moscow_6', name: 'Москва-6 (нефть)', lat: 56.0658, lon: 37.5243, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Москва', reserve: 705.8, area: 1550.1, depth: 3262 },
    { id: 'moscow_7', name: 'Москва-7 (нефть)', lat: 55.702, lon: 37.3291, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Москва', reserve: 249.5, area: 208.7, depth: 2207 },
    { id: 'spb_1', name: 'Санкт-Петербург-1 (газ)', lat: 59.8538, lon: 31.1769, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Санкт-Петербург', reserve: 317.8, area: 531.7, depth: 2487 },
    { id: 'spb_2', name: 'Санкт-Петербург-2 (нефть)', lat: 59.7543, lon: 30.0331, type: 'oil', bonus: 3.3, icon: '🛢️', region: 'Санкт-Петербург', reserve: 143.1, area: 954.8, depth: 4862 },
    { id: 'spb_3', name: 'Санкт-Петербург-3 (нефть)', lat: 59.7186, lon: 29.3516, type: 'oil', bonus: 3.4, icon: '🛢️', region: 'Санкт-Петербург', reserve: 198.5, area: 89.9, depth: 2884 },
    { id: 'spb_4', name: 'Санкт-Петербург-4 (газ)', lat: 59.9028, lon: 30.8058, type: 'gas', bonus: 3.9, icon: '⛽', region: 'Санкт-Петербург', reserve: 745.5, area: 793.5, depth: 4389 },
    { id: 'spb_5', name: 'Санкт-Петербург-5 (газ)', lat: 60.2589, lon: 29.7389, type: 'gas', bonus: 1.9, icon: '⛽', region: 'Санкт-Петербург', reserve: 123.0, area: 1865.0, depth: 4715 },
    { id: 'istanbul_1', name: 'Стамбул-1 (газ)', lat: 41.2741, lon: 28.7083, type: 'gas', bonus: 2.0, icon: '⛽', region: 'Стамбул', reserve: 847.9, area: 1278.7, depth: 1044 },
    { id: 'istanbul_2', name: 'Стамбул-2 (нефть)', lat: 41.1506, lon: 28.7479, type: 'oil', bonus: 1.9, icon: '🛢️', region: 'Стамбул', reserve: 580.0, area: 1495.1, depth: 3452 },
    { id: 'istanbul_3', name: 'Стамбул-3 (газ)', lat: 40.7129, lon: 28.6992, type: 'gas', bonus: 2.1, icon: '⛽', region: 'Стамбул', reserve: 472.5, area: 2356.7, depth: 1238 },
    { id: 'istanbul_4', name: 'Стамбул-4 (газ)', lat: 41.0453, lon: 28.5711, type: 'gas', bonus: 2.2, icon: '⛽', region: 'Стамбул', reserve: 138.6, area: 18.1, depth: 2457 },
    { id: 'istanbul_5', name: 'Стамбул-5 (нефть)', lat: 40.8123, lon: 28.9573, type: 'oil', bonus: 3.1, icon: '🛢️', region: 'Стамбул', reserve: 716.2, area: 1274.1, depth: 1929 },
    { id: 'istanbul_6', name: 'Стамбул-6 (нефть)', lat: 40.8536, lon: 29.1801, type: 'oil', bonus: 3.9, icon: '🛢️', region: 'Стамбул', reserve: 784.5, area: 2297.0, depth: 5206 },
    { id: 'london_1', name: 'Лондон-1 (газ)', lat: 52.0738, lon: -0.0186, type: 'gas', bonus: 3.7, icon: '⛽', region: 'Лондон', reserve: 707.8, area: 775.7, depth: 774 },
    { id: 'london_2', name: 'Лондон-2 (нефть)', lat: 51.925, lon: -0.7721, type: 'oil', bonus: 1.7, icon: '🛢️', region: 'Лондон', reserve: 415.7, area: 182.3, depth: 4663 },
    { id: 'london_3', name: 'Лондон-3 (нефть)', lat: 51.7618, lon: 0.2921, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Лондон', reserve: 229.0, area: 2182.4, depth: 3766 },
    { id: 'london_4', name: 'Лондон-4 (нефть)', lat: 51.9518, lon: -0.47, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Лондон', reserve: 607.4, area: 1003.5, depth: 3359 },
    { id: 'london_5', name: 'Лондон-5 (газ)', lat: 51.7952, lon: -0.4647, type: 'gas', bonus: 2.1, icon: '⛽', region: 'Лондон', reserve: 59.1, area: 62.4, depth: 4837 },
    { id: 'london_6', name: 'Лондон-6 (нефть)', lat: 51.3798, lon: -0.2599, type: 'oil', bonus: 3.3, icon: '🛢️', region: 'Лондон', reserve: 54.7, area: 177.8, depth: 557 },
    { id: 'paris_1', name: 'Париж-1 (нефть)', lat: 48.5758, lon: 2.3128, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Париж', reserve: 460.7, area: 1811.1, depth: 4977 },
    { id: 'paris_2', name: 'Париж-2 (газ)', lat: 48.866, lon: 2.9009, type: 'gas', bonus: 2.5, icon: '⛽', region: 'Париж', reserve: 84.7, area: 1650.9, depth: 3202 },
    { id: 'paris_3', name: 'Париж-3 (газ)', lat: 48.3931, lon: 2.7839, type: 'gas', bonus: 1.6, icon: '⛽', region: 'Париж', reserve: 557.2, area: 1619.0, depth: 796 },
    { id: 'paris_4', name: 'Париж-4 (газ)', lat: 48.7804, lon: 1.5818, type: 'gas', bonus: 1.8, icon: '⛽', region: 'Париж', reserve: 166.9, area: 1345.4, depth: 1448 },
    { id: 'paris_5', name: 'Париж-5 (газ)', lat: 48.9954, lon: 2.8475, type: 'gas', bonus: 3.7, icon: '⛽', region: 'Париж', reserve: 68.7, area: 2022.0, depth: 4808 },
    { id: 'paris_6', name: 'Париж-6 (нефть)', lat: 49.4196, lon: 2.6348, type: 'oil', bonus: 3.6, icon: '🛢️', region: 'Париж', reserve: 823.8, area: 2316.7, depth: 2236 },
    { id: 'berlin_1', name: 'Берлин-1 (газ)', lat: 52.2748, lon: 13.4365, type: 'gas', bonus: 2.5, icon: '⛽', region: 'Берлин', reserve: 54.5, area: 953.6, depth: 3498 },
    { id: 'berlin_2', name: 'Берлин-2 (газ)', lat: 52.9706, lon: 13.0315, type: 'gas', bonus: 2.2, icon: '⛽', region: 'Берлин', reserve: 593.6, area: 1829.0, depth: 4852 },
    { id: 'berlin_3', name: 'Берлин-3 (газ)', lat: 52.6797, lon: 13.785, type: 'gas', bonus: 3.9, icon: '⛽', region: 'Берлин', reserve: 494.4, area: 1360.1, depth: 2869 },
    { id: 'berlin_4', name: 'Берлин-4 (нефть)', lat: 52.8666, lon: 13.5856, type: 'oil', bonus: 3.8, icon: '🛢️', region: 'Берлин', reserve: 453.8, area: 151.6, depth: 4460 },
    { id: 'berlin_5', name: 'Берлин-5 (нефть)', lat: 52.6275, lon: 13.1611, type: 'oil', bonus: 1.7, icon: '🛢️', region: 'Берлин', reserve: 733.2, area: 1015.4, depth: 4966 },
    { id: 'dubai_1', name: 'Дубай-1 (нефть)', lat: 24.9522, lon: 55.0149, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Дубай', reserve: 446.8, area: 2337.4, depth: 1973 },
    { id: 'dubai_2', name: 'Дубай-2 (газ)', lat: 25.2233, lon: 55.6317, type: 'gas', bonus: 3.2, icon: '⛽', region: 'Дубай', reserve: 258.5, area: 797.3, depth: 894 },
    { id: 'dubai_3', name: 'Дубай-3 (нефть)', lat: 24.6212, lon: 55.4416, type: 'oil', bonus: 4.0, icon: '🛢️', region: 'Дубай', reserve: 66.9, area: 540.8, depth: 2472 },
    { id: 'dubai_4', name: 'Дубай-4 (нефть)', lat: 25.699, lon: 55.0241, type: 'oil', bonus: 3.7, icon: '🛢️', region: 'Дубай', reserve: 317.3, area: 402.8, depth: 4750 },
    { id: 'dubai_5', name: 'Дубай-5 (газ)', lat: 24.7461, lon: 54.8461, type: 'gas', bonus: 3.1, icon: '⛽', region: 'Дубай', reserve: 11.6, area: 2044.6, depth: 2752 },
    { id: 'riyadh_1', name: 'Эр-Рияд-1 (нефть)', lat: 24.8851, lon: 46.6333, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Эр-Рияд', reserve: 95.4, area: 1387.5, depth: 2531 },
    { id: 'riyadh_2', name: 'Эр-Рияд-2 (газ)', lat: 24.316, lon: 46.4014, type: 'gas', bonus: 2.0, icon: '⛽', region: 'Эр-Рияд', reserve: 540.9, area: 667.3, depth: 4302 },
    { id: 'riyadh_3', name: 'Эр-Рияд-3 (газ)', lat: 25.1296, lon: 46.3927, type: 'gas', bonus: 1.7, icon: '⛽', region: 'Эр-Рияд', reserve: 362.9, area: 698.9, depth: 329 },
    { id: 'riyadh_4', name: 'Эр-Рияд-4 (газ)', lat: 24.7478, lon: 46.2436, type: 'gas', bonus: 2.2, icon: '⛽', region: 'Эр-Рияд', reserve: 631.3, area: 1383.7, depth: 3803 },
    { id: 'riyadh_5', name: 'Эр-Рияд-5 (нефть)', lat: 25.1289, lon: 47.1293, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Эр-Рияд', reserve: 131.0, area: 99.7, depth: 3324 },
    { id: 'riyadh_6', name: 'Эр-Рияд-6 (нефть)', lat: 24.5373, lon: 46.7993, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Эр-Рияд', reserve: 793.5, area: 2430.8, depth: 626 },
    { id: 'riyadh_7', name: 'Эр-Рияд-7 (газ)', lat: 24.7551, lon: 46.9996, type: 'gas', bonus: 1.8, icon: '⛽', region: 'Эр-Рияд', reserve: 664.2, area: 2211.5, depth: 3629 },
    { id: 'beijing_1', name: 'Пекин-1 (нефть)', lat: 40.1391, lon: 116.2396, type: 'oil', bonus: 1.9, icon: '🛢️', region: 'Пекин', reserve: 680.9, area: 450.9, depth: 3677 },
    { id: 'beijing_2', name: 'Пекин-2 (нефть)', lat: 40.1531, lon: 117.0564, type: 'oil', bonus: 3.5, icon: '🛢️', region: 'Пекин', reserve: 352.9, area: 1678.1, depth: 2332 },
    { id: 'beijing_3', name: 'Пекин-3 (газ)', lat: 40.1614, lon: 116.9008, type: 'gas', bonus: 2.5, icon: '⛽', region: 'Пекин', reserve: 37.7, area: 1182.0, depth: 1934 },
    { id: 'beijing_4', name: 'Пекин-4 (газ)', lat: 39.6057, lon: 116.9385, type: 'gas', bonus: 3.7, icon: '⛽', region: 'Пекин', reserve: 193.4, area: 1653.5, depth: 3564 },
    { id: 'beijing_5', name: 'Пекин-5 (газ)', lat: 39.8776, lon: 116.6225, type: 'gas', bonus: 3.4, icon: '⛽', region: 'Пекин', reserve: 301.7, area: 1278.4, depth: 4692 },
    { id: 'beijing_6', name: 'Пекин-6 (газ)', lat: 40.0974, lon: 116.2919, type: 'gas', bonus: 3.9, icon: '⛽', region: 'Пекин', reserve: 155.9, area: 2406.7, depth: 2474 },
    { id: 'beijing_7', name: 'Пекин-7 (нефть)', lat: 40.1785, lon: 116.6737, type: 'oil', bonus: 3.3, icon: '🛢️', region: 'Пекин', reserve: 270.1, area: 1519.5, depth: 4489 },
    { id: 'shanghai_1', name: 'Шанхай-1 (газ)', lat: 31.4201, lon: 121.3074, type: 'gas', bonus: 1.6, icon: '⛽', region: 'Шанхай', reserve: 373.5, area: 1304.6, depth: 4710 },
    { id: 'shanghai_2', name: 'Шанхай-2 (нефть)', lat: 31.1106, lon: 121.6299, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Шанхай', reserve: 284.0, area: 791.6, depth: 1320 },
    { id: 'shanghai_3', name: 'Шанхай-3 (газ)', lat: 30.7803, lon: 121.4465, type: 'gas', bonus: 2.3, icon: '⛽', region: 'Шанхай', reserve: 594.1, area: 1390.5, depth: 1871 },
    { id: 'shanghai_4', name: 'Шанхай-4 (газ)', lat: 31.0667, lon: 121.1474, type: 'gas', bonus: 3.4, icon: '⛽', region: 'Шанхай', reserve: 152.1, area: 1427.1, depth: 3626 },
    { id: 'shanghai_5', name: 'Шанхай-5 (нефть)', lat: 31.1488, lon: 121.7398, type: 'oil', bonus: 3.5, icon: '🛢️', region: 'Шанхай', reserve: 517.6, area: 812.4, depth: 3919 },
    { id: 'tokyo_1', name: 'Токио-1 (нефть)', lat: 35.1741, lon: 139.6462, type: 'oil', bonus: 3.9, icon: '🛢️', region: 'Токио', reserve: 626.9, area: 1650.5, depth: 2624 },
    { id: 'tokyo_2', name: 'Токио-2 (газ)', lat: 36.1617, lon: 140.0843, type: 'gas', bonus: 2.1, icon: '⛽', region: 'Токио', reserve: 267.3, area: 2018.3, depth: 1507 },
    { id: 'tokyo_3', name: 'Токио-3 (нефть)', lat: 36.248, lon: 139.8989, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Токио', reserve: 654.4, area: 1144.0, depth: 5459 },
    { id: 'tokyo_4', name: 'Токио-4 (нефть)', lat: 35.6162, lon: 139.3004, type: 'oil', bonus: 2.5, icon: '🛢️', region: 'Токио', reserve: 129.7, area: 1722.2, depth: 1173 },
    { id: 'tokyo_5', name: 'Токио-5 (газ)', lat: 35.7796, lon: 140.3081, type: 'gas', bonus: 3.2, icon: '⛽', region: 'Токио', reserve: 397.5, area: 1397.9, depth: 1294 },
    { id: 'tokyo_6', name: 'Токио-6 (газ)', lat: 35.9203, lon: 140.0185, type: 'gas', bonus: 2.8, icon: '⛽', region: 'Токио', reserve: 477.3, area: 800.1, depth: 3925 },
    { id: 'newyork_1', name: 'Нью-Йорк-1 (газ)', lat: 40.9023, lon: -74.4675, type: 'gas', bonus: 3.7, icon: '⛽', region: 'Нью-Йорк', reserve: 633.4, area: 1191.9, depth: 2423 },
    { id: 'newyork_2', name: 'Нью-Йорк-2 (нефть)', lat: 40.857, lon: -74.3162, type: 'oil', bonus: 3.4, icon: '🛢️', region: 'Нью-Йорк', reserve: 414.5, area: 605.7, depth: 3903 },
    { id: 'newyork_3', name: 'Нью-Йорк-3 (нефть)', lat: 40.652, lon: -74.3383, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Нью-Йорк', reserve: 759.6, area: 210.6, depth: 1535 },
    { id: 'newyork_4', name: 'Нью-Йорк-4 (нефть)', lat: 40.5477, lon: -73.8165, type: 'oil', bonus: 2.0, icon: '🛢️', region: 'Нью-Йорк', reserve: 355.6, area: 833.9, depth: 4116 },
    { id: 'newyork_5', name: 'Нью-Йорк-5 (газ)', lat: 41.1951, lon: -73.746, type: 'gas', bonus: 2.5, icon: '⛽', region: 'Нью-Йорк', reserve: 655.5, area: 2365.7, depth: 460 },
    { id: 'newyork_6', name: 'Нью-Йорк-6 (газ)', lat: 40.1418, lon: -73.9008, type: 'gas', bonus: 2.2, icon: '⛽', region: 'Нью-Йорк', reserve: 334.5, area: 2230.2, depth: 3732 },
    { id: 'newyork_7', name: 'Нью-Йорк-7 (нефть)', lat: 40.4379, lon: -73.9834, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Нью-Йорк', reserve: 333.6, area: 1675.5, depth: 3612 },
    { id: 'losangeles_1', name: 'Лос-Анджелес-1 (нефть)', lat: 34.3536, lon: -118.8134, type: 'oil', bonus: 4.0, icon: '🛢️', region: 'Лос-Анджелес', reserve: 456.3, area: 2268.3, depth: 5148 },
    { id: 'losangeles_2', name: 'Лос-Анджелес-2 (нефть)', lat: 34.3463, lon: -118.0317, type: 'oil', bonus: 3.7, icon: '🛢️', region: 'Лос-Анджелес', reserve: 158.6, area: 657.8, depth: 2981 },
    { id: 'losangeles_3', name: 'Лос-Анджелес-3 (нефть)', lat: 33.7603, lon: -118.1377, type: 'oil', bonus: 3.7, icon: '🛢️', region: 'Лос-Анджелес', reserve: 240.1, area: 2378.5, depth: 3753 },
    { id: 'losangeles_4', name: 'Лос-Анджелес-4 (газ)', lat: 34.2339, lon: -118.6158, type: 'gas', bonus: 3.4, icon: '⛽', region: 'Лос-Анджелес', reserve: 49.0, area: 2380.3, depth: 2136 },
    { id: 'losangeles_5', name: 'Лос-Анджелес-5 (нефть)', lat: 34.1364, lon: -118.7647, type: 'oil', bonus: 3.4, icon: '🛢️', region: 'Лос-Анджелес', reserve: 807.4, area: 506.4, depth: 466 },
    { id: 'losangeles_6', name: 'Лос-Анджелес-6 (нефть)', lat: 34.0761, lon: -117.8029, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Лос-Анджелес', reserve: 805.9, area: 1167.9, depth: 2399 },
    { id: 'losangeles_7', name: 'Лос-Анджелес-7 (газ)', lat: 34.259, lon: -117.7958, type: 'gas', bonus: 3.4, icon: '⛽', region: 'Лос-Анджелес', reserve: 101.8, area: 2050.1, depth: 2848 },
    { id: 'houston_1', name: 'Хьюстон-1 (нефть)', lat: 30.1289, lon: -95.5736, type: 'oil', bonus: 3.8, icon: '🛢️', region: 'Хьюстон', reserve: 322.1, area: 2354.3, depth: 1924 },
    { id: 'houston_2', name: 'Хьюстон-2 (нефть)', lat: 29.3215, lon: -95.7, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Хьюстон', reserve: 594.1, area: 760.9, depth: 5218 },
    { id: 'houston_3', name: 'Хьюстон-3 (нефть)', lat: 29.8759, lon: -95.8166, type: 'oil', bonus: 1.6, icon: '🛢️', region: 'Хьюстон', reserve: 455.2, area: 1657.2, depth: 864 },
    { id: 'houston_4', name: 'Хьюстон-4 (газ)', lat: 30.098, lon: -95.339, type: 'gas', bonus: 2.7, icon: '⛽', region: 'Хьюстон', reserve: 371.3, area: 911.8, depth: 4066 },
    { id: 'houston_5', name: 'Хьюстон-5 (нефть)', lat: 29.3187, lon: -95.1519, type: 'oil', bonus: 3.9, icon: '🛢️', region: 'Хьюстон', reserve: 233.2, area: 2022.4, depth: 4708 },
    { id: 'mumbai_1', name: 'Мумбаи-1 (газ)', lat: 18.6397, lon: 73.0796, type: 'gas', bonus: 2.2, icon: '⛽', region: 'Мумбаи', reserve: 724.7, area: 2078.5, depth: 1009 },
    { id: 'mumbai_2', name: 'Мумбаи-2 (газ)', lat: 19.2712, lon: 72.6939, type: 'gas', bonus: 2.7, icon: '⛽', region: 'Мумбаи', reserve: 520.7, area: 953.7, depth: 535 },
    { id: 'mumbai_3', name: 'Мумбаи-3 (газ)', lat: 19.2174, lon: 72.6824, type: 'gas', bonus: 2.0, icon: '⛽', region: 'Мумбаи', reserve: 679.2, area: 857.4, depth: 5183 },
    { id: 'mumbai_4', name: 'Мумбаи-4 (газ)', lat: 18.7208, lon: 72.741, type: 'gas', bonus: 2.0, icon: '⛽', region: 'Мумбаи', reserve: 208.9, area: 1022.0, depth: 4848 },
    { id: 'mumbai_5', name: 'Мумбаи-5 (нефть)', lat: 18.9194, lon: 72.4458, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Мумбаи', reserve: 675.0, area: 241.7, depth: 2115 },
    { id: 'mumbai_6', name: 'Мумбаи-6 (газ)', lat: 18.9771, lon: 72.5956, type: 'gas', bonus: 3.0, icon: '⛽', region: 'Мумбаи', reserve: 404.9, area: 1332.0, depth: 3785 },
    { id: 'cairo_1', name: 'Каир-1 (газ)', lat: 29.8286, lon: 31.5682, type: 'gas', bonus: 2.3, icon: '⛽', region: 'Каир', reserve: 199.8, area: 1806.0, depth: 2884 },
    { id: 'cairo_2', name: 'Каир-2 (нефть)', lat: 30.0142, lon: 30.5731, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Каир', reserve: 166.9, area: 1849.1, depth: 2565 },
    { id: 'cairo_3', name: 'Каир-3 (газ)', lat: 30.5608, lon: 31.166, type: 'gas', bonus: 2.2, icon: '⛽', region: 'Каир', reserve: 309.9, area: 762.6, depth: 4675 },
    { id: 'cairo_4', name: 'Каир-4 (нефть)', lat: 29.9505, lon: 31.9118, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Каир', reserve: 594.3, area: 324.4, depth: 4321 },
    { id: 'cairo_5', name: 'Каир-5 (нефть)', lat: 30.3246, lon: 30.9017, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Каир', reserve: 377.2, area: 469.1, depth: 720 },
    { id: 'cairo_6', name: 'Каир-6 (газ)', lat: 30.3802, lon: 31.0874, type: 'gas', bonus: 3.6, icon: '⛽', region: 'Каир', reserve: 343.6, area: 194.5, depth: 5456 },
    { id: 'cairo_7', name: 'Каир-7 (нефть)', lat: 30.3382, lon: 31.7251, type: 'oil', bonus: 3.9, icon: '🛢️', region: 'Каир', reserve: 77.0, area: 628.0, depth: 4871 },
    { id: 'lagos_1', name: 'Лагос-1 (нефть)', lat: 6.5016, lon: 3.071, type: 'oil', bonus: 3.8, icon: '🛢️', region: 'Лагос', reserve: 256.3, area: 1475.4, depth: 3812 },
    { id: 'lagos_2', name: 'Лагос-2 (газ)', lat: 6.2891, lon: 3.3155, type: 'gas', bonus: 3.9, icon: '⛽', region: 'Лагос', reserve: 88.9, area: 1909.2, depth: 5424 },
    { id: 'lagos_3', name: 'Лагос-3 (нефть)', lat: 6.4329, lon: 3.5769, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Лагос', reserve: 471.4, area: 399.8, depth: 3646 },
    { id: 'lagos_4', name: 'Лагос-4 (газ)', lat: 6.3156, lon: 3.0523, type: 'gas', bonus: 1.6, icon: '⛽', region: 'Лагос', reserve: 248.4, area: 714.0, depth: 4019 },
    { id: 'lagos_5', name: 'Лагос-5 (нефть)', lat: 6.2331, lon: 2.8641, type: 'oil', bonus: 3.5, icon: '🛢️', region: 'Лагос', reserve: 533.2, area: 1656.3, depth: 1920 },
    { id: 'lagos_6', name: 'Лагос-6 (газ)', lat: 6.6386, lon: 3.5569, type: 'gas', bonus: 1.9, icon: '⛽', region: 'Лагос', reserve: 229.5, area: 364.2, depth: 788 },
    { id: 'saopaulo_1', name: 'Сан-Паулу-1 (газ)', lat: -23.9808, lon: -46.9495, type: 'gas', bonus: 3.8, icon: '⛽', region: 'Сан-Паулу', reserve: 376.1, area: 1177.1, depth: 2791 },
    { id: 'saopaulo_2', name: 'Сан-Паулу-2 (газ)', lat: -23.1989, lon: -46.7743, type: 'gas', bonus: 2.7, icon: '⛽', region: 'Сан-Паулу', reserve: 73.0, area: 109.3, depth: 3839 },
    { id: 'saopaulo_3', name: 'Сан-Паулу-3 (газ)', lat: -23.6785, lon: -46.7369, type: 'gas', bonus: 2.1, icon: '⛽', region: 'Сан-Паулу', reserve: 574.8, area: 2152.7, depth: 5109 },
    { id: 'saopaulo_4', name: 'Сан-Паулу-4 (нефть)', lat: -23.0975, lon: -46.6313, type: 'oil', bonus: 2.2, icon: '🛢️', region: 'Сан-Паулу', reserve: 39.0, area: 1893.1, depth: 4154 },
    { id: 'saopaulo_5', name: 'Сан-Паулу-5 (газ)', lat: -23.3498, lon: -46.7572, type: 'gas', bonus: 3.0, icon: '⛽', region: 'Сан-Паулу', reserve: 541.4, area: 1234.4, depth: 1047 },
    { id: 'buenosaires_1', name: 'Буэнос-Айрес-1 (газ)', lat: -34.847, lon: -58.1852, type: 'gas', bonus: 1.8, icon: '⛽', region: 'Буэнос-Айрес', reserve: 140.9, area: 1035.0, depth: 4358 },
    { id: 'buenosaires_2', name: 'Буэнос-Айрес-2 (газ)', lat: -34.7724, lon: -58.7221, type: 'gas', bonus: 3.4, icon: '⛽', region: 'Буэнос-Айрес', reserve: 36.0, area: 229.3, depth: 2367 },
    { id: 'buenosaires_3', name: 'Буэнос-Айрес-3 (газ)', lat: -34.2286, lon: -57.9776, type: 'gas', bonus: 3.7, icon: '⛽', region: 'Буэнос-Айрес', reserve: 702.1, area: 12.9, depth: 4744 },
    { id: 'buenosaires_4', name: 'Буэнос-Айрес-4 (газ)', lat: -34.8004, lon: -58.2323, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Буэнос-Айрес', reserve: 644.2, area: 1567.3, depth: 722 },
    { id: 'buenosaires_5', name: 'Буэнос-Айрес-5 (нефть)', lat: -34.6224, lon: -58.1276, type: 'oil', bonus: 2.2, icon: '🛢️', region: 'Буэнос-Айрес', reserve: 749.3, area: 1216.9, depth: 536 },
    { id: 'buenosaires_6', name: 'Буэнос-Айрес-6 (нефть)', lat: -34.6725, lon: -58.7209, type: 'oil', bonus: 1.5, icon: '🛢️', region: 'Буэнос-Айрес', reserve: 349.8, area: 569.5, depth: 1229 },
    { id: 'sydney_1', name: 'Сидней-1 (нефть)', lat: -34.0014, lon: 150.9986, type: 'oil', bonus: 3.8, icon: '🛢️', region: 'Сидней', reserve: 251.6, area: 1766.5, depth: 3703 },
    { id: 'sydney_2', name: 'Сидней-2 (газ)', lat: -33.6123, lon: 151.1713, type: 'gas', bonus: 2.9, icon: '⛽', region: 'Сидней', reserve: 329.1, area: 2305.5, depth: 4463 },
    { id: 'sydney_3', name: 'Сидней-3 (нефть)', lat: -33.6899, lon: 150.9609, type: 'oil', bonus: 3.5, icon: '🛢️', region: 'Сидней', reserve: 355.6, area: 2336.3, depth: 4459 },
    { id: 'sydney_4', name: 'Сидней-4 (газ)', lat: -33.7511, lon: 150.9083, type: 'gas', bonus: 2.2, icon: '⛽', region: 'Сидней', reserve: 501.0, area: 2497.3, depth: 4311 },
    { id: 'sydney_5', name: 'Сидней-5 (нефть)', lat: -34.2174, lon: 151.3561, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Сидней', reserve: 649.6, area: 949.3, depth: 2936 },
    { id: 'sydney_6', name: 'Сидней-6 (нефть)', lat: -33.6144, lon: 151.1726, type: 'oil', bonus: 2.5, icon: '🛢️', region: 'Сидней', reserve: 728.3, area: 1032.8, depth: 2906 },
    { id: 'novosibirsk_1', name: 'Новосибирск-1 (газ)', lat: 54.9234, lon: 82.2764, type: 'gas', bonus: 2.5, icon: '⛽', region: 'Новосибирск', reserve: 565.8, area: 2053.7, depth: 1546 },
    { id: 'novosibirsk_2', name: 'Новосибирск-2 (газ)', lat: 55.1707, lon: 82.8649, type: 'gas', bonus: 3.9, icon: '⛽', region: 'Новосибирск', reserve: 285.5, area: 259.9, depth: 3906 },
    { id: 'novosibirsk_3', name: 'Новосибирск-3 (нефть)', lat: 54.7735, lon: 82.8464, type: 'oil', bonus: 3.3, icon: '🛢️', region: 'Новосибирск', reserve: 351.4, area: 1640.4, depth: 1564 },
    { id: 'novosibirsk_4', name: 'Новосибирск-4 (нефть)', lat: 54.5988, lon: 83.066, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Новосибирск', reserve: 590.3, area: 1628.1, depth: 2991 },
    { id: 'novosibirsk_5', name: 'Новосибирск-5 (газ)', lat: 55.3362, lon: 82.7616, type: 'gas', bonus: 3.7, icon: '⛽', region: 'Новосибирск', reserve: 417.3, area: 1357.1, depth: 5358 },
    { id: 'ekaterinburg_1', name: 'Екатеринбург-1 (нефть)', lat: 56.5532, lon: 60.0333, type: 'oil', bonus: 4.0, icon: '🛢️', region: 'Екатеринбург', reserve: 636.0, area: 1090.6, depth: 1106 },
    { id: 'ekaterinburg_2', name: 'Екатеринбург-2 (нефть)', lat: 56.5183, lon: 60.8172, type: 'oil', bonus: 3.8, icon: '🛢️', region: 'Екатеринбург', reserve: 43.9, area: 1992.4, depth: 2703 },
    { id: 'ekaterinburg_3', name: 'Екатеринбург-3 (газ)', lat: 56.7334, lon: 60.7953, type: 'gas', bonus: 2.8, icon: '⛽', region: 'Екатеринбург', reserve: 483.2, area: 1983.4, depth: 1692 },
    { id: 'kazan_1', name: 'Казань-1 (нефть)', lat: 55.6093, lon: 48.8559, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Казань', reserve: 425.5, area: 1462.1, depth: 2202 },
    { id: 'kazan_2', name: 'Казань-2 (газ)', lat: 55.6211, lon: 48.7664, type: 'gas', bonus: 3.2, icon: '⛽', region: 'Казань', reserve: 764.6, area: 1168.5, depth: 2656 },
    { id: 'kazan_3', name: 'Казань-3 (нефть)', lat: 56.1753, lon: 49.463, type: 'oil', bonus: 4.0, icon: '🛢️', region: 'Казань', reserve: 257.8, area: 2405.5, depth: 2348 },
    { id: 'samara_1', name: 'Самара-1 (газ)', lat: 53.2736, lon: 50.5219, type: 'gas', bonus: 2.7, icon: '⛽', region: 'Самара', reserve: 205.4, area: 1434.1, depth: 5008 },
    { id: 'samara_2', name: 'Самара-2 (газ)', lat: 53.4031, lon: 50.1344, type: 'gas', bonus: 3.9, icon: '⛽', region: 'Самара', reserve: 561.2, area: 693.5, depth: 4936 },
    { id: 'samara_3', name: 'Самара-3 (нефть)', lat: 53.5054, lon: 49.8292, type: 'oil', bonus: 3.6, icon: '🛢️', region: 'Самара', reserve: 768.0, area: 1941.6, depth: 2185 },
    { id: 'samara_4', name: 'Самара-4 (газ)', lat: 53.2322, lon: 50.4228, type: 'gas', bonus: 2.1, icon: '⛽', region: 'Самара', reserve: 643.5, area: 1921.0, depth: 1420 },
    { id: 'ufa_1', name: 'Уфа-1 (нефть)', lat: 55.008, lon: 55.6477, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Уфа', reserve: 377.5, area: 1453.1, depth: 1376 },
    { id: 'ufa_2', name: 'Уфа-2 (нефть)', lat: 54.9207, lon: 55.7703, type: 'oil', bonus: 2.5, icon: '🛢️', region: 'Уфа', reserve: 174.7, area: 1968.4, depth: 3297 },
    { id: 'ufa_3', name: 'Уфа-3 (газ)', lat: 54.832, lon: 55.6821, type: 'gas', bonus: 3.6, icon: '⛽', region: 'Уфа', reserve: 412.2, area: 2018.2, depth: 3074 },
    { id: 'ufa_4', name: 'Уфа-4 (нефть)', lat: 54.6161, lon: 56.0133, type: 'oil', bonus: 3.4, icon: '🛢️', region: 'Уфа', reserve: 195.6, area: 1694.0, depth: 3555 },
    { id: 'ufa_5', name: 'Уфа-5 (газ)', lat: 54.9408, lon: 56.1917, type: 'gas', bonus: 2.2, icon: '⛽', region: 'Уфа', reserve: 109.4, area: 927.8, depth: 2447 },
    { id: 'chelyabinsk_1', name: 'Челябинск-1 (газ)', lat: 55.3486, lon: 60.7253, type: 'gas', bonus: 1.8, icon: '⛽', region: 'Челябинск', reserve: 202.6, area: 72.3, depth: 4899 },
    { id: 'chelyabinsk_2', name: 'Челябинск-2 (газ)', lat: 55.3129, lon: 61.2423, type: 'gas', bonus: 1.7, icon: '⛽', region: 'Челябинск', reserve: 701.2, area: 2274.4, depth: 2775 },
    { id: 'chelyabinsk_3', name: 'Челябинск-3 (газ)', lat: 55.2461, lon: 61.5357, type: 'gas', bonus: 1.6, icon: '⛽', region: 'Челябинск', reserve: 846.6, area: 299.1, depth: 2223 },
    { id: 'chelyabinsk_4', name: 'Челябинск-4 (нефть)', lat: 54.9841, lon: 61.6591, type: 'oil', bonus: 3.9, icon: '🛢️', region: 'Челябинск', reserve: 593.5, area: 1355.1, depth: 5111 },
    { id: 'chelyabinsk_5', name: 'Челябинск-5 (нефть)', lat: 55.4075, lon: 61.02, type: 'oil', bonus: 3.6, icon: '🛢️', region: 'Челябинск', reserve: 525.2, area: 2348.2, depth: 2591 },
    { id: 'omsk_1', name: 'Омск-1 (газ)', lat: 55.0422, lon: 73.8062, type: 'gas', bonus: 2.1, icon: '⛽', region: 'Омск', reserve: 311.5, area: 2452.5, depth: 3309 },
    { id: 'omsk_2', name: 'Омск-2 (газ)', lat: 55.1725, lon: 73.4972, type: 'gas', bonus: 3.9, icon: '⛽', region: 'Омск', reserve: 806.9, area: 2062.2, depth: 1050 },
    { id: 'omsk_3', name: 'Омск-3 (нефть)', lat: 54.7956, lon: 72.9514, type: 'oil', bonus: 1.6, icon: '🛢️', region: 'Омск', reserve: 669.8, area: 616.5, depth: 1331 },
    { id: 'krasnoyarsk_1', name: 'Красноярск-1 (нефть)', lat: 56.3442, lon: 93.1449, type: 'oil', bonus: 2.0, icon: '🛢️', region: 'Красноярск', reserve: 187.5, area: 2175.5, depth: 2991 },
    { id: 'krasnoyarsk_2', name: 'Красноярск-2 (нефть)', lat: 56.0842, lon: 92.3342, type: 'oil', bonus: 2.2, icon: '🛢️', region: 'Красноярск', reserve: 836.5, area: 2468.9, depth: 4725 },
    { id: 'krasnoyarsk_3', name: 'Красноярск-3 (газ)', lat: 56.0516, lon: 92.6337, type: 'gas', bonus: 3.7, icon: '⛽', region: 'Красноярск', reserve: 116.4, area: 902.0, depth: 2249 },
    { id: 'krasnoyarsk_4', name: 'Красноярск-4 (газ)', lat: 56.2019, lon: 92.9042, type: 'gas', bonus: 1.8, icon: '⛽', region: 'Красноярск', reserve: 360.7, area: 293.0, depth: 820 },
    { id: 'krasnoyarsk_5', name: 'Красноярск-5 (газ)', lat: 55.7952, lon: 92.9995, type: 'gas', bonus: 3.0, icon: '⛽', region: 'Красноярск', reserve: 386.9, area: 561.7, depth: 5338 },
    { id: 'perm_1', name: 'Пермь-1 (газ)', lat: 57.5877, lon: 56.4652, type: 'gas', bonus: 1.7, icon: '⛽', region: 'Пермь', reserve: 409.7, area: 1010.0, depth: 1184 },
    { id: 'perm_2', name: 'Пермь-2 (газ)', lat: 57.9503, lon: 55.7816, type: 'gas', bonus: 3.7, icon: '⛽', region: 'Пермь', reserve: 277.2, area: 379.4, depth: 1333 },
    { id: 'perm_3', name: 'Пермь-3 (газ)', lat: 57.7935, lon: 55.8448, type: 'gas', bonus: 3.3, icon: '⛽', region: 'Пермь', reserve: 326.9, area: 1497.5, depth: 2715 },
    { id: 'voronezh_1', name: 'Воронеж-1 (газ)', lat: 51.9507, lon: 39.5052, type: 'gas', bonus: 3.6, icon: '⛽', region: 'Воронеж', reserve: 555.0, area: 1924.7, depth: 2061 },
    { id: 'voronezh_2', name: 'Воронеж-2 (газ)', lat: 51.4983, lon: 39.267, type: 'gas', bonus: 2.3, icon: '⛽', region: 'Воронеж', reserve: 388.2, area: 1045.8, depth: 1078 },
    { id: 'voronezh_3', name: 'Воронеж-3 (газ)', lat: 51.3718, lon: 39.4183, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Воронеж', reserve: 134.0, area: 2308.2, depth: 849 },
    { id: 'voronezh_4', name: 'Воронеж-4 (нефть)', lat: 51.7352, lon: 38.9938, type: 'oil', bonus: 1.7, icon: '🛢️', region: 'Воронеж', reserve: 629.3, area: 2031.3, depth: 4857 },
    { id: 'warsaw_1', name: 'Варшава-1 (газ)', lat: 52.1126, lon: 20.6612, type: 'gas', bonus: 3.7, icon: '⛽', region: 'Варшава', reserve: 800.3, area: 1063.1, depth: 721 },
    { id: 'warsaw_2', name: 'Варшава-2 (газ)', lat: 52.0499, lon: 20.7952, type: 'gas', bonus: 2.9, icon: '⛽', region: 'Варшава', reserve: 184.8, area: 1645.3, depth: 2137 },
    { id: 'warsaw_3', name: 'Варшава-3 (нефть)', lat: 52.0566, lon: 21.399, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Варшава', reserve: 240.4, area: 573.1, depth: 3815 },
    { id: 'rome_1', name: 'Рим-1 (нефть)', lat: 41.6442, lon: 12.2193, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Рим', reserve: 29.5, area: 690.4, depth: 2831 },
    { id: 'rome_2', name: 'Рим-2 (газ)', lat: 41.8031, lon: 12.6769, type: 'gas', bonus: 1.9, icon: '⛽', region: 'Рим', reserve: 560.5, area: 183.3, depth: 5486 },
    { id: 'rome_3', name: 'Рим-3 (нефть)', lat: 42.1395, lon: 12.7092, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Рим', reserve: 388.3, area: 401.9, depth: 2852 },
    { id: 'rome_4', name: 'Рим-4 (газ)', lat: 41.9501, lon: 12.1044, type: 'gas', bonus: 1.7, icon: '⛽', region: 'Рим', reserve: 49.5, area: 402.0, depth: 5361 },
    { id: 'rome_5', name: 'Рим-5 (нефть)', lat: 41.8102, lon: 12.2671, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Рим', reserve: 415.4, area: 1110.7, depth: 2537 },
    { id: 'madrid_1', name: 'Мадрид-1 (нефть)', lat: 40.3419, lon: -3.5493, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Мадрид', reserve: 506.2, area: 1322.1, depth: 2826 },
    { id: 'madrid_2', name: 'Мадрид-2 (нефть)', lat: 40.5019, lon: -3.1261, type: 'oil', bonus: 1.6, icon: '🛢️', region: 'Мадрид', reserve: 177.7, area: 2363.9, depth: 1424 },
    { id: 'madrid_3', name: 'Мадрид-3 (газ)', lat: 40.3852, lon: -3.5192, type: 'gas', bonus: 2.7, icon: '⛽', region: 'Мадрид', reserve: 368.9, area: 331.7, depth: 4662 },
    { id: 'amsterdam_1', name: 'Амстердам-1 (нефть)', lat: 51.9783, lon: 4.8989, type: 'oil', bonus: 3.5, icon: '🛢️', region: 'Амстердам', reserve: 65.9, area: 2155.8, depth: 646 },
    { id: 'amsterdam_2', name: 'Амстердам-2 (газ)', lat: 52.7895, lon: 4.9813, type: 'gas', bonus: 3.7, icon: '⛽', region: 'Амстердам', reserve: 491.5, area: 1437.8, depth: 3721 },
    { id: 'amsterdam_3', name: 'Амстердам-3 (газ)', lat: 52.4504, lon: 5.0164, type: 'gas', bonus: 2.3, icon: '⛽', region: 'Амстердам', reserve: 682.1, area: 1549.1, depth: 3264 },
    { id: 'amsterdam_4', name: 'Амстердам-4 (нефть)', lat: 52.2436, lon: 4.9869, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Амстердам', reserve: 343.4, area: 205.8, depth: 2841 },
    { id: 'amsterdam_5', name: 'Амстердам-5 (газ)', lat: 52.4362, lon: 5.5007, type: 'gas', bonus: 1.7, icon: '⛽', region: 'Амстердам', reserve: 540.1, area: 1331.2, depth: 1888 },
    { id: 'vienna_1', name: 'Вена-1 (газ)', lat: 48.1552, lon: 15.7957, type: 'gas', bonus: 3.5, icon: '⛽', region: 'Вена', reserve: 204.6, area: 374.6, depth: 1916 },
    { id: 'vienna_2', name: 'Вена-2 (нефть)', lat: 47.9171, lon: 16.0404, type: 'oil', bonus: 3.1, icon: '🛢️', region: 'Вена', reserve: 154.7, area: 1934.4, depth: 4347 },
    { id: 'vienna_3', name: 'Вена-3 (газ)', lat: 48.2202, lon: 15.8211, type: 'gas', bonus: 2.6, icon: '⛽', region: 'Вена', reserve: 785.9, area: 1415.6, depth: 5416 },
    { id: 'vienna_4', name: 'Вена-4 (газ)', lat: 48.4202, lon: 16.0088, type: 'gas', bonus: 1.9, icon: '⛽', region: 'Вена', reserve: 62.7, area: 1111.1, depth: 2780 },
    { id: 'stockholm_1', name: 'Стокгольм-1 (нефть)', lat: 59.2547, lon: 18.268, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Стокгольм', reserve: 36.8, area: 928.2, depth: 2651 },
    { id: 'stockholm_2', name: 'Стокгольм-2 (нефть)', lat: 59.0583, lon: 17.3863, type: 'oil', bonus: 1.7, icon: '🛢️', region: 'Стокгольм', reserve: 507.0, area: 967.4, depth: 5054 },
    { id: 'stockholm_3', name: 'Стокгольм-3 (нефть)', lat: 58.9655, lon: 18.3035, type: 'oil', bonus: 3.1, icon: '🛢️', region: 'Стокгольм', reserve: 276.7, area: 1194.3, depth: 1535 },
    { id: 'stockholm_4', name: 'Стокгольм-4 (нефть)', lat: 58.9646, lon: 18.3002, type: 'oil', bonus: 3.6, icon: '🛢️', region: 'Стокгольм', reserve: 835.1, area: 220.0, depth: 1713 },
    { id: 'oslo_1', name: 'Осло-1 (нефть)', lat: 59.7924, lon: 9.8901, type: 'oil', bonus: 2.8, icon: '🛢️', region: 'Осло', reserve: 520.3, area: 916.1, depth: 2617 },
    { id: 'oslo_2', name: 'Осло-2 (газ)', lat: 59.7265, lon: 10.9863, type: 'gas', bonus: 3.0, icon: '⛽', region: 'Осло', reserve: 671.9, area: 1621.8, depth: 839 },
    { id: 'oslo_3', name: 'Осло-3 (газ)', lat: 60.1897, lon: 11.1266, type: 'gas', bonus: 2.2, icon: '⛽', region: 'Осло', reserve: 616.6, area: 1644.8, depth: 5237 },
    { id: 'toronto_1', name: 'Торонто-1 (газ)', lat: 43.9396, lon: -79.155, type: 'gas', bonus: 3.8, icon: '⛽', region: 'Торонто', reserve: 267.1, area: 1643.6, depth: 3510 },
    { id: 'toronto_2', name: 'Торонто-2 (нефть)', lat: 43.2958, lon: -79.7128, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Торонто', reserve: 323.3, area: 1981.2, depth: 1346 },
    { id: 'toronto_3', name: 'Торонто-3 (нефть)', lat: 43.4991, lon: -79.6524, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Торонто', reserve: 311.4, area: 458.9, depth: 2054 },
    { id: 'chicago_1', name: 'Чикаго-1 (газ)', lat: 42.0404, lon: -87.0653, type: 'gas', bonus: 1.9, icon: '⛽', region: 'Чикаго', reserve: 254.9, area: 1972.4, depth: 4458 },
    { id: 'chicago_2', name: 'Чикаго-2 (нефть)', lat: 41.6662, lon: -88.0948, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Чикаго', reserve: 509.7, area: 394.1, depth: 1781 },
    { id: 'chicago_3', name: 'Чикаго-3 (нефть)', lat: 41.8592, lon: -87.7823, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Чикаго', reserve: 613.0, area: 2424.3, depth: 5301 },
    { id: 'chicago_4', name: 'Чикаго-4 (газ)', lat: 41.8856, lon: -88.1327, type: 'gas', bonus: 2.1, icon: '⛽', region: 'Чикаго', reserve: 207.1, area: 2414.3, depth: 4142 },
    { id: 'dallas_1', name: 'Даллас-1 (газ)', lat: 32.6495, lon: -97.1208, type: 'gas', bonus: 2.6, icon: '⛽', region: 'Даллас', reserve: 655.2, area: 1947.5, depth: 4419 },
    { id: 'dallas_2', name: 'Даллас-2 (газ)', lat: 33.1573, lon: -96.8966, type: 'gas', bonus: 3.5, icon: '⛽', region: 'Даллас', reserve: 121.9, area: 632.5, depth: 4236 },
    { id: 'dallas_3', name: 'Даллас-3 (газ)', lat: 32.652, lon: -96.8543, type: 'gas', bonus: 3.6, icon: '⛽', region: 'Даллас', reserve: 724.2, area: 719.8, depth: 1613 },
    { id: 'tehran_1', name: 'Тегеран-1 (газ)', lat: 35.8155, lon: 51.2854, type: 'gas', bonus: 2.6, icon: '⛽', region: 'Тегеран', reserve: 804.7, area: 562.9, depth: 3995 },
    { id: 'tehran_2', name: 'Тегеран-2 (газ)', lat: 35.9122, lon: 51.2623, type: 'gas', bonus: 2.5, icon: '⛽', region: 'Тегеран', reserve: 321.0, area: 971.6, depth: 968 },
    { id: 'tehran_3', name: 'Тегеран-3 (газ)', lat: 35.7237, lon: 51.6471, type: 'gas', bonus: 1.7, icon: '⛽', region: 'Тегеран', reserve: 608.9, area: 844.9, depth: 1496 },
    { id: 'tehran_4', name: 'Тегеран-4 (нефть)', lat: 36.099, lon: 51.5136, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Тегеран', reserve: 707.3, area: 1899.5, depth: 4142 },
    { id: 'baghdad_1', name: 'Багдад-1 (нефть)', lat: 33.4285, lon: 44.3288, type: 'oil', bonus: 2.0, icon: '🛢️', region: 'Багдад', reserve: 131.3, area: 2351.2, depth: 5287 },
    { id: 'baghdad_2', name: 'Багдад-2 (газ)', lat: 33.4938, lon: 44.5546, type: 'gas', bonus: 2.3, icon: '⛽', region: 'Багдад', reserve: 45.3, area: 1055.4, depth: 5402 },
    { id: 'baghdad_3', name: 'Багдад-3 (газ)', lat: 33.7026, lon: 44.5808, type: 'gas', bonus: 2.7, icon: '⛽', region: 'Багдад', reserve: 458.0, area: 1583.6, depth: 5010 },
    { id: 'baghdad_4', name: 'Багдад-4 (нефть)', lat: 33.3003, lon: 44.163, type: 'oil', bonus: 1.5, icon: '🛢️', region: 'Багдад', reserve: 303.1, area: 1431.0, depth: 1834 },
    { id: 'kuwait_1', name: 'Эль-Кувейт-1 (нефть)', lat: 29.1462, lon: 47.9418, type: 'oil', bonus: 3.9, icon: '🛢️', region: 'Эль-Кувейт', reserve: 464.7, area: 1968.2, depth: 4458 },
    { id: 'kuwait_2', name: 'Эль-Кувейт-2 (нефть)', lat: 29.1657, lon: 48.1728, type: 'oil', bonus: 3.1, icon: '🛢️', region: 'Эль-Кувейт', reserve: 834.0, area: 641.6, depth: 433 },
    { id: 'kuwait_3', name: 'Эль-Кувейт-3 (газ)', lat: 29.4229, lon: 47.7342, type: 'gas', bonus: 3.3, icon: '⛽', region: 'Эль-Кувейт', reserve: 535.9, area: 1931.0, depth: 3023 },
    { id: 'kuwait_4', name: 'Эль-Кувейт-4 (нефть)', lat: 29.6499, lon: 48.0719, type: 'oil', bonus: 3.5, icon: '🛢️', region: 'Эль-Кувейт', reserve: 153.0, area: 1950.1, depth: 4106 },
    { id: 'kuwait_5', name: 'Эль-Кувейт-5 (газ)', lat: 29.1102, lon: 47.6555, type: 'gas', bonus: 1.7, icon: '⛽', region: 'Эль-Кувейт', reserve: 660.9, area: 1149.6, depth: 2703 },
    { id: 'doha_1', name: 'Доха-1 (нефть)', lat: 25.3947, lon: 51.0916, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Доха', reserve: 267.0, area: 1001.6, depth: 4748 },
    { id: 'doha_2', name: 'Доха-2 (газ)', lat: 25.2824, lon: 51.9321, type: 'gas', bonus: 2.0, icon: '⛽', region: 'Доха', reserve: 306.6, area: 1954.3, depth: 3019 },
    { id: 'doha_3', name: 'Доха-3 (газ)', lat: 25.4523, lon: 51.7083, type: 'gas', bonus: 3.7, icon: '⛽', region: 'Доха', reserve: 633.1, area: 2237.6, depth: 3467 },
    { id: 'abudhabi_1', name: 'Абу-Даби-1 (нефть)', lat: 24.1759, lon: 54.3872, type: 'oil', bonus: 3.8, icon: '🛢️', region: 'Абу-Даби', reserve: 443.8, area: 2004.9, depth: 3777 },
    { id: 'abudhabi_2', name: 'Абу-Даби-2 (нефть)', lat: 24.0437, lon: 54.588, type: 'oil', bonus: 2.0, icon: '🛢️', region: 'Абу-Даби', reserve: 253.2, area: 265.5, depth: 2986 },
    { id: 'abudhabi_3', name: 'Абу-Даби-3 (газ)', lat: 24.3419, lon: 54.7003, type: 'gas', bonus: 2.6, icon: '⛽', region: 'Абу-Даби', reserve: 587.9, area: 885.4, depth: 646 },
    { id: 'abudhabi_4', name: 'Абу-Даби-4 (газ)', lat: 24.2606, lon: 54.197, type: 'gas', bonus: 3.1, icon: '⛽', region: 'Абу-Даби', reserve: 673.8, area: 152.8, depth: 3627 },
    { id: 'karachi_1', name: 'Карачи-1 (нефть)', lat: 25.0034, lon: 66.9617, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Карачи', reserve: 665.2, area: 96.6, depth: 850 },
    { id: 'karachi_2', name: 'Карачи-2 (нефть)', lat: 24.9007, lon: 66.7625, type: 'oil', bonus: 2.5, icon: '🛢️', region: 'Карачи', reserve: 484.3, area: 1516.7, depth: 3985 },
    { id: 'karachi_3', name: 'Карачи-3 (газ)', lat: 24.6054, lon: 67.3014, type: 'gas', bonus: 2.9, icon: '⛽', region: 'Карачи', reserve: 452.4, area: 1001.1, depth: 2583 },
    { id: 'karachi_4', name: 'Карачи-4 (нефть)', lat: 24.9657, lon: 66.9805, type: 'oil', bonus: 2.0, icon: '🛢️', region: 'Карачи', reserve: 442.5, area: 2284.7, depth: 1264 },
    { id: 'jakarta_1', name: 'Джакарта-1 (газ)', lat: -6.2599, lon: 106.6812, type: 'gas', bonus: 3.0, icon: '⛽', region: 'Джакарта', reserve: 591.4, area: 2496.6, depth: 1939 },
    { id: 'jakarta_2', name: 'Джакарта-2 (нефть)', lat: -6.1272, lon: 106.9454, type: 'oil', bonus: 1.9, icon: '🛢️', region: 'Джакарта', reserve: 607.8, area: 2493.2, depth: 2918 },
    { id: 'jakarta_3', name: 'Джакарта-3 (газ)', lat: -6.2836, lon: 106.5652, type: 'gas', bonus: 2.2, icon: '⛽', region: 'Джакарта', reserve: 258.5, area: 402.2, depth: 1726 },
    { id: 'jakarta_4', name: 'Джакарта-4 (газ)', lat: -6.3523, lon: 106.8421, type: 'gas', bonus: 2.0, icon: '⛽', region: 'Джакарта', reserve: 122.4, area: 1978.0, depth: 515 },
    { id: 'bangkok_1', name: 'Бангкок-1 (газ)', lat: 13.3152, lon: 100.613, type: 'gas', bonus: 1.8, icon: '⛽', region: 'Бангкок', reserve: 752.2, area: 173.7, depth: 3561 },
    { id: 'bangkok_2', name: 'Бангкок-2 (газ)', lat: 13.3856, lon: 100.4589, type: 'gas', bonus: 3.6, icon: '⛽', region: 'Бангкок', reserve: 67.3, area: 2431.2, depth: 907 },
    { id: 'bangkok_3', name: 'Бангкок-3 (газ)', lat: 13.4754, lon: 100.5816, type: 'gas', bonus: 1.8, icon: '⛽', region: 'Бангкок', reserve: 705.6, area: 1382.7, depth: 5115 },
    { id: 'bangkok_4', name: 'Бангкок-4 (нефть)', lat: 13.7662, lon: 100.3715, type: 'oil', bonus: 2.8, icon: '🛢️', region: 'Бангкок', reserve: 738.6, area: 2080.2, depth: 4544 },
    { id: 'seoul_1', name: 'Сеул-1 (газ)', lat: 37.6788, lon: 127.2109, type: 'gas', bonus: 3.3, icon: '⛽', region: 'Сеул', reserve: 297.4, area: 2352.9, depth: 2626 },
    { id: 'seoul_2', name: 'Сеул-2 (нефть)', lat: 37.5688, lon: 127.3866, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Сеул', reserve: 110.8, area: 764.0, depth: 4670 },
    { id: 'seoul_3', name: 'Сеул-3 (нефть)', lat: 37.411, lon: 126.9768, type: 'oil', bonus: 3.9, icon: '🛢️', region: 'Сеул', reserve: 135.3, area: 1650.2, depth: 5257 },
    { id: 'singapore_1', name: 'Сингапур-1 (нефть)', lat: 1.4001, lon: 103.7221, type: 'oil', bonus: 1.6, icon: '🛢️', region: 'Сингапур', reserve: 547.0, area: 1446.2, depth: 2026 },
    { id: 'singapore_2', name: 'Сингапур-2 (газ)', lat: 1.2685, lon: 103.7452, type: 'gas', bonus: 3.7, icon: '⛽', region: 'Сингапур', reserve: 466.0, area: 1608.3, depth: 2774 },
    { id: 'singapore_3', name: 'Сингапур-3 (газ)', lat: 1.3623, lon: 104.2025, type: 'gas', bonus: 2.5, icon: '⛽', region: 'Сингапур', reserve: 388.2, area: 1724.6, depth: 1594 },
    { id: 'singapore_4', name: 'Сингапур-4 (газ)', lat: 1.1235, lon: 103.9528, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Сингапур', reserve: 126.4, area: 2155.1, depth: 2915 },
    { id: 'johannesburg_1', name: 'Йоханнесбург-1 (газ)', lat: -26.056, lon: 28.015, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Йоханнесбург', reserve: 479.6, area: 804.6, depth: 4121 },
    { id: 'johannesburg_2', name: 'Йоханнесбург-2 (нефть)', lat: -26.2205, lon: 28.2469, type: 'oil', bonus: 1.7, icon: '🛢️', region: 'Йоханнесбург', reserve: 250.2, area: 966.5, depth: 5341 },
    { id: 'johannesburg_3', name: 'Йоханнесбург-3 (газ)', lat: -26.1956, lon: 28.489, type: 'gas', bonus: 1.9, icon: '⛽', region: 'Йоханнесбург', reserve: 281.7, area: 1448.4, depth: 2861 },
    { id: 'johannesburg_4', name: 'Йоханнесбург-4 (нефть)', lat: -26.1774, lon: 27.7352, type: 'oil', bonus: 2.8, icon: '🛢️', region: 'Йоханнесбург', reserve: 426.5, area: 778.3, depth: 489 },
    { id: 'johannesburg_5', name: 'Йоханнесбург-5 (нефть)', lat: -25.9393, lon: 27.9359, type: 'oil', bonus: 3.9, icon: '🛢️', region: 'Йоханнесбург', reserve: 186.8, area: 888.7, depth: 714 },
    { id: 'nairobi_1', name: 'Найроби-1 (газ)', lat: -1.6131, lon: 36.5928, type: 'gas', bonus: 3.2, icon: '⛽', region: 'Найроби', reserve: 246.5, area: 30.4, depth: 1180 },
    { id: 'nairobi_2', name: 'Найроби-2 (газ)', lat: -1.1617, lon: 36.9636, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Найроби', reserve: 345.7, area: 122.7, depth: 719 },
    { id: 'nairobi_3', name: 'Найроби-3 (нефть)', lat: -1.4206, lon: 36.9729, type: 'oil', bonus: 2.5, icon: '🛢️', region: 'Найроби', reserve: 385.5, area: 1379.1, depth: 5405 },
    { id: 'nairobi_4', name: 'Найроби-4 (нефть)', lat: -1.1976, lon: 36.9168, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Найроби', reserve: 838.8, area: 1399.0, depth: 3295 },
    { id: 'casablanca_1', name: 'Касабланка-1 (нефть)', lat: 33.3977, lon: -7.7933, type: 'oil', bonus: 1.6, icon: '🛢️', region: 'Касабланка', reserve: 37.9, area: 1786.8, depth: 4180 },
    { id: 'casablanca_2', name: 'Касабланка-2 (газ)', lat: 33.8347, lon: -7.2212, type: 'gas', bonus: 1.8, icon: '⛽', region: 'Касабланка', reserve: 792.0, area: 803.1, depth: 3519 },
    { id: 'casablanca_3', name: 'Касабланка-3 (газ)', lat: 33.3592, lon: -7.8051, type: 'gas', bonus: 2.8, icon: '⛽', region: 'Касабланка', reserve: 418.9, area: 1411.7, depth: 4190 },
    { id: 'lima_1', name: 'Лима-1 (газ)', lat: -12.1176, lon: -76.9166, type: 'gas', bonus: 2.5, icon: '⛽', region: 'Лима', reserve: 265.0, area: 2247.9, depth: 5454 },
    { id: 'lima_2', name: 'Лима-2 (нефть)', lat: -12.2083, lon: -77.1528, type: 'oil', bonus: 3.1, icon: '🛢️', region: 'Лима', reserve: 826.4, area: 1450.4, depth: 2164 },
    { id: 'lima_3', name: 'Лима-3 (нефть)', lat: -12.1882, lon: -77.1218, type: 'oil', bonus: 3.1, icon: '🛢️', region: 'Лима', reserve: 528.7, area: 2104.5, depth: 1510 },
    { id: 'bogota_1', name: 'Богота-1 (нефть)', lat: 5.1334, lon: -73.9846, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Богота', reserve: 21.0, area: 791.1, depth: 1540 },
    { id: 'bogota_2', name: 'Богота-2 (газ)', lat: 4.621, lon: -74.2976, type: 'gas', bonus: 3.4, icon: '⛽', region: 'Богота', reserve: 782.8, area: 2183.3, depth: 810 },
    { id: 'bogota_3', name: 'Богота-3 (нефть)', lat: 4.4157, lon: -74.1048, type: 'oil', bonus: 4.0, icon: '🛢️', region: 'Богота', reserve: 409.2, area: 948.3, depth: 1718 },
    { id: 'bogota_4', name: 'Богота-4 (газ)', lat: 4.8972, lon: -74.1857, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Богота', reserve: 657.3, area: 1805.1, depth: 2465 },
    { id: 'bogota_5', name: 'Богота-5 (газ)', lat: 4.7761, lon: -73.8953, type: 'gas', bonus: 2.9, icon: '⛽', region: 'Богота', reserve: 195.0, area: 2432.5, depth: 2738 },
    { id: 'santiago_1', name: 'Сантьяго-1 (нефть)', lat: -33.5494, lon: -70.9723, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Сантьяго', reserve: 478.6, area: 2336.9, depth: 2540 },
    { id: 'santiago_2', name: 'Сантьяго-2 (газ)', lat: -33.2072, lon: -70.3902, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Сантьяго', reserve: 833.2, area: 2047.8, depth: 1499 },
    { id: 'santiago_3', name: 'Сантьяго-3 (газ)', lat: -33.0307, lon: -70.534, type: 'gas', bonus: 1.7, icon: '⛽', region: 'Сантьяго', reserve: 785.8, area: 1643.4, depth: 4224 },
    { id: 'santiago_4', name: 'Сантьяго-4 (нефть)', lat: -33.3644, lon: -70.3398, type: 'oil', bonus: 3.8, icon: '🛢️', region: 'Сантьяго', reserve: 593.3, area: 351.8, depth: 5343 },
    { id: 'melbourne_1', name: 'Мельбурн-1 (нефть)', lat: -37.7942, lon: 145.3828, type: 'oil', bonus: 2.8, icon: '🛢️', region: 'Мельбурн', reserve: 544.1, area: 140.7, depth: 3685 },
    { id: 'melbourne_2', name: 'Мельбурн-2 (газ)', lat: -37.8375, lon: 144.7925, type: 'gas', bonus: 3.4, icon: '⛽', region: 'Мельбурн', reserve: 9.4, area: 1380.4, depth: 1593 },
    { id: 'melbourne_3', name: 'Мельбурн-3 (газ)', lat: -38.0439, lon: 144.5365, type: 'gas', bonus: 2.7, icon: '⛽', region: 'Мельбурн', reserve: 554.7, area: 1892.2, depth: 2653 },
    { id: 'melbourne_4', name: 'Мельбурн-4 (газ)', lat: -37.8366, lon: 145.109, type: 'gas', bonus: 3.4, icon: '⛽', region: 'Мельбурн', reserve: 556.2, area: 588.2, depth: 605 },
    { id: 'melbourne_5', name: 'Мельбурн-5 (нефть)', lat: -38.152, lon: 145.2055, type: 'oil', bonus: 3.8, icon: '🛢️', region: 'Мельбурн', reserve: 35.7, area: 2092.1, depth: 4358 },
    { id: 'perth_1', name: 'Перт-1 (газ)', lat: -31.8762, lon: 115.7749, type: 'gas', bonus: 2.9, icon: '⛽', region: 'Перт', reserve: 95.7, area: 2457.7, depth: 2631 },
    { id: 'perth_2', name: 'Перт-2 (газ)', lat: -31.6605, lon: 115.8366, type: 'gas', bonus: 2.7, icon: '⛽', region: 'Перт', reserve: 798.1, area: 2129.1, depth: 4134 },
    { id: 'perth_3', name: 'Перт-3 (газ)', lat: -31.901, lon: 116.0138, type: 'gas', bonus: 1.9, icon: '⛽', region: 'Перт', reserve: 392.8, area: 650.6, depth: 1825 },
    { id: 'tyumen_1', name: 'Тюмень-1 (газ)', lat: 57.2091, lon: 65.1139, type: 'gas', bonus: 3.4, icon: '⛽', region: 'Тюмень', reserve: 153.3, area: 2141.8, depth: 3621 },
    { id: 'tyumen_2', name: 'Тюмень-2 (газ)', lat: 57.0471, lon: 65.5117, type: 'gas', bonus: 3.2, icon: '⛽', region: 'Тюмень', reserve: 161.1, area: 360.1, depth: 2950 },
    { id: 'surgut_1', name: 'Сургут-1 (нефть)', lat: 61.2403, lon: 73.6978, type: 'oil', bonus: 3.4, icon: '🛢️', region: 'Сургут', reserve: 811.2, area: 761.8, depth: 4993 },
    { id: 'surgut_2', name: 'Сургут-2 (нефть)', lat: 61.2372, lon: 73.7672, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Сургут', reserve: 569.3, area: 1168.8, depth: 1608 },
    { id: 'noyabrsk_1', name: 'Ноябрьск-1 (газ)', lat: 63.0975, lon: 74.9292, type: 'gas', bonus: 3.9, icon: '⛽', region: 'Ноябрьск', reserve: 315.6, area: 559.9, depth: 1394 },
    { id: 'noyabrsk_2', name: 'Ноябрьск-2 (газ)', lat: 63.3511, lon: 75.9629, type: 'gas', bonus: 3.0, icon: '⛽', region: 'Ноябрьск', reserve: 356.4, area: 1377.6, depth: 4157 },
    { id: 'noyabrsk_3', name: 'Ноябрьск-3 (нефть)', lat: 63.2096, lon: 74.867, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Ноябрьск', reserve: 670.3, area: 1318.5, depth: 4626 },
    { id: 'nefteyugansk_1', name: 'Нефтеюганск-1 (нефть)', lat: 61.1957, lon: 72.4866, type: 'oil', bonus: 3.6, icon: '🛢️', region: 'Нефтеюганск', reserve: 767.9, area: 513.4, depth: 4696 },
    { id: 'nefteyugansk_2', name: 'Нефтеюганск-2 (нефть)', lat: 61.2589, lon: 73.1524, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Нефтеюганск', reserve: 579.8, area: 1795.1, depth: 4304 },
    { id: 'nefteyugansk_3', name: 'Нефтеюганск-3 (нефть)', lat: 61.2612, lon: 72.3541, type: 'oil', bonus: 1.6, icon: '🛢️', region: 'Нефтеюганск', reserve: 116.5, area: 1044.4, depth: 4919 },
    { id: 'nizhnevartovsk_1', name: 'Нижневартовск-1 (газ)', lat: 60.8639, lon: 76.2728, type: 'gas', bonus: 1.6, icon: '⛽', region: 'Нижневартовск', reserve: 220.0, area: 17.5, depth: 2085 },
    { id: 'nizhnevartovsk_2', name: 'Нижневартовск-2 (нефть)', lat: 61.1061, lon: 76.67, type: 'oil', bonus: 1.7, icon: '🛢️', region: 'Нижневартовск', reserve: 845.0, area: 2337.1, depth: 865 },
    { id: 'orenburg_1', name: 'Оренбург-1 (нефть)', lat: 51.7403, lon: 55.3022, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Оренбург', reserve: 547.1, area: 1825.9, depth: 3743 },
    { id: 'orenburg_2', name: 'Оренбург-2 (газ)', lat: 51.9531, lon: 55.0867, type: 'gas', bonus: 3.7, icon: '⛽', region: 'Оренбург', reserve: 771.2, area: 945.4, depth: 4717 },
    { id: 'orenburg_3', name: 'Оренбург-3 (нефть)', lat: 51.6709, lon: 54.869, type: 'oil', bonus: 1.9, icon: '🛢️', region: 'Оренбург', reserve: 459.0, area: 1326.8, depth: 2124 },
    { id: 'saratov_1', name: 'Саратов-1 (нефть)', lat: 51.7331, lon: 45.9856, type: 'oil', bonus: 3.3, icon: '🛢️', region: 'Саратов', reserve: 363.4, area: 954.4, depth: 2181 },
    { id: 'saratov_2', name: 'Саратов-2 (нефть)', lat: 51.4118, lon: 46.078, type: 'oil', bonus: 2.0, icon: '🛢️', region: 'Саратов', reserve: 744.6, area: 1916.1, depth: 563 },
    { id: 'astrakhan_1', name: 'Астрахань-1 (нефть)', lat: 46.3558, lon: 48.182, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Астрахань', reserve: 382.2, area: 1683.3, depth: 698 },
    { id: 'astrakhan_2', name: 'Астрахань-2 (нефть)', lat: 46.3388, lon: 47.7672, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Астрахань', reserve: 188.6, area: 2160.7, depth: 762 },
    { id: 'astrakhan_3', name: 'Астрахань-3 (нефть)', lat: 46.1919, lon: 48.0344, type: 'oil', bonus: 3.5, icon: '🛢️', region: 'Астрахань', reserve: 623.1, area: 804.1, depth: 5198 },
    { id: 'volgograd_1', name: 'Волгоград-1 (нефть)', lat: 48.6721, lon: 44.6804, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Волгоград', reserve: 191.8, area: 758.2, depth: 799 },
    { id: 'volgograd_2', name: 'Волгоград-2 (нефть)', lat: 48.5727, lon: 44.2994, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Волгоград', reserve: 826.6, area: 2354.6, depth: 3422 },
    { id: 'volgograd_3', name: 'Волгоград-3 (газ)', lat: 48.647, lon: 44.238, type: 'gas', bonus: 2.2, icon: '⛽', region: 'Волгоград', reserve: 160.4, area: 1349.4, depth: 2274 },
    { id: 'krasnodar_1', name: 'Краснодар-1 (газ)', lat: 45.1144, lon: 38.8486, type: 'gas', bonus: 2.7, icon: '⛽', region: 'Краснодар', reserve: 53.7, area: 1037.6, depth: 3712 },
    { id: 'krasnodar_2', name: 'Краснодар-2 (нефть)', lat: 44.9263, lon: 39.1159, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Краснодар', reserve: 71.8, area: 1130.0, depth: 3339 },
    { id: 'stavropol_1', name: 'Ставрополь-1 (нефть)', lat: 45.2124, lon: 42.0519, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Ставрополь', reserve: 38.4, area: 191.2, depth: 5113 },
    { id: 'stavropol_2', name: 'Ставрополь-2 (нефть)', lat: 44.7279, lon: 42.0275, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Ставрополь', reserve: 813.7, area: 48.2, depth: 1856 },
    { id: 'makhachkala_1', name: 'Махачкала-1 (газ)', lat: 43.21, lon: 47.3125, type: 'gas', bonus: 3.3, icon: '⛽', region: 'Махачкала', reserve: 340.2, area: 605.9, depth: 2934 },
    { id: 'makhachkala_2', name: 'Махачкала-2 (газ)', lat: 42.816, lon: 47.7087, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Махачкала', reserve: 226.0, area: 1286.9, depth: 4373 },
    { id: 'grozny_1', name: 'Грозный-1 (нефть)', lat: 43.4096, lon: 45.3426, type: 'oil', bonus: 3.4, icon: '🛢️', region: 'Грозный', reserve: 275.6, area: 515.8, depth: 2863 },
    { id: 'grozny_2', name: 'Грозный-2 (газ)', lat: 43.6205, lon: 45.822, type: 'gas', bonus: 3.4, icon: '⛽', region: 'Грозный', reserve: 18.7, area: 1387.7, depth: 5084 },
    { id: 'grozny_3', name: 'Грозный-3 (газ)', lat: 43.2827, lon: 45.8755, type: 'gas', bonus: 2.1, icon: '⛽', region: 'Грозный', reserve: 486.5, area: 621.9, depth: 4810 },
    { id: 'baku_1', name: 'Баку-1 (газ)', lat: 40.4278, lon: 49.5926, type: 'gas', bonus: 3.3, icon: '⛽', region: 'Баку', reserve: 630.0, area: 1157.5, depth: 3185 },
    { id: 'baku_2', name: 'Баку-2 (нефть)', lat: 40.5551, lon: 50.1002, type: 'oil', bonus: 2.0, icon: '🛢️', region: 'Баку', reserve: 756.5, area: 2475.9, depth: 781 },
    { id: 'baku_3', name: 'Баку-3 (нефть)', lat: 40.4631, lon: 49.7586, type: 'oil', bonus: 3.5, icon: '🛢️', region: 'Баку', reserve: 46.0, area: 25.9, depth: 1426 },
    { id: 'almaty_1', name: 'Алматы-1 (нефть)', lat: 43.2381, lon: 76.8408, type: 'oil', bonus: 2.8, icon: '🛢️', region: 'Алматы', reserve: 320.4, area: 1548.4, depth: 5350 },
    { id: 'almaty_2', name: 'Алматы-2 (газ)', lat: 43.2145, lon: 76.8526, type: 'gas', bonus: 2.8, icon: '⛽', region: 'Алматы', reserve: 352.6, area: 51.6, depth: 2550 },
    { id: 'astana_1', name: 'Астана-1 (нефть)', lat: 50.9116, lon: 71.444, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Астана', reserve: 799.1, area: 456.4, depth: 1089 },
    { id: 'astana_2', name: 'Астана-2 (нефть)', lat: 51.194, lon: 71.8439, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Астана', reserve: 304.5, area: 1989.4, depth: 947 },
    { id: 'astana_3', name: 'Астана-3 (газ)', lat: 51.3773, lon: 71.3677, type: 'gas', bonus: 2.1, icon: '⛽', region: 'Астана', reserve: 594.2, area: 756.9, depth: 960 },
    { id: 'tashkent_1', name: 'Ташкент-1 (нефть)', lat: 41.1494, lon: 69.3757, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Ташкент', reserve: 543.1, area: 1760.1, depth: 977 },
    { id: 'tashkent_2', name: 'Ташкент-2 (газ)', lat: 41.4433, lon: 68.9606, type: 'gas', bonus: 2.3, icon: '⛽', region: 'Ташкент', reserve: 830.8, area: 2434.9, depth: 4626 },
    { id: 'ashgabat_1', name: 'Ашхабад-1 (нефть)', lat: 38.0255, lon: 58.767, type: 'oil', bonus: 3.7, icon: '🛢️', region: 'Ашхабад', reserve: 406.8, area: 125.9, depth: 909 },
    { id: 'ashgabat_2', name: 'Ашхабад-2 (газ)', lat: 38.1372, lon: 58.2059, type: 'gas', bonus: 1.6, icon: '⛽', region: 'Ашхабад', reserve: 789.8, area: 793.1, depth: 1997 },
    { id: 'atyrau_1', name: 'Атырау-1 (газ)', lat: 47.255, lon: 51.8179, type: 'gas', bonus: 2.9, icon: '⛽', region: 'Атырау', reserve: 483.9, area: 2125.1, depth: 4728 },
    { id: 'atyrau_2', name: 'Атырау-2 (газ)', lat: 46.9015, lon: 52.194, type: 'gas', bonus: 3.5, icon: '⛽', region: 'Атырау', reserve: 587.5, area: 205.3, depth: 3133 },
    { id: 'aktau_1', name: 'Актау-1 (нефть)', lat: 43.3672, lon: 51.3331, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Актау', reserve: 654.8, area: 2387.6, depth: 3549 },
    { id: 'aktau_2', name: 'Актау-2 (газ)', lat: 43.8011, lon: 51.2093, type: 'gas', bonus: 4.0, icon: '⛽', region: 'Актау', reserve: 419.6, area: 896.0, depth: 3375 },
    { id: 'aberdeen_1', name: 'Абердин-1 (нефть)', lat: 57.0395, lon: -2.5406, type: 'oil', bonus: 1.7, icon: '🛢️', region: 'Абердин', reserve: 527.7, area: 1997.2, depth: 902 },
    { id: 'aberdeen_2', name: 'Абердин-2 (нефть)', lat: 57.1294, lon: -1.7755, type: 'oil', bonus: 3.5, icon: '🛢️', region: 'Абердин', reserve: 135.4, area: 980.2, depth: 3254 },
    { id: 'aberdeen_3', name: 'Абердин-3 (нефть)', lat: 57.4308, lon: -1.7745, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Абердин', reserve: 648.3, area: 264.6, depth: 1015 },
    { id: 'stavanger_1', name: 'Ставангер-1 (газ)', lat: 58.752, lon: 5.8708, type: 'gas', bonus: 2.5, icon: '⛽', region: 'Ставангер', reserve: 27.2, area: 891.2, depth: 1062 },
    { id: 'stavanger_2', name: 'Ставангер-2 (газ)', lat: 59.0246, lon: 5.6079, type: 'gas', bonus: 2.5, icon: '⛽', region: 'Ставангер', reserve: 663.4, area: 1814.9, depth: 4883 },
    { id: 'abuja_1', name: 'Абуджа-1 (нефть)', lat: 9.0203, lon: 7.283, type: 'oil', bonus: 2.2, icon: '🛢️', region: 'Абуджа', reserve: 231.8, area: 373.4, depth: 1669 },
    { id: 'abuja_2', name: 'Абуджа-2 (газ)', lat: 9.0439, lon: 7.5608, type: 'gas', bonus: 3.5, icon: '⛽', region: 'Абуджа', reserve: 310.2, area: 2361.1, depth: 5420 },
    { id: 'portharco_1', name: 'Порт-Харкорт-1 (нефть)', lat: 4.6575, lon: 7.0406, type: 'oil', bonus: 1.5, icon: '🛢️', region: 'Порт-Харкорт', reserve: 339.4, area: 2105.6, depth: 3412 },
    { id: 'portharco_2', name: 'Порт-Харкорт-2 (газ)', lat: 4.5874, lon: 7.0822, type: 'gas', bonus: 3.6, icon: '⛽', region: 'Порт-Харкорт', reserve: 555.1, area: 1490.0, depth: 2761 },
    { id: 'portharco_3', name: 'Порт-Харкорт-3 (газ)', lat: 4.5566, lon: 6.8477, type: 'gas', bonus: 2.7, icon: '⛽', region: 'Порт-Харкорт', reserve: 155.1, area: 1001.6, depth: 2914 },
    { id: 'warri_1', name: 'Варри-1 (газ)', lat: 5.8052, lon: 5.6912, type: 'gas', bonus: 2.3, icon: '⛽', region: 'Варри', reserve: 241.9, area: 1966.8, depth: 3290 },
    { id: 'warri_2', name: 'Варри-2 (нефть)', lat: 5.6419, lon: 5.6943, type: 'oil', bonus: 4.0, icon: '🛢️', region: 'Варри', reserve: 157.0, area: 1921.4, depth: 520 },
    { id: 'warri_3', name: 'Варри-3 (газ)', lat: 5.6479, lon: 5.7019, type: 'gas', bonus: 3.5, icon: '⛽', region: 'Варри', reserve: 707.4, area: 182.2, depth: 3651 },
    { id: 'tripoli_1', name: 'Триполи-1 (нефть)', lat: 32.8027, lon: 13.0514, type: 'oil', bonus: 3.1, icon: '🛢️', region: 'Триполи', reserve: 609.4, area: 1974.8, depth: 905 },
    { id: 'tripoli_2', name: 'Триполи-2 (газ)', lat: 33.109, lon: 13.1654, type: 'gas', bonus: 2.5, icon: '⛽', region: 'Триполи', reserve: 433.1, area: 2301.8, depth: 3726 },
    { id: 'tripoli_3', name: 'Триполи-3 (нефть)', lat: 32.9448, lon: 12.976, type: 'oil', bonus: 3.7, icon: '🛢️', region: 'Триполи', reserve: 458.7, area: 1599.1, depth: 996 },
    { id: 'benghazi_1', name: 'Бенгази-1 (нефть)', lat: 32.0235, lon: 19.8964, type: 'oil', bonus: 3.1, icon: '🛢️', region: 'Бенгази', reserve: 42.4, area: 2459.2, depth: 3573 },
    { id: 'benghazi_2', name: 'Бенгази-2 (газ)', lat: 32.3117, lon: 20.0205, type: 'gas', bonus: 1.5, icon: '⛽', region: 'Бенгази', reserve: 223.6, area: 1281.6, depth: 4549 },
    { id: 'algiers_1', name: 'Алжир-1 (газ)', lat: 36.5958, lon: 3.2419, type: 'gas', bonus: 3.2, icon: '⛽', region: 'Алжир', reserve: 588.4, area: 385.4, depth: 501 },
    { id: 'algiers_2', name: 'Алжир-2 (газ)', lat: 36.8923, lon: 3.2066, type: 'gas', bonus: 3.9, icon: '⛽', region: 'Алжир', reserve: 103.1, area: 2352.3, depth: 1460 },
    { id: 'abadan_1', name: 'Абадан-1 (газ)', lat: 30.179, lon: 48.5819, type: 'gas', bonus: 2.8, icon: '⛽', region: 'Абадан', reserve: 299.3, area: 253.1, depth: 4006 },
    { id: 'abadan_2', name: 'Абадан-2 (газ)', lat: 30.424, lon: 48.3437, type: 'gas', bonus: 3.3, icon: '⛽', region: 'Абадан', reserve: 24.1, area: 864.3, depth: 1195 },
    { id: 'abadan_3', name: 'Абадан-3 (нефть)', lat: 30.5932, lon: 48.1618, type: 'oil', bonus: 2.8, icon: '🛢️', region: 'Абадан', reserve: 471.4, area: 834.2, depth: 3792 },
    { id: 'ahvaz_city_1', name: 'Ахваз-1 (нефть)', lat: 31.3939, lon: 48.3904, type: 'oil', bonus: 2.0, icon: '🛢️', region: 'Ахваз', reserve: 560.4, area: 995.0, depth: 5330 },
    { id: 'ahvaz_city_2', name: 'Ахваз-2 (нефть)', lat: 31.1338, lon: 48.7415, type: 'oil', bonus: 1.5, icon: '🛢️', region: 'Ахваз', reserve: 186.5, area: 703.1, depth: 812 },
    { id: 'ahvaz_city_3', name: 'Ахваз-3 (нефть)', lat: 31.3888, lon: 48.4193, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Ахваз', reserve: 171.5, area: 293.7, depth: 4309 },
    { id: 'kirkuk_city_1', name: 'Киркук-1 (газ)', lat: 35.2875, lon: 44.2015, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Киркук', reserve: 719.5, area: 1547.2, depth: 2736 },
    { id: 'kirkuk_city_2', name: 'Киркук-2 (нефть)', lat: 35.3926, lon: 44.2117, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Киркук', reserve: 103.8, area: 939.5, depth: 1458 },
    { id: 'kirkuk_city_3', name: 'Киркук-3 (газ)', lat: 35.3679, lon: 44.4607, type: 'gas', bonus: 2.5, icon: '⛽', region: 'Киркук', reserve: 162.0, area: 1592.4, depth: 1719 },
    { id: 'basra_1', name: 'Басра-1 (газ)', lat: 30.4785, lon: 47.967, type: 'gas', bonus: 3.6, icon: '⛽', region: 'Басра', reserve: 528.4, area: 2165.2, depth: 378 },
    { id: 'basra_2', name: 'Басра-2 (газ)', lat: 30.7063, lon: 48.0835, type: 'gas', bonus: 3.9, icon: '⛽', region: 'Басра', reserve: 432.1, area: 1242.5, depth: 4328 },
    { id: 'maracaibo_1', name: 'Маракайбо-1 (газ)', lat: 10.5279, lon: -71.6326, type: 'gas', bonus: 1.6, icon: '⛽', region: 'Маракайбо', reserve: 648.1, area: 737.3, depth: 2551 },
    { id: 'maracaibo_2', name: 'Маракайбо-2 (нефть)', lat: 10.5081, lon: -71.6699, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Маракайбо', reserve: 632.4, area: 1917.1, depth: 4803 },
    { id: 'maracaibo_3', name: 'Маракайбо-3 (нефть)', lat: 10.4933, lon: -71.7084, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Маракайбо', reserve: 842.3, area: 1359.7, depth: 640 },
    { id: 'calgary_1', name: 'Калгари-1 (нефть)', lat: 51.1574, lon: -114.081, type: 'oil', bonus: 3.6, icon: '🛢️', region: 'Калгари', reserve: 639.9, area: 751.3, depth: 564 },
    { id: 'calgary_2', name: 'Калгари-2 (газ)', lat: 51.0248, lon: -113.574, type: 'gas', bonus: 1.7, icon: '⛽', region: 'Калгари', reserve: 736.2, area: 302.3, depth: 2241 },
    { id: 'calgary_3', name: 'Калгари-3 (нефть)', lat: 51.1389, lon: -114.4225, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Калгари', reserve: 605.6, area: 1585.6, depth: 1659 },
    { id: 'edmonton_1', name: 'Эдмонтон-1 (нефть)', lat: 53.6656, lon: -113.9513, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Эдмонтон', reserve: 454.8, area: 1496.2, depth: 1679 },
    { id: 'edmonton_2', name: 'Эдмонтон-2 (газ)', lat: 53.7076, lon: -113.5252, type: 'gas', bonus: 2.9, icon: '⛽', region: 'Эдмонтон', reserve: 809.8, area: 1290.9, depth: 1080 },
    { id: 'midland_1', name: 'Мидленд-1 (газ)', lat: 32.2936, lon: -102.2804, type: 'gas', bonus: 3.7, icon: '⛽', region: 'Мидленд', reserve: 112.2, area: 2166.5, depth: 2345 },
    { id: 'midland_2', name: 'Мидленд-2 (нефть)', lat: 31.9171, lon: -102.4276, type: 'oil', bonus: 3.4, icon: '🛢️', region: 'Мидленд', reserve: 576.4, area: 1228.8, depth: 5030 },
    { id: 'novy_urengoy_1', name: 'Новый Уренгой-1 (газ)', lat: 66.0339, lon: 76.7934, type: 'gas', bonus: 3.5, icon: '⛽', region: 'Новый Уренгой', reserve: 654.7, area: 1013.1, depth: 2579 },
    { id: 'novy_urengoy_2', name: 'Новый Уренгой-2 (газ)', lat: 65.9383, lon: 76.7822, type: 'gas', bonus: 3.0, icon: '⛽', region: 'Новый Уренгой', reserve: 739.2, area: 2119.4, depth: 1063 },
    { id: 'nadym_1', name: 'Надым-1 (газ)', lat: 65.653, lon: 72.1117, type: 'gas', bonus: 2.5, icon: '⛽', region: 'Надым', reserve: 823.1, area: 2063.9, depth: 4352 },
    { id: 'nadym_2', name: 'Надым-2 (газ)', lat: 65.4828, lon: 72.7511, type: 'gas', bonus: 2.9, icon: '⛽', region: 'Надым', reserve: 115.4, area: 2132.5, depth: 3115 },
    { id: 'salekhard_1', name: 'Салехард-1 (нефть)', lat: 66.6976, lon: 66.904, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Салехард', reserve: 110.0, area: 2145.6, depth: 3915 },
    { id: 'kogalym_1', name: 'Когалым-1 (нефть)', lat: 62.3954, lon: 74.4651, type: 'oil', bonus: 4.0, icon: '🛢️', region: 'Когалым', reserve: 773.4, area: 2206.5, depth: 2772 },
    { id: 'kogalym_2', name: 'Когалым-2 (нефть)', lat: 62.4187, lon: 74.1365, type: 'oil', bonus: 1.7, icon: '🛢️', region: 'Когалым', reserve: 309.6, area: 215.2, depth: 1655 },
    { id: 'langepas_1', name: 'Лангепас-1 (газ)', lat: 61.1125, lon: 74.902, type: 'gas', bonus: 3.4, icon: '⛽', region: 'Лангепас', reserve: 367.7, area: 237.1, depth: 1079 },
    { id: 'megion_1', name: 'Мегион-1 (нефть)', lat: 60.9543, lon: 76.1329, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Мегион', reserve: 579.6, area: 33.1, depth: 3114 },
    { id: 'pyt_yakh_1', name: 'Пыть-Ях-1 (газ)', lat: 60.6999, lon: 72.5304, type: 'gas', bonus: 2.1, icon: '⛽', region: 'Пыть-Ях', reserve: 80.5, area: 2016.8, depth: 1145 },
    { id: 'raduzhny_1', name: 'Радужный-1 (газ)', lat: 62.1968, lon: 77.3573, type: 'gas', bonus: 3.4, icon: '⛽', region: 'Радужный', reserve: 641.4, area: 341.5, depth: 1470 },
    { id: 'raduzhny_2', name: 'Радужный-2 (нефть)', lat: 62.0893, lon: 77.4489, type: 'oil', bonus: 3.1, icon: '🛢️', region: 'Радужный', reserve: 376.9, area: 1808.9, depth: 5445 },
    { id: 'usinsk_1', name: 'Усинск-1 (газ)', lat: 65.8867, lon: 57.3132, type: 'gas', bonus: 2.0, icon: '⛽', region: 'Усинск', reserve: 762.6, area: 358.6, depth: 1308 },
    { id: 'pechora_1', name: 'Печора-1 (газ)', lat: 65.2599, lon: 57.1585, type: 'gas', bonus: 1.8, icon: '⛽', region: 'Печора', reserve: 239.0, area: 219.8, depth: 4833 },
    { id: 'pechora_2', name: 'Печора-2 (газ)', lat: 65.184, lon: 56.7798, type: 'gas', bonus: 3.6, icon: '⛽', region: 'Печора', reserve: 561.4, area: 761.1, depth: 4541 },
    { id: 'ukhta_1', name: 'Ухта-1 (газ)', lat: 63.5528, lon: 53.8113, type: 'gas', bonus: 3.7, icon: '⛽', region: 'Ухта', reserve: 811.7, area: 1242.3, depth: 1223 },
    { id: 'buzuluk_1', name: 'Бузулук-1 (газ)', lat: 52.7485, lon: 52.179, type: 'gas', bonus: 3.7, icon: '⛽', region: 'Бузулук', reserve: 15.2, area: 909.1, depth: 2892 },
    { id: 'almetyevsk_1', name: 'Альметьевск-1 (газ)', lat: 55.005, lon: 52.0816, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Альметьевск', reserve: 582.1, area: 1909.2, depth: 897 },
    { id: 'neftekamsk_1', name: 'Нефтекамск-1 (нефть)', lat: 56.1828, lon: 54.2745, type: 'oil', bonus: 3.8, icon: '🛢️', region: 'Нефтекамск', reserve: 806.6, area: 1001.0, depth: 2646 },
    { id: 'oktyabrsky_1', name: 'Октябрьский-1 (газ)', lat: 54.4602, lon: 53.3608, type: 'gas', bonus: 2.8, icon: '⛽', region: 'Октябрьский', reserve: 525.6, area: 700.9, depth: 2838 },
    { id: 'oktyabrsky_2', name: 'Октябрьский-2 (нефть)', lat: 54.3896, lon: 53.4589, type: 'oil', bonus: 3.5, icon: '🛢️', region: 'Октябрьский', reserve: 458.2, area: 982.9, depth: 5496 },
    { id: 'tuapse_1', name: 'Туапсе-1 (газ)', lat: 44.0379, lon: 38.8211, type: 'gas', bonus: 3.6, icon: '⛽', region: 'Туапсе', reserve: 53.9, area: 224.7, depth: 3859 },
    { id: 'novorossiysk_1', name: 'Новороссийск-1 (газ)', lat: 44.6736, lon: 37.7143, type: 'gas', bonus: 3.2, icon: '⛽', region: 'Новороссийск', reserve: 561.1, area: 447.4, depth: 403 },
    { id: 'aktobe_1', name: 'Актобе-1 (нефть)', lat: 50.404, lon: 57.5327, type: 'oil', bonus: 2.8, icon: '🛢️', region: 'Актобе', reserve: 666.6, area: 1804.7, depth: 1667 },
    { id: 'zhanaozhen_1', name: 'Жанаозен-1 (нефть)', lat: 43.3397, lon: 52.5511, type: 'oil', bonus: 3.3, icon: '🛢️', region: 'Жанаозен', reserve: 104.8, area: 2250.7, depth: 3044 },
    { id: 'zhanaozhen_2', name: 'Жанаозен-2 (газ)', lat: 43.3314, lon: 52.9455, type: 'gas', bonus: 3.3, icon: '⛽', region: 'Жанаозен', reserve: 492.3, area: 201.9, depth: 4028 },
    { id: 'tengiz_city_1', name: 'Тенгиз-1 (нефть)', lat: 47.3366, lon: 53.5006, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Тенгиз', reserve: 220.6, area: 266.2, depth: 5001 },
    { id: 'tengiz_city_2', name: 'Тенгиз-2 (нефть)', lat: 47.5205, lon: 53.7226, type: 'oil', bonus: 1.6, icon: '🛢️', region: 'Тенгиз', reserve: 734.2, area: 618.9, depth: 4164 },
    { id: 'dhahran_1', name: 'Дахран-1 (газ)', lat: 26.3552, lon: 50.104, type: 'gas', bonus: 3.9, icon: '⛽', region: 'Дахран', reserve: 34.9, area: 2009.8, depth: 3735 },
    { id: 'dhahran_2', name: 'Дахран-2 (нефть)', lat: 26.2219, lon: 50.2837, type: 'oil', bonus: 3.3, icon: '🛢️', region: 'Дахран', reserve: 234.2, area: 203.9, depth: 3354 },
    { id: 'jubail_1', name: 'Джубайль-1 (нефть)', lat: 27.0906, lon: 49.8737, type: 'oil', bonus: 4.0, icon: '🛢️', region: 'Джубайль', reserve: 811.2, area: 181.6, depth: 4110 },
    { id: 'ras_tanura_1', name: 'Рас-Таннура-1 (газ)', lat: 26.565, lon: 50.3189, type: 'gas', bonus: 1.5, icon: '⛽', region: 'Рас-Таннура', reserve: 174.6, area: 1413.9, depth: 2789 },
    { id: 'ras_tanura_2', name: 'Рас-Таннура-2 (нефть)', lat: 26.476, lon: 50.2023, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Рас-Таннура', reserve: 657.9, area: 496.6, depth: 4777 },
    { id: 'abqaiq_1', name: 'Абкайк-1 (нефть)', lat: 26.0619, lon: 49.6759, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Абкайк', reserve: 297.7, area: 2100.5, depth: 378 },
    { id: 'luanda_1', name: 'Луанда-1 (нефть)', lat: -8.833, lon: 13.1034, type: 'oil', bonus: 3.3, icon: '🛢️', region: 'Луанда', reserve: 264.8, area: 520.9, depth: 2251 },
    { id: 'luanda_2', name: 'Луанда-2 (газ)', lat: -8.9019, lon: 13.2331, type: 'gas', bonus: 4.0, icon: '⛽', region: 'Луанда', reserve: 606.3, area: 241.6, depth: 2196 },
    { id: 'darwin_1', name: 'Дарвин-1 (газ)', lat: -12.6528, lon: 130.8927, type: 'gas', bonus: 3.0, icon: '⛽', region: 'Дарвин', reserve: 432.1, area: 1596.7, depth: 3530 },
    { id: 'darwin_2', name: 'Дарвин-2 (нефть)', lat: -12.5123, lon: 130.8051, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Дарвин', reserve: 115.4, area: 736.3, depth: 2880 },
    { id: 'karratha_1', name: 'Каррата-1 (газ)', lat: -20.7833, lon: 116.9516, type: 'gas', bonus: 1.7, icon: '⛽', region: 'Каррата', reserve: 176.3, area: 1952.0, depth: 5089 },
    { id: 'karratha_2', name: 'Каррата-2 (нефть)', lat: -20.6936, lon: 116.9234, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Каррата', reserve: 348.5, area: 1344.5, depth: 2000 },
    { id: 'trinidad_1', name: 'Порт-оф-Спейн-1 (газ)', lat: 10.4353, lon: -61.4688, type: 'gas', bonus: 1.7, icon: '⛽', region: 'Порт-оф-Спейн', reserve: 687.4, area: 767.5, depth: 5242 },
    { id: 'trinidad_2', name: 'Порт-оф-Спейн-2 (нефть)', lat: 10.6983, lon: -61.3002, type: 'oil', bonus: 1.9, icon: '🛢️', region: 'Порт-оф-Спейн', reserve: 605.9, area: 2421.3, depth: 3546 },
    { id: 'santa_cruz_1', name: 'Санта-Крус-1 (газ)', lat: -17.8158, lon: -62.9099, type: 'gas', bonus: 1.6, icon: '⛽', region: 'Санта-Крус', reserve: 346.7, area: 1136.0, depth: 4806 },
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
    captures: {}, platforms: {}, fieldReserves: {},
    visitedCities: new Set(), questProgress: {},
    activeBuffs: [],   // [{ type, value, expiresAt, name }]
    anomalyCount: 0,
    scanCount: 0,
    scannedFields: [],
    scanning: false,
    revealedFields: new Set(),
    radarLevel: 1,
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

  function isAdmin() {
    return sessionStorage.getItem('rurcoin_admin_auth') === '1';
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
      const world = raw ? JSON.parse(raw) : { platforms: {}, captures: {}, fieldReserves: {} };
      state.platforms     = world.platforms     || {};
      state.captures      = world.captures      || {};
      state.fieldReserves = world.fieldReserves || {};
    } catch(e) { state.platforms = {}; state.captures = {}; state.fieldReserves = {}; }
    try {
      const fogRaw = localStorage.getItem(FOG_KEY);
      if (fogRaw) {
        const fog = JSON.parse(fogRaw);
        state.revealedFields = new Set(fog.revealedFields || []);
        state.radarLevel     = fog.radarLevel || 1;
      }
      if (isAdmin()) {
        state.revealedFields = new Set(FIELDS.map(f => f.id));
      }
    } catch(e) { state.revealedFields = new Set(); state.radarLevel = 1; }
  }

  function saveWorldState() {
    try {
      localStorage.setItem(SHARED_KEY, JSON.stringify({
        platforms:     state.platforms,
        captures:      state.captures,
        fieldReserves: state.fieldReserves,
        updatedAt:     Date.now()
      }));
    } catch(e) {}
    try {
      localStorage.setItem(FOG_KEY, JSON.stringify({
        revealedFields: Array.from(state.revealedFields),
        radarLevel:     state.radarLevel
      }));
    } catch(e) {}
  }

  // ── Запасы месторождений ───────────────────────────────────
  function getReserve(fieldId) {
    if (state.fieldReserves[fieldId] === undefined) state.fieldReserves[fieldId] = FIELD_RESERVE_INIT;
    return state.fieldReserves[fieldId];
  }
  function setReserve(fieldId, val) {
    state.fieldReserves[fieldId] = Math.max(0, Math.min(FIELD_RESERVE_INIT, val));
  }
  function isFieldDepleted(fieldId) { return getReserve(fieldId) <= 0; }
  function reservePct(fieldId) { return Math.round((getReserve(fieldId) / FIELD_RESERVE_INIT) * 100); }

  // Тик расхода/восстановления (каждую секунду)
  function tickReserves() {
    FIELDS.forEach(function(f) {
      const p = state.platforms[f.id];
      if (p) {
        // Расход запаса месторождения
        const drain = FIELD_DRAIN_PER_SEC * (1 + (p.level - 1) * 0.3);
        const newVal = getReserve(f.id) - drain;
        setReserve(f.id, newVal);
        if (newVal <= 0) { onFieldDepleted(f.id, f); return; }

        // Деградация HP платформы
        if (p.hp === undefined) p.hp = PLATFORM_HP_MAX;
        p.hp = Math.max(0, p.hp - PLATFORM_HP_DRAIN);

        // Предупреждение при низком HP (раз в 5 мин)
        if (p.owner === getPlayerId()) {
          const hpPct = Math.round(p.hp);
          if (hpPct <= PLATFORM_HP_WARN && (!p._warnedAt || Date.now() - p._warnedAt > 300000)) {
            p._warnedAt = Date.now();
            const ff = FIELDS.find(ff => ff.id === f.id);
            notify('⚠️ Платформа разрушается!', (ff ? ff.name : f.id) + ' — HP ' + hpPct + '%, нужен ремонт', 'warning');
          }
        }

        // Разрушение при 0 HP
        if (p.hp <= 0) { onPlatformDestroyed(f.id, f); return; }
      } else {
        const cur = getReserve(f.id);
        if (cur < FIELD_RESERVE_INIT) setReserve(f.id, cur + FIELD_REGEN_PER_SEC);
      }
    });
    if (!tickReserves._cnt) tickReserves._cnt = 0;
    tickReserves._cnt++;
    if (tickReserves._cnt % 10 === 0) saveWorldState();
  }

  function onFieldDepleted(fieldId, field) {
    const p = state.platforms[fieldId];
    const wasOwner = p && p.owner === getPlayerId();
    delete state.platforms[fieldId];
    saveWorldState();
    if (wasOwner) notify('⚠️ Месторождение истощено!', field.name + ' — запасы закончились, платформа демонтирована', 'warning');
    applyPlatformBonuses();
    if (map) updateFieldMarker(field);
    renderPlatformsList();
    renderScanResults();
  }

  // ── Эксклюзивная зона платформы ───────────────────────────
  function getBlockingPlatform(fieldId) {
    const f = FIELDS.find(f => f.id === fieldId);
    if (!f) return null;
    const myId = getPlayerId();
    for (const [pid, p] of Object.entries(state.platforms)) {
      if (pid === fieldId) continue;
      if (p.owner === myId) continue;
      const pf = FIELDS.find(ff => ff.id === pid);
      if (!pf) continue;
      const dist = haversine(f.lat, f.lon, pf.lat, pf.lon);
      if (dist <= PLATFORM_EXCL_KM) return { platform: p, field: pf, dist: Math.round(dist) };
    }
    return null;
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
    if (typeof window.gameState !== 'undefined' && window.gameState.balance !== undefined) {
      if (window.gameState.balance < SCAN_COST_RURC) {
        notify('💸 Недостаточно RURC', 'Нужно ' + SCAN_COST_RURC + ' RURC для сканирования', 'error'); return;
      }
      window.gameState.balance -= SCAN_COST_RURC;
      if (typeof window.updateUI === 'function') window.updateUI();
    }
    state.scanning = true;
    const radarInfo = RADAR_LEVELS[state.radarLevel - 1];
    const scanRadius = radarInfo.radius;
    const radarColor = radarInfo.color;
    const btn = document.getElementById('gpsScanBtn');
    if (btn) { btn.disabled = true; btn.textContent = '📡 Сканирование...'; }
    if (map && scanCircle) { map.removeLayer(scanCircle); scanCircle = null; }
    if (map) {
      scanCircle = L.circle([state.lat, state.lon], {
        radius: scanRadius * 1000, color: radarColor, fillColor: radarColor,
        fillOpacity: 0.04, weight: 2, dashArray: '6 4', className: 'scan-pulse'
      }).addTo(map);
    }
    state.scannedFields = FIELDS.filter(f => haversine(state.lat, state.lon, f.lat, f.lon) <= scanRadius);
    state.scanCount++;
    updateQuestProgress('scan5', state.scanCount);
    setTimeout(function() {
      state.scanning = false;
      if (btn) { btn.disabled = false; btn.textContent = '📡 Скан (' + SCAN_COST_RURC + ' RURC)'; }
      renderScanResults(); highlightScannedFields(); renderRadarPanel();
    }, 2000);
  }

  function upgradeRadar() {
    if (state.radarLevel >= RADAR_LEVELS.length) {
      notify('🏆 Максимум', 'Радар уже на максимальном уровне!', 'info'); return;
    }
    const nextLevel = RADAR_LEVELS[state.radarLevel];
    if (!confirm('Прокачать радар до уровня ' + nextLevel.level + ' (' + nextLevel.label + ')\nРадиус: ' + nextLevel.radius + ' км\nСтоимость: ' + nextLevel.tonCost + ' TON\n\nПодтвердить?')) return;
    state.radarLevel = nextLevel.level;
    saveWorldState(); renderRadarPanel();
    notify('🚀 Радар прокачан!', 'Уровень ' + nextLevel.level + ' · Радиус ' + nextLevel.radius + ' км · ' + nextLevel.tonCost + ' TON', 'success');
  }

  function renderRadarPanel() {
    const el = document.getElementById('gpsRadarPanel');
    if (!el) return;
    const cur = RADAR_LEVELS[state.radarLevel - 1];
    const next = state.radarLevel < RADAR_LEVELS.length ? RADAR_LEVELS[state.radarLevel] : null;
    const revealed = state.revealedFields.size;
    let html = '<div style="background:#0d1117;border:1px solid ' + cur.color + '33;border-radius:12px;padding:12px;margin-bottom:12px;">'
      + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">'
      + '<span style="font-size:22px;">📡</span><div>'
      + '<div style="font-weight:bold;color:' + cur.color + ';font-size:14px;">Радар · Ур.' + cur.level + ' — ' + cur.label + '</div>'
      + '<div style="font-size:11px;color:#888;">Радиус: ' + cur.radius + ' км · Открыто: ' + revealed + ' / ' + FIELDS.length + ' полей</div>'
      + '</div></div><div style="display:flex;gap:3px;margin-bottom:10px;">';
    for (let i = 0; i < RADAR_LEVELS.length; i++) {
      html += '<div style="flex:1;height:4px;border-radius:2px;background:' + (i < state.radarLevel ? RADAR_LEVELS[i].color : '#1a1a2e') + ';"></div>';
    }
    html += '</div>';
    if (next) {
      html += '<button onclick="GPS.upgradeRadar()" style="width:100%;padding:10px;background:' + next.color + '22;border:1px solid ' + next.color + ';border-radius:8px;color:' + next.color + ';font-size:13px;cursor:pointer;">'
        + '💎 Прокачать до Ур.' + next.level + ' · ' + next.radius + ' км · ' + next.tonCost + ' TON</button>';
    } else {
      html += '<div style="text-align:center;color:#FFD700;font-size:12px;padding:8px;">🏆 Максимальный уровень!</div>';
    }
    html += '</div>';
    el.innerHTML = html;
  }


  function highlightScannedFields() {
    if (!map) return;
    state.scannedFields.forEach(f => {
      state.revealedFields.add(f.id);
      if (fieldMarkers[f.id]) {
        fieldMarkers[f.id].setOpacity(1);
        if (fieldCircles[f.id])   fieldCircles[f.id].setStyle({ opacity: 0.4, fillOpacity: 0.15, weight: 2 });
        if (captureCircles[f.id]) captureCircles[f.id].setStyle({ opacity: 1, fillOpacity: 0.08 });
      }
    });
    saveWorldState();
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

      // Полоса запаса
      const rPct   = reservePct(f.id);
      const rColor = rPct > 60 ? '#2ECC71' : rPct > 30 ? '#FFD700' : '#FF4444';
      const depleted = isFieldDepleted(f.id);
      html += '<div style="margin-bottom:8px;">'
        + '<div style="display:flex;justify-content:space-between;font-size:11px;color:#888;margin-bottom:3px;">'
        + '<span>⛽ Запас</span>'
        + '<span style="color:' + rColor + ';">' + rPct + '%' + (depleted ? ' 💀 Истощено' : '') + '</span>'
        + '</div>'
        + '<div style="background:#1a1a2e;border-radius:4px;height:6px;">'
        + '<div style="background:' + rColor + ';width:' + rPct + '%;height:100%;border-radius:4px;transition:width 2s;"></div>'
        + '</div></div>';

      // Полоса HP платформы
      if (hasPlatform) {
        const hp = Math.round(getPlatformHp(state.platforms[f.id]));
        const hpC = hpColor(hp);
        html += '<div style="margin-bottom:8px;">'
          + '<div style="display:flex;justify-content:space-between;font-size:11px;color:#888;margin-bottom:3px;">'
          + '<span>🔩 HP платформы</span>'
          + '<span style="color:' + hpC + ';">' + hp + '%'
          + (hp <= PLATFORM_HP_WARN ? ' ⚠️ Нужен ремонт' : '') + '</span>'
          + '</div>'
          + '<div style="background:#1a1a2e;border-radius:4px;height:6px;">'
          + '<div style="background:' + hpC + ';width:' + hp + '%;height:100%;border-radius:4px;transition:width 2s;"></div>'
          + '</div></div>';
      }

      // Блокировщик
      const blocker = getBlockingPlatform(f.id);
      if (blocker && !hasPlatform) {
        html += '<div style="font-size:11px;color:#FF4444;margin-bottom:6px;">🚫 Зона контроля: ' + blocker.platform.ownerName + ' (' + blocker.field.name + ', ' + blocker.dist + ' км)</div>';
      }

      // Кнопки действий
      if (inCapture) {
        html += '<div style="display:flex;gap:6px;flex-wrap:wrap;">';
        if (!isMine) {
          html += '<button onclick="GPS.captureField(\'' + f.id + '\')" style="flex:1;padding:6px;background:#FFD70022;border:1px solid #FFD700;border-radius:6px;color:#FFD700;font-size:12px;cursor:pointer;">🚩 Захватить</button>';
        }
        if (!hasPlatform && !depleted && !blocker) {
          html += '<button onclick="GPS.buildPlatform(\'' + f.id + '\')" style="flex:1;padding:6px;background:#9B59B622;border:1px solid #9B59B6;border-radius:6px;color:#9B59B6;font-size:12px;cursor:pointer;">🏗️ Построить платформу</button>';
        } else if (!hasPlatform && depleted) {
          html += '<div style="flex:1;padding:6px;background:#FF444422;border:1px solid #FF4444;border-radius:6px;color:#FF4444;font-size:12px;text-align:center;">💀 Истощено</div>';
        } else if (!hasPlatform && blocker) {
          html += '<div style="flex:1;padding:6px;background:#FF444422;border:1px solid #FF4444;border-radius:6px;color:#FF4444;font-size:12px;text-align:center;">🚫 Заблокировано</div>';
        } else if (myPlatform) {
          html += '<button onclick="GPS.upgradePlatform(\'' + f.id + '\')" style="flex:1;padding:6px;background:#00D4FF22;border:1px solid #00D4FF;border-radius:6px;color:#00D4FF;font-size:12px;cursor:pointer;">⬆️ Улучшить</button>';
          const hpNow = Math.round(getPlatformHp(state.platforms[f.id]));
          if (hpNow < PLATFORM_HP_MAX) {
            html += '<button onclick="GPS.repairPlatform(\'' + f.id + '\')" style="flex:1;padding:6px;background:#2ECC7122;border:1px solid #2ECC71;border-radius:6px;color:#2ECC71;font-size:12px;cursor:pointer;">🔨 Ремонт (' + PLATFORM_REPAIR_COST + ' RURC)</button>';
          }
          html += '<button onclick="GPS.dismantlePlatform(\'' + f.id + '\')" style="padding:6px 10px;background:#FF444422;border:1px solid #FF4444;border-radius:6px;color:#FF4444;font-size:12px;cursor:pointer;">🔧 Демонтаж</button>';
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
    const spotR = getSpotRadius(f);
    if (dist > spotR) { notify('❌ Вне пятна месторождения', 'Войди в зону пятна (' + spotR.toFixed(2) + ' км)', 'error'); return; }
    if (state.platforms[fieldId]) { notify('⚠️ Платформа уже есть', 'На этом месторождении уже построена платформа', 'warning'); return; }
    if (isFieldDepleted(fieldId)) { notify('💀 Месторождение истощено', f.name + ' — запасы исчерпаны, ждите восстановления', 'error'); return; }
    const blocker = getBlockingPlatform(fieldId);
    if (blocker) { notify('🚫 Заблокировано', blocker.platform.ownerName + ' контролирует этот район (' + blocker.field.name + ', ' + blocker.dist + ' км)', 'error'); return; }

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
      builtAt: Date.now(), level: 1, bonusPct: 0.20,
      hp: PLATFORM_HP_MAX
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

  function dismantlePlatform(fieldId) {
    const p = state.platforms[fieldId];
    const f = FIELDS.find(f => f.id === fieldId);
    if (!p || p.owner !== getPlayerId()) { notify('❌ Не ваша платформа', '', 'error'); return; }
    delete state.platforms[fieldId];
    saveWorldState();
    if (f) updateFieldMarker(f);
    applyPlatformBonuses();
    notify('🔧 Платформа демонтирована', (f ? f.name : fieldId), 'info');
    renderScanResults();
    renderPlatformsList();
  }

  // ── HP платформ ──────────────────────────────────────────────────────
  function getPlatformHp(p) { return p && p.hp !== undefined ? p.hp : PLATFORM_HP_MAX; }
  function hpColor(hp) { return hp > 60 ? '#2ECC71' : hp > 30 ? '#FFD700' : '#FF4444'; }

  function repairPlatform(fieldId) {
    const p = state.platforms[fieldId];
    const f = FIELDS.find(f => f.id === fieldId);
    if (!p || p.owner !== getPlayerId()) { notify('❌ Не ваша платформа', '', 'error'); return; }
    const hp = getPlatformHp(p);
    if (hp >= PLATFORM_HP_MAX) { notify('✅ Платформа в порядке', 'HP уже максимальное', 'info'); return; }
    if (typeof window.gameState !== 'undefined' && window.gameState.balance !== undefined) {
      if (window.gameState.balance < PLATFORM_REPAIR_COST) {
        notify('💸 Недостаточно RURC', 'Нужно ' + PLATFORM_REPAIR_COST + ' RURC для ремонта', 'error'); return;
      }
      window.gameState.balance -= PLATFORM_REPAIR_COST;
      if (typeof window.updateUI === 'function') window.updateUI();
    }
    p.hp = PLATFORM_HP_MAX;
    p.repairedAt = Date.now();
    saveWorldState();
    if (f) updateFieldMarker(f);
    notify('🔨 Отремонтировано!', (f ? f.name : fieldId) + ' — HP 100%', 'success');
    renderScanResults();
    renderPlatformsList();
  }

  function onPlatformDestroyed(fieldId, field) {
    const p = state.platforms[fieldId];
    const wasOwner = p && p.owner === getPlayerId();
    delete state.platforms[fieldId];
    saveWorldState();
    if (wasOwner) notify('💥 Платформа разрушена!', (field ? field.name : fieldId) + ' — HP 0%, нужно строить заново', 'error');
    applyPlatformBonuses();
    if (map && field) updateFieldMarker(field);
    renderPlatformsList();
    renderScanResults();
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
    const spotR = getSpotRadius(f);
    if (dist > spotR) { notify('❌ Вне пятна месторождения', 'Войди в зону пятна (' + spotR.toFixed(2) + ' км)', 'error'); return; }
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


  function getSpotRadius(f) {
    const r = f.reserve || 50;
    if (r < 30)  return 0.25;
    if (r < 80)  return 0.45;
    if (r < 200) return 0.75;
    if (r < 400) return 1.2;
    if (r < 700) return 2.0;
    return 3.0;
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

    // Пятно месторождения (размер зависит от запасов)
    const spotR = getSpotRadius(f);
    const spotColor = f.type === 'oil' ? '#FF6B00' : '#00D4FF';
    const spotOpacity = isMine ? 0.45 : hasPlatform ? 0.35 : 0.28;
    const blobOffsets = [
      [0, 0, 1.0], [0.3, 0.2, 0.7], [-0.25, 0.3, 0.65],
      [0.2, -0.3, 0.6], [-0.15, -0.2, 0.75]
    ];
    if (!window._blobLayers) window._blobLayers = {};
    window._blobLayers[f.id] = [];
    blobOffsets.forEach(([dlat, dlon, scale]) => {
      const latOff = f.lat + dlat * spotR / 111;
      const lonOff = f.lon + dlon * spotR / (111 * Math.cos(f.lat * Math.PI / 180));
      const blob = L.circle([latOff, lonOff], {
        radius: spotR * scale * 1000,
        color: spotColor, fillColor: spotColor,
        fillOpacity: spotOpacity * 0.7, weight: 0, stroke: false
      }).addTo(map);
      window._blobLayers[f.id].push(blob);
    });
    captureCircles[f.id] = L.circle([f.lat, f.lon], {
      radius: spotR * 1000,
      color: isMine ? '#FFD700' : hasPlatform ? '#9B59B6' : spotColor,
      fillColor: isMine ? '#FFD700' : hasPlatform ? '#9B59B6' : spotColor,
      fillOpacity: spotOpacity * 0.25, weight: 2, dashArray: isMine ? null : '5 3'
    }).addTo(map);
    if (hasPlatform) {
      const exclColor = myPlatform ? '#9B59B6' : '#FF4444';
      L.circle([f.lat, f.lon], {
        radius: PLATFORM_EXCL_KM * 1000,
        color: exclColor, fillColor: exclColor,
        fillOpacity: 0.04, weight: 1, dashArray: '8 6', opacity: 0.5
      }).addTo(map);
    }

    // Иконка
    let badge = '';
    if (hasPlatform) badge = '<div style="position:absolute;top:-4px;right:-4px;font-size:10px;">🏗️</div>';
    if (isMine) badge = '<div style="position:absolute;top:-4px;right:-4px;font-size:10px;">🚩</div>';

    const icon = L.divIcon({
      html: '<div style="position:relative;font-size:' + (hasPlatform?'26px':'20px') + ';filter:drop-shadow(0 0 6px ' + color + ');">'
        + f.icon + badge + '</div>',
      className: '', iconSize: [30, 30], iconAnchor: [15, 15]
    });

    const isRevealed = state.revealedFields.has(f.id);
    fieldMarkers[f.id] = L.marker([f.lat, f.lon], { icon, opacity: isRevealed ? 1 : 0 })
      .addTo(map)
      .bindPopup(buildFieldPopup(f));
    if (!isRevealed) {
      if (fieldCircles[f.id])   fieldCircles[f.id].setStyle({ opacity: 0, fillOpacity: 0 });
      if (captureCircles[f.id]) captureCircles[f.id].setStyle({ opacity: 0, fillOpacity: 0 });
    }
  }

  function updateFieldMarker(f) {
    if (!map) return;
    if (fieldMarkers[f.id]) { map.removeLayer(fieldMarkers[f.id]); delete fieldMarkers[f.id]; }
    if (fieldCircles[f.id]) { map.removeLayer(fieldCircles[f.id]); delete fieldCircles[f.id]; }
    if (captureCircles[f.id]) { map.removeLayer(captureCircles[f.id]); delete captureCircles[f.id]; }
    if (window._blobLayers && window._blobLayers[f.id]) {
      window._blobLayers[f.id].forEach(b => map.removeLayer(b));
      delete window._blobLayers[f.id];
    }
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
    const rPctP = reservePct(f.id);
    const rColorP = rPctP > 60 ? '#2ECC71' : rPctP > 30 ? '#FFD700' : '#FF4444';
    html += '⛽ Запас: <span style="color:' + rColorP + ';">' + rPctP + '%</span><br>';
    if (platform) {
      const hpVal = Math.round(getPlatformHp(platform));
      const hpC2  = hpColor(hpVal);
      html += '🏗️ Платформа: <b>' + platform.ownerName + '</b> (ур.' + platform.level + ') · +' + Math.round(platform.bonusPct*100) + '%<br>';
      html += '🔩 HP: <span style="color:' + hpC2 + ';">' + hpVal + '%</span>'
        + (hpVal <= PLATFORM_HP_WARN ? ' <span style="color:#FF4444;">⚠️ Нужен ремонт!</span>' : '') + '<br>';
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
        + '<div style="font-size:12px;color:#888;">' + (f?f.region:'') + ' · Ур.' + p.level + ' · +' + Math.round(p.bonusPct*100) + '% к добыче</div>'
        + (function(){ const hp=Math.round(getPlatformHp(p)); const hc=hpColor(hp); return '<div style="margin-top:4px;"><div style="display:flex;justify-content:space-between;font-size:10px;color:#666;margin-bottom:2px;"><span>🔩 HP</span><span style="color:'+hc+';">'+hp+'%'+(hp<=PLATFORM_HP_WARN?' ⚠️':'')+' </span></div><div style="background:#0d0d1a;border-radius:3px;height:4px;"><div style="background:'+hc+';width:'+hp+'%;height:100%;border-radius:3px;"></div></div></div>'; })()
        + '</div>'
        + (p.level < 5 ? '<button onclick="GPS.upgradePlatform(\'' + id + '\')" style="padding:4px 10px;background:#9B59B622;border:1px solid #9B59B6;border-radius:6px;color:#9B59B6;font-size:11px;cursor:pointer;">⬆️</button>' : '<span style="color:#FFD700;font-size:11px;">MAX</span>')

        + (getPlatformHp(p) < PLATFORM_HP_MAX ? '<button onclick="GPS.repairPlatform(\\\'' + id + '\\\')" style="margin-left:4px;padding:4px 10px;background:#2ECC7122;border:1px solid #2ECC71;border-radius:6px;color:#2ECC71;font-size:11px;cursor:pointer;">🔨</button>' : '')
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
    if (scanBtn) { scanBtn.onclick = runScan; scanBtn.textContent = '📡 Скан (' + SCAN_COST_RURC + ' RURC)'; }
    renderRadarPanel();

    window.addEventListener('resize', function() { if (map) map.invalidateSize(); });
    // Тик расхода запасов каждую секунду
    setInterval(tickReserves, 1000);
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

  return { enable, disable, toggle, getBonus, getState, initTab, runScan, captureField, buildPlatform, upgradePlatform, dismantlePlatform, repairPlatform, upgradeRadar };
})();

window.GPS = GPS;
