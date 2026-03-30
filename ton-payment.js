// ============================================================
//  TON Dev Wallet — отправка, верификация и уведомления об ошибках
//  Кошелёк команды разработчиков RURCoin
// ============================================================

const DEV_WALLET_ADDRESS = 'UQBv5qIVT1x5BD1uOJFKqMMqQfZbdaqExRuIATNCn_HiCGoI';
const DEV_WALLET_COMMENT = 'RURCoin Equipment Purchase — Dev Fund';
const TONAPI_BASE        = 'https://tonapi.io/v2';
const TONAPI_KEY = ''; // ключ убран из клиентского кода

// ============================================================
//  Коды ошибок и человекочитаемые сообщения
// ============================================================
const TON_ERRORS = {
    NO_WALLET:        { code: 'E001', msg: '❌ Кошелёк не подключён. Подключите TON-кошелёк и попробуйте снова.' },
    USER_CANCEL:      { code: 'E002', msg: '❌ Оплата отменена. Нажмите кнопку ещё раз, чтобы повторить.' },
    USER_REJECT:      { code: 'E003', msg: '❌ Транзакция отклонена в кошельке.' },
    INSUFFICIENT_TON: { code: 'E004', msg: '❌ Недостаточно TON на балансе кошелька.' },
    TX_EXPIRED:       { code: 'E005', msg: '❌ Время транзакции истекло. Попробуйте снова.' },
    TX_NOT_FOUND:     { code: 'E006', msg: '❌ Транзакция не найдена в блокчейне. Проверьте баланс кошелька.' },
    API_ERROR:        { code: 'E007', msg: '⚠️ Ошибка TON API. Проверка транзакции недоступна.' },
    NETWORK_ERROR:    { code: 'E008', msg: '⚠️ Нет соединения с сетью. Проверьте интернет.' },
    INVALID_ADDRESS:  { code: 'E009', msg: '❌ Неверный адрес кошелька получателя.' },
    UNKNOWN:          { code: 'E999', msg: '❌ Неизвестная ошибка. Попробуйте позже или обратитесь в поддержку.' },
};

// ============================================================
//  Определение типа ошибки по тексту
// ============================================================

// ── Fetch с таймаутом ──────────────────────────────────────────
async function _tonFetchWithTimeout(url, options = {}, ms = 8000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    try {
        const res = await fetch(url, { ...options, signal: ctrl.signal });
        clearTimeout(timer);
        return res;
    } catch(e) {
        clearTimeout(timer);
        if (e.name === 'AbortError') throw new Error('Таймаут запроса (' + ms + 'мс)');
        throw e;
    }
}


function classifyError(err) {
    if (!err) return TON_ERRORS.UNKNOWN;
    const msg = (err.message || err.toString() || '').toLowerCase();

    if (msg.includes('cancel'))                          return TON_ERRORS.USER_CANCEL;
    if (msg.includes('reject') || msg.includes('deny')) return TON_ERRORS.USER_REJECT;
    if (msg.includes('insufficient') || msg.includes('balance') || msg.includes('not enough'))
                                                         return TON_ERRORS.INSUFFICIENT_TON;
    if (msg.includes('expired') || msg.includes('timeout') || msg.includes('valid until'))
                                                         return TON_ERRORS.TX_EXPIRED;
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch'))
                                                         return TON_ERRORS.NETWORK_ERROR;
    if (msg.includes('address') || msg.includes('invalid'))
                                                         return TON_ERRORS.INVALID_ADDRESS;
    if (msg.includes('api') || msg.includes('status'))  return TON_ERRORS.API_ERROR;
    return TON_ERRORS.UNKNOWN;
}

