// ============================================================
//  admin.js — RURCoin Control Panel
//  Панель управления с выраженными кнопками и иконками
// ============================================================
(function() {
'use strict';

function waitForApp(cb) {
    if (window.rurcoinApp) { cb(window.rurcoinApp); return; }
    const t = setInterval(() => {
        if (window.rurcoinApp) { clearInterval(t); cb(window.rurcoinApp); }
    }, 300);
}
function el(id) { return document.getElementById(id); }

function notify(msg, type) {
    if (window.showToast) window.showToast(msg, type || 'info');
    else if (window.rurcoinApp && window.rurcoinApp.showMessage) window.rurcoinApp.showMessage(msg);
}

// ── СТИЛИ ────────────────────────────────────────────────────
const style = document.createElement('style');
style.textContent = `
@keyframes cp-glow-orange {
  0%,100%{ box-shadow:0 0 10px #FF6000,0 0 24px rgba(255,96,0,.5),inset 0 1px 0 rgba(255,255,255,.15); }
  50%    { box-shadow:0 0 20px #FF8C00,0 0 48px rgba(255,140,0,.7),inset 0 1px 0 rgba(255,255,255,.25); }
}
@keyframes cp-glow-green {
  0%,100%{ box-shadow:0 0 10px #00c853,0 0 24px rgba(0,200,83,.4); }
  50%    { box-shadow:0 0 20px #00e676,0 0 48px rgba(0,230,118,.6); }
}
@keyframes cp-glow-blue {
  0%,100%{ box-shadow:0 0 10px #60a5fa,0 0 24px rgba(96,165,250,.4); }
  50%    { box-shadow:0 0 20px #93c5fd,0 0 48px rgba(147,197,253,.6); }
}
@keyframes cp-glow-purple {
  0%,100%{ box-shadow:0 0 10px #ab47bc,0 0 24px rgba(171,71,188,.4); }
  50%    { box-shadow:0 0 20px #ce93d8,0 0 48px rgba(206,147,216,.6); }
}
@keyframes cp-glow-red {
  0%,100%{ box-shadow:0 0 8px rgba(244,67,54,.4); }
  50%    { box-shadow:0 0 16px rgba(244,67,54,.7); }
}
@keyframes cp-shimmer {
  0%  { background-position:-300% center; }
  100%{ background-position: 300% center; }
}
@keyframes cp-bounce-icon {
  0%,100%{ transform:translateY(0) scale(1); }
  40%    { transform:translateY(-5px) scale(1.1); }
  60%    { transform:translateY(-2px) scale(1.05); }
}
@keyframes cp-spin {
  from{ transform:rotate(0deg); }
  to  { transform:rotate(360deg); }
}
@keyframes cp-slide-up {
  from{ opacity:0; transform:translateY(14px); }
  to  { opacity:1; transform:translateY(0); }
}
@keyframes cp-pulse-dot {
  0%,100%{ transform:scale(1); opacity:1; }
  50%    { transform:scale(1.7); opacity:.5; }
}
@keyframes cp-bar-shine {
  0%  { left:-100%; }
  100%{ left:200%; }
}

/* ── СЕКЦИИ ── */
.cp-section {
  background: linear-gradient(135deg,#0d0d1a,#120800);
  border:1px solid #2a1500;
  border-radius:20px;
  padding:18px;
  margin-bottom:14px;
  animation:cp-slide-up .35s ease;
  transition:border-color .3s;
}
.cp-section:hover{ border-color:#FF6000; }

.cp-section-title {
  font-size:15px; font-weight:800;
  color:#FF8C00;
  margin-bottom:16px;
  display:flex; align-items:center; gap:10px;
}
.cp-section-title::before {
  content:'';
  width:3px; height:18px;
  background:linear-gradient(180deg,#FF6000,#FFD700);
  border-radius:2px;
  display:inline-block;
  box-shadow:0 0 6px #FF6000;
}

/* ── КНОПКИ — ОСНОВНЫЕ ── */
.cp-btn {
  padding:14px 12px;
  border:none;
  border-radius:16px;
  font-size:13px;
  font-weight:800;
  cursor:pointer;
  position:relative;
  overflow:hidden;
  transition:transform .15s, filter .2s;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:6px;
  letter-spacing:.3px;
  text-align:center;
}
.cp-btn:active{ transform:scale(.93) !important; filter:brightness(.9); }

/* Иконка кнопки */
.cp-btn-icon {
  font-size:26px;
  display:inline-block;
  animation:cp-bounce-icon 2.5s ease-in-out infinite;
  line-height:1;
}
.cp-btn-label { font-size:11px; font-weight:700; line-height:1.2; }

/* Ripple */
.cp-btn::after {
  content:'';
  position:absolute;
  top:50%; left:50%;
  width:0; height:0;
  background:rgba(255,255,255,.2);
  border-radius:50%;
  transform:translate(-50%,-50%);
  transition:width .5s, height .5s, opacity .5s;
}
.cp-btn:active::after{ width:200px; height:200px; opacity:0; }

/* Цвета кнопок */
.cp-btn-orange {
  background:linear-gradient(135deg,#FF2200,#FF6000,#FF8C00,#FF6000,#FF2200);
  background-size:300% auto;
  color:#000;
  animation:cp-shimmer 3s linear infinite, cp-glow-orange 2.5s ease-in-out infinite;
}
.cp-btn-orange:hover{ transform:translateY(-3px) scale(1.02); }

.cp-btn-green {
  background:linear-gradient(135deg,#00695c,#00c853,#69f0ae,#00c853,#00695c);
  background-size:300% auto;
  color:#000;
  animation:cp-shimmer 3s linear infinite, cp-glow-green 2.5s ease-in-out infinite;
}
.cp-btn-green:hover{ transform:translateY(-3px) scale(1.02); }

.cp-btn-blue {
  background:linear-gradient(135deg,#0d47a1,#1976d2,#60a5fa,#1976d2,#0d47a1);
  background-size:300% auto;
  color:#fff;
  animation:cp-shimmer 3s linear infinite, cp-glow-blue 2.5s ease-in-out infinite;
}
.cp-btn-blue:hover{ transform:translateY(-3px) scale(1.02); }

.cp-btn-purple {
  background:linear-gradient(135deg,#4a148c,#7b1fa2,#ce93d8,#7b1fa2,#4a148c);
  background-size:300% auto;
  color:#fff;
  animation:cp-shimmer 3s linear infinite, cp-glow-purple 2.5s ease-in-out infinite;
}
.cp-btn-purple:hover{ transform:translateY(-3px) scale(1.02); }

.cp-btn-red {
  background:rgba(244,67,54,.1);
  border:2px solid rgba(244,67,54,.5);
  color:#f44336;
  animation:cp-glow-red 2.5s ease-in-out infinite;
  font-size:14px;
  padding:14px;
}
.cp-btn-red:hover{ background:rgba(244,67,54,.2); transform:translateY(-2px); }

.cp-btn-yellow {
  background:linear-gradient(135deg,#e65100,#FF8C00,#FFD700,#FF8C00,#e65100);
  background-size:300% auto;
  color:#000;
  animation:cp-shimmer 3s linear infinite, cp-glow-orange 2.5s ease-in-out infinite;
}
.cp-btn-yellow:hover{ transform:translateY(-3px) scale(1.02); }

/* Полная ширина */
.cp-btn-full { grid-column:1 / -1; flex-direction:row; gap:10px; padding:16px; }
.cp-btn-full .cp-btn-icon { font-size:22px; animation:none; }
.cp-btn-full .cp-btn-label { font-size:14px; }

/* ── СЕТКА КНОПОК ── */
.cp-btn-grid {
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:10px;
}
.cp-btn-grid-3 {
  display:grid;
  grid-template-columns:1fr 1fr 1fr;
  gap:8px;
}

/* ── СТАТИСТИКА ── */
.cp-stats-grid {
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:10px;
}
.cp-stat-card {
  background:rgba(255,96,0,.07);
  border:1px solid rgba(255,96,0,.18);
  border-radius:14px;
  padding:12px;
  text-align:center;
  transition:border-color .3s, transform .2s;
}
.cp-stat-card:hover{ border-color:#FF6000; transform:scale(1.03); }
.cp-stat-icon{ font-size:22px; display:inline-block; animation:cp-bounce-icon 2.5s ease-in-out infinite; }
.cp-stat-val{ font-size:15px; font-weight:700; color:#FF8C00; margin-top:4px; }
.cp-stat-lbl{ font-size:10px; color:#555; margin-top:2px; }

/* ── ПРОГРЕСС-БАРЫ ── */
.cp-bar-wrap {
  background:#0a0a14;
  border-radius:8px;
  height:12px;
  overflow:hidden;
  border:1px solid #1a1a2e;
  position:relative;
  margin:6px 0;
}
.cp-bar-fill {
  height:100%;
  border-radius:8px;
  transition:width 1s cubic-bezier(.4,0,.2,1);
  position:relative;
  overflow:hidden;
}
.cp-bar-fill::after {
  content:'';
  position:absolute;
  top:0; left:-100%;
  width:60%; height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent);
  animation:cp-bar-shine 2s ease-in-out infinite;
}
.cp-bar-oil{ background:linear-gradient(90deg,#8B4513,#FF6000,#FFD700); }
.cp-bar-gas{ background:linear-gradient(90deg,#004d40,#00c853,#69f0ae); }

/* ── ПЕРЕКЛЮЧАТЕЛИ ── */
.cp-toggle-row {
  display:flex; align-items:center; justify-content:space-between;
  padding:12px 0;
  border-bottom:1px solid #1a1a2e;
}
.cp-toggle-row:last-child{ border-bottom:none; }
.cp-toggle-left{ display:flex; align-items:center; gap:10px; }
.cp-toggle-emoji{ font-size:22px; }
.cp-toggle-label{ font-size:13px; color:#ccc; font-weight:600; }
.cp-toggle-sub{ font-size:10px; color:#555; margin-top:2px; }

.cp-toggle{ position:relative; width:48px; height:26px; flex-shrink:0; }
.cp-toggle input{ opacity:0; width:0; height:0; }
.cp-toggle-slider {
  position:absolute; cursor:pointer;
  top:0;left:0;right:0;bottom:0;
  background:#1a1a2e;
  border:1px solid #2a2a4a;
  border-radius:26px;
  transition:.3s;
}
.cp-toggle-slider::before {
  content:'';
  position:absolute;
  width:20px; height:20px;
  left:2px; bottom:2px;
  background:#555;
  border-radius:50%;
  transition:.3s;
  box-shadow:0 2px 4px rgba(0,0,0,.4);
}
.cp-toggle input:checked + .cp-toggle-slider{
  background:#FF6000;
  border-color:#FF8C00;
  box-shadow:0 0 8px rgba(255,96,0,.5);
}
.cp-toggle input:checked + .cp-toggle-slider::before{
  transform:translateX(22px);
  background:#fff;
}

/* ── СЛАЙДЕРЫ ── */
.cp-slider-wrap{ margin:12px 0; }
.cp-slider-label{
  display:flex; justify-content:space-between; align-items:center;
  font-size:12px; color:#888; margin-bottom:8px;
}
.cp-slider-label span{ color:#FF8C00; font-weight:700; font-size:13px; }
.cp-slider{
  width:100%; -webkit-appearance:none;
  height:8px; border-radius:4px;
  background:linear-gradient(90deg,#FF6000,#2a1500);
  outline:none; cursor:pointer;
}
.cp-slider::-webkit-slider-thumb{
  -webkit-appearance:none;
  width:24px; height:24px;
  border-radius:50%;
  background:linear-gradient(135deg,#FF4500,#FFD700);
  box-shadow:0 0 8px rgba(255,96,0,.6), 0 2px 6px rgba(0,0,0,.4);
  cursor:pointer;
  transition:transform .15s;
  border:2px solid rgba(255,255,255,.2);
}
.cp-slider::-webkit-slider-thumb:active{ transform:scale(1.25); }

/* ── ЛОГ ── */
.cp-log {
  background:#050508;
  border:1px solid #1a1a2e;
  border-radius:12px;
  padding:10px 12px;
  max-height:130px;
  overflow-y:auto;
  font-size:11px;
  font-family:monospace;
  color:#4ade80;
  scrollbar-width:thin;
  scrollbar-color:#2a1500 #050508;
}
.cp-log-entry{ margin-bottom:4px; line-height:1.4; }
.cp-log-entry.warn{ color:#FFD700; }
.cp-log-entry.err { color:#f44336; }
.cp-log-entry.info{ color:#60a5fa; }

/* ── ЭКСПОРТ ── */
.cp-export-box {
  background:#050508;
  border:1px solid #1a1a2e;
  border-radius:12px;
  padding:12px;
  font-size:11px;
  font-family:monospace;
  color:#60a5fa;
  word-break:break-all;
  max-height:100px;
  overflow-y:auto;
  margin-top:10px;
  outline:none;
  transition:border-color .3s;
}
.cp-export-box:focus{ border-color:#60a5fa; }

/* ── СТАТУС ДОБЫЧИ ── */
.cp-mining-badge {
  display:inline-flex; align-items:center; gap:6px;
  padding:5px 12px;
  border-radius:20px;
  font-size:12px; font-weight:700;
  margin-bottom:12px;
}
.cp-mining-badge.active{
  background:rgba(0,200,83,.12);
  border:1px solid rgba(0,200,83,.4);
  color:#00e676;
}
.cp-mining-badge.stopped{
  background:rgba(244,67,54,.1);
  border:1px solid rgba(244,67,54,.3);
  color:#f44336;
}
.cp-dot{
  width:8px; height:8px; border-radius:50%;
  display:inline-block;
}
.cp-dot.green{ background:#00e676; animation:cp-pulse-dot 1.5s ease-in-out infinite; box-shadow:0 0 6px #00e676; }
.cp-dot.red  { background:#f44336; animation:cp-pulse-dot 2s ease-in-out infinite; }

/* ── РАЗДЕЛИТЕЛЬ ── */
.cp-divider{
  height:1px;
  background:linear-gradient(90deg,transparent,#2a1500,transparent);
  margin:14px 0;
}
`;
document.head.appendChild(style);

// ── ЛОГ ──────────────────────────────────────────────────────
const logEntries = [];
function cpLog(msg, type) {
    const now = new Date().toLocaleTimeString('ru-RU');
    logEntries.unshift({ msg, type: type || 'ok', time: now });
    if (logEntries.length > 60) logEntries.pop();
    renderLog();
}
function renderLog() {
    const logEl = el('cpLog');
    if (!logEl) return;
    logEl.innerHTML = logEntries.map(e =>
        `<div class="cp-log-entry ${e.type === 'ok' ? '' : e.type}">[${e.time}] ${e.msg}</div>`
    ).join('');
}

// ── НАСТРОЙКИ АВТОМАТИЗАЦИИ ───────────────────────────────────
const cpSettings = {
    autoSellOil:    false,
    autoSellGas:    false,
    autoStake:      false,
    autoRestart:    false,
    sellThreshold:  80,
    stakeThreshold: 100,
};

// ── АВТО-ЦИКЛ ─────────────────────────────────────────────────
setInterval(() => {
    const app = window.rurcoinApp;
    if (!app) return;
    const oilPct = (app.oilStored / app.oilCapacity) * 100;
    const gasPct = (app.gasStored / app.gasCapacity) * 100;

    if (cpSettings.autoSellOil && oilPct >= cpSettings.sellThreshold && app.oilStored > 0) {
        const earned = app.oilStored * app.getOilSellPrice();
        app.balance += earned;
        app.oilStored = 0;
        app.saveData(); app.render();
        cpLog(`🛢️ Авто-продажа нефти: +${earned.toFixed(2)} RURC`, 'ok');
        notify(`🛢️ Авто-продажа: +${earned.toFixed(2)} RURC`, 'success');
    }
    if (cpSettings.autoSellGas && gasPct >= cpSettings.sellThreshold && app.gasStored > 0) {
        const earned = app.gasStored * app.getGasSellPrice();
        app.balance += earned;
        app.gasStored = 0;
        app.saveData(); app.render();
        cpLog(`⛽ Авто-продажа газа: +${earned.toFixed(2)} RURC`, 'ok');
        notify(`⛽ Авто-продажа: +${earned.toFixed(2)} RURC`, 'success');
    }
    if (cpSettings.autoStake && app.balance >= cpSettings.stakeThreshold) {
        const amount = Math.floor(app.balance / 2);
        app.stakedBalance += amount;
        app.balance -= amount;
        app.saveData(); app.render();
        cpLog(`💎 Авто-стейк: ${amount} RURC`, 'info');
    }
    if (cpSettings.autoRestart && !app.isMining && app.oilPumps > 0) {
        app.isMining = true;
        cpLog('🔄 Авто-перезапуск добычи', 'warn');
    }
    updateCpStats();
}, 5000);

// ── ОБНОВЛЕНИЕ СТАТИСТИКИ ─────────────────────────────────────
function updateCpStats() {
    const app = window.rurcoinApp;
    if (!app) return;
    const oilPct = Math.min(100, (app.oilStored / app.oilCapacity) * 100);
    const gasPct = Math.min(100, (app.gasStored / app.gasCapacity) * 100);

    const set = (id, val) => { const e = el(id); if (e) e.textContent = val; };
    set('cpStatBalance',  app.balance.toFixed(2));
    set('cpStatTon',      app.tonBalance.toFixed(3));
    set('cpStatOil',      app.oilStored.toFixed(1));
    set('cpStatGas',      Math.floor(app.gasStored));
    set('cpStatStaked',   app.stakedBalance.toFixed(2));
    set('cpStatRewards',  app.stakingRewards.toFixed(4));
    set('cpStatOilRate',  (app.getOilPerSec() * 3600).toFixed(2));
    set('cpStatGasRate',  (app.getGasPerSec() * 3600).toFixed(0));
    set('cpOilPct',       oilPct.toFixed(1) + '%');
    set('cpGasPct',       gasPct.toFixed(1) + '%');
    set('cpEquipment',    `${app.oilPumps} насос. / ${app.gasTowers} выш. / ${app.oilTanks + app.gasTanks} цист.`);

    const oilBar = el('cpOilBar'); if (oilBar) oilBar.style.width = oilPct + '%';
    const gasBar = el('cpGasBar'); if (gasBar) gasBar.style.width = gasPct + '%';

    const badge = el('cpMiningBadge');
    if (badge) {
        if (app.isMining) {
            badge.className = 'cp-mining-badge active';
            badge.innerHTML = '<span class="cp-dot green"></span> Добыча активна';
        } else {
            badge.className = 'cp-mining-badge stopped';
            badge.innerHTML = '<span class="cp-dot red"></span> Добыча остановлена';
        }
    }
}

// ── ДЕЙСТВИЯ ─────────────────────────────────────────────────
window.cpSellAllOil = function() {
    const app = window.rurcoinApp;
    if (!app || app.oilStored <= 0) { notify('⚠️ Нефть не накоплена', 'warn'); return; }
    const earned = app.oilStored * app.getOilSellPrice();
    app.balance += earned;
    app.transactions && app.transactions.unshift({ type: 'sell_oil', amount: earned, time: Date.now() });
    app.oilStored = 0;
    app.saveData(); app.render();
    cpLog(`🛢️ Продана нефть: +${earned.toFixed(2)} RURC`, 'ok');
    notify(`🛢️ Продано! +${earned.toFixed(2)} RURC`, 'success');
    updateCpStats();
};

window.cpSellAllGas = function() {
    const app = window.rurcoinApp;
    if (!app || app.gasStored <= 0) { notify('⚠️ Газ не накоплен', 'warn'); return; }
    const earned = app.gasStored * app.getGasSellPrice();
    app.balance += earned;
    app.transactions && app.transactions.unshift({ type: 'sell_gas', amount: earned, time: Date.now() });
    app.gasStored = 0;
    app.saveData(); app.render();
    cpLog(`⛽ Продан газ: +${earned.toFixed(2)} RURC`, 'ok');
    notify(`⛽ Продано! +${earned.toFixed(2)} RURC`, 'success');
    updateCpStats();
};

window.cpSellAll = function() {
    const app = window.rurcoinApp;
    if (!app) return;
    let total = 0;
    if (app.oilStored > 0) { total += app.oilStored * app.getOilSellPrice(); app.oilStored = 0; }
    if (app.gasStored > 0) { total += app.gasStored * app.getGasSellPrice(); app.gasStored = 0; }
    if (total <= 0) { notify('⚠️ Нечего продавать', 'warn'); return; }
    app.balance += total;
    app.saveData(); app.render();
    cpLog(`💰 Продано всё: +${total.toFixed(2)} RURC`, 'ok');
    notify(`💰 Продано всё! +${total.toFixed(2)} RURC`, 'success');
    updateCpStats();
};

window.cpToggleMining = function() {
    const app = window.rurcoinApp;
    if (!app) return;
    app.toggleMining();
    cpLog(app.isMining ? '⚡ Добыча запущена' : '⏸️ Добыча остановлена', 'warn');
    updateCpStats();
};

window.cpStakeAll = function() {
    const app = window.rurcoinApp;
    if (!app || app.balance <= 0) { notify('⚠️ Нет RURC для стейка', 'warn'); return; }
    const amount = Math.floor(app.balance);
    app.stakedBalance += amount;
    app.balance -= amount;
    app.saveData(); app.render();
    cpLog(`💎 Застейкано ${amount} RURC`, 'info');
    notify(`💎 Застейкано ${amount} RURC`, 'success');
    updateCpStats();
};

window.cpUnstakeAll = function() {
    const app = window.rurcoinApp;
    if (!app || app.stakedBalance <= 0) { notify('⚠️ Нет застейканных средств', 'warn'); return; }
    const total = app.stakedBalance + app.stakingRewards;
    app.balance += total;
    app.stakedBalance = 0; app.stakingRewards = 0;
    app.saveData(); app.render();
    cpLog(`💰 Выведено ${total.toFixed(2)} RURC`, 'ok');
    notify(`💰 Выведено ${total.toFixed(2)} RURC`, 'success');
    updateCpStats();
};

window.cpExportData = function() {
    const app = window.rurcoinApp;
    if (!app) return;
    const data = {
        balance: app.balance, tonBalance: app.tonBalance,
        oilStored: app.oilStored, gasStored: app.gasStored,
        oilPumps: app.oilPumps, gasTowers: app.gasTowers,
        oilTanks: app.oilTanks, gasTanks: app.gasTanks,
        oilCapacity: app.oilCapacity, gasCapacity: app.gasCapacity,
        stakedBalance: app.stakedBalance, stakingRewards: app.stakingRewards,
        totalMined: app.totalMined, upgrades: app.upgrades,
        exportedAt: new Date().toISOString()
    };
    const json = JSON.stringify(data, null, 2);
    const box = el('cpExportBox');
    if (box) box.textContent = json;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(json).then(() => {
            notify('📋 Скопировано в буфер', 'success');
            cpLog('📋 Данные экспортированы', 'info');
        });
    }
};

window.cpImportData = function() {
    const box = el('cpExportBox');
    if (!box || !box.textContent.trim() || box.textContent.includes('Нажми')) {
        notify('⚠️ Вставьте данные в поле', 'warn'); return;
    }
    try {
        const data = JSON.parse(box.textContent);
        const app = window.rurcoinApp;
        if (!app) return;
        Object.assign(app, data);
        app.saveData(); app.render();
        cpLog('✅ Данные импортированы', 'ok');
        notify('✅ Импорт успешен!', 'success');
        updateCpStats();
    } catch(e) {
        notify('❌ Ошибка формата JSON', 'error');
        cpLog('❌ Ошибка импорта: ' + e.message, 'err');
    }
};

window.cpResetProgress = function() {
    if (!confirm('⚠️ Сбросить весь прогресс?\nЭто действие необратимо!')) return;
    const app = window.rurcoinApp;
    if (!app) return;
    app.balance = 0; app.tonBalance = 5;
    app.oilStored = 0; app.gasStored = 0;
    app.oilPumps = 0; app.gasTowers = 0;
    app.oilTanks = 0; app.gasTanks = 0;
    app.oilCapacity = 100; app.gasCapacity = 1000;
    app.stakedBalance = 0; app.stakingRewards = 0;
    app.totalMined = 0; app.transactions = [];
    app.isMining = false;
    if (app.upgrades) Object.keys(app.upgrades).forEach(k => app.upgrades[k] = 0);
    app.saveData(); app.render();
    cpLog('🔄 Прогресс сброшен', 'warn');
    notify('🔄 Прогресс сброшен', 'warn');
    updateCpStats();
};

window.cpSetSellThreshold = function(val) {
    cpSettings.sellThreshold = parseInt(val);
    const e = el('cpSellThresholdVal'); if (e) e.textContent = val + '%';
};
window.cpSetStakeThreshold = function(val) {
    cpSettings.stakeThreshold = parseInt(val);
    const e = el('cpStakeThresholdVal'); if (e) e.textContent = val + ' RURC';
};
window.cpToggleSetting = function(key, val) {
    cpSettings[key] = val;
    cpLog(`⚙️ ${key}: ${val ? 'включено' : 'выключено'}`, 'info');
};

// ── РЕНДЕР ПАНЕЛИ ─────────────────────────────────────────────
function renderControlTab() {
    const container = el('controlPanel');
    if (!container) return;
    container.innerHTML = `

    <!-- СТАТУС + СТАТИСТИКА -->
    <div class="cp-section">
      <div class="cp-section-title">📊 Статистика</div>
      <div id="cpMiningBadge" class="cp-mining-badge stopped">
        <span class="cp-dot red"></span> Добыча остановлена
      </div>
      <div class="cp-stats-grid">
        <div class="cp-stat-card">
          <div class="cp-stat-icon">₽</div>
          <div class="cp-stat-val" id="cpStatBalance">0.00</div>
          <div class="cp-stat-lbl">Баланс RURC</div>
        </div>
        <div class="cp-stat-card">
          <div class="cp-stat-icon">💎</div>
          <div class="cp-stat-val" id="cpStatTon">0.000</div>
          <div class="cp-stat-lbl">Баланс TON</div>
        </div>
        <div class="cp-stat-card">
          <div class="cp-stat-icon">🛢️</div>
          <div class="cp-stat-val" id="cpStatOil">0.0</div>
          <div class="cp-stat-lbl">Нефть (барр.)</div>
        </div>
        <div class="cp-stat-card">
          <div class="cp-stat-icon">🔥</div>
          <div class="cp-stat-val" id="cpStatGas">0</div>
          <div class="cp-stat-lbl">Газ (м³)</div>
        </div>
        <div class="cp-stat-card">
          <div class="cp-stat-icon">🔒</div>
          <div class="cp-stat-val" id="cpStatStaked">0.00</div>
          <div class="cp-stat-lbl">Застейкано</div>
        </div>
        <div class="cp-stat-card">
          <div class="cp-stat-icon">🎁</div>
          <div class="cp-stat-val" id="cpStatRewards">0.0000</div>
          <div class="cp-stat-lbl">Награды</div>
        </div>
        <div class="cp-stat-card">
          <div class="cp-stat-icon">⚡</div>
          <div class="cp-stat-val" id="cpStatOilRate">0</div>
          <div class="cp-stat-lbl">барр/ч</div>
        </div>
        <div class="cp-stat-card">
          <div class="cp-stat-icon">💨</div>
          <div class="cp-stat-val" id="cpStatGasRate">0</div>
          <div class="cp-stat-lbl">м³/ч</div>
        </div>
      </div>
      <div style="margin-top:12px;">
        <div style="display:flex;justify-content:space-between;font-size:11px;color:#666;margin-bottom:4px;">
          <span>🛢️ Нефть</span><span id="cpOilPct">0%</span>
        </div>
        <div class="cp-bar-wrap"><div class="cp-bar-fill cp-bar-oil" id="cpOilBar" style="width:0%"></div></div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:#666;margin:8px 0 4px;">
          <span>🔥 Газ</span><span id="cpGasPct">0%</span>
        </div>
        <div class="cp-bar-wrap"><div class="cp-bar-fill cp-bar-gas" id="cpGasBar" style="width:0%"></div></div>
        <div style="font-size:10px;color:#444;margin-top:6px;text-align:center;" id="cpEquipment">—</div>
      </div>
    </div>

    <!-- БЫСТРЫЕ ДЕЙСТВИЯ -->
    <div class="cp-section">
      <div class="cp-section-title">⚡ Быстрые действия</div>
      <div class="cp-btn-grid" style="margin-bottom:10px;">
        <button class="cp-btn cp-btn-orange" onclick="cpSellAllOil()">
          <span class="cp-btn-icon">🛢️</span>
          <span class="cp-btn-label">Продать<br>нефть</span>
        </button>
        <button class="cp-btn cp-btn-green" onclick="cpSellAllGas()">
          <span class="cp-btn-icon">🔥</span>
          <span class="cp-btn-label">Продать<br>газ</span>
        </button>
      </div>
      <button class="cp-btn cp-btn-yellow cp-btn-full" onclick="cpSellAll()" style="margin-bottom:10px;">
        <span class="cp-btn-icon">💰</span>
        <span class="cp-btn-label">Продать всё сразу</span>
      </button>
      <div class="cp-btn-grid">
        <button class="cp-btn cp-btn-blue" onclick="cpToggleMining()">
          <span class="cp-btn-icon">⚙️</span>
          <span class="cp-btn-label">Вкл/Выкл<br>добычу</span>
        </button>
        <button class="cp-btn cp-btn-purple" onclick="cpStakeAll()">
          <span class="cp-btn-icon">🔒</span>
          <span class="cp-btn-label">Стейк<br>всего RURC</span>
        </button>
      </div>
      <button class="cp-btn cp-btn-green cp-btn-full" onclick="cpUnstakeAll()" style="margin-top:10px;">
        <span class="cp-btn-icon">🔓</span>
        <span class="cp-btn-label">Вывести стейк + награды</span>
      </button>
    </div>

    <!-- АВТОМАТИЗАЦИЯ -->
    <div class="cp-section">
      <div class="cp-section-title">🤖 Автоматизация</div>

      <div class="cp-toggle-row">
        <div class="cp-toggle-left">
          <span class="cp-toggle-emoji">🛢️</span>
          <div>
            <div class="cp-toggle-label">Авто-продажа нефти</div>
            <div class="cp-toggle-sub">Продаёт при заполнении цистерны</div>
          </div>
        </div>
        <label class="cp-toggle">
          <input type="checkbox" onchange="cpToggleSetting('autoSellOil',this.checked)">
          <span class="cp-toggle-slider"></span>
        </label>
      </div>

      <div class="cp-toggle-row">
        <div class="cp-toggle-left">
          <span class="cp-toggle-emoji">🔥</span>
          <div>
            <div class="cp-toggle-label">Авто-продажа газа</div>
            <div class="cp-toggle-sub">Продаёт при заполнении цистерны</div>
          </div>
        </div>
        <label class="cp-toggle">
          <input type="checkbox" onchange="cpToggleSetting('autoSellGas',this.checked)">
          <span class="cp-toggle-slider"></span>
        </label>
      </div>

      <div class="cp-toggle-row">
        <div class="cp-toggle-left">
          <span class="cp-toggle-emoji">🔒</span>
          <div>
            <div class="cp-toggle-label">Авто-стейкинг</div>
            <div class="cp-toggle-sub">Стейкает 50% при достижении порога</div>
          </div>
        </div>
        <label class="cp-toggle">
          <input type="checkbox" onchange="cpToggleSetting('autoStake',this.checked)">
          <span class="cp-toggle-slider"></span>
        </label>
      </div>

      <div class="cp-toggle-row">
        <div class="cp-toggle-left">
          <span class="cp-toggle-emoji">🔄</span>
          <div>
            <div class="cp-toggle-label">Авто-перезапуск</div>
            <div class="cp-toggle-sub">Перезапускает добычу если стоит</div>
          </div>
        </div>
        <label class="cp-toggle">
          <input type="checkbox" onchange="cpToggleSetting('autoRestart',this.checked)">
          <span class="cp-toggle-slider"></span>
        </label>
      </div>

      <div class="cp-divider"></div>

      <div class="cp-slider-wrap">
        <div class="cp-slider-label">
          Порог авто-продажи (% цистерны)
          <span id="cpSellThresholdVal">80%</span>
        </div>
        <input type="range" class="cp-slider" min="10" max="100" value="80"
               oninput="cpSetSellThreshold(this.value)">
      </div>

      <div class="cp-slider-wrap">
        <div class="cp-slider-label">
          Порог авто-стейка (RURC)
          <span id="cpStakeThresholdVal">100 RURC</span>
        </div>
        <input type="range" class="cp-slider" min="10" max="1000" value="100" step="10"
               oninput="cpSetStakeThreshold(this.value)">
      </div>
    </div>

    <!-- ЛОГ -->
    <div class="cp-section">
      <div class="cp-section-title">📋 Лог событий</div>
      <div class="cp-log" id="cpLog">
        <div class="cp-log-entry info">[--:--:--] Панель управления загружена ✅</div>
      </div>
    </div>

    <!-- ЭКСПОРТ / ИМПОРТ -->
    <div class="cp-section">
      <div class="cp-section-title">💾 Экспорт / Импорт</div>
      <div class="cp-btn-grid">
        <button class="cp-btn cp-btn-blue" onclick="cpExportData()">
          <span class="cp-btn-icon">📤</span>
          <span class="cp-btn-label">Экспорт</span>
        </button>
        <button class="cp-btn cp-btn-green" onclick="cpImportData()">
          <span class="cp-btn-icon">📥</span>
          <span class="cp-btn-label">Импорт</span>
        </button>
      </div>
      <div class="cp-export-box" id="cpExportBox" contenteditable="true">
        Нажми «Экспорт» для получения данных...
      </div>
    </div>

    <!-- ОПАСНАЯ ЗОНА -->
    <div class="cp-section" style="border-color:rgba(244,67,54,.3);">
      <div class="cp-section-title" style="color:#f44336;">
        <span style="width:3px;height:18px;background:linear-gradient(180deg,#f44336,#ff8a80);border-radius:2px;display:inline-block;box-shadow:0 0 6px #f44336;"></span>
        ⚠️ Опасная зона
      </div>
      <button class="cp-btn cp-btn-red cp-btn-full" onclick="cpResetProgress()">
        <span style="font-size:22px;">🗑️</span>
        <span style="font-size:14px;font-weight:800;">Сбросить весь прогресс</span>
      </button>
    </div>
    `;
    updateCpStats();
    renderLog();
}

// ── ИНИЦИАЛИЗАЦИЯ ─────────────────────────────────────────────
waitForApp(function(app) {
    // Кнопка вкладки
    const tabsEl = document.querySelector('.tabs');
    if (tabsEl && !document.querySelector('[data-tab="control"]')) {
        const btn = document.createElement('button');
        btn.className = 'tab-btn';
        btn.setAttribute('data-tab', 'control');
        btn.textContent = '⚙️ Управление';
        btn.addEventListener('click', () => {
            app.switchTab('control');
            renderControlTab();
        });
        tabsEl.appendChild(btn);
    }

    // Контейнер вкладки
    const contentEl = document.querySelector('.content');
    if (contentEl && !el('control')) {
        const div = document.createElement('div');
        div.className = 'tab-content';
        div.id = 'control';
        div.innerHTML = '<div id="controlPanel"></div>';
        contentEl.appendChild(div);
    }

    // Патч switchTab
    const origSwitch = app.switchTab.bind(app);
    app.switchTab = function(tabId) {
        origSwitch(tabId);
        if (tabId === 'control') setTimeout(renderControlTab, 50);
    };

    cpLog('✅ Панель управления инициализирована', 'ok');
    updateCpStats();
    setInterval(updateCpStats, 2000);
});

})();
