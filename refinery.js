// ═══════════════════════════════════════════
// RURCOIN — Завод переработки нефти
// 5 продуктов: бензин, дизель, пластик, керосин, химикаты
// ═══════════════════════════════════════════

const REFINERY_PRODUCTS = {
    gasoline: {
        id: 'gasoline',
        name: 'Бензин',
        emoji: '⛽',
        description: 'Самый популярный топливный продукт. Высокий спрос на рынке.',
        oilRequired: 10,
        gasRequired: 0,
        timeHours: 2,
        outputAmount: 8,
        priceRURC: 15,
        totalRURC: 120,
        efficiency: 60, // RURC в час
        demand: 'high',
        demandLabel: '🔴 Высокий',
        color: '#FF6B00'
    },
    diesel: {
        id: 'diesel',
        name: 'Дизель',
        emoji: '🛢',
        description: 'Стабильный спрос. Подходит для промышленных нужд.',
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
    queue: [], // очередь переработки
    completed: [], // готовые продукты
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
            showRefineryNotification(task);
            return false;
        }
        return true;
    });
    if (changed) saveRefineryState();
}

// Уведомление о готовности
function showRefineryNotification(task) {
    const product = REFINERY_PRODUCTS[task.productId];
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert(
            `✅ ${product.emoji} ${product.name} готов!\n` +
            `Получено: ${task.outputAmount} единиц\n` +
            `Продай за ${task.outputAmount * product.priceRURC} RURC`
        );
    }
}

// Запуск переработки
function startRefining(productId, oilAmount, gasAmount) {
    const product = REFINERY_PRODUCTS[productId];
    if (!product) return { success: false, error: 'Продукт не найден' };

    // Проверяем ресурсы игрока
    const playerOil = parseFloat(localStorage.getItem('rurc_oil') || '0');
    const playerGas = parseFloat(localStorage.getItem('rurc_gas') || '0');

    if (playerOil < product.oilRequired) {
        return { success: false, error: `Нужно ${product.oilRequired} баррелей нефти. У тебя: ${playerOil.toFixed(1)}` };
    }
    if (product.requiresGas && playerGas < product.gasRequired) {
        return { success: false, error: `Нужно ${product.gasRequired} единиц газа. У тебя: ${playerGas.toFixed(1)}` };
    }

    // Списываем ресурсы
    localStorage.setItem('rurc_oil', (playerOil - product.oilRequired).toFixed(2));
    if (product.requiresGas) {
        localStorage.setItem('rurc_gas', (playerGas - product.gasRequired).toFixed(2));
    }

    // Добавляем в очередь
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

// Продажа готового продукта за RURC
function sellProduct(taskId) {
    const idx = refineryState.completed.findIndex(t => t.id === taskId);
    if (idx === -1) return { success: false, error: 'Продукт не найден' };

    const task = refineryState.completed[idx];
    const product = REFINERY_PRODUCTS[task.productId];
    const earned = task.outputAmount * product.priceRURC;

    // Начисляем RURC
    const currentRURC = parseFloat(localStorage.getItem('rurc_balance') || '0');
    localStorage.setItem('rurc_balance', (currentRURC + earned).toFixed(2));
    refineryState.totalEarned += earned;

    // Убираем из готовых
    refineryState.completed.splice(idx, 1);
    saveRefineryState();

    return { success: true, earned, product };
}

// Рендер вкладки завода
function renderRefineryTab() {
    checkRefineryQueue();

    const playerOil = parseFloat(localStorage.getItem('rurc_oil') || '0');
    const playerGas = parseFloat(localStorage.getItem('rurc_gas') || '0');

    let html = `
    <div class="refinery-container">
        <!-- Ресурсы -->
        <div class="refinery-resources">
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

        <!-- Продукты переработки -->
        <div class="refinery-title">⚗️ Выбери продукт переработки</div>
        <div class="products-grid">
    `;

    for (const [id, product] of Object.entries(REFINERY_PRODUCTS)) {
        const canAffordOil = playerOil >= product.oilRequired;
        const canAffordGas = !product.requiresGas || playerGas >= product.gasRequired;
        const canAfford = canAffordOil && canAffordGas;
        const isActive = refineryState.queue.some(t => t.productId === id);

        html += `
        <div class="product-card ${canAfford ? '' : 'product-disabled'} ${product.premium ? 'product-premium' : ''}" 
             style="--product-color: ${product.color}">
            <div class="product-header">
                <span class="product-emoji">${product.emoji}</span>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-demand">${product.demandLabel}</div>
                </div>
                ${product.premium ? '<div class="product-badge">PREMIUM</div>' : ''}
            </div>

            <div class="product-desc">${product.description}</div>

            <div class="product-stats">
                <div class="stat-row">
                    <span>🛢 Нефть</span>
                    <span class="${canAffordOil ? 'stat-ok' : 'stat-bad'}">${product.oilRequired} барр.</span>
                </div>
                ${product.requiresGas ? `
                <div class="stat-row">
                    <span>💨 Газ</span>
                    <span class="${canAffordGas ? 'stat-ok' : 'stat-bad'}">${product.gasRequired} ед.</span>
                </div>` : ''}
                <div class="stat-row">
                    <span>⏱ Время</span>
                    <span>${product.timeHours} ч.</span>
                </div>
                <div class="stat-row">
                    <span>📦 Выход</span>
                    <span>${product.outputAmount} ед.</span>
                </div>
                <div class="stat-row">
                    <span>💰 Цена</span>
                    <span>${product.priceRURC} RURC/ед.</span>
                </div>
                <div class="stat-row stat-total">
                    <span>🏆 Итого</span>
                    <span>${product.totalRURC} RURC</span>
                </div>
                <div class="stat-row">
                    <span>📈 Эффект.</span>
                    <span>${product.efficiency} RURC/ч</span>
                </div>
            </div>

            <button class="refine-btn ${canAfford && !isActive ? '' : 'btn-disabled'}" 
                    onclick="startRefiningUI('${id}')"
                    ${canAfford && !isActive ? '' : 'disabled'}>
                ${isActive ? '⏳ В очереди' : canAfford ? '▶ Переработать' : '❌ Нет ресурсов'}
            </button>
        </div>
        `;
    }

    html += `</div>`;

    // Очередь переработки
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
                    <div class="queue-bar" style="width: ${progress}%"></div>
                </div>
                <div class="queue-output">Выход: ${task.outputAmount} ед. → ${task.outputAmount * product.priceRURC} RURC</div>
            </div>
            `;
        }
        html += `</div>`;
    }

    // Готовые продукты
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

// UI обёртки
function startRefiningUI(productId) {
    const result = startRefining(productId);
    if (result.success) {
        const product = REFINERY_PRODUCTS[productId];
        showToast(`✅ ${product.emoji} ${product.name} отправлен на переработку!`);
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

function showToast(msg) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1a1a2e;color:#fff;padding:12px 20px;border-radius:12px;z-index:9999;font-size:14px;border:1px solid #FF6B00;max-width:80%;text-align:center;';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

function updateBalanceDisplay() {
    const bal = parseFloat(localStorage.getItem('rurc_balance') || '0');
    const el = document.getElementById('balance');
    if (el) el.textContent = bal.toFixed(2);
}

// Обновление таймеров каждую минуту
setInterval(() => {
    checkRefineryQueue();
    const refineryContent = document.getElementById('refinery-content');
    if (refineryContent && refineryContent.closest('.tab-content.active')) {
        refineryContent.innerHTML = renderRefineryTab();
    }
}, 60000);

// Инициализация
loadRefineryState();
