// Основной класс приложения RURCoin — Нефтегазовая добыча
class RURCoinMiner {
    constructor() {
        this.balance = 0;
        this.tonBalance = 5.0;
        this.oilRate = 0;       // баррелей/час
        this.gasRate = 0;       // м³/час
        this.isMining = false;
        this.miningStartTime = 0;
        this.miningSessionCoins = 0;
        this.totalMined = 0;
        this.stakedBalance = 0;
        this.stakingRewards = 0;
        this.transactions = [];

        // Оборудование
        this.oilPumps = 0;       // нефтяные насосы
        this.gasTowers = 0;      // газовые вышки
        this.oilTanks = 0;       // цистерны для нефти
        this.gasTanks = 0;       // цистерны для газа
        this.oilStored = 0;      // накопленная нефть (баррели)
        this.gasStored = 0;      // накопленный газ (м³)
        this.oilCapacity = 100;  // макс. ёмкость нефти
        this.gasCapacity = 1000; // макс. ёмкость газа

        this.tonApiKey = 'AHVHQCBZEV2TA6IAAAAJHMD6BQFJMEKBTA6WY3STOQMD5ZAPNOSYAM7ETRGBDN7S7JYYQZI';
        this.tonApiBase = 'https://tonapi.io/v2';

        this.halvingBlocks = 210000;
        this.blocksUntilHalving = 52416;
        this.currentBlockReward = 100;
        this.blocksPerDay = 576;

        this.init();
    }

    init() {
        this.initTelegram();
        this.setupEventListeners();
        this.setupTabs();
        this.loadData();
        this.render();
        this.startGameLoop();
        this.startHalvingTimer();
        this.loadTransactionHistory();
    }

    initTelegram() {
        try {
            if (window.Telegram && window.Telegram.WebApp) {
                Telegram.WebApp.ready();
                Telegram.WebApp.expand();
                const user = Telegram.WebApp.initDataUnsafe?.user;
                if (user) {
                    this.username = user.username || user.first_name;
                }
            }
        } catch (e) {
            console.log('Telegram WebApp not available');
        }
    }

