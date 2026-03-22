// ═══════════════════════════════════════════
// RURCOIN — Завод переработки нефти
// Каждый завод покупается за TON
// ═══════════════════════════════════════════

const REFINERY_PRODUCTS = {
    gasoline: {
        id: 'gasoline',
        name: 'Бензин',
        emoji: '⛽',
        description: 'Самый популярный топливный продукт. Высокий спрос на рынке.',
        priceTON: 0.5,
        oilRequired: 10,
        gasRequired: 0,
        timeHours: 2,
        outputAmount: 8,
        priceRURC: 15,
        totalRURC: 120,
        efficiency: 60,
        demand: 'high',
        demandLabel: '🔴 Высокий',
        color: '#FF6B00'
    },
    diesel: {
        id: 'diesel',
        name: 'Дизель',
        emoji: '🛢',
        description: 'Стабильный спрос. Подходит для промышленных нужд.',
        priceTON: 0.8,
        oilRequired: 10,
        gasRequired: 0,
        timeHours: 3,
        outputAmount: 10,
        priceRURC: 10,
        totalRURC: 100,
        efficiency: 33,
        demand: 'medium',
        demandLabel: '🟡 Средний',
        color: '#8B6914'
    },
    plastic: {
        id: 'plastic',
        name: 'Пластик',
        emoji: '🟡',
        description: 'Быстрая переработка, большой выход. Низкая цена, но высокий объём.',
        priceTON: 0.3,
        oilRequired: 5,
        gasRequired: 0,
        timeHours: 1,
        outputAmount: 20,
        priceRURC: 3,
        totalRURC: 60,
        efficiency: 60,
        demand: 'low',
        demandLabel: '🟢 Низкий',
        color: '#FFD700'
    },
    kerosene: {
        id: 'kerosene',
        name: 'Авиакеросин',
        emoji: '✈️',
        description: 'Премиум продукт. Редкий спрос, но самая высокая цена за единицу.',
        priceTON: 2.0,
        oilRequired: 20,
        gasRequired: 0,
        timeHours: 6,
        outputAmount: 15,
        priceRURC: 25,
        totalRURC: 375,
        efficiency: 62,
        demand: 'rare',
        demandLabel: '💎 Редкий',
        color: '#00D4FF',
        premium: true
    },
    chemicals: {
        id: 'chemicals',
        name: 'Химикаты',
        emoji: '⚗️',
        description: 'Требует нефть + газ. Высокая прибыль при наличии газовой вышки.',
        priceTON: 1.5,
        oilRequired: 15,
        gasRequired: 5,
        timeHours: 4,
        outputAmount: 12,
        priceRURC: 20,
        totalRURC: 240,
        efficiency: 60,
        demand: 'medium',
        demandLabel: '🟡 Средний',
        color: '#00FF88',
        requiresGas: true
    }
};

// Состояние завода
let refineryState = {
    owned: {},      // { productId: true } — купленные заводы
    queue: [],      // очередь переработки
    completed: [],  // готовые продукты
    totalProduced: {},
    totalEarned: 0
};

// Загрузка состояния
function loadRefineryState() {
    const saved = localStorage.getItem('rurc_refinery');
    if (saved) {
        try {
            refineryState = { ...refineryState, ...JSON.parse(saved) };
        } catch(e) {}
    }
}

// Сохранение состояния
function saveRefineryState() {
    localStorage.setItem('rurc_refinery', JSON.stringify(refineryState));
}

// Проверка завершённых задач
function checkRefineryQueue() {
    const now = Date.now();
    let changed = false;
    refineryState.queue = refineryState.queue.filter(task => {
        if (now >= task.finishTime) {
            refineryState.completed.push(task);
            if (!refineryState.totalProduced[task.productId]) {
                refineryState.totalProduced[task.productId] = 0;
            }
            refineryState.totalProduced[task.productId] += task.outputAmount;
            changed = true;
            return false;
        }
        return true;
    });
    if (changed) saveRefineryState();
}

// ─── ПОКУПКА ЗАВОДА ───────────────────────────────────────
function buyRefinery(productId) {
    const product = REFINERY_PRODUCTS[productId];
    if (!product) return;

    if (refineryState.owned[productId]) {
        showToast('✅ Этот завод уже куплен');
        return;
    }

    const tg = window.Telegram?.WebApp;
    if (!tg) {
        showToast('❌ Открой в Telegram');
        return;
    }

    // Показываем подтверждение
    tg.showConfirm(
        `🏭 Купить завод "${product.name}"?

Цена: ${product.priceTON} TON

После покупки сможешь перерабатывать нефть в ${product.name.toLowerCase()}.`,
        (confirmed) => {
            if (!confirmed) return;
            processBuyRefinery(productId, product, tg);
        }
    );
}

