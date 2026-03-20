// ============================================================
//  RURCoin Global Stats — общая нефть и газ всех игроков
//  Хранение: localStorage (ключ rurcoin_global)
//  Синхронизация: BroadcastChannel + storage events
// ============================================================

const GLOBAL_STATS_KEY = 'rurcoin_global';
const GLOBAL_PLAYERS_KEY = 'rurcoin_players';

// Начальные значения глобального резервуара
const GLOBAL_DEFAULTS = {
    totalOil: 50000,       // баррелей (стартовый мировой запас)
    totalGas: 500000,      // м³
    totalPlayers: 0,
    totalMined: 0,
    lastUpdated: Date.now(),
    version: 1
};

// ============================================================
//  Состояние
// ============================================================
const globalStats = {
    data: { ...GLOBAL_DEFAULTS },
    channel: null,
    updateInterval: null,
    listeners: []
};

// ============================================================
//  Инициализация
// ============================================================
function initGlobalStats() {
    loadGlobalData();
    setupBroadcastChannel();
    setupStorageListener();
    startGlobalTicker();
    renderGlobalStats();
    console.log('[GlobalStats] Инициализирован. Игроков:', globalStats.data.totalPlayers);
}

// ============================================================
//  Загрузка / сохранение
// ============================================================
function loadGlobalData() {
    try {
        const saved = localStorage.getItem(GLOBAL_STATS_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            globalStats.data = Object.assign({ ...GLOBAL_DEFAULTS }, parsed);
        } else {
            globalStats.data = { ...GLOBAL_DEFAULTS };
            saveGlobalData();
        }
    } catch(e) {
        globalStats.data = { ...GLOBAL_DEFAULTS };
    }
}

function saveGlobalData() {
    globalStats.data.lastUpdated = Date.now();
    localStorage.setItem(GLOBAL_STATS_KEY, JSON.stringify(globalStats.data));
}

// ============================================================
//  Регистрация нового игрока
//  Вызывается при подключении кошелька
// ============================================================
function registerPlayer(address, network) {
    if (!address) return;

    const playersRaw = localStorage.getItem(GLOBAL_PLAYERS_KEY);
    const players = playersRaw ? JSON.parse(playersRaw) : {};

    const isNew = !players[address];

    if (isNew) {
        // Новый игрок — увеличиваем глобальные запасы
        players[address] = {
            address,
            network,
            joinedAt: Date.now(),
            lastSeen: Date.now()
        };
        localStorage.setItem(GLOBAL_PLAYERS_KEY, JSON.stringify(players));

        // Бонус к мировым запасам за нового игрока
        const oilBonus = 1000 + Math.floor(Math.random() * 2000);  // 1000–3000 барр.
        const gasBonus = 10000 + Math.floor(Math.random() * 20000); // 10k–30k м³

        globalStats.data.totalOil    += oilBonus;
        globalStats.data.totalGas    += gasBonus;
        globalStats.data.totalPlayers = Object.keys(players).length;
        saveGlobalData();

        // Уведомляем все вкладки
        broadcastGlobalUpdate({
            type: 'NEW_PLAYER',
            address: address.slice(0, 8) + '...',
            network,
            oilBonus,
            gasBonus,
            totalPlayers: globalStats.data.totalPlayers
        });

        showGlobalNotification(
            `🌍 Новый игрок подключился! +${oilBonus.toLocaleString()} барр. нефти и +${gasBonus.toLocaleString()} м³ газа добавлено в мировой резервуар!`,
            'success'
        );

        console.log(`[GlobalStats] Новый игрок: ${address.slice(0,8)}... | Нефть +${oilBonus} | Газ +${gasBonus}`);
    } else {
        // Существующий игрок — обновляем lastSeen
        players[address].lastSeen = Date.now();
        localStorage.setItem(GLOBAL_PLAYERS_KEY, JSON.stringify(players));
        globalStats.data.totalPlayers = Object.keys(players).length;
        saveGlobalData();
    }

    renderGlobalStats();
    return isNew;
}

// ============================================================
//  Добавить добытое в глобальный резервуар
// ============================================================
function addToGlobalReserve(oilAmount, gasAmount) {
    globalStats.data.totalOil  += oilAmount;
    globalStats.data.totalGas  += gasAmount;
    globalStats.data.totalMined += (oilAmount * 5 + gasAmount * 0.3);
    saveGlobalData();
}

// ============================================================
//  Вычесть из глобального резервуара при продаже
// ============================================================
function subtractFromGlobalReserve(oilAmount, gasAmount) {
    globalStats.data.totalOil = Math.max(0, globalStats.data.totalOil - oilAmount);
    globalStats.data.totalGas = Math.max(0, globalStats.data.totalGas - gasAmount);
    saveGlobalData();
    broadcastGlobalUpdate({ type: 'SELL', oilAmount, gasAmount });
}

