// Модуль пополнения баланса RURC через российские карты
// Поддерживаемые банки: Сбербанк, Тинькофф, Альфа-Банк, Газпромбанк, ВТБ, Россельхозбанк

const PAYMENT_CONFIG = {
    // Минимальная и максимальная сумма пополнения (в рублях)
    minAmount: 100,
    maxAmount: 50000,
    // Комиссия (%)
    commission: 0,
    // Валюта
    currency: 'RUB',
    // Курс RURC к рублю (для примера)
    rate: 1 // 1 RURC = 1 RUB (можно изменить)
};

// Поддерживаемые банки
const SUPPORTED_BANKS = [
    { id: 'sber', name: 'Сбербанк', icon: '🏦', color: '#004930' },
    { id: 'tinkoff', name: 'Тинькофф', icon: '🏦', color: '#FFDD2D' },
    { id: 'alfa', name: 'Альфа-Банк', icon: '🏦', color: '#EF3124' },
    { id: 'gazprom', name: 'Газпромбанк', icon: '🏦', color: '#0C4A8D' },
    { id: 'vtb', name: 'ВТБ', icon: '🏦', color: '#0099CC' },
    { id: 'rosselhoz', name: 'Россельхозбанк', icon: '🏦', color: '#009639' },
    { id: 'qiwi', name: 'QIWI', icon: '💳', color: '#FF4800' },
    { id: 'yoo', name: 'ЮMoney', icon: '💳', color: '#7B2D8E' },
    { id: 'card', name: 'Любая карта', icon: '💳', color: '#333333' }
];

