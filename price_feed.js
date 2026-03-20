// ============================================================
//  RURCoin Price Feed — реальные цены нефти и газа
//  Обновление каждые 5 минут
//  Источники: commodities API (без ключей)
// ============================================================

const PRICE_CACHE_KEY = 'rurcoin_prices';

const priceFeed = {
    oilPrice: 75.0,      // USD за баррель (Brent)
    gasPrice: 3.5,       // USD за MMBtu → пересчитаем в м³
    oilChange: 0,        // % изменение за день
    gasChange: 0,
    lastUpdated: null,
    isLoading: false,
    updateInterval: null,
    currency: 'USD',
    usdToRurc: 1.0       // 1 USD = 1 RURC (можно настроить)
};

// ============================================================
//  Инициализация
// ============================================================
function initPriceFeed() {
    loadCachedPrices();
    fetchRealPrices();
    // Обновляем каждые 5 минут
    priceFeed.updateInterval = setInterval(fetchRealPrices, 5 * 60 * 1000);
    console.log('[PriceFeed] Инициализирован. Нефть:', priceFeed.oilPrice, 'USD/барр.');
}

// ============================================================
//  Загрузка кэша
// ============================================================
function loadCachedPrices() {
    try {
        const cached = localStorage.getItem(PRICE_CACHE_KEY);
        if (cached) {
            const d = JSON.parse(cached);
            // Кэш актуален 10 минут
            if (Date.now() - d.ts < 10 * 60 * 1000) {
                priceFeed.oilPrice  = d.oilPrice;
                priceFeed.gasPrice  = d.gasPrice;
                priceFeed.oilChange = d.oilChange || 0;
                priceFeed.gasChange = d.gasChange || 0;
                priceFeed.lastUpdated = new Date(d.ts);
                renderPriceTicker();
                return true;
            }
        }
    } catch(e) {}
    return false;
}

function savePriceCache() {
    try {
        localStorage.setItem(PRICE_CACHE_KEY, JSON.stringify({
            oilPrice:  priceFeed.oilPrice,
            gasPrice:  priceFeed.gasPrice,
            oilChange: priceFeed.oilChange,
            gasChange: priceFeed.gasChange,
            ts: Date.now()
        }));
    } catch(e) {}
}

// ============================================================
//  Основной фетч — пробуем несколько источников
// ============================================================
async function fetchRealPrices() {
    if (priceFeed.isLoading) return;
    priceFeed.isLoading = true;

    const success = await trySource1() || await trySource2() || await trySource3();

    if (!success) {
        console.warn('[PriceFeed] Все источники недоступны, используем кэш/дефолт');
        simulatePriceMovement(); // Симулируем движение цены
    }

    priceFeed.isLoading = false;
    priceFeed.lastUpdated = new Date();
    savePriceCache();
    renderPriceTicker();
    notifyGameOfPriceUpdate();
}

// ============================================================
//  Источник 1: commodities-api через allorigins proxy
//  Нефть: Brent Crude (BRENTOIL), Газ: Natural Gas (NG)
// ============================================================
async function trySource1() {
    try {
        // Используем публичный прокси для обхода CORS
        const url = 'https://api.allorigins.win/get?url=' +
            encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/BZ%3DF?interval=1d&range=2d');

        const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!resp.ok) return false;

        const wrapper = await resp.json();
        const data = JSON.parse(wrapper.contents);

        const result = data?.chart?.result?.[0];
        if (!result) return false;

        const meta = result.meta;
        const currentPrice = meta.regularMarketPrice || meta.previousClose;
        const prevClose    = meta.previousClose || currentPrice;

        if (!currentPrice || currentPrice < 10) return false;

        const prevOil = priceFeed.oilPrice;
        priceFeed.oilPrice  = parseFloat(currentPrice.toFixed(2));
        priceFeed.oilChange = parseFloat(((currentPrice - prevClose) / prevClose * 100).toFixed(2));

        console.log('[PriceFeed] Нефть Brent (Yahoo):', priceFeed.oilPrice, 'USD/барр.', priceFeed.oilChange + '%');

        // Газ — отдельный запрос
        await fetchGasFromYahoo();
        return true;
    } catch(e) {
        console.warn('[PriceFeed] Source1 failed:', e.message);
        return false;
    }
}

