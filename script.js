// ── Полифилл showToast ──────────────────────────────────────────
if (typeof window.showToast !== 'function') {
    window.showToast = function(msg, type) {
        const el = document.createElement('div');
        el.textContent = msg;
        el.style.cssText = [
            'position:fixed','bottom:80px','left:50%','transform:translateX(-50%)',
            'background:' + (type==='error'?'#c0392b':type==='success'?'#27ae60':'#1565C0'),
            'color:#fff','padding:10px 20px','border-radius:12px','font-size:14px',
            'z-index:99999','pointer-events:none','max-width:80vw','text-align:center',
            'box-shadow:0 4px 20px rgba(0,0,0,0.4)'
        ].join(';');
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    };
}
if (typeof window.showNotification !== 'function') {
    window.showNotification = function(msg, type) { window.showToast(msg, type); };
}

// RURCoin Oil & Gas â Main Script
// fix: event delegation Ð´Ð»Ñ Ð²ÐºÐ»Ð°Ð´Ð¾Ðº (ÑÐ°Ð±Ð¾ÑÐ°ÐµÑ Ñ Ð´Ð¸Ð½Ð°Ð¼Ð¸ÑÐµÑÐºÐ¸Ð¼Ð¸ ÐºÐ½Ð¾Ð¿ÐºÐ°Ð¼Ð¸)

class RURCoinMiner {
    constructor() {
        this.balance = 0;
        this.tonBalance = 0;
        this.stakedBalance = 0;
        this.stakingRewards = 0;
        this.totalMined = 0;
        this.oilPumps = 0;
        this.gasTowers = 0;
        this.oilTanks = 0;
        this.gasTanks = 0;
        this.oilStored = 0;
        this.gasStored = 0;
        this.oilCapacity = 100;
        this.gasCapacity = 1000;
        this.isMining = false;
        this.upgrades = {};
        this.transactions = [];
        this.lastUpdate = Date.now();
        this.loadData();
        this.startMiningLoop();
        this.startStakingLoop();
        this.render();
    }

    loadData() {
        try {
            const saved = JSON.parse(localStorage.getItem('rurcoin_data') || '{}');
            const numFields = ['balance','tonBalance','stakedBalance','stakingRewards',
                'totalMined','oilPumps','gasTowers','oilTanks','oilStored','gasStored',
                'oilCapacity','gasCapacity'];
            numFields.forEach(k => {
                if (saved[k] !== undefined) {
                    const v = parseFloat(saved[k]);
                    saved[k] = Number.isFinite(v) ? v : 0;
                }
            });
            Object.assign(this, saved);
            this.lastUpdate = saved.lastUpdate || Date.now();
            this.isMining = saved.isMining ?? false;
            this.upgrades = (saved.upgrades && typeof saved.upgrades === 'object') ? saved.upgrades : {};
        } catch(e) {
            console.warn('Load error:', e);
            this.balance = 0; this.tonBalance = 0; this.stakedBalance = 0;
        }
    }

    saveData() {
        localStorage.setItem('rurcoin_data', JSON.stringify({
            balance: this.balance,
            tonBalance: this.tonBalance,
            stakedBalance: this.stakedBalance,
            stakingRewards: this.stakingRewards,
            totalMined: this.totalMined,
            oilPumps: this.oilPumps,
            gasTowers: this.gasTowers,
            oilTanks: this.oilTanks,
            gasTanks: this.gasTanks,
            oilStored: this.oilStored,
            gasStored: this.gasStored,
            oilCapacity: this.oilCapacity,
            gasCapacity: this.gasCapacity,
            isMining: this.isMining,
            upgrades: this.upgrades,
            transactions: (this.transactions || []).slice(0, 50),
            lastUpdate: Date.now()
        }));
    }

    getOilPerSec() { return this.oilPumps * 0.05 * (1 + (this.upgrades.oilSpeed || 0) * 0.2); }
    getGasPerSec() { return this.gasTowers * 2 * (1 + (this.upgrades.gasSpeed || 0) * 0.2); }
    getOilSellPrice() { return 2.5 * (1 + (this.upgrades.oilPrice || 0) * 0.15); }
    getGasSellPrice() { return 0.8 * (1 + (this.upgrades.gasPrice || 0) * 0.15); }

    startMiningLoop() {
        // ÐÑÑÐ»Ð°Ð¹Ð½-Ð¿ÑÐ¾Ð³ÑÐµÑÑ
        const elapsed = (Date.now() - (this.lastUpdate || Date.now())) / 1000;
        if (elapsed > 0 && this.isMining) {
            const oilGained = Math.min(this.getOilPerSec() * elapsed, this.oilCapacity - this.oilStored);
            const gasGained = Math.min(this.getGasPerSec() * elapsed, this.gasCapacity - this.gasStored);
            this.oilStored = Math.min(this.oilCapacity, this.oilStored + oilGained);
            this.gasStored = Math.min(this.gasCapacity, this.gasStored + gasGained);
            this.lastUpdate = Date.now();
            this.saveData();
        }
        setInterval(() => {
            if (!this.isMining) return;
            const oil = this.getOilPerSec() / 10;
            const gas = this.getGasPerSec() / 10;
            this.oilStored = Math.min(this.oilCapacity, this.oilStored + oil);
            this.gasStored = Math.min(this.gasCapacity, this.gasStored + gas);
            this.totalMined += oil + gas * 0.01;
            this.saveData();
            this.render();
        }, 100);
    }

    startStakingLoop() {
        setInterval(() => {
            if (this.stakedBalance > 0) {
                this.stakingRewards += this.stakedBalance * 0.0001;
                this.saveData();
            }
        }, 10000);
    }

    toggleMining() {
        this.isMining = !this.isMining;
        if (this.isMining) {
            this.lastUpdate = Date.now();
        }
        this.saveData();
        this.render();
    }

