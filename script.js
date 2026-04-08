// ââ ÐÐ¾Ð»Ð¸ÑÐ¸Ð»Ð» showToast ââââââââââââââââââââââââââââââââââââââââââ
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

// RURCoin Oil & Gas Ã¢ÂÂ Main Script
// fix: event delegation ÃÂ´ÃÂ»ÃÂ ÃÂ²ÃÂºÃÂ»ÃÂ°ÃÂ´ÃÂ¾ÃÂº (ÃÂÃÂ°ÃÂ±ÃÂ¾ÃÂÃÂ°ÃÂµÃÂ ÃÂ ÃÂ´ÃÂ¸ÃÂ½ÃÂ°ÃÂ¼ÃÂ¸ÃÂÃÂµÃÂÃÂºÃÂ¸ÃÂ¼ÃÂ¸ ÃÂºÃÂ½ÃÂ¾ÃÂ¿ÃÂºÃÂ°ÃÂ¼ÃÂ¸)

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
        // ÃÂÃÂÃÂÃÂ»ÃÂ°ÃÂ¹ÃÂ½-ÃÂ¿ÃÂÃÂ¾ÃÂ³ÃÂÃÂµÃÂÃÂ
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
        this.showMessage('Ã°ÂÂÂ¢Ã¯Â¸Â ÃÂÃÂÃÂ¾ÃÂ´ÃÂ°ÃÂ½ÃÂ¾! +' + earned.toFixed(2) + ' RURC');
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
        this.showMessage('Ã°ÂÂÂ¥ ÃÂÃÂÃÂ¾ÃÂ´ÃÂ°ÃÂ½ÃÂ¾! +' + earned.toFixed(2) + ' RURC');
    }

    buyOilPump() {
        const cost = this.getOilPumpCost();
        if (this.balance < cost) { this.showMessage('Ã¢ÂÂ ÃÂÃÂµÃÂ´ÃÂ¾ÃÂÃÂÃÂ°ÃÂÃÂ¾ÃÂÃÂ½ÃÂ¾ RURC'); return; }
        this.balance -= cost;
        this.oilPumps++;
        if (!this.isMining && this.oilPumps === 1) this.isMining = true;
        this.saveData();
        this.render();
        this.showMessage('Ã°ÂÂÂ¢Ã¯Â¸Â ÃÂÃÂ°ÃÂÃÂ¾ÃÂ ÃÂºÃÂÃÂ¿ÃÂ»ÃÂµÃÂ½! ÃÂÃÂÃÂµÃÂ³ÃÂ¾: ' + this.oilPumps);
    }

    buyGasTower() {
        const cost = this.getGasTowerCost();
        if (this.balance < cost) { this.showMessage('Ã¢ÂÂ ÃÂÃÂµÃÂ´ÃÂ¾ÃÂÃÂÃÂ°ÃÂÃÂ¾ÃÂÃÂ½ÃÂ¾ RURC'); return; }
        this.balance -= cost;
        this.gasTowers++;
        if (!this.isMining && this.gasTowers === 1) this.isMining = true;
        this.saveData();
        this.render();
        this.showMessage('Ã°ÂÂÂÃ¯Â¸Â ÃÂÃÂÃÂÃÂºÃÂ° ÃÂºÃÂÃÂ¿ÃÂ»ÃÂµÃÂ½ÃÂ°! ÃÂÃÂÃÂµÃÂ³ÃÂ¾: ' + this.gasTowers);
    }

    buyOilTank() {
        const cost = this.getOilTankCost();
        if (this.balance < cost) { this.showMessage('Ã¢ÂÂ ÃÂÃÂµÃÂ´ÃÂ¾ÃÂÃÂÃÂ°ÃÂÃÂ¾ÃÂÃÂ½ÃÂ¾ RURC'); return; }
        this.balance -= cost;
        this.oilTanks++;
        this.oilCapacity += 50;
        this.saveData();
        this.render();
        this.showMessage('Ã°ÂÂÂ¢Ã¯Â¸Â ÃÂ¦ÃÂ¸ÃÂÃÂÃÂµÃÂÃÂ½ÃÂ° ÃÂºÃÂÃÂ¿ÃÂ»ÃÂµÃÂ½ÃÂ°! ÃÂÃÂ¼ÃÂºÃÂ¾ÃÂÃÂÃÂ: ' + this.oilCapacity);
    }

    buyGasTank() {
        const cost = this.getGasTankCost();
        if (this.balance < cost) { this.showMessage('Ã¢ÂÂ ÃÂÃÂµÃÂ´ÃÂ¾ÃÂÃÂÃÂ°ÃÂÃÂ¾ÃÂÃÂ½ÃÂ¾ RURC'); return; }
        this.balance -= cost;
        this.gasTanks++;
        this.gasCapacity += 500;
        this.saveData();
        this.render();
        this.showMessage('Ã¢ÂÂ½ ÃÂ¦ÃÂ¸ÃÂÃÂÃÂµÃÂÃÂ½ÃÂ° ÃÂºÃÂÃÂ¿ÃÂ»ÃÂµÃÂ½ÃÂ°! ÃÂÃÂ¼ÃÂºÃÂ¾ÃÂÃÂÃÂ: ' + this.gasCapacity);
    }

    getOilPumpCost() { return Math.floor(10 * Math.pow(1.5, this.oilPumps)); }
    getGasTowerCost() { return Math.floor(25 * Math.pow(1.6, this.gasTowers)); }
    getOilTankCost() { return Math.floor(50 * Math.pow(1.4, this.oilTanks)); }
    getGasTankCost() { return Math.floor(80 * Math.pow(1.4, this.gasTanks)); }

    stake(amount) {
        if (amount <= 0 || this.balance < amount) { this.showMessage('Ã¢ÂÂ ÃÂÃÂµÃÂ´ÃÂ¾ÃÂÃÂÃÂ°ÃÂÃÂ¾ÃÂÃÂ½ÃÂ¾ RURC'); return; }
        this.balance -= amount;
        this.stakedBalance += amount;
        this.saveData();
        this.render();
        this.showMessage('Ã°ÂÂÂ ÃÂÃÂ°ÃÂÃÂÃÂµÃÂ¹ÃÂºÃÂ°ÃÂ½ÃÂ¾ ' + amount.toFixed(2) + ' RURC');
    }

    unstake() {
        if (this.stakedBalance <= 0) { this.showMessage('Ã¢ÂÂ ÃÂÃÂµÃÂ ÃÂ·ÃÂ°ÃÂÃÂÃÂµÃÂ¹ÃÂºÃÂ°ÃÂ½ÃÂ½ÃÂÃÂ ÃÂÃÂÃÂµÃÂ´ÃÂÃÂÃÂ²'); return; }
        const total = this.stakedBalance + this.stakingRewards;
        this.balance += total;
        this.stakedBalance = 0;
        this.stakingRewards = 0;
        this.saveData();
        this.render();
        this.showMessage('Ã°ÂÂÂ ÃÂÃÂÃÂ²ÃÂµÃÂ´ÃÂµÃÂ½ÃÂ¾ ' + total.toFixed(2) + ' RURC');
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
        set('miningStatus', this.isMining ? 'Ã¢ÂÂ¡ ÃÂÃÂ¾ÃÂ±ÃÂÃÂÃÂ° ÃÂ°ÃÂºÃÂÃÂ¸ÃÂ²ÃÂ½ÃÂ°' : 'Ã¢ÂÂ¸Ã¯Â¸Â ÃÂÃÂÃÂÃÂ°ÃÂ½ÃÂ¾ÃÂ²ÃÂ»ÃÂµÃÂ½ÃÂ°');
        set('totalMined', this.totalMined.toFixed(1));

        // ÃÂÃÂÃÂ¾ÃÂ³ÃÂÃÂµÃÂÃÂ-ÃÂ±ÃÂ°ÃÂÃÂ ÃÂÃÂ¸ÃÂÃÂÃÂµÃÂÃÂ½
        const oilPct = Math.min(100, (this.oilStored / this.oilCapacity) * 100);
        const gasPct = Math.min(100, (this.gasStored / this.gasCapacity) * 100);
        const oilBar = document.getElementById('oilBar');
        const gasBar = document.getElementById('gasBar');
        if (oilBar) oilBar.style.width = oilPct + '%';
        if (gasBar) gasBar.style.width = gasPct + '%';

        // ÃÂÃÂ½ÃÂ¸ÃÂ¼ÃÂ°ÃÂÃÂ¸ÃÂ ÃÂÃÂ¸ÃÂÃÂÃÂµÃÂÃÂ½
        const oilFill = document.getElementById('oilTankFill');
        const gasFill = document.getElementById('gasTankFill');
        if (oilFill) oilFill.style.height = oilPct + '%';
        if (gasFill) gasFill.style.height = gasPct + '%';
    }
}