// ============================================================
//  Основная функция: отправка + верификация
// ============================================================
async function sendTonToDevWallet(costTON, label, onSuccess) {
    showTonNotification(`⏳ Отправка ${costTON} TON на кошелёк команды...`, 'pending');

    try {
        // Проверяем наличие кошелька
        const hasWallet = (window.tonConnectUI && window.tonConnectUI.connected);
        if (!hasWallet) {
            showTonNotification(TON_ERRORS.NO_WALLET.msg, 'error',
                `Код: ${TON_ERRORS.NO_WALLET.code}`,
                [{ text: '🔗 Подключить кошелёк', action: () => window.tonConnectUI?.openModal?.() }]
            );
            return;
        }

        const amountNano   = String(Math.round(costTON * 1e9));
        const tsBeforeSend = Math.floor(Date.now() / 1000);

        // ── TON Connect ──────────────────────────────────────────────────
        const tx = {
            validUntil: tsBeforeSend + 300,
            messages: [{
                address: DEV_WALLET_ADDRESS,
                amount:  amountNano,
                payload: encodeTonComment(DEV_WALLET_COMMENT + ' | ' + label)
            }]
        };

        let result;
        try {
            result = await window.tonConnectUI.sendTransaction(tx);
        } catch (sendErr) {
            const errType = classifyError(sendErr);
            showTonNotification(errType.msg, 'error', `Код: ${errType.code}`,
                errType.code === 'E002' || errType.code === 'E003'
                    ? [{ text: '🔄 Повторить', action: () => sendTonToDevWallet(costTON, label, onSuccess) }]
                    : []
            );
            logDevError(costTON, label, errType.code, sendErr.message);
            return;
        }

        // ── Верификация ──────────────────────────────────────────────────
        showTonNotification(`🔍 Проверяем транзакцию в блокчейне...`, 'pending');

        const verified = await verifyTonTransaction({ expectedAmount: costTON, afterTs: tsBeforeSend });

        if (verified.ok) {
            showTonNotification(
                `✅ Оплата подтверждена!`,
                'success',
                `${costTON} TON • Hash: ${verified.hash}`,
                [{ text: '🔗 Открыть в TON Explorer', action: () => window.open(`https://tonscan.org/tx/${verified.hash}`, '_blank') }]
            );
            logDevPayment(costTON, label, 'tonconnect', verified.hash);
            if (onSuccess) onSuccess();
        } else {
            // Повторная проверка через 15 сек
            showTonNotification(`⏳ Ожидаем подтверждения блокчейна...`, 'pending');
            await sleep(15000);
            const retry = await verifyTonTransaction({ expectedAmount: costTON, afterTs: tsBeforeSend });

            if (retry.ok) {
                showTonNotification(
                    `✅ Оплата подтверждена!`,
                    'success',
                    `${costTON} TON • Hash: ${retry.hash}`,
                    [{ text: '🔗 Открыть в TON Explorer', action: () => window.open(`https://tonscan.org/tx/${retry.hash}`, '_blank') }]
                );
                logDevPayment(costTON, label, 'tonconnect', retry.hash);
                if (onSuccess) onSuccess();
            } else {
                showTonNotification(
                    TON_ERRORS.TX_NOT_FOUND.msg,
                    'error',
                    `Код: ${TON_ERRORS.TX_NOT_FOUND.code} • Причина: ${retry.reason}`,
                    [
                        { text: '🔄 Проверить снова', action: async () => {
                            const check = await verifyTonTransaction({ expectedAmount: costTON, afterTs: tsBeforeSend });
                            if (check.ok) { logDevPayment(costTON, label, 'manual', check.hash); if (onSuccess) onSuccess(); }
                            else showTonNotification('❌ Транзакция всё ещё не найдена', 'error', check.reason);
                        }},
                        { text: '📩 Поддержка', action: () => window.open('https://t.me/rurcoin_support', '_blank') }
                    ]
                );
                logDevError(costTON, label, TON_ERRORS.TX_NOT_FOUND.code, retry.reason);
            }
        }

    } catch (err) {
        const errType = classifyError(err);
        showTonNotification(errType.msg, 'error', `Код: ${errType.code} • ${err.message || ''}`,
            [{ text: '🔄 Повторить', action: () => sendTonToDevWallet(costTON, label, onSuccess) }]
        );
        logDevError(costTON, label, errType.code, err.message);
        console.error('[DevWallet] Необработанная ошибка:', err);
    }
}

