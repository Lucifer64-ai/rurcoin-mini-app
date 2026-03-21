// RURCoin Oil & Gas — Main Script
// fix: event delegation для вкладок (работает с динамическими кнопками)

class RURCoinMiner {
    constructor() {
        this.balance = 0;
        this.tonBalance = 5;
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
            Object.assign(this, saved);
            this.lastUpdate = saved.lastUpdate || Date.now();
        } catch(e) { console.warn('Load error:', e); }
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
        // Оффлайн-прогресс
        const elapsed = (Date.now() - (this.lastUpdate || Date.now())) / 1000;
        if (elapsed > 0 && this.isMining) {
            const oilGained = Math.min(this.getOilPerSec() * elapsed, this.oilCapacity - this.oilStored);
            const gasGained = Math.min(this.getGasPerSec() * elapsed, this.gasCapacity - this.gasStored);
            this.oilStored = Math.min(this.oilCapacity, this.oilStored + oilGained);
            this.gasStored = Math.min(this.gasCapacity, this.gasStored + gasGained);
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
        this.saveData();
        this.render();
    }

    sellOil() {
        if (this.oilStored <= 0) return;
        const earned = this.oilStored * this.getOilSellPrice();
        this.balance += earned;
        this.transactions.unshift({ type: 'sell_oil', amount: earned, time: Date.now() });
        this.oilStored = 0;
        this.saveData();
        this.render();
        this.showMessage('🛢️ Продано! +' + earned.toFixed(2) + ' RURC');
    }

    sellGas() {
        if (this.gasStored <= 0) return;
        const earned = this.gasStored * this.getGasSellPrice();
        this.balance += earned;
        this.transactions.unshift({ type: 'sell_gas', amount: earned, time: Date.now() });
        this.gasStored = 0;
        this.saveData();
        this.render();
        this.showMessage('🔥 Продано! +' + earned.toFixed(2) + ' RURC');
    }

    buyOilPump() {
        const cost = this.getOilPumpCost();
        if (this.balance < cost) { this.showMessage('❌ Недостаточно RURC'); return; }
        this.balance -= cost;
        this.oilPumps++;
        if (!this.isMining && this.oilPumps === 1) this.isMining = true;
        this.saveData();
        this.render();
        this.showMessage('🛢️ Насос куплен! Всего: ' + this.oilPumps);
    }

    buyGasTower() {
        const cost = this.getGasTowerCost();
        if (this.balance < cost) { this.showMessage('❌ Недостаточно RURC'); return; }
        this.balance -= cost;
        this.gasTowers++;
        if (!this.isMining && this.gasTowers === 1) this.isMining = true;
        this.saveData();
        this.render();
        this.showMessage('🏗️ Вышка куплена! Всего: ' + this.gasTowers);
    }

    buyOilTank() {
        const cost = this.getOilTankCost();
        if (this.balance < cost) { this.showMessage('❌ Недостаточно RURC'); return; }
        this.balance -= cost;
        this.oilTanks++;
        this.oilCapacity += 50;
        this.saveData();
        this.render();
        this.showMessage('🛢️ Цистерна куплена! Ёмкость: ' + this.oilCapacity);
    }

    buyGasTank() {
        const cost = this.getGasTankCost();
        if (this.balance < cost) { this.showMessage('❌ Недостаточно RURC'); return; }
        this.balance -= cost;
        this.gasTanks++;
        this.gasCapacity += 500;
        this.saveData();
        this.render();
        this.showMessage('⛽ Цистерна куплена! Ёмкость: ' + this.gasCapacity);
    }

    getOilPumpCost() { return Math.floor(10 * Math.pow(1.5, this.oilPumps)); }
    getGasTowerCost() { return Math.floor(25 * Math.pow(1.6, this.gasTowers)); }
    getOilTankCost() { return Math.floor(50 * Math.pow(1.4, this.oilTanks)); }
    getGasTankCost() { return Math.floor(80 * Math.pow(1.4, this.gasTanks)); }

    stake(amount) {
        if (amount <= 0 || this.balance < amount) { this.showMessage('❌ Недостаточно RURC'); return; }
        this.balance -= amount;
        this.stakedBalance += amount;
        this.saveData();
        this.render();
        this.showMessage('🔒 Застейкано ' + amount.toFixed(2) + ' RURC');
    }

    unstake() {
        if (this.stakedBalance <= 0) { this.showMessage('❌ Нет застейканных средств'); return; }
        const total = this.stakedBalance + this.stakingRewards;
        this.balance += total;
        this.stakedBalance = 0;
        this.stakingRewards = 0;
        this.saveData();
        this.render();
        this.showMessage('🔓 Выведено ' + total.toFixed(2) + ' RURC');
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
        set('miningStatus', this.isMining ? '⚡ Добыча активна' : '⏸️ Остановлена');
        set('totalMined', this.totalMined.toFixed(1));

        // Прогресс-бары цистерн
        const oilPct = Math.min(100, (this.oilStored / this.oilCapacity) * 100);
        const gasPct = Math.min(100, (this.gasStored / this.gasCapacity) * 100);
        const oilBar = document.getElementById('oilBar');
        const gasBar = document.getElementById('gasBar');
        if (oilBar) oilBar.style.width = oilPct + '%';
        if (gasBar) gasBar.style.width = gasPct + '%';

        // Анимация цистерн
        const oilFill = document.getElementById('oilTankFill');
        const gasFill = document.getElementById('gasTankFill');
        if (oilFill) oilFill.style.height = oilPct + '%';
        if (gasFill) gasFill.style.height = gasPct + '%';
    }
}

// ── ИНИЦИАЛИЗАЦИЯ ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    window.rurcoinApp = new RURCoinMiner();
    console.log('RURCoin Oil & Gas запущено!');

    // ── ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК (event delegation — работает для динамических кнопок) ──
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

    // Event delegation — ловим клики на ЛЮБОЙ .tab-btn, даже добавленной позже
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.tab-btn');
        if (!btn) return;
        const tabId = btn.getAttribute('data-tab');
        if (!tabId) return;
        switchTab(tabId);
        // Ripple анимация
        const ripple = document.createElement('span');
        ripple.className = 'btn-ripple';
        ripple.style.cssText = 'position:absolute;border-radius:50%;background:rgba(255,107,0,0.4);width:80px;height:80px;margin-top:-40px;margin-left:-40px;animation:ripple-anim 0.5s linear;pointer-events:none;';
        btn.style.position = 'relative';
        btn.style.overflow = 'hidden';
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 500);
    });

    // Показываем первую вкладку
    switchTab('mining');

});

// Обновляем UI при изменении цен
window.addEventListener('storage', function(e) {
    if (e.key === 'rurcoin_data' && window.rurcoinApp) {
        window.rurcoinApp.loadData();
        window.rurcoinApp.render();
    }
});