// Ã¢ÂÂÃ¢ÂÂ ÃÂÃÂÃÂÃÂ¦ÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¦ÃÂÃÂ¯ Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
document.addEventListener('DOMContentLoaded', function() {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.ready) {
        window.Telegram.WebApp.ready();
    }
    try {
        window.rurcoinApp = new RURCoinMiner();
    } catch (e) {
        console.error('[App] Ошибка инициализации RURCoinMiner:', e);
    }

// ââ ÐÐ°ÑÐ¸ÑÐ»ÐµÐ½Ð¸Ðµ RURC Ð¿Ð¾ÑÐ»Ðµ Ð¾Ð¿Ð»Ð°ÑÑ Ð¡ÐÐ âââââââââââââââââââââââââ
window.mintWithUI = function(rurcAmount) {
    const app = window.rurcoinApp;
    if (!app) { console.error('rurcoinApp Ð½Ðµ Ð¸Ð½Ð¸ÑÐ¸Ð°Ð»Ð¸Ð·Ð¸ÑÐ¾Ð²Ð°Ð½'); return; }
    const amount = parseFloat(rurcAmount);
    if (!amount || amount <= 0) return;

    app.balance = Math.max(0, (app.balance || 0) + amount);
    app.totalMined = (app.totalMined || 0) + amount;

    // ÐÐ¾Ð±Ð°Ð²Ð»ÑÐµÐ¼ Ð² Ð¸ÑÑÐ¾ÑÐ¸Ñ ÑÑÐ°Ð½Ð·Ð°ÐºÑÐ¸Ð¹
    if (!app.transactions) app.transactions = [];
    app.transactions.unshift({
        type: 'topup',
        amount: amount,
        method: 'Ð¡ÐÐ',
        date: new Date().toISOString(),
        id: 'SBP_' + Date.now()
    });

    app.saveData();
    app.render();
    console.log('â ÐÐ°ÑÐ¸ÑÐ»ÐµÐ½Ð¾', amount, 'RURC. ÐÐ¾Ð²ÑÐ¹ Ð±Ð°Ð»Ð°Ð½Ñ:', app.balance);
};
    console.log('RURCoin Oil & Gas ÃÂ·ÃÂ°ÃÂ¿ÃÂÃÂÃÂµÃÂ½ÃÂ¾!');

    // Ã¢ÂÂÃ¢ÂÂ ÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂ®ÃÂ§ÃÂÃÂÃÂÃÂ ÃÂÃÂÃÂÃÂÃÂÃÂÃÂ (event delegation Ã¢ÂÂ ÃÂÃÂ°ÃÂ±ÃÂ¾ÃÂÃÂ°ÃÂµÃÂ ÃÂ´ÃÂ»ÃÂ ÃÂ´ÃÂ¸ÃÂ½ÃÂ°ÃÂ¼ÃÂ¸ÃÂÃÂµÃÂÃÂºÃÂ¸ÃÂ ÃÂºÃÂ½ÃÂ¾ÃÂ¿ÃÂ¾ÃÂº) Ã¢ÂÂÃ¢ÂÂ
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

    // Event delegation Ã¢ÂÂ ÃÂ»ÃÂ¾ÃÂ²ÃÂ¸ÃÂ¼ ÃÂºÃÂ»ÃÂ¸ÃÂºÃÂ¸ ÃÂ½ÃÂ° ÃÂÃÂ®ÃÂÃÂÃÂ .tab-btn, ÃÂ´ÃÂ°ÃÂ¶ÃÂµ ÃÂ´ÃÂ¾ÃÂ±ÃÂ°ÃÂ²ÃÂ»ÃÂµÃÂ½ÃÂ½ÃÂ¾ÃÂ¹ ÃÂ¿ÃÂ¾ÃÂ·ÃÂ¶ÃÂµ
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.tab-btn');
        if (!btn) return;
        const tabId = btn.getAttribute('data-tab');
        if (!tabId) return;
        switchTab(tabId);
        // Ripple ÃÂ°ÃÂ½ÃÂ¸ÃÂ¼ÃÂ°ÃÂÃÂ¸ÃÂ
        const ripple = document.createElement('span');
        ripple.className = 'btn-ripple';
        ripple.style.cssText = 'position:absolute;border-radius:50%;background:rgba(255,107,0,0.4);width:80px;height:80px;margin-top:-40px;margin-left:-40px;animation:ripple-anim 0.5s linear;pointer-events:none;';
        btn.style.position = 'relative';
        btn.style.overflow = 'hidden';
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 500);
    });

    // ÃÂÃÂ¾ÃÂºÃÂ°ÃÂ·ÃÂÃÂ²ÃÂ°ÃÂµÃÂ¼ ÃÂ¿ÃÂµÃÂÃÂ²ÃÂÃÂ ÃÂ²ÃÂºÃÂ»ÃÂ°ÃÂ´ÃÂºÃÂ
    switchTab('mining');

});