async function fetchGasFromYahoo() {
    try {
        const url = 'https://api.allorigins.win/get?url=' +
            encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/NG%3DF?interval=1d&range=2d');

        const resp = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (!resp.ok) return;

        const wrapper = await resp.json();
        const data = JSON.parse(wrapper.contents);
        const meta = data?.chart?.result?.[0]?.meta;
        if (!meta) return;

        const gasMMBtu = meta.regularMarketPrice || meta.previousClose;
        const prevGas  = meta.previousClose || gasMMBtu;

        if (!gasMMBtu || gasMMBtu < 0.5) return;

        // 1 MMBtu ≈ 26.853 м³ природного газа
        // Цена за м³ = gasMMBtu / 26.853
        priceFeed.gasPrice  = parseFloat((gasMMBtu / 26.853).toFixed(4));
        priceFeed.gasChange = parseFloat(((gasMMBtu - prevGas) / prevGas * 100).toFixed(2));

        console.log('[PriceFeed] Газ (Yahoo):', priceFeed.gasPrice, 'USD/м³ (', gasMMBtu, 'USD/MMBtu)');
    } catch(e) {
        console.warn('[PriceFeed] Gas Yahoo failed:', e.message);
    }
}

// ============================================================
//  Источник 2: exchangerate-api (только нефть через commodity)
// ============================================================
async function trySource2() {
    try {
        // Используем corsproxy.io
        const url = 'https://corsproxy.io/?' +
            encodeURIComponent('https://query2.finance.yahoo.com/v8/finance/chart/CL%3DF?interval=1d&range=1d');

        const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!resp.ok) return false;

        const data = await resp.json();
        const meta = data?.chart?.result?.[0]?.meta;
        if (!meta) return false;

        const price = meta.regularMarketPrice || meta.previousClose;
        if (!price || price < 10) return false;

        const prev = meta.previousClose || price;
        priceFeed.oilPrice  = parseFloat(price.toFixed(2));
        priceFeed.oilChange = parseFloat(((price - prev) / prev * 100).toFixed(2));

        console.log('[PriceFeed] Нефть WTI (Source2):', priceFeed.oilPrice, 'USD/барр.');
        return true;
    } catch(e) {
        console.warn('[PriceFeed] Source2 failed:', e.message);
        return false;
    }
}

// ============================================================
//  Источник 3: Frankfurter + симуляция на основе реальных данных
// ============================================================
async function trySource3() {
    try {
        // Используем публичный API металлов/сырья
        const url = 'https://api.allorigins.win/get?url=' +
            encodeURIComponent('https://www.alphavantage.co/query?function=BRENT&interval=daily&apikey=demo');

        const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!resp.ok) return false;

        const wrapper = await resp.json();
        const data = JSON.parse(wrapper.contents);

        const series = data?.data;
        if (!series || series.length < 2) return false;

        const latest = parseFloat(series[0].value);
        const prev   = parseFloat(series[1].value);

        if (!latest || latest < 10) return false;

        priceFeed.oilPrice  = parseFloat(latest.toFixed(2));
        priceFeed.oilChange = parseFloat(((latest - prev) / prev * 100).toFixed(2));

        console.log('[PriceFeed] Нефть Brent (AlphaVantage):', priceFeed.oilPrice, 'USD/барр.');

        // Газ через AlphaVantage
        await fetchGasAlphaVantage();
        return true;
    } catch(e) {
        console.warn('[PriceFeed] Source3 failed:', e.message);
        return false;
    }
}

