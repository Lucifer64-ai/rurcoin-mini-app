// Модуль пополнения баланса RURC через СБП
// Работает через все банки РФ с поддержкой СБП

const PAYMENT_CONFIG = {
    sbpPhone: '+79781647517',
    sbpBank: 'АБ Россия',
    sbpRecipient: 'Станислав С.В.',
    minAmount: 100,
    maxAmount: 50000,
    commission: 0,
    currency: 'RUB',
    rate: 1
};

// Список банков с поддержкой СБП и их deeplink-схемами
const SBP_BANKS = [
    { id: 'sber',       name: 'Сбербанк',        icon: '🟢', scheme: 'sberbankonline' },
    { id: 'tinkoff',    name: 'Т-Банк',           icon: '🟡', scheme: 'tinkoff' },
    { id: 'alfa',       name: 'Альфа-Банк',       icon: '🔴', scheme: 'alfabank' },
    { id: 'vtb',        name: 'ВТБ',              icon: '🔵', scheme: 'vtb' },
    { id: 'raiffeisen', name: 'Райффайзен',       icon: '🟡', scheme: 'raiffeisen' },
    { id: 'gazprom',    name: 'Газпромбанк',      icon: '🔵', scheme: 'gazprombank' },
    { id: 'otkritie',   name: 'Открытие',         icon: '🟠', scheme: 'otkritiebank' },
    { id: 'rosselhoz',  name: 'Россельхозбанк',   icon: '🟢', scheme: 'rshb' },
    { id: 'psb',        name: 'ПСБ',              icon: '🔵', scheme: 'psbank' },
    { id: 'sovkom',     name: 'Совкомбанк',       icon: '🟣', scheme: 'sovcombank' },
    { id: 'mts',        name: 'МТС Банк',         icon: '🔴', scheme: 'mtsbank' },
    { id: 'pochtabank', name: 'Почта Банк',       icon: '🔵', scheme: 'pochtabank' },
    { id: 'other',      name: 'Другой банк',      icon: '🏦', scheme: null }
];

let paymentState = {
    amount: 0,
    status: 'idle',
    paymentId: null
};

// ── Главная форма ──────────────────────────────────────────────
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
                    <p class="sbp-desc">Мгновенный перевод через любой банк России</p>
                </div>

                <div class="amount-section">
                    <p class="label">Сумма пополнения (₽):</p>
                    <div class="amount-input-group">
                        <button class="amount-btn" onclick="adjustAmount(-100)">−100</button>
                        <input type="number" id="topUpAmount"
                            placeholder="Введите сумму"
                            min="${PAYMENT_CONFIG.minAmount}"
                            max="${PAYMENT_CONFIG.maxAmount}"
                            oninput="calculateRURC()">
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
            </div>
            <div class="modal-footer">
                <button class="btn-cancel" onclick="closeTopUpModal()">Отмена</button>
                <button class="btn-pay" id="payBtn" onclick="processPayment()" disabled>
                    Выбрать банк →
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.getElementById('topUpAmount').addEventListener('input', calculateRURC);
}

function closeTopUpModal() {
    const m = document.getElementById('topUpModal');
    if (m) m.remove();
}

function adjustAmount(delta) {
    const input = document.getElementById('topUpAmount');
    let val = (parseInt(input.value) || 0) + delta;
    if (val < PAYMENT_CONFIG.minAmount) val = PAYMENT_CONFIG.minAmount;
    if (val > PAYMENT_CONFIG.maxAmount) val = PAYMENT_CONFIG.maxAmount;
    input.value = val;
    calculateRURC();
}

function setQuickAmount(amount) {
    document.getElementById('topUpAmount').value = amount;
    calculateRURC();
}

function calculateRURC() {
    const amount = parseInt(document.getElementById('topUpAmount').value) || 0;
    const rurc = Math.floor(amount * PAYMENT_CONFIG.rate);
    document.getElementById('summaryAmount').textContent = amount.toLocaleString() + ' ₽';
    document.getElementById('summaryRURC').textContent = rurc.toLocaleString() + ' RURC';
    paymentState.amount = amount;
    validateForm();
}

