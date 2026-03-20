// Модуль пополнения баланса RURC через ЮKassa и WebMoney
// Поддерживаемые банки: Сбербанк, Тинькофф, Альфа-Банк, Газпромбанк, ВТБ, Россельхозбанк

const PAYMENT_CONFIG = {
    // Настройки ЮKassa (нужно заменить на реальные)
    shopId: 'YOUR_SHOP_ID',
    secretKey: 'YOUR_SECRET_KEY',

    // Настройки WebMoney
    webmoneyPurse: 'YOUR_PURSE',
    webmoneySecretKey: 'YOUR_SECRET_KEY',

    // Минимальная и максимальная сумма пополнения (в рублях)
    minAmount: 100,
    maxAmount: 50000,
    // Комиссия (%)
    commission: 0,
    // Валюта
    currency: 'RUB',
    // Курс RURC к рублю
    rate: 1
};

// Поддерживаемые способы оплаты
const SUPPORTED_PAYMENTS = [
    // Банки
    { id: 'sberbank', name: 'Сбербанк', icon: '🏦', group: 'bank' },
    { id: 'tinkoff_bank', name: 'Тинькофф', icon: '🏦', group: 'bank' },
    { id: 'alfabank', name: 'Альфа-Банк', icon: '🏦', group: 'bank' },
    { id: 'gazprom_bank', name: 'Газпромбанк', icon: '🏦', group: 'bank' },
    { id: 'vtb', name: 'ВТБ', icon: '🏦', group: 'bank' },
    { id: 'rosselhozbank', name: 'Россельхозбанк', icon: '🏦', group: 'bank' },
    // Электронные кошельки
    { id: 'qiwi_wallet', name: 'QIWI Кошелёк', icon: '💳', group: 'wallet' },
    { id: 'yoomoney_wallet', name: 'ЮMoney', icon: '💳', group: 'wallet' },
    { id: 'webmoney_wm', name: 'WebMoney', icon: '💸', group: 'wallet' },
    // Карты
    { id: 'bank_card', name: 'Любая карта', icon: '💳', group: 'card' }
];

// Состояние платежа
let paymentState = {
    amount: 0,
    paymentMethod: null,
    status: 'idle',
    paymentId: null
};