// ÃÂÃÂ±ÃÂ½ÃÂ¾ÃÂ²ÃÂ»ÃÂÃÂµÃÂ¼ UI ÃÂ¿ÃÂÃÂ¸ ÃÂ¸ÃÂ·ÃÂ¼ÃÂµÃÂ½ÃÂµÃÂ½ÃÂ¸ÃÂ¸ ÃÂÃÂµÃÂ½
window.addEventListener('storage', function(e) {
    if (e.key === 'rurcoin_data' && window.rurcoinApp) {
        window.rurcoinApp.loadData();
        window.rurcoinApp.render();
    }
});


// ============================================================
//  switchResourceSlide â Ð¿ÐµÑÐµÐºÐ»ÑÑÐµÐ½Ð¸Ðµ Ð½ÐµÑÑÑ / Ð³Ð°Ð· Ð² mining
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
//  renderUpgrades â Ð¾ÑÑÐ¸ÑÐ¾Ð²ÐºÐ° Ð²ÐºÐ»Ð°Ð´ÐºÐ¸ ÑÐ»ÑÑÑÐµÐ½Ð¸Ð¹
// ============================================================
//  UPGRADES â ÑÐ¿Ð¸ÑÐ¾Ðº ÑÐ»ÑÑÑÐµÐ½Ð¸Ð¹ Ñ Ð¿Ð¾Ð´ÑÐ¾Ð±Ð½ÑÐ¼Ð¸ Ð¾Ð¿Ð¸ÑÐ°Ð½Ð¸ÑÐ¼Ð¸
// ============================================================
const UPGRADES_LIST = [
    {
        id: 'oilSpeed',
        name: 'â¡ Ð¡ÐºÐ¾ÑÐ¾ÑÑÑ Ð´Ð¾Ð±ÑÑÐ¸ Ð½ÐµÑÑÐ¸',
        icon: 'ð¢ï¸',
        category: 'oil',
        desc: 'Ð£Ð²ÐµÐ»Ð¸ÑÐ¸Ð²Ð°ÐµÑ ÑÐºÐ¾ÑÐ¾ÑÑÑ Ð´Ð¾Ð±ÑÑÐ¸ Ð½ÐµÑÑÐ¸ Ð½Ð° 20% Ð·Ð° ÐºÐ°Ð¶Ð´ÑÐ¹ ÑÑÐ¾Ð²ÐµÐ½Ñ.',
        details: [
            'Ð£Ñ. 1 â +20% Ð´Ð¾Ð±ÑÑÐ¸ Ð½ÐµÑÑÐ¸',
            'Ð£Ñ. 5 â +100% (Ã2 Ðº Ð±Ð°Ð·Ðµ)',
            'Ð£Ñ. 10 â +200% (Ã3 Ðº Ð±Ð°Ð·Ðµ)',
            'Ð Ð°Ð±Ð¾ÑÐ°ÐµÑ Ð¿Ð°ÑÑÐ¸Ð²Ð½Ð¾ â Ð½ÐµÑÑÑ Ð´Ð¾Ð±ÑÐ²Ð°ÐµÑÑÑ Ð±ÑÑÑÑÐµÐµ Ð±ÐµÐ· Ð´ÐµÐ¹ÑÑÐ²Ð¸Ð¹'
        ],
        baseCost: 50, costMult: 2.2, maxLevel: 10,
        stat: (a) => `${(a.getOilPerSec()*3600).toFixed(1)} Ð±Ð°ÑÑ/Ñ`
    },
    {
        id: 'gasSpeed',
        name: 'â¡ Ð¡ÐºÐ¾ÑÐ¾ÑÑÑ Ð´Ð¾Ð±ÑÑÐ¸ Ð³Ð°Ð·Ð°',
        icon: 'ð¥',
        category: 'gas',
        desc: 'Ð£Ð²ÐµÐ»Ð¸ÑÐ¸Ð²Ð°ÐµÑ ÑÐºÐ¾ÑÐ¾ÑÑÑ Ð´Ð¾Ð±ÑÑÐ¸ Ð¿ÑÐ¸ÑÐ¾Ð´Ð½Ð¾Ð³Ð¾ Ð³Ð°Ð·Ð° Ð½Ð° 20% Ð·Ð° ÑÑÐ¾Ð²ÐµÐ½Ñ.',
        details: [
            'Ð£Ñ. 1 â +20% Ð´Ð¾Ð±ÑÑÐ¸ Ð³Ð°Ð·Ð°',
            'Ð£Ñ. 5 â +100% (Ã2 Ðº Ð±Ð°Ð·Ðµ)',
            'Ð£Ñ. 10 â +200% (Ã3 Ðº Ð±Ð°Ð·Ðµ)',
            'Ð¡ÑÐµÐºÐ°ÐµÑÑÑ Ñ ÐºÐ¾Ð»Ð¸ÑÐµÑÑÐ²Ð¾Ð¼ Ð³Ð°Ð·Ð¾Ð²ÑÑ Ð²ÑÑÐµÐº'
        ],
        baseCost: 40, costMult: 2.0, maxLevel: 10,
        stat: (a) => `${(a.getGasPerSec()*3600).toFixed(0)} Ð¼Â³/Ñ`
    },
    {
        id: 'oilPrice',
        name: 'ð° Ð¦ÐµÐ½Ð° Ð¿ÑÐ¾Ð´Ð°Ð¶Ð¸ Ð½ÐµÑÑÐ¸',
        icon: 'ð',
        category: 'oil',
        desc: 'ÐÐ¾Ð²ÑÑÐ°ÐµÑ ÑÐµÐ½Ñ Ð¿ÑÐ¾Ð´Ð°Ð¶Ð¸ Ð½ÐµÑÑÐ¸ Ð½Ð° 15% Ð·Ð° ÐºÐ°Ð¶Ð´ÑÐ¹ ÑÑÐ¾Ð²ÐµÐ½Ñ.',
        details: [
            'Ð£Ñ. 1 â +15% Ðº ÑÐµÐ½Ðµ Ð½ÐµÑÑÐ¸',
            'Ð£Ñ. 4 â +60% Ðº ÑÐµÐ½Ðµ Ð½ÐµÑÑÐ¸',
            'Ð£Ñ. 8 â +120% Ðº ÑÐµÐ½Ðµ Ð½ÐµÑÑÐ¸',
            'ÐÐ»Ð¸ÑÐµÑ Ð½Ð° ÑÑÑÐ½ÑÑ Ð¸ Ð°Ð²ÑÐ¾-Ð¿ÑÐ¾Ð´Ð°Ð¶Ñ'
        ],
        baseCost: 80, costMult: 2.5, maxLevel: 8,
        stat: (a) => `$${a.getOilSellPrice().toFixed(2)}/Ð±Ð°ÑÑ`
    },
    {
        id: 'gasPrice',
        name: 'ð° Ð¦ÐµÐ½Ð° Ð¿ÑÐ¾Ð´Ð°Ð¶Ð¸ Ð³Ð°Ð·Ð°',
        icon: 'ð',
        category: 'gas',
        desc: 'ÐÐ¾Ð²ÑÑÐ°ÐµÑ ÑÐµÐ½Ñ Ð¿ÑÐ¾Ð´Ð°Ð¶Ð¸ Ð³Ð°Ð·Ð° Ð½Ð° 15% Ð·Ð° ÐºÐ°Ð¶Ð´ÑÐ¹ ÑÑÐ¾Ð²ÐµÐ½Ñ.',
        details: [
            'Ð£Ñ. 1 â +15% Ðº ÑÐµÐ½Ðµ Ð³Ð°Ð·Ð°',
            'Ð£Ñ. 4 â +60% Ðº ÑÐµÐ½Ðµ Ð³Ð°Ð·Ð°',
            'Ð£Ñ. 8 â +120% Ðº ÑÐµÐ½Ðµ Ð³Ð°Ð·Ð°',
            'ÐÐ»Ð¸ÑÐµÑ Ð½Ð° ÑÑÑÐ½ÑÑ Ð¸ Ð°Ð²ÑÐ¾-Ð¿ÑÐ¾Ð´Ð°Ð¶Ñ'
        ],
        baseCost: 60, costMult: 2.3, maxLevel: 8,
        stat: (a) => `$${a.getGasSellPrice().toFixed(3)}/Ð¼Â³`
    },
    {
        id: 'autoSell',
        name: 'ð¤ ÐÐ²ÑÐ¾-Ð¿ÑÐ¾Ð´Ð°Ð¶Ð°',
        icon: 'ð¤',
        category: 'auto',
        desc: 'ÐÐ²ÑÐ¾Ð¼Ð°ÑÐ¸ÑÐµÑÐºÐ¸ Ð¿ÑÐ¾Ð´Ð°ÑÑ Ð½ÐµÑÑÑ Ð¸ Ð³Ð°Ð· Ð¿ÑÐ¸ Ð·Ð°Ð¿Ð¾Ð»Ð½ÐµÐ½Ð¸Ð¸ ÑÑÐ°Ð½Ð¸Ð»Ð¸ÑÐ°.',
        details: [
            'ÐÑÐ¾Ð´Ð°ÑÑ Ð½ÐµÑÑÑ Ð¿ÑÐ¸ Ð·Ð°Ð¿Ð¾Ð»Ð½ÐµÐ½Ð¸Ð¸ ÑÐµÐ·ÐµÑÐ²ÑÐ°ÑÐ° Ð½Ð° 100%',
            'ÐÑÐ¾Ð´Ð°ÑÑ Ð³Ð°Ð· Ð¿ÑÐ¸ Ð·Ð°Ð¿Ð¾Ð»Ð½ÐµÐ½Ð¸Ð¸ ÑÐµÐ·ÐµÑÐ²ÑÐ°ÑÐ° Ð½Ð° 100%',
            'Ð Ð°Ð±Ð¾ÑÐ°ÐµÑ Ð² ÑÐ¾Ð½Ðµ â Ð½Ðµ Ð½ÑÐ¶Ð½Ð¾ Ð½Ð°Ð¶Ð¸Ð¼Ð°ÑÑ ÐºÐ½Ð¾Ð¿ÐºÐ¸',
            'ÐÐ´Ð½Ð¾ÑÐ°Ð·Ð¾Ð²Ð¾Ðµ ÑÐ»ÑÑÑÐµÐ½Ð¸Ðµ â 1 ÑÑÐ¾Ð²ÐµÐ½Ñ'
        ],
        baseCost: 200, costMult: 3.0, maxLevel: 1,
        stat: (a) => (a.upgrades.autoSell >= 1 ? 'â ÐÐºÑÐ¸Ð²Ð½Ð¾' : 'â ÐÐµ ÐºÑÐ¿Ð»ÐµÐ½Ð¾')
    },
    {
        id: 'oilCapacity',
        name: 'ðï¸ ÐÐ¼ÐºÐ¾ÑÑÑ Ð½ÐµÑÑÐµÑÑÐ°Ð½Ð¸Ð»Ð¸ÑÐ°',
        icon: 'ðï¸',
        category: 'storage',
        desc: 'Ð£Ð²ÐµÐ»Ð¸ÑÐ¸Ð²Ð°ÐµÑ Ð¼Ð°ÐºÑÐ¸Ð¼Ð°Ð»ÑÐ½ÑÑ ÑÐ¼ÐºÐ¾ÑÑÑ Ð½ÐµÑÑÑÐ½Ð¾Ð³Ð¾ ÑÐµÐ·ÐµÑÐ²ÑÐ°ÑÐ° Ð½Ð° 50 Ð±Ð°ÑÑ Ð·Ð° ÑÑÐ¾Ð²ÐµÐ½Ñ.',
        details: [
            'Ð£Ñ. 1 â +50 Ð±Ð°ÑÑ (Ð¸ÑÐ¾Ð³Ð¾ 150)',
            'Ð£Ñ. 5 â +250 Ð±Ð°ÑÑ (Ð¸ÑÐ¾Ð³Ð¾ 350)',
            'Ð£Ñ. 10 â +500 Ð±Ð°ÑÑ (Ð¸ÑÐ¾Ð³Ð¾ 600)',
            'Ð£Ñ. 20 â +1000 Ð±Ð°ÑÑ (Ð¸ÑÐ¾Ð³Ð¾ 1100)',
            'ÐÐ¾Ð»ÑÑÐµ ÑÐ¼ÐºÐ¾ÑÑÑ = ÑÐµÐ¶Ðµ Ð½ÑÐ¶Ð½Ð¾ Ð¿ÑÐ¾Ð´Ð°Ð²Ð°ÑÑ'
        ],
        baseCost: 100, costMult: 1.8, maxLevel: 20,
        stat: (a) => `${a.oilCapacity} Ð±Ð°ÑÑ`
    },
    {
        id: 'gasCapacity',
        name: 'ðï¸ ÐÐ¼ÐºÐ¾ÑÑÑ Ð³Ð°Ð·Ð¾ÑÑÐ°Ð½Ð¸Ð»Ð¸ÑÐ°',
        icon: 'ðï¸',
        category: 'storage',
        desc: 'Ð£Ð²ÐµÐ»Ð¸ÑÐ¸Ð²Ð°ÐµÑ Ð¼Ð°ÐºÑÐ¸Ð¼Ð°Ð»ÑÐ½ÑÑ ÑÐ¼ÐºÐ¾ÑÑÑ Ð³Ð°Ð·Ð¾Ð²Ð¾Ð³Ð¾ ÑÐµÐ·ÐµÑÐ²ÑÐ°ÑÐ° Ð½Ð° 500 Ð¼Â³ Ð·Ð° ÑÑÐ¾Ð²ÐµÐ½Ñ.',
        details: [
            'Ð£Ñ. 1 â +500 Ð¼Â³ (Ð¸ÑÐ¾Ð³Ð¾ 1500)',
            'Ð£Ñ. 5 â +2500 Ð¼Â³ (Ð¸ÑÐ¾Ð³Ð¾ 3500)',
            'Ð£Ñ. 10 â +5000 Ð¼Â³ (Ð¸ÑÐ¾Ð³Ð¾ 6000)',
            'Ð£Ñ. 20 â +10000 Ð¼Â³ (Ð¸ÑÐ¾Ð³Ð¾ 11000)',
            'ÐÐ¾Ð»ÑÑÐµ ÑÐ¼ÐºÐ¾ÑÑÑ = ÑÐµÐ¶Ðµ Ð½ÑÐ¶Ð½Ð¾ Ð¿ÑÐ¾Ð´Ð°Ð²Ð°ÑÑ'
        ],
        baseCost: 80, costMult: 1.8, maxLevel: 20,
        stat: (a) => `${a.gasCapacity} Ð¼Â³`
    }
];