    setupEventListeners() {
        const mineBtn = document.getElementById('mineBtn');
        if (mineBtn) mineBtn.addEventListener('click', () => this.toggleMining());

        const stakeBtn = document.getElementById('stakeBtn');
        if (stakeBtn) stakeBtn.addEventListener('click', () => this.stake());

        const unstakeBtn = document.getElementById('unstakeBtn');
        if (unstakeBtn) unstakeBtn.addEventListener('click', () => this.unstake());

        const sellOilBtn = document.getElementById('sellOilBtn');
        if (sellOilBtn) sellOilBtn.addEventListener('click', () => this.sellOil());

        const sellGasBtn = document.getElementById('sellGasBtn');
        if (sellGasBtn) sellGasBtn.addEventListener('click', () => this.sellGas());
    }

    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.target.getAttribute('data-tab');
                if (tabId) this.switchTab(tabId);
            });
        });
        this.switchTab('mining');
    }

    switchTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

        const targetTab = document.getElementById(tabId);
        const targetBtn = document.querySelector(`[data-tab="${tabId}"]`);

        if (targetTab && targetBtn) {
            targetTab.classList.add('active');
            targetTab.style.display = 'block';
            targetBtn.classList.add('active');
            this.currentTab = tabId;
            this.updateTabContent(tabId);
        }
    }

    updateTabContent(tabId) {
        switch(tabId) {
            case 'mining':      this.updateMiningTab(); break;
            case 'equipment':   this.updateEquipmentTab(); break;
            case 'storage':     this.updateStorageTab(); break;
            case 'staking':     this.updateStakingTab(); break;
            case 'contracts':   this.updateContractsTab(); break;
            case 'transactions':this.updateTransactionsTab(); break;
            case 'halving':     this.updateHalvingTab(); break;
        }
    }

    updateMiningTab()      { this.renderMiningData(); }
    updateEquipmentTab()   { this.renderEquipmentData(); }
    updateStorageTab()     { this.renderStorageData(); }
    updateStakingTab()     { this.renderStakingData(); }
    updateContractsTab()   { this.renderContractsData(); }
    updateTransactionsTab(){ this.renderTransactionsData(); }
    updateHalvingTab()     { this.renderHalvingData(); }

    toggleMining() {
        this.isMining = !this.isMining;
        const button = document.getElementById('mineBtn');

        if (this.isMining) {
            this.miningStartTime = Date.now();
            button.textContent = '⏸️ Остановить добычу';
            button.style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
        } else {
            button.textContent = '⛽ Начать добычу';
            button.style.background = 'linear-gradient(135deg, #FF8C00, #FF6000)';
            this.totalMined += this.miningSessionCoins;
            this.miningSessionCoins = 0;
        }
    }

    mine() {
        if (!this.isMining) return;

        const oilPerSec = (this.oilPumps * 2) / 3600;
        const gasPerSec = (this.gasTowers * 50) / 3600;

        // Добавляем в хранилища
        if (this.oilStored < this.oilCapacity) {
            this.oilStored = Math.min(this.oilCapacity, this.oilStored + oilPerSec);
        }
        if (this.gasStored < this.gasCapacity) {
            this.gasStored = Math.min(this.gasCapacity, this.gasStored + gasPerSec);
        }

        // Начисляем RURC за добычу
        const rurcPerSec = (this.oilPumps * 0.5 + this.gasTowers * 0.3) / 3600;
        this.balance += rurcPerSec;
        this.miningSessionCoins += rurcPerSec;

        this.saveData();
    }

    // Продать нефть
    sellOil() {
        if (this.oilStored <= 0) {
            this.showMessage('Нет нефти для продажи');
            return;
        }
        const earned = this.oilStored * 5; // 5 RURC за баррель
        this.balance += earned;
        this.showMessage(`💰 Продано ${this.oilStored.toFixed(1)} барр. нефти за ${earned.toFixed(2)} RURC`);
        this.oilStored = 0;
        this.saveData();
        this.render();
    }

    // Продать газ
    sellGas() {
        if (this.gasStored <= 0) {
            this.showMessage('Нет газа для продажи');
            return;
        }
        const earned = this.gasStored * 0.3; // 0.3 RURC за м³
        this.balance += earned;
        this.showMessage(`💰 Продано ${this.gasStored.toFixed(0)} м³ газа за ${earned.toFixed(2)} RURC`);
        this.gasStored = 0;
        this.saveData();
        this.render();
    }

    stake() {
        const amount = parseFloat(document.getElementById('stakeAmount').value);
        if (!amount || amount <= 0) { this.showMessage('Введите корректную сумму'); return; }
        if (amount > this.balance) { this.showMessage('Недостаточно RURC'); return; }

        this.balance -= amount;
        this.stakedBalance += amount;
        this.showMessage(`✅ Застейкано ${amount} RURC!`);
        this.saveData();
        this.render();
    }

    unstake() {
        if (this.stakedBalance <= 0) { this.showMessage('Нет застейканных средств'); return; }
        const total = this.stakedBalance + this.stakingRewards;
        this.balance += total;
        this.showMessage(`💰 Выведено ${total.toFixed(2)} RURC`);
        this.stakedBalance = 0;
        this.stakingRewards = 0;
        this.saveData();
        this.render();
    }

    calculateStakingRewards() {
        if (this.stakedBalance > 0) {
            const dailyReward = (this.stakedBalance * 0.15) / 365;
            this.stakingRewards += dailyReward / 86400;
        }
    }

    // Купить оборудование
    buyEquipment(type) {
        const prices = {
            oilPump:  { cost: 2, currency: 'TON', label: 'Нефтяной насос' },
            gasTower: { cost: 3, currency: 'TON', label: 'Газовая вышка' },
            oilTank:  { cost: 1, currency: 'TON', label: 'Цистерна для нефти' },
            gasTank:  { cost: 1, currency: 'TON', label: 'Цистерна для газа' }
        };

        const item = prices[type];
        if (!item) return;

        if (this.tonBalance < item.cost) {
            this.showMessage(`Недостаточно TON. Нужно ${item.cost} TON`);
            return;
        }

        this.tonBalance -= item.cost;

        switch(type) {
            case 'oilPump':
                this.oilPumps++;
                break;
            case 'gasTower':
                this.gasTowers++;
                break;
            case 'oilTank':
                this.oilTanks++;
                this.oilCapacity += 200;
                break;
            case 'gasTank':
                this.gasTanks++;
                this.gasCapacity += 2000;
                break;
        }

        this.showMessage(`✅ Куплено: ${item.label}`);
        this.saveData();
        this.render();
        this.renderEquipmentData();
    }

    render() {
        const el = (id) => document.getElementById(id);

        if (el('balance'))      el('balance').textContent = this.balance.toFixed(2) + ' RURC';
        if (el('usdValue'))     el('usdValue').textContent = `≈ $${(this.balance * 0.01).toFixed(2)}`;
        if (el('tonBalance'))   el('tonBalance').textContent = this.tonBalance.toFixed(2);
        if (el('hashrate'))     el('hashrate').textContent = (this.oilPumps * 2 + this.gasTowers * 50) + ' ед/ч';
        if (el('stakedBalance'))el('stakedBalance').textContent = this.stakedBalance.toFixed(2) + ' RURC';
        if (el('stakingRewards'))el('stakingRewards').textContent = this.stakingRewards.toFixed(4) + ' RURC';
        if (el('oilStored'))    el('oilStored').textContent = this.oilStored.toFixed(1) + ' барр.';
        if (el('gasStored'))    el('gasStored').textContent = this.gasStored.toFixed(0) + ' м³';
        if (el('oilPumpsCount'))el('oilPumpsCount').textContent = this.oilPumps;
        if (el('gasTowersCount'))el('gasTowersCount').textContent = this.gasTowers;
        if (el('oilTanksCount'))el('oilTanksCount').textContent = this.oilTanks;
        if (el('gasTanksCount'))el('gasTanksCount').textContent = this.gasTanks;

        // Прогресс-бары хранилищ
        if (el('oilBar')) {
            const oilPct = Math.min(100, (this.oilStored / this.oilCapacity) * 100);
            el('oilBar').style.width = oilPct + '%';
        }
        if (el('gasBar')) {
            const gasPct = Math.min(100, (this.gasStored / this.gasCapacity) * 100);
            el('gasBar').style.width = gasPct + '%';
        }
    }

    renderMiningData() { this.render(); }

    renderEquipmentData() {
        const container = document.getElementById('equipmentList');
        if (!container) return;

        const equipment = [
            { type: 'oilPump',  icon: '🛢️', name: 'Нефтяной насос',    desc: '+2 барр/ч',   cost: '2 TON', count: this.oilPumps },
            { type: 'gasTower', icon: '🏗️', name: 'Газовая вышка',     desc: '+50 м³/ч',    cost: '3 TON', count: this.gasTowers },
            { type: 'oilTank',  icon: '🛢️', name: 'Цистерна нефти',    desc: '+200 барр.',  cost: '1 TON', count: this.oilTanks },
            { type: 'gasTank',  icon: '⚗️', name: 'Цистерна газа',     desc: '+2000 м³',    cost: '1 TON', count: this.gasTanks }
        ];

        container.innerHTML = equipment.map(item => `
            <div class="equipment-card">
                <div class="eq-icon">${item.icon}</div>
                <div class="eq-info">
                    <div class="eq-name">${item.name}</div>
                    <div class="eq-desc">${item.desc}</div>
                    <div class="eq-count">Куплено: ${item.count}</div>
                </div>
                <button class="eq-buy-btn" onclick="window.rurcoinApp.buyEquipment('${item.type}')">
                    ${item.cost}
                </button>
            </div>
        `).join('');
    }

    renderStorageData() {
        const container = document.getElementById('storageInfo');
        if (!container) return;

        const oilPct = Math.min(100, (this.oilStored / this.oilCapacity) * 100).toFixed(1);
        const gasPct = Math.min(100, (this.gasStored / this.gasCapacity) * 100).toFixed(1);

        container.innerHTML = `
            <div class="storage-card">
                <div class="storage-header">🛢️ Нефть</div>
                <div class="storage-bar-wrap">
                    <div class="storage-bar oil-bar" style="width: ${oilPct}%"></div>
                </div>
                <div class="storage-nums">${this.oilStored.toFixed(1)} / ${this.oilCapacity} барр. (${oilPct}%)</div>
                <button class="sell-btn" id="sellOilBtn" onclick="window.rurcoinApp.sellOil()">
                    💰 Продать нефть (${(this.oilStored * 5).toFixed(2)} RURC)
                </button>
            </div>
            <div class="storage-card">
                <div class="storage-header">⛽ Газ</div>
                <div class="storage-bar-wrap">
                    <div class="storage-bar gas-bar" style="width: ${gasPct}%"></div>
                </div>
                <div class="storage-nums">${this.gasStored.toFixed(0)} / ${this.gasCapacity} м³ (${gasPct}%)</div>
                <button class="sell-btn" id="sellGasBtn" onclick="window.rurcoinApp.sellGas()">
                    💰 Продать газ (${(this.gasStored * 0.3).toFixed(2)} RURC)
                </button>
            </div>
        `;
    }

    renderStakingData() {
        const el = (id) => document.getElementById(id);
        if (el('stakedBalance')) el('stakedBalance').textContent = `${this.stakedBalance.toFixed(2)} RURC`;
        if (el('stakingRewards')) el('stakingRewards').textContent = `${this.stakingRewards.toFixed(4)} RURC`;
    }

    renderContractsData() { console.log('Рендер контрактов'); }
    renderTransactionsData() { this.renderTransactions(); }
    renderHalvingData() { this.updateHalvingTimer(); }

    showMessage(message) { alert(message); }

    loadData() {
        const saved = localStorage.getItem('rurcoin_data');
        if (saved) {
            const data = JSON.parse(saved);
            Object.assign(this, data);
        }
    }

    saveData() {
        const data = {
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
            gasCapacity: this.gasCapacity
        };
        localStorage.setItem('rurcoin_data', JSON.stringify(data));
    }

    startGameLoop() {
        setInterval(() => {
            this.mine();
            this.calculateStakingRewards();
            this.render();
            if (this.currentTab === 'storage') this.renderStorageData();
        }, 1000);
    }

    startHalvingTimer() {
        setInterval(() => { this.updateHalvingTimer(); }, 1000);
    }

    updateHalvingTimer() {
        const days = Math.floor(this.blocksUntilHalving / this.blocksPerDay);
        const hours = Math.floor((this.blocksUntilHalving % this.blocksPerDay) / 24);
        const minutes = this.blocksUntilHalving % 24;
        const timerEl = document.getElementById('halvingTimer');
        if (timerEl) timerEl.textContent = `${days}д ${hours}ч ${minutes}м`;
        if (Math.random() < 0.001) this.blocksUntilHalving--;
    }

    async loadTransactionHistory() {
        const mockTransactions = [
            { hash: '0x1a2b.', amount: '100 RURC', from: 'EQD.', to: 'UQAf.', time: '2 мин назад' },
            { hash: '0x3c4d.', amount: '50 RURC',  from: 'UQAf.', to: 'EQA9.', time: '5 мин назад' },
            { hash: '0x5e6f.', amount: '200 RURC', from: 'EQA9.', to: 'EQD.',  time: '10 мин назад' }
        ];
        this.transactions = mockTransactions;
        this.renderTransactions();
    }

    renderTransactions() {
        const feed = document.getElementById('transactionsFeed');
        if (!feed) return;
        feed.innerHTML = '';
        this.transactions.forEach(tx => {
            const txElement = document.createElement('div');
            txElement.className = 'transaction-item new-transaction';
            txElement.innerHTML = `
                <div><strong>${tx.amount}</strong></div>
                <div>От: ${tx.from}</div>
                <div>Кому: ${tx.to}</div>
                <div style="color: #666; font-size: 10px;">${tx.time}</div>
            `;
            feed.appendChild(txElement);
        });
    }

    buyFarm(farmId) {
        this.buyEquipment('oilPump');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const requiredElements = ['mineBtn', 'balance', 'hashrate'];
    let allElementsExist = true;
    requiredElements.forEach(id => {
        if (!document.getElementById(id)) {
            console.error('Элемент не найден:', id);
            allElementsExist = false;
        }
    });
    if (allElementsExist) {
        window.rurcoinApp = new RURCoinMiner();
        console.log('RURCoin Oil & Gas запущено!');
    }
});