// ============================================================
//  Верификация транзакции через TON API
// ============================================================
async function verifyTonTransaction({ expectedAmount, afterTs }) {
    const amountNano = Math.round(expectedAmount * 1e9);
    const tolerance  = Math.round(amountNano * 0.01);

    try {
        const url  = `${TONAPI_BASE}/blockchain/accounts/${DEV_WALLET_ADDRESS}/transactions?limit=20`;
        const resp = await _tonFetchWithTimeout(url, { headers: { 'Authorization': `Bearer ${TONAPI_KEY}` } });

        if (!resp.ok) {
            return { ok: false, reason: `TON API вернул ${resp.status}` };
        }

        const data = await resp.json();
        const txs  = data.transactions || [];

        for (const tx of txs) {
            const ts = tx.utime || 0;
            if (ts < afterTs - 5) continue;
            const inMsg = tx.in_msg;
            if (!inMsg) continue;
            const value = parseInt(inMsg.value || '0', 10);
            if (Math.abs(value - amountNano) <= tolerance) {
                const hash = tx.hash || tx.transaction_id?.hash || 'unknown';
                return { ok: true, hash: hash.slice(0, 16), amount: value / 1e9, ts };
            }
        }

        return { ok: false, reason: 'Транзакция с нужной суммой не найдена' };

    } catch (e) {
        return { ok: false, reason: `Сетевая ошибка: ${e.message}` };
    }
}

// ============================================================
//  UI уведомлений — карточка с иконкой, деталями и кнопками
// ============================================================
let _notifEl = null;

function showTonNotification(title, type = 'pending', detail = '', actions = []) {
    if (_notifEl) _notifEl.remove();

    const colors = {
        pending: { border: '#f59e0b', icon: '⏳', bg: 'rgba(245,158,11,0.08)' },
        success: { border: '#4ade80', icon: '✅', bg: 'rgba(74,222,128,0.08)' },
        error:   { border: '#f87171', icon: '❌', bg: 'rgba(248,113,113,0.08)' },
        info:    { border: '#60a5fa', icon: 'ℹ️', bg: 'rgba(96,165,250,0.08)' },
    };
    const c = colors[type] || colors.info;

    _notifEl = document.createElement('div');
    _notifEl.style.cssText = `
        position:fixed;top:16px;left:50%;transform:translateX(-50%);
        background:#0d0d1f;border:1px solid ${c.border};border-radius:14px;
        padding:14px 18px;font-size:13px;color:#fff;z-index:99999;
        min-width:280px;max-width:360px;text-align:left;
        box-shadow:0 8px 32px rgba(0,0,0,0.7);
        animation:tonSlideIn 0.25s ease;
    `;

    // Анимация
    if (!document.getElementById('_tonNotifStyle')) {
        const s = document.createElement('style');
        s.id = '_tonNotifStyle';
        s.textContent = `
            @keyframes tonSlideIn { from { opacity:0; transform:translateX(-50%) translateY(-12px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
            .ton-notif-btn { background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); border-radius:8px; color:#fff; font-size:11px; padding:5px 10px; cursor:pointer; margin-top:8px; margin-right:6px; transition:background 0.2s; }
            .ton-notif-btn:hover { background:rgba(255,255,255,0.16); }
        `;
        document.head.appendChild(s);
    }

    // Заголовок
    const titleEl = document.createElement('div');
    titleEl.style.cssText = `font-weight:600;font-size:13px;margin-bottom:${detail ? '4px' : '0'}`;
    titleEl.textContent = title;
    _notifEl.appendChild(titleEl);

    // Детали
    if (detail) {
        const detailEl = document.createElement('div');
        detailEl.style.cssText = 'font-size:11px;color:rgba(255,255,255,0.55);margin-bottom:2px;word-break:break-all;';
        detailEl.textContent = detail;
        _notifEl.appendChild(detailEl);
    }

    // Кнопки действий
    if (actions.length) {
        const btnRow = document.createElement('div');
        btnRow.style.marginTop = '6px';
        actions.forEach(a => {
            const btn = document.createElement('button');
            btn.className = 'ton-notif-btn';
            btn.textContent = a.text;
            btn.onclick = () => { _notifEl?.remove(); a.action(); };
            btnRow.appendChild(btn);
        });
        _notifEl.appendChild(btnRow);
    }

    // Кнопка закрытия
    const closeBtn = document.createElement('span');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'position:absolute;top:10px;right:14px;cursor:pointer;opacity:0.4;font-size:12px;';
    closeBtn.onclick = () => _notifEl?.remove();
    _notifEl.appendChild(closeBtn);
    _notifEl.style.position = 'fixed'; // переопределяем для absolute внутри

    document.body.appendChild(_notifEl);

    // Автозакрытие: ошибки — 10 сек, остальные — 6 сек
    const delay = type === 'error' ? 10000 : 6000;
    setTimeout(() => {
        if (_notifEl) {
            _notifEl.style.transition = 'opacity 0.3s';
            _notifEl.style.opacity = '0';
            setTimeout(() => _notifEl?.remove(), 300);
        }
    }, delay);
}

