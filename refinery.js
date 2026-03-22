// ═══════════════════════════════════════════════════════════
// RURCOIN — Завод + Склады + Улучшения
// Склады покупаются за RURC (сжигаются)
// Заводы улучшаются за TON
// ═══════════════════════════════════════════════════════════

// ─── КОНФИГ ПРОДУКТОВ ────────────────────────────────────
const REFINERY_PRODUCTS = {
    gasoline: {
        id: 'gasoline', name: 'Бензин', emoji: '⛽',
        description: 'Популярный топливный продукт. Высокий спрос.',
        priceTON: 0.5,
        oilRequired: 10, gasRequired: 0,
        baseTimeHours: 4,   // базовое время (уменьшается при улучшении)
        outputAmount: 8, priceRURC: 15, totalRURC: 120,
        demand: 'high', demandLabel: '🔴 Высокий', color: '#FF6B00'
    },
    diesel: {
        id: 'diesel', name: 'Дизель', emoji: '🛢',
        description: 'Стабильный спрос. Промышленное топливо.',
        priceTON: 0.8,
        oilRequired: 10, gasRequired: 0,
        baseTimeHours: 6,
        outputAmount: 10, priceRURC: 10, totalRURC: 100,
        demand: 'medium', demandLabel: '🟡 Средний', color: '#8B6914'
    },
    plastic: {
        id: 'plastic', name: 'Пластик', emoji: '🟡',
        description: 'Быстрая переработка, большой выход.',
        priceTON: 0.3,
        oilRequired: 5, gasRequired: 0,
        baseTimeHours: 2,
        outputAmount: 20, priceRURC: 3, totalRURC: 60,
        demand: 'low', demandLabel: '🟢 Низкий', color: '#FFD700'
    },
    kerosene: {
        id: 'kerosene', name: 'Авиакеросин', emoji: '✈️',
        description: 'Премиум продукт. Самая высокая цена.',
        priceTON: 2.0,
        oilRequired: 20, gasRequired: 0,
        baseTimeHours: 12,
        outputAmount: 15, priceRURC: 25, totalRURC: 375,
        demand: 'rare', demandLabel: '💎 Редкий', color: '#00D4FF', premium: true
    },
    chemicals: {
        id: 'chemicals', name: 'Химикаты', emoji: '⚗️',
        description: 'Требует нефть + газ. Высокая прибыль.',
        priceTON: 1.5,
        oilRequired: 15, gasRequired: 5,
        baseTimeHours: 8,
        outputAmount: 12, priceRURC: 20, totalRURC: 240,
        demand: 'medium', demandLabel: '🟡 Средний', color: '#00FF88', requiresGas: true
    }
};

// ─── КОНФИГ УЛУЧШЕНИЙ ЗАВОДА ─────────────────────────────
// Каждый уровень снижает время переработки на 15%
const FACTORY_UPGRADE_LEVELS = [
    { level: 1, label: 'Базовый',      timeMultiplier: 1.00, priceTON: 0    },
    { level: 2, label: 'Улучшенный',   timeMultiplier: 0.85, priceTON: 0.5  },
    { level: 3, label: 'Продвинутый',  timeMultiplier: 0.70, priceTON: 1.5  },
    { level: 4, label: 'Промышленный', timeMultiplier: 0.55, priceTON: 4.0  },
    { level: 5, label: 'Мегазавод',    timeMultiplier: 0.40, priceTON: 10.0 }
];

