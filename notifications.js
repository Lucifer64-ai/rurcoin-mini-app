// ============================================================
//  RURCoin — Система уведомлений
//  Поддерживает: toast, push (Telegram), звук, вибрацию
// ============================================================

// ── Конфиг ───────────────────────────────────────────────────
const NOTIFY_CONFIG = {
    duration   : 3500,   // мс — как долго показывать toast
    maxVisible : 4,      // максимум одновременных уведомлений
    position   : 'top',  // 'top' | 'bottom'
    sounds     : true,   // звуковые сигналы
    vibration  : true,   // вибрация (мобильные)
};

// Очередь активных уведомлений
const _notifyQueue = [];
let   _notifyContainer = null;

// ── Типы уведомлений ─────────────────────────────────────────
const NOTIFY_TYPES = {
    success : { icon: '✅', color: '#4ade80', bg: 'rgba(74,222,128,0.12)', border: '#4ade80' },
    error   : { icon: '❌', color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: '#f87171' },
    warning : { icon: '⚠️', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: '#fbbf24' },
    info    : { icon: 'ℹ️', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: '#60a5fa' },
    mining  : { icon: '⛏️', color: '#FF8C00', bg: 'rgba(255,140,0,0.12)',   border: '#FF8C00' },
    tx      : { icon: '💸', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: '#a78bfa' },
    reward  : { icon: '🏆', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)',  border: '#fbbf24' },
};

// ── Инициализация контейнера ──────────────────────────────────
function _initNotifyContainer() {
    if (_notifyContainer) return;

    _notifyContainer = document.createElement('div');
    _notifyContainer.id = 'notifyContainer';
    Object.assign(_notifyContainer.style, {
        position      : 'fixed',
        top           : NOTIFY_CONFIG.position === 'top' ? '16px' : 'auto',
        bottom        : NOTIFY_CONFIG.position === 'bottom' ? '80px' : 'auto',
        left          : '50%',
        transform     : 'translateX(-50%)',
        zIndex        : '99999',
        display       : 'flex',
        flexDirection : 'column',
        gap           : '8px',
        width         : 'calc(100% - 32px)',
        maxWidth      : '420px',
        pointerEvents : 'none',
    });
    document.body.appendChild(_notifyContainer);
}

// ── Основная функция ──────────────────────────────────────────
/**
 * Показать уведомление
 * @param {string} message  — текст уведомления
 * @param {string} type     — success | error | warning | info | mining | tx | reward
 * @param {object} options  — { duration, title, action, actionLabel, persistent }
 */