const UPGRADE_CATEGORIES = {
    oil:     { label: 'ð¢ï¸ ÐÐµÑÑÑ',    color: '#FF8C00' },
    gas:     { label: 'ð¥ ÐÐ°Ð·',      color: '#4ade80' },
    auto:    { label: 'ð¤ ÐÐ²ÑÐ¾',     color: '#60a5fa' },
    storage: { label: 'ðï¸ Ð¥ÑÐ°Ð½Ð¸Ð»Ð¸ÑÐµ', color: '#a78bfa' }
};

function getUpgradeCost(upg) {
    const app = window.rurcoinApp;
    const level = app ? (app.upgrades[upg.id] || 0) : 0;
    return Math.round(upg.baseCost * Math.pow(upg.costMult, level));
}

// Ð¡Ð¾ÑÑÐ¾ÑÐ½Ð¸Ðµ ÑÐ°ÑÐºÑÑÑÑÑ ÐºÐ°ÑÑÐ¾ÑÐµÐº
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
        container.innerHTML = '<div style="color:#555;text-align:center;padding:20px;">ÐÐ°Ð³ÑÑÐ·ÐºÐ°...</div>';
        return;
    }

    // ÐÑÑÐ¿Ð¿Ð¸ÑÑÐµÐ¼ Ð¿Ð¾ ÐºÐ°ÑÐµÐ³Ð¾ÑÐ¸ÑÐ¼
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
                    <span style="color:${cat_.color};flex-shrink:0;">â¸</span>
                    <span style="color:#888;font-size:11px;line-height:1.4;">${d}</span>
                </div>`
            ).join('');

            html += `
            <div style="background:rgba(255,255,255,0.02);
                        border:1px solid ${maxed ? cat_.color + '66' : 'rgba(255,255,255,0.07)'};
                        border-radius:14px;padding:14px;margin-bottom:10px;
                        transition:all 0.2s;
                        ${maxed ? `box-shadow:0 0 12px ${cat_.color}22;` : ''}">

                <!-- Ð¨Ð°Ð¿ÐºÐ° ÐºÐ°ÑÑÐ¾ÑÐºÐ¸ -->
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

                <!-- ÐÑÐ¾Ð³ÑÐµÑÑ-Ð±Ð°Ñ -->
                <div style="background:rgba(0,0,0,0.4);border-radius:4px;height:5px;
                            margin-bottom:10px;overflow:hidden;">
                    <div style="height:100%;width:${pct}%;
                                background:${maxed
                                    ? 'linear-gradient(90deg,#FFD700,#FF8C00)'
                                    : `linear-gradient(90deg,${cat_.color},${cat_.color}88)`};
                                transition:width 0.5s;border-radius:4px;"></div>
                </div>

                <!-- Ð¡ÑÐ°ÑÐ¸ÑÑÐ¸ÐºÐ° + ÐºÐ½Ð¾Ð¿ÐºÐ° -->
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;
                            margin-bottom:${expanded ? '10px' : '0'};">
                    <div style="display:flex;align-items:center;gap:6px;flex:1;min-width:0;">
                        <span style="font-size:10px;color:#555;">ð</span>
                        <span style="font-size:11px;color:#666;white-space:nowrap;overflow:hidden;
                                     text-overflow:ellipsis;">${statText}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                        <!-- ÐÐ½Ð¾Ð¿ÐºÐ° Ð¿Ð¾Ð´ÑÐ¾Ð±Ð½ÐµÐµ -->
                        <button onclick="toggleUpgradeDetails('${upg.id}')"
                                style="padding:7px 10px;border:1px solid rgba(255,255,255,0.1);
                                       border-radius:8px;cursor:pointer;font-size:11px;
                                       background:rgba(255,255,255,0.04);color:#888;
                                       transition:all 0.2s;">
                            ${expanded ? 'â²' : 'â¼'}
                        </button>
                        <!-- ÐÐ½Ð¾Ð¿ÐºÐ° ÐºÑÐ¿Ð¸ÑÑ -->
                        ${maxed
                            ? `<div style="padding:7px 14px;border-radius:8px;
                                          background:rgba(255,215,0,0.1);
                                          border:1px solid rgba(255,215,0,0.3);
                                          color:#FFD700;font-size:11px;font-weight:700;">
                                   â ÐÐÐÐ¡
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
                                   ð° ${cost.toLocaleString()}
                               </button>`
                        }
                    </div>
                </div>

                <!-- Ð Ð°ÑÐºÑÑÐ²Ð°ÑÑÐµÐµÑÑ Ð¾Ð¿Ð¸ÑÐ°Ð½Ð¸Ðµ -->
                ${expanded ? `
                <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:10px;
                            animation:slide-up 0.2s ease;">
                    <div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;
                                color:${cat_.color};margin-bottom:8px;font-weight:700;">
                        Ð§ÑÐ¾ Ð´Ð°ÑÑ ÑÐ»ÑÑÑÐµÐ½Ð¸Ðµ:
                    </div>
                    ${detailsHtml}
                    ${level > 0 && level < upg.maxLevel ? `
                    <div style="margin-top:8px;padding:8px;background:rgba(255,255,255,0.02);
                                border-radius:8px;border:1px solid rgba(255,255,255,0.05);">
                        <div style="font-size:10px;color:#555;margin-bottom:2px;">Ð¡Ð»ÐµÐ´ÑÑÑÐ¸Ð¹ ÑÑÐ¾Ð²ÐµÐ½Ñ:</div>
                        <div style="font-size:12px;color:${cat_.color};font-weight:700;">
                            Ð£ÑÐ¾Ð²ÐµÐ½Ñ ${level} â ${level+1} Â· Ð¡ÑÐ¾Ð¸Ð¼Ð¾ÑÑÑ: ${cost.toLocaleString()} RURC
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
            btn.textContent = 'â ÐÐ°Ð»Ð¾ RURC';
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
    if (window.showNotification) showNotification(`â ${upg.name} â ÑÑÐ¾Ð²ÐµÐ½Ñ ${level+1}!`, 'success');
}