// ─── КОНФИГ СКЛАДОВ ──────────────────────────────────────
const WAREHOUSE_CONFIG = {
    oil: {
        id: 'oil', name: 'Нефтехранилище', emoji: '🛢',
        description: 'Хранит сырую нефть. Без склада добыча останавливается.',
        levels: [
            { level: 1, capacity: 50,   priceRURC: 0,     label: 'Базовый (50 барр.)' },
            { level: 2, capacity: 150,  priceRURC: 500,   label: 'Расширенный (150 барр.)' },
            { level: 3, capacity: 400,  priceRURC: 2000,  label: 'Промышленный (400 барр.)' },
            { level: 4, capacity: 1000, priceRURC: 6000,  label: 'Мегарезервуар (1000 барр.)' },
            { level: 5, capacity: 3000, priceRURC: 15000, label: 'Суперхранилище (3000 барр.)' }
        ],
        color: '#8B6914', storageKey: 'rurc_oil'
    },
    gas: {
        id: 'gas', name: 'Газгольдер', emoji: '💨',
        description: 'Хранит природный газ. Нужен для химикатов.',
        levels: [
            { level: 1, capacity: 30,   priceRURC: 0,     label: 'Базовый (30 ед.)' },
            { level: 2, capacity: 100,  priceRURC: 400,   label: 'Расширенный (100 ед.)' },
            { level: 3, capacity: 300,  priceRURC: 1500,  label: 'Промышленный (300 ед.)' },
            { level: 4, capacity: 800,  priceRURC: 5000,  label: 'Мегагазгольдер (800 ед.)' },
            { level: 5, capacity: 2000, priceRURC: 12000, label: 'Суперхранилище (2000 ед.)' }
        ],
        color: '#00D4FF', storageKey: 'rurc_gas'
    },
    products: {
        id: 'products', name: 'Склад продуктов', emoji: '📦',
        description: 'Хранит готовые продукты переработки.',
        levels: [
            { level: 1, capacity: 100,  priceRURC: 0,     label: 'Базовый (100 ед.)' },
            { level: 2, capacity: 300,  priceRURC: 600,   label: 'Расширенный (300 ед.)' },
            { level: 3, capacity: 800,  priceRURC: 2500,  label: 'Промышленный (800 ед.)' },
            { level: 4, capacity: 2000, priceRURC: 7000,  label: 'Мегасклад (2000 ед.)' },
            { level: 5, capacity: 5000, priceRURC: 18000, label: 'Суперсклад (5000 ед.)' }
        ],
        color: '#FF6B00', storageKey: null
    }
};

// ─── СОСТОЯНИЕ ───────────────────────────────────────────
let refineryState = {
    owned: {},          // { productId: true }
    upgrades: {},       // { productId: level (1-5) }
    warehouseLevels: { oil: 1, gas: 1, products: 1 },
    queue: [],
    completed: [],
    totalProduced: {},
    totalEarned: 0,
    totalBurned: 0      // сожжённые RURC
};

function loadRefineryState() {
    const saved = localStorage.getItem('rurc_refinery');
    if (saved) {
        try { refineryState = { ...refineryState, ...JSON.parse(saved) }; } catch(e) {}
    }
    // Дефолты
    if (!refineryState.warehouseLevels) refineryState.warehouseLevels = { oil: 1, gas: 1, products: 1 };
    if (!refineryState.upgrades) refineryState.upgrades = {};
}

function saveRefineryState() {
    localStorage.setItem('rurc_refinery', JSON.stringify(refineryState));
}

// ─── ХЕЛПЕРЫ ─────────────────────────────────────────────
function getWarehouseCapacity(type) {
    const lvl = refineryState.warehouseLevels[type] || 1;
    return WAREHOUSE_CONFIG[type].levels[lvl - 1].capacity;
}

function getFactoryLevel(productId) {
    return refineryState.upgrades[productId] || 1;
}

function getFactoryTimeHours(productId) {
    const base = REFINERY_PRODUCTS[productId].baseTimeHours;
    const lvl = getFactoryLevel(productId);
    const mult = FACTORY_UPGRADE_LEVELS[lvl - 1].timeMultiplier;
    return +(base * mult).toFixed(2);
}

function getProductsInStorage() {
    return refineryState.completed.reduce((sum, t) => sum + t.outputAmount, 0);
}