// Состояние платежа
let paymentState = {
    amount: 0,
    cardNumber: '',
    bank: null,
    status: 'idle' // idle, processing, success, error
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
                <div class="bank-selection">
                    <p class="label">Выберите банк или способ оплаты:</p>
                    <div class="banks-grid">
                        ${SUPPORTED_BANKS.map(bank => `
                            <div class="bank-item" data-bank="${bank.id}" onclick="selectBank('${bank.id}')">
                                <span class="bank-icon">${bank.icon}</span>
                                <span class="bank-name">${bank.name}</span>
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

                <div class="card-section" id="cardSection" style="display: none;">
                    <p class="label">Данные карты:</p>
                    <input type="text" id="cardNumber" 
                        placeholder="Номер карты (1234 5678 9012 3456)"
                        maxlength="19"
                        oninput="formatCardNumber(this)">
                    <div class="card-row">
                        <input type="text" id="cardExpiry" 
                            placeholder="ММ/ГГ"
                            maxlength="5"
                            oninput="formatExpiry(this)">
                        <input type="text" id="cardCVC" 
                            placeholder="CVC"
                            maxlength="3">
                    </div>
                    <input type="text" id="cardName" 
                        placeholder="Имя владельца (как на карте)">
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
                        <span class="status-text">Обработка платежа...</span>
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

    // Добавляем обработчики
    document.getElementById('topUpAmount').addEventListener('input', calculateRURC);
    document.getElementById('cardNumber').addEventListener('input', validateForm);
    document.getElementById('cardExpiry').addEventListener('input', validateForm);
    document.getElementById('cardCVC').addEventListener('input', validateForm);
}

// Закрыть модальное окно
function closeTopUpModal() {
    const modal = document.getElementById('topUpModal');
    if (modal) {
        modal.remove();
    }
}

// Выбрать банк
function selectBank(bankId) {
    // Убираем активный класс у всех
    document.querySelectorAll('.bank-item').forEach(item => {
        item.classList.remove('active');
    });

    // Добавляем активный класс выбранному
    const selected = document.querySelector(`[data-bank="${bankId}"]`);
    if (selected) {
        selected.classList.add('active');
    }

    paymentState.bank = bankId;

    // Показываем секцию с картой
    document.getElementById('cardSection').style.display = 'block';

    validateForm();
}

// Форматировать номер карты
function formatCardNumber(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/(\d{4})/g, '$1 ').trim();
    input.value = value.substring(0, 19);
    paymentState.cardNumber = input.value;
}

// Форматировать срок действия
function formatExpiry(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2);
    }
    input.value = value.substring(0, 5);
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
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const expiry = document.getElementById('cardExpiry').value;
    const cvc = document.getElementById('cardCVC').value;

    const isValidAmount = amount >= PAYMENT_CONFIG.minAmount && amount <= PAYMENT_CONFIG.maxAmount;
    const isValidCard = cardNumber.length >= 15 && expiry.length === 5 && cvc.length >= 2;
    const hasBank = paymentState.bank !== null;

    const payBtn = document.getElementById('payBtn');
    payBtn.disabled = !(isValidAmount && isValidCard && hasBank);
}

// Обработать платеж
async function processPayment() {
    const amount = parseInt(document.getElementById('topUpAmount').value);
    const cardNumber = document.getElementById('cardNumber').value;

    // Показать статус
    const statusEl = document.getElementById('paymentStatus');
    statusEl.style.display = 'block';
    statusEl.className = 'payment-status processing';

    const payBtn = document.getElementById('payBtn');
    payBtn.disabled = true;

    // Симуляция платежа (в реальном проекте здесь будет API платёжного шлюза)
    try {
        // Имитация задержки
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Успешный платёж (для демо - всегда успех)
        // В реальности здесь будет запрос к платёжному шлюзу

        const rurcAmount = Math.floor(amount * PAYMENT_CONFIG.rate);

        // Показать успех
        statusEl.className = 'payment-status success';
        statusEl.innerHTML = `
            <div class="status-content">
                <span class="status-icon">✅</span>
                <span class="status-text">Платёж успешен!</span>
                <span class="status-amount">+${rurcAmount} RURC</span>
            </div>
        `;

        // Начислить токены (через mint)
        if (window.mintWithUI) {
            await window.mintWithUI(rurcAmount);
        }

        // Закрыть через 3 секунды
        setTimeout(() => {
            closeTopUpModal();
            showNotification(`Баланс пополнен на ${rurcAmount} RURC`, 'success');
        }, 3000);

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

// Открыть пополнение (экспорт)
window.showTopUpModal = showTopUpModal;
window.closeTopUpModal = closeTopUpModal;
window.selectBank = selectBank;
window.formatCardNumber = formatCardNumber;
window.formatExpiry = formatExpiry;
window.adjustAmount = adjustAmount;
window.setQuickAmount = setQuickAmount;
window.calculateRURC = calculateRURC;
window.validateForm = validateForm;
window.processPayment = processPayment;

// Добавить стили для модального окна
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

    .banks-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin-bottom: 20px;
    }

    .bank-item {
        background: #252540;
        border: 2px solid transparent;
        border-radius: 10px;
        padding: 12px 8px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
    }

    .bank-item:hover {
        background: #2d2d4a;
    }

    .bank-item.active {
        border-color: #6c5ce7;
        background: #2d2d4a;
    }

    .bank-icon {
        font-size: 24px;
        display: block;
        margin-bottom: 4px;
    }

    .bank-name {
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

    .card-section {
        margin-bottom: 20px;
    }

    .card-section input {
        width: 100%;
        padding: 12px;
        border: 1px solid #333;
        border-radius: 8px;
        background: #252540;
        color: #fff;
        font-size: 14px;
        margin-bottom: 10px;
        box-sizing: border-box;
    }

    .card-row {
        display: flex;
        gap: 10px;
    }

    .card-row input {
        flex: 1;
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
        background: #6c5ce7;
        color: #fff;
    }

    .btn-pay:disabled {
        background: #444;
        cursor: not-allowed;
    }
`;

// Добавить стили
const styleEl = document.createElement('style');
styleEl.textContent = topUpStyles;
document.head.appendChild(styleEl);

// Экспорт
window.PAYMENT_CONFIG = PAYMENT_CONFIG;
window.SUPPORTED_BANKS = SUPPORTED_BANKS;
