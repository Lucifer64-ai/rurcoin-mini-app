// ============================================================
//  RURCoin Liquidity Pool — пул ликвидности RURC
//
//  Источники пополнения:
//  1. Покупка улучшений → mintToLiquidityPool(costTON, name)
//     TON потрачен → эквивалент RURC минтится НАПРЯМУЮ в пул
//  2. Пополнение баланса → onDepositSuccess(rurcAmount)
//     % от пополнения идёт в пул
//  3. Продажа нефти/газа → onSellResource(earned, type)
//     % от выручки идёт в пул
// ============================================================

const LIQUIDITY_KEY     = 'rurcoin_liquidity';
const LIQUIDITY_LOG_KEY = 'rurcoin_liq_log';

// ============================================================
//  Конфиг
// ============================================================
const LIQUIDITY_CONFIG = {
    // Курс TON → RURC для расчёта минта при покупке улучшений
    tonToRurc: 500,

    // % с пополнений (покупка RURC за фиат)
    depositFeePercent: 3.0,
    // % с продажи нефти/газа
    sellFeePercent: 1.0,

    // Дивиденды: APY пула
    poolAPY: 0.12,          // 12% годовых
    dividendIntervalSec: 3600,

    symbol: 'RURC'
};

// ============================================================
//  Состояние пула
// ============================================================
const liquidityPool = {
    totalLiquidity:     0,
    totalContributed:   0,
    totalDividendsPaid: 0,
    lastDividend:       Date.now(),
    history:            [],
    dividendInterval:   null
};

// ============================================================
//  Инициализация
// ============================================================
function initLiquidityPool() {
    loadLiquidityData();
    startDividendTimer();
    renderLiquidityPanel();
    console.log('[Liquidity] Пул запущен. Размер:', liquidityPool.totalLiquidity.toFixed(2), 'RURC');
}

// ============================================================
//  Загрузка / сохранение
// ============================================================
function loadLiquidityData() {
    try {
        const saved = localStorage.getItem(LIQUIDITY_KEY);
        if (saved) Object.assign(liquidityPool, JSON.parse(saved));
        const log = localStorage.getItem(LIQUIDITY_LOG_KEY);
        if (log) liquidityPool.history = JSON.parse(log);
    } catch(e) {}
}

function saveLiquidityData() {
    const d = {
        totalLiquidity:     liquidityPool.totalLiquidity,
        totalContributed:   liquidityPool.totalContributed,
        totalDividendsPaid: liquidityPool.totalDividendsPaid,
        lastDividend:       liquidityPool.lastDividend
    };
    localStorage.setItem(LIQUIDITY_KEY, JSON.stringify(d));
    localStorage.setItem(LIQUIDITY_LOG_KEY, JSON.stringify(liquidityPool.history.slice(-20)));
}

// ============================================================
//  Базовая функция добавления в пул
// ============================================================
function addToPool(rurcAmount, source, label) {
    if (!rurcAmount || rurcAmount <= 0) return;
    liquidityPool.totalLiquidity   += rurcAmount;
    liquidityPool.totalContributed += rurcAmount;
    liquidityPool.history.unshift({
        ts:     Date.now(),
        amount: parseFloat(rurcAmount.toFixed(4)),
        source,
        label: label || source
    });
    if (liquidityPool.history.length > 20) liquidityPool.history.pop();
    saveLiquidityData();
    renderLiquidityPanel();
}

// ============================================================
//  🔑 КЛЮЧЕВАЯ ФУНКЦИЯ
//  Покупка улучшения → прямой минт RURC в пул ликвидности
//  costTON — сколько TON потрачено
//  upgradeName — название улучшения (для лога)
// ============================================================
function mintToLiquidityPool(costTON, upgradeName) {
    const rurcMinted = costTON * LIQUIDITY_CONFIG.tonToRurc;

    // Минтим RURC напрямую в пул (не игроку)
    addToPool(rurcMinted, 'upgrade', `⚙️ ${upgradeName}`);

    // Уведомление
    showLiquidityNotif(
        `💎 ${rurcMinted.toFixed(0)} RURC заминчено в пул ликвидности (${upgradeName})`,
        '#a78bfa'
    );

    console.log(`[Liquidity] Минт: ${costTON} TON → ${rurcMinted} RURC → пул (${upgradeName})`);
    return rurcMinted;
}

// ============================================================
//  % с пополнения баланса → пул
// ============================================================
function onDepositSuccess(rurcAmount) {
    const fee = rurcAmount * (LIQUIDITY_CONFIG.depositFeePercent / 100);
    addToPool(fee, 'deposit', '💳 Пополнение');
    showLiquidityNotif(
        `💧 ${fee.toFixed(2)} RURC (${LIQUIDITY_CONFIG.depositFeePercent}%) → пул ликвидности`,
        '#60a5fa'
    );
    return fee;
}

