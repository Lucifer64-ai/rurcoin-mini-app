// ============================================================
//  TON Dev Wallet — отправка и ВЕРИФИКАЦИЯ TON-транзакций
//  Кошелёк команды разработчиков RURCoin
// ============================================================

const DEV_WALLET_ADDRESS = 'UQBMECsWYTb9gHH5bT-fweEZQXptdgmKpOy0mIswhbu0RqEb';
const DEV_WALLET_COMMENT = 'RURCoin Equipment Purchase — Dev Fund';
const TONAPI_BASE        = 'https://tonapi.io/v2';
const TONAPI_KEY         = 'AHVHQCBZEV2TA6IAAAAJHMD6BQFJMEKBTA6WY3STOQMD5ZAPNOSYAM7ETRGBDN7S7JYYQZI';

// ============================================================
//  Основная функция: отправка + верификация
// ============================================================
async function sendTonToDevWallet(costTON, label, onSuccess) {
    showTonPaymentStatus(`⏳ Отправка ${costTON} TON на кошелёк команды...`, '#f59e0b');

    try {
        const amountNano = String(Math.round(costTON * 1e9));
        const tsBeforeSend = Math.floor(Date.now() / 1000);

        // ── Способ 1: TON Connect ────────────────────────────────────────
        if (window.tonConnectUI && window.tonConnectUI.connected) {
            const tx = {
                validUntil: tsBeforeSend + 300,
                messages: [{
                    address: DEV_WALLET_ADDRESS,
                    amount:  amountNano,
                    payload: encodeTonComment(DEV_WALLET_COMMENT + ' | ' + label)
                }]
            };

            const result = await window.tonConnectUI.sendTransaction(tx);
            console.log('[DevWallet] TON Connect tx sent:', result);

            showTonPaymentStatus(`🔍 Проверяем транзакцию в блокчейне...`, '#60a5fa');

            // Верифицируем через TON API
            const verified = await verifyTonTransaction({
                expectedAmount: costTON,
                afterTs: tsBeforeSend,
                boc: result?.boc || null
            });

            if (verified.ok) {
                showTonPaymentStatus(`✅ Транзакция подтверждена! Hash: ${verified.hash}`, '#4ade80');
                logDevPayment(costTON, label, 'tonconnect', verified.hash);
                if (onSuccess) onSuccess();
            } else {
                showTonPaymentStatus(`❌ Транзакция не найдена: ${verified.reason}`, '#f87171');
                console.warn('[DevWallet] Verification failed:', verified.reason);
            }
            return;
        }

        // ── Способ 2: ton:// deeplink (fallback) ────────────────────────
        const tonLink = `ton://transfer/${DEV_WALLET_ADDRESS}?amount=${amountNano}&text=${encodeURIComponent(DEV_WALLET_COMMENT + ' | ' + label)}`;
        window.open(tonLink, '_blank');

        showTonPaymentStatus(`📲 Подтвердите оплату ${costTON} TON в кошельке`, '#60a5fa');

        // Ждём подтверждения пользователя, затем проверяем блокчейн
        await sleep(10000);
        showTonPaymentStatus(`🔍 Проверяем транзакцию в блокчейне...`, '#60a5fa');

        const verified = await verifyTonTransaction({
            expectedAmount: costTON,
            afterTs: tsBeforeSend,
            boc: null
        });

        if (verified.ok) {
            showTonPaymentStatus(`✅ Транзакция подтверждена! Hash: ${verified.hash}`, '#4ade80');
            logDevPayment(costTON, label, 'deeplink', verified.hash);
            if (onSuccess) onSuccess();
        } else {
            showTonPaymentStatus(`⏳ Транзакция ещё не найдена. Ожидаем...`, '#f59e0b');
            // Повторная проверка через 15 сек
            await sleep(15000);
            const retry = await verifyTonTransaction({ expectedAmount: costTON, afterTs: tsBeforeSend, boc: null });
            if (retry.ok) {
                showTonPaymentStatus(`✅ Транзакция подтверждена! Hash: ${retry.hash}`, '#4ade80');
                logDevPayment(costTON, label, 'deeplink', retry.hash);
                if (onSuccess) onSuccess();
            } else {
                showTonPaymentStatus(`❌ Оплата не подтверждена. Попробуйте снова.`, '#f87171');
            }
        }

    } catch (err) {
        console.error('[DevWallet] Ошибка:', err);
        if (err?.message?.toLowerCase().includes('cancel') ||
            err?.message?.toLowerCase().includes('reject')) {
            showTonPaymentStatus(`❌ Оплата отменена`, '#f87171');
            return; // не зачисляем оборудование
        }
        showTonPaymentStatus(`❌ Ошибка: ${err.message || 'неизвестная'}`, '#f87171');
    }
}