window.renderUpgrades = renderUpgrades;
window.buyUpgrade = buyUpgrade;
window.toggleUpgradeDetails = toggleUpgradeDetails;

// ÐÐ²ÑÐ¾Ð¾Ð±Ð½Ð¾Ð²Ð»ÐµÐ½Ð¸Ðµ Ð¿ÑÐ¸ Ð¿ÐµÑÐµÐºÐ»ÑÑÐµÐ½Ð¸Ð¸ Ð½Ð° Ð²ÐºÐ»Ð°Ð´ÐºÑ ÑÐ»ÑÑÑÐµÐ½Ð¸Ð¹
document.addEventListener('click', function(e) {
    const btn = e.target.closest('.tab-btn');
    if (btn && btn.getAttribute('data-tab') === 'upgrades') {
        setTimeout(renderUpgrades, 50);
    }
});

// ÐÐ½Ð¸ÑÐ¸Ð°Ð»Ð¸Ð·Ð°ÑÐ¸Ñ Ð¿ÑÐ¸ Ð·Ð°Ð³ÑÑÐ·ÐºÐµ ÑÑÑÐ°Ð½Ð¸ÑÑ
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        switchResourceSlide('oil');
        renderUpgrades();
    }, 300);
});


// ============================================================
//  renderEquipment â Ð¾ÑÑÐ¸ÑÐ¾Ð²ÐºÐ° Ð²ÐºÐ»Ð°Ð´ÐºÐ¸ "ÐÐ±Ð¾ÑÑÐ´Ð¾Ð²Ð°Ð½Ð¸Ðµ"
// ============================================================
const EQUIPMENT_LIST = [
    {
        id: 'oilPump',
        name: 'ð¢ï¸ ÐÐµÑÑÑÐ½Ð°Ñ Ð¿Ð¾Ð¼Ð¿Ð°',
        desc: 'ÐÐ¾Ð±ÑÐ²Ð°ÐµÑ Ð½ÐµÑÑÑ. ÐÐ°Ð¶Ð´Ð°Ñ Ð¿Ð¾Ð¼Ð¿Ð° +0.05 Ð±Ð°ÑÑ/ÑÐµÐº',
        icon: 'ð¢ï¸',
        countKey: 'oilPumps',
        getCost: (app) => app.getOilPumpCost(),
        buy: (app) => { if (window.rurcoinApp) window.rurcoinApp.buyOilPump(); },
        stat: (app) => `${app.oilPumps} ÑÑ. Â· ${(app.getOilPerSec()*3600).toFixed(1)} Ð±Ð°ÑÑ/Ñ`,
        color: '#FF8C00'
    },
    {
        id: 'gasTower',
        name: 'ð¥ ÐÐ°Ð·Ð¾Ð²Ð°Ñ Ð²ÑÑÐºÐ°',
        desc: 'ÐÐ¾Ð±ÑÐ²Ð°ÐµÑ Ð¿ÑÐ¸ÑÐ¾Ð´Ð½ÑÐ¹ Ð³Ð°Ð·. ÐÐ°Ð¶Ð´Ð°Ñ Ð²ÑÑÐºÐ° +2 Ð¼Â³/ÑÐµÐº',
        icon: 'ð¥',
        countKey: 'gasTowers',
        getCost: (app) => app.getGasTowerCost(),
        buy: (app) => { if (window.rurcoinApp) window.rurcoinApp.buyGasTower(); },
        stat: (app) => `${app.gasTowers} ÑÑ. Â· ${(app.getGasPerSec()*3600).toFixed(0)} Ð¼Â³/Ñ`,
        color: '#4ade80'
    },
    {
        id: 'oilTank',
        name: 'ðï¸ ÐÐµÑÑÑÐ½Ð¾Ð¹ ÑÐµÐ·ÐµÑÐ²ÑÐ°Ñ',
        desc: 'Ð£Ð²ÐµÐ»Ð¸ÑÐ¸Ð²Ð°ÐµÑ ÑÐ¼ÐºÐ¾ÑÑÑ ÑÑÐ°Ð½Ð¸Ð»Ð¸ÑÐ° Ð½ÐµÑÑÐ¸ Ð½Ð° 50 Ð±Ð°ÑÑ',
        icon: 'ðï¸',
        countKey: 'oilTanks',
        getCost: (app) => app.getOilTankCost(),
        buy: (app) => { if (window.rurcoinApp) window.rurcoinApp.buyOilTank(); },
        stat: (app) => `${app.oilTanks} ÑÑ. Â· ÑÐ¼ÐºÐ¾ÑÑÑ ${app.oilCapacity} Ð±Ð°ÑÑ`,
        color: '#60a5fa'
    },
    {
        id: 'gasTank',
        name: 'â½ ÐÐ°Ð·Ð¾Ð²ÑÐ¹ ÑÐµÐ·ÐµÑÐ²ÑÐ°Ñ',
        desc: 'Ð£Ð²ÐµÐ»Ð¸ÑÐ¸Ð²Ð°ÐµÑ ÑÐ¼ÐºÐ¾ÑÑÑ ÑÑÐ°Ð½Ð¸Ð»Ð¸ÑÐ° Ð³Ð°Ð·Ð° Ð½Ð° 500 Ð¼Â³',
        icon: 'â½',
        countKey: 'gasTanks',
        getCost: (app) => app.getGasTankCost(),
        buy: (app) => { if (window.rurcoinApp) window.rurcoinApp.buyGasTank(); },
        stat: (app) => `${app.gasTanks} ÑÑ. Â· ÑÐ¼ÐºÐ¾ÑÑÑ ${app.gasCapacity} Ð¼Â³`,
        color: '#a78bfa'
    }
];