    sellOil() {
        if (this.oilStored <= 0) return;
        const earned = Number(this.oilStored) * Number(this.getOilSellPrice());
        if (!Number.isFinite(earned)) return;
        this.balance += earned;
        this.transactions.unshift({ type: 'sell_oil', amount: earned, time: Date.now() });
        this.oilStored = 0;
        this.saveData();
        this.render();
        this.showMessage('ð¢ï¸ ÐÑÐ¾Ð´Ð°Ð½Ð¾! +' + earned.toFixed(2) + ' RURC');
    }

    sellGas() {
        if (this.gasStored <= 0) return;
        const earned = Number(this.gasStored) * Number(this.getGasSellPrice());
        if (!Number.isFinite(earned)) return;
        this.balance += earned;
        this.transactions.unshift({ type: 'sell_gas', amount: earned, time: Date.now() });
        this.gasStored = 0;
        this.saveData();
        this.render();
        this.showMessage('ð¥ ÐÑÐ¾Ð´Ð°Ð½Ð¾! +' + earned.toFixed(2) + ' RURC');
    }

    buyOilPump() {
        const cost = this.getOilPumpCost();
        if (this.balance < cost) { this.showMessage('â ÐÐµÐ´Ð¾ÑÑÐ°ÑÐ¾ÑÐ½Ð¾ RURC'); return; }
        this.balance -= cost;
        this.oilPumps++;
        if (!this.isMining && this.oilPumps === 1) this.isMining = true;
        this.saveData();
        this.render();
        this.showMessage('ð¢ï¸ ÐÐ°ÑÐ¾Ñ ÐºÑÐ¿Ð»ÐµÐ½! ÐÑÐµÐ³Ð¾: ' + this.oilPumps);
    }

    buyGasTower() {
        const cost = this.getGasTowerCost();
        if (this.balance < cost) { this.showMessage('â ÐÐµÐ´Ð¾ÑÑÐ°ÑÐ¾ÑÐ½Ð¾ RURC'); return; }
        this.balance -= cost;
        this.gasTowers++;
        if (!this.isMining && this.gasTowers === 1) this.isMining = true;
        this.saveData();
        this.render();
        this.showMessage('ðï¸ ÐÑÑÐºÐ° ÐºÑÐ¿Ð»ÐµÐ½Ð°! ÐÑÐµÐ³Ð¾: ' + this.gasTowers);
    }

    buyOilTank() {
        const cost = this.getOilTankCost();
        if (this.balance < cost) { this.showMessage('â ÐÐµÐ´Ð¾ÑÑÐ°ÑÐ¾ÑÐ½Ð¾ RURC'); return; }
        this.balance -= cost;
        this.oilTanks++;
        this.oilCapacity += 50;
        this.saveData();
        this.render();
        this.showMessage('ð¢ï¸ Ð¦Ð¸ÑÑÐµÑÐ½Ð° ÐºÑÐ¿Ð»ÐµÐ½Ð°! ÐÐ¼ÐºÐ¾ÑÑÑ: ' + this.oilCapacity);
    }

    buyGasTank() {
        const cost = this.getGasTankCost();
        if (this.balance < cost) { this.showMessage('â ÐÐµÐ´Ð¾ÑÑÐ°ÑÐ¾ÑÐ½Ð¾ RURC'); return; }
        this.balance -= cost;
        this.gasTanks++;
        this.gasCapacity += 500;
        this.saveData();
        this.render();
        this.showMessage('â½ Ð¦Ð¸ÑÑÐµÑÐ½Ð° ÐºÑÐ¿Ð»ÐµÐ½Ð°! ÐÐ¼ÐºÐ¾ÑÑÑ: ' + this.gasCapacity);
    }

    getOilPumpCost() { return Math.floor(10 * Math.pow(1.5, this.oilPumps)); }
    getGasTowerCost() { return Math.floor(25 * Math.pow(1.6, this.gasTowers)); }
    getOilTankCost() { return Math.floor(50 * Math.pow(1.4, this.oilTanks)); }
    getGasTankCost() { return Math.floor(80 * Math.pow(1.4, this.gasTanks)); }

    stake(amount) {
        if (amount <= 0 || this.balance < amount) { this.showMessage('â ÐÐµÐ´Ð¾ÑÑÐ°ÑÐ¾ÑÐ½Ð¾ RURC'); return; }
        this.balance -= amount;
        this.stakedBalance += amount;
        this.saveData();
        this.render();
        this.showMessage('ð ÐÐ°ÑÑÐµÐ¹ÐºÐ°Ð½Ð¾ ' + amount.toFixed(2) + ' RURC');
    }

    unstake() {
        if (this.stakedBalance <= 0) { this.showMessage('â ÐÐµÑ Ð·Ð°ÑÑÐµÐ¹ÐºÐ°Ð½Ð½ÑÑ ÑÑÐµÐ´ÑÑÐ²'); return; }
        const total = this.stakedBalance + this.stakingRewards;
        this.balance += total;
        this.stakedBalance = 0;
        this.stakingRewards = 0;
        this.saveData();
        this.render();
        this.showMessage('ð ÐÑÐ²ÐµÐ´ÐµÐ½Ð¾ ' + total.toFixed(2) + ' RURC');
    }

    showMessage(msg) {
        if (window.showToast) { window.showToast(msg); return; }
        const el = document.getElementById('message');
        if (!el) return;
        el.textContent = msg;
        el.style.opacity = '1';
        clearTimeout(this._msgTimer);
        this._msgTimer = setTimeout(() => { el.style.opacity = '0'; }, 2500);
    }

