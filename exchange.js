// ============================================================
//  RURCoin — Обменник RURC ↔ TON
//  Комиссия: 1.5% пользователю (ликвидность) + 2% владельцу
// ============================================================

const EXCHANGE_CONFIG = {
    rateRurcPerTon : 1000,      // 1 TON = 1000 RURC
    userFeePct     : 1.5,       // % комиссии пула
    ownerFeePct    : 2.0,       // % владельцу при каждом обмене
    ownerWallet    : 'UQDPnYSAV-H8ADoaYGAuNhJL4HwfSB9IBj9ABi465D9ABj9ABgBaY',
    minTon         : 0.1,
    minRurc        : 100,
    poolAddress    : 'EQDPnYSAV-H8ADoaYGAuNhJL4HwfSB9IBj9ABi465D9ABj9ABgBaY',
};

// ── Состояние ─────────────────────────────────────────────────
const exchangeState = {
    direction : 'buy',
    inputVal  : '',
    isLoading : false,
    history   : JSON.parse(localStorage.getItem('exchHistory') || '[]'),
};

// ── Расчёт ────────────────────────────────────────────────────
function calcOutput(input, direction) {
    const n         = parseFloat(input) || 0;
    const totalFee  = EXCHANGE_CONFIG.userFeePct + EXCHANGE_CONFIG.ownerFeePct; // 3.5%
    const ownerFee  = EXCHANGE_CONFIG.ownerFeePct / 100;
    const totalFeeR = totalFee / 100;

    if (direction === 'buy') {
        // TON → RURC
        const gross     = n * EXCHANGE_CONFIG.rateRurcPerTon;
        const feeRurc   = gross * totalFeeR;
        const ownerTon  = n * ownerFee;          // TON владельцу
        const out       = gross * (1 - totalFeeR);
        return { out, feeTotal: feeRurc, ownerTon, ownerRurc: gross * ownerFee, gross };
    } else {
        // RURC → TON
        const gross     = n / EXCHANGE_CONFIG.rateRurcPerTon;
        const feeTon    = gross * totalFeeR;
        const ownerTon  = gross * ownerFee;
        const out       = gross * (1 - totalFeeR);
        return { out, feeTotal: feeTon, ownerTon, ownerRurc: 0, gross };
    }
}

function fmtTon(v)  { return (Math.round(v * 10000) / 10000).toFixed(4) + ' TON'; }
function fmtRurc(v) { return (Math.round(v * 100)   / 100  ).toFixed(2) + ' RURC'; }

