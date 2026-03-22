// RURCoin Oil & Gas â Main Script
// fix: event delegation Ð´Ð»Ñ Ð²ÐºÐ»Ð°Ð´Ð¾Ðº (ÑÐ°Ð±Ð¾ÑÐ°ÐµÑ Ñ Ð´Ð¸Ð½Ð°Ð¼Ð¸ÑÐµÑÐºÐ¸Ð¼Ð¸ ÐºÐ½Ð¾Ð¿ÐºÐ°Ð¼Ð¸)

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
        // ÐÑÑÐ»Ð°Ð¹Ð½-Ð¿ÑÐ¾Ð³ÑÐµÑÑ
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
        this.showMessage('ð¢ï¸ ÐÑÐ¾Ð´Ð°Ð½Ð¾! +' + earned.toFixed(2) + ' RURC');
    }

    sellGas() {
        if (this.gasStored <= 0) return;
        const earned = this.gasStored * this.getGasSellPrice();
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
    window.rurcoinApp = new RURCoinMiner();
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
const UPGRADES_LIST = [
    { id:'oilSpeed',    name:'⚡ Скорость добычи нефти',         desc:'+20% добычи нефти за уровень',           icon:'🛢️', baseCost:50,  costMult:2.2, maxLevel:10, stat:(a)=>`${(a.getOilPerSec()*3600).toFixed(1)} барр/ч` },
    { id:'gasSpeed',    name:'⚡ Скорость добычи газа',           desc:'+20% добычи газа за уровень',            icon:'🔥', baseCost:40,  costMult:2.0, maxLevel:10, stat:(a)=>`${(a.getGasPerSec()*3600).toFixed(0)} м³/ч` },
    { id:'oilPrice',    name:'💰 Цена нефти',                    desc:'+15% к цене продажи нефти',              icon:'📈', baseCost:80,  costMult:2.5, maxLevel:8,  stat:(a)=>`$${a.getOilSellPrice().toFixed(2)}/барр` },
    { id:'gasPrice',    name:'💰 Цена газа',                     desc:'+15% к цене продажи газа',               icon:'📈', baseCost:60,  costMult:2.3, maxLevel:8,  stat:(a)=>`$${a.getGasSellPrice().toFixed(3)}/м³` },
    { id:'autoSell',    name:'🤖 Авто-продажа',                  desc:'Автоматически продаёт ресурсы при заполнении', icon:'🤖', baseCost:200, costMult:3.0, maxLevel:1,  stat:(a)=>(a.upgrades.autoSell>=1?'✅ Активно':'❌ Не куплено') },
    { id:'oilCapacity', name:'🏗️ Ёмкость нефтяного резервуара', desc:'+50 барр к ёмкости за уровень',          icon:'🏗️', baseCost:100, costMult:1.8, maxLevel:20, stat:(a)=>`${a.oilCapacity} барр` },
    { id:'gasCapacity', name:'🏗️ Ёмкость газового резервуара',  desc:'+500 м³ к ёмкости за уровень',           icon:'🏗️', baseCost:80,  costMult:1.8, maxLevel:20, stat:(a)=>`${a.gasCapacity} м³` }
];

function getUpgradeCost(upg) {
    const app = window.rurcoinApp;
    const level = app ? (app.upgrades[upg.id] || 0) : 0;
    return Math.round(upg.baseCost * Math.pow(upg.costMult, level));
}

function renderUpgrades() {
    const container = document.getElementById('upgradesList');
    if (!container) return;
    const app = window.rurcoinApp;
    if (!app) { container.innerHTML = '<div style="color:#555;text-align:center;padding:20px;">Загрузка...</div>'; return; }

    container.innerHTML = UPGRADES_LIST.map(upg => {
        const level = app.upgrades[upg.id] || 0;
        const maxed = level >= upg.maxLevel;
        const cost  = getUpgradeCost(upg);
        const canAfford = app.balance >= cost;
        const statText  = upg.stat(app);
        return `
        <div style="background:rgba(255,107,0,0.06);border:1px solid rgba(255,107,0,${maxed?'0.5':'0.15'});
                    border-radius:12px;padding:14px;margin-bottom:10px;transition:all 0.2s;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                <span style="font-size:24px;">${upg.icon}</span>
                <div style="flex:1;">
                    <div style="font-size:13px;font-weight:700;color:${maxed?'#FFD700':'#FF8C00'};">${upg.name}</div>
                    <div style="font-size:11px;color:#666;margin-top:2px;">${upg.desc}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:11px;color:#888;">Уровень</div>
                    <div style="font-size:16px;font-weight:700;color:${maxed?'#FFD700':'#00D4FF'};">${level}/${upg.maxLevel}</div>
                </div>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <div style="font-size:11px;color:#555;">📊 ${statText}</div>
                ${maxed
                    ? `<div style="padding:8px 16px;border-radius:8px;background:rgba(255,215,0,0.1);
                                  border:1px solid rgba(255,215,0,0.3);color:#FFD700;font-size:12px;font-weight:700;">✅ МАКС</div>`
                    : `<button onclick="buyUpgrade('${upg.id}')"
                               style="padding:8px 16px;border:none;border-radius:8px;cursor:pointer;
                                      font-size:12px;font-weight:700;color:#fff;transition:all 0.2s;
                                      background:${canAfford?'linear-gradient(135deg,#FF6B00,#cc4400)':'rgba(80,80,80,0.4)'};
                                      opacity:${canAfford?'1':'0.6'};"
                               ${canAfford?'':'disabled'}>
                           💰 ${cost.toLocaleString()} RURC
                       </button>`
                }
            </div>
            ${level > 0 ? `
            <div style="margin-top:8px;background:rgba(0,0,0,0.3);border-radius:4px;height:4px;overflow:hidden;">
                <div style="height:100%;width:${(level/upg.maxLevel*100).toFixed(0)}%;
                            background:linear-gradient(90deg,#FF6B00,#FFD700);transition:width 0.5s;"></div>
            </div>` : ''}
        </div>`;
    }).join('');
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
            btn.textContent = '❌ Недостаточно';
            setTimeout(() => { btn.style.background='rgba(80,80,80,0.4)'; btn.innerHTML=orig; }, 1200);
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
