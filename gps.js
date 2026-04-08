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
  { id: 'field_0', name: 'Ливия-0', lat: 22.2751, lon: 13.4005, type: 'oil', bonus: 1.6, icon: '🛢️', region: 'Ливия', reserve: 147.4, area: 597.7, depth: 4667 },
  { id: 'field_1', name: 'Восточная Сибирь-1', lat: 59.2192, lon: 86.3409, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Восточная Сибирь', reserve: 621.9, area: 457.8, depth: 4664 },
  { id: 'field_2', name: 'Техас-2', lat: 29.9413, lon: -102.3835, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Техас', reserve: 201.7, area: 349.6, depth: 2476 },
  { id: 'field_3', name: 'Каспий (РФ)-3', lat: 47.8289, lon: 50.683, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Каспий (РФ)', reserve: 391.0, area: 288.3, depth: 2366 },
  { id: 'field_4', name: 'Северное море-4', lat: 59.8379, lon: 3.5072, type: 'gas', bonus: 1.5, icon: '⛽', region: 'Северное море', reserve: 328.5, area: 510.3, depth: 3162 },
  { id: 'field_5', name: 'Северная Дакота-5', lat: 47.8183, lon: -103.6334, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Северная Дакота', reserve: 986.0, area: 687.1, depth: 1027 },
  { id: 'field_6', name: 'ОАЭ/Кувейт-6', lat: 25.6273, lon: 54.3411, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'ОАЭ/Кувейт', reserve: 249.0, area: 228.2, depth: 784 },
  { id: 'field_7', name: 'Нигерия-7', lat: 5.7114, lon: 11.4786, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Нигерия', reserve: 306.5, area: 741.8, depth: 4762 },
  { id: 'field_8', name: 'Саудовская Аравия-8', lat: 23.2428, lon: 51.0613, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Саудовская Аравия', reserve: 80.5, area: 266.1, depth: 2393 },
  { id: 'field_9', name: 'Западная Сибирь-9', lat: 67.1314, lon: 74.1795, type: 'gas', bonus: 1.8, icon: '⛽', region: 'Западная Сибирь', reserve: 524.3, area: 710.1, depth: 3958 },
  { id: 'field_10', name: 'Ямал-10', lat: 67.8378, lon: 74.6849, type: 'gas', bonus: 2.9, icon: '⛽', region: 'Ямал', reserve: 457.0, area: 475.2, depth: 3165 },
  { id: 'field_11', name: 'Саудовская Аравия-11', lat: 29.9754, lon: 46.6619, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Саудовская Аравия', reserve: 868.0, area: 139.2, depth: 1510 },
  { id: 'field_12', name: 'Северное море-12', lat: 57.3773, lon: -3.1106, type: 'gas', bonus: 2.6, icon: '⛽', region: 'Северное море', reserve: 494.6, area: 216.1, depth: 4732 },
  { id: 'field_13', name: 'Казахстан-13', lat: 40.1378, lon: 76.6667, type: 'gas', bonus: 3.0, icon: '⛽', region: 'Казахстан', reserve: 373.2, area: 248.9, depth: 1495 },
  { id: 'field_14', name: 'Техас-14', lat: 35.492, lon: -94.6139, type: 'gas', bonus: 3.4, icon: '⛽', region: 'Техас', reserve: 773.9, area: 416.0, depth: 1071 },
  { id: 'field_15', name: 'Казахстан-15', lat: 43.5813, lon: 73.6411, type: 'oil', bonus: 1.6, icon: '🛢️', region: 'Казахстан', reserve: 774.4, area: 440.7, depth: 4544 },
  { id: 'field_16', name: 'Туркменистан-16', lat: 39.7916, lon: 58.8405, type: 'gas', bonus: 3.3, icon: '⛽', region: 'Туркменистан', reserve: 884.8, area: 668.7, depth: 2719 },
  { id: 'field_17', name: 'Саудовская Аравия-17', lat: 22.4087, lon: 47.6451, type: 'oil', bonus: 1.5, icon: '🛢️', region: 'Саудовская Аравия', reserve: 511.7, area: 74.0, depth: 4563 },
  { id: 'field_18', name: 'Бразилия (шельф)-18', lat: -25.689, lon: -42.8708, type: 'oil', bonus: 1.9, icon: '🛢️', region: 'Бразилия (шельф)', reserve: 878.8, area: 350.0, depth: 1935 },
  { id: 'field_19', name: 'Китай (Синьцзян)-19', lat: 45.0632, lon: 91.6264, type: 'gas', bonus: 2.2, icon: '⛽', region: 'Китай (Синьцзян)', reserve: 688.1, area: 311.3, depth: 4439 },
  { id: 'field_20', name: 'Техас-20', lat: 27.727, lon: -105.1677, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Техас', reserve: 268.6, area: 191.8, depth: 781 },
  { id: 'field_21', name: 'Венесуэла-21', lat: 5.4121, lon: -72.1238, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Венесуэла', reserve: 117.3, area: 205.6, depth: 4176 },
  { id: 'field_22', name: 'Саудовская Аравия-22', lat: 21.3231, lon: 53.9037, type: 'gas', bonus: 1.8, icon: '⛽', region: 'Саудовская Аравия', reserve: 499.3, area: 337.5, depth: 972 },
  { id: 'field_23', name: 'Восточная Сибирь-23', lat: 59.3105, lon: 104.061, type: 'gas', bonus: 3.2, icon: '⛽', region: 'Восточная Сибирь', reserve: 101.5, area: 529.7, depth: 1006 },
  { id: 'field_24', name: 'Западная Сибирь-24', lat: 65.2821, lon: 80.0148, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Западная Сибирь', reserve: 230.7, area: 369.9, depth: 3656 },
  { id: 'field_25', name: 'Поволжье-25', lat: 53.2384, lon: 56.7449, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Поволжье', reserve: 868.3, area: 449.3, depth: 614 },
  { id: 'field_26', name: 'Алжир-26', lat: 30.8653, lon: -1.8229, type: 'gas', bonus: 3.3, icon: '⛽', region: 'Алжир', reserve: 856.3, area: 149.7, depth: 4178 },
  { id: 'field_27', name: 'Аляска-27', lat: 69.5112, lon: -142.7316, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Аляска', reserve: 986.0, area: 226.9, depth: 3927 },
  { id: 'field_28', name: 'Ирак-28', lat: 34.5727, lon: 45.3051, type: 'oil', bonus: 1.6, icon: '🛢️', region: 'Ирак', reserve: 331.9, area: 775.6, depth: 4944 },
  { id: 'field_29', name: 'Венесуэла-29', lat: 5.4267, lon: -68.9231, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Венесуэла', reserve: 527.7, area: 685.1, depth: 1489 },
  { id: 'field_30', name: 'Западная Сибирь-30', lat: 63.0783, lon: 81.2836, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Западная Сибирь', reserve: 691.5, area: 203.5, depth: 1182 },
  { id: 'field_31', name: 'Китай (Синьцзян)-31', lat: 42.8361, lon: 88.6308, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Китай (Синьцзян)', reserve: 448.3, area: 475.3, depth: 4482 },
  { id: 'field_32', name: 'Иран-32', lat: 28.39, lon: 56.7248, type: 'gas', bonus: 1.8, icon: '⛽', region: 'Иран', reserve: 426.0, area: 543.9, depth: 2657 },
  { id: 'field_33', name: 'Техас-33', lat: 35.2192, lon: -93.8355, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Техас', reserve: 998.5, area: 797.0, depth: 800 },
  { id: 'field_34', name: 'Мексиканский залив-34', lat: 24.0706, lon: -95.4105, type: 'gas', bonus: 3.2, icon: '⛽', region: 'Мексиканский залив', reserve: 885.3, area: 308.2, depth: 1492 },
  { id: 'field_35', name: 'Техас-35', lat: 30.9754, lon: -102.0673, type: 'oil', bonus: 2.8, icon: '🛢️', region: 'Техас', reserve: 576.9, area: 746.8, depth: 1048 },
  { id: 'field_36', name: 'Китай (Синьцзян)-36', lat: 37.6115, lon: 76.1166, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Китай (Синьцзян)', reserve: 197.7, area: 239.8, depth: 1925 },
  { id: 'field_37', name: 'Венесуэла-37', lat: 6.4252, lon: -64.7549, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Венесуэла', reserve: 288.6, area: 728.4, depth: 616 },
  { id: 'field_38', name: 'Восточная Сибирь-38', lat: 59.2358, lon: 97.4506, type: 'oil', bonus: 2.0, icon: '🛢️', region: 'Восточная Сибирь', reserve: 174.3, area: 784.2, depth: 1523 },
  { id: 'field_39', name: 'Венесуэла-39', lat: 8.8618, lon: -67.4401, type: 'oil', bonus: 1.5, icon: '🛢️', region: 'Венесуэла', reserve: 947.8, area: 559.0, depth: 1421 },
  { id: 'field_40', name: 'Мексиканский залив-40', lat: 28.0151, lon: -90.0099, type: 'oil', bonus: 2.2, icon: '🛢️', region: 'Мексиканский залив', reserve: 89.7, area: 304.4, depth: 526 },
  { id: 'field_41', name: 'Азербайджан-41', lat: 38.8403, lon: 45.7467, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Азербайджан', reserve: 581.9, area: 702.3, depth: 1466 },
  { id: 'field_42', name: 'Китай (Синьцзян)-42', lat: 38.8408, lon: 77.3875, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Китай (Синьцзян)', reserve: 73.5, area: 594.5, depth: 2921 },
  { id: 'field_43', name: 'Колумбия-43', lat: 4.1171, lon: -69.2912, type: 'oil', bonus: 1.9, icon: '🛢️', region: 'Колумбия', reserve: 798.0, area: 104.3, depth: 517 },
  { id: 'field_44', name: 'Казахстан-44', lat: 42.6692, lon: 80.2137, type: 'gas', bonus: 2.1, icon: '⛽', region: 'Казахстан', reserve: 829.5, area: 699.6, depth: 2026 },
  { id: 'field_45', name: 'Западная Сибирь-45', lat: 59.9313, lon: 68.2065, type: 'oil', bonus: 3.4, icon: '🛢️', region: 'Западная Сибирь', reserve: 315.2, area: 520.4, depth: 3474 },
  { id: 'field_46', name: 'Ангола-46', lat: -6.1887, lon: 14.9672, type: 'oil', bonus: 1.6, icon: '🛢️', region: 'Ангола', reserve: 971.9, area: 159.3, depth: 2374 },
  { id: 'field_47', name: 'Западная Сибирь-47', lat: 63.9657, lon: 68.6422, type: 'gas', bonus: 2.3, icon: '⛽', region: 'Западная Сибирь', reserve: 985.0, area: 110.2, depth: 4923 },
  { id: 'field_48', name: 'Саудовская Аравия-48', lat: 20.4439, lon: 45.413, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Саудовская Аравия', reserve: 116.5, area: 538.1, depth: 2904 },
  { id: 'field_49', name: 'Ливия-49', lat: 29.2973, lon: 10.994, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Ливия', reserve: 683.5, area: 274.4, depth: 2622 },
  { id: 'field_50', name: 'Мексиканский залив-50', lat: 20.3021, lon: -89.0208, type: 'gas', bonus: 2.8, icon: '⛽', region: 'Мексиканский залив', reserve: 907.7, area: 500.1, depth: 2665 },
  { id: 'field_51', name: 'Катар-51', lat: 26.5012, lon: 50.6077, type: 'gas', bonus: 2.2, icon: '⛽', region: 'Катар', reserve: 601.0, area: 530.7, depth: 4009 },
  { id: 'field_52', name: 'Техас-52', lat: 32.4319, lon: -99.3547, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Техас', reserve: 319.6, area: 537.8, depth: 2945 },
  { id: 'field_53', name: 'Восточная Сибирь-53', lat: 64.52, lon: 95.5691, type: 'gas', bonus: 1.8, icon: '⛽', region: 'Восточная Сибирь', reserve: 239.2, area: 39.1, depth: 2205 },
  { id: 'field_54', name: 'Австралия (сев.)-54', lat: -15.8309, lon: 129.6753, type: 'oil', bonus: 2.2, icon: '🛢️', region: 'Австралия (сев.)', reserve: 648.3, area: 171.7, depth: 3345 },
  { id: 'field_55', name: 'Канада (Альберта)-55', lat: 51.6838, lon: -106.8788, type: 'oil', bonus: 3.3, icon: '🛢️', region: 'Канада (Альберта)', reserve: 867.4, area: 710.7, depth: 3682 },
  { id: 'field_56', name: 'Саудовская Аравия-56', lat: 28.0411, lon: 49.8305, type: 'gas', bonus: 1.4, icon: '⛽', region: 'Саудовская Аравия', reserve: 286.7, area: 681.7, depth: 3939 },
  { id: 'field_57', name: 'Ямал-57', lat: 69.7879, lon: 71.9047, type: 'gas', bonus: 3.4, icon: '⛽', region: 'Ямал', reserve: 896.9, area: 497.9, depth: 4335 },
  { id: 'field_58', name: 'Техас-58', lat: 34.9754, lon: -100.2031, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Техас', reserve: 500.9, area: 222.2, depth: 2225 },
  { id: 'field_59', name: 'Норвегия-59', lat: 60.437, lon: 24.2195, type: 'gas', bonus: 2.7, icon: '⛽', region: 'Норвегия', reserve: 310.9, area: 80.4, depth: 2540 },
  { id: 'field_60', name: 'Саудовская Аравия-60', lat: 23.3585, lon: 53.1815, type: 'oil', bonus: 1.6, icon: '🛢️', region: 'Саудовская Аравия', reserve: 269.7, area: 561.3, depth: 1952 },
  { id: 'field_61', name: 'Западная Сибирь-61', lat: 62.076, lon: 73.5653, type: 'gas', bonus: 1.4, icon: '⛽', region: 'Западная Сибирь', reserve: 841.2, area: 323.8, depth: 4984 },
  { id: 'field_62', name: 'Индонезия-62', lat: -7.7461, lon: 135.5102, type: 'gas', bonus: 2.3, icon: '⛽', region: 'Индонезия', reserve: 945.6, area: 252.9, depth: 3394 },
  { id: 'field_63', name: 'Казахстан-63', lat: 51.4412, lon: 65.5038, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Казахстан', reserve: 309.3, area: 398.8, depth: 3385 },
  { id: 'field_64', name: 'Иран-64', lat: 33.8288, lon: 51.682, type: 'oil', bonus: 3.1, icon: '🛢️', region: 'Иран', reserve: 923.6, area: 785.0, depth: 4575 },
  { id: 'field_65', name: 'Западная Сибирь-65', lat: 61.9402, lon: 74.1098, type: 'oil', bonus: 1.5, icon: '🛢️', region: 'Западная Сибирь', reserve: 457.2, area: 696.1, depth: 1688 },
  { id: 'field_66', name: 'Западная Сибирь-66', lat: 61.791, lon: 65.2915, type: 'gas', bonus: 2.0, icon: '⛽', region: 'Западная Сибирь', reserve: 885.7, area: 237.0, depth: 3653 },
  { id: 'field_67', name: 'Саудовская Аравия-67', lat: 20.8191, lon: 38.3295, type: 'oil', bonus: 3.5, icon: '🛢️', region: 'Саудовская Аравия', reserve: 382.5, area: 527.1, depth: 529 },
  { id: 'field_68', name: 'Бразилия (шельф)-68', lat: -10.907, lon: -47.0096, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Бразилия (шельф)', reserve: 276.6, area: 389.4, depth: 1137 },
  { id: 'field_69', name: 'Северная Дакота-69', lat: 45.8719, lon: -98.4043, type: 'oil', bonus: 1.7, icon: '🛢️', region: 'Северная Дакота', reserve: 626.9, area: 603.4, depth: 1138 },
  { id: 'field_70', name: 'Колумбия-70', lat: 1.6377, lon: -73.9565, type: 'oil', bonus: 3.3, icon: '🛢️', region: 'Колумбия', reserve: 597.0, area: 728.3, depth: 3274 },
  { id: 'field_71', name: 'Катар-71', lat: 26.145, lon: 50.152, type: 'gas', bonus: 1.5, icon: '⛽', region: 'Катар', reserve: 783.9, area: 683.2, depth: 1191 },
  { id: 'field_72', name: 'Северное море-72', lat: 58.5275, lon: -3.425, type: 'gas', bonus: 2.8, icon: '⛽', region: 'Северное море', reserve: 115.5, area: 525.1, depth: 303 },
  { id: 'field_73', name: 'Румыния-73', lat: 47.1117, lon: 22.8443, type: 'gas', bonus: 2.7, icon: '⛽', region: 'Румыния', reserve: 837.3, area: 571.7, depth: 3767 },
  { id: 'field_74', name: 'Поволжье-74', lat: 53.6522, lon: 54.5046, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Поволжье', reserve: 834.4, area: 482.1, depth: 2840 },
  { id: 'field_75', name: 'Румыния-75', lat: 47.1537, lon: 22.6933, type: 'gas', bonus: 1.8, icon: '⛽', region: 'Румыния', reserve: 491.5, area: 496.1, depth: 3304 },
  { id: 'field_76', name: 'Иран-76', lat: 31.426, lon: 50.1753, type: 'gas', bonus: 1.8, icon: '⛽', region: 'Иран', reserve: 807.9, area: 285.5, depth: 2463 },
  { id: 'field_77', name: 'Мексиканский залив-77', lat: 24.1995, lon: -94.7073, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Мексиканский залив', reserve: 514.1, area: 611.4, depth: 4100 },
  { id: 'field_78', name: 'Алжир-78', lat: 30.4174, lon: 7.5152, type: 'gas', bonus: 1.9, icon: '⛽', region: 'Алжир', reserve: 434.2, area: 209.8, depth: 4964 },
  { id: 'field_79', name: 'ОАЭ/Кувейт-79', lat: 26.4278, lon: 49.4376, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'ОАЭ/Кувейт', reserve: 481.1, area: 259.2, depth: 2088 },
  { id: 'field_80', name: 'Ямал-80', lat: 68.1555, lon: 66.5542, type: 'gas', bonus: 1.7, icon: '⛽', region: 'Ямал', reserve: 751.7, area: 235.7, depth: 4497 },
  { id: 'field_81', name: 'Нигерия-81', lat: 13.8051, lon: 12.8242, type: 'gas', bonus: 1.8, icon: '⛽', region: 'Нигерия', reserve: 220.5, area: 31.0, depth: 4575 },
  { id: 'field_82', name: 'Ямал-82', lat: 67.2731, lon: 65.7088, type: 'gas', bonus: 2.8, icon: '⛽', region: 'Ямал', reserve: 170.0, area: 697.4, depth: 4221 },
  { id: 'field_83', name: 'Сахалин-83', lat: 48.0736, lon: 142.1374, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Сахалин', reserve: 225.1, area: 60.1, depth: 4113 },
  { id: 'field_84', name: 'Сахалин-84', lat: 48.3921, lon: 142.967, type: 'gas', bonus: 1.6, icon: '⛽', region: 'Сахалин', reserve: 820.6, area: 760.3, depth: 897 },
  { id: 'field_85', name: 'Австралия (сев.)-85', lat: -23.2232, lon: 129.5822, type: 'gas', bonus: 3.0, icon: '⛽', region: 'Австралия (сев.)', reserve: 411.4, area: 728.6, depth: 2635 },
  { id: 'field_86', name: 'Казахстан-86', lat: 51.8804, lon: 61.2991, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Казахстан', reserve: 753.1, area: 759.1, depth: 1902 },
  { id: 'field_87', name: 'Ливия-87', lat: 24.9111, lon: 10.299, type: 'oil', bonus: 1.7, icon: '🛢️', region: 'Ливия', reserve: 121.3, area: 22.1, depth: 3890 },
  { id: 'field_88', name: 'Египет-88', lat: 26.2292, lon: 24.4243, type: 'gas', bonus: 2.9, icon: '⛽', region: 'Египет', reserve: 717.8, area: 374.1, depth: 2112 },
  { id: 'field_89', name: 'Китай (Синьцзян)-89', lat: 45.4539, lon: 89.8766, type: 'oil', bonus: 2.2, icon: '🛢️', region: 'Китай (Синьцзян)', reserve: 567.3, area: 525.2, depth: 2376 },
  { id: 'field_90', name: 'Норвегия-90', lat: 57.1426, lon: 8.314, type: 'gas', bonus: 2.6, icon: '⛽', region: 'Норвегия', reserve: 833.0, area: 738.5, depth: 3797 },
  { id: 'field_91', name: 'Ямал-91', lat: 71.1321, lon: 74.0965, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Ямал', reserve: 519.1, area: 82.7, depth: 526 },
  { id: 'field_92', name: 'Азербайджан-92', lat: 40.9381, lon: 48.226, type: 'oil', bonus: 1.5, icon: '🛢️', region: 'Азербайджан', reserve: 963.8, area: 672.0, depth: 4912 },
  { id: 'field_93', name: 'Нигерия-93', lat: 4.2075, lon: 11.9419, type: 'gas', bonus: 2.6, icon: '⛽', region: 'Нигерия', reserve: 775.0, area: 156.6, depth: 4451 },
  { id: 'field_94', name: 'Алжир-94', lat: 34.2447, lon: 0.1779, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Алжир', reserve: 517.1, area: 91.2, depth: 3050 },
  { id: 'field_95', name: 'Катар-95', lat: 24.9632, lon: 50.2092, type: 'gas', bonus: 2.0, icon: '⛽', region: 'Катар', reserve: 709.0, area: 244.8, depth: 3480 },
  { id: 'field_96', name: 'Северное море-96', lat: 58.4008, lon: 2.3676, type: 'gas', bonus: 1.9, icon: '⛽', region: 'Северное море', reserve: 160.1, area: 622.6, depth: 4415 },
  { id: 'field_97', name: 'Норвегия-97', lat: 56.0184, lon: 26.6036, type: 'gas', bonus: 2.2, icon: '⛽', region: 'Норвегия', reserve: 228.2, area: 302.2, depth: 4283 },
  { id: 'field_98', name: 'Ливия-98', lat: 30.3599, lon: 12.2569, type: 'oil', bonus: 3.3, icon: '🛢️', region: 'Ливия', reserve: 466.2, area: 564.6, depth: 1194 },
  { id: 'field_99', name: 'Западная Сибирь-99', lat: 64.3002, lon: 79.9828, type: 'oil', bonus: 2.0, icon: '🛢️', region: 'Западная Сибирь', reserve: 63.0, area: 338.2, depth: 2040 },
  { id: 'field_100', name: 'Австралия (сев.)-100', lat: -11.3061, lon: 122.6133, type: 'gas', bonus: 2.7, icon: '⛽', region: 'Австралия (сев.)', reserve: 196.3, area: 747.5, depth: 2590 },
  { id: 'field_101', name: 'Канада (Альберта)-101', lat: 52.0077, lon: -103.3055, type: 'gas', bonus: 1.8, icon: '⛽', region: 'Канада (Альберта)', reserve: 573.7, area: 319.2, depth: 4363 },
  { id: 'field_102', name: 'Бразилия (шельф)-102', lat: -25.5428, lon: -48.9528, type: 'gas', bonus: 2.0, icon: '⛽', region: 'Бразилия (шельф)', reserve: 798.3, area: 228.4, depth: 221 },
  { id: 'field_103', name: 'Ирак-103', lat: 31.3884, lon: 43.8694, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Ирак', reserve: 474.2, area: 397.8, depth: 2923 },
  { id: 'field_104', name: 'Мексиканский залив-104', lat: 24.5212, lon: -91.5359, type: 'gas', bonus: 3.2, icon: '⛽', region: 'Мексиканский залив', reserve: 981.7, area: 206.3, depth: 3337 },
  { id: 'field_105', name: 'Саудовская Аравия-105', lat: 27.7554, lon: 38.742, type: 'gas', bonus: 2.9, icon: '⛽', region: 'Саудовская Аравия', reserve: 820.8, area: 321.1, depth: 1446 },
  { id: 'field_106', name: 'Канада (Альберта)-106', lat: 49.4072, lon: -109.9542, type: 'gas', bonus: 3.2, icon: '⛽', region: 'Канада (Альберта)', reserve: 880.5, area: 363.4, depth: 4508 },
  { id: 'field_107', name: 'Туркменистан-107', lat: 35.1228, lon: 54.0182, type: 'gas', bonus: 1.5, icon: '⛽', region: 'Туркменистан', reserve: 792.4, area: 226.7, depth: 3456 },
  { id: 'field_108', name: 'Алжир-108', lat: 33.6659, lon: 8.2281, type: 'oil', bonus: 3.4, icon: '🛢️', region: 'Алжир', reserve: 645.5, area: 712.2, depth: 4197 },
  { id: 'field_109', name: 'Казахстан-109', lat: 40.4308, lon: 52.5316, type: 'gas', bonus: 3.5, icon: '⛽', region: 'Казахстан', reserve: 759.4, area: 358.5, depth: 1006 },
  { id: 'field_110', name: 'Бразилия (шельф)-110', lat: -15.33, lon: -48.4924, type: 'oil', bonus: 2.8, icon: '🛢️', region: 'Бразилия (шельф)', reserve: 908.3, area: 55.9, depth: 659 },
  { id: 'field_111', name: 'Ирак-111', lat: 31.9987, lon: 39.4557, type: 'oil', bonus: 2.5, icon: '🛢️', region: 'Ирак', reserve: 802.9, area: 152.6, depth: 846 },
  { id: 'field_112', name: 'Нигерия-112', lat: 7.8254, lon: 10.8807, type: 'gas', bonus: 3.3, icon: '⛽', region: 'Нигерия', reserve: 186.0, area: 379.7, depth: 2280 },
  { id: 'field_113', name: 'Техас-113', lat: 32.3352, lon: -94.3142, type: 'gas', bonus: 3.3, icon: '⛽', region: 'Техас', reserve: 693.7, area: 143.2, depth: 3818 },
  { id: 'field_114', name: 'Индонезия-114', lat: 4.8395, lon: 108.7611, type: 'gas', bonus: 2.8, icon: '⛽', region: 'Индонезия', reserve: 484.0, area: 255.7, depth: 3351 },
  { id: 'field_115', name: 'Казахстан-115', lat: 41.2798, lon: 64.1105, type: 'gas', bonus: 2.6, icon: '⛽', region: 'Казахстан', reserve: 993.1, area: 250.3, depth: 3442 },
  { id: 'field_116', name: 'Ирак-116', lat: 33.5274, lon: 44.858, type: 'oil', bonus: 3.3, icon: '🛢️', region: 'Ирак', reserve: 757.9, area: 669.6, depth: 2544 },
  { id: 'field_117', name: 'Колумбия-117', lat: 2.3012, lon: -67.5749, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Колумбия', reserve: 639.8, area: 548.7, depth: 1320 },
  { id: 'field_118', name: 'Ливия-118', lat: 31.9374, lon: 19.3414, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Ливия', reserve: 81.7, area: 304.6, depth: 1276 },
  { id: 'field_119', name: 'Восточная Сибирь-119', lat: 57.9511, lon: 118.6366, type: 'oil', bonus: 1.7, icon: '🛢️', region: 'Восточная Сибирь', reserve: 797.2, area: 703.6, depth: 3197 },
  { id: 'field_120', name: 'Канада (Альберта)-120', lat: 59.0484, lon: -103.3905, type: 'gas', bonus: 3.3, icon: '⛽', region: 'Канада (Альберта)', reserve: 947.0, area: 774.6, depth: 2617 },
  { id: 'field_121', name: 'Бразилия (шельф)-121', lat: -21.9031, lon: -48.2725, type: 'oil', bonus: 1.6, icon: '🛢️', region: 'Бразилия (шельф)', reserve: 968.2, area: 690.9, depth: 3455 },
  { id: 'field_122', name: 'Малайзия-122', lat: 6.6321, lon: 106.3155, type: 'gas', bonus: 1.3, icon: '⛽', region: 'Малайзия', reserve: 559.7, area: 374.7, depth: 2347 },
  { id: 'field_123', name: 'Нигерия-123', lat: 12.2242, lon: 14.2238, type: 'oil', bonus: 2.8, icon: '🛢️', region: 'Нигерия', reserve: 497.9, area: 503.2, depth: 4799 },
  { id: 'field_124', name: 'Иран-124', lat: 32.9311, lon: 56.3054, type: 'gas', bonus: 3.3, icon: '⛽', region: 'Иран', reserve: 337.1, area: 338.5, depth: 1345 },
  { id: 'field_125', name: 'Западная Сибирь-125', lat: 58.3721, lon: 84.8982, type: 'oil', bonus: 1.5, icon: '🛢️', region: 'Западная Сибирь', reserve: 892.9, area: 125.8, depth: 3916 },
  { id: 'field_126', name: 'ОАЭ/Кувейт-126', lat: 29.595, lon: 52.9648, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'ОАЭ/Кувейт', reserve: 740.3, area: 710.6, depth: 1011 },
  { id: 'field_127', name: 'Норвегия-127', lat: 65.8504, lon: 28.4154, type: 'gas', bonus: 1.4, icon: '⛽', region: 'Норвегия', reserve: 402.0, area: 365.8, depth: 2134 },
  { id: 'field_128', name: 'Казахстан-128', lat: 41.1923, lon: 75.3702, type: 'gas', bonus: 1.4, icon: '⛽', region: 'Казахстан', reserve: 312.1, area: 775.2, depth: 3925 },
  { id: 'field_129', name: 'Восточная Сибирь-129', lat: 57.1211, lon: 113.7772, type: 'oil', bonus: 1.4, icon: '🛢️', region: 'Восточная Сибирь', reserve: 366.8, area: 791.3, depth: 4825 },
  { id: 'field_130', name: 'Саудовская Аравия-130', lat: 28.2982, lon: 47.4215, type: 'oil', bonus: 3.1, icon: '🛢️', region: 'Саудовская Аравия', reserve: 271.3, area: 624.0, depth: 223 },
  { id: 'field_131', name: 'Ирак-131', lat: 36.8722, lon: 47.8753, type: 'oil', bonus: 3.1, icon: '🛢️', region: 'Ирак', reserve: 154.4, area: 695.8, depth: 1279 },
  { id: 'field_132', name: 'Западная Сибирь-132', lat: 65.8998, lon: 65.9483, type: 'gas', bonus: 1.3, icon: '⛽', region: 'Западная Сибирь', reserve: 302.1, area: 118.9, depth: 3648 },
  { id: 'field_133', name: 'Канада (Альберта)-133', lat: 57.2023, lon: -110.4751, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Канада (Альберта)', reserve: 153.6, area: 413.0, depth: 555 },
  { id: 'field_134', name: 'Венесуэла-134', lat: 11.3613, lon: -64.4343, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Венесуэла', reserve: 965.8, area: 67.4, depth: 4123 },
  { id: 'field_135', name: 'Румыния-135', lat: 45.1314, lon: 22.8637, type: 'gas', bonus: 1.5, icon: '⛽', region: 'Румыния', reserve: 126.8, area: 494.5, depth: 738 },
  { id: 'field_136', name: 'Ямал-136', lat: 70.7459, lon: 72.6097, type: 'gas', bonus: 2.1, icon: '⛽', region: 'Ямал', reserve: 617.5, area: 250.0, depth: 4341 },
  { id: 'field_137', name: 'Нигерия-137', lat: 4.9918, lon: 11.1231, type: 'oil', bonus: 2.2, icon: '🛢️', region: 'Нигерия', reserve: 893.7, area: 342.8, depth: 3915 },
  { id: 'field_138', name: 'Катар-138', lat: 26.1888, lon: 50.6251, type: 'gas', bonus: 2.8, icon: '⛽', region: 'Катар', reserve: 405.6, area: 139.1, depth: 4085 },
  { id: 'field_139', name: 'Западная Сибирь-139', lat: 66.3177, lon: 62.3308, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Западная Сибирь', reserve: 404.0, area: 121.5, depth: 691 },
  { id: 'field_140', name: 'Нигерия-140', lat: 9.6159, lon: 6.2854, type: 'oil', bonus: 2.2, icon: '🛢️', region: 'Нигерия', reserve: 879.9, area: 754.1, depth: 3664 },
  { id: 'field_141', name: 'Казахстан-141', lat: 48.6527, lon: 85.8307, type: 'gas', bonus: 2.1, icon: '⛽', region: 'Казахстан', reserve: 599.0, area: 185.9, depth: 4150 },
  { id: 'field_142', name: 'Саудовская Аравия-142', lat: 21.0822, lon: 52.3713, type: 'gas', bonus: 1.6, icon: '⛽', region: 'Саудовская Аравия', reserve: 314.6, area: 196.4, depth: 3715 },
  { id: 'field_143', name: 'Румыния-143', lat: 47.8727, lon: 28.5474, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Румыния', reserve: 674.9, area: 560.9, depth: 437 },
  { id: 'field_144', name: 'Поволжье-144', lat: 54.9189, lon: 51.0898, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Поволжье', reserve: 222.3, area: 131.7, depth: 3483 },
  { id: 'field_145', name: 'Восточная Сибирь-145', lat: 62.4097, lon: 128.7315, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Восточная Сибирь', reserve: 254.4, area: 347.5, depth: 2992 },
  { id: 'field_146', name: 'Каспий (РФ)-146', lat: 45.2465, lon: 50.6219, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Каспий (РФ)', reserve: 197.8, area: 608.5, depth: 607 },
  { id: 'field_147', name: 'Ангола-147', lat: -14.1906, lon: 19.9291, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Ангола', reserve: 443.5, area: 188.1, depth: 4397 },
  { id: 'field_148', name: 'Сахалин-148', lat: 50.5795, lon: 142.133, type: 'oil', bonus: 2.5, icon: '🛢️', region: 'Сахалин', reserve: 343.0, area: 192.0, depth: 648 },
  { id: 'field_149', name: 'Западная Сибирь-149', lat: 61.0142, lon: 65.2808, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Западная Сибирь', reserve: 325.0, area: 113.6, depth: 4274 },
  { id: 'field_150', name: 'Бразилия (шельф)-150', lat: -24.8375, lon: -44.2969, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Бразилия (шельф)', reserve: 841.7, area: 648.8, depth: 790 },
  { id: 'field_151', name: 'Катар-151', lat: 26.2261, lon: 50.8724, type: 'gas', bonus: 3.3, icon: '⛽', region: 'Катар', reserve: 869.0, area: 469.1, depth: 4897 },
  { id: 'field_152', name: 'Катар-152', lat: 25.9204, lon: 50.579, type: 'gas', bonus: 1.3, icon: '⛽', region: 'Катар', reserve: 358.5, area: 645.0, depth: 3969 },
  { id: 'field_153', name: 'Норвегия-153', lat: 70.7163, lon: 6.2914, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Норвегия', reserve: 609.4, area: 428.7, depth: 3442 },
  { id: 'field_154', name: 'Казахстан-154', lat: 48.9497, lon: 58.1982, type: 'oil', bonus: 1.5, icon: '🛢️', region: 'Казахстан', reserve: 651.6, area: 433.9, depth: 1788 },
  { id: 'field_155', name: 'Туркменистан-155', lat: 37.795, lon: 62.1833, type: 'gas', bonus: 1.8, icon: '⛽', region: 'Туркменистан', reserve: 189.1, area: 173.9, depth: 1452 },
  { id: 'field_156', name: 'Бразилия (шельф)-156', lat: -16.2008, lon: -47.3428, type: 'gas', bonus: 2.3, icon: '⛽', region: 'Бразилия (шельф)', reserve: 585.5, area: 472.0, depth: 4824 },
  { id: 'field_157', name: 'Алжир-157', lat: 34.8788, lon: 1.8785, type: 'oil', bonus: 1.6, icon: '🛢️', region: 'Алжир', reserve: 114.9, area: 364.9, depth: 2680 },
  { id: 'field_158', name: 'Северное море-158', lat: 58.7314, lon: 0.9272, type: 'oil', bonus: 2.0, icon: '🛢️', region: 'Северное море', reserve: 479.3, area: 64.4, depth: 2551 },
  { id: 'field_159', name: 'Восточная Сибирь-159', lat: 63.6425, lon: 123.4882, type: 'gas', bonus: 2.3, icon: '⛽', region: 'Восточная Сибирь', reserve: 576.6, area: 637.6, depth: 536 },
  { id: 'field_160', name: 'Техас-160', lat: 33.908, lon: -97.5261, type: 'gas', bonus: 2.6, icon: '⛽', region: 'Техас', reserve: 526.3, area: 767.0, depth: 3890 },
  { id: 'field_161', name: 'Сахалин-161', lat: 53.3948, lon: 142.3738, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Сахалин', reserve: 213.9, area: 213.2, depth: 3786 },
  { id: 'field_162', name: 'Австралия (сев.)-162', lat: -17.139, lon: 126.0255, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Австралия (сев.)', reserve: 318.7, area: 338.8, depth: 2971 },
  { id: 'field_163', name: 'Ангола-163', lat: -17.2669, lon: 19.4633, type: 'oil', bonus: 1.4, icon: '🛢️', region: 'Ангола', reserve: 139.8, area: 549.1, depth: 2527 },
  { id: 'field_164', name: 'Саудовская Аравия-164', lat: 28.5157, lon: 54.395, type: 'oil', bonus: 2.0, icon: '🛢️', region: 'Саудовская Аравия', reserve: 603.6, area: 130.3, depth: 3065 },
  { id: 'field_165', name: 'Ирак-165', lat: 34.2484, lon: 44.6214, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Ирак', reserve: 941.1, area: 261.5, depth: 3285 },
  { id: 'field_166', name: 'Алжир-166', lat: 28.9563, lon: -0.4665, type: 'gas', bonus: 2.7, icon: '⛽', region: 'Алжир', reserve: 452.2, area: 302.2, depth: 3170 },
  { id: 'field_167', name: 'Ирак-167', lat: 36.6094, lon: 41.4173, type: 'oil', bonus: 1.7, icon: '🛢️', region: 'Ирак', reserve: 1000.0, area: 140.9, depth: 2623 },
  { id: 'field_168', name: 'Румыния-168', lat: 43.5057, lon: 28.167, type: 'oil', bonus: 2.8, icon: '🛢️', region: 'Румыния', reserve: 882.6, area: 502.1, depth: 3286 },
  { id: 'field_169', name: 'Каспий (РФ)-169', lat: 44.7234, lon: 52.4642, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Каспий (РФ)', reserve: 91.5, area: 304.2, depth: 2145 },
  { id: 'field_170', name: 'Малайзия-170', lat: 5.2742, lon: 114.0478, type: 'gas', bonus: 1.8, icon: '⛽', region: 'Малайзия', reserve: 277.2, area: 773.2, depth: 4042 },
  { id: 'field_171', name: 'Туркменистан-171', lat: 36.5521, lon: 61.4963, type: 'gas', bonus: 2.3, icon: '⛽', region: 'Туркменистан', reserve: 317.7, area: 317.9, depth: 4520 },
  { id: 'field_172', name: 'Техас-172', lat: 26.7826, lon: -103.4039, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Техас', reserve: 99.6, area: 394.9, depth: 3240 },
  { id: 'field_173', name: 'Мексиканский залив-173', lat: 19.2311, lon: -86.8493, type: 'oil', bonus: 1.9, icon: '🛢️', region: 'Мексиканский залив', reserve: 775.0, area: 232.8, depth: 4405 },
  { id: 'field_174', name: 'Ямал-174', lat: 69.6248, lon: 77.3034, type: 'gas', bonus: 3.1, icon: '⛽', region: 'Ямал', reserve: 890.4, area: 745.8, depth: 3598 },
  { id: 'field_175', name: 'Западная Сибирь-175', lat: 63.0201, lon: 65.8945, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Западная Сибирь', reserve: 76.8, area: 746.0, depth: 2946 },
  { id: 'field_176', name: 'Северное море-176', lat: 55.1008, lon: 0.0163, type: 'gas', bonus: 2.8, icon: '⛽', region: 'Северное море', reserve: 181.9, area: 570.3, depth: 3874 },
  { id: 'field_177', name: 'Ливия-177', lat: 31.9644, lon: 9.3041, type: 'oil', bonus: 3.1, icon: '🛢️', region: 'Ливия', reserve: 571.4, area: 587.2, depth: 4523 },
  { id: 'field_178', name: 'Техас-178', lat: 33.5379, lon: -102.9107, type: 'oil', bonus: 1.4, icon: '🛢️', region: 'Техас', reserve: 448.8, area: 639.2, depth: 3944 },
  { id: 'field_179', name: 'Западная Сибирь-179', lat: 66.3669, lon: 72.4957, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Западная Сибирь', reserve: 596.3, area: 580.5, depth: 2586 },
  { id: 'field_180', name: 'Техас-180', lat: 31.7629, lon: -102.8727, type: 'gas', bonus: 1.7, icon: '⛽', region: 'Техас', reserve: 684.8, area: 428.3, depth: 3154 },
  { id: 'field_181', name: 'Западная Сибирь-181', lat: 63.2606, lon: 72.6832, type: 'oil', bonus: 2.2, icon: '🛢️', region: 'Западная Сибирь', reserve: 496.6, area: 515.8, depth: 3258 },
  { id: 'field_182', name: 'Саудовская Аравия-182', lat: 20.1624, lon: 51.4048, type: 'gas', bonus: 1.8, icon: '⛽', region: 'Саудовская Аравия', reserve: 674.2, area: 100.9, depth: 4966 },
  { id: 'field_183', name: 'Венесуэла-183', lat: 7.3276, lon: -72.4236, type: 'oil', bonus: 3.1, icon: '🛢️', region: 'Венесуэла', reserve: 216.3, area: 627.7, depth: 4006 },
  { id: 'field_184', name: 'Малайзия-184', lat: 4.3497, lon: 102.6456, type: 'oil', bonus: 1.4, icon: '🛢️', region: 'Малайзия', reserve: 787.4, area: 377.0, depth: 2603 },
  { id: 'field_185', name: 'Саудовская Аравия-185', lat: 27.9111, lon: 53.0584, type: 'gas', bonus: 3.4, icon: '⛽', region: 'Саудовская Аравия', reserve: 539.6, area: 791.5, depth: 4648 },
  { id: 'field_186', name: 'Аляска-186', lat: 60.4028, lon: -149.8868, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Аляска', reserve: 791.8, area: 695.3, depth: 2919 },
  { id: 'field_187', name: 'Ирак-187', lat: 35.3947, lon: 42.3695, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Ирак', reserve: 899.9, area: 321.6, depth: 1730 },
  { id: 'field_188', name: 'Канада (Альберта)-188', lat: 54.4728, lon: -101.5138, type: 'gas', bonus: 3.1, icon: '⛽', region: 'Канада (Альберта)', reserve: 740.7, area: 81.6, depth: 1678 },
  { id: 'field_189', name: 'Мексиканский залив-189', lat: 21.8545, lon: -96.0392, type: 'gas', bonus: 2.0, icon: '⛽', region: 'Мексиканский залив', reserve: 622.5, area: 352.4, depth: 3836 },
  { id: 'field_190', name: 'Иран-190', lat: 25.5506, lon: 60.5307, type: 'gas', bonus: 2.7, icon: '⛽', region: 'Иран', reserve: 463.2, area: 518.8, depth: 669 },
  { id: 'field_191', name: 'Восточная Сибирь-191', lat: 61.3751, lon: 101.349, type: 'oil', bonus: 3.4, icon: '🛢️', region: 'Восточная Сибирь', reserve: 185.6, area: 493.9, depth: 3789 },
  { id: 'field_192', name: 'Западная Сибирь-192', lat: 58.6723, lon: 79.4629, type: 'gas', bonus: 2.1, icon: '⛽', region: 'Западная Сибирь', reserve: 952.0, area: 45.3, depth: 1456 },
  { id: 'field_193', name: 'Ангола-193', lat: -4.7165, lon: 15.5802, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Ангола', reserve: 553.0, area: 330.5, depth: 2483 },
  { id: 'field_194', name: 'Саудовская Аравия-194', lat: 21.1345, lon: 50.5065, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Саудовская Аравия', reserve: 917.9, area: 111.9, depth: 2332 },
  { id: 'field_195', name: 'Египет-195', lat: 23.9311, lon: 31.9544, type: 'gas', bonus: 1.7, icon: '⛽', region: 'Египет', reserve: 178.9, area: 77.8, depth: 1614 },
  { id: 'field_196', name: 'Азербайджан-196', lat: 39.7804, lon: 44.6145, type: 'oil', bonus: 2.8, icon: '🛢️', region: 'Азербайджан', reserve: 724.1, area: 449.0, depth: 2578 },
  { id: 'field_197', name: 'Азербайджан-197', lat: 41.4054, lon: 48.9827, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Азербайджан', reserve: 533.3, area: 114.7, depth: 1846 },
  { id: 'field_198', name: 'Северное море-198', lat: 55.8939, lon: 2.9163, type: 'gas', bonus: 2.5, icon: '⛽', region: 'Северное море', reserve: 400.5, area: 646.9, depth: 4719 },
  { id: 'field_199', name: 'Ямал-199', lat: 72.3055, lon: 65.8547, type: 'gas', bonus: 3.5, icon: '⛽', region: 'Ямал', reserve: 732.9, area: 430.0, depth: 3554 },
  { id: 'field_200', name: 'Норвегия-200', lat: 57.18, lon: 29.2819, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Норвегия', reserve: 696.1, area: 288.7, depth: 4716 },
  { id: 'field_201', name: 'Ливия-201', lat: 24.0016, lon: 24.4602, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Ливия', reserve: 874.8, area: 668.5, depth: 4444 },
  { id: 'field_202', name: 'Каспий (РФ)-202', lat: 44.6586, lon: 50.6133, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Каспий (РФ)', reserve: 943.9, area: 718.0, depth: 846 },
  { id: 'field_203', name: 'Саудовская Аравия-203', lat: 26.3506, lon: 47.3643, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Саудовская Аравия', reserve: 633.7, area: 92.9, depth: 1581 },
  { id: 'field_204', name: 'Нигерия-204', lat: 9.8065, lon: 4.2256, type: 'gas', bonus: 3.2, icon: '⛽', region: 'Нигерия', reserve: 585.4, area: 663.7, depth: 432 },
  { id: 'field_205', name: 'Восточная Сибирь-205', lat: 64.4855, lon: 119.696, type: 'gas', bonus: 2.7, icon: '⛽', region: 'Восточная Сибирь', reserve: 778.6, area: 344.9, depth: 448 },
  { id: 'field_206', name: 'Канада (Альберта)-206', lat: 55.8988, lon: -114.2066, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Канада (Альберта)', reserve: 814.5, area: 554.3, depth: 2636 },
  { id: 'field_207', name: 'Техас-207', lat: 32.5747, lon: -103.945, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Техас', reserve: 243.8, area: 493.2, depth: 2760 },
  { id: 'field_208', name: 'Казахстан-208', lat: 43.8318, lon: 86.5569, type: 'gas', bonus: 3.4, icon: '⛽', region: 'Казахстан', reserve: 174.2, area: 309.0, depth: 4801 },
  { id: 'field_209', name: 'Сахалин-209', lat: 49.4504, lon: 141.4901, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Сахалин', reserve: 142.0, area: 246.4, depth: 3346 },
  { id: 'field_210', name: 'Казахстан-210', lat: 45.0176, lon: 85.6194, type: 'oil', bonus: 3.1, icon: '🛢️', region: 'Казахстан', reserve: 937.1, area: 582.5, depth: 1755 },
  { id: 'field_211', name: 'Бразилия (шельф)-211', lat: -19.0312, lon: -42.2791, type: 'gas', bonus: 3.2, icon: '⛽', region: 'Бразилия (шельф)', reserve: 522.5, area: 90.2, depth: 3421 },
  { id: 'field_212', name: 'Канада (Альберта)-212', lat: 59.6336, lon: -115.6971, type: 'gas', bonus: 1.4, icon: '⛽', region: 'Канада (Альберта)', reserve: 317.3, area: 486.1, depth: 4055 },
  { id: 'field_213', name: 'Ирак-213', lat: 29.0654, lon: 39.075, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Ирак', reserve: 741.1, area: 615.8, depth: 3197 },
  { id: 'field_214', name: 'Западная Сибирь-214', lat: 58.5116, lon: 74.0454, type: 'gas', bonus: 2.5, icon: '⛽', region: 'Западная Сибирь', reserve: 119.9, area: 413.3, depth: 4704 },
  { id: 'field_215', name: 'Ирак-215', lat: 36.9127, lon: 44.804, type: 'oil', bonus: 1.6, icon: '🛢️', region: 'Ирак', reserve: 141.8, area: 311.1, depth: 2977 },
  { id: 'field_216', name: 'Мексиканский залив-216', lat: 22.3873, lon: -95.2688, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Мексиканский залив', reserve: 93.0, area: 126.9, depth: 2928 },
  { id: 'field_217', name: 'Северное море-217', lat: 58.1547, lon: -1.9148, type: 'oil', bonus: 2.0, icon: '🛢️', region: 'Северное море', reserve: 632.4, area: 146.8, depth: 2651 },
  { id: 'field_218', name: 'Нигерия-218', lat: 9.0731, lon: 8.6263, type: 'gas', bonus: 2.9, icon: '⛽', region: 'Нигерия', reserve: 334.8, area: 656.3, depth: 3217 },
  { id: 'field_219', name: 'Иран-219', lat: 26.4249, lon: 51.9143, type: 'gas', bonus: 3.1, icon: '⛽', region: 'Иран', reserve: 739.1, area: 556.7, depth: 418 },
  { id: 'field_220', name: 'Нигерия-220', lat: 6.6553, lon: 10.5227, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Нигерия', reserve: 604.3, area: 153.0, depth: 3314 },
  { id: 'field_221', name: 'Каспий (РФ)-221', lat: 46.7229, lon: 49.1579, type: 'oil', bonus: 1.7, icon: '🛢️', region: 'Каспий (РФ)', reserve: 469.0, area: 346.6, depth: 3582 },
  { id: 'field_222', name: 'Египет-222', lat: 25.6934, lon: 34.0746, type: 'gas', bonus: 3.2, icon: '⛽', region: 'Египет', reserve: 749.0, area: 68.6, depth: 1331 },
  { id: 'field_223', name: 'Канада (Альберта)-223', lat: 55.1698, lon: -100.0375, type: 'gas', bonus: 2.5, icon: '⛽', region: 'Канада (Альберта)', reserve: 348.1, area: 155.1, depth: 4567 },
  { id: 'field_224', name: 'Иран-224', lat: 29.6057, lon: 58.6678, type: 'gas', bonus: 2.6, icon: '⛽', region: 'Иран', reserve: 232.7, area: 212.3, depth: 4771 },
  { id: 'field_225', name: 'Ирак-225', lat: 36.5319, lon: 47.8226, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Ирак', reserve: 705.7, area: 401.4, depth: 4130 },
  { id: 'field_226', name: 'Иран-226', lat: 37.1381, lon: 59.1127, type: 'gas', bonus: 1.9, icon: '⛽', region: 'Иран', reserve: 594.8, area: 443.7, depth: 3432 },
  { id: 'field_227', name: 'Норвегия-227', lat: 71.2737, lon: 24.92, type: 'gas', bonus: 1.4, icon: '⛽', region: 'Норвегия', reserve: 957.5, area: 81.6, depth: 3823 },
  { id: 'field_228', name: 'Алжир-228', lat: 32.726, lon: 0.5678, type: 'oil', bonus: 3.4, icon: '🛢️', region: 'Алжир', reserve: 711.4, area: 127.1, depth: 2160 },
  { id: 'field_229', name: 'Саудовская Аравия-229', lat: 26.6983, lon: 47.0277, type: 'oil', bonus: 1.4, icon: '🛢️', region: 'Саудовская Аравия', reserve: 442.6, area: 579.5, depth: 1023 },
  { id: 'field_230', name: 'Ангола-230', lat: -16.0755, lon: 24.4678, type: 'oil', bonus: 2.2, icon: '🛢️', region: 'Ангола', reserve: 938.3, area: 705.2, depth: 4111 },
  { id: 'field_231', name: 'Алжир-231', lat: 32.8032, lon: 1.4469, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Алжир', reserve: 912.5, area: 89.8, depth: 4903 },
  { id: 'field_232', name: 'Саудовская Аравия-232', lat: 27.3869, lon: 52.4557, type: 'oil', bonus: 3.3, icon: '🛢️', region: 'Саудовская Аравия', reserve: 216.3, area: 708.2, depth: 1640 },
  { id: 'field_233', name: 'Китай (Синьцзян)-233', lat: 36.4361, lon: 95.5775, type: 'gas', bonus: 1.7, icon: '⛽', region: 'Китай (Синьцзян)', reserve: 761.6, area: 700.4, depth: 2571 },
  { id: 'field_234', name: 'Казахстан-234', lat: 40.1112, lon: 71.0146, type: 'oil', bonus: 3.3, icon: '🛢️', region: 'Казахстан', reserve: 368.3, area: 374.4, depth: 4650 },
  { id: 'field_235', name: 'Канада (Альберта)-235', lat: 58.7819, lon: -117.316, type: 'gas', bonus: 1.9, icon: '⛽', region: 'Канада (Альберта)', reserve: 818.4, area: 277.9, depth: 3959 },
  { id: 'field_236', name: 'Алжир-236', lat: 32.4674, lon: -1.831, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Алжир', reserve: 589.4, area: 610.7, depth: 1637 },
  { id: 'field_237', name: 'Нигерия-237', lat: 10.3873, lon: 7.2714, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Нигерия', reserve: 132.4, area: 542.0, depth: 1713 },
  { id: 'field_238', name: 'Малайзия-238', lat: 4.3422, lon: 117.7165, type: 'oil', bonus: 1.9, icon: '🛢️', region: 'Малайзия', reserve: 273.7, area: 607.9, depth: 2900 },
  { id: 'field_239', name: 'Ирак-239', lat: 34.7831, lon: 38.1144, type: 'oil', bonus: 2.8, icon: '🛢️', region: 'Ирак', reserve: 109.0, area: 112.2, depth: 2713 },
  { id: 'field_240', name: 'Каспий (РФ)-240', lat: 46.7443, lon: 53.6155, type: 'gas', bonus: 2.8, icon: '⛽', region: 'Каспий (РФ)', reserve: 656.8, area: 753.7, depth: 3210 },
  { id: 'field_241', name: 'Ливия-241', lat: 24.4104, lon: 11.1371, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Ливия', reserve: 989.4, area: 311.4, depth: 4699 },
  { id: 'field_242', name: 'Туркменистан-242', lat: 41.0588, lon: 63.2279, type: 'gas', bonus: 3.0, icon: '⛽', region: 'Туркменистан', reserve: 696.3, area: 484.7, depth: 870 },
  { id: 'field_243', name: 'Канада (Альберта)-243', lat: 54.8099, lon: -112.7643, type: 'oil', bonus: 1.4, icon: '🛢️', region: 'Канада (Альберта)', reserve: 570.3, area: 414.3, depth: 4891 },
  { id: 'field_244', name: 'Мексиканский залив-244', lat: 19.9744, lon: -86.7462, type: 'gas', bonus: 1.6, icon: '⛽', region: 'Мексиканский залив', reserve: 245.1, area: 474.9, depth: 944 },
  { id: 'field_245', name: 'Азербайджан-245', lat: 39.7819, lon: 44.3895, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Азербайджан', reserve: 484.0, area: 65.0, depth: 3987 },
  { id: 'field_246', name: 'Ангола-246', lat: -13.6856, lon: 10.3266, type: 'oil', bonus: 3.1, icon: '🛢️', region: 'Ангола', reserve: 758.5, area: 471.1, depth: 571 },
  { id: 'field_247', name: 'Техас-247', lat: 32.7042, lon: -98.9649, type: 'oil', bonus: 3.4, icon: '🛢️', region: 'Техас', reserve: 115.6, area: 748.3, depth: 459 },
  { id: 'field_248', name: 'Ирак-248', lat: 30.4399, lon: 39.3543, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Ирак', reserve: 896.8, area: 369.9, depth: 3292 },
  { id: 'field_249', name: 'ОАЭ/Кувейт-249', lat: 27.4618, lon: 52.6179, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'ОАЭ/Кувейт', reserve: 380.4, area: 159.2, depth: 4601 },
  { id: 'field_250', name: 'Катар-250', lat: 24.382, lon: 51.9574, type: 'gas', bonus: 3.0, icon: '⛽', region: 'Катар', reserve: 979.6, area: 381.1, depth: 4660 },
  { id: 'field_251', name: 'Техас-251', lat: 29.172, lon: -103.0144, type: 'gas', bonus: 2.1, icon: '⛽', region: 'Техас', reserve: 311.9, area: 751.2, depth: 1124 },
  { id: 'field_252', name: 'Западная Сибирь-252', lat: 64.602, lon: 75.3731, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Западная Сибирь', reserve: 113.9, area: 483.3, depth: 3857 },
  { id: 'field_253', name: 'Нигерия-253', lat: 11.0329, lon: 2.6328, type: 'oil', bonus: 2.2, icon: '🛢️', region: 'Нигерия', reserve: 272.6, area: 189.5, depth: 662 },
  { id: 'field_254', name: 'Ямал-254', lat: 72.9609, lon: 68.0441, type: 'gas', bonus: 2.6, icon: '⛽', region: 'Ямал', reserve: 783.9, area: 658.3, depth: 2140 },
  { id: 'field_255', name: 'Ирак-255', lat: 30.1461, lon: 44.6021, type: 'oil', bonus: 2.2, icon: '🛢️', region: 'Ирак', reserve: 311.4, area: 454.2, depth: 1634 },
  { id: 'field_256', name: 'Ливия-256', lat: 26.6992, lon: 16.9299, type: 'oil', bonus: 3.4, icon: '🛢️', region: 'Ливия', reserve: 687.8, area: 632.9, depth: 2811 },
  { id: 'field_257', name: 'Египет-257', lat: 25.6743, lon: 27.8986, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Египет', reserve: 499.8, area: 682.5, depth: 2663 },
  { id: 'field_258', name: 'Казахстан-258', lat: 41.7322, lon: 67.1319, type: 'oil', bonus: 2.5, icon: '🛢️', region: 'Казахстан', reserve: 969.4, area: 454.7, depth: 1298 },
  { id: 'field_259', name: 'ОАЭ/Кувейт-259', lat: 24.04, lon: 49.3026, type: 'oil', bonus: 3.3, icon: '🛢️', region: 'ОАЭ/Кувейт', reserve: 854.8, area: 92.1, depth: 1760 },
  { id: 'field_260', name: 'Западная Сибирь-260', lat: 61.7717, lon: 75.1242, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Западная Сибирь', reserve: 228.8, area: 614.1, depth: 4778 },
  { id: 'field_261', name: 'Саудовская Аравия-261', lat: 22.0889, lon: 53.4196, type: 'gas', bonus: 3.4, icon: '⛽', region: 'Саудовская Аравия', reserve: 64.6, area: 751.0, depth: 1161 },
  { id: 'field_262', name: 'Бразилия (шельф)-262', lat: -14.422, lon: -36.2834, type: 'oil', bonus: 2.2, icon: '🛢️', region: 'Бразилия (шельф)', reserve: 277.4, area: 270.9, depth: 2518 },
  { id: 'field_263', name: 'ОАЭ/Кувейт-263', lat: 26.2692, lon: 49.5926, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'ОАЭ/Кувейт', reserve: 888.7, area: 383.5, depth: 4046 },
  { id: 'field_264', name: 'Бразилия (шельф)-264', lat: -22.2358, lon: -46.9531, type: 'gas', bonus: 2.2, icon: '⛽', region: 'Бразилия (шельф)', reserve: 584.4, area: 192.6, depth: 1395 },
  { id: 'field_265', name: 'Западная Сибирь-265', lat: 63.5331, lon: 74.6008, type: 'gas', bonus: 1.9, icon: '⛽', region: 'Западная Сибирь', reserve: 236.4, area: 199.4, depth: 4867 },
  { id: 'field_266', name: 'Норвегия-266', lat: 63.9888, lon: 21.0198, type: 'gas', bonus: 1.9, icon: '⛽', region: 'Норвегия', reserve: 830.5, area: 773.9, depth: 4218 },
  { id: 'field_267', name: 'Техас-267', lat: 33.0605, lon: -101.4217, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Техас', reserve: 513.9, area: 735.2, depth: 4641 },
  { id: 'field_268', name: 'Австралия (сев.)-268', lat: -10.6414, lon: 124.0507, type: 'gas', bonus: 3.4, icon: '⛽', region: 'Австралия (сев.)', reserve: 684.8, area: 616.2, depth: 3578 },
  { id: 'field_269', name: 'Ямал-269', lat: 70.7842, lon: 65.8836, type: 'gas', bonus: 1.3, icon: '⛽', region: 'Ямал', reserve: 530.4, area: 311.1, depth: 4158 },
  { id: 'field_270', name: 'Алжир-270', lat: 26.1416, lon: 4.3865, type: 'oil', bonus: 1.3, icon: '🛢️', region: 'Алжир', reserve: 552.9, area: 234.3, depth: 2548 },
  { id: 'field_271', name: 'Западная Сибирь-271', lat: 66.1316, lon: 76.8508, type: 'oil', bonus: 1.5, icon: '🛢️', region: 'Западная Сибирь', reserve: 141.5, area: 136.1, depth: 1772 },
  { id: 'field_272', name: 'Ливия-272', lat: 24.7766, lon: 14.6711, type: 'oil', bonus: 1.5, icon: '🛢️', region: 'Ливия', reserve: 961.3, area: 378.0, depth: 2192 },
  { id: 'field_273', name: 'Австралия (сев.)-273', lat: -21.6121, lon: 127.733, type: 'gas', bonus: 2.7, icon: '⛽', region: 'Австралия (сев.)', reserve: 865.3, area: 612.5, depth: 965 },
  { id: 'field_274', name: 'Катар-274', lat: 25.1315, lon: 50.952, type: 'gas', bonus: 2.8, icon: '⛽', region: 'Катар', reserve: 128.6, area: 679.4, depth: 2913 },
  { id: 'field_275', name: 'Северная Дакота-275', lat: 48.4318, lon: -103.2371, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Северная Дакота', reserve: 906.2, area: 560.0, depth: 4843 },
  { id: 'field_276', name: 'Аляска-276', lat: 60.5122, lon: -165.9183, type: 'oil', bonus: 3.3, icon: '🛢️', region: 'Аляска', reserve: 585.3, area: 45.7, depth: 2776 },
  { id: 'field_277', name: 'Западная Сибирь-277', lat: 60.0716, lon: 63.6048, type: 'gas', bonus: 3.3, icon: '⛽', region: 'Западная Сибирь', reserve: 334.3, area: 459.9, depth: 4842 },
  { id: 'field_278', name: 'Норвегия-278', lat: 62.2265, lon: 27.3097, type: 'gas', bonus: 2.1, icon: '⛽', region: 'Норвегия', reserve: 752.8, area: 636.6, depth: 842 },
  { id: 'field_279', name: 'Канада (Альберта)-279', lat: 59.7176, lon: -118.9261, type: 'gas', bonus: 1.8, icon: '⛽', region: 'Канада (Альберта)', reserve: 122.2, area: 492.0, depth: 3449 },
  { id: 'field_280', name: 'Малайзия-280', lat: 3.2846, lon: 111.6825, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Малайзия', reserve: 388.0, area: 754.1, depth: 3737 },
  { id: 'field_281', name: 'Поволжье-281', lat: 54.1011, lon: 51.8007, type: 'oil', bonus: 3.1, icon: '🛢️', region: 'Поволжье', reserve: 727.5, area: 84.0, depth: 1463 },
  { id: 'field_282', name: 'ОАЭ/Кувейт-282', lat: 28.2711, lon: 47.5428, type: 'oil', bonus: 2.0, icon: '🛢️', region: 'ОАЭ/Кувейт', reserve: 151.2, area: 24.1, depth: 2725 },
  { id: 'field_283', name: 'Техас-283', lat: 33.3748, lon: -104.671, type: 'oil', bonus: 1.7, icon: '🛢️', region: 'Техас', reserve: 476.4, area: 452.7, depth: 3542 },
  { id: 'field_284', name: 'Сахалин-284', lat: 48.5377, lon: 143.2169, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Сахалин', reserve: 61.7, area: 342.8, depth: 893 },
  { id: 'field_285', name: 'Венесуэла-285', lat: 8.9168, lon: -60.0945, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Венесуэла', reserve: 211.1, area: 317.0, depth: 1337 },
  { id: 'field_286', name: 'Ирак-286', lat: 31.1473, lon: 39.4593, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Ирак', reserve: 450.0, area: 397.7, depth: 830 },
  { id: 'field_287', name: 'ОАЭ/Кувейт-287', lat: 29.5538, lon: 53.209, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'ОАЭ/Кувейт', reserve: 235.8, area: 103.4, depth: 2695 },
  { id: 'field_288', name: 'Западная Сибирь-288', lat: 61.9569, lon: 81.0403, type: 'gas', bonus: 3.1, icon: '⛽', region: 'Западная Сибирь', reserve: 363.1, area: 281.1, depth: 1315 },
  { id: 'field_289', name: 'Ирак-289', lat: 33.8257, lon: 44.9529, type: 'oil', bonus: 2.0, icon: '🛢️', region: 'Ирак', reserve: 966.3, area: 775.6, depth: 2587 },
  { id: 'field_290', name: 'Венесуэла-290', lat: 9.4303, lon: -60.4191, type: 'oil', bonus: 2.0, icon: '🛢️', region: 'Венесуэла', reserve: 316.3, area: 633.0, depth: 3190 },
  { id: 'field_291', name: 'Сахалин-291', lat: 51.3831, lon: 143.3689, type: 'gas', bonus: 2.8, icon: '⛽', region: 'Сахалин', reserve: 572.6, area: 763.3, depth: 3981 },
  { id: 'field_292', name: 'Китай (Синьцзян)-292', lat: 38.5158, lon: 94.5375, type: 'oil', bonus: 3.1, icon: '🛢️', region: 'Китай (Синьцзян)', reserve: 805.9, area: 339.1, depth: 4290 },
  { id: 'field_293', name: 'Ямал-293', lat: 68.817, lon: 68.2849, type: 'gas', bonus: 2.9, icon: '⛽', region: 'Ямал', reserve: 799.6, area: 77.7, depth: 4125 },
  { id: 'field_294', name: 'Нигерия-294', lat: 9.3437, lon: 14.0054, type: 'gas', bonus: 2.5, icon: '⛽', region: 'Нигерия', reserve: 801.2, area: 300.4, depth: 4598 },
  { id: 'field_295', name: 'Нигерия-295', lat: 13.144, lon: 3.4218, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Нигерия', reserve: 387.3, area: 524.7, depth: 562 },
  { id: 'field_296', name: 'Северная Дакота-296', lat: 47.5801, lon: -98.8261, type: 'oil', bonus: 3.4, icon: '🛢️', region: 'Северная Дакота', reserve: 458.9, area: 28.2, depth: 2319 },
  { id: 'field_297', name: 'Саудовская Аравия-297', lat: 27.4685, lon: 47.4859, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Саудовская Аравия', reserve: 421.6, area: 622.4, depth: 4299 },
  { id: 'field_298', name: 'Каспий (РФ)-298', lat: 47.9908, lon: 51.4139, type: 'gas', bonus: 2.2, icon: '⛽', region: 'Каспий (РФ)', reserve: 963.6, area: 110.5, depth: 1360 },
  { id: 'field_299', name: 'Иран-299', lat: 29.4599, lon: 58.9011, type: 'gas', bonus: 2.1, icon: '⛽', region: 'Иран', reserve: 142.7, area: 583.2, depth: 3906 },
  { id: 'field_300', name: 'Иран-300', lat: 28.9034, lon: 59.3935, type: 'oil', bonus: 1.3, icon: '🛢️', region: 'Иран', reserve: 375.9, area: 105.3, depth: 1546 },
  { id: 'field_301', name: 'Китай (Синьцзян)-301', lat: 44.8859, lon: 86.9318, type: 'oil', bonus: 2.0, icon: '🛢️', region: 'Китай (Синьцзян)', reserve: 455.1, area: 380.4, depth: 3518 },
  { id: 'field_302', name: 'Ливия-302', lat: 24.0503, lon: 19.5169, type: 'oil', bonus: 1.4, icon: '🛢️', region: 'Ливия', reserve: 633.4, area: 173.9, depth: 3718 },
  { id: 'field_303', name: 'ОАЭ/Кувейт-303', lat: 27.6379, lon: 48.0578, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'ОАЭ/Кувейт', reserve: 809.5, area: 438.8, depth: 3196 },
  { id: 'field_304', name: 'Иран-304', lat: 30.9482, lon: 48.9847, type: 'gas', bonus: 2.5, icon: '⛽', region: 'Иран', reserve: 657.2, area: 485.6, depth: 3415 },
  { id: 'field_305', name: 'Нигерия-305', lat: 7.4792, lon: 12.9917, type: 'oil', bonus: 3.1, icon: '🛢️', region: 'Нигерия', reserve: 720.7, area: 252.0, depth: 894 },
  { id: 'field_306', name: 'Ангола-306', lat: -13.6154, lon: 13.5786, type: 'oil', bonus: 1.7, icon: '🛢️', region: 'Ангола', reserve: 708.8, area: 418.4, depth: 3626 },
  { id: 'field_307', name: 'Нигерия-307', lat: 9.7481, lon: 7.4995, type: 'gas', bonus: 2.7, icon: '⛽', region: 'Нигерия', reserve: 708.8, area: 523.3, depth: 1619 },
  { id: 'field_308', name: 'Мексиканский залив-308', lat: 23.8757, lon: -95.3164, type: 'gas', bonus: 3.2, icon: '⛽', region: 'Мексиканский залив', reserve: 638.4, area: 695.1, depth: 278 },
  { id: 'field_309', name: 'Аляска-309', lat: 62.1464, lon: -157.2496, type: 'oil', bonus: 2.2, icon: '🛢️', region: 'Аляска', reserve: 517.1, area: 573.9, depth: 3836 },
  { id: 'field_310', name: 'Аляска-310', lat: 60.9094, lon: -167.1359, type: 'oil', bonus: 1.9, icon: '🛢️', region: 'Аляска', reserve: 311.1, area: 439.3, depth: 1577 },
  { id: 'field_311', name: 'Колумбия-311', lat: 5.6565, lon: -67.9569, type: 'oil', bonus: 2.5, icon: '🛢️', region: 'Колумбия', reserve: 157.6, area: 109.1, depth: 4649 },
  { id: 'field_312', name: 'Норвегия-312', lat: 61.8698, lon: 25.3879, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Норвегия', reserve: 469.3, area: 190.5, depth: 3682 },
  { id: 'field_313', name: 'Сахалин-313', lat: 52.9804, lon: 144.0054, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Сахалин', reserve: 80.6, area: 225.0, depth: 912 },
  { id: 'field_314', name: 'Техас-314', lat: 35.9335, lon: -95.9168, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Техас', reserve: 750.7, area: 557.5, depth: 3707 },
  { id: 'field_315', name: 'Каспий (РФ)-315', lat: 44.5569, lon: 50.0331, type: 'oil', bonus: 3.1, icon: '🛢️', region: 'Каспий (РФ)', reserve: 591.6, area: 435.2, depth: 4613 },
  { id: 'field_316', name: 'Каспий (РФ)-316', lat: 47.916, lon: 50.4632, type: 'gas', bonus: 3.4, icon: '⛽', region: 'Каспий (РФ)', reserve: 538.7, area: 722.1, depth: 980 },
  { id: 'field_317', name: 'Ямал-317', lat: 71.5006, lon: 70.3508, type: 'gas', bonus: 3.5, icon: '⛽', region: 'Ямал', reserve: 873.7, area: 119.0, depth: 1287 },
  { id: 'field_318', name: 'Саудовская Аравия-318', lat: 27.1139, lon: 52.0842, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Саудовская Аравия', reserve: 598.6, area: 229.6, depth: 3593 },
  { id: 'field_319', name: 'ОАЭ/Кувейт-319', lat: 22.6041, lon: 53.946, type: 'oil', bonus: 2.2, icon: '🛢️', region: 'ОАЭ/Кувейт', reserve: 762.3, area: 561.9, depth: 3223 },
  { id: 'field_320', name: 'Техас-320', lat: 30.3685, lon: -98.4346, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Техас', reserve: 485.5, area: 538.0, depth: 3134 },
  { id: 'field_321', name: 'Румыния-321', lat: 46.9784, lon: 25.1817, type: 'gas', bonus: 3.1, icon: '⛽', region: 'Румыния', reserve: 520.0, area: 271.8, depth: 2523 },
  { id: 'field_322', name: 'Иран-322', lat: 32.5131, lon: 54.7567, type: 'gas', bonus: 3.0, icon: '⛽', region: 'Иран', reserve: 899.4, area: 614.6, depth: 576 },
  { id: 'field_323', name: 'Восточная Сибирь-323', lat: 62.8389, lon: 105.6812, type: 'oil', bonus: 3.3, icon: '🛢️', region: 'Восточная Сибирь', reserve: 200.1, area: 376.1, depth: 3704 },
  { id: 'field_324', name: 'Саудовская Аравия-324', lat: 26.8859, lon: 40.2425, type: 'gas', bonus: 1.6, icon: '⛽', region: 'Саудовская Аравия', reserve: 936.1, area: 233.7, depth: 3152 },
  { id: 'field_325', name: 'Саудовская Аравия-325', lat: 23.7184, lon: 53.3646, type: 'oil', bonus: 1.4, icon: '🛢️', region: 'Саудовская Аравия', reserve: 644.3, area: 586.3, depth: 2118 },
  { id: 'field_326', name: 'Техас-326', lat: 26.0032, lon: -104.7626, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Техас', reserve: 176.1, area: 196.4, depth: 3845 },
  { id: 'field_327', name: 'Западная Сибирь-327', lat: 64.956, lon: 80.4277, type: 'gas', bonus: 2.8, icon: '⛽', region: 'Западная Сибирь', reserve: 503.8, area: 198.6, depth: 931 },
  { id: 'field_328', name: 'Венесуэла-328', lat: 5.717, lon: -68.9264, type: 'oil', bonus: 1.6, icon: '🛢️', region: 'Венесуэла', reserve: 784.8, area: 607.5, depth: 1290 },
  { id: 'field_329', name: 'Ливия-329', lat: 29.4485, lon: 10.0946, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Ливия', reserve: 205.9, area: 293.9, depth: 1945 },
  { id: 'field_330', name: 'Ливия-330', lat: 23.6651, lon: 15.5874, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Ливия', reserve: 132.4, area: 98.4, depth: 1208 },
  { id: 'field_331', name: 'Нигерия-331', lat: 7.8403, lon: 14.5222, type: 'gas', bonus: 3.0, icon: '⛽', region: 'Нигерия', reserve: 285.4, area: 522.8, depth: 2232 },
  { id: 'field_332', name: 'Мексиканский залив-332', lat: 25.2001, lon: -89.7089, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Мексиканский залив', reserve: 675.5, area: 255.3, depth: 4441 },
  { id: 'field_333', name: 'Нигерия-333', lat: 5.8865, lon: 7.0928, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Нигерия', reserve: 804.1, area: 206.7, depth: 3361 },
  { id: 'field_334', name: 'Сахалин-334', lat: 50.9975, lon: 143.3757, type: 'gas', bonus: 3.5, icon: '⛽', region: 'Сахалин', reserve: 937.2, area: 122.9, depth: 4856 },
  { id: 'field_335', name: 'Техас-335', lat: 31.0099, lon: -103.754, type: 'gas', bonus: 3.4, icon: '⛽', region: 'Техас', reserve: 781.8, area: 33.0, depth: 753 },
  { id: 'field_336', name: 'Западная Сибирь-336', lat: 60.1574, lon: 83.0645, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Западная Сибирь', reserve: 647.1, area: 410.8, depth: 3603 },
  { id: 'field_337', name: 'Техас-337', lat: 29.4251, lon: -97.673, type: 'oil', bonus: 1.9, icon: '🛢️', region: 'Техас', reserve: 344.4, area: 418.8, depth: 1864 },
  { id: 'field_338', name: 'Малайзия-338', lat: 2.0876, lon: 105.535, type: 'oil', bonus: 2.0, icon: '🛢️', region: 'Малайзия', reserve: 465.6, area: 763.7, depth: 2154 },
  { id: 'field_339', name: 'Западная Сибирь-339', lat: 58.8621, lon: 70.8621, type: 'gas', bonus: 2.6, icon: '⛽', region: 'Западная Сибирь', reserve: 102.3, area: 539.5, depth: 1638 },
  { id: 'field_340', name: 'Ямал-340', lat: 71.2474, lon: 74.1195, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Ямал', reserve: 379.4, area: 423.4, depth: 2323 },
  { id: 'field_341', name: 'Каспий (РФ)-341', lat: 44.5077, lon: 52.9056, type: 'gas', bonus: 2.9, icon: '⛽', region: 'Каспий (РФ)', reserve: 162.2, area: 721.9, depth: 2944 },
  { id: 'field_342', name: 'Северное море-342', lat: 56.1758, lon: -3.1058, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Северное море', reserve: 535.2, area: 63.2, depth: 4843 },
  { id: 'field_343', name: 'Каспий (РФ)-343', lat: 44.6292, lon: 52.8666, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Каспий (РФ)', reserve: 533.4, area: 54.3, depth: 300 },
  { id: 'field_344', name: 'Саудовская Аравия-344', lat: 24.7176, lon: 44.5107, type: 'oil', bonus: 1.7, icon: '🛢️', region: 'Саудовская Аравия', reserve: 962.3, area: 47.6, depth: 3635 },
  { id: 'field_345', name: 'Саудовская Аравия-345', lat: 22.4826, lon: 53.5695, type: 'gas', bonus: 1.9, icon: '⛽', region: 'Саудовская Аравия', reserve: 124.0, area: 310.8, depth: 4312 },
  { id: 'field_346', name: 'Ангола-346', lat: -17.2626, lon: 13.3478, type: 'oil', bonus: 3.4, icon: '🛢️', region: 'Ангола', reserve: 115.5, area: 382.8, depth: 2512 },
  { id: 'field_347', name: 'Колумбия-347', lat: 3.107, lon: -76.877, type: 'oil', bonus: 1.3, icon: '🛢️', region: 'Колумбия', reserve: 240.6, area: 459.8, depth: 2689 },
  { id: 'field_348', name: 'Венесуэла-348', lat: 6.6981, lon: -68.2124, type: 'oil', bonus: 3.5, icon: '🛢️', region: 'Венесуэла', reserve: 787.1, area: 591.3, depth: 4677 },
  { id: 'field_349', name: 'Бразилия (шельф)-349', lat: -23.5877, lon: -49.9043, type: 'gas', bonus: 1.4, icon: '⛽', region: 'Бразилия (шельф)', reserve: 564.5, area: 516.0, depth: 278 },
  { id: 'field_350', name: 'Индонезия-350', lat: -7.981, lon: 125.236, type: 'gas', bonus: 1.5, icon: '⛽', region: 'Индонезия', reserve: 553.3, area: 205.8, depth: 4230 },
  { id: 'field_351', name: 'Индонезия-351', lat: 4.6433, lon: 101.5492, type: 'gas', bonus: 1.5, icon: '⛽', region: 'Индонезия', reserve: 925.2, area: 719.9, depth: 4457 },
  { id: 'field_352', name: 'Катар-352', lat: 26.6867, lon: 50.9169, type: 'gas', bonus: 2.6, icon: '⛽', region: 'Катар', reserve: 530.2, area: 517.0, depth: 3430 },
  { id: 'field_353', name: 'Восточная Сибирь-353', lat: 60.6782, lon: 104.5742, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Восточная Сибирь', reserve: 297.9, area: 265.7, depth: 3419 },
  { id: 'field_354', name: 'Египет-354', lat: 28.6182, lon: 28.1348, type: 'gas', bonus: 1.8, icon: '⛽', region: 'Египет', reserve: 946.4, area: 126.2, depth: 4989 },
  { id: 'field_355', name: 'Сахалин-355', lat: 48.6339, lon: 142.7983, type: 'oil', bonus: 2.2, icon: '🛢️', region: 'Сахалин', reserve: 559.1, area: 772.4, depth: 1900 },
  { id: 'field_356', name: 'Техас-356', lat: 30.0968, lon: -94.9177, type: 'oil', bonus: 1.6, icon: '🛢️', region: 'Техас', reserve: 701.8, area: 664.6, depth: 530 },
  { id: 'field_357', name: 'Саудовская Аравия-357', lat: 28.5657, lon: 40.5215, type: 'oil', bonus: 3.4, icon: '🛢️', region: 'Саудовская Аравия', reserve: 426.4, area: 58.2, depth: 2648 },
  { id: 'field_358', name: 'Саудовская Аравия-358', lat: 29.9068, lon: 38.5284, type: 'gas', bonus: 3.2, icon: '⛽', region: 'Саудовская Аравия', reserve: 578.2, area: 449.1, depth: 975 },
  { id: 'field_359', name: 'Техас-359', lat: 33.8429, lon: -104.1827, type: 'oil', bonus: 1.4, icon: '🛢️', region: 'Техас', reserve: 791.9, area: 193.4, depth: 1823 },
  { id: 'field_360', name: 'Норвегия-360', lat: 61.9558, lon: 20.3877, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Норвегия', reserve: 295.9, area: 653.9, depth: 378 },
  { id: 'field_361', name: 'Австралия (сев.)-361', lat: -22.0337, lon: 126.8577, type: 'gas', bonus: 1.5, icon: '⛽', region: 'Австралия (сев.)', reserve: 854.9, area: 650.9, depth: 1203 },
  { id: 'field_362', name: 'Западная Сибирь-362', lat: 62.6099, lon: 64.1997, type: 'gas', bonus: 3.1, icon: '⛽', region: 'Западная Сибирь', reserve: 425.2, area: 43.0, depth: 3695 },
  { id: 'field_363', name: 'Поволжье-363', lat: 51.503, lon: 49.8715, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Поволжье', reserve: 191.2, area: 499.0, depth: 2213 },
  { id: 'field_364', name: 'Алжир-364', lat: 30.49, lon: 8.5933, type: 'oil', bonus: 1.4, icon: '🛢️', region: 'Алжир', reserve: 315.8, area: 127.0, depth: 1833 },
  { id: 'field_365', name: 'Алжир-365', lat: 33.1748, lon: 0.9898, type: 'gas', bonus: 3.5, icon: '⛽', region: 'Алжир', reserve: 792.8, area: 300.1, depth: 4660 },
  { id: 'field_366', name: 'Колумбия-366', lat: 3.4403, lon: -70.6465, type: 'oil', bonus: 2.2, icon: '🛢️', region: 'Колумбия', reserve: 220.8, area: 268.7, depth: 1994 },
  { id: 'field_367', name: 'Западная Сибирь-367', lat: 66.1069, lon: 67.0233, type: 'gas', bonus: 2.5, icon: '⛽', region: 'Западная Сибирь', reserve: 778.5, area: 799.7, depth: 1507 },
  { id: 'field_368', name: 'Восточная Сибирь-368', lat: 61.5686, lon: 96.9937, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Восточная Сибирь', reserve: 950.4, area: 469.0, depth: 3381 },
  { id: 'field_369', name: 'Иран-369', lat: 35.9099, lon: 60.0592, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Иран', reserve: 352.1, area: 595.7, depth: 3139 },
  { id: 'field_370', name: 'Туркменистан-370', lat: 35.2257, lon: 61.8079, type: 'gas', bonus: 2.5, icon: '⛽', region: 'Туркменистан', reserve: 228.8, area: 790.6, depth: 4232 },
  { id: 'field_371', name: 'Мексиканский залив-371', lat: 20.1067, lon: -96.5444, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Мексиканский залив', reserve: 257.9, area: 430.6, depth: 205 },
  { id: 'field_372', name: 'Иран-372', lat: 32.9838, lon: 59.3225, type: 'gas', bonus: 2.9, icon: '⛽', region: 'Иран', reserve: 922.8, area: 678.5, depth: 2850 },
  { id: 'field_373', name: 'Западная Сибирь-373', lat: 59.4771, lon: 77.6174, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Западная Сибирь', reserve: 854.2, area: 691.3, depth: 794 },
  { id: 'field_374', name: 'ОАЭ/Кувейт-374', lat: 29.5354, lon: 49.956, type: 'oil', bonus: 2.0, icon: '🛢️', region: 'ОАЭ/Кувейт', reserve: 356.5, area: 781.2, depth: 3778 },
  { id: 'field_375', name: 'Северное море-375', lat: 61.6853, lon: 5.0885, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Северное море', reserve: 583.9, area: 713.9, depth: 3123 },
  { id: 'field_376', name: 'Саудовская Аравия-376', lat: 25.8895, lon: 40.981, type: 'gas', bonus: 2.9, icon: '⛽', region: 'Саудовская Аравия', reserve: 329.8, area: 158.6, depth: 214 },
  { id: 'field_377', name: 'Индонезия-377', lat: 4.3331, lon: 113.0137, type: 'oil', bonus: 1.7, icon: '🛢️', region: 'Индонезия', reserve: 352.3, area: 650.9, depth: 2009 },
  { id: 'field_378', name: 'Ливия-378', lat: 23.1452, lon: 16.939, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Ливия', reserve: 276.1, area: 786.3, depth: 1575 },
  { id: 'field_379', name: 'Ливия-379', lat: 32.5939, lon: 22.1466, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Ливия', reserve: 302.0, area: 214.6, depth: 755 },
  { id: 'field_380', name: 'Иран-380', lat: 35.2313, lon: 57.6879, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Иран', reserve: 746.0, area: 775.9, depth: 3591 },
  { id: 'field_381', name: 'Аляска-381', lat: 64.1658, lon: -152.7113, type: 'oil', bonus: 3.1, icon: '🛢️', region: 'Аляска', reserve: 799.3, area: 470.9, depth: 2047 },
  { id: 'field_382', name: 'Каспий (РФ)-382', lat: 44.2948, lon: 53.2288, type: 'gas', bonus: 1.3, icon: '⛽', region: 'Каспий (РФ)', reserve: 298.1, area: 101.7, depth: 3000 },
  { id: 'field_383', name: 'Каспий (РФ)-383', lat: 45.5018, lon: 52.6599, type: 'oil', bonus: 2.0, icon: '🛢️', region: 'Каспий (РФ)', reserve: 986.0, area: 716.7, depth: 453 },
  { id: 'field_384', name: 'Техас-384', lat: 32.19, lon: -98.1049, type: 'gas', bonus: 1.6, icon: '⛽', region: 'Техас', reserve: 146.2, area: 180.3, depth: 1756 },
  { id: 'field_385', name: 'Катар-385', lat: 25.6623, lon: 51.8511, type: 'gas', bonus: 2.8, icon: '⛽', region: 'Катар', reserve: 332.5, area: 94.8, depth: 3418 },
  { id: 'field_386', name: 'Северная Дакота-386', lat: 48.3594, lon: -102.7713, type: 'oil', bonus: 1.3, icon: '🛢️', region: 'Северная Дакота', reserve: 133.2, area: 662.6, depth: 4134 },
  { id: 'field_387', name: 'Саудовская Аравия-387', lat: 20.2574, lon: 40.9041, type: 'gas', bonus: 3.4, icon: '⛽', region: 'Саудовская Аравия', reserve: 499.9, area: 110.1, depth: 3456 },
  { id: 'field_388', name: 'Техас-388', lat: 34.8437, lon: -102.5549, type: 'gas', bonus: 1.7, icon: '⛽', region: 'Техас', reserve: 891.2, area: 308.1, depth: 3851 },
  { id: 'field_389', name: 'Западная Сибирь-389', lat: 62.3974, lon: 66.585, type: 'gas', bonus: 2.5, icon: '⛽', region: 'Западная Сибирь', reserve: 193.6, area: 563.2, depth: 992 },
  { id: 'field_390', name: 'Восточная Сибирь-390', lat: 58.4379, lon: 109.3652, type: 'oil', bonus: 2.5, icon: '🛢️', region: 'Восточная Сибирь', reserve: 848.8, area: 658.4, depth: 3629 },
  { id: 'field_391', name: 'Индонезия-391', lat: 0.9319, lon: 138.0726, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Индонезия', reserve: 125.0, area: 724.2, depth: 484 },
  { id: 'field_392', name: 'Канада (Альберта)-392', lat: 58.905, lon: -103.991, type: 'oil', bonus: 1.6, icon: '🛢️', region: 'Канада (Альберта)', reserve: 769.3, area: 154.8, depth: 1569 },
  { id: 'field_393', name: 'Малайзия-393', lat: 6.6592, lon: 101.5237, type: 'gas', bonus: 1.5, icon: '⛽', region: 'Малайзия', reserve: 699.0, area: 177.5, depth: 1411 },
  { id: 'field_394', name: 'Норвегия-394', lat: 60.1262, lon: 27.6809, type: 'oil', bonus: 1.5, icon: '🛢️', region: 'Норвегия', reserve: 578.5, area: 450.6, depth: 2462 },
  { id: 'field_395', name: 'Канада (Альберта)-395', lat: 59.0888, lon: -119.7527, type: 'gas', bonus: 1.5, icon: '⛽', region: 'Канада (Альберта)', reserve: 192.2, area: 461.9, depth: 4973 },
  { id: 'field_396', name: 'Бразилия (шельф)-396', lat: -11.0863, lon: -36.1261, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Бразилия (шельф)', reserve: 874.1, area: 706.5, depth: 3566 },
  { id: 'field_397', name: 'Саудовская Аравия-397', lat: 26.5479, lon: 47.7244, type: 'gas', bonus: 1.4, icon: '⛽', region: 'Саудовская Аравия', reserve: 311.6, area: 132.2, depth: 3490 },
  { id: 'field_398', name: 'Западная Сибирь-398', lat: 66.8957, lon: 68.2874, type: 'oil', bonus: 1.4, icon: '🛢️', region: 'Западная Сибирь', reserve: 501.5, area: 229.5, depth: 3251 },
  { id: 'field_399', name: 'Западная Сибирь-399', lat: 66.1739, lon: 67.5764, type: 'gas', bonus: 3.2, icon: '⛽', region: 'Западная Сибирь', reserve: 865.3, area: 554.2, depth: 2067 },
  { id: 'field_400', name: 'Ямал-400', lat: 72.8453, lon: 70.7604, type: 'gas', bonus: 1.9, icon: '⛽', region: 'Ямал', reserve: 445.9, area: 523.5, depth: 1739 },
  { id: 'field_401', name: 'Техас-401', lat: 35.0478, lon: -100.7068, type: 'gas', bonus: 3.0, icon: '⛽', region: 'Техас', reserve: 873.8, area: 660.4, depth: 4421 },
  { id: 'field_402', name: 'Северное море-402', lat: 54.5249, lon: 5.934, type: 'gas', bonus: 1.6, icon: '⛽', region: 'Северное море', reserve: 858.7, area: 705.9, depth: 437 },
  { id: 'field_403', name: 'Поволжье-403', lat: 56.1263, lon: 50.0073, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Поволжье', reserve: 483.6, area: 736.1, depth: 1831 },
  { id: 'field_404', name: 'Ирак-404', lat: 35.5881, lon: 43.0513, type: 'oil', bonus: 2.8, icon: '🛢️', region: 'Ирак', reserve: 279.8, area: 401.3, depth: 3854 },
  { id: 'field_405', name: 'Поволжье-405', lat: 56.0934, lon: 53.8688, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Поволжье', reserve: 845.8, area: 221.8, depth: 940 },
  { id: 'field_406', name: 'Ирак-406', lat: 32.0925, lon: 39.6291, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Ирак', reserve: 665.0, area: 548.6, depth: 2404 },
  { id: 'field_407', name: 'Алжир-407', lat: 30.6195, lon: 8.3756, type: 'gas', bonus: 2.3, icon: '⛽', region: 'Алжир', reserve: 175.7, area: 155.1, depth: 269 },
  { id: 'field_408', name: 'Саудовская Аравия-408', lat: 26.0834, lon: 54.0311, type: 'gas', bonus: 2.2, icon: '⛽', region: 'Саудовская Аравия', reserve: 407.7, area: 292.0, depth: 2264 },
  { id: 'field_409', name: 'Саудовская Аравия-409', lat: 23.0215, lon: 46.8508, type: 'gas', bonus: 2.6, icon: '⛽', region: 'Саудовская Аравия', reserve: 57.0, area: 799.6, depth: 3265 },
  { id: 'field_410', name: 'Мексиканский залив-410', lat: 25.1253, lon: -93.6079, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Мексиканский залив', reserve: 369.5, area: 235.7, depth: 2863 },
  { id: 'field_411', name: 'Казахстан-411', lat: 43.1338, lon: 76.3105, type: 'gas', bonus: 1.7, icon: '⛽', region: 'Казахстан', reserve: 541.4, area: 207.4, depth: 665 },
  { id: 'field_412', name: 'Северное море-412', lat: 60.4189, lon: 4.4005, type: 'gas', bonus: 2.8, icon: '⛽', region: 'Северное море', reserve: 735.2, area: 531.2, depth: 2621 },
  { id: 'field_413', name: 'Саудовская Аравия-413', lat: 24.1857, lon: 44.6007, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Саудовская Аравия', reserve: 995.0, area: 656.5, depth: 3011 },
  { id: 'field_414', name: 'Венесуэла-414', lat: 6.5565, lon: -66.0497, type: 'oil', bonus: 3.3, icon: '🛢️', region: 'Венесуэла', reserve: 688.3, area: 415.7, depth: 1592 },
  { id: 'field_415', name: 'Норвегия-415', lat: 70.0239, lon: 8.7095, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Норвегия', reserve: 753.9, area: 585.6, depth: 4779 },
  { id: 'field_416', name: 'Бразилия (шельф)-416', lat: -24.7048, lon: -39.8043, type: 'gas', bonus: 2.7, icon: '⛽', region: 'Бразилия (шельф)', reserve: 261.1, area: 194.2, depth: 2715 },
  { id: 'field_417', name: 'Техас-417', lat: 34.7553, lon: -101.1681, type: 'gas', bonus: 2.3, icon: '⛽', region: 'Техас', reserve: 161.9, area: 61.9, depth: 4980 },
  { id: 'field_418', name: 'Нигерия-418', lat: 10.2065, lon: 8.1389, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Нигерия', reserve: 874.1, area: 317.7, depth: 2644 },
  { id: 'field_419', name: 'Катар-419', lat: 26.6125, lon: 50.3016, type: 'gas', bonus: 2.1, icon: '⛽', region: 'Катар', reserve: 987.8, area: 716.4, depth: 3948 },
  { id: 'field_420', name: 'Ямал-420', lat: 72.1744, lon: 67.3446, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Ямал', reserve: 649.5, area: 157.9, depth: 675 },
  { id: 'field_421', name: 'Западная Сибирь-421', lat: 60.7353, lon: 79.0298, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Западная Сибирь', reserve: 200.5, area: 632.5, depth: 921 },
  { id: 'field_422', name: 'Ямал-422', lat: 69.6023, lon: 70.5823, type: 'gas', bonus: 3.4, icon: '⛽', region: 'Ямал', reserve: 414.2, area: 49.4, depth: 1833 },
  { id: 'field_423', name: 'Венесуэла-423', lat: 11.6505, lon: -61.4039, type: 'oil', bonus: 1.3, icon: '🛢️', region: 'Венесуэла', reserve: 53.9, area: 592.2, depth: 2053 },
  { id: 'field_424', name: 'Египет-424', lat: 25.0991, lon: 25.6761, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Египет', reserve: 340.8, area: 70.9, depth: 574 },
  { id: 'field_425', name: 'Ирак-425', lat: 31.3266, lon: 45.2783, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Ирак', reserve: 702.4, area: 124.4, depth: 4215 },
  { id: 'field_426', name: 'ОАЭ/Кувейт-426', lat: 23.5074, lon: 55.4808, type: 'oil', bonus: 1.3, icon: '🛢️', region: 'ОАЭ/Кувейт', reserve: 263.1, area: 788.2, depth: 1930 },
  { id: 'field_427', name: 'Венесуэла-427', lat: 9.1278, lon: -70.8032, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Венесуэла', reserve: 802.5, area: 312.7, depth: 2295 },
  { id: 'field_428', name: 'Бразилия (шельф)-428', lat: -16.7836, lon: -41.0911, type: 'oil', bonus: 2.8, icon: '🛢️', region: 'Бразилия (шельф)', reserve: 670.9, area: 35.4, depth: 1148 },
  { id: 'field_429', name: 'Техас-429', lat: 29.1828, lon: -98.8853, type: 'gas', bonus: 2.8, icon: '⛽', region: 'Техас', reserve: 245.2, area: 554.9, depth: 276 },
  { id: 'field_430', name: 'Ливия-430', lat: 29.708, lon: 15.7012, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Ливия', reserve: 636.8, area: 240.5, depth: 1070 },
  { id: 'field_431', name: 'Канада (Альберта)-431', lat: 55.699, lon: -104.4408, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Канада (Альберта)', reserve: 439.3, area: 145.1, depth: 4690 },
  { id: 'field_432', name: 'Канада (Альберта)-432', lat: 51.2846, lon: -101.3375, type: 'gas', bonus: 1.8, icon: '⛽', region: 'Канада (Альберта)', reserve: 62.1, area: 89.4, depth: 1104 },
  { id: 'field_433', name: 'Норвегия-433', lat: 66.7044, lon: 7.8778, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Норвегия', reserve: 121.3, area: 584.4, depth: 2296 },
  { id: 'field_434', name: 'Алжир-434', lat: 30.1108, lon: 9.7275, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Алжир', reserve: 144.8, area: 156.3, depth: 523 },
  { id: 'field_435', name: 'Румыния-435', lat: 44.8011, lon: 27.4141, type: 'gas', bonus: 2.9, icon: '⛽', region: 'Румыния', reserve: 140.2, area: 611.4, depth: 575 },
  { id: 'field_436', name: 'Западная Сибирь-436', lat: 59.3839, lon: 76.18, type: 'gas', bonus: 2.1, icon: '⛽', region: 'Западная Сибирь', reserve: 465.8, area: 505.0, depth: 961 },
  { id: 'field_437', name: 'ОАЭ/Кувейт-437', lat: 24.7418, lon: 47.1383, type: 'oil', bonus: 3.4, icon: '🛢️', region: 'ОАЭ/Кувейт', reserve: 308.2, area: 320.9, depth: 4117 },
  { id: 'field_438', name: 'Северное море-438', lat: 59.1908, lon: 7.1567, type: 'oil', bonus: 1.6, icon: '🛢️', region: 'Северное море', reserve: 740.1, area: 785.6, depth: 1505 },
  { id: 'field_439', name: 'Сахалин-439', lat: 53.4674, lon: 142.9307, type: 'oil', bonus: 1.7, icon: '🛢️', region: 'Сахалин', reserve: 410.8, area: 299.7, depth: 436 },
  { id: 'field_440', name: 'Казахстан-440', lat: 50.5594, lon: 76.9093, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Казахстан', reserve: 513.7, area: 712.3, depth: 3810 },
  { id: 'field_441', name: 'Западная Сибирь-441', lat: 60.6161, lon: 67.8559, type: 'oil', bonus: 3.5, icon: '🛢️', region: 'Западная Сибирь', reserve: 686.4, area: 283.9, depth: 4485 },
  { id: 'field_442', name: 'Египет-442', lat: 27.5642, lon: 29.627, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Египет', reserve: 680.5, area: 520.3, depth: 1417 },
  { id: 'field_443', name: 'Норвегия-443', lat: 64.9335, lon: 29.6826, type: 'oil', bonus: 1.3, icon: '🛢️', region: 'Норвегия', reserve: 937.7, area: 414.3, depth: 4044 },
  { id: 'field_444', name: 'Румыния-444', lat: 47.3471, lon: 22.5989, type: 'gas', bonus: 2.0, icon: '⛽', region: 'Румыния', reserve: 364.4, area: 237.0, depth: 4352 },
  { id: 'field_445', name: 'Саудовская Аравия-445', lat: 26.4332, lon: 44.8557, type: 'oil', bonus: 1.5, icon: '🛢️', region: 'Саудовская Аравия', reserve: 472.0, area: 467.0, depth: 921 },
  { id: 'field_446', name: 'Казахстан-446', lat: 45.3648, lon: 54.3922, type: 'gas', bonus: 2.9, icon: '⛽', region: 'Казахстан', reserve: 66.9, area: 334.7, depth: 493 },
  { id: 'field_447', name: 'Мексиканский залив-447', lat: 18.002, lon: -95.9093, type: 'gas', bonus: 3.3, icon: '⛽', region: 'Мексиканский залив', reserve: 584.2, area: 530.6, depth: 3937 },
  { id: 'field_448', name: 'Индонезия-448', lat: -3.2765, lon: 97.4967, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Индонезия', reserve: 365.4, area: 618.6, depth: 4075 },
  { id: 'field_449', name: 'Венесуэла-449', lat: 7.5431, lon: -67.1171, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Венесуэла', reserve: 260.7, area: 286.3, depth: 2591 },
  { id: 'field_450', name: 'Мексиканский залив-450', lat: 22.4867, lon: -95.7241, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Мексиканский залив', reserve: 830.7, area: 599.2, depth: 3552 },
  { id: 'field_451', name: 'Сахалин-451', lat: 51.6651, lon: 141.7502, type: 'oil', bonus: 1.8, icon: '🛢️', region: 'Сахалин', reserve: 833.3, area: 168.7, depth: 2968 },
  { id: 'field_452', name: 'Сахалин-452', lat: 50.4868, lon: 144.7065, type: 'gas', bonus: 3.0, icon: '⛽', region: 'Сахалин', reserve: 478.0, area: 533.6, depth: 4330 },
  { id: 'field_453', name: 'Ямал-453', lat: 69.993, lon: 71.8947, type: 'gas', bonus: 2.5, icon: '⛽', region: 'Ямал', reserve: 461.2, area: 476.4, depth: 4364 },
  { id: 'field_454', name: 'Колумбия-454', lat: 9.1018, lon: -69.0064, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Колумбия', reserve: 172.0, area: 322.2, depth: 2836 },
  { id: 'field_455', name: 'Канада (Альберта)-455', lat: 53.2313, lon: -100.41, type: 'oil', bonus: 1.9, icon: '🛢️', region: 'Канада (Альберта)', reserve: 965.4, area: 777.0, depth: 3909 },
  { id: 'field_456', name: 'Северное море-456', lat: 55.1054, lon: 4.4353, type: 'gas', bonus: 3.2, icon: '⛽', region: 'Северное море', reserve: 570.4, area: 264.9, depth: 4734 },
  { id: 'field_457', name: 'Ливия-457', lat: 24.2098, lon: 18.9867, type: 'oil', bonus: 2.8, icon: '🛢️', region: 'Ливия', reserve: 925.1, area: 123.5, depth: 1656 },
  { id: 'field_458', name: 'Канада (Альберта)-458', lat: 56.6374, lon: -113.5524, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Канада (Альберта)', reserve: 584.2, area: 474.6, depth: 3619 },
  { id: 'field_459', name: 'Ангола-459', lat: -5.4859, lon: 18.0085, type: 'oil', bonus: 3.1, icon: '🛢️', region: 'Ангола', reserve: 546.6, area: 39.7, depth: 1390 },
  { id: 'field_460', name: 'Западная Сибирь-460', lat: 58.566, lon: 66.6745, type: 'oil', bonus: 3.5, icon: '🛢️', region: 'Западная Сибирь', reserve: 699.2, area: 134.2, depth: 708 },
  { id: 'field_461', name: 'Египет-461', lat: 24.6563, lon: 33.7967, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Египет', reserve: 480.0, area: 500.6, depth: 4802 },
  { id: 'field_462', name: 'Казахстан-462', lat: 48.909, lon: 70.767, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Казахстан', reserve: 807.0, area: 563.0, depth: 584 },
  { id: 'field_463', name: 'Китай (Синьцзян)-463', lat: 40.6507, lon: 98.831, type: 'gas', bonus: 3.4, icon: '⛽', region: 'Китай (Синьцзян)', reserve: 101.1, area: 600.1, depth: 1863 },
  { id: 'field_464', name: 'Ливия-464', lat: 30.5902, lon: 22.9219, type: 'oil', bonus: 3.3, icon: '🛢️', region: 'Ливия', reserve: 719.4, area: 525.2, depth: 4677 },
  { id: 'field_465', name: 'Венесуэла-465', lat: 6.3753, lon: -63.5761, type: 'oil', bonus: 1.9, icon: '🛢️', region: 'Венесуэла', reserve: 218.6, area: 552.5, depth: 1731 },
  { id: 'field_466', name: 'Индонезия-466', lat: 1.556, lon: 100.4903, type: 'oil', bonus: 2.2, icon: '🛢️', region: 'Индонезия', reserve: 578.8, area: 121.5, depth: 4984 },
  { id: 'field_467', name: 'Румыния-467', lat: 43.0282, lon: 25.7307, type: 'oil', bonus: 1.4, icon: '🛢️', region: 'Румыния', reserve: 932.2, area: 485.6, depth: 2667 },
  { id: 'field_468', name: 'Аляска-468', lat: 66.2994, lon: -157.9736, type: 'oil', bonus: 2.5, icon: '🛢️', region: 'Аляска', reserve: 959.1, area: 426.1, depth: 4338 },
  { id: 'field_469', name: 'Каспий (РФ)-469', lat: 46.1723, lon: 51.0171, type: 'gas', bonus: 1.8, icon: '⛽', region: 'Каспий (РФ)', reserve: 252.7, area: 278.9, depth: 3155 },
  { id: 'field_470', name: 'Ирак-470', lat: 36.6025, lon: 44.1828, type: 'oil', bonus: 3.5, icon: '🛢️', region: 'Ирак', reserve: 832.5, area: 785.3, depth: 272 },
  { id: 'field_471', name: 'Сахалин-471', lat: 50.076, lon: 141.9614, type: 'gas', bonus: 3.4, icon: '⛽', region: 'Сахалин', reserve: 698.4, area: 270.3, depth: 1128 },
  { id: 'field_472', name: 'ОАЭ/Кувейт-472', lat: 26.3219, lon: 48.8283, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'ОАЭ/Кувейт', reserve: 533.3, area: 399.7, depth: 2628 },
  { id: 'field_473', name: 'Азербайджан-473', lat: 38.77, lon: 47.5973, type: 'oil', bonus: 1.7, icon: '🛢️', region: 'Азербайджан', reserve: 958.5, area: 439.6, depth: 260 },
  { id: 'field_474', name: 'Ливия-474', lat: 24.3186, lon: 19.0722, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Ливия', reserve: 453.0, area: 101.1, depth: 4605 },
  { id: 'field_475', name: 'Норвегия-475', lat: 70.0582, lon: 23.2758, type: 'gas', bonus: 2.7, icon: '⛽', region: 'Норвегия', reserve: 942.8, area: 602.6, depth: 1459 },
  { id: 'field_476', name: 'Западная Сибирь-476', lat: 65.1687, lon: 60.9472, type: 'oil', bonus: 1.4, icon: '🛢️', region: 'Западная Сибирь', reserve: 804.5, area: 455.3, depth: 4910 },
  { id: 'field_477', name: 'Норвегия-477', lat: 70.5758, lon: 14.5985, type: 'gas', bonus: 2.7, icon: '⛽', region: 'Норвегия', reserve: 461.4, area: 33.2, depth: 1169 },
  { id: 'field_478', name: 'Мексиканский залив-478', lat: 25.6971, lon: -89.5798, type: 'oil', bonus: 2.8, icon: '🛢️', region: 'Мексиканский залив', reserve: 119.0, area: 743.9, depth: 1069 },
  { id: 'field_479', name: 'Ирак-479', lat: 34.487, lon: 44.0657, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Ирак', reserve: 465.8, area: 328.2, depth: 452 },
  { id: 'field_480', name: 'Аляска-480', lat: 65.8681, lon: -164.1813, type: 'oil', bonus: 3.1, icon: '🛢️', region: 'Аляска', reserve: 857.0, area: 250.1, depth: 1380 },
  { id: 'field_481', name: 'Ирак-481', lat: 36.0958, lon: 47.6537, type: 'oil', bonus: 3.4, icon: '🛢️', region: 'Ирак', reserve: 60.6, area: 702.3, depth: 1358 },
  { id: 'field_482', name: 'Ямал-482', lat: 67.0302, lon: 72.7565, type: 'gas', bonus: 2.0, icon: '⛽', region: 'Ямал', reserve: 760.9, area: 724.8, depth: 3016 },
  { id: 'field_483', name: 'Саудовская Аравия-483', lat: 29.0563, lon: 52.4748, type: 'oil', bonus: 1.7, icon: '🛢️', region: 'Саудовская Аравия', reserve: 259.7, area: 671.1, depth: 1791 },
  { id: 'field_484', name: 'Сахалин-484', lat: 52.0259, lon: 143.2692, type: 'gas', bonus: 3.2, icon: '⛽', region: 'Сахалин', reserve: 935.8, area: 795.6, depth: 3978 },
  { id: 'field_485', name: 'Алжир-485', lat: 26.6583, lon: 6.0602, type: 'oil', bonus: 1.5, icon: '🛢️', region: 'Алжир', reserve: 739.3, area: 400.0, depth: 2910 },
  { id: 'field_486', name: 'Иран-486', lat: 33.7268, lon: 48.4561, type: 'gas', bonus: 2.7, icon: '⛽', region: 'Иран', reserve: 905.1, area: 267.9, depth: 3891 },
  { id: 'field_487', name: 'Иран-487', lat: 33.5725, lon: 57.1757, type: 'oil', bonus: 2.5, icon: '🛢️', region: 'Иран', reserve: 396.3, area: 266.7, depth: 3708 },
  { id: 'field_488', name: 'Каспий (РФ)-488', lat: 45.2529, lon: 52.9283, type: 'gas', bonus: 1.9, icon: '⛽', region: 'Каспий (РФ)', reserve: 391.5, area: 550.1, depth: 2916 },
  { id: 'field_489', name: 'Казахстан-489', lat: 45.5542, lon: 63.2734, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Казахстан', reserve: 153.4, area: 523.5, depth: 871 },
  { id: 'field_490', name: 'Румыния-490', lat: 47.2936, lon: 23.12, type: 'oil', bonus: 1.9, icon: '🛢️', region: 'Румыния', reserve: 892.0, area: 79.6, depth: 817 },
  { id: 'field_491', name: 'Азербайджан-491', lat: 41.3983, lon: 48.4214, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Азербайджан', reserve: 252.1, area: 48.6, depth: 2334 },
  { id: 'field_492', name: 'Мексиканский залив-492', lat: 29.9847, lon: -91.3348, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Мексиканский залив', reserve: 262.1, area: 622.3, depth: 2583 },
  { id: 'field_493', name: 'Ямал-493', lat: 70.0067, lon: 66.1772, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Ямал', reserve: 679.5, area: 681.4, depth: 1558 },
  { id: 'field_494', name: 'Бразилия (шельф)-494', lat: -25.4733, lon: -47.6117, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Бразилия (шельф)', reserve: 509.3, area: 299.9, depth: 1992 },
  { id: 'field_495', name: 'Бразилия (шельф)-495', lat: -23.8285, lon: -46.0346, type: 'oil', bonus: 1.4, icon: '🛢️', region: 'Бразилия (шельф)', reserve: 246.4, area: 728.0, depth: 3159 },
  { id: 'field_496', name: 'ОАЭ/Кувейт-496', lat: 29.3432, lon: 54.8155, type: 'oil', bonus: 3.5, icon: '🛢️', region: 'ОАЭ/Кувейт', reserve: 357.9, area: 568.9, depth: 4471 },
  { id: 'field_497', name: 'Ливия-497', lat: 25.0084, lon: 20.8706, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Ливия', reserve: 409.6, area: 478.4, depth: 837 },
  { id: 'field_498', name: 'Канада (Альберта)-498', lat: 53.1396, lon: -101.8552, type: 'gas', bonus: 2.1, icon: '⛽', region: 'Канада (Альберта)', reserve: 874.3, area: 399.8, depth: 4149 },
  { id: 'field_499', name: 'Азербайджан-499', lat: 38.0264, lon: 50.1742, type: 'oil', bonus: 1.7, icon: '🛢️', region: 'Азербайджан', reserve: 123.2, area: 521.9, depth: 1932 },
  { id: 'field_500', name: 'Каспий (РФ)-500', lat: 44.6294, lon: 52.0101, type: 'oil', bonus: 2.8, icon: '🛢️', region: 'Каспий (РФ)', reserve: 443.9, area: 277.6, depth: 1128 },
  { id: 'field_501', name: 'Аляска-501', lat: 65.267, lon: -162.1003, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Аляска', reserve: 440.4, area: 210.1, depth: 1247 },
  { id: 'field_502', name: 'Северная Дакота-502', lat: 45.6445, lon: -98.9637, type: 'oil', bonus: 3.3, icon: '🛢️', region: 'Северная Дакота', reserve: 189.5, area: 149.7, depth: 1674 },
  { id: 'field_503', name: 'Канада (Альберта)-503', lat: 53.46, lon: -100.6151, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Канада (Альберта)', reserve: 741.6, area: 660.6, depth: 902 },
  { id: 'field_504', name: 'Саудовская Аравия-504', lat: 26.0653, lon: 46.014, type: 'gas', bonus: 1.7, icon: '⛽', region: 'Саудовская Аравия', reserve: 838.8, area: 488.7, depth: 4973 },
  { id: 'field_505', name: 'Норвегия-505', lat: 58.9101, lon: 21.1509, type: 'gas', bonus: 1.7, icon: '⛽', region: 'Норвегия', reserve: 701.3, area: 739.4, depth: 763 },
  { id: 'field_506', name: 'Саудовская Аравия-506', lat: 23.8546, lon: 39.8457, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Саудовская Аравия', reserve: 913.9, area: 553.8, depth: 1425 },
  { id: 'field_507', name: 'Нигерия-507', lat: 5.7742, lon: 13.7209, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Нигерия', reserve: 554.9, area: 606.9, depth: 963 },
  { id: 'field_508', name: 'Аляска-508', lat: 61.4336, lon: -151.1027, type: 'oil', bonus: 3.3, icon: '🛢️', region: 'Аляска', reserve: 786.1, area: 526.4, depth: 4476 },
  { id: 'field_509', name: 'Техас-509', lat: 34.6231, lon: -96.9306, type: 'gas', bonus: 1.8, icon: '⛽', region: 'Техас', reserve: 812.2, area: 635.9, depth: 3323 },
  { id: 'field_510', name: 'Иран-510', lat: 35.4601, lon: 61.2493, type: 'oil', bonus: 2.2, icon: '🛢️', region: 'Иран', reserve: 291.8, area: 617.4, depth: 886 },
  { id: 'field_511', name: 'Ирак-511', lat: 36.0141, lon: 42.0865, type: 'oil', bonus: 1.3, icon: '🛢️', region: 'Ирак', reserve: 756.5, area: 25.5, depth: 4480 },
  { id: 'field_512', name: 'Сахалин-512', lat: 48.0432, lon: 143.6182, type: 'oil', bonus: 2.2, icon: '🛢️', region: 'Сахалин', reserve: 151.3, area: 352.3, depth: 4995 },
  { id: 'field_513', name: 'Саудовская Аравия-513', lat: 28.5498, lon: 45.2005, type: 'gas', bonus: 2.6, icon: '⛽', region: 'Саудовская Аравия', reserve: 992.2, area: 330.0, depth: 1868 },
  { id: 'field_514', name: 'Катар-514', lat: 26.3514, lon: 50.9649, type: 'gas', bonus: 2.5, icon: '⛽', region: 'Катар', reserve: 509.6, area: 791.0, depth: 4932 },
  { id: 'field_515', name: 'Иран-515', lat: 34.1714, lon: 57.9799, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Иран', reserve: 474.3, area: 565.5, depth: 1525 },
  { id: 'field_516', name: 'Восточная Сибирь-516', lat: 60.0834, lon: 120.3737, type: 'oil', bonus: 1.7, icon: '🛢️', region: 'Восточная Сибирь', reserve: 966.3, area: 24.1, depth: 946 },
  { id: 'field_517', name: 'Норвегия-517', lat: 63.5467, lon: 19.6064, type: 'oil', bonus: 1.4, icon: '🛢️', region: 'Норвегия', reserve: 260.7, area: 82.4, depth: 509 },
  { id: 'field_518', name: 'Венесуэла-518', lat: 11.5148, lon: -67.7916, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Венесуэла', reserve: 617.6, area: 757.7, depth: 1635 },
  { id: 'field_519', name: 'Ливия-519', lat: 26.8287, lon: 12.2273, type: 'oil', bonus: 1.7, icon: '🛢️', region: 'Ливия', reserve: 794.8, area: 418.2, depth: 2097 },
  { id: 'field_520', name: 'Ливия-520', lat: 29.4143, lon: 14.7558, type: 'oil', bonus: 3.4, icon: '🛢️', region: 'Ливия', reserve: 132.5, area: 235.2, depth: 3472 },
  { id: 'field_521', name: 'Иран-521', lat: 30.1369, lon: 55.1355, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Иран', reserve: 115.2, area: 90.3, depth: 2530 },
  { id: 'field_522', name: 'Венесуэла-522', lat: 8.9138, lon: -65.4219, type: 'oil', bonus: 3.4, icon: '🛢️', region: 'Венесуэла', reserve: 312.7, area: 493.0, depth: 1793 },
  { id: 'field_523', name: 'Техас-523', lat: 29.4435, lon: -105.9395, type: 'oil', bonus: 2.2, icon: '🛢️', region: 'Техас', reserve: 151.1, area: 76.5, depth: 2610 },
  { id: 'field_524', name: 'Иран-524', lat: 26.5211, lon: 53.7524, type: 'gas', bonus: 3.2, icon: '⛽', region: 'Иран', reserve: 822.5, area: 468.4, depth: 3827 },
  { id: 'field_525', name: 'Малайзия-525', lat: 4.9422, lon: 114.3993, type: 'gas', bonus: 3.4, icon: '⛽', region: 'Малайзия', reserve: 485.9, area: 379.4, depth: 424 },
  { id: 'field_526', name: 'Аляска-526', lat: 62.836, lon: -157.2851, type: 'oil', bonus: 2.8, icon: '🛢️', region: 'Аляска', reserve: 268.4, area: 266.3, depth: 3092 },
  { id: 'field_527', name: 'Канада (Альберта)-527', lat: 49.107, lon: -103.3565, type: 'oil', bonus: 1.9, icon: '🛢️', region: 'Канада (Альберта)', reserve: 429.0, area: 604.1, depth: 3001 },
  { id: 'field_528', name: 'Восточная Сибирь-528', lat: 64.314, lon: 106.445, type: 'gas', bonus: 1.8, icon: '⛽', region: 'Восточная Сибирь', reserve: 595.0, area: 162.6, depth: 1757 },
  { id: 'field_529', name: 'Канада (Альберта)-529', lat: 51.1963, lon: -105.2914, type: 'gas', bonus: 1.8, icon: '⛽', region: 'Канада (Альберта)', reserve: 242.6, area: 214.8, depth: 3116 },
  { id: 'field_530', name: 'Каспий (РФ)-530', lat: 44.4268, lon: 53.6009, type: 'gas', bonus: 2.7, icon: '⛽', region: 'Каспий (РФ)', reserve: 776.0, area: 442.3, depth: 546 },
  { id: 'field_531', name: 'Румыния-531', lat: 44.856, lon: 24.5233, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Румыния', reserve: 985.2, area: 734.5, depth: 2495 },
  { id: 'field_532', name: 'Катар-532', lat: 26.2505, lon: 50.2565, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Катар', reserve: 563.7, area: 411.9, depth: 3425 },
  { id: 'field_533', name: 'Казахстан-533', lat: 49.3108, lon: 66.9163, type: 'oil', bonus: 2.8, icon: '🛢️', region: 'Казахстан', reserve: 487.1, area: 557.6, depth: 296 },
  { id: 'field_534', name: 'Ангола-534', lat: -12.688, lon: 11.5112, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Ангола', reserve: 296.7, area: 447.9, depth: 2142 },
  { id: 'field_535', name: 'Канада (Альберта)-535', lat: 51.3159, lon: -105.9857, type: 'gas', bonus: 2.1, icon: '⛽', region: 'Канада (Альберта)', reserve: 430.6, area: 371.6, depth: 4880 },
  { id: 'field_536', name: 'Ямал-536', lat: 70.4554, lon: 67.9714, type: 'gas', bonus: 2.9, icon: '⛽', region: 'Ямал', reserve: 813.9, area: 453.2, depth: 3320 },
  { id: 'field_537', name: 'Саудовская Аравия-537', lat: 28.0004, lon: 50.5552, type: 'gas', bonus: 3.1, icon: '⛽', region: 'Саудовская Аравия', reserve: 217.8, area: 409.7, depth: 4435 },
  { id: 'field_538', name: 'Канада (Альберта)-538', lat: 52.473, lon: -110.2676, type: 'gas', bonus: 2.5, icon: '⛽', region: 'Канада (Альберта)', reserve: 589.4, area: 330.8, depth: 1538 },
  { id: 'field_539', name: 'Западная Сибирь-539', lat: 66.1382, lon: 71.9135, type: 'oil', bonus: 2.3, icon: '🛢️', region: 'Западная Сибирь', reserve: 367.9, area: 301.6, depth: 4790 },
  { id: 'field_540', name: 'Мексиканский залив-540', lat: 27.7202, lon: -92.8703, type: 'gas', bonus: 1.6, icon: '⛽', region: 'Мексиканский залив', reserve: 874.0, area: 771.2, depth: 1829 },
  { id: 'field_541', name: 'Северная Дакота-541', lat: 47.5995, lon: -99.6925, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Северная Дакота', reserve: 689.5, area: 400.2, depth: 3861 },
  { id: 'field_542', name: 'Азербайджан-542', lat: 39.5243, lon: 46.0057, type: 'oil', bonus: 3.2, icon: '🛢️', region: 'Азербайджан', reserve: 658.6, area: 744.3, depth: 3655 },
  { id: 'field_543', name: 'Ливия-543', lat: 28.288, lon: 22.5824, type: 'oil', bonus: 1.5, icon: '🛢️', region: 'Ливия', reserve: 376.4, area: 264.5, depth: 2586 },
  { id: 'field_544', name: 'Венесуэла-544', lat: 9.2377, lon: -67.8591, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Венесуэла', reserve: 941.8, area: 603.4, depth: 4467 },
  { id: 'field_545', name: 'Индонезия-545', lat: -2.6181, lon: 103.4588, type: 'oil', bonus: 1.6, icon: '🛢️', region: 'Индонезия', reserve: 272.9, area: 216.3, depth: 855 },
  { id: 'field_546', name: 'Саудовская Аравия-546', lat: 23.9705, lon: 39.6244, type: 'gas', bonus: 2.5, icon: '⛽', region: 'Саудовская Аравия', reserve: 75.0, area: 329.7, depth: 881 },
  { id: 'field_547', name: 'Сахалин-547', lat: 51.7086, lon: 141.3372, type: 'oil', bonus: 2.0, icon: '🛢️', region: 'Сахалин', reserve: 285.0, area: 241.7, depth: 1235 },
  { id: 'field_548', name: 'Ямал-548', lat: 72.0311, lon: 65.3714, type: 'gas', bonus: 3.2, icon: '⛽', region: 'Ямал', reserve: 358.9, area: 391.4, depth: 4628 },
  { id: 'field_549', name: 'Китай (Синьцзян)-549', lat: 42.5825, lon: 76.6481, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Китай (Синьцзян)', reserve: 483.7, area: 604.2, depth: 4820 },
  { id: 'field_550', name: 'Техас-550', lat: 32.0377, lon: -99.0608, type: 'gas', bonus: 2.4, icon: '⛽', region: 'Техас', reserve: 265.8, area: 89.9, depth: 2722 },
  { id: 'field_551', name: 'ОАЭ/Кувейт-551', lat: 24.0785, lon: 49.0357, type: 'oil', bonus: 2.5, icon: '🛢️', region: 'ОАЭ/Кувейт', reserve: 770.4, area: 126.3, depth: 2549 },
  { id: 'field_552', name: 'Техас-552', lat: 25.0915, lon: -94.0129, type: 'gas', bonus: 2.0, icon: '⛽', region: 'Техас', reserve: 777.6, area: 642.4, depth: 2094 },
  { id: 'field_553', name: 'Северное море-553', lat: 58.3857, lon: -1.36, type: 'gas', bonus: 2.2, icon: '⛽', region: 'Северное море', reserve: 205.1, area: 595.0, depth: 3392 },
  { id: 'field_554', name: 'Норвегия-554', lat: 59.5295, lon: 6.0595, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Норвегия', reserve: 810.0, area: 498.3, depth: 2427 },
  { id: 'field_555', name: 'Ирак-555', lat: 34.9434, lon: 46.0881, type: 'oil', bonus: 1.7, icon: '🛢️', region: 'Ирак', reserve: 115.0, area: 126.6, depth: 1104 },
  { id: 'field_556', name: 'Ливия-556', lat: 28.795, lon: 13.3541, type: 'oil', bonus: 1.7, icon: '🛢️', region: 'Ливия', reserve: 68.4, area: 58.7, depth: 4582 },
  { id: 'field_557', name: 'Западная Сибирь-557', lat: 67.7233, lon: 67.0529, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Западная Сибирь', reserve: 740.8, area: 201.6, depth: 1434 },
  { id: 'field_558', name: 'Западная Сибирь-558', lat: 60.1719, lon: 70.5061, type: 'gas', bonus: 3.5, icon: '⛽', region: 'Западная Сибирь', reserve: 490.5, area: 637.3, depth: 2905 },
  { id: 'field_559', name: 'Восточная Сибирь-559', lat: 62.5057, lon: 91.574, type: 'gas', bonus: 3.0, icon: '⛽', region: 'Восточная Сибирь', reserve: 117.8, area: 386.7, depth: 1774 },
  { id: 'field_560', name: 'Азербайджан-560', lat: 39.0003, lon: 46.671, type: 'oil', bonus: 1.6, icon: '🛢️', region: 'Азербайджан', reserve: 779.7, area: 214.2, depth: 3828 },
  { id: 'field_561', name: 'Саудовская Аравия-561', lat: 29.9454, lon: 41.3861, type: 'oil', bonus: 2.4, icon: '🛢️', region: 'Саудовская Аравия', reserve: 983.0, area: 388.8, depth: 2756 },
  { id: 'field_562', name: 'Китай (Синьцзян)-562', lat: 37.9033, lon: 92.6624, type: 'oil', bonus: 1.9, icon: '🛢️', region: 'Китай (Синьцзян)', reserve: 656.6, area: 175.0, depth: 626 },
  { id: 'field_563', name: 'Казахстан-563', lat: 42.6135, lon: 54.1784, type: 'gas', bonus: 2.0, icon: '⛽', region: 'Казахстан', reserve: 209.0, area: 235.4, depth: 1180 },
  { id: 'field_564', name: 'Катар-564', lat: 24.7293, lon: 51.9377, type: 'gas', bonus: 2.8, icon: '⛽', region: 'Катар', reserve: 197.2, area: 621.2, depth: 2237 },
  { id: 'field_565', name: 'Каспий (РФ)-565', lat: 44.3656, lon: 52.0932, type: 'oil', bonus: 1.4, icon: '🛢️', region: 'Каспий (РФ)', reserve: 662.3, area: 567.0, depth: 1079 },
  { id: 'field_566', name: 'Ямал-566', lat: 68.396, lon: 77.7618, type: 'gas', bonus: 3.1, icon: '⛽', region: 'Ямал', reserve: 466.8, area: 170.5, depth: 3294 },
  { id: 'field_567', name: 'ОАЭ/Кувейт-567', lat: 23.0779, lon: 54.9866, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'ОАЭ/Кувейт', reserve: 581.1, area: 443.3, depth: 4214 },
  { id: 'field_568', name: 'Саудовская Аравия-568', lat: 21.8663, lon: 43.9103, type: 'gas', bonus: 1.9, icon: '⛽', region: 'Саудовская Аравия', reserve: 839.8, area: 733.3, depth: 4742 },
  { id: 'field_569', name: 'Каспий (РФ)-569', lat: 46.1245, lon: 51.2469, type: 'gas', bonus: 2.5, icon: '⛽', region: 'Каспий (РФ)', reserve: 481.4, area: 625.2, depth: 4344 },
  { id: 'field_570', name: 'ОАЭ/Кувейт-570', lat: 23.4843, lon: 46.1872, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'ОАЭ/Кувейт', reserve: 276.8, area: 582.4, depth: 4615 },
  { id: 'field_571', name: 'Норвегия-571', lat: 59.0379, lon: 21.7638, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Норвегия', reserve: 356.5, area: 519.9, depth: 1104 },
  { id: 'field_572', name: 'Восточная Сибирь-572', lat: 61.5889, lon: 86.97, type: 'oil', bonus: 1.7, icon: '🛢️', region: 'Восточная Сибирь', reserve: 79.7, area: 103.5, depth: 1769 },
  { id: 'field_573', name: 'Восточная Сибирь-573', lat: 60.7101, lon: 122.6335, type: 'gas', bonus: 2.5, icon: '⛽', region: 'Восточная Сибирь', reserve: 716.2, area: 219.6, depth: 3201 },
  { id: 'field_574', name: 'Саудовская Аравия-574', lat: 27.1785, lon: 38.2225, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Саудовская Аравия', reserve: 932.0, area: 669.0, depth: 4034 },
  { id: 'field_575', name: 'Северное море-575', lat: 54.4856, lon: 3.8123, type: 'gas', bonus: 3.1, icon: '⛽', region: 'Северное море', reserve: 804.5, area: 65.5, depth: 2377 },
  { id: 'field_576', name: 'Канада (Альберта)-576', lat: 57.0773, lon: -103.3109, type: 'oil', bonus: 3.4, icon: '🛢️', region: 'Канада (Альберта)', reserve: 962.6, area: 95.8, depth: 2092 },
  { id: 'field_577', name: 'Канада (Альберта)-577', lat: 51.0841, lon: -109.4762, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Канада (Альберта)', reserve: 950.1, area: 455.6, depth: 4772 },
  { id: 'field_578', name: 'Техас-578', lat: 26.1607, lon: -97.6979, type: 'gas', bonus: 2.8, icon: '⛽', region: 'Техас', reserve: 717.4, area: 353.1, depth: 1052 },
  { id: 'field_579', name: 'Каспий (РФ)-579', lat: 44.7216, lon: 51.0078, type: 'gas', bonus: 2.7, icon: '⛽', region: 'Каспий (РФ)', reserve: 557.2, area: 487.9, depth: 3086 },
  { id: 'field_580', name: 'Азербайджан-580', lat: 40.2003, lon: 50.978, type: 'oil', bonus: 2.2, icon: '🛢️', region: 'Азербайджан', reserve: 651.6, area: 664.4, depth: 2849 },
  { id: 'field_581', name: 'Нигерия-581', lat: 9.6314, lon: 4.7811, type: 'gas', bonus: 2.1, icon: '⛽', region: 'Нигерия', reserve: 479.8, area: 768.7, depth: 201 },
  { id: 'field_582', name: 'Венесуэла-582', lat: 11.8807, lon: -65.2551, type: 'oil', bonus: 3.5, icon: '🛢️', region: 'Венесуэла', reserve: 336.7, area: 254.3, depth: 2017 },
  { id: 'field_583', name: 'Саудовская Аравия-583', lat: 23.149, lon: 51.1159, type: 'gas', bonus: 3.3, icon: '⛽', region: 'Саудовская Аравия', reserve: 535.7, area: 465.1, depth: 4882 },
  { id: 'field_584', name: 'Каспий (РФ)-584', lat: 44.1509, lon: 50.7783, type: 'oil', bonus: 1.9, icon: '🛢️', region: 'Каспий (РФ)', reserve: 895.1, area: 214.9, depth: 2299 },
  { id: 'field_585', name: 'Северное море-585', lat: 54.7352, lon: 1.5972, type: 'oil', bonus: 2.9, icon: '🛢️', region: 'Северное море', reserve: 737.4, area: 638.5, depth: 1616 },
  { id: 'field_586', name: 'Аляска-586', lat: 69.8893, lon: -148.3203, type: 'oil', bonus: 2.6, icon: '🛢️', region: 'Аляска', reserve: 335.4, area: 590.0, depth: 4920 },
  { id: 'field_587', name: 'ОАЭ/Кувейт-587', lat: 28.241, lon: 55.2187, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'ОАЭ/Кувейт', reserve: 826.3, area: 344.9, depth: 1187 },
  { id: 'field_588', name: 'Казахстан-588', lat: 42.7206, lon: 74.1528, type: 'oil', bonus: 2.7, icon: '🛢️', region: 'Казахстан', reserve: 650.6, area: 62.2, depth: 4495 },
  { id: 'field_589', name: 'Западная Сибирь-589', lat: 63.3993, lon: 63.7395, type: 'oil', bonus: 1.6, icon: '🛢️', region: 'Западная Сибирь', reserve: 690.0, area: 797.9, depth: 3850 },
  { id: 'field_590', name: 'Бразилия (шельф)-590', lat: -17.6454, lon: -48.6488, type: 'gas', bonus: 1.9, icon: '⛽', region: 'Бразилия (шельф)', reserve: 424.6, area: 123.1, depth: 876 },
  { id: 'field_591', name: 'Аляска-591', lat: 68.1985, lon: -152.6517, type: 'oil', bonus: 1.5, icon: '🛢️', region: 'Аляска', reserve: 526.7, area: 623.6, depth: 1268 },
  { id: 'field_592', name: 'Бразилия (шельф)-592', lat: -19.3434, lon: -47.0284, type: 'gas', bonus: 2.7, icon: '⛽', region: 'Бразилия (шельф)', reserve: 236.3, area: 500.5, depth: 4494 },
  { id: 'field_593', name: 'Саудовская Аравия-593', lat: 20.7164, lon: 51.2051, type: 'gas', bonus: 2.8, icon: '⛽', region: 'Саудовская Аравия', reserve: 597.2, area: 107.8, depth: 3588 },
  { id: 'field_594', name: 'Техас-594', lat: 28.8314, lon: -101.8304, type: 'oil', bonus: 3.0, icon: '🛢️', region: 'Техас', reserve: 210.8, area: 292.8, depth: 3822 },
  { id: 'field_595', name: 'Ливия-595', lat: 26.8451, lon: 23.7874, type: 'oil', bonus: 1.7, icon: '🛢️', region: 'Ливия', reserve: 405.1, area: 611.0, depth: 902 },
  { id: 'field_596', name: 'Сахалин-596', lat: 48.3272, lon: 144.7958, type: 'gas', bonus: 3.2, icon: '⛽', region: 'Сахалин', reserve: 829.1, area: 30.7, depth: 1111 },
  { id: 'field_597', name: 'Ирак-597', lat: 32.7695, lon: 41.3188, type: 'oil', bonus: 1.7, icon: '🛢️', region: 'Ирак', reserve: 547.1, area: 221.8, depth: 4156 },
  { id: 'field_598', name: 'Ливия-598', lat: 32.9153, lon: 20.1211, type: 'oil', bonus: 2.1, icon: '🛢️', region: 'Ливия', reserve: 910.7, area: 430.9, depth: 2292 },
  { id: 'field_599', name: 'Каспий (РФ)-599', lat: 45.1361, lon: 52.9459, type: 'gas', bonus: 1.4, icon: '⛽', region: 'Каспий (РФ)', reserve: 672.0, area: 26.5, depth: 3383 }
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