// ─── ПОКУПКА ЗАВОДА ──────────────────────────────────────
function buyRefinery(productId) {
    const product = REFINERY_PRODUCTS[productId];
    if (refineryState.owned[productId]) { showToast('✅ Завод уже куплен'); return; }
    const tg = window.Telegram?.WebApp;
    if (!tg) { showToast('❌ Открой в Telegram'); return; }

    tg.showConfirm(
        `🏭 Купить завод "${product.name}"?\n\nЦена: ${product.priceTON} TON\nВремя цикла: ${product.baseTimeHours}ч (базовое)`,
        (ok) => { if (ok) doBuyRefinery(productId, product, tg); }
    );
}

function doBuyRefinery(productId, product, tg) {
    const ton = parseFloat(localStorage.getItem('rurc_ton_balance') || '0');
    if (ton < product.priceTON) {
        tg.showAlert(`❌ Нужно ${product.priceTON} TON\nУ тебя: ${ton.toFixed(2)} TON`);
        return;
    }
    localStorage.setItem('rurc_ton_balance', (ton - product.priceTON).toFixed(4));
    refineryState.owned[productId] = true;
    refineryState.upgrades[productId] = 1;
    saveRefineryState();
    showToast(`🎉 Завод "${product.name}" куплен!`);
    updateTONDisplay();
    rerenderRefinery();
}

// ─── УЛУЧШЕНИЕ ЗАВОДА ────────────────────────────────────
function upgradeFactory(productId) {
    const product = REFINERY_PRODUCTS[productId];
    const currentLvl = getFactoryLevel(productId);
    if (currentLvl >= 5) { showToast('🏆 Максимальный уровень!'); return; }

    const nextLvl = FACTORY_UPGRADE_LEVELS[currentLvl]; // индекс = currentLvl (следующий)
    const tg = window.Telegram?.WebApp;
    if (!tg) { showToast('❌ Открой в Telegram'); return; }

    const newTime = +(REFINERY_PRODUCTS[productId].baseTimeHours * nextLvl.timeMultiplier).toFixed(2);
    tg.showConfirm(
        `⬆️ Улучшить завод "${product.name}"?\n\nУровень: ${currentLvl} → ${nextLvl.level}\nЦена: ${nextLvl.priceTON} TON\nВремя цикла: ${getFactoryTimeHours(productId)}ч → ${newTime}ч\n(-${Math.round((1 - nextLvl.timeMultiplier) * 100)}% времени)`,
        (ok) => { if (ok) doUpgradeFactory(productId, nextLvl, tg); }
    );
}

function doUpgradeFactory(productId, nextLvl, tg) {
    const ton = parseFloat(localStorage.getItem('rurc_ton_balance') || '0');
    if (ton < nextLvl.priceTON) {
        tg.showAlert(`❌ Нужно ${nextLvl.priceTON} TON\nУ тебя: ${ton.toFixed(2)} TON`);
        return;
    }
    localStorage.setItem('rurc_ton_balance', (ton - nextLvl.priceTON).toFixed(4));
    refineryState.upgrades[productId] = nextLvl.level;
    saveRefineryState();
    showToast(`⬆️ Завод улучшен до уровня ${nextLvl.level}!`);
    updateTONDisplay();
    rerenderRefinery();
}

// ─── УЛУЧШЕНИЕ СКЛАДА ────────────────────────────────────
function upgradeWarehouse(type) {
    const wh = WAREHOUSE_CONFIG[type];
    const currentLvl = refineryState.warehouseLevels[type] || 1;
    if (currentLvl >= 5) { showToast('🏆 Максимальный уровень!'); return; }

    const nextLvlData = wh.levels[currentLvl]; // следующий уровень
    const tg = window.Telegram?.WebApp;
    if (!tg) { showToast('❌ Открой в Telegram'); return; }

    tg.showConfirm(
        `📦 Улучшить "${wh.name}"?\n\nУровень: ${currentLvl} → ${currentLvl + 1}\nВместимость: ${wh.levels[currentLvl-1].capacity} → ${nextLvlData.capacity}\nЦена: ${nextLvlData.priceRURC} RURC\n\n🔥 RURC будут сожжены навсегда`,
        (ok) => { if (ok) doUpgradeWarehouse(type, nextLvlData, tg); }
    );
}

