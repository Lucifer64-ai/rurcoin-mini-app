// ============================================================
//  SPLASH SCREEN — анимированный экран загрузки
// ============================================================

(function() {
    // Создаём splash сразу при загрузке скрипта
    const splash = document.createElement('div');
    splash.id = 'splash-screen';
    splash.innerHTML = `
    <div class="splash-bg"></div>
    <div class="splash-content">
        <div class="splash-logo">
            <div class="splash-icon">🛢️</div>
            <div class="splash-title">RURCoin</div>
            <div class="splash-subtitle">Нефть &amp; Газ</div>
        </div>
        <div class="splash-loader">
            <div class="splash-bar">
                <div class="splash-bar-fill" id="splash-bar-fill"></div>
            </div>
            <div class="splash-status" id="splash-status">Инициализация...</div>
        </div>
        <div class="splash-version">v1.0.0</div>
    </div>`;

    const style = document.createElement('style');
    style.textContent = `
    #splash-screen {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #0d1117;
        transition: opacity 0.5s ease, transform 0.5s ease;
    }
    #splash-screen.hiding {
        opacity: 0;
        transform: scale(1.05);
        pointer-events: none;
    }
    .splash-bg {
        position: absolute;
        inset: 0;
        background:
            radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,107,0,0.12) 0%, transparent 70%),
            radial-gradient(ellipse 40% 30% at 80% 80%, rgba(255,107,0,0.06) 0%, transparent 60%);
        animation: splash-pulse 3s ease-in-out infinite;
    }
    @keyframes splash-pulse {
        0%,100% { opacity: 0.7; }
        50%      { opacity: 1; }
    }
    .splash-content {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 32px;
        padding: 40px 32px;
        width: 100%;
        max-width: 320px;
    }
    .splash-logo {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
    }
    .splash-icon {
        font-size: 72px;
        animation: splash-float 2s ease-in-out infinite;
        filter: drop-shadow(0 0 20px rgba(255,107,0,0.5));
    }
    @keyframes splash-float {
        0%,100% { transform: translateY(0); }
        50%      { transform: translateY(-8px); }
    }
    .splash-title {
        font-family: 'Orbitron', 'Courier New', monospace;
        font-size: 32px;
        font-weight: 900;
        letter-spacing: 4px;
        background: linear-gradient(135deg, #FF6B00, #FFD700, #FF6B00);
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: shimmer-text 2s linear infinite;
    }
    @keyframes shimmer-text {
        0%   { background-position: 0% center; }
        100% { background-position: 200% center; }
    }
    .splash-subtitle {
        font-size: 13px;
        letter-spacing: 3px;
        text-transform: uppercase;
        color: rgba(255,255,255,0.35);
    }
    .splash-loader {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
    }
    .splash-bar {
        width: 100%;
        height: 3px;
        background: rgba(255,255,255,0.06);
        border-radius: 2px;
        overflow: hidden;
    }
    .splash-bar-fill {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #FF6B00, #FFD700);
        border-radius: 2px;
        transition: width 0.3s ease;
        box-shadow: 0 0 8px rgba(255,107,0,0.6);
    }
    .splash-status {
        font-size: 11px;
        color: rgba(255,255,255,0.3);
        letter-spacing: 1px;
        min-height: 16px;
    }
    .splash-version {
        font-size: 10px;
        color: rgba(255,255,255,0.15);
        letter-spacing: 2px;
        position: absolute;
        bottom: 20px;
    }
    `;

    document.head.appendChild(style);
    document.body.appendChild(splash);

    // ── Прогресс загрузки ────────────────────────────────
    const steps = [
        { pct: 15, text: 'Загрузка ресурсов...' },
        { pct: 35, text: 'Инициализация движка...' },
        { pct: 55, text: 'Подключение к сети...' },
        { pct: 75, text: 'Загрузка данных игрока...' },
        { pct: 90, text: 'Запуск добычи...' },
        { pct: 100, text: 'Готово!' },
    ];

    let stepIdx = 0;
    const bar    = document.getElementById('splash-bar-fill');
    const status = document.getElementById('splash-status');

    function nextStep() {
        if (stepIdx >= steps.length) return;
        const s = steps[stepIdx++];
        if (bar)    bar.style.width = s.pct + '%';
        if (status) status.textContent = s.text;
    }

    nextStep();
    const interval = setInterval(() => {
        if (stepIdx < steps.length - 1) {
            nextStep();
        } else {
            clearInterval(interval);
        }
    }, 400);

    // ── Скрываем splash после загрузки страницы ──────────
    function hideSplash() {
        nextStep(); // 100%
        setTimeout(() => {
            splash.classList.add('hiding');
            setTimeout(() => splash.remove(), 500);
        }, 600);
    }

    if (document.readyState === 'complete') {
        setTimeout(hideSplash, 800);
    } else {
        window.addEventListener('load', () => setTimeout(hideSplash, 800));
    }

    window.hideSplash = hideSplash;
})();