    render() {
        const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
        set('balance', this.balance.toFixed(2));
        set('tonBalance', (this.tonBalance || 0).toFixed(3));
        set('stakedBalance', this.stakedBalance.toFixed(2));
        set('stakingRewards', this.stakingRewards.toFixed(4));
        set('oilStored', this.oilStored.toFixed(1));
        set('gasStored', Math.floor(this.gasStored));
        set('oilCapacity', this.oilCapacity);
        set('gasCapacity', this.gasCapacity);
        set('oilPumps', this.oilPumps);
        set('gasTowers', this.gasTowers);
        set('oilTanks', this.oilTanks);
        set('gasTanks', this.gasTanks);
        set('oilRate', (this.getOilPerSec() * 3600).toFixed(2));
        set('gasRate', (this.getGasPerSec() * 3600).toFixed(0));
        set('oilPumpCost', this.getOilPumpCost());
        set('gasTowerCost', this.getGasTowerCost());
        set('oilTankCost', this.getOilTankCost());
        set('gasTankCost', this.getGasTankCost());
        set('miningStatus', this.isMining ? 'â¡ ÐÐ¾Ð±ÑÑÐ° Ð°ÐºÑÐ¸Ð²Ð½Ð°' : 'â¸ï¸ ÐÑÑÐ°Ð½Ð¾Ð²Ð»ÐµÐ½Ð°');
        set('totalMined', this.totalMined.toFixed(1));

        // ÐÑÐ¾Ð³ÑÐµÑÑ-Ð±Ð°ÑÑ ÑÐ¸ÑÑÐµÑÐ½
        const oilPct = Math.min(100, (this.oilStored / this.oilCapacity) * 100);
        const gasPct = Math.min(100, (this.gasStored / this.gasCapacity) * 100);
        const oilBar = document.getElementById('oilBar');
        const gasBar = document.getElementById('gasBar');
        if (oilBar) oilBar.style.width = oilPct + '%';
        if (gasBar) gasBar.style.width = gasPct + '%';

        // ÐÐ½Ð¸Ð¼Ð°ÑÐ¸Ñ ÑÐ¸ÑÑÐµÑÐ½
        const oilFill = document.getElementById('oilTankFill');
        const gasFill = document.getElementById('gasTankFill');
        if (oilFill) oilFill.style.height = oilPct + '%';
        if (gasFill) gasFill.style.height = gasPct + '%';
    }
}

// ââ ÐÐÐÐ¦ÐÐÐÐÐÐÐ¦ÐÐ¯ ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
document.addEventListener('DOMContentLoaded', function() {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.ready) {
        window.Telegram.WebApp.ready();
    }
    try {
        window.rurcoinApp = new RURCoinMiner();
    } catch (e) {
        console.error('[App] ?????? ????????????? RURCoinMiner:', e);
    }

// ── Начисление RURC после оплаты СБП ─────────────────────────
window.mintWithUI = function(rurcAmount) {
    const app = window.rurcoinApp;
    if (!app) { console.error('rurcoinApp не инициализирован'); return; }
    const amount = parseFloat(rurcAmount);
    if (!amount || amount <= 0) return;

    app.balance = Math.max(0, (app.balance || 0) + amount);
    app.totalMined = (app.totalMined || 0) + amount;

    // Добавляем в историю транзакций
    if (!app.transactions) app.transactions = [];
    app.transactions.unshift({
        type: 'topup',
        amount: amount,
        method: 'СБП',
        date: new Date().toISOString(),
        id: 'SBP_' + Date.now()
    });

    app.saveData();
    app.render();
    console.log('✅ Начислено', amount, 'RURC. Новый баланс:', app.balance);
};
    console.log('RURCoin Oil & Gas Ð·Ð°Ð¿ÑÑÐµÐ½Ð¾!');

    // ââ ÐÐÐ ÐÐÐÐ®Ð§ÐÐÐÐ ÐÐÐÐÐÐÐ (event delegation â ÑÐ°Ð±Ð¾ÑÐ°ÐµÑ Ð´Ð»Ñ Ð´Ð¸Ð½Ð°Ð¼Ð¸ÑÐµÑÐºÐ¸Ñ ÐºÐ½Ð¾Ð¿Ð¾Ðº) ââ
    function switchTab(tabId) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => {
            c.classList.remove('active');
            c.style.display = 'none';
        });
        const activeBtn = document.querySelector('.tab-btn[data-tab="' + tabId + '"]');
        if (activeBtn) activeBtn.classList.add('active');
        const activeContent = document.getElementById(tabId);
        if (activeContent) {
            activeContent.classList.add('active');
            activeContent.style.display = 'block';
        }
    }

    window.switchTab = switchTab;
    window.rurcoinApp.switchTab = switchTab;

    // Event delegation â Ð»Ð¾Ð²Ð¸Ð¼ ÐºÐ»Ð¸ÐºÐ¸ Ð½Ð° ÐÐ®ÐÐÐ .tab-btn, Ð´Ð°Ð¶Ðµ Ð´Ð¾Ð±Ð°Ð²Ð»ÐµÐ½Ð½Ð¾Ð¹ Ð¿Ð¾Ð·Ð¶Ðµ
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.tab-btn');
        if (!btn) return;
        const tabId = btn.getAttribute('data-tab');
        if (!tabId) return;
        switchTab(tabId);
        // Ripple Ð°Ð½Ð¸Ð¼Ð°ÑÐ¸Ñ
        const ripple = document.createElement('span');
        ripple.className = 'btn-ripple';
        ripple.style.cssText = 'position:absolute;border-radius:50%;background:rgba(255,107,0,0.4);width:80px;height:80px;margin-top:-40px;margin-left:-40px;animation:ripple-anim 0.5s linear;pointer-events:none;';
        btn.style.position = 'relative';
        btn.style.overflow = 'hidden';
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 500);
    });

    // ÐÐ¾ÐºÐ°Ð·ÑÐ²Ð°ÐµÐ¼ Ð¿ÐµÑÐ²ÑÑ Ð²ÐºÐ»Ð°Ð´ÐºÑ
    switchTab('mining');

});

// ÐÐ±Ð½Ð¾Ð²Ð»ÑÐµÐ¼ UI Ð¿ÑÐ¸ Ð¸Ð·Ð¼ÐµÐ½ÐµÐ½Ð¸Ð¸ ÑÐµÐ½
window.addEventListener('storage', function(e) {
    if (e.key === 'rurcoin_data' && window.rurcoinApp) {
        window.rurcoinApp.loadData();
        window.rurcoinApp.render();
    }
});