function doUpgradeWarehouse(type, nextLvlData, tg) {
    const rurc = parseFloat(localStorage.getItem('rurc_balance') || '0');
    if (rurc < nextLvlData.priceRURC) {
        tg.showAlert(`❌ Нужно ${nextLvlData.priceRURC} RURC\nУ тебя: ${rurc.toFixed(2)} RURC`);
        return;
    }
    // Сжигаем RURC
    const newBalance = rurc - nextLvlData.priceRURC;
    localStorage.setItem('rurc_balance', newBalance.toFixed(2));
    refineryState.totalBurned += nextLvlData.priceRURC;
    refineryState.warehouseLevels[type] = nextLvlData.level;
    saveRefineryState();
    showToast(`🔥 ${nextLvlData.priceRURC} RURC сожжено! Склад улучшен до ур. ${nextLvlData.level}`);
    updateBalanceDisplay();
    rerenderRefinery();
}

// ─── ЗАПУСК ПЕРЕРАБОТКИ ──────────────────────────────────
function startRefining(productId) {
    const product = REFINERY_PRODUCTS[productId];
    if (!refineryState.owned[productId]) return { success: false, error: 'Сначала купи завод' };

    const playerOil = parseFloat(localStorage.getItem('rurc_oil') || '0');
    const playerGas = parseFloat(localStorage.getItem('rurc_gas') || '0');

    if (playerOil < product.oilRequired)
        return { success: false, error: `Нужно ${product.oilRequired} барр. нефти (есть: ${playerOil.toFixed(1)})` };
    if (product.requiresGas && playerGas < product.gasRequired)
        return { success: false, error: `Нужно ${product.gasRequired} ед. газа (есть: ${playerGas.toFixed(1)})` };

    // Проверяем вместимость склада продуктов
    const storedProducts = getProductsInStorage();
    const productsCap = getWarehouseCapacity('products');
    if (storedProducts + product.outputAmount > productsCap)
        return { success: false, error: `Склад продуктов переполнен! (${storedProducts}/${productsCap})` };

    localStorage.setItem('rurc_oil', (playerOil - product.oilRequired).toFixed(2));
    if (product.requiresGas)
        localStorage.setItem('rurc_gas', (playerGas - product.gasRequired).toFixed(2));

    const timeHours = getFactoryTimeHours(productId);
    const task = {
        id: Date.now(), productId,
        startTime: Date.now(),
        finishTime: Date.now() + timeHours * 3600 * 1000,
        outputAmount: product.outputAmount,
        oilUsed: product.oilRequired,
        gasUsed: product.gasRequired || 0
    };
    refineryState.queue.push(task);
    saveRefineryState();
    return { success: true, task };
}

// ─── ПРОДАЖА ─────────────────────────────────────────────
function sellProduct(taskId) {
    const idx = refineryState.completed.findIndex(t => t.id === taskId);
    if (idx === -1) return { success: false, error: 'Не найдено' };
    const task = refineryState.completed[idx];
    const product = REFINERY_PRODUCTS[task.productId];
    const earned = task.outputAmount * product.priceRURC;
    const cur = parseFloat(localStorage.getItem('rurc_balance') || '0');
    localStorage.setItem('rurc_balance', (cur + earned).toFixed(2));
    refineryState.totalEarned += earned;
    refineryState.completed.splice(idx, 1);
    saveRefineryState();
    return { success: true, earned, product };
}

// ─── ПРОВЕРКА ОЧЕРЕДИ ────────────────────────────────────
function checkRefineryQueue() {
    const now = Date.now();
    let changed = false;
    refineryState.queue = refineryState.queue.filter(task => {
        if (now >= task.finishTime) {
            refineryState.completed.push(task);
            if (!refineryState.totalProduced[task.productId]) refineryState.totalProduced[task.productId] = 0;
            refineryState.totalProduced[task.productId] += task.outputAmount;
            changed = true;
            return false;
        }
        return true;
    });
    if (changed) saveRefineryState();
}