// ============================================================
//  Вспомогательные функции
// ============================================================
function encodeTonComment(text) {
    try {
        const bytes = new TextEncoder().encode(text);
        const payload = new Uint8Array(4 + bytes.length);
        payload.set(bytes, 4);
        return btoa(String.fromCharCode(...payload));
    } catch(e) { return ''; }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Лог платежей ─────────────────────────────────────────────
const DEV_PAYMENTS_KEY = 'rurcoin_dev_payments';
const DEV_ERRORS_KEY   = 'rurcoin_dev_errors';

function logDevPayment(costTON, label, method, txHash) {
    try {
        const log = JSON.parse(localStorage.getItem(DEV_PAYMENTS_KEY) || '[]');
        log.unshift({ ts: Date.now(), amount: costTON, label, method, txHash });
        localStorage.setItem(DEV_PAYMENTS_KEY, JSON.stringify(log.slice(0, 50)));
    } catch(e) {}
}

function logDevError(costTON, label, code, reason) {
    try {
        const log = JSON.parse(localStorage.getItem(DEV_ERRORS_KEY) || '[]');
        log.unshift({ ts: Date.now(), amount: costTON, label, code, reason });
        localStorage.setItem(DEV_ERRORS_KEY, JSON.stringify(log.slice(0, 30)));
    } catch(e) {}
}

function getDevPaymentHistory() {
    try { return JSON.parse(localStorage.getItem(DEV_PAYMENTS_KEY) || '[]'); } catch(e) { return []; }
}

function getDevErrorHistory() {
    try { return JSON.parse(localStorage.getItem(DEV_ERRORS_KEY) || '[]'); } catch(e) { return []; }
}

async function getLastDevTransaction() {
    try {
        const url  = `${TONAPI_BASE}/blockchain/accounts/${DEV_WALLET_ADDRESS}/transactions?limit=5`;
        const resp = await _tonFetchWithTimeout(url, { headers: { 'Authorization': `Bearer ${TONAPI_KEY}` } });
        if (!resp.ok) return null;
        const data = await resp.json();
        const tx   = (data.transactions || [])[0];
        if (!tx) return null;
        return {
            hash:   (tx.hash || '').slice(0, 16),
            amount: parseInt(tx.in_msg?.value || '0', 10) / 1e9,
            ts:     tx.utime,
            date:   new Date(tx.utime * 1000).toLocaleString('ru-RU')
        };
    } catch(e) { return null; }
}

// Экспорт
window.sendTonToDevWallet    = sendTonToDevWallet;
window.verifyTonTransaction  = verifyTonTransaction;
window.getLastDevTransaction = getLastDevTransaction;
window.getDevPaymentHistory  = getDevPaymentHistory;
window.getDevErrorHistory    = getDevErrorHistory;
window.showTonNotification   = showTonNotification;
window.DEV_WALLET_ADDRESS    = DEV_WALLET_ADDRESS;