function renderEquipment() {
    const container = document.getElementById('equipmentList');
    if (!container) return;
    const app = window.rurcoinApp;
    if (!app) {
        container.innerHTML = '<div style="color:#555;text-align:center;padding:20px;">ÐÐ°Ð³ÑÑÐ·ÐºÐ°...</div>';
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
                    <div style="font-size:10px;color:#555;">ÐºÑÐ¿Ð»ÐµÐ½Ð¾</div>
                </div>
            </div>

            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;
                        padding-top:10px;border-top:1px solid rgba(255,255,255,0.05);">
                <div style="font-size:11px;color:#555;">ð ${statText}</div>
                <button onclick="buyEquipment('${eq.id}')"
                        style="padding:9px 18px;border:none;border-radius:10px;cursor:pointer;
                               font-size:12px;font-weight:700;color:#fff;white-space:nowrap;
                               transition:all 0.2s;flex-shrink:0;
                               background:${canAfford
                                   ? `linear-gradient(135deg,${eq.color},${eq.color}99)`
                                   : 'rgba(80,80,80,0.4)'};
                               opacity:${canAfford ? '1' : '0.55'};"
                        ${canAfford ? '' : 'disabled'}>
                    ð° ${cost.toLocaleString()} RURC
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
            btn.textContent = 'â ÐÐµÐ´Ð¾ÑÑÐ°ÑÐ¾ÑÐ½Ð¾';
            setTimeout(() => { btn.style.background = 'rgba(80,80,80,0.4)'; btn.innerHTML = orig; }, 1200);
        }
        return;
    }

    eq.buy(app);
    // ÐÐ¾ÑÐ»Ðµ Ð¿Ð¾ÐºÑÐ¿ÐºÐ¸ Ð¿ÐµÑÐµÑÐ¸ÑÐ¾Ð²ÑÐ²Ð°ÐµÐ¼
    setTimeout(() => {
        renderEquipment();
        renderUpgrades();
    }, 50);
}