function processBuyRefinery(productId, product, tg) {
    // Проверяем баланс TON
    const tonBalance = parseFloat(localStorage.getItem('rurc_ton_balance') || '0');

    if (tonBalance < product.priceTON) {
        tg.showAlert(
            `❌ Недостаточно TON

Нужно: ${product.priceTON} TON
У тебя: ${tonBalance.toFixed(2)} TON

Пополни кошелёк и попробуй снова.`
        );
        return;
    }

    // Списываем TON
    const newBalance = tonBalance - product.priceTON;
    localStorage.setItem('rurc_ton_balance', newBalance.toFixed(4));

    // Отмечаем завод как купленный
    refineryState.owned[productId] = true;
    saveRefineryState();

    showToast(`🎉 Завод "${product.name}" куплен!`);
    updateTONDisplay();
    document.getElementById('refinery-content').innerHTML = renderRefineryTab();
}

// ─── ЗАПУСК ПЕРЕРАБОТКИ ───────────────────────────────────
function startRefining(productId) {
    const product = REFINERY_PRODUCTS[productId];
    if (!product) return { success: false, error: 'Продукт не найден' };

    if (!refineryState.owned[productId]) {
        return { success: false, error: 'Сначала купи завод' };
    }

    const playerOil = parseFloat(localStorage.getItem('rurc_oil') || '0');
    const playerGas = parseFloat(localStorage.getItem('rurc_gas') || '0');

    if (playerOil < product.oilRequired) {
        return { success: false, error: `Нужно ${product.oilRequired} барр. нефти. У тебя: ${playerOil.toFixed(1)}` };
    }
    if (product.requiresGas && playerGas < product.gasRequired) {
        return { success: false, error: `Нужно ${product.gasRequired} ед. газа. У тебя: ${playerGas.toFixed(1)}` };
    }

    // Списываем ресурсы
    localStorage.setItem('rurc_oil', (playerOil - product.oilRequired).toFixed(2));
    if (product.requiresGas) {
        localStorage.setItem('rurc_gas', (playerGas - product.gasRequired).toFixed(2));
    }

    const task = {
        id: Date.now(),
        productId,
        startTime: Date.now(),
        finishTime: Date.now() + product.timeHours * 3600 * 1000,
        outputAmount: product.outputAmount,
        oilUsed: product.oilRequired,
        gasUsed: product.gasRequired || 0
    };

    refineryState.queue.push(task);
    saveRefineryState();

    return { success: true, task };
}

// ─── ПРОДАЖА ──────────────────────────────────────────────
function sellProduct(taskId) {
    const idx = refineryState.completed.findIndex(t => t.id === taskId);
    if (idx === -1) return { success: false, error: 'Продукт не найден' };

    const task = refineryState.completed[idx];
    const product = REFINERY_PRODUCTS[task.productId];
    const earned = task.outputAmount * product.priceRURC;

    const currentRURC = parseFloat(localStorage.getItem('rurc_balance') || '0');
    localStorage.setItem('rurc_balance', (currentRURC + earned).toFixed(2));
    refineryState.totalEarned += earned;

    refineryState.completed.splice(idx, 1);
    saveRefineryState();

    return { success: true, earned, product };
}