// ─── РЕНДЕР ГЛАВНОЙ ВКЛАДКИ ──────────────────────────────
function renderRefineryTab() {
    checkRefineryQueue();
    const playerOil = parseFloat(localStorage.getItem('rurc_oil') || '0');
    const playerGas = parseFloat(localStorage.getItem('rurc_gas') || '0');
    const tonBalance = parseFloat(localStorage.getItem('rurc_ton_balance') || '0');
    const rurcBalance = parseFloat(localStorage.getItem('rurc_balance') || '0');
    const oilCap = getWarehouseCapacity('oil');
    const gasCap = getWarehouseCapacity('gas');
    const prodCap = getWarehouseCapacity('products');
    const storedProds = getProductsInStorage();

    // Подвкладки
    const activeSubTab = window._refinerySubTab || 'factories';

    let html = `
    <div class="refinery-container">

        <!-- Ресурсы -->
        <div class="refinery-resources">
            <div class="res-item">
                <span class="res-icon">💎</span>
                <span class="res-label">TON</span>
                <span class="res-value ton-val">${tonBalance.toFixed(2)}</span>
            </div>
            <div class="res-item">
                <span class="res-icon">🛢</span>
                <span class="res-label">Нефть</span>
                <span class="res-value ${playerOil >= oilCap * 0.9 ? 'res-full' : ''}">${playerOil.toFixed(0)}/${oilCap}</span>
            </div>
            <div class="res-item">
                <span class="res-icon">💨</span>
                <span class="res-label">Газ</span>
                <span class="res-value ${playerGas >= gasCap * 0.9 ? 'res-full' : ''}">${playerGas.toFixed(0)}/${gasCap}</span>
            </div>
            <div class="res-item">
                <span class="res-icon">📦</span>
                <span class="res-label">Продукты</span>
                <span class="res-value ${storedProds >= prodCap * 0.9 ? 'res-full' : ''}">${storedProds}/${prodCap}</span>
            </div>
        </div>

        <!-- Подвкладки -->
        <div class="ref-subtabs">
            <button class="ref-subtab ${activeSubTab === 'factories' ? 'active' : ''}" onclick="switchRefSubTab('factories')">🏭 Заводы</button>
            <button class="ref-subtab ${activeSubTab === 'warehouses' ? 'active' : ''}" onclick="switchRefSubTab('warehouses')">🏗 Склады</button>
            <button class="ref-subtab ${activeSubTab === 'queue' ? 'active' : ''}" onclick="switchRefSubTab('queue')">⏳ Очередь ${refineryState.queue.length > 0 ? '<span class="badge">'+refineryState.queue.length+'</span>' : ''}</button>
            <button class="ref-subtab ${activeSubTab === 'ready' ? 'active' : ''}" onclick="switchRefSubTab('ready')">✅ Готово ${refineryState.completed.length > 0 ? '<span class="badge green">'+refineryState.completed.length+'</span>' : ''}</button>
        </div>

        <div id="ref-subtab-content">
    `;

    if (activeSubTab === 'factories') html += renderFactoriesTab(tonBalance, playerOil, playerGas, prodCap, storedProds);
    else if (activeSubTab === 'warehouses') html += renderWarehousesTab(rurcBalance);
    else if (activeSubTab === 'queue') html += renderQueueTab();
    else if (activeSubTab === 'ready') html += renderReadyTab();

    html += `</div></div>`;
    return html;
}