// ── Рендер ────────────────────────────────────────────────────
function renderExchange() {
    const el = document.getElementById('exchangeTab');
    if (!el) return;

    const isBuy    = exchangeState.direction === 'buy';
    const rate     = EXCHANGE_CONFIG.rateRurcPerTon;
    const totalFee = EXCHANGE_CONFIG.userFeePct + EXCHANGE_CONFIG.ownerFeePct;

    el.innerHTML = `
    <div style="text-align:center;margin-bottom:16px;">
        <div style="font-size:32px;margin-bottom:4px;">🔄</div>
        <div style="font-size:17px;font-weight:700;color:#fff;">Обменник</div>
        <div style="font-size:11px;color:#555;margin-top:2px;">RURC ↔ TON</div>
    </div>

    <!-- Курс и комиссия -->
    <div style="background:linear-gradient(135deg,#0d0d2d,#0a1628);
                border:1px solid #1a2a4a;border-radius:14px;
                padding:12px 16px;margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div>
                <div style="font-size:10px;color:#555;margin-bottom:2px;">Курс обмена</div>
                <div style="font-size:14px;font-weight:700;color:#60a5fa;">
                    1 TON = ${rate.toLocaleString()} RURC
                </div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:10px;color:#555;margin-bottom:2px;">Комиссия</div>
                <div style="font-size:13px;font-weight:600;color:#f59e0b;">${totalFee}%</div>
            </div>
        </div>
        <!-- Разбивка комиссии -->
        <div style="background:rgba(0,0,0,0.3);border-radius:8px;padding:8px 10px;
                    font-size:10px;color:#555;line-height:1.8;">
            <div style="display:flex;justify-content:space-between;">
                <span>🏦 Пул ликвидности</span>
                <span style="color:#888;">${EXCHANGE_CONFIG.userFeePct}%</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span>👑 Владелец платформы</span>
                <span style="color:#FF8C00;">${EXCHANGE_CONFIG.ownerFeePct}%</span>
            </div>
        </div>
    </div>

    <!-- Переключатель -->
    <div style="display:flex;background:#0d0d1a;border-radius:12px;
                padding:3px;margin-bottom:14px;border:1px solid #222;">
        <button onclick="setExchDirection('buy')"
            style="flex:1;padding:10px;border:none;border-radius:10px;cursor:pointer;
                   font-size:12px;font-weight:700;transition:all 0.2s;
                   background:${isBuy ? 'linear-gradient(135deg,#FF8C00,#cc6000)' : 'transparent'};
                   color:${isBuy ? '#fff' : '#555'};">
            💰 Купить RURC
        </button>
        <button onclick="setExchDirection('sell')"
            style="flex:1;padding:10px;border:none;border-radius:10px;cursor:pointer;
                   font-size:12px;font-weight:700;transition:all 0.2s;
                   background:${!isBuy ? 'linear-gradient(135deg,#4ade80,#16a34a)' : 'transparent'};
                   color:${!isBuy ? '#fff' : '#555'};">
            📤 Продать RURC
        </button>
    </div>

    <!-- Форма -->
    <div style="background:#0d0d1a;border:1px solid #222;border-radius:14px;padding:14px;margin-bottom:14px;">

        <!-- Отдаёшь -->
        <div style="margin-bottom:10px;">
            <div style="font-size:10px;color:#555;margin-bottom:6px;
                        text-transform:uppercase;letter-spacing:1px;">Отдаёшь</div>
            <div style="display:flex;align-items:center;gap:8px;
                        background:#111;border:1px solid #333;border-radius:10px;padding:10px 12px;">
                <span style="font-size:20px;">${isBuy ? '💎' : '🪙'}</span>
                <input id="exchInput" type="number" step="0.01" min="0"
                    placeholder="${isBuy ? '0.00' : '0'}"
                    value="${exchangeState.inputVal}"
                    oninput="onExchInput(this.value)"
                    style="flex:1;background:none;border:none;outline:none;
                           color:#fff;font-size:16px;font-weight:600;width:100%;">
                <span style="font-size:13px;font-weight:700;color:#888;">
                    ${isBuy ? 'TON' : 'RURC'}
                </span>
            </div>
            <!-- Быстрые суммы -->
            <div style="display:flex;gap:5px;margin-top:8px;flex-wrap:wrap;">
                ${(isBuy
                    ? [['0.5','0.5 TON'],['1','1 TON'],['2','2 TON'],['5','5 TON'],['10','10 TON']]
                    : [['100','100'],['500','500'],['1000','1K'],['5000','5K'],['10000','10K']]
                ).map(([v,l]) =>
                    `<button onclick="setExchInput('${v}')"
                        style="flex:1;min-width:38px;padding:5px 2px;background:#1a1a2a;
                               border:1px solid #2a2a3a;border-radius:8px;color:#777;
                               font-size:11px;cursor:pointer;transition:background 0.15s;"
                        onmouseover="this.style.background='#2a2a3a'"
                        onmouseout="this.style.background='#1a1a2a'">${l}</button>`
                ).join('')}
            </div>
        </div>

        <!-- Стрелка -->
        <div style="text-align:center;margin:10px 0;font-size:22px;color:#333;">⬇️</div>

        <!-- Получаешь -->
        <div>
            <div style="font-size:10px;color:#555;margin-bottom:6px;
                        text-transform:uppercase;letter-spacing:1px;">Получаешь</div>
            <div style="display:flex;align-items:center;gap:8px;
                        background:#0a1a0a;border:2px solid ${isBuy ? '#FF8C00' : '#4ade80'};
                        border-radius:10px;padding:10px 12px;">
                <span style="font-size:20px;">${isBuy ? '🪙' : '💎'}</span>
                <div id="exchOutput"
                    style="flex:1;font-size:18px;font-weight:700;
                           color:${isBuy ? '#FF8C00' : '#4ade80'};">—</div>
                <span style="font-size:13px;font-weight:700;color:#888;">
                    ${isBuy ? 'RURC' : 'TON'}
                </span>
            </div>
            <!-- Детали расчёта -->
            <div id="exchDetails" style="margin-top:8px;font-size:10px;color:#555;line-height:1.8;
                                         background:rgba(0,0,0,0.2);border-radius:8px;padding:6px 10px;
                                         display:none;"></div>
        </div>
    </div>

    <!-- Кнопка обмена -->
    <button id="exchSwapBtn" onclick="doExchange()"
        style="width:100%;padding:15px;border:none;border-radius:14px;cursor:pointer;
               font-size:15px;font-weight:700;color:#fff;letter-spacing:0.5px;
               background:${isBuy
                   ? 'linear-gradient(135deg,#FF8C00,#cc6000)'
                   : 'linear-gradient(135deg,#4ade80,#16a34a)'};
               box-shadow:0 4px 24px ${isBuy ? 'rgba(255,140,0,0.35)' : 'rgba(74,222,128,0.3)'};
               transition:transform 0.15s,opacity 0.15s;margin-bottom:16px;"
        onmouseover="this.style.transform='scale(1.02)'"
        onmouseout="this.style.transform='scale(1)'">
        ${isBuy ? '💰 Купить RURC' : '📤 Продать RURC за TON'}
    </button>

    <!-- Инфо о комиссии владельца -->
    <div style="background:rgba(255,140,0,0.06);border:1px solid rgba(255,140,0,0.15);
                border-radius:10px;padding:10px 12px;margin-bottom:14px;
                font-size:10px;color:#888;line-height:1.6;">
        <span style="color:#FF8C00;font-weight:600;">👑 2% комиссии</span> от каждого обмена
        автоматически переводится на кошелёк владельца платформы.
        Это обеспечивает развитие и поддержку RURCoin.
    </div>

    <!-- История -->
    <div>
        <div style="font-size:11px;color:#555;margin-bottom:8px;
                    display:flex;justify-content:space-between;align-items:center;">
            <span>📋 История обменов</span>
            ${exchangeState.history.length > 0
                ? `<button onclick="clearExchHistory()"
                       style="background:none;border:none;color:#444;font-size:10px;cursor:pointer;">
                       Очистить</button>`
                : ''}
        </div>
        <div id="exchHistory">${renderExchHistory()}</div>
    </div>
    `;

    if (exchangeState.inputVal) onExchInput(exchangeState.inputVal);
}