async function fetchGasAlphaVantage() {
    try {
        const url = 'https://api.allorigins.win/get?url=' +
            encodeURIComponent('https://www.alphavantage.co/query?function=NATURAL_GAS&interval=daily&apikey=demo');

        const resp = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (!resp.ok) return;

        const wrapper = await resp.json();
        const data = JSON.parse(wrapper.contents);
        const series = data?.data;
        if (!series || series.length < 2) return;

        const latest = parseFloat(series[0].value);
        const prev   = parseFloat(series[1].value);
        if (!latest) return;

        priceFeed.gasPrice  = parseFloat((latest / 26.853).toFixed(4));
        priceFeed.gasChange = parseFloat(((latest - prev) / prev * 100).toFixed(2));

        console.log('[PriceFeed] Газ (AlphaVantage):', priceFeed.gasPrice, 'USD/м³');
    } catch(e) {}
}

// ============================================================
//  Симуляция движения цены (если все API недоступны)
// ============================================================
function simulatePriceMovement() {
    // Случайное движение ±0.5% от текущей цены
    const oilDelta = priceFeed.oilPrice * (Math.random() * 0.01 - 0.005);
    const gasDelta = priceFeed.gasPrice * (Math.random() * 0.01 - 0.005);

    priceFeed.oilChange = parseFloat((oilDelta / priceFeed.oilPrice * 100).toFixed(2));
    priceFeed.gasChange = parseFloat((gasDelta / priceFeed.gasPrice * 100).toFixed(2));

    priceFeed.oilPrice = parseFloat(Math.max(30, priceFeed.oilPrice + oilDelta).toFixed(2));
    priceFeed.gasPrice = parseFloat(Math.max(0.05, priceFeed.gasPrice + gasDelta).toFixed(4));
}

// ============================================================
//  Уведомляем игру об обновлении цен
// ============================================================
function notifyGameOfPriceUpdate() {
    // Если есть экземпляр игры — обновляем UI
    if (window.game && window.game.render) {
        window.game.render();
    }
    // Событие для других модулей
    window.dispatchEvent(new CustomEvent('priceUpdate', {
        detail: {
            oilPrice: priceFeed.oilPrice,
            gasPrice: priceFeed.gasPrice,
            oilChange: priceFeed.oilChange,
            gasChange: priceFeed.gasChange
        }
    }));
}

// ============================================================
//  Получить цену нефти в RURC за баррель
// ============================================================
function getOilPriceRURC() {
    return priceFeed.oilPrice * priceFeed.usdToRurc;
}

// ============================================================
//  Получить цену газа в RURC за м³
// ============================================================
function getGasPriceRURC() {
    return priceFeed.gasPrice * priceFeed.usdToRurc;
}

// ============================================================
//  Рендер тикера цен
// ============================================================
function renderPriceTicker() {
    const oilEl  = document.getElementById('liveOilPrice');
    const gasEl  = document.getElementById('liveGasPrice');
    const oilChg = document.getElementById('liveOilChange');
    const gasChg = document.getElementById('liveGasChange');
    const updEl  = document.getElementById('priceLastUpdated');

    if (oilEl) oilEl.textContent = '$' + priceFeed.oilPrice.toFixed(2);
    if (gasEl) gasEl.textContent = '$' + priceFeed.gasPrice.toFixed(4);

    const fmtChange = (val, el) => {
        if (!el) return;
        const sign = val >= 0 ? '+' : '';
        el.textContent = sign + val.toFixed(2) + '%';
        el.style.color = val >= 0 ? '#4ade80' : '#f44336';
    };
    fmtChange(priceFeed.oilChange, oilChg);
    fmtChange(priceFeed.gasChange, gasChg);

    if (updEl && priceFeed.lastUpdated) {
        const t = priceFeed.lastUpdated;
        updEl.textContent = 'Обновлено: ' + t.toLocaleTimeString('ru-RU', {hour:'2-digit',minute:'2-digit'});
    }
}

// ============================================================
//  Экспорт
// ============================================================
window.priceFeed         = priceFeed;
window.initPriceFeed     = initPriceFeed;
window.getOilPriceRURC   = getOilPriceRURC;
window.getGasPriceRURC   = getGasPriceRURC;
window.renderPriceTicker = renderPriceTicker;
window.fetchRealPrices   = fetchRealPrices;