// ─── РЕНДЕР: ЗАВОДЫ ──────────────────────────────────────
function renderFactoriesTab(tonBalance, playerOil, playerGas, prodCap, storedProds) {
    let html = '<div class="products-grid">';
    for (const [id, product] of Object.entries(REFINERY_PRODUCTS)) {
        const isOwned = !!refineryState.owned[id];
        const canBuy = !isOwned && tonBalance >= product.priceTON;
        const factoryLvl = getFactoryLevel(id);
        const timeHours = getFactoryTimeHours(id);
        const canAffordOil = playerOil >= product.oilRequired;
        const canAffordGas = !product.requiresGas || playerGas >= product.gasRequired;
        const hasStorageSpace = storedProds + product.outputAmount <= prodCap;
        const canRefine = isOwned && canAffordOil && canAffordGas && hasStorageSpace;
        const isInQueue = refineryState.queue.some(t => t.productId === id);
        const nextUpgrade = isOwned && factoryLvl < 5 ? FACTORY_UPGRADE_LEVELS[factoryLvl] : null;
        const canUpgrade = nextUpgrade && tonBalance >= nextUpgrade.priceTON;

        html += `
        <div class="product-card ${isOwned ? 'product-owned' : ''} ${product.premium ? 'product-premium' : ''} ${!isOwned && !canBuy ? 'product-disabled' : ''}"
             style="--product-color: ${product.color}">
            <div class="product-header">
                <span class="product-emoji">${product.emoji}</span>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-demand">${product.demandLabel}</div>
                </div>
                ${isOwned
                    ? `<div class="factory-level-badge">Ур. ${factoryLvl}/5</div>`
                    : product.premium ? '<div class="product-badge">PREMIUM</div>' : ''
                }
            </div>
            <div class="product-desc">${product.description}</div>
            <div class="product-stats">
                <div class="stat-row"><span>💎 Цена завода</span><span class="stat-price">${product.priceTON} TON</span></div>
                <div class="stat-row"><span>🛢 Нефть/цикл</span><span class="${isOwned && !canAffordOil ? 'stat-bad' : isOwned ? 'stat-ok' : ''}">${product.oilRequired} барр.</span></div>
                ${product.requiresGas ? `<div class="stat-row"><span>💨 Газ/цикл</span><span class="${isOwned && !canAffordGas ? 'stat-bad' : isOwned ? 'stat-ok' : ''}">${product.gasRequired} ед.</span></div>` : ''}
                <div class="stat-row"><span>⏱ Время цикла</span><span class="stat-time">${isOwned ? timeHours : product.baseTimeHours}ч ${isOwned && factoryLvl > 1 ? '<span class="time-bonus">(-'+Math.round((1-FACTORY_UPGRADE_LEVELS[factoryLvl-1].timeMultiplier)*100)+'%)</span>' : ''}</span></div>
                <div class="stat-row"><span>📦 Выход</span><span>${product.outputAmount} ед.</span></div>
                <div class="stat-row"><span>💰 Цена продажи</span><span>${product.priceRURC} RURC/ед.</span></div>
                <div class="stat-row stat-total"><span>🏆 Доход/цикл</span><span>${product.totalRURC} RURC</span></div>
            </div>
            ${isOwned ? `
                <button class="refine-btn ${canRefine && !isInQueue ? '' : 'btn-disabled'}"
                        onclick="startRefiningUI('${id}')"
                        ${canRefine && !isInQueue ? '' : 'disabled'}>
                    ${isInQueue ? '⏳ В переработке' : !hasStorageSpace ? '📦 Склад полон' : canRefine ? '▶ Запустить' : '❌ Нет ресурсов'}
                </button>
                ${nextUpgrade ? `
                <button class="upgrade-factory-btn ${canUpgrade ? '' : 'btn-disabled'}"
                        onclick="upgradeFactory('${id}')"
                        ${canUpgrade ? '' : 'disabled'}>
                    ⬆️ Улучшить до ур.${nextUpgrade.level} — ${nextUpgrade.priceTON} TON
                    <span class="upgrade-hint">время: ${timeHours}ч → ${+(product.baseTimeHours * nextUpgrade.timeMultiplier).toFixed(2)}ч</span>
                </button>` : '<div class="max-level-badge">🏆 Максимальный уровень</div>'}
            ` : `
                <button class="buy-refinery-btn ${canBuy ? '' : 'btn-disabled'}"
                        onclick="buyRefinery('${id}')"
                        ${canBuy ? '' : 'disabled'}>
                    ${canBuy ? `🏭 Купить за ${product.priceTON} TON` : `❌ Нужно ${product.priceTON} TON`}
                </button>
            `}
        </div>`;
    }
    html += '</div>';
    return html;
}