// ============================================================
//  BroadcastChannel — синхронизация между вкладками
// ============================================================
function setupBroadcastChannel() {
    if (!window.BroadcastChannel) return;
    try {
        globalStats.channel = new BroadcastChannel('rurcoin_global_channel');
        globalStats.channel.onmessage = (event) => {
            const msg = event.data;
            if (!msg) return;

            if (msg.type === 'GLOBAL_UPDATE') {
                // Обновляем данные из другой вкладки
                Object.assign(globalStats.data, msg.data);
                renderGlobalStats();
            } else if (msg.type === 'NEW_PLAYER') {
                showGlobalNotification(
                    `🌍 Новый игрок (${msg.network})! +${msg.oilBonus?.toLocaleString()} барр. нефти добавлено в резервуар`,
                    'info'
                );
                renderGlobalStats();
            }
        };
    } catch(e) {
        console.warn('[GlobalStats] BroadcastChannel недоступен:', e);
    }
}

function broadcastGlobalUpdate(extra = {}) {
    if (!globalStats.channel) return;
    try {
        globalStats.channel.postMessage({
            type: 'GLOBAL_UPDATE',
            data: globalStats.data,
            ...extra
        });
    } catch(e) {}
}

// ============================================================
//  Storage event — синхронизация между разными доменами/окнами
// ============================================================
function setupStorageListener() {
    window.addEventListener('storage', (e) => {
        if (e.key === GLOBAL_STATS_KEY && e.newValue) {
            try {
                const newData = JSON.parse(e.newValue);
                Object.assign(globalStats.data, newData);
                renderGlobalStats();
            } catch(err) {}
        }
    });
}

// ============================================================
//  Тикер — глобальная добыча всех игроков (симуляция)
// ============================================================
function startGlobalTicker() {
    globalStats.updateInterval = setInterval(() => {
        const players = getPlayersCount();
        if (players > 0) {
            // Симулируем добычу всех игроков (кроме текущего)
            const otherPlayers = Math.max(0, players - 1);
            const simOil = otherPlayers * 0.0006; // ~2 барр/ч на игрока
            const simGas = otherPlayers * 0.014;  // ~50 м³/ч на игрока
            if (simOil > 0 || simGas > 0) {
                globalStats.data.totalOil += simOil;
                globalStats.data.totalGas += simGas;
            }
        }
        renderGlobalStats();
        // Сохраняем каждые 30 сек
        if (Date.now() % 30000 < 1000) saveGlobalData();
    }, 1000);
}

// ============================================================
//  Получить количество игроков
// ============================================================
function getPlayersCount() {
    try {
        const raw = localStorage.getItem(GLOBAL_PLAYERS_KEY);
        if (!raw) return 0;
        return Object.keys(JSON.parse(raw)).length;
    } catch(e) { return 0; }
}

function getPlayersList() {
    try {
        const raw = localStorage.getItem(GLOBAL_PLAYERS_KEY);
        return raw ? Object.values(JSON.parse(raw)) : [];
    } catch(e) { return []; }
}

// ============================================================
//  Рендер глобальной статистики
// ============================================================
function renderGlobalStats() {
    const d = globalStats.data;

    const setEl = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setEl('globalTotalOil',     formatBig(d.totalOil) + ' барр.');
    setEl('globalTotalGas',     formatBig(d.totalGas) + ' м³');
    setEl('globalTotalPlayers', d.totalPlayers.toLocaleString() + ' игроков');
    setEl('globalTotalMined',   formatBig(d.totalMined) + ' RURC');

    // Анимация счётчиков
    animateCounter('globalTotalOil',     d.totalOil);
    animateCounter('globalTotalGas',     d.totalGas);
}

// ============================================================
//  Уведомление
// ============================================================
function showGlobalNotification(msg, type = 'info') {
    const existing = document.getElementById('globalNotif');
    if (existing) existing.remove();

    const colors = { success: '#4ade80', info: '#FF8C00', error: '#f44336' };
    const notif = document.createElement('div');
    notif.id = 'globalNotif';
    notif.style.cssText = `
        position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
        background:#111122;border:1px solid ${colors[type]};border-radius:12px;
        padding:12px 16px;font-size:12px;color:#fff;z-index:999;
        max-width:320px;text-align:center;line-height:1.5;
        box-shadow:0 4px 20px rgba(0,0,0,0.5);
        animation:slideUp 0.3s ease;
    `;
    notif.textContent = msg;
    document.body.appendChild(notif);
    setTimeout(() => { if (notif.parentNode) notif.remove(); }, 5000);
}

// ============================================================
//  Helpers
// ============================================================
function formatBig(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return Math.floor(n).toLocaleString();
}

const _counterTargets = {};
function animateCounter(id, target) {
    _counterTargets[id] = target;
}

// ============================================================
//  Экспорт
// ============================================================
window.globalStats       = globalStats;
window.initGlobalStats   = initGlobalStats;
window.registerPlayer    = registerPlayer;
window.addToGlobalReserve     = addToGlobalReserve;
window.subtractFromGlobalReserve = subtractFromGlobalReserve;
window.getPlayersCount   = getPlayersCount;
window.getPlayersList    = getPlayersList;
window.renderGlobalStats = renderGlobalStats;
window.formatBig         = formatBig;
