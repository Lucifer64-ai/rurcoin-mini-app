// ============================================================
//  sound.js — RURCoin Sound Effects
//  Звуки при нажатии кнопок (Web Audio API, без файлов)
// ============================================================
(function() {
'use strict';

let ctx = null;

function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
}

// ── ГЕНЕРАТОРЫ ЗВУКОВ ────────────────────────────────────────

// Клик — короткий щелчок (для обычных кнопок)
function playClick() {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain); gain.connect(c.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, c.currentTime + 0.06);
    gain.gain.setValueAtTime(0.18, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.08);
}

// Монета — звук получения денег
function playCoin() {
    const c = getCtx();
    [0, 0.05, 0.1].forEach((delay, i) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain); gain.connect(c.destination);
        osc.type = 'triangle';
        const freq = [880, 1100, 1320][i];
        osc.frequency.setValueAtTime(freq, c.currentTime + delay);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.05, c.currentTime + delay + 0.08);
        gain.gain.setValueAtTime(0.15, c.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + 0.18);
        osc.start(c.currentTime + delay);
        osc.stop(c.currentTime + delay + 0.2);
    });
}

// Насос — механический стук (добыча)
function playPump() {
    const c = getCtx();
    const buf = c.createBuffer(1, c.sampleRate * 0.12, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * 0.04));
    }
    const src = c.createBufferSource();
    const gain = c.createGain();
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 180;
    filter.Q.value = 1.5;
    src.buffer = buf;
    src.connect(filter); filter.connect(gain); gain.connect(c.destination);
    gain.gain.setValueAtTime(0.35, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
    src.start(c.currentTime);
}

// Успех — восходящий аккорд
function playSuccess() {
    const c = getCtx();
    [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain); gain.connect(c.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        const t = c.currentTime + i * 0.07;
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.start(t);
        osc.stop(t + 0.35);
    });
}

// Ошибка — нисходящий звук
function playError() {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain); gain.connect(c.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, c.currentTime + 0.25);
    gain.gain.setValueAtTime(0.15, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.28);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.3);
}

// Переключение вкладки — лёгкий свуп
function playTab() {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain); gain.connect(c.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, c.currentTime + 0.07);
    gain.gain.setValueAtTime(0.1, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.12);
}

// Стейк — глубокий гул
function playStake() {
    const c = getCtx();
    [110, 165, 220].forEach((freq, i) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain); gain.connect(c.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, c.currentTime + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4);
        osc.start(c.currentTime + i * 0.04);
        osc.stop(c.currentTime + 0.45);
    });
}

// Покупка оборудования — кассовый звук
function playBuy() {
    const c = getCtx();
    // Щелчок кассы
    [0, 0.08].forEach(delay => {
        const buf = c.createBuffer(1, c.sampleRate * 0.05, c.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * 0.015));
        }
        const src = c.createBufferSource();
        const gain = c.createGain();
        src.buffer = buf;
        src.connect(gain); gain.connect(c.destination);
        gain.gain.value = 0.25;
        src.start(c.currentTime + delay);
    });
    // + монетка
    setTimeout(playCoin, 160);
}

// Газовый свист — для газовых операций
function playGas() {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    const filter = c.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    osc.connect(filter); filter.connect(gain); gain.connect(c.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, c.currentTime + 0.15);
    gain.gain.setValueAtTime(0.08, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.22);
}

// ── ПУБЛИЧНЫЙ API ─────────────────────────────────────────────
window.SFX = {
    click:   playClick,
    coin:    playCoin,
    pump:    playPump,
    success: playSuccess,
    error:   playError,
    tab:     playTab,
    stake:   playStake,
    buy:     playBuy,
    gas:     playGas,
};

// ── НАВЕШИВАЕМ ЗВУКИ НА КНОПКИ ───────────────────────────────
function attachSounds() {
    document.querySelectorAll('button, .tab-btn, .cp-btn').forEach(btn => {
        if (btn._sfxAttached) return;
        btn._sfxAttached = true;

        btn.addEventListener('pointerdown', function(e) {
            const text = (this.textContent || '').toLowerCase();
            const id   = (this.id || '').toLowerCase();
            const cls  = (this.className || '').toLowerCase();

            // Вкладки
            if (cls.includes('tab-btn')) { playTab(); return; }

            // Продажа нефти
            if (text.includes('нефт') || id.includes('oil')) { playCoin(); return; }

            // Продажа газа
            if (text.includes('газ') || id.includes('gas')) { playGas(); return; }

            // Добыча / насос
            if (text.includes('добыч') || text.includes('mine') || id.includes('mine')) { playPump(); return; }

            // Покупка оборудования
            if (text.includes('купить') || text.includes('buy') || cls.includes('buy')) { playBuy(); return; }

            // Стейкинг
            if (text.includes('стейк') || text.includes('stake') || text.includes('вывест')) { playStake(); return; }

            // Успех / подтверждение
            if (text.includes('подтверд') || text.includes('отправ') || text.includes('перевод')) { playSuccess(); return; }

            // Сброс / ошибка
            if (text.includes('сброс') || text.includes('reset') || text.includes('удал')) { playError(); return; }

            // Обменник
            if (text.includes('обмен') || text.includes('swap') || text.includes('exchange')) { playCoin(); return; }

            // Дефолт
            playClick();
        }, { passive: true });
    });
}

// Первичная навеска
document.addEventListener('DOMContentLoaded', () => {
    attachSounds();
    // Повторно навешиваем при динамическом добавлении кнопок
    const obs = new MutationObserver(() => attachSounds());
    obs.observe(document.body, { childList: true, subtree: true });
});

// Если DOM уже загружен
if (document.readyState !== 'loading') {
    attachSounds();
    const obs = new MutationObserver(() => attachSounds());
    obs.observe(document.body, { childList: true, subtree: true });
}

// Разблокировка AudioContext на первый тач (iOS)
document.addEventListener('touchstart', () => {
    if (ctx && ctx.state === 'suspended') ctx.resume();
}, { once: true, passive: true });

console.log('[SFX] Sound system loaded ✅');
})();