// ─── РЕНДЕР: СКЛАДЫ ──────────────────────────────────────
function renderWarehousesTab(rurcBalance) {
    let html = `
    <div class="warehouses-info">
        🔥 Улучшение складов сжигает RURC навсегда — это уменьшает общее предложение токена.
    </div>
    <div class="warehouses-grid">`;

    for (const [type, wh] of Object.entries(WAREHOUSE_CONFIG)) {
        const currentLvl = refineryState.warehouseLevels[type] || 1;
        const currentData = wh.levels[currentLvl - 1];
        const nextData = currentLvl < 5 ? wh.levels[currentLvl] : null;
        const canUpgrade = nextData && rurcBalance >= nextData.priceRURC;
        const isMax = currentLvl >= 5;

        // Текущее заполнение
        let currentAmount = 0;
        if (type === 'oil') currentAmount = parseFloat(localStorage.getItem('rurc_oil') || '0');
        else if (type === 'gas') currentAmount = parseFloat(localStorage.getItem('rurc_gas') || '0');
        else currentAmount = getProductsInStorage();
        const fillPct = Math.min(100, (currentAmount / currentData.capacity) * 100);

        html += `
        <div class="warehouse-card" style="--wh-color: ${wh.color}">
            <div class="wh-header">
                <span class="wh-emoji">${wh.emoji}</span>
                <div class="wh-info">
                    <div class="wh-name">${wh.name}</div>
                    <div class="wh-level">Уровень ${currentLvl}/5 — ${currentData.label}</div>
                </div>
                ${isMax ? '<div class="wh-max-badge">MAX</div>' : ''}
            </div>
            <div class="wh-desc">${wh.description}</div>

            <!-- Заполнение -->
            <div class="wh-fill-row">
                <span>${currentAmount.toFixed(0)} / ${currentData.capacity}</span>
                <span class="${fillPct >= 90 ? 'fill-danger' : fillPct >= 70 ? 'fill-warn' : 'fill-ok'}">${fillPct.toFixed(0)}%</span>
            </div>
            <div class="wh-fill-bar">
                <div class="wh-fill-inner ${fillPct >= 90 ? 'fill-bar-danger' : ''}" style="width:${fillPct.toFixed(1)}%"></div>
            </div>

            <!-- Уровни -->
            <div class="wh-levels-row">
                ${wh.levels.map(l => `<div class="wh-lvl-dot ${l.level <= currentLvl ? 'active' : ''}"></div>`).join('')}
            </div>

            ${!isMax ? `
            <div class="wh-upgrade-info">
                <div class="wh-upgrade-row">
                    <span>📦 Следующий уровень</span>
                    <span>${nextData.capacity} ед.</span>
                </div>
                <div class="wh-upgrade-row">
                    <span>🔥 Стоимость (сжигается)</span>
                    <span class="burn-price">${nextData.priceRURC} RURC</span>
                </div>
            </div>
            <button class="wh-upgrade-btn ${canUpgrade ? '' : 'btn-disabled'}"
                    onclick="upgradeWarehouse('${type}')"
                    ${canUpgrade ? '' : 'disabled'}>
                ${canUpgrade
                    ? `🔥 Улучшить — сжечь ${nextData.priceRURC} RURC`
                    : `❌ Нужно ${nextData.priceRURC} RURC (есть: ${rurcBalance.toFixed(0)})`}
            </button>
            ` : '<div class="wh-max-label">🏆 Максимальная вместимость</div>'}
        </div>`;
    }

    // Статистика сжигания
    html += `</div>
    <div class="burn-stats">
        <div class="burn-stats-title">🔥 Статистика сжигания</div>
        <div class="burn-stat-row"><span>Всего сожжено</span><span class="burn-val">${refineryState.totalBurned.toLocaleString()} RURC</span></div>
    </div>`;
    return html;
}

