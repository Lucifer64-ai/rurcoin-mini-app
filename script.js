// Основной класс приложения RURCoin
class RURCoinMiner {
    constructor() {
        this.balance = 0;
        this.tonBalance = 5.0;
        this.hashrate = 0;
        this.isMining = false;
        this.miningStartTime = 0;
        this.miningSessionCoins = 0;
        this.totalMined = 0;
        this.stakedBalance = 0;
        this.stakingRewards = 0;
        this.farmLevel = 0;
        this.transactions = [];

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
                    console.log('User:', user);
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

        const buyFarmBtns = document.querySelectorAll('.buy-farm-btn');
        buyFarmBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const farmId = parseInt(e.target.dataset.farmId);
                this.buyFarm(farmId);
            });
        });
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
            case 'mining': this.updateMiningTab(); break;
            case 'staking': this.updateStakingTab(); break;
            case 'contracts': this.updateContractsTab(); break;
            case 'transactions': this.updateTransactionsTab(); break;
            case 'halving': this.updateHalvingTab(); break;
            case 'history': this.updateHistoryTab(); break;
        }
    }

    updateMiningTab() { this.renderMiningData(); }
    updateStakingTab() { this.renderStakingData(); }
    updateContractsTab() { this.renderContractsData(); }
    updateTransactionsTab() { this.renderTransactionsData(); }
    updateHalvingTab() { this.renderHalvingData(); }
    updateHistoryTab() { this.renderHistoryData(); }

    toggleMining() {
        this.isMining = !this.isMining;
        const button = document.getElementById('mineBtn');

        if (this.isMining) {
            this.miningStartTime = Date.now();
            button.textContent = '⏸️ Остановить майнинг';
            button.style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
        } else {
            button.textContent = '⚒️ Начать майнинг';
            button.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
            this.totalMined += this.miningSessionCoins;
            this.miningSessionCoins = 0;
        }
    }

    mine() {
        if (!this.isMining || this.hashrate === 0) return;
        const now = Date.now();
        const timePassed = (now - this.miningStartTime) / 1000;
        this.miningSessionCoins = (timePassed * this.hashrate) / 3600;
        this.saveData();
    }

    stake() {
        const amount = parseFloat(document.getElementById('stakeAmount').value);
        if (!amount || amount <= 0) { this.showMessage('Введите корректную сумму'); return; }
        if (amount > this.balance) { this.showMessage('Недостаточно RURC'); return; }

        this.balance -= amount;
        this.stakedBalance += amount;
        this.showMessage(`✅ Успешно застейкано ${amount} RURC!`);
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

    render() {
        document.getElementById('balance').textContent = this.balance.toFixed(2) + ' RURC';
        document.getElementById('usdValue').textContent = `≈ $${(this.balance * 0.01).toFixed(2)}`;
        document.getElementById('tonBalance').textContent = this.tonBalance.toFixed(2);
        this.hashrate = 10 + (this.farmLevel * 5);
        document.getElementById('hashrate').textContent = this.hashrate + ' H/s';
        document.getElementById('stakedBalance').textContent = this.stakedBalance.toFixed(2) + ' RURC';
        document.getElementById('stakingRewards').textContent = this.stakingRewards.toFixed(2) + ' RURC';
        this.renderFarms();
    }

    renderFarms() {
        const farmItems = document.getElementById('farmItems');
        farmItems.innerHTML = '';
        const farms = [{ level: 1, cost: 1, hashrate: 5 }, { level: 2, cost: 5, hashrate: 10 }, { level: 3, cost: 20, hashrate: 25 }];

        farms.forEach(farm => {
            const farmElement = document.createElement('div');
            farmElement.className = 'farm-item';
            farmElement.innerHTML = `<div><strong>Ферма уровня ${farm.level}</strong><div>+${farm.hashrate} H/s</div></div><button class="russian-button" style="padding: 8px 15px; font-size: 12px;">Купить за ${farm.cost} TON</button>`;
            farmItems.appendChild(farmElement);
        });
    }

    showMessage(message) { alert(message); }

    loadData() {
        const saved = localStorage.getItem('rurcoin_data');
        if (saved) { const data = JSON.parse(saved); Object.assign(this, data); }
    }

    saveData() {
        const data = { balance: this.balance, tonBalance: this.tonBalance, hashrate: this.hashrate, stakedBalance: this.stakedBalance, stakingRewards: this.stakingRewards, farmLevel: this.farmLevel, totalMined: this.totalMined };
        localStorage.setItem('rurcoin_data', JSON.stringify(data));
    }

    startGameLoop() {
        setInterval(() => { this.mine(); this.calculateStakingRewards(); this.render(); }, 1000);
    }

    startHalvingTimer() {
        setInterval(() => { this.updateHalvingTimer(); }, 1000);
    }

    updateHalvingTimer() {
        const days = Math.floor(this.blocksUntilHalving / this.blocksPerDay);
        const hours = Math.floor((this.blocksUntilHalving % this.blocksPerDay) / 24);
        const minutes = this.blocksUntilHalving % 24;
        const timerString = `${days}д ${hours}ч ${minutes}м`;
        document.getElementById('halvingTimer').textContent = timerString;
        if (Math.random() < 0.001) this.blocksUntilHalving--;
    }

    async loadTransactionHistory() {
        const mockTransactions = [
            { hash: '0x1a2b.', amount: '100 RURC', from: 'EQD.', to: 'UQAf.', time: '2 мин назад' },
            { hash: '0x3c4d.', amount: '50 RURC', from: 'UQAf.', to: 'EQA9.', time: '5 мин назад' },
            { hash: '0x5e6f.', amount: '200 RURC', from: 'EQA9.', to: 'EQD.', time: '10 мин назад' }
        ];
        this.transactions = mockTransactions;
        this.renderTransactions();
    }

    renderTransactions() {
        const feed = document.getElementById('transactionsFeed');
        feed.innerHTML = '';
        this.transactions.forEach(tx => {
            const txElement = document.createElement('div');
            txElement.className = 'transaction-item new-transaction';
            txElement.innerHTML = `<div><strong>${tx.amount}</strong></div><div>От: ${tx.from}</div><div>Кому: ${tx.to}</div><div style="color: #666; font-size: 10px;">${tx.time}</div>`;
            feed.appendChild(txElement);
        });
    }

    renderMiningData() {
        const balanceElement = document.getElementById('balance');
        if (balanceElement) balanceElement.textContent = this.balance.toFixed(2);
        const usdValueElement = document.getElementById('usdValue');
        if (usdValueElement) usdValueElement.textContent = `≈ $${(this.balance * 0.01).toFixed(2)}`;
        const tonBalanceElement = document.getElementById('tonBalance');
        if (tonBalanceElement) tonBalanceElement.textContent = `${this.tonBalance.toFixed(2)} TON`;
        const hashrateElement = document.getElementById('hashrate');
        if (hashrateElement) hashrateElement.textContent = `${this.hashrate} H/s`;
    }

    renderStakingData() {
        const stakedBalanceElement = document.getElementById('stakedBalance');
        if (stakedBalanceElement) stakedBalanceElement.textContent = `${this.stakedBalance.toFixed(2)} RURC`;
        const stakingRewardsElement = document.getElementById('stakingRewards');
        if (stakingRewardsElement) stakingRewardsElement.textContent = `${this.stakingRewards.toFixed(2)} RURC`;
    }

    renderCommonData() {}
    renderContractsData() { console.log('Рендер контрактов'); }
    renderTransactionsData() { this.renderTransactions(); }
    renderHalvingData() { this.updateHalvingTimer(); }
    renderHistoryData() { console.log('Рендер истории'); }

    buyFarm(farmId) {
        const farms = [{ id: 1, cost: 1, hashrate: 5 }, { id: 2, cost: 5, hashrate: 10 }, { id: 3, cost: 20, hashrate: 25 }];
        const farm = farms.find(f => f.id === farmId);
        if (!farm) return;
        if (this.tonBalance >= farm.cost) {
            this.tonBalance -= farm.cost;
            this.hashrate += farm.hashrate;
            this.showMessage(`🏭 Куплена ферма уровня ${farmId} за ${farm.cost} TON!`);
            this.saveData();
            this.render();
        } else {
            this.showMessage('Недостаточно TON для покупки фермы');
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const requiredElements = ['mineBtn', 'balance', 'hashrate'];
    let allElementsExist = true;
    requiredElements.forEach(id => {
        if (!document.getElementById(id)) { console.error('❌ Элемент не найден:', id); allElementsExist = false; }
    });
    if (allElementsExist) { window.rurcoinApp = new RURCoinMiner(); console.log('🎉 RURCoin Mini App запущено успешно!'); }
});
