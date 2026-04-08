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

    // ===== НЕФТЬ =====
    {
        id: 'oilSpeed',
        name: '⚡ Скорость добычи нефти',
        icon: '🛢️',
        category: 'oil',
        desc: 'Увеличивает скорость добычи нефти на 20% за каждый уровень.',
        details: [
            'Ур. 1 → +20% добычи нефти',
            'Ур. 5 → +100% (×2 к базе)',
            'Ур. 10 → +200% (×3 к базе)',
            'Работает пассивно — нефть добывается быстрее без действий'
        ],
        baseCost: 50, costMult: 2.2, maxLevel: 10,
        stat: (a) => `${(a.getOilPerSec()*3600).toFixed(1)} барр/ч`
    },
    {
        id: 'pumpQuality',
        name: '🔩 Качество насосов',
        icon: '🔩',
        category: 'oil',
        desc: 'Улучшает КПД каждого насоса на 15% за уровень.',
        details: [
            'Ур. 1 → каждый насос даёт +15% нефти',
            'Ур. 5 → +75% к выходу каждого насоса',
            'Ур. 10 → +150% — насосы работают в 2.5× эффективнее',
            'Стекается с количеством насосов'
        ],
        baseCost: 80, costMult: 2.4, maxLevel: 10,
        stat: (a) => `×${(1 + (a.upgrades.pumpQuality||0)*0.15).toFixed(2)} к насосам`
    },
    {
        id: 'workerCrew',
        name: '👷 Бригада рабочих',
        icon: '👷',
        category: 'oil',
        desc: 'Нанимает бригаду, которая добывает нефть даже без насосов.',
        details: [
            'Ур. 1 → +5 барр/ч пассивно',
            'Ур. 5 → +25 барр/ч пассивно',
            'Ур. 10 → +50 барр/ч пассивно',
            'Не зависит от насосов — работает всегда'
        ],
        baseCost: 120, costMult: 2.5, maxLevel: 10,
        stat: (a) => `+${(a.upgrades.workerCrew||0)*5} барр/ч`
    },
    {
        id: 'chemTreatment',
        name: '🧪 Химическая обработка',
        icon: '🧪',
        category: 'oil',
        desc: 'Химическая закачка увеличивает выход нефти из скважины на 25% за уровень.',
        details: [
            'Ур. 1 → +25% к общей добыче нефти',
            'Ур. 4 → +100% (×2 к базе)',
            'Ур. 6 → +150% к общей добыче',
            'Применяется после всех других бонусов'
        ],
        baseCost: 200, costMult: 3.0, maxLevel: 6,
        stat: (a) => `+${(a.upgrades.chemTreatment||0)*25}% к добыче`
    },
    {
        id: 'geoSurvey',
        name: '🗺️ Геологоразведка',
        icon: '🗺️',
        category: 'oil',
        desc: 'Открывает новые месторождения — увеличивает эффективный множитель вышек.',
        details: [
            'Ур. 1 → вышки считаются как ×1.2',
            'Ур. 3 → вышки считаются как ×1.6',
            'Ур. 5 → вышки считаются как ×2.0',
            'Одно из самых мощных улучшений'
        ],
        baseCost: 350, costMult: 3.5, maxLevel: 5,
        stat: (a) => `×${(1 + (a.upgrades.geoSurvey||0)*0.2).toFixed(1)} к вышкам`
    },
    {
        id: 'equipProtect',
        name: '🛡️ Защита оборудования',
        icon: '🛡️',
        category: 'oil',
        desc: 'Снижает простои — добыча идёт без перерывов.',
        details: [
            'Ур. 1 → +10% к времени работы насосов',
            'Ур. 5 → +50% uptime',
            'Ур. 8 → насосы работают практически без остановок',
            'Особенно полезно при большом числе насосов'
        ],
        baseCost: 150, costMult: 2.6, maxLevel: 8,
        stat: (a) => `+${(a.upgrades.equipProtect||0)*10}% uptime`
    },
    {
        id: 'deepDrill',
        name: '⛏️ Глубокое бурение',
        icon: '⛏️',
        category: 'oil',
        desc: 'Бурение на большую глубину открывает богатые пласты нефти.',
        details: [
            'Ур. 1 → +30% к добыче нефти',
            'Ур. 3 → +90% к добыче нефти',
            'Ур. 5 → +150% — глубокие пласты дают втрое больше',
            'Требует много энергии — стоит дорого'
        ],
        baseCost: 500, costMult: 4.0, maxLevel: 5,
        stat: (a) => `+${(a.upgrades.deepDrill||0)*30}% глубина`
    },

    // ===== ГАЗ =====
    {
        id: 'gasSpeed',
        name: '⚡ Скорость добычи газа',
        icon: '🔥',
        category: 'gas',
        desc: 'Увеличивает скорость добычи природного газа на 20% за уровень.',
        details: [
            'Ур. 1 → +20% добычи газа',
            'Ур. 5 → +100% (×2 к базе)',
            'Ур. 10 → +200% (×3 к базе)',
            'Стекается с количеством газовых вышек'
        ],
        baseCost: 40, costMult: 2.0, maxLevel: 10,
        stat: (a) => `${(a.getGasPerSec()*3600).toFixed(0)} м³/ч`
    },
    {
        id: 'gasTurbine',
        name: '🌀 Газовая турбина',
        icon: '🌀',
        category: 'gas',
        desc: 'Турбина сжигает газ для ускорения добычи нефти — газ работает как топливо.',
        details: [
            'Ур. 1 → газ даёт +10% к добыче нефти',
            'Ур. 3 → газ даёт +30% к добыче нефти',
            'Ур. 5 → газ даёт +50% к добыче нефти',
            'Чем больше газа в хранилище — тем сильнее бонус'
        ],
        baseCost: 300, costMult: 3.2, maxLevel: 5,
        stat: (a) => `+${(a.upgrades.gasTurbine||0)*10}% к нефти`
    },
    {
        id: 'gasCompressor',
        name: '🔄 Компрессор газа',
        icon: '🔄',
        category: 'gas',
        desc: 'Сжимает газ — в то же хранилище помещается в 2× больше.',
        details: [
            'Ур. 1 → ёмкость газохранилища ×1.3',
            'Ур. 3 → ёмкость ×1.9',
            'Ур. 5 → ёмкость ×2.5 — вдвое больше газа без новых танков',
            'Дешевле чем покупать новые газовые танки'
        ],
        baseCost: 180, costMult: 2.8, maxLevel: 5,
        stat: (a) => `×${(1 + (a.upgrades.gasCompressor||0)*0.3).toFixed(1)} к ёмкости`
    },
    {
        id: 'gasConverter',
        name: '⚗️ Конвертер газа',
        icon: '⚗️',
        category: 'gas',
        desc: 'Конвертирует часть газа в RURC — газ становится источником дохода.',
        details: [
            'Ур. 1 → 1% газа в хранилище → RURC каждые 10 сек',
            'Ур. 3 → 3% газа → RURC каждые 10 сек',
            'Ур. 5 → 5% газа → RURC каждые 10 сек',
            'Газ расходуется — следи за хранилищем'
        ],
        baseCost: 400, costMult: 3.8, maxLevel: 5,
        stat: (a) => `${(a.upgrades.gasConverter||0)}% газа → RURC`
    },
    {
        id: 'gasInsulation',
        name: '🧱 Изоляция трубопровода',
        icon: '🧱',
        category: 'gas',
        desc: 'Снижает утечки газа при транспортировке — меньше потерь.',
        details: [
            'Ур. 1 → утечки -20%',
            'Ур. 3 → утечки -60%',
            'Ур. 5 → утечки практически отсутствуют',
            'Особенно важно при большом числе газовых вышек'
        ],
        baseCost: 130, costMult: 2.3, maxLevel: 5,
        stat: (a) => `-${(a.upgrades.gasInsulation||0)*20}% утечек`
    },

    // ===== ХРАНИЛИЩЕ =====
    {
        id: 'oilCapacity',
        name: '🏗️ Ёмкость нефтехранилища',
        icon: '🏗️',
        category: 'storage',
        desc: 'Увеличивает максимальную ёмкость нефтяного резервуара на 50 барр за уровень.',
        details: [
            'Ур. 1 → +50 барр (итого 150)',
            'Ур. 5 → +250 барр (итого 350)',
            'Ур. 10 → +500 барр (итого 600)',
            'Ур. 20 → +1000 барр (итого 1100)'
        ],
        baseCost: 100, costMult: 1.8, maxLevel: 20,
        stat: (a) => `${a.oilCapacity} барр`
    },
    {
        id: 'gasCapacity',
        name: '🏗️ Ёмкость газохранилища',
        icon: '🏗️',
        category: 'storage',
        desc: 'Увеличивает максимальную ёмкость газового резервуара на 500 м³ за уровень.',
        details: [
            'Ур. 1 → +500 м³ (итого 1500)',
            'Ур. 5 → +2500 м³ (итого 3500)',
            'Ур. 10 → +5000 м³ (итого 6000)',
            'Ур. 20 → +10000 м³ (итого 11000)'
        ],
        baseCost: 80, costMult: 1.8, maxLevel: 20,
        stat: (a) => `${a.gasCapacity} м³`
    },
    {
        id: 'pipelineExt',
        name: '🔧 Расширение трубопровода',
        icon: '🔧',
        category: 'storage',
        desc: 'Увеличивает скорость перекачки — меньше потерь при переполнении.',
        details: [
            'Ур. 1 → потери при переполнении -20%',
            'Ур. 3 → потери -60%',
            'Ур. 5 → потери практически отсутствуют',
            'Критично при высокой скорости добычи'
        ],
        baseCost: 180, costMult: 2.2, maxLevel: 5,
        stat: (a) => `-${(a.upgrades.pipelineExt||0)*20}% потерь`
    },
    {
        id: 'smartStorage',
        name: '🤖 Умное хранилище',
        icon: '🤖',
        category: 'storage',
        desc: 'Автоматически балансирует нефть и газ между резервуарами.',
        details: [
            'Одноразовое улучшение',
            'Нефть и газ не переполняются — излишки перераспределяются',
            'Добыча никогда не останавливается из-за полного хранилища',
            'Обязательно для поздней игры'
        ],
        baseCost: 600, costMult: 1.0, maxLevel: 1,
        stat: (a) => (a.upgrades.smartStorage >= 1 ? '✅ Активно' : '❌ Не куплено')
    }
];

const UPGRADE_CATEGORIES = {
    oil:     { label: '🛢️ Нефть',    color: '#FF8C00' },
    gas:     { label: '🔥 Газ',      color: '#4ade80' },
    storage: { label: '🏗️ Хранилище', color: '#a78bfa' }
};

function getUpgradeCost(upg) {
    const app = window.rurcoinApp;
    const level = app ? (app.upgrades[upg.id] || 0) : 0;
    return Math.round(upg.baseCost * Math.pow(upg.costMult, level));
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
            const canAfford = app.balance >= cost;
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
                                   💰 ${cost.toLocaleString()}
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
    if (app.balance < cost) {
        const btn = document.querySelector(`button[onclick="buyUpgrade('${upgradeId}')"]`);
        if (btn) {
            const orig = btn.innerHTML;
            btn.style.background = 'rgba(255,34,68,0.6)';
            btn.textContent = '❌ Мало RURC';
            setTimeout(() => { btn.style.background = 'rgba(80,80,80,0.4)'; btn.innerHTML = orig; }, 1200);
        }
        return;
    }
    app.balance -= cost;
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
        const canAfford = app.balance >= cost;
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
                    💰 ${cost.toLocaleString()} RURC
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
    if (app.balance < cost) {
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