function showNotification(message, type = 'info', options = {}) {
    _initNotifyContainer();

    const cfg  = NOTIFY_TYPES[type] || NOTIFY_TYPES.info;
    const dur  = options.duration ?? NOTIFY_CONFIG.duration;
    const id   = 'n_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);

    // Убираем старые если слишком много
    while (_notifyQueue.length >= NOTIFY_CONFIG.maxVisible) {
        _removeNotify(_notifyQueue[0]);
    }

    // Создаём элемент
    const el = document.createElement('div');
    el.id = id;
    Object.assign(el.style, {
        background    : cfg.bg,
        border        : `1px solid ${cfg.border}`,
        borderLeft    : `4px solid ${cfg.border}`,
        borderRadius  : '12px',
        padding       : '12px 14px',
        display       : 'flex',
        alignItems    : 'flex-start',
        gap           : '10px',
        backdropFilter: 'blur(12px)',
        boxShadow     : `0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px ${cfg.border}22`,
        pointerEvents : 'all',
        cursor        : 'pointer',
        transition    : 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        opacity       : '0',
        transform     : 'translateY(-20px) scale(0.95)',
        userSelect    : 'none',
        maxWidth      : '100%',
        boxSizing     : 'border-box',
    });

    // Прогресс-бар
    const progressBar = !options.persistent ? `
        <div style="position:absolute;bottom:0;left:0;height:2px;
                    background:${cfg.border};border-radius:0 0 12px 12px;
                    width:100%;transform-origin:left;
                    animation:notifyProgress ${dur}ms linear forwards;">
        </div>` : '';

    el.style.position = 'relative';
    el.style.overflow = 'hidden';

    el.innerHTML = `
        <div style="font-size:20px;line-height:1;flex-shrink:0;margin-top:1px;">${cfg.icon}</div>
        <div style="flex:1;min-width:0;">
            ${options.title
                ? `<div style="font-size:12px;font-weight:700;color:${cfg.color};
                               margin-bottom:3px;letter-spacing:0.3px;">${options.title}</div>`
                : ''}
            <div style="font-size:13px;color:#e0e0e0;line-height:1.4;word-break:break-word;">
                ${message}
            </div>
            ${options.action
                ? `<button onclick="${options.action}" style="margin-top:8px;padding:4px 10px;
                       background:${cfg.border}22;border:1px solid ${cfg.border};
                       border-radius:6px;color:${cfg.color};font-size:11px;
                       cursor:pointer;font-weight:600;">
                       ${options.actionLabel || 'Открыть'}
                   </button>`
                : ''}
        </div>
        <button onclick="document.getElementById('${id}') && _removeNotify('${id}')"
            style="background:none;border:none;color:#555;font-size:16px;
                   cursor:pointer;padding:0;line-height:1;flex-shrink:0;
                   transition:color 0.2s;"
            onmouseover="this.style.color='#fff'"
            onmouseout="this.style.color='#555'">✕</button>
        ${progressBar}
    `;

    // Клик по уведомлению — закрыть
    el.addEventListener('click', (e) => {
        if (!e.target.closest('button[onclick]')) _removeNotify(id);
    });

    _notifyContainer.appendChild(el);
    _notifyQueue.push(id);

    // Анимация появления
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            el.style.opacity   = '1';
            el.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Звук и вибрация
    _playNotifyFeedback(type);

    // Автоудаление
    if (!options.persistent) {
        setTimeout(() => _removeNotify(id), dur);
    }

    return id;
}

// ── Удаление уведомления ──────────────────────────────────────
function _removeNotify(id) {
    const el = document.getElementById(id);
    if (!el) return;

    el.style.opacity   = '0';
    el.style.transform = 'translateY(-10px) scale(0.95)';
    el.style.maxHeight = el.offsetHeight + 'px';

    setTimeout(() => {
        el.style.maxHeight  = '0';
        el.style.padding    = '0';
        el.style.marginTop  = '0';
        el.style.overflow   = 'hidden';
    }, 200);

    setTimeout(() => {
        el.remove();
        const idx = _notifyQueue.indexOf(id);
        if (idx !== -1) _notifyQueue.splice(idx, 1);
    }, 400);
}

// ── Звук и вибрация ───────────────────────────────────────────
function _playNotifyFeedback(type) {
    // Вибрация
    if (NOTIFY_CONFIG.vibration && navigator.vibrate) {
        const patterns = {
            success : [50],
            error   : [100, 50, 100],
            warning : [80, 40, 80],
            reward  : [50, 30, 50, 30, 100],
            mining  : [30],
            tx      : [60, 30, 60],
            info    : [30],
        };
        navigator.vibrate(patterns[type] || [30]);
    }

    // Звук через Web Audio API
    if (NOTIFY_CONFIG.sounds && window.AudioContext) {
        try {
            const ctx  = new (window.AudioContext || window.webkitAudioContext)();
            const osc  = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            const freqs = {
                success : [523, 659],
                error   : [220, 180],
                warning : [440, 380],
                reward  : [523, 659, 784],
                mining  : [330],
                tx      : [440, 523],
                info    : [440],
            };
            const notes = freqs[type] || [440];

            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

            osc.type = 'sine';
            notes.forEach((freq, i) => {
                osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
            });

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.4);
        } catch (e) { /* silent */ }
    }
}

// ── CSS анимации ──────────────────────────────────────────────
(function injectNotifyCSS() {
    if (document.getElementById('notifyCSS')) return;
    const style = document.createElement('style');
    style.id = 'notifyCSS';
    style.textContent = `
        @keyframes notifyProgress {
            from { transform: scaleX(1); }
            to   { transform: scaleX(0); }
        }
        #notifyContainer > div {
            transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1),
                        max-height 0.3s ease, padding 0.3s ease;
        }
    `;
    document.head.appendChild(style);
})();

// ── Шорткаты ─────────────────────────────────────────────────
const notify = {
    success : (msg, opts) => showNotification(msg, 'success', opts),
    error   : (msg, opts) => showNotification(msg, 'error',   opts),
    warning : (msg, opts) => showNotification(msg, 'warning', opts),
    info    : (msg, opts) => showNotification(msg, 'info',    opts),
    mining  : (msg, opts) => showNotification(msg, 'mining',  opts),
    tx      : (msg, opts) => showNotification(msg, 'tx',      opts),
    reward  : (msg, opts) => showNotification(msg, 'reward',  opts),
};

// ── Telegram WebApp уведомления ───────────────────────────────
function tgNotify(message, type = 'info') {
    // Показываем toast в приложении
    showNotification(message, type);

    // Haptic feedback через Telegram WebApp API
    if (window.Telegram?.WebApp?.HapticFeedback) {
        const hf = window.Telegram.WebApp.HapticFeedback;
        if (type === 'success') hf.notificationOccurred('success');
        else if (type === 'error') hf.notificationOccurred('error');
        else if (type === 'warning') hf.notificationOccurred('warning');
        else hf.impactOccurred('light');
    }
}

// ── Примеры использования (для разработки) ───────────────────
/*

// Базовые уведомления:
showNotification('Операция выполнена!', 'success');
showNotification('Ошибка подключения', 'error');
showNotification('Проверьте данные', 'warning');
showNotification('Новый блок найден', 'info');

// Через шорткаты:
notify.success('RURC успешно куплены!');
notify.error('Недостаточно TON на балансе');
notify.mining('⛏️ Добыто 100 RURC!');
notify.tx('Транзакция отправлена');
notify.reward('🏆 Получена награда за блок!');

// С заголовком:
notify.success('Обмен выполнен', {
    title: 'Обменник RURC',
    duration: 5000
});

// С кнопкой действия:
notify.tx('Транзакция отправлена', {
    title: 'Перевод RURC',
    action: "window.open('https://tonscan.org')",
    actionLabel: '🔍 Посмотреть в блокчейне',
    duration: 8000
});

// Постоянное (не исчезает само):
const id = notify.warning('Кошелёк не подключён', { persistent: true });
// Закрыть вручную:
_removeNotify(id);

// Через Telegram WebApp (с haptic feedback):
tgNotify('Майнинг запущен!', 'mining');
tgNotify('Ошибка транзакции', 'error');

*/

// ── Экспорт ───────────────────────────────────────────────────
window.showNotification = showNotification;
window.tgNotify         = tgNotify;
window.notify           = notify;
window._removeNotify    = _removeNotify;