// ============================================================
//  switchResourceSlide — переключение нефть / газ в mining
// ============================================================
function switchResourceSlide(type) {
    const oilSlide = document.getElementById('slideOil');
    const gasSlide = document.getElementById('slideGas');
    const oilBtn   = document.getElementById('slideOilBtn');
    const gasBtn   = document.getElementById('slideGasBtn');
    if (!oilSlide || !gasSlide) return;
    if (type === 'oil') {
        oilSlide.style.display = 'block';
        gasSlide.style.display = 'none';
        if (oilBtn) oilBtn.classList.add('active');
        if (gasBtn) gasBtn.classList.remove('active');
    } else {
        oilSlide.style.display = 'none';
        gasSlide.style.display = 'block';
        if (oilBtn) oilBtn.classList.remove('active');
        if (gasBtn) gasBtn.classList.add('active');
    }
}
window.switchResourceSlide = switchResourceSlide;

// ============================================================
//  renderUpgrades — отрисовка вкладки улучшений
// ============================================================
//  UPGRADES — список улучшений с подробными описаниями
// ============================================================
const UPGRADES_LIST = [

    // ══════════════════════════════════════════
    // 🛢️ ДОБЫЧА НЕФТИ
    // ══════════════════════════════════════════
    {
        id: 'oilSpeed',
        name: '⚡ Скорость добычи нефти',
        icon: '🛢️',
        category: 'oil',
        desc: 'Ускоряет насосы — нефть поступает на завод быстрее.',
        details: [
            'Ур. 1 → +20% скорости добычи',
            'Ур. 5 → +100% (вдвое быстрее)',
            'Ур. 10 → +200% — завод никогда не простаивает без сырья',
            'Критично для непрерывного производства'
        ],
        baseCost: 0.05, costMult: 2.2, maxLevel: 10,
        stat: (a) => `${(a.getOilPerSec()*3600).toFixed(1)} барр/ч`
    },
    {
        id: 'pumpQuality',
        name: '🔩 Качество насосов',
        icon: '🔩',
        category: 'oil',
        desc: 'Улучшенные насосы дают больше нефти с каждой скважины.',
        details: [
            'Ур. 1 → +15% выхода с каждого насоса',
            'Ур. 5 → +75% — меньше насосов нужно для завода',
            'Ур. 10 → +150% — насосы работают в 2.5× эффективнее',
            'Снижает потребность в новых скважинах'
        ],
        baseCost: 0.08, costMult: 2.4, maxLevel: 10,
        stat: (a) => `×${(1 + (a.upgrades.pumpQuality||0)*0.15).toFixed(2)} к насосам`
    },
    {
        id: 'deepDrill',
        name: '⛏️ Глубокое бурение',
        icon: '⛏️',
        category: 'oil',
        desc: 'Доступ к глубоким пластам — больше нефти для переработки.',
        details: [
            'Ур. 1 → +30% к добыче нефти',
            'Ур. 3 → +90% — достаточно для авиакеросина',
            'Ур. 5 → +150% — хватает на все нефтяные заводы',
            'Обязательно перед запуском завода химикатов'
        ],
        baseCost: 0.5, costMult: 4.0, maxLevel: 5,
        stat: (a) => `+${(a.upgrades.deepDrill||0)*30}% к добыче`
    },
    {
        id: 'geoSurvey',
        name: '🗺️ Геологоразведка',
        icon: '🗺️',
        category: 'oil',
        desc: 'Новые месторождения — каждая вышка даёт больше сырья.',
        details: [
            'Ур. 1 → вышки работают как ×1.2',
            'Ур. 3 → ×1.6 — меньше вышек нужно для завода',
            'Ур. 5 → ×2.0 — удвоение без новых скважин',
            'Самое выгодное улучшение добычи'
        ],
        baseCost: 0.35, costMult: 3.5, maxLevel: 5,
        stat: (a) => `×${(1 + (a.upgrades.geoSurvey||0)*0.2).toFixed(1)} к вышкам`
    },
    {
        id: 'workerCrew',
        name: '👷 Бригада рабочих',
        icon: '👷',
        category: 'oil',
        desc: 'Дополнительная бригада добывает нефть независимо от насосов.',
        details: [
            'Ур. 1 → +5 барр/ч пассивно',
            'Ур. 5 → +25 барр/ч — стабильная подача на завод',
            'Ур. 10 → +50 барр/ч — завод никогда не стоит',
            'Не зависит от насосов — работает всегда'
        ],
        baseCost: 0.12, costMult: 2.5, maxLevel: 10,
        stat: (a) => `+${(a.upgrades.workerCrew||0)*5} барр/ч`
    },

    // ══════════════════════════════════════════
    // 🔥 ДОБЫЧА ГАЗА
    // ══════════════════════════════════════════
    {
        id: 'gasSpeed',
        name: '⚡ Скорость добычи газа',
        icon: '🔥',
        category: 'gas',
        desc: 'Больше газа — быстрее работают газовые заводы (СПГ, метанол, аммиак).',
        details: [
            'Ур. 1 → +20% добычи газа',
            'Ур. 5 → +100% — хватает на завод метанола',
            'Ур. 10 → +200% — достаточно для аммиака',
            'Критично для газовых заводов'
        ],
        baseCost: 0.04, costMult: 2.0, maxLevel: 10,
        stat: (a) => `${(a.getGasPerSec()*3600).toFixed(0)} м³/ч`
    },
    {
        id: 'gasTurbine',
        name: '🌀 Газовая турбина',
        icon: '🌀',
        category: 'gas',
        desc: 'Сжигает часть газа для питания нефтяных насосов — синергия ресурсов.',
        details: [
            'Ур. 1 → газ даёт +10% к добыче нефти',
            'Ур. 3 → +30% — нефтяные заводы работают быстрее',
            'Ур. 5 → +50% — мощная синергия газ + нефть',
            'Газ расходуется, но нефти становится больше'
        ],
        baseCost: 0.3, costMult: 3.2, maxLevel: 5,
        stat: (a) => `+${(a.upgrades.gasTurbine||0)*10}% к нефти`
    },
    {
        id: 'gasCompressor',
        name: '🔄 Компрессор газа',
        icon: '🔄',
        category: 'gas',
        desc: 'Сжимает газ — больше сырья для заводов СПГ и аммиака без новых танков.',
        details: [
            'Ур. 1 → ёмкость газгольдера ×1.3',
            'Ур. 3 → ×1.9 — хватает на несколько циклов аммиака',
            'Ур. 5 → ×2.5 — газ не кончается между циклами',
            'Дешевле чем покупать новые газовые танки'
        ],
        baseCost: 0.18, costMult: 2.8, maxLevel: 5,
        stat: (a) => `×${(1 + (a.upgrades.gasCompressor||0)*0.3).toFixed(1)} к ёмкости`
    },
    {
        id: 'gasInsulation',
        name: '🧱 Изоляция трубопровода',
        icon: '🧱',
        category: 'gas',
        desc: 'Снижает потери газа при транспортировке на завод.',
        details: [
            'Ур. 1 → потери -20%',
            'Ур. 3 → потери -60% — больше газа доходит до завода',
            'Ур. 5 → потери минимальны — весь газ идёт в производство',
            'Особенно важно для аммиака (требует 30 ед. газа)'
        ],
        baseCost: 0.13, costMult: 2.3, maxLevel: 5,
        stat: (a) => `-${(a.upgrades.gasInsulation||0)*20}% потерь`
    },

    // ══════════════════════════════════════════
    // 🏭 ПРОИЗВОДСТВО (завод)
    // ══════════════════════════════════════════
    {
        id: 'refinerySpeed',
        name: '⚙️ Скорость переработки',
        icon: '⚙️',
        category: 'refinery',
        desc: 'Ускоряет все заводы — каждый цикл производства короче.',
        details: [
            'Ур. 1 → все заводы работают на 10% быстрее',
            'Ур. 5 → -50% времени цикла на всех заводах',
            'Ур. 8 → -80% — бензин за 48 мин вместо 4 часов',
            'Стекается с улучшениями отдельных заводов'
        ],
        baseCost: 0.2, costMult: 2.8, maxLevel: 8,
        stat: (a) => `-${(a.upgrades.refinerySpeed||0)*10}% времени цикла`
    },
    {
        id: 'outputBoost',
        name: '📈 Выход продукта',
        icon: '📈',
        category: 'refinery',
        desc: 'Повышает количество продукта с каждого цикла переработки.',
        details: [
            'Ур. 1 → +15% продукта с каждого цикла',
            'Ур. 4 → +60% — из 10 нефти получаешь 12.8 бензина',
            'Ур. 6 → +90% — почти вдвое больше продукта',
            'Работает на всех заводах одновременно'
        ],
        baseCost: 0.25, costMult: 3.0, maxLevel: 6,
        stat: (a) => `+${(a.upgrades.outputBoost||0)*15}% выхода`
    },
    {
        id: 'multiQueue',
        name: '🔀 Параллельные линии',
        icon: '🔀',
        category: 'refinery',
        desc: 'Добавляет производственные линии — несколько заводов работают одновременно.',
        details: [
            'Ур. 1 → можно запустить 2 завода параллельно',
            'Ур. 2 → 3 завода одновременно',
            'Ур. 3 → 4 завода — полная загрузка производства',
            'Без этого заводы работают по очереди'
        ],
        baseCost: 0.6, costMult: 5.0, maxLevel: 3,
        stat: (a) => `${1 + (a.upgrades.multiQueue||0)} линий`
    },
    {
        id: 'autoRefine',
        name: '🤖 Автозапуск производства',
        icon: '🤖',
        category: 'refinery',
        desc: 'Завод автоматически перезапускает цикл после завершения.',
        details: [
            'Одноразовое улучшение',
            'Каждый завод перезапускается сам после цикла',
            'Не нужно вручную нажимать "Запустить"',
            'Обязательно для пассивного дохода'
        ],
        baseCost: 1.0, costMult: 1.0, maxLevel: 1,
        stat: (a) => (a.upgrades.autoRefine >= 1 ? '✅ Активно' : '❌ Не куплено')
    },
    {
        id: 'qualityControl',
        name: '🔬 Контроль качества',
        icon: '🔬',
        category: 'refinery',
        desc: 'Повышает цену продажи всех продуктов переработки.',
        details: [
            'Ур. 1 → +10% к цене всех продуктов',
            'Ур. 4 → +40% — бензин стоит дороже',
            'Ур. 6 → +60% — аммиак приносит максимум RURC',
            'Влияет на все заводы сразу'
        ],
        baseCost: 0.3, costMult: 3.2, maxLevel: 6,
        stat: (a) => `+${(a.upgrades.qualityControl||0)*10}% к цене`
    },
    {
        id: 'wasteRecovery',
        name: '♻️ Переработка отходов',
        icon: '♻️',
        category: 'refinery',
        desc: 'Возвращает часть сырья из отходов производства.',
        details: [
            'Ур. 1 → 5% нефти/газа возвращается после цикла',
            'Ур. 3 → 15% возврат — меньше тратишь сырья',
            'Ур. 5 → 25% — каждый 4-й цикл почти бесплатный',
            'Особенно выгодно для аммиака (30 ед. газа)'
        ],
        baseCost: 0.4, costMult: 3.5, maxLevel: 5,
        stat: (a) => `${(a.upgrades.wasteRecovery||0)*5}% возврат сырья`
    },

    // ══════════════════════════════════════════
    // 🏗️ ХРАНИЛИЩЕ
    // ══════════════════════════════════════════
    {
        id: 'oilCapacity',
        name: '🏗️ Нефтехранилище',
        icon: '🏗️',
        category: 'storage',
        desc: 'Больше нефти в запасе — завод не останавливается в ожидании сырья.',
        details: [
            'Ур. 1 → +50 барр (итого 150)',
            'Ур. 5 → +250 барр — хватает на 5 циклов бензина',
            'Ур. 10 → +500 барр — запас на авиакеросин',
            'Ур. 20 → +1000 барр — полная автономность'
        ],
        baseCost: 0.1, costMult: 1.8, maxLevel: 20,
        stat: (a) => `${a.oilCapacity} барр`
    },
    {
        id: 'gasCapacity',
        name: '🏗️ Газгольдер',
        icon: '🏗️',
        category: 'storage',
        desc: 'Больше газа в запасе — заводы СПГ, метанол и аммиак работают без простоев.',
        details: [
            'Ур. 1 → +500 м³ (итого 1500)',
            'Ур. 5 → +2500 м³ — хватает на 2 цикла аммиака',
            'Ур. 10 → +5000 м³ — газовые заводы в непрерывном режиме',
            'Ур. 20 → +10000 м³ — максимальный запас'
        ],
        baseCost: 0.08, costMult: 1.8, maxLevel: 20,
        stat: (a) => `${a.gasCapacity} м³`
    },
    {
        id: 'smartStorage',
        name: '🤖 Умный склад',
        icon: '🤖',
        category: 'storage',
        desc: 'Автоматически резервирует сырьё под запущенные заводы.',
        details: [
            'Одноразовое улучшение',
            'Нефть и газ резервируются под активные циклы',
            'Завод не запустится если сырья не хватит',
            'Исключает ошибки при параллельном производстве'
        ],
        baseCost: 0.6, costMult: 1.0, maxLevel: 1,
        stat: (a) => (a.upgrades.smartStorage >= 1 ? '✅ Активно' : '❌ Не куплено')
    },
    {
        id: 'pipelineExt',
        name: '🔧 Расширение трубопровода',
        icon: '🔧',
        category: 'storage',
        desc: 'Ускоряет подачу сырья на завод — нет задержек между добычей и производством.',
        details: [
            'Ур. 1 → задержка подачи -20%',
            'Ур. 3 → -60% — сырьё поступает почти мгновенно',
            'Ур. 5 → задержки отсутствуют',
            'Критично при высокой скорости добычи'
        ],
        baseCost: 0.18, costMult: 2.2, maxLevel: 5,
        stat: (a) => `-${(a.upgrades.pipelineExt||0)*20}% задержки`
    }
];

