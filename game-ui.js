/* ═══════════════════════════════════════════════════
   RURCOIN — Game UI Effects
   Плавающие монеты, частицы, игровые анимации
═══════════════════════════════════════════════════ */

// ── Плавающие монеты при добыче ──────────────────
function spawnFloatCoin(x, y, text) {
    const el = document.createElement('div');
    el.className = 'float-coin';
    el.textContent = text || '+🪙';
    el.style.left = (x - 20) + 'px';
    el.style.top  = (y - 20) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1300);
}

// ── Клик по кнопке добычи — спавн монет ──────────
document.addEventListener('DOMContentLoaded', () => {
    const oilBtn = document.getElementById('mineBtnOil');
    const gasBtn = document.getElementById('mineBtnGas');

    function addClickEffect(btn, color) {
        if (!btn) return;
        btn.addEventListener('click', (e) => {
            const rect = btn.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    const ox = cx + (Math.random() - .5) * 80;
                    const oy = cy + (Math.random() - .5) * 40;
                    spawnFloatCoin(ox, oy, color === 'oil' ? '+⛽' : '+🔥');
                }, i * 80);
            }
            // Вибрация
            if (navigator.vibrate) navigator.vibrate(30);
        });
    }

    addClickEffect(oilBtn, 'oil');
    addClickEffect(gasBtn, 'gas');

    // ── Пульс на активных кнопках ──────────────────
    function updateMineButtons() {
        const app = window.rurcoinApp;
        if (!app) return;
        const isMining = app.isMining;
        if (oilBtn) oilBtn.classList.toggle('mining', isMining);
        if (gasBtn) gasBtn.classList.toggle('mining', isMining);
    }

    setInterval(updateMineButtons, 500);

    // ── Игровой тост ───────────────────────────────
    window.showGameToast = function(msg, type) {
        let el = document.getElementById('gameToast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'gameToast';
            el.style.cssText = `
                position:fixed;top:70px;left:50%;
                transform:translateX(-50%) translateY(-10px);
                background:var(--bg3);border-radius:10px;
                padding:10px 20px;font-size:12px;color:var(--txt);
                z-index:999;opacity:0;transition:all .3s;
                white-space:nowrap;pointer-events:none;
                font-family:var(--fm);border:1px solid var(--or);
                box-shadow:0 0 24px rgba(255,107,0,.55);
            `;
            document.body.appendChild(el);
        }
        const colors = {
            success: 'rgba(57,255,20,.6)',
            error:   'rgba(255,51,51,.6)',
            info:    'rgba(0,212,255,.6)',
        };
        el.style.borderColor = colors[type] || 'rgba(255,107,0,.6)';
        el.style.boxShadow   = `0 0 24px ${colors[type] || 'rgba(255,107,0,.55)'}`;
        el.textContent = msg;
        el.style.opacity = '1';
        el.style.transform = 'translateX(-50%) translateY(0)';
        clearTimeout(el._t);
        el._t = setTimeout(() => {
            el.style.opacity = '0';
            el.style.transform = 'translateX(-50%) translateY(-10px)';
        }, 2500);
    };

    // ── Счётчик добычи — анимация цифр ─────────────
    function animateNumber(el, from, to, duration) {
        if (!el) return;
        const start = performance.now();
        const diff  = to - from;
        function step(now) {
            const p = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            el.textContent = (from + diff * ease).toFixed(2);
            if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }
    window.animateNumber = animateNumber;

    // ── Частицы на фоне (звёзды) ───────────────────
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:0;opacity:.4;';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let W, H, stars = [];

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 80; i++) {
        stars.push({
            x: Math.random() * 1000,
            y: Math.random() * 1000,
            r: Math.random() * 1.2 + .2,
            a: Math.random(),
            s: Math.random() * .005 + .002,
        });
    }

    function drawStars() {
        ctx.clearRect(0, 0, W, H);
        stars.forEach(s => {
            s.a += s.s;
            if (s.a > 1) s.s = -Math.abs(s.s);
            if (s.a < 0) s.s =  Math.abs(s.s);
            ctx.beginPath();
            ctx.arc(s.x % W, s.y % H, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,200,100,${s.a * .6})`;
            ctx.fill();
        });
        requestAnimationFrame(drawStars);
    }
    drawStars();

    // ── Уровень игрока в хедере ─────────────────────
    function updatePlayerLevel() {
        const app = window.rurcoinApp;
        if (!app) return;
        const total = app.totalMined || 0;
        const level = Math.floor(Math.log10(Math.max(total, 1) + 1)) + 1;
        const lvlEl = document.getElementById('playerLevel');
        if (lvlEl) lvlEl.textContent = 'LVL ' + level;
    }
    setInterval(updatePlayerLevel, 2000);
});