// ── История ───────────────────────────────────────────────────
function renderExchHistory() {
    if (!exchangeState.history.length) {
        return `<div style="text-align:center;color:#333;font-size:12px;padding:16px 0;">
                    Обменов пока нет
                </div>`;
    }
    return exchangeState.history.slice(0, 10).map(tx => `
        <div style="background:#0d0d1a;border:1px solid #1a1a2a;border-radius:10px;
                    padding:10px 12px;margin-bottom:6px;
                    display:flex;justify-content:space-between;align-items:center;">
            <div>
                <div style="font-size:12px;font-weight:600;color:#fff;">${tx.label}</div>
                <div style="font-size:10px;color:#555;margin-top:2px;">${tx.date}</div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:11px;color:${tx.dir==='buy'?'#FF8C00':'#4ade80'};">
                    ${tx.dir==='buy' ? '+' : ''}${tx.outStr}
                </div>
                <div style="font-size:10px;color:#555;">${tx.status}</div>
            </div>
        </div>
    `).join('');
}

// ── Обработчики ───────────────────────────────────────────────
function setExchDirection(dir) {
    exchangeState.direction = dir;
    exchangeState.inputVal  = '';
    renderExchange();
}

function setExchInput(val) {
    exchangeState.inputVal = val;
    const inp = document.getElementById('exchInput');
    if (inp) inp.value = val;
    onExchInput(val);
}