function validateForm() {
    const amount = parseInt(document.getElementById('topUpAmount').value) || 0;
    const ok = amount >= PAYMENT_CONFIG.minAmount && amount <= PAYMENT_CONFIG.maxAmount;
    document.getElementById('payBtn').disabled = !ok;
}

// ── Выбор банка ────────────────────────────────────────────────
function processPayment() {
    const amount = paymentState.amount;
    const rurcAmount = Math.floor(amount * PAYMENT_CONFIG.rate);
    const paymentId = 'RURC_' + Date.now();
    closeTopUpModal();
    showBankSelectModal(amount, rurcAmount, paymentId);
}

function showBankSelectModal(amount, rurcAmount, paymentId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'bankSelectModal';

    const bankButtons = SBP_BANKS.map(bank => `
        <button class="bank-btn" onclick="openBankPayment('${bank.id}', ${amount}, ${rurcAmount}, '${paymentId}')">
            <span class="bank-icon">${bank.icon}</span>
            <span class="bank-name">${bank.name}</span>
        </button>
    `).join('');

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>🏦 Выберите банк</h2>
                <button class="close-btn" onclick="closeBankSelectModal()">×</button>
            </div>
            <div class="modal-body">
                <p class="label" style="margin-bottom:14px;">
                    Перевод на <strong style="color:#4fc3f7">${PAYMENT_CONFIG.sbpPhone}</strong>
                    — <strong style="color:#fff">${PAYMENT_CONFIG.sbpRecipient}</strong>
                    на сумму <strong style="color:#4ade80">${amount.toLocaleString()} ₽</strong>
                </p>
                <div class="banks-grid">
                    ${bankButtons}
                </div>
                <p class="sbp-hint">Нет вашего банка? Выберите «Другой банк» — откроется QR-код</p>
            </div>
            <div class="modal-footer">
                <button class="btn-cancel" onclick="closeBankSelectModal()">← Назад</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function closeBankSelectModal() {
    const m = document.getElementById('bankSelectModal');
    if (m) m.remove();
}

// ── Открыть банк или QR ────────────────────────────────────────
function openBankPayment(bankId, amount, rurcAmount, paymentId) {
    const bank = SBP_BANKS.find(b => b.id === bankId);
    closeBankSelectModal();

    const phone = PAYMENT_CONFIG.sbpPhone.replace(/[^0-9]/g, '');
    const purpose = encodeURIComponent('Пополнение RURC #' + paymentId);

    // Deeplink для конкретного банка
    if (bank && bank.scheme) {
        let deeplink = null;

        switch (bankId) {
            case 'sber':
                deeplink = `sberbankonline://transfer/phone?phone=${phone}&amount=${amount}&comment=${purpose}`;
                break;
            case 'tinkoff':
                deeplink = `tinkoff://transfer?phone=${phone}&amount=${amount}&comment=${purpose}`;
                break;
            case 'alfa':
                deeplink = `alfabank://payment?phone=${phone}&amount=${amount}&comment=${purpose}`;
                break;
            case 'vtb':
                deeplink = `vtb://sbp?phone=${phone}&amount=${amount}`;
                break;
            case 'raiffeisen':
                deeplink = `raiffeisen://sbp?phone=${phone}&amount=${amount}`;
                break;
            case 'gazprom':
                deeplink = `gazprombank://sbp?phone=${phone}&amount=${amount}`;
                break;
            default:
                deeplink = null;
        }

        if (deeplink) {
            // Пробуем открыть приложение банка, если не открылось — показываем QR
            const start = Date.now();
            window.location.href = deeplink;
            setTimeout(() => {
                if (Date.now() - start < 2000) {
                    // Приложение не открылось — показываем QR
                    showSBPQRModal(amount, rurcAmount, paymentId);
                }
            }, 1500);
            // Показываем подтверждение
            showConfirmModal(rurcAmount, paymentId);
            return;
        }
    }

    // Для "Другой банк" или без deeplink — сразу QR
    showSBPQRModal(amount, rurcAmount, paymentId);
}

// ── QR-код модал ───────────────────────────────────────────────
function showSBPQRModal(amount, rurcAmount, paymentId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'sbpQRModal';

    // Стандарт ЦБ РФ ST00012 — читается всеми банками с СБП
    const sbpText = [
        'ST00012',
        'Name=' + PAYMENT_CONFIG.sbpRecipient,
        'PersonalAcc=' + PAYMENT_CONFIG.sbpPhone,
        'BankName=' + PAYMENT_CONFIG.sbpBank,
        'Sum=' + (amount * 100),
        'Purpose=Пополнение RURC ' + rurcAmount + ' токенов #' + paymentId
    ].join('|');

    const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=' + encodeURIComponent(sbpText);

    modal.innerHTML = `
        <div class="modal-content sbp-modal-content">
            <div class="modal-header">
                <h2>📱 QR-код СБП</h2>
                <button class="close-btn" onclick="closeSBPQRModal()">×</button>
            </div>
            <div class="modal-body" style="text-align:center;">
                <p class="sbp-scan-hint">Отсканируйте в приложении любого банка</p>
                <div class="sbp-qr-wrap">
                    <img src="${qrUrl}" alt="QR СБП" class="sbp-qr-img" />
                </div>
                <div class="sbp-details">
                    <div class="sbp-detail-row">
                        <span class="sbp-detail-label">Получатель</span>
                        <span class="sbp-detail-value">${PAYMENT_CONFIG.sbpRecipient}</span>
                    </div>
                    <div class="sbp-detail-row">
                        <span class="sbp-detail-label">Телефон СБП</span>
                        <span class="sbp-detail-value sbp-phone">${PAYMENT_CONFIG.sbpPhone}</span>
                    </div>
                    <div class="sbp-detail-row">
                        <span class="sbp-detail-label">Банк</span>
                        <span class="sbp-detail-value">${PAYMENT_CONFIG.sbpBank}</span>
                    </div>
                    <div class="sbp-detail-row">
                        <span class="sbp-detail-label">Сумма</span>
                        <span class="sbp-detail-value sbp-amount">${amount.toLocaleString()} ₽</span>
                    </div>
                    <div class="sbp-detail-row">
                        <span class="sbp-detail-label">Назначение</span>
                        <span class="sbp-detail-value sbp-purpose">Пополнение RURC #${paymentId}</span>
                    </div>
                </div>
                <div id="qrStatus"></div>
            </div>
            <div class="modal-footer">
                <button class="btn-cancel" onclick="closeSBPQRModal()">Отмена</button>
                <button class="btn-pay" onclick="confirmSBPPayment(${rurcAmount}, 'qrStatus')">✅ Я оплатил</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function closeSBPQRModal() {
    const m = document.getElementById('sbpQRModal');
    if (m) m.remove();
}

// ── Подтверждение после deeplink ───────────────────────────────
function showConfirmModal(rurcAmount, paymentId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'confirmModal';

    modal.innerHTML = `
        <div class="modal-content" style="max-width:340px;">
            <div class="modal-header">
                <h2>✅ Подтверждение</h2>
                <button class="close-btn" onclick="closeConfirmModal()">×</button>
            </div>
            <div class="modal-body" style="text-align:center;">
                <p style="color:#aaa; font-size:14px; margin-bottom:20px;">
                    Приложение банка открыто.<br>
                    После перевода нажмите кнопку ниже.
                </p>
                <div id="confirmStatus"></div>
            </div>
            <div class="modal-footer">
                <button class="btn-cancel" onclick="closeConfirmModal()">Отмена</button>
                <button class="btn-pay" onclick="confirmSBPPayment(${rurcAmount}, 'confirmStatus')">✅ Я оплатил</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function closeConfirmModal() {
    const m = document.getElementById('confirmModal');
    if (m) m.remove();
}

// ── Подтверждение оплаты ───────────────────────────────────────
// Защита от двойного начисления
const _sbpPendingPayments = new Set();

async function confirmSBPPayment(rurcAmount, statusElId) {
    const statusEl = document.getElementById(statusElId);

    // Защита от двойного нажатия
    const payKey = 'sbp_' + rurcAmount + '_' + Math.floor(Date.now() / 10000);
    if (_sbpPendingPayments.has(payKey)) {
        if (statusEl) statusEl.innerHTML = '<div class="sbp-checking">⏳ Платёж уже обрабатывается...</div>';
        return;
    }
    _sbpPendingPayments.add(payKey);

    // Блокируем кнопки
    document.querySelectorAll('.btn-pay').forEach(b => { b.disabled = true; });

    if (statusEl) statusEl.innerHTML = '<div class="sbp-checking">🔄 Проверяем платёж...</div>';

    // Показываем поле ввода кода подтверждения
    if (statusEl) {
        statusEl.innerHTML = `
            <div style="margin-top:12px;">
                <div class="sbp-checking">📋 Введите последние 4 цифры суммы перевода для подтверждения</div>
                <div style="display:flex;gap:8px;margin-top:10px;">
                    <input type="number" id="sbpConfirmCode" placeholder="Сумма в рублях"
                        style="flex:1;padding:10px;background:#0d0d1a;border:1px solid #333;border-radius:8px;color:#fff;font-size:14px;"
                        min="1" max="999999">
                    <button onclick="verifySBPAmount(${rurcAmount}, '${statusElId}', '${payKey}')"
                        style="padding:10px 16px;background:#1565C0;border:none;border-radius:8px;color:#fff;font-size:14px;cursor:pointer;">
                        ✅ Подтвердить
                    </button>
                </div>
                <div style="font-size:11px;color:#555;margin-top:6px;">
                    Введите сумму, которую вы перевели (в рублях)
                </div>
            </div>`;
    }
}

async function verifySBPAmount(rurcAmount, statusElId, payKey) {
    const statusEl = document.getElementById(statusElId);
    const input = document.getElementById('sbpConfirmCode');
    const enteredAmount = parseFloat(input?.value);
    const expectedAmount = rurcAmount; // 1 RURC = 1 ₽

    if (!enteredAmount || enteredAmount <= 0) {
        if (statusEl) statusEl.innerHTML += '<div style="color:#f44;font-size:12px;margin-top:6px;">⚠️ Введите сумму перевода</div>';
        return;
    }

    // Проверяем: введённая сумма должна совпадать с ожидаемой (±1 рубль допуск)
    if (Math.abs(enteredAmount - expectedAmount) > 1) {
        if (statusEl) statusEl.innerHTML = `
            <div style="color:#f44;font-size:13px;padding:10px 0;">
                ❌ Сумма не совпадает. Ожидалось: ${expectedAmount} ₽, введено: ${enteredAmount} ₽
            </div>
            <div style="font-size:11px;color:#555;margin-top:4px;">
                Если вы перевели другую сумму — начислим соответствующее количество RURC
            </div>
            <div style="display:flex;gap:8px;margin-top:10px;">
                <button onclick="applyActualAmount(${enteredAmount}, '${statusElId}', '${payKey}')"
                    style="flex:1;padding:10px;background:#FF8C00;border:none;border-radius:8px;color:#fff;font-size:13px;cursor:pointer;">
                    Начислить ${Math.floor(enteredAmount)} RURC
                </button>
            </div>`;
        return;
    }

    // Сумма совпала — начисляем
    await handlePaymentSuccess(rurcAmount, statusEl, payKey);
}

async function applyActualAmount(actualRubles, statusElId, payKey) {
    const statusEl = document.getElementById(statusElId);
    const rurcToAdd = Math.floor(actualRubles); // 1 ₽ = 1 RURC
    await handlePaymentSuccess(rurcToAdd, statusEl, payKey);
}

async function handlePaymentSuccess(rurcAmount, statusEl, payKey) {
    if (!window.mintWithUI) {
        console.error('mintWithUI не найдена!');
        if (statusEl) statusEl.innerHTML = '<div style="color:#f44;">❌ Ошибка начисления. Обновите страницу.</div>';
        return;
    }

    try {
        window.mintWithUI(rurcAmount);

        if (statusEl) statusEl.innerHTML = '<div class="sbp-success">✅ Платёж подтверждён! +' + rurcAmount + ' RURC начислено</div>';

        setTimeout(() => {
            closeSBPQRModal();
            closeConfirmModal();
            if (typeof showNotification === 'function') {
                showNotification('✅ Баланс пополнен на ' + rurcAmount + ' RURC', 'success');
            }
            // Разблокируем кнопки
            document.querySelectorAll('.btn-pay').forEach(b => { b.disabled = false; });
            if (payKey) _sbpPendingPayments.delete(payKey);
        }, 2000);

    } catch(e) {
        console.error('Ошибка начисления:', e);
        if (statusEl) statusEl.innerHTML = '<div style="color:#f44;">❌ Ошибка: ' + e.message + '</div>';
        document.querySelectorAll('.btn-pay').forEach(b => { b.disabled = false; });
        if (payKey) _sbpPendingPayments.delete(payKey);
    }
}

// ── Стили ──────────────────────────────────────────────────────
const topUpStyles = `
    .modal {
        position: fixed; top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0,0,0,0.78);
        display: flex; align-items: center; justify-content: center;
        z-index: 10000;
    }
    .modal-content {
        background: #1a1a2e; border-radius: 16px;
        width: 92%; max-width: 440px; max-height: 90vh; overflow-y: auto;
    }
    .modal-header {
        display: flex; justify-content: space-between; align-items: center;
        padding: 18px 20px; border-bottom: 1px solid #2a2a45;
    }
    .modal-header h2 { margin: 0; color: #fff; font-size: 19px; }
    .close-btn { background: none; border: none; color: #666; font-size: 26px; cursor: pointer; }
    .modal-body { padding: 18px 20px; }
    .modal-footer {
        display: flex; gap: 10px; padding: 16px 20px;
        border-top: 1px solid #2a2a45;
    }
    .btn-cancel, .btn-pay {
        flex: 1; padding: 13px; border: none; border-radius: 10px;
        font-size: 15px; cursor: pointer; font-weight: 600;
    }
    .btn-cancel { background: #2a2a45; color: #aaa; }
    .btn-pay { background: #1565C0; color: #fff; }
    .btn-pay:disabled { background: #333; color: #666; cursor: not-allowed; }

    .label { color: #888; font-size: 13px; margin-bottom: 10px; }

    .sbp-info-block {
        background: #0d2137; border: 1px solid #1565C0;
        border-radius: 12px; padding: 14px; text-align: center; margin-bottom: 18px;
    }
    .sbp-logo { font-size: 22px; font-weight: 700; color: #4fc3f7; margin-bottom: 4px; }
    .sbp-desc { color: #7bafd4; font-size: 12px; margin: 0; }

    .amount-section { margin-bottom: 18px; }
    .amount-input-group { display: flex; gap: 8px; margin-bottom: 10px; }
    .amount-input-group input {
        flex: 1; padding: 11px; border: 1px solid #2a2a45;
        border-radius: 8px; background: #252540; color: #fff;
        font-size: 16px; text-align: center;
    }
    .amount-btn {
        padding: 11px 14px; background: #252540; border: 1px solid #2a2a45;
        border-radius: 8px; color: #fff; cursor: pointer; font-size: 15px;
    }
    .quick-amounts { display: flex; gap: 7px; flex-wrap: wrap; }
    .quick-amounts button {
        padding: 7px 14px; background: #252540; border: 1px solid #2a2a45;
        border-radius: 20px; color: #aaa; cursor: pointer; font-size: 12px;
    }
    .quick-amounts button:hover { background: #2d2d50; color: #fff; }

    .summary-section {
        background: #252540; border-radius: 10px; padding: 14px; margin-bottom: 4px;
    }
    .summary-row {
        display: flex; justify-content: space-between;
        color: #888; margin-bottom: 7px; font-size: 14px;
    }
    .summary-row.total {
        color: #fff; font-weight: 700; font-size: 17px;
        border-top: 1px solid #333; padding-top: 10px; margin-top: 6px; margin-bottom: 0;
    }

    /* Выбор банка */
    .banks-grid {
        display: grid; grid-template-columns: repeat(3, 1fr);
        gap: 9px; margin-bottom: 12px;
    }
    .bank-btn {
        background: #252540; border: 1px solid #2a2a45;
        border-radius: 10px; padding: 12px 6px;
        display: flex; flex-direction: column; align-items: center; gap: 5px;
        cursor: pointer; transition: all 0.15s;
    }
    .bank-btn:hover { background: #2d2d55; border-color: #1565C0; }
    .bank-icon { font-size: 22px; }
    .bank-name { color: #ddd; font-size: 11px; text-align: center; line-height: 1.3; }
    .sbp-hint { color: #555; font-size: 12px; text-align: center; margin: 0; }

    /* QR модал */
    .sbp-scan-hint { color: #888; font-size: 13px; margin-bottom: 14px; }
    .sbp-qr-wrap {
        background: #fff; border-radius: 14px;
        display: inline-block; padding: 10px; margin-bottom: 18px;
    }
    .sbp-qr-img { display: block; width: 240px; height: 240px; }
    .sbp-details {
        background: #252540; border-radius: 10px;
        padding: 12px 14px; margin-bottom: 14px; text-align: left;
    }
    .sbp-detail-row {
        display: flex; justify-content: space-between; align-items: center;
        padding: 6px 0; border-bottom: 1px solid #2a2a45; font-size: 13px;
    }
    .sbp-detail-row:last-child { border-bottom: none; }
    .sbp-detail-label { color: #666; }
    .sbp-detail-value { color: #ddd; font-weight: 500; }
    .sbp-phone { color: #4fc3f7 !important; }
    .sbp-amount { color: #4ade80 !important; font-size: 15px; font-weight: 700 !important; }
    .sbp-purpose { color: #555 !important; font-size: 11px; word-break: break-all; }
    .sbp-checking { color: #90caf9; font-size: 14px; padding: 10px 0; }
    .sbp-success { color: #4ade80; font-size: 15px; font-weight: 700; padding: 10px 0; }
`;

const styleEl = document.createElement('style');
styleEl.textContent = topUpStyles;
document.head.appendChild(styleEl);

// ── Экспорт ────────────────────────────────────────────────────
window.showTopUpModal = showTopUpModal;
window.closeTopUpModal = closeTopUpModal;
window.adjustAmount = adjustAmount;
window.setQuickAmount = setQuickAmount;
window.calculateRURC = calculateRURC;
window.validateForm = validateForm;
window.processPayment = processPayment;
window.openBankPayment = openBankPayment;
window.closeBankSelectModal = closeBankSelectModal;
window.showSBPQRModal = showSBPQRModal;
window.closeSBPQRModal = closeSBPQRModal;
window.confirmSBPPayment = confirmSBPPayment;
window.verifySBPAmount = verifySBPAmount;
window.applyActualAmount = applyActualAmount;
window.handlePaymentSuccess = handlePaymentSuccess;
window.closeConfirmModal = closeConfirmModal;
window.PAYMENT_CONFIG = PAYMENT_CONFIG;
window.SBP_BANKS = SBP_BANKS;