// ─── РЕНДЕР ───────────────────────────────────────────────
function renderRefineryTab() {
    checkRefineryQueue();

    const playerOil = parseFloat(localStorage.getItem('rurc_oil') || '0');
    const playerGas = parseFloat(localStorage.getItem('rurc_gas') || '0');
    const tonBalance = parseFloat(localStorage.getItem('rurc_ton_balance') || '0');

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
                <span class="res-value">${playerOil.toFixed(1)} барр.</span>
            </div>
            <div class="res-item">
                <span class="res-icon">💨</span>
                <span class="res-label">Газ</span>
                <span class="res-value">${playerGas.toFixed(1)} ед.</span>
            </div>
        </div>

        <div class="refinery-title">🏭 Заводы переработки</div>
        <div class="products-grid">
    `;

    for (const [id, product] of Object.entries(REFINERY_PRODUCTS)) {
        const isOwned = !!refineryState.owned[id];
        const canBuy = !isOwned && tonBalance >= product.priceTON;
        const canAffordOil = playerOil >= product.oilRequired;
        const canAffordGas = !product.requiresGas || playerGas >= product.gasRequired;
        const canRefine = isOwned && canAffordOil && canAffordGas;
        const isInQueue = refineryState.queue.some(t => t.productId === id);

        html += `
        <div class="product-card ${isOwned ? 'product-owned' : ''} ${product.premium ? 'product-premium' : ''} ${!isOwned && !canBuy ? 'product-disabled' : ''}"
             style="--product-color: ${product.color}">

            <!-- Шапка -->
            <div class="product-header">
                <span class="product-emoji">${product.emoji}</span>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-demand">${product.demandLabel}</div>
                </div>
                ${isOwned
                    ? '<div class="owned-badge">✅ КУПЛЕН</div>'
                    : product.premium ? '<div class="product-badge">PREMIUM</div>' : ''
                }
            </div>

            <div class="product-desc">${product.description}</div>

            <!-- Характеристики -->
            <div class="product-stats">
                <div class="stat-row">
                    <span>💎 Цена завода</span>
                    <span class="stat-price">${product.priceTON} TON</span>
                </div>
                <div class="stat-row">
                    <span>🛢 Нефть/цикл</span>
                    <span class="${isOwned && canAffordOil ? 'stat-ok' : isOwned ? 'stat-bad' : ''}">${product.oilRequired} барр.</span>
                </div>
                ${product.requiresGas ? `
                <div class="stat-row">
                    <span>💨 Газ/цикл</span>
                    <span class="${isOwned && canAffordGas ? 'stat-ok' : isOwned ? 'stat-bad' : ''}">${product.gasRequired} ед.</span>
                </div>` : ''}
                <div class="stat-row">
                    <span>⏱ Время цикла</span>
                    <span>${product.timeHours} ч.</span>
                </div>
                <div class="stat-row">
                    <span>📦 Выход</span>
                    <span>${product.outputAmount} ед.</span>
                </div>
                <div class="stat-row">
                    <span>💰 Цена продажи</span>
                    <span>${product.priceRURC} RURC/ед.</span>
                </div>
                <div class="stat-row stat-total">
                    <span>🏆 Доход/цикл</span>
                    <span>${product.totalRURC} RURC</span>
                </div>
                <div class="stat-row">
                    <span>📈 Эффективность</span>
                    <span>${product.efficiency} RURC/ч</span>
                </div>
            </div>

            <!-- Кнопки -->
            ${isOwned ? `
                <button class="refine-btn ${canRefine && !isInQueue ? '' : 'btn-disabled'}"
                        onclick="startRefiningUI('${id}')"
                        ${canRefine && !isInQueue ? '' : 'disabled'}>
                    ${isInQueue ? '⏳ В переработке' : canRefine ? '▶ Запустить переработку' : '❌ Нет ресурсов'}
                </button>
            ` : `
                <button class="buy-refinery-btn ${canBuy ? '' : 'btn-disabled'}"
                        onclick="buyRefinery('${id}')"
                        ${canBuy ? '' : 'disabled'}>
                    ${canBuy ? `🏭 Купить за ${product.priceTON} TON` : `❌ Нужно ${product.priceTON} TON`}
                </button>
            `}
        </div>
        `;
    }

    html += `</div>`;

    // Очередь
    if (refineryState.queue.length > 0) {
        html += `<div class="refinery-title">⏳ В переработке</div><div class="queue-list">`;
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
                <div class="queue-progress">
                    <div class="queue-bar" style="width: ${progress.toFixed(1)}%"></div>
                </div>
                <div class="queue-output">Выход: ${task.outputAmount} ед. → ${task.outputAmount * product.priceRURC} RURC</div>
            </div>
            `;
        }
        html += `</div>`;
    }

    // Готовые
    if (refineryState.completed.length > 0) {
        html += `<div class="refinery-title">✅ Готово к продаже</div><div class="completed-list">`;
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
            </div>
            `;
        }
        html += `</div>`;
    }

    html += `</div>`;
    return html;
}

// ─── UI ОБЁРТКИ ───────────────────────────────────────────
function startRefiningUI(productId) {
    const result = startRefining(productId);
    if (result.success) {
        const product = REFINERY_PRODUCTS[productId];
        showToast(`✅ ${product.emoji} ${product.name} запущен!`);
        document.getElementById('refinery-content').innerHTML = renderRefineryTab();
    } else {
        showToast(`❌ ${result.error}`);
    }
}

function sellProductUI(taskId) {
    const result = sellProduct(taskId);
    if (result.success) {
        showToast(`💰 Продано! +${result.earned} RURC`);
        updateBalanceDisplay();
        document.getElementById('refinery-content').innerHTML = renderRefineryTab();
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
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1a1a2e;color:#fff;padding:12px 20px;border-radius:12px;z-index:9999;font-size:14px;border:1px solid #FF6B00;max-width:80%;text-align:center;transition:opacity 0.3s;';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

// Обновление каждую минуту
setInterval(() => {
    checkRefineryQueue();
    const el = document.getElementById('refinery-content');
    if (el && el.closest('.tab-content.active')) {
        el.innerHTML = renderRefineryTab();
    }
}, 60000);

// Инициализация
loadRefineryState();