const UPGRADE_CATEGORIES = {
    oil:      { label: '🛢️ Добыча нефти',  color: '#FF8C00' },
    gas:      { label: '🔥 Добыча газа',   color: '#4ade80' },
    refinery: { label: '🏭 Производство',  color: '#a78bfa' },
    storage:  { label: '🏗️ Хранилище',    color: '#60a5fa' }
};

function getUpgradeCost(upg) {
    const app = window.rurcoinApp;
    const level = app ? (app.upgrades[upg.id] || 0) : 0;
    // Цена в TON: baseCost / 1000, минимум 0.01 TON
    const raw = upg.baseCost / 1000 * Math.pow(upg.costMult, level);
    return Math.round(raw * 100) / 100; // округляем до 2 знаков
}

// Состояние раскрытых карточек
const _upgExpanded = {};

function toggleUpgradeDetails(id) {
    _upgExpanded[id] = !_upgExpanded[id];
    renderUpgrades();
}

function renderUpgrades() {
    const container = document.getElementById('upgradesList');
    if (!container) return;
    const app = window.rurcoinApp;
    if (!app) {
        container.innerHTML = '<div style="color:#555;text-align:center;padding:20px;">Загрузка...</div>';
        return;
    }

    // Группируем по категориям
    const grouped = {};
    UPGRADES_LIST.forEach(upg => {
        if (!grouped[upg.category]) grouped[upg.category] = [];
        grouped[upg.category].push(upg);
    });

    let html = '';

    for (const [catKey, upgrades] of Object.entries(grouped)) {
        const cat = UPGRADE_CATEGORIES[catKey];
        html += `
        <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;
                    color:${cat.color};border-left:2px solid ${cat.color};
                    padding-left:8px;margin:14px 0 8px;font-weight:700;">
            ${cat.label}
        </div>`;

        upgrades.forEach(upg => {
            const level     = app.upgrades[upg.id] || 0;
            const maxed     = level >= upg.maxLevel;
            const cost      = getUpgradeCost(upg);
            const canAfford = app.tonBalance >= cost;
            const statText  = upg.stat(app);
            const pct       = Math.round(level / upg.maxLevel * 100);
            const expanded  = !!_upgExpanded[upg.id];
            const cat_      = UPGRADE_CATEGORIES[upg.category];

            const detailsHtml = upg.details.map(d =>
                `<div style="display:flex;align-items:flex-start;gap:6px;margin-bottom:4px;">
                    <span style="color:${cat_.color};flex-shrink:0;">▸</span>
                    <span style="color:#888;font-size:11px;line-height:1.4;">${d}</span>
                </div>`
            ).join('');

            html += `
            <div style="background:rgba(255,255,255,0.02);
                        border:1px solid ${maxed ? cat_.color + '66' : 'rgba(255,255,255,0.07)'};
                        border-radius:14px;padding:14px;margin-bottom:10px;
                        transition:all 0.2s;
                        ${maxed ? `box-shadow:0 0 12px ${cat_.color}22;` : ''}">

                <!-- Шапка карточки -->
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                    <div style="width:44px;height:44px;border-radius:12px;flex-shrink:0;
                                background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
                                display:flex;align-items:center;justify-content:center;font-size:22px;">
                        ${upg.icon}
                    </div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-size:13px;font-weight:700;
                                    color:${maxed ? '#FFD700' : cat_.color};
                                    margin-bottom:2px;">${upg.name}</div>
                        <div style="font-size:11px;color:#666;line-height:1.3;">${upg.desc}</div>
                    </div>
                    <div style="text-align:center;flex-shrink:0;">
                        <div style="font-size:18px;font-weight:800;
                                    color:${maxed ? '#FFD700' : '#fff'};">${level}</div>
                        <div style="font-size:9px;color:#444;">/ ${upg.maxLevel}</div>
                    </div>
                </div>

                <!-- Прогресс-бар -->
                <div style="background:rgba(0,0,0,0.4);border-radius:4px;height:5px;
                            margin-bottom:10px;overflow:hidden;">
                    <div style="height:100%;width:${pct}%;
                                background:${maxed
                                    ? 'linear-gradient(90deg,#FFD700,#FF8C00)'
                                    : `linear-gradient(90deg,${cat_.color},${cat_.color}88)`};
                                transition:width 0.5s;border-radius:4px;"></div>
                </div>

                <!-- Статистика + кнопка -->
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;
                            margin-bottom:${expanded ? '10px' : '0'};">
                    <div style="display:flex;align-items:center;gap:6px;flex:1;min-width:0;">
                        <span style="font-size:10px;color:#555;">📊</span>
                        <span style="font-size:11px;color:#666;white-space:nowrap;overflow:hidden;
                                     text-overflow:ellipsis;">${statText}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                        <!-- Кнопка подробнее -->
                        <button onclick="toggleUpgradeDetails('${upg.id}')"
                                style="padding:7px 10px;border:1px solid rgba(255,255,255,0.1);
                                       border-radius:8px;cursor:pointer;font-size:11px;
                                       background:rgba(255,255,255,0.04);color:#888;
                                       transition:all 0.2s;">
                            ${expanded ? '▲' : '▼'}
                        </button>
                        <!-- Кнопка купить -->
                        ${maxed
                            ? `<div style="padding:7px 14px;border-radius:8px;
                                          background:rgba(255,215,0,0.1);
                                          border:1px solid rgba(255,215,0,0.3);
                                          color:#FFD700;font-size:11px;font-weight:700;">
                                   ✅ МАКС
                               </div>`
                            : `<button onclick="buyUpgrade('${upg.id}')"
                                       style="padding:7px 14px;border:none;border-radius:8px;
                                              cursor:pointer;font-size:12px;font-weight:700;
                                              color:#fff;transition:all 0.2s;white-space:nowrap;
                                              background:${canAfford
                                                  ? `linear-gradient(135deg,${cat_.color},${cat_.color}99)`
                                                  : 'rgba(80,80,80,0.4)'};
                                              opacity:${canAfford ? '1' : '0.55'};"
                                       ${canAfford ? '' : 'disabled'}>
                                   💎 ${cost.toFixed(2)} TON
                               </button>`
                        }
                    </div>
                </div>

                <!-- Раскрывающееся описание -->
                ${expanded ? `
                <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:10px;
                            animation:slide-up 0.2s ease;">
                    <div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;
                                color:${cat_.color};margin-bottom:8px;font-weight:700;">
                        Что даёт улучшение:
                    </div>
                    ${detailsHtml}
                    ${level > 0 && level < upg.maxLevel ? `
                    <div style="margin-top:8px;padding:8px;background:rgba(255,255,255,0.02);
                                border-radius:8px;border:1px solid rgba(255,255,255,0.05);">
                        <div style="font-size:10px;color:#555;margin-bottom:2px;">Следующий уровень:</div>
                        <div style="font-size:12px;color:${cat_.color};font-weight:700;">
                            Уровень ${level} → ${level+1} · Стоимость: ${cost.toLocaleString()} RURC
                        </div>
                    </div>` : ''}
                </div>` : ''}
            </div>`;
        });
    }

    container.innerHTML = html;
}