function onExchInput(val) {
    exchangeState.inputVal = val;
    const { out, feeTotal, ownerTon, gross } = calcOutput(val, exchangeState.direction);
    const isBuy = exchangeState.direction === 'buy';

    const outEl  = document.getElementById('exchOutput');
    const detEl  = document.getElementById('exchDetails');
    if (!outEl) return;

    if (!val || parseFloat(val) <= 0) {
        outEl.textContent = '—';
        if (detEl) { detEl.style.display = 'none'; detEl.innerHTML = ''; }
        return;
    }

    outEl.textContent = isBuy ? fmtRurc(out) : fmtTon(out);

    if (detEl) {
        detEl.style.display = 'block';
        const ownerStr = isBuy
            ? fmtTon(ownerTon) + ' → владелец'
            : fmtTon(ownerTon) + ' → владелец';
        detEl.innerHTML = `
            <div style="display:flex;justify-content:space-between;">
                <span>Без комиссий:</span>
                <span style="color:#888;">${isBuy ? fmtRurc(gross) : fmtTon(gross)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span>Пул (${EXCHANGE_CONFIG.userFeePct}%):</span>
                <span style="color:#f59e0b;">−${isBuy ? fmtRurc(gross * EXCHANGE_CONFIG.userFeePct/100) : fmtTon(gross * EXCHANGE_CONFIG.userFeePct/100)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span>👑 Владелец (${EXCHANGE_CONFIG.ownerFeePct}%):</span>
                <span style="color:#FF8C00;">−${ownerStr}</span>
            </div>
            <div style="display:flex;justify-content:space-between;border-top:1px solid #222;
                        margin-top:4px;padding-top:4px;font-weight:600;">
                <span style="color:#fff;">Итого получаешь:</span>
                <span style="color:${isBuy?'#FF8C00':'#4ade80'};">${isBuy ? fmtRurc(out) : fmtTon(out)}</span>
            </div>
        `;
    }
}

// ── Выполнение обмена ─────────────────────────────────────────
async function doExchange() {
    if (exchangeState.isLoading) return;

    const val   = parseFloat(exchangeState.inputVal) || 0;
    const isBuy = exchangeState.direction === 'buy';

    if (isBuy  && val < EXCHANGE_CONFIG.minTon)  { showExchError(`Минимум: ${EXCHANGE_CONFIG.minTon} TON`);  return; }
    if (!isBuy && val < EXCHANGE_CONFIG.minRurc) { showExchError(`Минимум: ${EXCHANGE_CONFIG.minRurc} RURC`); return; }

    const { out, ownerTon } = calcOutput(val, exchangeState.direction);
    const btn = document.getElementById('exchSwapBtn');

    const walletAddr = window.userWalletAddress || localStorage.getItem('walletAddress');
    if (!walletAddr) {
        showExchError('Подключите TON-кошелёк во вкладке «Кошелёк»'); return;
    }

    exchangeState.isLoading = true;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Обработка...'; btn.style.opacity = '0.7'; }

    try {
        if (isBuy) {
            await doBuyRurc(val, out, ownerTon, walletAddr);
        } else {
            await doSellRurc(val, out, ownerTon, walletAddr);
        }
    } catch (e) {
        showExchError('Ошибка: ' + (e.message || e));
    } finally {
        exchangeState.isLoading = false;
        if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
        renderExchange();
    }
}