window.renderEquipment = renderEquipment;
window.buyEquipment = buyEquipment;

// ÐÐ²ÑÐ¾Ð¾Ð±Ð½Ð¾Ð²Ð»ÐµÐ½Ð¸Ðµ Ð¿ÑÐ¸ Ð¿ÐµÑÐµÐºÐ»ÑÑÐµÐ½Ð¸Ð¸ Ð½Ð° Ð²ÐºÐ»Ð°Ð´ÐºÑ
document.addEventListener('click', function(e) {
    const btn = e.target.closest('.tab-btn');
    if (btn && btn.getAttribute('data-tab') === 'equipment') {
        setTimeout(renderEquipment, 50);
    }
});

// ÐÐ½Ð¸ÑÐ¸Ð°Ð»Ð¸Ð·Ð°ÑÐ¸Ñ
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(renderEquipment, 400);
});

// ââ ÐÑÐ¸ÑÑÐºÐ° ÑÐ°Ð¹Ð¼ÐµÑÐ¾Ð² Ð¿ÑÐ¸ Ð·Ð°ÐºÑÑÑÐ¸Ð¸ ââââââââââââââââââââââââââââââ
window.addEventListener('beforeunload', function() {
    if (window.rurcoinApp) {
        ['_miningInterval','_stakingInterval','_renderInterval'].forEach(k => {
            if (window.rurcoinApp[k]) clearInterval(window.rurcoinApp[k]);
        });
        try { window.rurcoinApp.saveData(); } catch(e) {}
    }
});