// ============================================================
//  Верификация транзакции через TON API
//  Проверяем входящие транзакции на кошелёк DEV_WALLET_ADDRESS
// ============================================================
async function verifyTonTransaction({ expectedAmount, afterTs, boc }) {
    const amountNano = Math.round(expectedAmount * 1e9);
    const tolerance  = Math.round(amountNano * 0.01); // ±1% допуск на комиссию

    try {
        // Получаем последние транзакции кошелька через TON API
        const url = `${TONAPI_BASE}/blockchain/accounts/${DEV_WALLET_ADDRESS}/transactions?limit=20`;
        const resp = await fetch(url, {
            headers: { 'Authorization': `Bearer ${TONAPI_KEY}` }
        });

        if (!resp.ok) {
            return { ok: false, reason: `TON API error ${resp.status}` };
        }

        const data = await resp.json();
        const txs  = data.transactions || [];

        for (const tx of txs) {
            const ts = tx.utime || 0;
            if (ts < afterTs - 5) continue; // транзакция до отправки — пропускаем

            // Ищем входящее сообщение с нужной суммой
            const inMsg = tx.in_msg;
            if (!inMsg) continue;

            const value = parseInt(inMsg.value || '0', 10);
            if (Math.abs(value - amountNano) <= tolerance) {
                const hash = tx.hash || tx.transaction_id?.hash || 'unknown';
                return {
                    ok:     true,
                    hash:   hash.slice(0, 16),
                    amount: value / 1e9,
                    ts
                };
            }
        }

        return { ok: false, reason: 'Транзакция с нужной суммой не найдена' };

    } catch (e) {
        console.error('[verifyTon] fetch error:', e);
        return { ok: false, reason: e.message };
    }
}

// ============================================================
//  Получить статус последней транзакции (для UI)
// ============================================================
async function getLastDevTransaction() {
    try {
        const url = `${TONAPI_BASE}/blockchain/accounts/${DEV_WALLET_ADDRESS}/transactions?limit=5`;
        const resp = await fetch(url, {
            headers: { 'Authorization': `Bearer ${TONAPI_KEY}` }
        });
        if (!resp.ok) return null;
        const data = await resp.json();
        const tx = (data.transactions || [])[0];
        if (!tx) return null;
        return {
            hash:   (tx.hash || '').slice(0, 16),
            amount: parseInt(tx.in_msg?.value || '0', 10) / 1e9,
            ts:     tx.utime,
            date:   new Date(tx.utime * 1000).toLocaleString('ru-RU')
        };
    } catch(e) { return null; }
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Лог платежей ─────────────────────────────────────────────
const DEV_PAYMENTS_KEY = 'rurcoin_dev_payments';

function logDevPayment(costTON, label, method, txHash) {
    try {
        const log = JSON.parse(localStorage.getItem(DEV_PAYMENTS_KEY) || '[]');
        log.unshift({ ts: Date.now(), amount: costTON, label, method, txHash });
        localStorage.setItem(DEV_PAYMENTS_KEY, JSON.stringify(log.slice(0, 50)));
    } catch(e) {}
}

function getDevPaymentHistory() {
    try { return JSON.parse(localStorage.getItem(DEV_PAYMENTS_KEY) || '[]'); }
    catch(e) { return []; }
}

// ── Статус-уведомление ────────────────────────────────────────
let _tonStatusEl = null;

function showTonPaymentStatus(msg, color = '#f59e0b') {
    if (_tonStatusEl) _tonStatusEl.remove();
    _tonStatusEl = document.createElement('div');
    _tonStatusEl.style.cssText = `
        position:fixed;top:20px;left:50%;transform:translateX(-50%);
        background:#0a0a1a;border:1px solid ${color};border-radius:12px;
        padding:10px 18px;font-size:12px;color:#fff;z-index:9999;
        max-width:340px;text-align:center;
        box-shadow:0 4px 20px rgba(0,0,0,0.6);transition:opacity 0.3s;
    `;
    _tonStatusEl.textContent = msg;
    document.body.appendChild(_tonStatusEl);
    setTimeout(() => {
        if (_tonStatusEl) {
            _tonStatusEl.style.opacity = '0';
            setTimeout(() => _tonStatusEl?.remove(), 300);
        }
    }, 6000);
}

// Экспорт
window.sendTonToDevWallet    = sendTonToDevWallet;
window.verifyTonTransaction  = verifyTonTransaction;
window.getLastDevTransaction = getLastDevTransaction;
window.getDevPaymentHistory  = getDevPaymentHistory;
window.DEV_WALLET_ADDRESS    = DEV_WALLET_ADDRESS;