// ─── РЕНДЕР: ОЧЕРЕДЬ ─────────────────────────────────────
function renderQueueTab() {
    if (refineryState.queue.length === 0)
        return '<div class="empty-state">⏳ Очередь пуста.<br>Запусти переработку на вкладке Заводы.</div>';

    let html = '<div class="queue-list">';
    for (const task of refineryState.queue) {
        const product = REFINERY_PRODUCTS[task.productId];
        const remaining = Math.max(0, task.finishTime - Date.now());
        const hours = Math.floor(remaining / 3600000);
        const mins = Math.floor((remaining % 3600000) / 60000);
        const progress = Math.min(100, ((Date.now() - task.startTime) / (task.finishTime - task.startTime)) * 100);
        html += `
        <div class="queue-item" style="--product-color: ${product.color}">
            <div class="queue-header">
                <span>${product.emoji} ${product.name}</span>
                <span class="queue-time">${hours}ч ${mins}м</span>
            </div>
            <div class="queue-progress"><div class="queue-bar" style="width:${progress.toFixed(1)}%"></div></div>
            <div class="queue-output">Выход: ${task.outputAmount} ед. → ${task.outputAmount * product.priceRURC} RURC</div>
        </div>`;
    }
    html += '</div>';
    return html;
}

// ─── РЕНДЕР: ГОТОВО ──────────────────────────────────────
function renderReadyTab() {
    if (refineryState.completed.length === 0)
        return '<div class="empty-state">✅ Нет готовых продуктов.<br>Дождись завершения переработки.</div>';

    let html = '<div class="completed-list">';
    for (const task of refineryState.completed) {
        const product = REFINERY_PRODUCTS[task.productId];
        const earned = task.outputAmount * product.priceRURC;
        html += `
        <div class="completed-item" style="--product-color: ${product.color}">
            <div class="completed-info">
                <span class="completed-emoji">${product.emoji}</span>
                <div>
                    <div class="completed-name">${product.name}</div>
                    <div class="completed-amount">${task.outputAmount} ед.</div>
                </div>
            </div>
            <button class="sell-btn" onclick="sellProductUI(${task.id})">
                Продать<br><strong>${earned} RURC</strong>
            </button>
        </div>`;
    }
    html += '</div>';
    return html;
}

// ─── UI ОБЁРТКИ ──────────────────────────────────────────
function switchRefSubTab(tab) {
    window._refinerySubTab = tab;
    rerenderRefinery();
}

function rerenderRefinery() {
    const el = document.getElementById('refinery-content');
    if (el) el.innerHTML = renderRefineryTab();
}

function startRefiningUI(productId) {
    const result = startRefining(productId);
    if (result.success) {
        showToast(`✅ ${REFINERY_PRODUCTS[productId].emoji} Запущено!`);
        rerenderRefinery();
    } else {
        showToast(`❌ ${result.error}`);
    }
}

function sellProductUI(taskId) {
    const result = sellProduct(taskId);
    if (result.success) {
        showToast(`💰 +${result.earned} RURC`);
        updateBalanceDisplay();
        rerenderRefinery();
    } else {
        showToast(`❌ ${result.error}`);
    }
}

function updateTONDisplay() {
    const bal = parseFloat(localStorage.getItem('rurc_ton_balance') || '0');
    document.querySelectorAll('.ton-val').forEach(el => el.textContent = bal.toFixed(2));
}

function updateBalanceDisplay() {
    const bal = parseFloat(localStorage.getItem('rurc_balance') || '0');
    const el = document.getElementById('balance');
    if (el) el.textContent = bal.toFixed(2);
}

function showToast(msg) {
    let t = document.getElementById('toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'toast';
        t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1a1a2e;color:#fff;padding:12px 20px;border-radius:12px;z-index:9999;font-size:14px;border:1px solid #FF6B00;max-width:85%;text-align:center;transition:opacity 0.3s;';
        document.body.appendChild(t);
    }
    t.textContent = msg; t.style.opacity = '1';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.style.opacity = '0'; }, 3000);
}

// Обновление каждую минуту
setInterval(() => {
    checkRefineryQueue();
    const el = document.getElementById('refinery-content');
    if (el && el.closest('.tab-content.active')) rerenderRefinery();
}, 60000);

loadRefineryState();