function buyUpgrade(upgradeId) {
    const app = window.rurcoinApp;
    if (!app) return;
    const upg = UPGRADES_LIST.find(u => u.id === upgradeId);
    if (!upg) return;
    const level = app.upgrades[upgradeId] || 0;
    if (level >= upg.maxLevel) return;
    const cost = getUpgradeCost(upg);
    if (app.tonBalance < cost) {
        const btn = document.querySelector(`button[onclick="buyUpgrade('${upgradeId}')"]`);
        if (btn) {
            const orig = btn.innerHTML;
            btn.style.background = 'rgba(255,34,68,0.6)';
            btn.textContent = '❌ Мало TON';
            setTimeout(() => { btn.style.background = 'rgba(80,80,80,0.4)'; btn.innerHTML = orig; }, 1200);
        }
        return;
    }
    app.tonBalance -= cost;
    app.upgrades[upgradeId] = level + 1;
    if (upgradeId === 'oilCapacity') app.oilCapacity += 50;
    if (upgradeId === 'gasCapacity') app.gasCapacity += 500;
    app.saveData();
    app.render();
    renderUpgrades();
    if (window.showNotification) showNotification(`✅ ${upg.name} — уровень ${level+1}!`, 'success');
}

window.renderUpgrades = renderUpgrades;
window.buyUpgrade = buyUpgrade;
window.toggleUpgradeDetails = toggleUpgradeDetails;