// ============================================================
//  % с продажи нефти/газа → пул
// ============================================================
function onSellResource(earnedRURC, resourceType) {
    const fee = earnedRURC * (LIQUIDITY_CONFIG.sellFeePercent / 100);
    const label = resourceType === 'oil' ? '🛢️ Продажа нефти' : '⛽ Продажа газа';
    addToPool(fee, 'sell', label);
    return fee;
}

// ============================================================
//  Дивиденды из пула → игроку
// ============================================================
function startDividendTimer() {
    checkAndPayDividends();
    liquidityPool.dividendInterval = setInterval(checkAndPayDividends, 60 * 1000);
}

function checkAndPayDividends() {
    const now     = Date.now();
    const elapsed = (now - liquidityPool.lastDividend) / 1000;
    if (elapsed < LIQUIDITY_CONFIG.dividendIntervalSec) return;
    if (liquidityPool.totalLiquidity <= 0) return;

    const hoursElapsed = elapsed / 3600;
    const hourlyRate   = LIQUIDITY_CONFIG.poolAPY / (365 * 24);
    const dividend     = liquidityPool.totalLiquidity * hourlyRate * hoursElapsed;
    if (dividend < 0.01) return;

    if (window.game) {
        window.game.balance += dividend;
        window.game.saveData();
        window.game.render();
    }

    liquidityPool.totalDividendsPaid += dividend;
    liquidityPool.lastDividend = now;
    saveLiquidityData();

    showLiquidityNotif(`🎁 Дивиденды из пула: +${dividend.toFixed(4)} RURC`, '#4ade80');
    console.log(`[Liquidity] Дивиденды: +${dividend.toFixed(4)} RURC`);
}

// ============================================================
//  Рендер панели
// ============================================================
function renderLiquidityPanel() {
    const d   = liquidityPool;
    const cfg = LIQUIDITY_CONFIG;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

    set('liqPoolSize',      formatLiq(d.totalLiquidity)     + ' RURC');
    set('liqContributed',   formatLiq(d.totalContributed)   + ' RURC');
    set('liqDividendsPaid', formatLiq(d.totalDividendsPaid) + ' RURC');
    set('liqAPY',           (cfg.poolAPY * 100).toFixed(0)  + '%');
    set('liqDepositFee',    cfg.depositFeePercent            + '%');
    set('liqSellFee',       cfg.sellFeePercent               + '%');
    set('liqTonRate',       '1 TON = ' + cfg.tonToRurc       + ' RURC');

    const nextDiv = document.getElementById('liqNextDividend');
    if (nextDiv) {
        const secLeft = Math.max(0, cfg.dividendIntervalSec - (Date.now() - d.lastDividend) / 1000);
        const h = Math.floor(secLeft / 3600);
        const m = Math.floor((secLeft % 3600) / 60);
        nextDiv.textContent = h > 0 ? `через ${h}ч ${m}м` : `через ${m}м`;
    }

    const logEl = document.getElementById('liqLog');
    if (logEl && d.history.length > 0) {
        logEl.innerHTML = d.history.slice(0, 6).map(e => {
            const t = new Date(e.ts).toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'});
            return `<div style="display:flex;justify-content:space-between;padding:4px 0;
                                border-bottom:1px solid #1a1a2a;font-size:11px;">
                        <span style="color:#888;">${t} ${e.label}</span>
                        <span style="color:#4ade80;">+${e.amount.toFixed(2)} RURC</span>
                    </div>`;
        }).join('');
    }
}

// ============================================================
//  Уведомление
// ============================================================
function showLiquidityNotif(msg, color = '#4ade80') {
    const el = document.createElement('div');
    el.style.cssText = `
        position:fixed;bottom:130px;left:50%;transform:translateX(-50%);
        background:#0a0a1a;border:1px solid ${color};border-radius:10px;
        padding:8px 14px;font-size:11px;color:#fff;z-index:1000;
        max-width:300px;text-align:center;
        box-shadow:0 2px 12px rgba(0,0,0,0.5);
    `;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4500);
}

function formatLiq(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(3) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
    return n.toFixed(2);
}

// Экспорт
window.liquidityPool        = liquidityPool;
window.LIQUIDITY_CONFIG     = LIQUIDITY_CONFIG;
window.initLiquidityPool    = initLiquidityPool;
window.mintToLiquidityPool  = mintToLiquidityPool;
window.onDepositSuccess     = onDepositSuccess;
window.onSellResource       = onSellResource;
window.renderLiquidityPanel = renderLiquidityPanel;