// ── Покупка RURC за TON ───────────────────────────────────────
async function doBuyRurc(tonAmount, rurcOut, ownerTon, walletAddr) {
    if (window.tonConnectUI) {
        // Два сообщения: основная сумма в пул + 2% владельцу
        const poolTon  = tonAmount - ownerTon;
        const tx = {
            validUntil: Math.floor(Date.now() / 1000) + 300,
            messages: [
                {
                    // В пул ликвидности
                    address: EXCHANGE_CONFIG.poolAddress,
                    amount : String(Math.round(poolTon * 1e9)),
                    payload: btoa(`buy:${rurcOut.toFixed(2)}:${walletAddr}`),
                },
                {
                    // 2% владельцу
                    address: EXCHANGE_CONFIG.ownerWallet,
                    amount : String(Math.round(ownerTon * 1e9)),
                    payload: btoa(`fee:exchange:${walletAddr}`),
                }
            ]
        };
        await window.tonConnectUI.sendTransaction(tx);
    }

    // Начисляем RURC
    const rurcBalance = parseFloat(localStorage.getItem('rurcBalance') || '0');
    const newBalance  = rurcBalance + rurcOut;
    localStorage.setItem('rurcBalance', newBalance.toFixed(2));

    const balEl = document.getElementById('rurcBalance');
    if (balEl) balEl.textContent = newBalance.toFixed(2);
    if (window.rurcoinApp && window.rurcoinApp.updateBalance) window.rurcoinApp.updateBalance();

    addExchHistory('buy', tonAmount + ' TON', rurcOut, 'RURC');
    showExchSuccess(`✅ Куплено ${fmtRurc(rurcOut)} за ${tonAmount} TON\n👑 Комиссия владельца: ${fmtTon(ownerTon)}`);
}

// ── Продажа RURC за TON ───────────────────────────────────────
async function doSellRurc(rurcAmount, tonOut, ownerTon, walletAddr) {
    const rurcBalance = parseFloat(localStorage.getItem('rurcBalance') || '0');
    if (rurcBalance < rurcAmount) {
        throw new Error(`Недостаточно RURC. Баланс: ${rurcBalance.toFixed(2)}`);
    }

    // Списываем RURC
    const newBalance = rurcBalance - rurcAmount;
    localStorage.setItem('rurcBalance', newBalance.toFixed(2));

    const balEl = document.getElementById('rurcBalance');
    if (balEl) balEl.textContent = newBalance.toFixed(2);

    // В реальности бэкенд отправляет TON и 2% владельцу
    console.log(`[Exchange] Sell ${rurcAmount} RURC → ${tonOut} TON to ${walletAddr}, owner fee: ${ownerTon} TON`);

    addExchHistory('sell', rurcAmount + ' RURC', tonOut, 'TON');
    showExchSuccess(`✅ Продано ${fmtRurc(rurcAmount)} → ${fmtTon(tonOut)}\n👑 Комиссия владельца: ${fmtTon(ownerTon)}`);
}

// ── История ───────────────────────────────────────────────────
function addExchHistory(dir, inStr, outVal, outCur) {
    const outStr = outCur === 'RURC' ? fmtRurc(outVal) : fmtTon(outVal);
    exchangeState.history.unshift({
        dir, label: `${inStr} → ${outStr}`, outStr,
        date  : new Date().toLocaleString('ru'),
        status: '✅ Выполнен',
    });
    if (exchangeState.history.length > 50) exchangeState.history.pop();
    localStorage.setItem('exchHistory', JSON.stringify(exchangeState.history));
}

function clearExchHistory() {
    exchangeState.history = [];
    localStorage.removeItem('exchHistory');
    const el = document.getElementById('exchHistory');
    if (el) el.innerHTML = renderExchHistory();
}

// ── Уведомления ───────────────────────────────────────────────
function showExchSuccess(msg) {
    if (window.showNotification) { window.showNotification(msg, 'success'); return; }
    alert(msg);
}
function showExchError(msg) {
    if (window.showNotification) { window.showNotification('❌ ' + msg, 'error'); return; }
    alert('❌ ' + msg);
}

// ── Инициализация ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-tab]');
        if (btn && btn.getAttribute('data-tab') === 'exchange') {
            setTimeout(() => renderExchange(), 50);
        }
    });
});

window.renderExchange   = renderExchange;
window.setExchDirection = setExchDirection;
window.setExchInput     = setExchInput;
window.onExchInput      = onExchInput;
window.doExchange       = doExchange;
window.clearExchHistory = clearExchHistory;