// Автообновление при переключении на вкладку улучшений
document.addEventListener('click', function(e) {
    const btn = e.target.closest('.tab-btn');
    if (btn && btn.getAttribute('data-tab') === 'upgrades') {
        setTimeout(renderUpgrades, 50);
    }
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        switchResourceSlide('oil');
        renderUpgrades();
    }, 300);
});


// ============================================================
//  renderEquipment — отрисовка вкладки "Оборудование"
// ============================================================
const EQUIPMENT_LIST = [
    {
        id: 'oilPump',
        name: '🛢️ Нефтяная помпа',
        desc: 'Добывает нефть. Каждая помпа +0.05 барр/сек',
        icon: '🛢️',
        countKey: 'oilPumps',
        getCost: (app) => app.getOilPumpCost(),
        buy: (app) => { if (window.rurcoinApp) window.rurcoinApp.buyOilPump(); },
        stat: (app) => `${app.oilPumps} шт. · ${(app.getOilPerSec()*3600).toFixed(1)} барр/ч`,
        color: '#FF8C00'
    },
    {
        id: 'gasTower',
        name: '🔥 Газовая вышка',
        desc: 'Добывает природный газ. Каждая вышка +2 м³/сек',
        icon: '🔥',
        countKey: 'gasTowers',
        getCost: (app) => app.getGasTowerCost(),
        buy: (app) => { if (window.rurcoinApp) window.rurcoinApp.buyGasTower(); },
        stat: (app) => `${app.gasTowers} шт. · ${(app.getGasPerSec()*3600).toFixed(0)} м³/ч`,
        color: '#4ade80'
    },
    {
        id: 'oilTank',
        name: '🏗️ Нефтяной резервуар',
        desc: 'Увеличивает ёмкость хранилища нефти на 50 барр',
        icon: '🏗️',
        countKey: 'oilTanks',
        getCost: (app) => app.getOilTankCost(),
        buy: (app) => { if (window.rurcoinApp) window.rurcoinApp.buyOilTank(); },
        stat: (app) => `${app.oilTanks} шт. · ёмкость ${app.oilCapacity} барр`,
        color: '#60a5fa'
    },
    {
        id: 'gasTank',
        name: '⛽ Газовый резервуар',
        desc: 'Увеличивает ёмкость хранилища газа на 500 м³',
        icon: '⛽',
        countKey: 'gasTanks',
        getCost: (app) => app.getGasTankCost(),
        buy: (app) => { if (window.rurcoinApp) window.rurcoinApp.buyGasTank(); },
        stat: (app) => `${app.gasTanks} шт. · ёмкость ${app.gasCapacity} м³`,
        color: '#a78bfa'
    }
];

