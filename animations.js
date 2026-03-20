// ============================================================
//  animations.js — RURCoin UI Animations
//  Ripple, particles, toast, number counter, tab transitions
// ============================================================
(function() {
'use strict';

// ── RIPPLE на кнопках ─────────────────────────────────────────
document.addEventListener('click', function(e) {
    const btn = e.target.closest('button, .eq-buy-btn, .mine-btn, .btn-stake, .cp-btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ripple = document.createElement('span');
    ripple.className = 'ripple-el';
    ripple.style.cssText = `
        position:absolute;
        width:10px;height:10px;
        left:${x - 5}px;top:${y - 5}px;
        border-radius:50%;
        background:rgba(255,255,255,0.3);
        pointer-events:none;
        animation:ripple 0.6s ease-out forwards;
    `;
    btn.style.position = btn.style.position || 'relative';
    btn.style.overflow = 'hidden';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
});

// ── TOAST УВЕДОМЛЕНИЯ ────────────────────────────────────────
let toastEl = null;
let toastTimer = null;

window.showToast = function(msg, type) {
    if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.className = 'notification-toast';
        document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.className = 'notification-toast ' + (type || '');
    // Показываем
    requestAnimationFrame(() => {
        requestAnimationFrame(() => toastEl.classList.add('show'));
    });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toastEl.classList.remove('show');
    }, 2800);
};

// Патчим showMessage приложения
function patchAppNotify() {
    const app = window.rurcoinApp;
    if (!app) return;
    const orig = app.showMessage.bind(app);
    app.showMessage = function(msg) {
        orig(msg);
        window.showToast(msg, 'info');
    };
}
setTimeout(patchAppNotify, 1000);

// ── АНИМИРОВАННЫЙ СЧЁТЧИК ────────────────────────────────────
window.animateCounter = function(el, from, to, duration, decimals) {
    if (!el) return;
    decimals = decimals || 0;
    duration = duration || 800;
    const start = performance.now();
    const diff = to - from;
    function step(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutCubic
        const ease = 1 - Math.pow(1 - progress, 3);
        const val = from + diff * ease;
        el.textContent = val.toFixed(decimals);
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
};

// ── ЧАСТИЦЫ НЕФТИ при добыче ─────────────────────────────────
function spawnOilParticle(container) {
    const p = document.createElement('div');
    const emojis = ['🛢️','💧','⚫','🔵'];
    p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    p.style.cssText = `
        position:absolute;
        font-size:${10 + Math.random()*10}px;
        left:${10 + Math.random()*80}%;
        top:${10 + Math.random()*30}%;
        pointer-events:none;
        z-index:10;
        animation:oil-drop ${1.5 + Math.random()}s ease-in forwards;
        opacity:0.9;
    `;
    container.appendChild(p);
    setTimeout(() => p.remove(), 2500);
}

// Запускаем частицы когда идёт добыча
setInterval(() => {
    const app = window.rurcoinApp;
    if (!app || !app.isMining) return;
    const rig = document.getElementById('rigVisual');
    if (!rig) return;
    if (Math.random() > 0.4) spawnOilParticle(rig);
}, 600);

// ── ПУЛЬС БАЛАНСА при изменении ──────────────────────────────
let lastBalance = 0;
setInterval(() => {
    const app = window.rurcoinApp;
    if (!app) return;
    if (app.balance !== lastBalance) {
        const el = document.getElementById('balance');
        if (el) {
            el.style.transform = 'scale(1.15)';
            el.style.transition = 'transform 0.2s';
            setTimeout(() => { el.style.transform = 'scale(1)'; }, 200);
        }
        lastBalance = app.balance;
    }
}, 1000);

// ── АНИМАЦИЯ ВКЛАДОК ─────────────────────────────────────────
// Добавляем ripple на tab-btn
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const r = document.createElement('span');
            r.className = 'ripple-el';
            r.style.cssText = `left:${x-5}px;top:${y-5}px;background:rgba(255,140,0,0.25);`;
            btn.appendChild(r);
            setTimeout(() => r.remove(), 700);
        });
    });
});

