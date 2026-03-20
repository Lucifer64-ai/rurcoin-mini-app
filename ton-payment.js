// ============================================================
//  TON Dev Wallet — отправка TON на кошелёк команды разработчиков
//  Используется при покупке оборудования (насос, вышка, цистерна)
//  TON отправляется РЕАЛЬНО через TON Connect / TonWeb
// ============================================================

// ⚠️ ЗАМЕНИТЕ НА СВОЙ КОШЕЛЁК ДЛЯ ЗАРПЛАТ КОМАНДЫ
const DEV_WALLET_ADDRESS = 'UQBMECsWYTb9gHH5bT-fweEZQXptdgmKpOy0mIswhbu0RqEb';

// Комментарий к транзакции (виден в блокчейне)
const DEV_WALLET_COMMENT = 'RURCoin Equipment Purchase — Dev Fund';

// ============================================================
//  Основная функция отправки TON
//  costTON    — сколько TON отправить
//  label      — название оборудования (для лога)
//  onSuccess  — callback после подтверждения транзакции
// ============================================================
async function sendTonToDevWallet(costTON, label, onSuccess) {
    // Показываем статус
    showTonPaymentStatus(`⏳ Отправка ${costTON} TON на кошелёк команды...`, '#f59e0b');

    try {
        // Сумма в нанотонах (1 TON = 1e9 нанотон)
        const amountNano = String(Math.round(costTON * 1e9));

        // ── Способ 1: TON Connect (если подключён кошелёк) ──────────────
        if (window.tonConnectUI && window.tonConnectUI.connected) {
            const tx = {
                validUntil: Math.floor(Date.now() / 1000) + 300, // 5 минут
                messages: [{
                    address: DEV_WALLET_ADDRESS,
                    amount:  amountNano,
                    payload: encodeTonComment(DEV_WALLET_COMMENT + ' | ' + label)
                }]
            };

            const result = await window.tonConnectUI.sendTransaction(tx);
            console.log('[DevWallet] TON Connect tx:', result);

            showTonPaymentStatus(`✅ ${costTON} TON отправлено команде разработчиков`, '#4ade80');
            logDevPayment(costTON, label, 'tonconnect', result?.boc || '');

            if (onSuccess) onSuccess();
            return;
        }

        // ── Способ 2: TonWeb (если есть подключённый провайдер) ─────────
        if (window.tonweb && window.tonweb.provider) {
            const wallet = await window.tonweb.wallet.create({ publicKey: null });
            await wallet.methods.transfer({
                secretKey:   null,
                toAddress:   DEV_WALLET_ADDRESS,
                amount:      TonWeb.utils.toNano(String(costTON)),
                seqno:       await wallet.methods.seqno().call(),
                payload:     DEV_WALLET_COMMENT + ' | ' + label,
                sendMode:    3
            }).send();

            showTonPaymentStatus(`✅ ${costTON} TON отправлено команде разработчиков`, '#4ade80');
            logDevPayment(costTON, label, 'tonweb', '');

            if (onSuccess) onSuccess();
            return;
        }

        // ── Способ 3: Открываем ton:// deeplink (fallback) ──────────────
        const tonLink = `ton://transfer/${DEV_WALLET_ADDRESS}?amount=${amountNano}&text=${encodeURIComponent(DEV_WALLET_COMMENT + ' | ' + label)}`;
        window.open(tonLink, '_blank');

        showTonPaymentStatus(
            `📲 Подтвердите оплату ${costTON} TON в кошельке`,
            '#60a5fa'
        );

        // Ждём 8 секунд (пользователь подтверждает в кошельке) → зачисляем
        setTimeout(() => {
            logDevPayment(costTON, label, 'deeplink', '');
            if (onSuccess) onSuccess();
        }, 8000);

    } catch (err) {
        console.error('[DevWallet] Ошибка транзакции:', err);
        showTonPaymentStatus(`❌ Ошибка оплаты: ${err.message || 'неизвестная ошибка'}`, '#f87171');

        // Если пользователь отменил — не зачисляем оборудование
        if (err.message && err.message.includes('cancel')) return;

        // При других ошибках — зачисляем через 3 сек (не блокируем игру)
        setTimeout(() => { if (onSuccess) onSuccess(); }, 3000);
    }
}

// ============================================================
//  Кодирование комментария в payload TON (base64 cell)
// ============================================================
function encodeTonComment(text) {
    try {
        // Простой текстовый payload: 0x00000000 + UTF-8 текст
        const bytes = new TextEncoder().encode(text);
        const payload = new Uint8Array(4 + bytes.length);
        payload.set(bytes, 4); // первые 4 байта = 0 (op code для комментария)
        return btoa(String.fromCharCode(...payload));
    } catch(e) {
        return '';
    }
}

// ============================================================
//  Лог платежей (localStorage)
// ============================================================
const DEV_PAYMENTS_KEY = 'rurcoin_dev_payments';

function logDevPayment(costTON, label, method, txHash) {
    try {
        const log = JSON.parse(localStorage.getItem(DEV_PAYMENTS_KEY) || '[]');
        log.unshift({
            ts:     Date.now(),
            amount: costTON,
            label,
            method,
            txHash: txHash ? txHash.slice(0, 16) : ''
        });
        localStorage.setItem(DEV_PAYMENTS_KEY, JSON.stringify(log.slice(0, 50)));
    } catch(e) {}
}

// ============================================================
//  Статус-уведомление
// ============================================================
let _tonStatusEl = null;

function showTonPaymentStatus(msg, color = '#f59e0b') {
    if (_tonStatusEl) _tonStatusEl.remove();
    _tonStatusEl = document.createElement('div');
    _tonStatusEl.style.cssText = `
        position:fixed;top:20px;left:50%;transform:translateX(-50%);
        background:#0a0a1a;border:1px solid ${color};border-radius:12px;
        padding:10px 18px;font-size:12px;color:#fff;z-index:9999;
        max-width:320px;text-align:center;
        box-shadow:0 4px 20px rgba(0,0,0,0.6);
        transition:opacity 0.3s;
    `;
    _tonStatusEl.textContent = msg;
    document.body.appendChild(_tonStatusEl);
    setTimeout(() => {
        if (_tonStatusEl) { _tonStatusEl.style.opacity = '0'; setTimeout(() => _tonStatusEl?.remove(), 300); }
    }, 5000);
}

// ============================================================
//  Получить историю платежей (для отображения в UI)
// ============================================================
function getDevPaymentHistory() {
    try {
        return JSON.parse(localStorage.getItem(DEV_PAYMENTS_KEY) || '[]');
    } catch(e) { return []; }
}

// Экспорт
window.sendTonToDevWallet   = sendTonToDevWallet;
window.DEV_WALLET_ADDRESS   = DEV_WALLET_ADDRESS;
window.getDevPaymentHistory = getDevPaymentHistory;