function renderEquipment() {
    const container = document.getElementById('equipmentList');
    if (!container) return;
    const app = window.rurcoinApp;
    if (!app) {
        container.innerHTML = '<div style="color:#555;text-align:center;padding:20px;">Загрузка...</div>';
        return;
    }

    container.innerHTML = EQUIPMENT_LIST.map(eq => {
        const count = app[eq.countKey] || 0;
        const cost = eq.getCost(app);
        const canAfford = app.tonBalance >= cost;
        const statText = eq.stat(app);

        return `
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);
                    border-radius:14px;padding:16px;margin-bottom:12px;transition:all 0.2s;
                    box-shadow:0 2px 12px rgba(0,0,0,0.3);">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
                <div style="width:48px;height:48px;border-radius:12px;
                            background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);
                            display:flex;align-items:center;justify-content:center;font-size:24px;
                            flex-shrink:0;">
                    ${eq.icon}
                </div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:14px;font-weight:700;color:${eq.color};margin-bottom:2px;">${eq.name}</div>
                    <div style="font-size:11px;color:#666;line-height:1.3;">${eq.desc}</div>
                </div>
                <div style="text-align:center;flex-shrink:0;">
                    <div style="font-size:22px;font-weight:800;color:#fff;">${count}</div>
                    <div style="font-size:10px;color:#555;">куплено</div>
                </div>
            </div>

            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;
                        padding-top:10px;border-top:1px solid rgba(255,255,255,0.05);">
                <div style="font-size:11px;color:#555;">📊 ${statText}</div>
                <button onclick="buyEquipment('${eq.id}')"
                        style="padding:9px 18px;border:none;border-radius:10px;cursor:pointer;
                               font-size:12px;font-weight:700;color:#fff;white-space:nowrap;
                               transition:all 0.2s;flex-shrink:0;
                               background:${canAfford
                                   ? `linear-gradient(135deg,${eq.color},${eq.color}99)`
                                   : 'rgba(80,80,80,0.4)'};
                               opacity:${canAfford ? '1' : '0.55'};"
                        ${canAfford ? '' : 'disabled'}>
                    💎 ${cost.toFixed(2)} TON RURC
                </button>
            </div>
        </div>`;
    }).join('');
}

function buyEquipment(equipId) {
    const app = window.rurcoinApp;
    if (!app) return;
    const eq = EQUIPMENT_LIST.find(e => e.id === equipId);
    if (!eq) return;

    const cost = eq.getCost(app);
    if (app.tonBalance < cost) {
        const btn = document.querySelector(`button[onclick="buyEquipment('${equipId}')"]`);
        if (btn) {
            const orig = btn.innerHTML;
            btn.style.background = 'rgba(255,34,68,0.5)';
            btn.textContent = '❌ Недостаточно';
            setTimeout(() => { btn.style.background = 'rgba(80,80,80,0.4)'; btn.innerHTML = orig; }, 1200);
        }
        return;
    }

    eq.buy(app);
    // После покупки перерисовываем
    setTimeout(() => {
        renderEquipment();
        renderUpgrades();
    }, 50);
}

window.renderEquipment = renderEquipment;
window.buyEquipment = buyEquipment;

// Автообновление при переключении на вкладку
document.addEventListener('click', function(e) {
    const btn = e.target.closest('.tab-btn');
    if (btn && btn.getAttribute('data-tab') === 'equipment') {
        setTimeout(renderEquipment, 50);
    }
});

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(renderEquipment, 400);
});

// ── Очистка таймеров при закрытии ──────────────────────────────
window.addEventListener('beforeunload', function() {
    if (window.rurcoinApp) {
        ['_miningInterval','_stakingInterval','_renderInterval'].forEach(k => {
            if (window.rurcoinApp[k]) clearInterval(window.rurcoinApp[k]);
        });
        try { window.rurcoinApp.saveData(); } catch(e) {}
    }
});