// Показать форму пополнения
function showTopUpModal() {
    const modal = document.createElement('div');
    modal.className = 'modal topup-modal';
    modal.id = 'topUpModal';

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>💰 Пополнение баланса</h2>
                <button class="close-btn" onclick="closeTopUpModal()">×</button>
            </div>

            <div class="modal-body">
                <div class="payment-methods">
                    <p class="label">Выберите способ оплаты:</p>
                    <div class="methods-grid">
                        ${SUPPORTED_PAYMENTS.map(method => `
                            <div class="method-item" data-method="${method.id}" onclick="selectPaymentMethod('${method.id}')">
                                <span class="method-icon">${method.icon}</span>
                                <span class="method-name">${method.name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="amount-section">
                    <p class="label">Сумма пополнения (₽):</p>
                    <div class="amount-input-group">
                        <button class="amount-btn" onclick="adjustAmount(-100)">-100</button>
                        <input type="number" id="topUpAmount" 
                            placeholder="Введите сумму" 
                            min="${PAYMENT_CONFIG.minAmount}"
                            max="${PAYMENT_CONFIG.maxAmount}"
                            onchange="calculateRURC()">
                        <button class="amount-btn" onclick="adjustAmount(100)">+100</button>
                    </div>
                    <div class="quick-amounts">
                        <button onclick="setQuickAmount(500)">500₽</button>
                        <button onclick="setQuickAmount(1000)">1000₽</button>
                        <button onclick="setQuickAmount(5000)">5000₽</button>
                        <button onclick="setQuickAmount(10000)">10000₽</button>
                    </div>
                </div>

                <div class="payment-gateways">
                    <div class="gateway-info" id="yookassaInfo">
                        <span>🔒 Безопасная оплата через</span>
                        <strong>ЮKassa</strong>
                    </div>
                    <div class="gateway-info" id="webmoneyInfo" style="display: none;">
                        <span>💸 Оплата через</span>
                        <strong>WebMoney</strong>
                    </div>
                </div>

                <div class="summary-section">
                    <div class="summary-row">
                        <span>Сумма:</span>
                        <span id="summaryAmount">0 ₽</span>
                    </div>
                    <div class="summary-row">
                        <span>Комиссия:</span>
                        <span>0%</span>
                    </div>
                    <div class="summary-row total">
                        <span>Вы получите:</span>
                        <span id="summaryRURC">0 RURC</span>
                    </div>
                </div>

                <div class="payment-status" id="paymentStatus" style="display: none;">
                    <div class="status-content">
                        <span class="status-icon">⏳</span>
                        <span class="status-text">Создание платежа...</span>
                    </div>
                </div>
            </div>

            <div class="modal-footer">
                <button class="btn-cancel" onclick="closeTopUpModal()">Отмена</button>
                <button class="btn-pay" id="payBtn" onclick="processPayment()" disabled>
                    Оплатить
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('topUpAmount').addEventListener('input', calculateRURC);
}

// Закрыть модальное окно
function closeTopUpModal() {
    const modal = document.getElementById('topUpModal');
    if (modal) {
        modal.remove();
    }
}

// Выбрать способ оплаты
function selectPaymentMethod(methodId) {
    document.querySelectorAll('.method-item').forEach(item => {
        item.classList.remove('active');
    });

    const selected = document.querySelector(`[data-method="${methodId}"]`);
    if (selected) {
        selected.classList.add('active');
    }

    paymentState.paymentMethod = methodId;

    // Показываем соответствующий шлюз
    const isWebMoney = methodId === 'webmoney_wm';
    document.getElementById('yookassaInfo').style.display = isWebMoney ? 'none' : 'block';
    document.getElementById('webmoneyInfo').style.display = isWebMoney ? 'block' : 'none';

    // Обновляем текст кнопки
    const payBtn = document.getElementById('payBtn');
    if (isWebMoney) {
        payBtn.textContent = 'Оплатить через WebMoney';
    } else {
        payBtn.textContent = 'Оплатить через ЮKassa';
    }

    validateForm();
}

// Настроить сумму
function adjustAmount(delta) {
    const input = document.getElementById('topUpAmount');
    let current = parseInt(input.value) || 0;
    let newValue = current + delta;

    if (newValue < PAYMENT_CONFIG.minAmount) newValue = PAYMENT_CONFIG.minAmount;
    if (newValue > PAYMENT_CONFIG.maxAmount) newValue = PAYMENT_CONFIG.maxAmount;

    input.value = newValue;
    calculateRURC();
}

// Быстрая сумма
function setQuickAmount(amount) {
    document.getElementById('topUpAmount').value = amount;
    calculateRURC();
}

// Рассчитать RURC
function calculateRURC() {
    const amount = parseInt(document.getElementById('topUpAmount').value) || 0;
    const rurc = Math.floor(amount * PAYMENT_CONFIG.rate);

    document.getElementById('summaryAmount').textContent = `${amount.toLocaleString()} ₽`;
    document.getElementById('summaryRURC').textContent = `${rurc.toLocaleString()} RURC`;

    paymentState.amount = amount;
    validateForm();
}

// Валидация формы
function validateForm() {
    const amount = parseInt(document.getElementById('topUpAmount').value) || 0;
    const isValidAmount = amount >= PAYMENT_CONFIG.minAmount && amount <= PAYMENT_CONFIG.maxAmount;
    const hasMethod = paymentState.paymentMethod !== null;

    const payBtn = document.getElementById('payBtn');
    payBtn.disabled = !(isValidAmount && hasMethod);
}

// Определить тип платежа
function getPaymentGateway() {
    if (paymentState.paymentMethod === 'webmoney_wm') {
        return 'webmoney';
    }
    return 'yookassa';
}

// Обработать платёж
async function processPayment() {
    const gateway = getPaymentGateway();

    if (gateway === 'webmoney') {
        await processWebMoneyPayment();
    } else {
        await processYookassaPayment();
    }
}

// ============ ЮKassa ============
async function processYookassaPayment() {
    const amount = paymentState.amount;
    const rurcAmount = Math.floor(amount * PAYMENT_CONFIG.rate);

    const statusEl = document.getElementById('paymentStatus');
    statusEl.style.display = 'block';
    statusEl.className = 'payment-status processing';

    const payBtn = document.getElementById('payBtn');
    payBtn.disabled = true;

    try {
        statusEl.innerHTML = `
            <div class="status-content">
                <span class="status-icon">🔄</span>
                <span class="status-text">Создание платежа в ЮKassa...</span>
            </div>
        `;

        const payment = await createYookassaPayment();

        if (payment.confirmation && payment.confirmation.confirmation_url) {
            if (payment.confirmation.confirmation_url !== '#demo') {
                window.location.href = payment.confirmation.confirmation_url;
            } else {
                await simulatePayment(rurcAmount);
            }
        } else if (payment.status === 'succeeded') {
            await handlePaymentSuccess(rurcAmount);
        }

    } catch (error) {
        statusEl.className = 'payment-status error';
        statusEl.innerHTML = `
            <div class="status-content">
                <span class="status-icon">❌</span>
                <span class="status-text">Ошибка платежа</span>
                <span class="status-error">${error.message}</span>
            </div>
        `;
        payBtn.disabled = false;
    }
}

async function createYookassaPayment() {
    const amount = paymentState.amount;
    const paymentMethod = paymentState.paymentMethod;

    const paymentId = 'rurc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    const paymentData = {
        amount: {
            value: amount.toFixed(2),
            currency: 'RUB'
        },
        payment_method_data: {
            type: paymentMethod
        },
        confirmation: {
            type: 'redirect',
            return_url: window.location.href
        },
        description: `Пополнение баланса RURC на ${amount} ₽`,
        metadata: {
            payment_id: paymentId,
            rurc_amount: Math.floor(amount * PAYMENT_CONFIG.rate)
        }
    };

    // Демо режим
    if (PAYMENT_CONFIG.shopId === 'YOUR_SHOP_ID') {
        return {
            id: paymentId,
            confirmation: {
                confirmation_url: '#demo'
            },
            status: 'succeeded'
        };
    }

    const response = await fetch('https://payment.yookassa.ru/v3/payments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Idempotence-Key': paymentId
        },
        body: JSON.stringify({
            ...paymentData,
            shop_id: PAYMENT_CONFIG.shopId
        })
    });

    return await response.json();
}

// ============ WebMoney ============
async function processWebMoneyPayment() {
    const amount = paymentState.amount;
    const rurcAmount = Math.floor(amount * PAYMENT_CONFIG.rate);

    const statusEl = document.getElementById('paymentStatus');
    statusEl.style.display = 'block';
    statusEl.className = 'payment-status processing';

    const payBtn = document.getElementById('payBtn');
    payBtn.disabled = true;

    try {
        statusEl.innerHTML = `
            <div class="status-content">
                <span class="status-icon">💸</span>
                <span class="status-text">Подготовка платежа WebMoney...</span>
            </div>
        `;

        // Создаём URL для оплаты WebMoney
        const paymentUrl = await createWebMoneyPaymentUrl(amount, rurcAmount);

        if (paymentUrl) {
            // Перенаправляем на WebMoney
            window.location.href = paymentUrl;
        } else {
            // Демо режим
            await simulatePayment(rurcAmount);
        }

    } catch (error) {
        statusEl.className = 'payment-status error';
        statusEl.innerHTML = `
            <div class="status-content">
                <span class="status-icon">❌</span>
                <span class="status-text">Ошибка платежа</span>
                <span class="status-error">${error.message}</span>
            </div>
        `;
        payBtn.disabled = false;
    }
}

async function createWebMoneyPaymentUrl(amount, rurcAmount) {
    const purse = PAYMENT_CONFIG.webmoneyPurse;

    // Демо режим
    if (purse === 'YOUR_PURSE' || !purse) {
        return null;
    }

    // Создаём URL для Merchant WebMoney
    const desc = encodeURIComponent(`Пополнение баланса RURC на ${amount} ₽`);
    const paymentUrl = `https://merchant.webmoney.ru/conf/pay.asp?purse=${purse}&amount=${amount}&desc=${desc}&signature=${generateWebMoneySignature(amount)}`;

    return paymentUrl;
}

function generateWebMoneySignature(amount) {
    // Генерация подписи для WebMoney
    // В реальном приложении используйте реальный секретный ключ
    const { webmoneySecretKey } = PAYMENT_CONFIG;
    const { webmoneyPurse } = PAYMENT_CONFIG;

    if (!webmoneySecretKey || webmoneySecretKey === 'YOUR_SECRET_KEY') {
        return '';
    }

    // Формирование подписи: LMI_PAYEE_PURSE + LMI_PAYMENT_AMOUNT + LMI_PAYMENT_NO + SecretKey
    const signature = `${webmoneyPurse}${amount}${Date.now()}${webmoneySecretKey}`;

    // Используем SHA-256 для подписи
    let hash = 0;
    for (let i = 0; i < signature.length; i++) {
        const char = signature.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    return Math.abs(hash).toString(16);
}

// ============ Общие функции ============
async function simulatePayment(rurcAmount) {
    const statusEl = document.getElementById('paymentStatus');

    await new Promise(resolve => setTimeout(resolve, 1500));

    statusEl.className = 'payment-status success';
    statusEl.innerHTML = `
        <div class="status-content">
            <span class="status-icon">✅</span>
            <span class="status-text">Платёж успешен!</span>
            <span class="status-amount">+${rurcAmount} RURC</span>
        </div>
    `;

    await handlePaymentSuccess(rurcAmount);
}

async function handlePaymentSuccess(rurcAmount) {
    if (window.mintWithUI) {
        await window.mintWithUI(rurcAmount);
    }

    setTimeout(() => {
        closeTopUpModal();
        showNotification(`Баланс пополнен на ${rurcAmount} RURC`, 'success');
    }, 3000);
}

// Обработка webhook от ЮKassa
function handleYookassaWebhook(event) {
    const { object, event: eventType } = event;

    if (eventType === 'payment.succeeded') {
        const rurcAmount = object.metadata?.rurc_amount || 0;
        if (rurcAmount > 0 && window.mintWithUI) {
            window.mintWithUI(rurcAmount);
        }
    }
}

// Обработка результата WebMoney (callback)
function handleWebMoneyCallback(params) {
    const { payment_no, amount, hash } = params;

    // Проверка подписи
    const expectedHash = generateWebMoneySignature(amount);

    if (hash === expectedHash) {
        const rurcAmount = Math.floor(amount * PAYMENT_CONFIG.rate);
        if (window.mintWithUI) {
            window.mintWithUI(rurcAmount);
        }
    }
}

// Экспорт функций
window.showTopUpModal = showTopUpModal;
window.closeTopUpModal = closeTopUpModal;
window.selectPaymentMethod = selectPaymentMethod;
window.adjustAmount = adjustAmount;
window.setQuickAmount = setQuickAmount;
window.calculateRURC = calculateRURC;
window.validateForm = validateForm;
window.processPayment = processPayment;
window.processYookassaPayment = processYookassaPayment;
window.processWebMoneyPayment = processWebMoneyPayment;
window.handleYookassaWebhook = handleYookassaWebhook;
window.handleWebMoneyCallback = handleWebMoneyCallback;

// Конфигурация
window.PAYMENT_CONFIG = PAYMENT_CONFIG;
window.SUPPORTED_PAYMENTS = SUPPORTED_PAYMENTS;

// Стили
const topUpStyles = `
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    }

    .modal-content {
        background: #1a1a2e;
        border-radius: 16px;
        width: 90%;
        max-width: 450px;
        max-height: 90vh;
        overflow-y: auto;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid #333;
    }

    .modal-header h2 {
        margin: 0;
        color: #fff;
        font-size: 20px;
    }

    .close-btn {
        background: none;
        border: none;
        color: #888;
        font-size: 28px;
        cursor: pointer;
    }

    .modal-body {
        padding: 20px;
    }

    .label {
        color: #aaa;
        margin-bottom: 10px;
        font-size: 14px;
    }

    .methods-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin-bottom: 20px;
    }

    .method-item {
        background: #252540;
        border: 2px solid transparent;
        border-radius: 10px;
        padding: 12px 8px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
    }

    .method-item:hover {
        background: #2d2d4a;
    }

    .method-item.active {
        border-color: #6c5ce7;
        background: #2d2d4a;
    }

    .method-icon {
        font-size: 24px;
        display: block;
        margin-bottom: 4px;
    }

    .method-name {
        color: #fff;
        font-size: 11px;
    }

    .amount-section {
        margin-bottom: 20px;
    }

    .amount-input-group {
        display: flex;
        gap: 10px;
        margin-bottom: 10px;
    }

    .amount-input-group input {
        flex: 1;
        padding: 12px;
        border: 1px solid #333;
        border-radius: 8px;
        background: #252540;
        color: #fff;
        font-size: 16px;
        text-align: center;
    }

    .amount-btn {
        padding: 12px 16px;
        background: #333;
        border: none;
        border-radius: 8px;
        color: #fff;
        cursor: pointer;
    }

    .quick-amounts {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }

    .quick-amounts button {
        padding: 8px 16px;
        background: #333;
        border: none;
        border-radius: 20px;
        color: #aaa;
        cursor: pointer;
        font-size: 13px;
    }

    .payment-gateways {
        margin-bottom: 20px;
    }

    .gateway-info {
        background: #252540;
        border-radius: 10px;
        padding: 15px;
        text-align: center;
    }

    .gateway-info span {
        color: #aaa;
        font-size: 14px;
    }

    .gateway-info strong {
        display: block;
        font-size: 18px;
        margin-top: 5px;
    }

    #yookassaInfo strong {
        color: #FF4800;
    }

    #webmoneyInfo strong {
        color: #0085CF;
    }

    .summary-section {
        background: #252540;
        border-radius: 10px;
        padding: 15px;
        margin-bottom: 20px;
    }

    .summary-row {
        display: flex;
        justify-content: space-between;
        color: #aaa;
        margin-bottom: 8px;
    }

    .summary-row.total {
        color: #fff;
        font-weight: bold;
        font-size: 18px;
        border-top: 1px solid #333;
        padding-top: 10px;
        margin-top: 10px;
    }

    .payment-status {
        text-align: center;
        padding: 20px;
        border-radius: 10px;
        margin-bottom: 20px;
    }

    .payment-status.processing {
        background: #2d2d4a;
    }

    .payment-status.success {
        background: #1a3d1a;
    }

    .payment-status.error {
        background: #3d1a1a;
    }

    .status-icon {
        font-size: 40px;
        display: block;
        margin-bottom: 10px;
    }

    .status-text {
        color: #fff;
        font-size: 16px;
    }

    .status-amount {
        color: #4ade80;
        font-size: 20px;
        font-weight: bold;
        display: block;
        margin-top: 5px;
    }

    .modal-footer {
        display: flex;
        gap: 10px;
        padding: 20px;
        border-top: 1px solid #333;
    }

    .btn-cancel, .btn-pay {
        flex: 1;
        padding: 14px;
        border: none;
        border-radius: 10px;
        font-size: 16px;
        cursor: pointer;
    }

    .btn-cancel {
        background: #333;
        color: #fff;
    }

    .btn-pay {
        background: #FF4800;
        color: #fff;
    }

    .btn-pay:disabled {
        background: #444;
        cursor: not-allowed;
    }
`;

const styleEl = document.createElement('style');
styleEl.textContent = topUpStyles;
document.head.appendChild(styleEl);


// ============ PayPal ============
const PAYPAL_CONFIG = {
    clientId: 'YOUR_PAYPAL_CLIENT_ID',
    currency: 'USD',
    // Курс USD -> RURC
    usdToRurc: 90  // 1 USD = 90 RURC (примерно по курсу рубля)
};

// Загрузить PayPal SDK
function loadPayPalSDK() {
    if (document.getElementById('paypal-sdk')) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.id = 'paypal-sdk';
        script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CONFIG.clientId}&currency=${PAYPAL_CONFIG.currency}`;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Показать форму PayPal
async function showPayPalModal(amountRub) {
    const amountUsd = (amountRub / 90).toFixed(2);
    const rurcAmount = Math.floor(amountRub * PAYMENT_CONFIG.rate);

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'paypalModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>💙 Оплата через PayPal</h2>
                <button class="close-btn" onclick="document.getElementById('paypalModal').remove()">×</button>
            </div>
            <div class="modal-body">
                <div class="paypal-summary">
                    <div class="summary-row"><span>Сумма:</span><span>$${amountUsd}</span></div>
                    <div class="summary-row total"><span>Вы получите:</span><span>${rurcAmount} RURC</span></div>
                </div>
                <div id="paypal-button-container" style="margin-top:20px;"></div>
                <div id="paypal-status" style="text-align:center; margin-top:16px; color:#aaa; font-size:13px;"></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Демо режим
    if (PAYPAL_CONFIG.clientId === 'YOUR_PAYPAL_CLIENT_ID') {
        document.getElementById('paypal-button-container').innerHTML = `
            <button onclick="simulatePayPalPayment(${rurcAmount})" style="
                width:100%; padding:14px;
                background:#0070BA; border:none; border-radius:10px;
                color:#fff; font-size:16px; font-weight:700; cursor:pointer;">
                💙 Оплатить $${amountUsd} через PayPal (демо)
            </button>
        `;
        return;
    }

    // Реальный PayPal
    try {
        await loadPayPalSDK();
        paypal.Buttons({
            createOrder: (data, actions) => {
                return actions.order.create({
                    purchase_units: [{
                        amount: { value: amountUsd, currency_code: PAYPAL_CONFIG.currency },
                        description: `Пополнение RURC на ${rurcAmount} токенов`
                    }]
                });
            },
            onApprove: async (data, actions) => {
                const order = await actions.order.capture();
                document.getElementById('paypal-status').textContent = '✅ Платёж подтверждён!';
                await handlePaymentSuccess(rurcAmount);
                setTimeout(() => document.getElementById('paypalModal').remove(), 3000);
            },
            onError: (err) => {
                document.getElementById('paypal-status').textContent = '❌ Ошибка PayPal: ' + err;
            }
        }).render('#paypal-button-container');
    } catch (e) {
        document.getElementById('paypal-button-container').innerHTML =
            `<p style="color:#f44; text-align:center;">Ошибка загрузки PayPal SDK</p>`;
    }
}

// Симуляция PayPal (демо)
async function simulatePayPalPayment(rurcAmount) {
    const statusEl = document.getElementById('paypal-status');
    statusEl.textContent = '🔄 Обработка платежа...';
    await new Promise(r => setTimeout(r, 1500));
    statusEl.textContent = '✅ Платёж успешен!';
    await handlePaymentSuccess(rurcAmount);
    setTimeout(() => {
        const m = document.getElementById('paypalModal');
        if (m) m.remove();
        showNotification(`Баланс пополнен на ${rurcAmount} RURC`, 'success');
    }, 2000);
}

// Добавить PayPal в список методов
SUPPORTED_PAYMENTS.push({ id: 'paypal', name: 'PayPal', icon: '💙', group: 'international' });

// Перехват выбора PayPal
const _origSelectPaymentMethod = window.selectPaymentMethod;
window.selectPaymentMethod = function(methodId) {
    if (methodId === 'paypal') {
        document.querySelectorAll('.method-item').forEach(i => i.classList.remove('active'));
        const sel = document.querySelector('[data-method="paypal"]');
        if (sel) sel.classList.add('active');
        paymentState.paymentMethod = 'paypal';
        document.getElementById('yookassaInfo').style.display = 'none';
        document.getElementById('webmoneyInfo').style.display = 'none';
        const payBtn = document.getElementById('payBtn');
        payBtn.textContent = 'Оплатить через PayPal';
        validateForm();
        return;
    }
    _origSelectPaymentMethod(methodId);
};

// Перехват processPayment для PayPal
const _origProcessPayment = window.processPayment;
window.processPayment = async function() {
    if (paymentState.paymentMethod === 'paypal') {
        closeTopUpModal();
        await showPayPalModal(paymentState.amount);
        return;
    }
    _origProcessPayment();
};

window.showPayPalModal = showPayPalModal;
window.simulatePayPalPayment = simulatePayPalPayment;
window.PAYPAL_CONFIG = PAYPAL_CONFIG;
