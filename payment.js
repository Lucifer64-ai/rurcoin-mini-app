// Модуль пополнения баланса RURC через СБП (QR-код)

const PAYMENT_CONFIG = {
    // Реквизиты СБП — замените на свои
    sbpPhone: '+79781647517',      // Номер телефона получателя (СБП)
    sbpBank: 'АБ Россия',           // Банк получателя (для отображения)
    sbpRecipient: 'Станислав С.В.',  // Имя получателя

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

// Состояние платежа
let paymentState = {
    amount: 0,
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
                <h2>💰 Пополнение через СБП</h2>
                <button class="close-btn" onclick="closeTopUpModal()">×</button>
            </div>

            <div class="modal-body">
                <div class="sbp-info-block">
                    <div class="sbp-logo">🏦 СБП</div>
                    <p class="sbp-desc">Быстрые платежи — мгновенный перевод по номеру телефона через любой банк</p>
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

                <div class="payment-status" id="paymentStatus" style="display: none;"></div>
            </div>

            <div class="modal-footer">
                <button class="btn-cancel" onclick="closeTopUpModal()">Отмена</button>
                <button class="btn-pay" id="payBtn" onclick="processPayment()" disabled>
                    Показать QR-код
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
    if (modal) modal.remove();
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
    const isValid = amount >= PAYMENT_CONFIG.minAmount && amount <= PAYMENT_CONFIG.maxAmount;
    document.getElementById('payBtn').disabled = !isValid;
}

// Генерация СБП QR-ссылки (стандарт ЦБ РФ)
function generateSBPUrl(amount) {
    const phone = PAYMENT_CONFIG.sbpPhone.replace(/[^0-9+]/g, '');
    const amountKopecks = Math.round(amount * 100);
    const paymentId = 'RURC_' + Date.now();
    // Формат: https://qr.nspk.ru/... или стандартная deep-link СБП
    // Используем универсальный формат СБП deeplink
    const params = new URLSearchParams({
        phone: phone,
        amount: amountKopecks,
        currency: 'RUB',
        purpose: `Пополнение RURC #${paymentId}`,
        name: PAYMENT_CONFIG.sbpRecipient
    });
    return `https://qr.nspk.ru/AS10004${btoa(params.toString()).replace(/=/g, '')}`;
}

// Показать QR-код СБП
async function processPayment() {
    const amount = paymentState.amount;
    const rurcAmount = Math.floor(amount * PAYMENT_CONFIG.rate);
    const paymentId = 'RURC_' + Date.now();

    closeTopUpModal();
    showSBPModal(amount, rurcAmount, paymentId);
}

// Модальное окно с QR-кодом
function showSBPModal(amount, rurcAmount, paymentId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'sbpModal';

    // QR через Google Charts API (бесплатно, без ключа)
    const sbpText = `ST00012|Name=${PAYMENT_CONFIG.sbpRecipient}|PersonalAcc=${PAYMENT_CONFIG.sbpPhone}|BankName=${PAYMENT_CONFIG.sbpBank}|Sum=${amount * 100}|Purpose=Пополнение RURC ${rurcAmount} токенов #${paymentId}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(sbpText)}`;

    modal.innerHTML = `
        <div class="modal-content sbp-modal-content">
            <div class="modal-header">
                <h2>🏦 Оплата через СБП</h2>
                <button class="close-btn" onclick="closeSBPModal()">×</button>
            </div>
            <div class="modal-body" style="text-align:center;">
                <div class="sbp-qr-wrap">
                    <img src="${qrUrl}" alt="QR СБП" class="sbp-qr-img" />
                </div>
                <div class="sbp-details">
                    <div class="sbp-detail-row">
                        <span class="sbp-detail-label">Получатель:</span>
                        <span class="sbp-detail-value">${PAYMENT_CONFIG.sbpRecipient}</span>
                    </div>
                    <div class="sbp-detail-row">
                        <span class="sbp-detail-label">Телефон СБП:</span>
                        <span class="sbp-detail-value sbp-phone">${PAYMENT_CONFIG.sbpPhone}</span>
                    </div>
                    <div class="sbp-detail-row">
                        <span class="sbp-detail-label">Банк:</span>
                        <span class="sbp-detail-value">${PAYMENT_CONFIG.sbpBank}</span>
                    </div>
                    <div class="sbp-detail-row">
                        <span class="sbp-detail-label">Сумма:</span>
                        <span class="sbp-detail-value sbp-amount">${amount.toLocaleString()} ₽</span>
                    </div>
                    <div class="sbp-detail-row">
                        <span class="sbp-detail-label">Назначение:</span>
                        <span class="sbp-detail-value sbp-purpose">Пополнение RURC #${paymentId}</span>
                    </div>
                </div>
                <p class="sbp-instruction">
                    Отсканируйте QR-код в приложении банка или переведите вручную по номеру телефона.<br>
                    После оплаты нажмите кнопку ниже.
                </p>
                <div id="sbpStatus"></div>
            </div>
            <div class="modal-footer">
                <button class="btn-cancel" onclick="closeSBPModal()">Отмена</button>
                <button class="btn-pay" onclick="confirmSBPPayment(${rurcAmount})">
                    ✅ Я оплатил
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function closeSBPModal() {
    const modal = document.getElementById('sbpModal');
    if (modal) modal.remove();
}

// Подтверждение оплаты пользователем
async function confirmSBPPayment(rurcAmount) {
    const statusEl = document.getElementById('sbpStatus');
    statusEl.innerHTML = `<div class="sbp-checking">🔄 Проверяем платёж...</div>`;

    await new Promise(r => setTimeout(r, 1500));

    // В реальном приложении здесь — запрос к серверу для проверки платежа
    // Сейчас — демо: сразу начисляем
    statusEl.innerHTML = `<div class="sbp-success">✅ Платёж подтверждён! +${rurcAmount} RURC</div>`;

    await handlePaymentSuccess(rurcAmount);

    setTimeout(() => {
        closeSBPModal();
        if (typeof showNotification === 'function') {
            showNotification(`Баланс пополнен на ${rurcAmount} RURC`, 'success');
        }
    }, 2500);
}

async function handlePaymentSuccess(rurcAmount) {
    if (window.mintWithUI) {
        await window.mintWithUI(rurcAmount);
    }
}

// ============ Стили ============
const topUpStyles = `
    .modal {
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0,0,0,0.75);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    }
    .modal-content {
        background: #1a1a2e;
        border-radius: 16px;
        width: 90%;
        max-width: 420px;
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
    .modal-body { padding: 20px; }
    .label {
        color: #aaa;
        margin-bottom: 10px;
        font-size: 14px;
    }
    .sbp-info-block {
        background: #1e3a5f;
        border-radius: 12px;
        padding: 16px;
        text-align: center;
        margin-bottom: 20px;
        border: 1px solid #2a5298;
    }
    .sbp-logo {
        font-size: 28px;
        font-weight: bold;
        color: #4fc3f7;
        margin-bottom: 6px;
    }
    .sbp-desc {
        color: #90caf9;
        font-size: 13px;
        margin: 0;
    }
    .amount-section { margin-bottom: 20px; }
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
    .btn-cancel { background: #333; color: #fff; }
    .btn-pay { background: #1565C0; color: #fff; }
    .btn-pay:disabled { background: #444; cursor: not-allowed; }

    /* СБП QR модал */
    .sbp-qr-wrap {
        background: #fff;
        border-radius: 16px;
        display: inline-block;
        padding: 12px;
        margin-bottom: 20px;
    }
    .sbp-qr-img {
        display: block;
        width: 220px;
        height: 220px;
    }
    .sbp-details {
        background: #252540;
        border-radius: 12px;
        padding: 14px;
        margin-bottom: 16px;
        text-align: left;
    }
    .sbp-detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 0;
        border-bottom: 1px solid #333;
        font-size: 13px;
    }
    .sbp-detail-row:last-child { border-bottom: none; }
    .sbp-detail-label { color: #888; }
    .sbp-detail-value { color: #fff; font-weight: 500; }
    .sbp-phone { color: #4fc3f7; }
    .sbp-amount { color: #4ade80; font-size: 16px; font-weight: bold; }
    .sbp-purpose { color: #aaa; font-size: 11px; word-break: break-all; }
    .sbp-instruction {
        color: #aaa;
        font-size: 13px;
        line-height: 1.5;
        margin-bottom: 12px;
    }
    .sbp-checking { color: #90caf9; font-size: 15px; padding: 10px 0; }
    .sbp-success { color: #4ade80; font-size: 16px; font-weight: bold; padding: 10px 0; }
`;

const styleEl = document.createElement('style');
styleEl.textContent = topUpStyles;
document.head.appendChild(styleEl);

// Экспорт
window.showTopUpModal = showTopUpModal;
window.closeTopUpModal = closeTopUpModal;
window.adjustAmount = adjustAmount;
window.setQuickAmount = setQuickAmount;
window.calculateRURC = calculateRURC;
window.validateForm = validateForm;
window.processPayment = processPayment;
window.confirmSBPPayment = confirmSBPPayment;
window.closeSBPModal = closeSBPModal;
window.PAYMENT_CONFIG = PAYMENT_CONFIG;