// ── АНИМАЦИЯ ЦИФР В STATS BAR ────────────────────────────────
const statIds = ['oilPumpsCount','gasTowersCount','oilTanksCount','hashrate'];
const statPrev = {};
setInterval(() => {
    statIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const val = parseFloat(el.textContent);
        if (!isNaN(val) && val !== statPrev[id]) {
            el.style.animation = 'none';
            el.offsetHeight; // reflow
            el.style.animation = 'count-up 0.4s ease';
            statPrev[id] = val;
        }
    });
}, 2000);

// ── GLOW ЭФФЕКТ на rig при активной добыче ───────────────────
setInterval(() => {
    const app = window.rurcoinApp;
    const rig = document.querySelector('.rig-emoji');
    const status = document.getElementById('rigStatus');
    if (!rig || !app) return;
    if (app.isMining) {
        rig.classList.add('active');
        if (status) { status.classList.add('active'); status.textContent = '🟢 Добыча активна'; }
    } else {
        rig.classList.remove('active');
        if (status) { status.classList.remove('active'); status.textContent = '🔴 Добыча остановлена'; }
    }
}, 500);

// ── АНИМАЦИЯ КНОПКИ MINE ─────────────────────────────────────
setInterval(() => {
    const app = window.rurcoinApp;
    const btn = document.getElementById('mineBtn');
    if (!btn || !app) return;
    if (app.isMining) {
        btn.classList.add('mining');
        btn.textContent = '⏸️ Остановить добычу';
    } else {
        btn.classList.remove('mining');
        btn.textContent = '⛽ Начать добычу';
    }
}, 500);

// ── ПЛАВНОЕ ОБНОВЛЕНИЕ БАРОВ ─────────────────────────────────
setInterval(() => {
    const app = window.rurcoinApp;
    if (!app) return;
    const oilPct = Math.min(100, (app.oilStored / app.oilCapacity) * 100) || 0;
    const gasPct = Math.min(100, (app.gasStored / app.gasCapacity) * 100) || 0;

    ['oilBar','oilBar2'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.width = oilPct + '%';
    });
    ['gasBar','gasBar2'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.width = gasPct + '%';
    });

    const oilBarPct = document.getElementById('oilBarPct');
    const gasBarPct = document.getElementById('gasBarPct');
    if (oilBarPct) oilBarPct.textContent = oilPct.toFixed(1) + '%';
    if (gasBarPct) gasBarPct.textContent = gasPct.toFixed(1) + '%';

    // Большие цистерны
    const oilFill = document.getElementById('oilFillBig');
    const gasFill = document.getElementById('gasFillBig');
    if (oilFill) oilFill.style.height = oilPct + '%';
    if (gasFill) gasFill.style.height = gasPct + '%';

    const oilPctBig = document.getElementById('oilPctBig');
    const gasPctBig = document.getElementById('gasPctBig');
    if (oilPctBig) oilPctBig.textContent = oilPct.toFixed(1) + '%';
    if (gasPctBig) gasPctBig.textContent = gasPct.toFixed(1) + '%';

    const oilStoredBig = document.getElementById('oilStoredBig');
    const gasStoredBig = document.getElementById('gasStoredBig');
    if (oilStoredBig) oilStoredBig.textContent = (app.oilStored||0).toFixed(1) + ' барр.';
    if (gasStoredBig) gasStoredBig.textContent = Math.floor(app.gasStored||0) + ' м³';
}, 800);

// ── ФОНОВЫЕ ЗВЁЗДЫ (декор) ───────────────────────────────────
function createStars() {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = `
        position:fixed;top:0;left:0;width:100%;height:100%;
        pointer-events:none;z-index:0;opacity:0.3;
    `;
    document.body.insertBefore(canvas, document.body.firstChild);
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const stars = Array.from({length:40}, () => ({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.5 + 0.3,
        a: Math.random() * Math.PI * 2,
        speed: 0.002 + Math.random() * 0.003,
        color: Math.random() > 0.7 ? '#FF6000' : '#ffffff'
    }));

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        stars.forEach(s => {
            s.a += s.speed;
            const opacity = (Math.sin(s.a) + 1) / 2 * 0.7 + 0.1;
            ctx.beginPath();
            ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
            ctx.fillStyle = s.color;
            ctx.globalAlpha = opacity;
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        requestAnimationFrame(draw);
    }
    draw();
}
createStars();

console.log('✅ RURCoin animations loaded');
})();
