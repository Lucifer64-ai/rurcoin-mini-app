// Основной класс приложения RURCoin — Нефтегазовая добыча
class RURCoinMiner {
    constructor() {
        this.balance = 0;
        this.tonBalance = 5.0;
        this.oilRate = 0;
        this.gasRate = 0;
        this.isMining = false;
        this.miningStartTime = 0;
        this.miningSessionCoins = 0;
        this.totalMined = 0;
        this.stakedBalance = 0;
        this.stakingRewards = 0;
        this.transactions = [];

        // Оборудование
        this.oilPumps = 0;
        this.gasTowers = 0;
        this.oilTanks = 0;
        this.gasTanks = 0;
        this.oilStored = 0;
        this.gasStored = 0;
        this.oilCapacity = 100;
        this.gasCapacity = 1000;

        // ============================================================
        //  УРОВНИ УЛУЧШЕНИЙ (0 = не куплено, 1-10 = уровень)
        // ============================================================
        this.upgrades = {
            // Нефтяной насос
            oilPumpSpeed:    0,   // Скорость добычи нефти
            oilPumpEff:      0,   // КПД насоса (меньше потерь)
            oilPumpAuto:     0,   // Автоматический насос
            oilPumpDeep:     0,   // Глубокое бурение
            oilPumpTurbo:    0,   // Турбонасос
            // Газовая вышка
            gasTowerSpeed:   0,   // Скорость добычи газа
            gasTowerPressure:0,   // Давление (больше газа)
            gasTowerAuto:    0,   // Автоматическая вышка
            gasTowerFilter:  0,   // Фильтрация (чище газ = дороже)
            gasTowerTurbo:   0,   // Турбовышка
            // Общие
            refinery:        0,   // Нефтеперерабатывающий завод
            pipeline:        0,   // Трубопровод (авто-продажа)
            compressor:      0,   // Компрессор газа
            drillBit:        0,   // Алмазное сверло
            aiControl:       0,   // ИИ-управление
        };

        this.tonApiKey = 'AHVHQCBZEV2TA6IAAAAJHMD6BQFJMEKBTA6WY3STOQMD5ZAPNOSYAM7ETRGBDN7S7JYYQZI';
        this.tonApiBase = 'https://tonapi.io/v2';

        this.halvingBlocks = 210000;
        this.blocksUntilHalving = 52416;
        this.currentBlockReward = 100;
        this.blocksPerDay = 576;

        this.init();
    }

    // ============================================================
    //  Конфиг улучшений
    // ============================================================
    getUpgradeConfig() {
        return {
            // ---- НЕФТЯНОЙ НАСОС ----
            oilPumpSpeed: {
                icon: '⚡', category: 'oil',
                name: 'Скорость насоса',
                desc: (lvl) => `+${lvl * 30}% скорость добычи нефти`,
                maxLevel: 10,
                cost: (lvl) => (lvl + 1) * 1.5,   // TON
                effect: (lvl) => 1 + lvl * 0.30,   // множитель
            },
            oilPumpEff: {
                icon: '🔧', category: 'oil',
                name: 'КПД насоса',
                desc: (lvl) => `+${lvl * 15}% эффективность (меньше потерь)`,
                maxLevel: 10,
                cost: (lvl) => (lvl + 1) * 2,
                effect: (lvl) => 1 + lvl * 0.15,
            },
            oilPumpAuto: {
                icon: '🤖', category: 'oil',
                name: 'Автонасос',
                desc: (lvl) => lvl === 0 ? 'Насос работает без нажатий' : `Уровень ${lvl}: +${lvl * 20}% авто-добыча`,
                maxLevel: 5,
                cost: (lvl) => (lvl + 1) * 3,
                effect: (lvl) => lvl * 0.20,
            },
            oilPumpDeep: {
                icon: '⛏️', category: 'oil',
                name: 'Глубокое бурение',
                desc: (lvl) => `Доступ к пластам +${lvl * 50}% нефти`,
                maxLevel: 8,
                cost: (lvl) => (lvl + 1) * 2.5,
                effect: (lvl) => 1 + lvl * 0.50,
            },
            oilPumpTurbo: {
                icon: '🚀', category: 'oil',
                name: 'Турбонасос',
                desc: (lvl) => `x${(1 + lvl * 0.5).toFixed(1)} производительность`,
                maxLevel: 5,
                cost: (lvl) => (lvl + 1) * 5,
                effect: (lvl) => 1 + lvl * 0.50,
            },

            // ---- ГАЗОВАЯ ВЫШКА ----
            gasTowerSpeed: {
                icon: '💨', category: 'gas',
                name: 'Скорость вышки',
                desc: (lvl) => `+${lvl * 30}% скорость добычи газа`,
                maxLevel: 10,
                cost: (lvl) => (lvl + 1) * 1.5,
                effect: (lvl) => 1 + lvl * 0.30,
            },
            gasTowerPressure: {
                icon: '🔴', category: 'gas',
                name: 'Давление газа',
                desc: (lvl) => `+${lvl * 25}% объём добычи`,
                maxLevel: 10,
                cost: (lvl) => (lvl + 1) * 2,
                effect: (lvl) => 1 + lvl * 0.25,
            },
            gasTowerAuto: {
                icon: '🤖', category: 'gas',
                name: 'Автовышка',
                desc: (lvl) => `Уровень ${lvl}: +${lvl * 20}% авто-добыча газа`,
                maxLevel: 5,
                cost: (lvl) => (lvl + 1) * 3,
                effect: (lvl) => lvl * 0.20,
            },
            gasTowerFilter: {
                icon: '🧪', category: 'gas',
                name: 'Фильтрация газа',
                desc: (lvl) => `+${lvl * 20}% цена продажи газа`,
                maxLevel: 8,
                cost: (lvl) => (lvl + 1) * 2,
                effect: (lvl) => 1 + lvl * 0.20,
            },
            gasTowerTurbo: {
                icon: '🚀', category: 'gas',
                name: 'Турбовышка',
                desc: (lvl) => `x${(1 + lvl * 0.5).toFixed(1)} производительность`,
                maxLevel: 5,
                cost: (lvl) => (lvl + 1) * 5,
                effect: (lvl) => 1 + lvl * 0.50,
            },

            // ---- ОБЩИЕ ----
            refinery: {
                icon: '🏭', category: 'common',
                name: 'Нефтезавод',
                desc: (lvl) => `+${lvl * 40}% цена нефти при продаже`,
                maxLevel: 5,
                cost: (lvl) => (lvl + 1) * 8,
                effect: (lvl) => 1 + lvl * 0.40,
            },
            pipeline: {
                icon: '🔩', category: 'common',
                name: 'Трубопровод',
                desc: (lvl) => `Авто-продажа каждые ${Math.max(5, 30 - lvl * 5)} мин`,
                maxLevel: 5,
                cost: (lvl) => (lvl + 1) * 6,
                effect: (lvl) => Math.max(5, 30 - lvl * 5),
            },
            compressor: {
                icon: '⚙️', category: 'common',
                name: 'Компрессор',
                desc: (lvl) => `+${lvl * 50}% ёмкость газовых цистерн`,
                maxLevel: 8,
                cost: (lvl) => (lvl + 1) * 2,
                effect: (lvl) => 1 + lvl * 0.50,
            },
            drillBit: {
                icon: '💎', category: 'common',
                name: 'Алмазное сверло',
                desc: (lvl) => `+${lvl * 20}% ко всей добыче`,
                maxLevel: 10,
                cost: (lvl) => (lvl + 1) * 4,
                effect: (lvl) => 1 + lvl * 0.20,
            },
            aiControl: {
                icon: '🧠', category: 'common',
                name: 'ИИ-управление',
                desc: (lvl) => `+${lvl * 35}% ко всем показателям`,
                maxLevel: 5,
                cost: (lvl) => (lvl + 1) * 10,
                effect: (lvl) => 1 + lvl * 0.35,
            },
        };
    }

    // ============================================================
    //  Расчёт добычи с учётом улучшений
    // ============================================================
    getOilPerSec() {
        if (this.oilPumps === 0) return 0;
        const cfg = this.getUpgradeConfig();
        const base = (this.oilPumps * 2) / 3600;
        const speed    = cfg.oilPumpSpeed.effect(this.upgrades.oilPumpSpeed);
        const eff      = cfg.oilPumpEff.effect(this.upgrades.oilPumpEff);
        const deep     = cfg.oilPumpDeep.effect(this.upgrades.oilPumpDeep);
        const turbo    = cfg.oilPumpTurbo.effect(this.upgrades.oilPumpTurbo);
        const drill    = cfg.drillBit.effect(this.upgrades.drillBit);
        const ai       = cfg.aiControl.effect(this.upgrades.aiControl);
        return base * speed * eff * deep * turbo * drill * ai;
    }

    getGasPerSec() {
        if (this.gasTowers === 0) return 0;
        const cfg = this.getUpgradeConfig();
        const base = (this.gasTowers * 50) / 3600;
        const speed    = cfg.gasTowerSpeed.effect(this.upgrades.gasTowerSpeed);
        const pressure = cfg.gasTowerPressure.effect(this.upgrades.gasTowerPressure);
        const turbo    = cfg.gasTowerTurbo.effect(this.upgrades.gasTowerTurbo);
        const drill    = cfg.drillBit.effect(this.upgrades.drillBit);
        const ai       = cfg.aiControl.effect(this.upgrades.aiControl);
        return base * speed * pressure * turbo * drill * ai;
    }

    getOilSellPrice() {
        const cfg = this.getUpgradeConfig();
        const refinery = cfg.refinery.effect(this.upgrades.refinery);
        // Реальная цена нефти Brent (USD/барр.) × коэффициент НПЗ
        const basePrice = window.getOilPriceRURC ? getOilPriceRURC() : 75.0;
        return basePrice * refinery;
    }

    getGasSellPrice() {
        const cfg = this.getUpgradeConfig();
        const filter = cfg.gasTowerFilter.effect(this.upgrades.gasTowerFilter);
        // Реальная цена газа (USD/м³) × коэффициент фильтра
        const basePrice = window.getGasPriceRURC ? getGasPriceRURC() : 0.13;
        return basePrice * filter;
    }

    // ============================================================
    //  Купить улучшение
    // ============================================================
    buyUpgrade(upgradeId) {
        const cfg = this.getUpgradeConfig();
        const upg = cfg[upgradeId];
        if (!upg) return;

        const currentLevel = this.upgrades[upgradeId];
        if (currentLevel >= upg.maxLevel) {
            this.showMessage(`✅ ${upg.name} — максимальный уровень!`);
            return;
        }

        const cost = upg.cost(currentLevel);
        if (this.tonBalance < cost) {
            this.showMessage(`❌ Нужно ${cost.toFixed(1)} TON. У тебя: ${this.tonBalance.toFixed(2)} TON`);
            return;
        }

        this.tonBalance -= cost;

        // Покупка улучшения → напрямую пополняет пул ликвидности RURC
        if (window.mintToLiquidityPool) {
            mintToLiquidityPool(cost, upg.name);
        }

        this.upgrades[upgradeId]++;
        this.showMessage(`✅ ${upg.icon} ${upg.name} → Уровень ${this.upgrades[upgradeId]}`);
        this.saveData();
        this.render();
        this.renderUpgradesTab();
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
        // Инициализируем глобальную статистику
        if (window.initGlobalStats) initGlobalStats();
        // Инициализируем реальные цены
        if (window.initPriceFeed) initPriceFeed();
        // Инициализируем пул ликвидности RURC
        if (window.initLiquidityPool) initLiquidityPool();
    }

    initTelegram() {
        try {
            if (window.Telegram && window.Telegram.WebApp) {
                Telegram.WebApp.ready();
                Telegram.WebApp.expand();
                const user = Telegram.WebApp.initDataUnsafe?.user;
                if (user) this.username = user.username || user.first_name;
            }
        } catch (e) { console.log('Telegram WebApp not available'); }
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
            case 'upgrades':    this.renderUpgradesTab(); break;
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
        const oilPerSec = this.getOilPerSec();
        const gasPerSec = this.getGasPerSec();

        if (this.oilStored < this.oilCapacity)
            this.oilStored = Math.min(this.oilCapacity, this.oilStored + oilPerSec);
        if (this.gasStored < this.gasCapacity)
            this.gasStored = Math.min(this.gasCapacity, this.gasStored + gasPerSec);

        const rurcPerSec = (oilPerSec * 3600 * 0.5 + gasPerSec * 3600 * 0.3) / 3600;
        this.balance += rurcPerSec;
        this.miningSessionCoins += rurcPerSec;

        // Авто-продажа (pipeline)
        const cfg = this.getUpgradeConfig();
        const pipelineLevel = this.upgrades.pipeline;
        if (pipelineLevel > 0) {
            const intervalSec = cfg.pipeline.effect(pipelineLevel) * 60;
            if (!this._lastAutosell) this._lastAutosell = Date.now();
            if ((Date.now() - this._lastAutosell) / 1000 >= intervalSec) {
                if (this.oilStored > 0) this.sellOil(true);
                if (this.gasStored > 0) this.sellGas(true);
                this._lastAutosell = Date.now();
            }
        }

        // Добавляем добытое в глобальный резервуар
        if (window.addToGlobalReserve) {
            addToGlobalReserve(oilPerSec, gasPerSec);
        }

        this.saveData();
    }

    sellOil(silent = false) {
        if (this.oilStored <= 0) { if (!silent) this.showMessage('Нет нефти для продажи'); return; }
        const price = this.getOilSellPrice();
        const earned = this.oilStored * price;
        this.balance += earned;
        if (!silent) this.showMessage(`💰 Продано ${this.oilStored.toFixed(1)} барр. нефти за ${earned.toFixed(2)} RURC (${price.toFixed(2)} RURC/барр.)`);
        this.oilStored = 0;
        if (window.subtractFromGlobalReserve) subtractFromGlobalReserve(sold, 0);
        this.saveData(); this.render();
    }

    sellGas(silent = false) {
        if (this.gasStored <= 0) { if (!silent) this.showMessage('Нет газа для продажи'); return; }
        const price = this.getGasSellPrice();
        const earned = this.gasStored * price;
        this.balance += earned;
        if (!silent) this.showMessage(`💰 Продано ${this.gasStored.toFixed(0)} м³ газа за ${earned.toFixed(2)} RURC (${price.toFixed(2)} RURC/м³)`);
        this.gasStored = 0;
        if (window.subtractFromGlobalReserve) subtractFromGlobalReserve(0, sold);
        this.saveData(); this.render();
    }

    stake() {
        const amount = parseFloat(document.getElementById('stakeAmount').value);
        if (!amount || amount <= 0) { this.showMessage('Введите корректную сумму'); return; }
        if (amount > this.balance) { this.showMessage('Недостаточно RURC'); return; }
        this.balance -= amount;
        this.stakedBalance += amount;
        this.showMessage(`✅ Застейкано ${amount} RURC!`);
        this.saveData(); this.render();
    }

    unstake() {
        if (this.stakedBalance <= 0) { this.showMessage('Нет застейканных средств'); return; }
        const total = this.stakedBalance + this.stakingRewards;
        this.balance += total;
        this.showMessage(`💰 Выведено ${total.toFixed(2)} RURC`);
        this.stakedBalance = 0; this.stakingRewards = 0;
        this.saveData(); this.render();
    }

    calculateStakingRewards() {
        if (this.stakedBalance > 0) {
            const dailyReward = (this.stakedBalance * 0.15) / 365;
            this.stakingRewards += dailyReward / 86400;
        }
    }

    buyEquipment(type) {
        const prices = {
            oilPump:  { cost: 2, currency: 'TON', label: 'Нефтяной насос' },
            gasTower: { cost: 3, currency: 'TON', label: 'Газовая вышка' },
            oilTank:  { cost: 1, currency: 'TON', label: 'Цистерна для нефти' },
            gasTank:  { cost: 1, currency: 'TON', label: 'Цистерна для газа' }
        };
        const item = prices[type];
        if (!item) return;
        if (this.tonBalance < item.cost) { this.showMessage(`Недостаточно TON. Нужно ${item.cost} TON`); return; }
        this.tonBalance -= item.cost;
        switch(type) {
            case 'oilPump':  this.oilPumps++; break;
            case 'gasTower': this.gasTowers++; break;
            case 'oilTank':  this.oilTanks++; this.oilCapacity += 200; break;
            case 'gasTank':  this.gasTanks++; this.gasCapacity += 2000; break;
        }
        this.showMessage(`✅ Куплено: ${item.label}`);
        this.saveData(); this.render(); this.renderEquipmentData();
    }

    render() {
        const el = (id) => document.getElementById(id);
        if (el('balance'))       el('balance').textContent = this.balance.toFixed(2) + ' RURC';
        if (el('usdValue'))      el('usdValue').textContent = `≈ $${(this.balance * 0.01).toFixed(2)}`;
        if (el('tonBalance'))    el('tonBalance').textContent = this.tonBalance.toFixed(2);
        if (el('hashrate'))      el('hashrate').textContent = (this.getOilPerSec() * 3600).toFixed(2) + ' барр/ч + ' + (this.getGasPerSec() * 3600).toFixed(0) + ' м³/ч';
        if (el('stakedBalance')) el('stakedBalance').textContent = this.stakedBalance.toFixed(2) + ' RURC';
        if (el('stakingRewards'))el('stakingRewards').textContent = this.stakingRewards.toFixed(4) + ' RURC';
        if (el('oilStored'))     el('oilStored').textContent = this.oilStored.toFixed(1) + ' барр.';
        if (el('gasStored'))     el('gasStored').textContent = this.gasStored.toFixed(0) + ' м³';
        if (el('oilPumpsCount')) el('oilPumpsCount').textContent = this.oilPumps;
        if (el('gasTowersCount'))el('gasTowersCount').textContent = this.gasTowers;
        if (el('oilTanksCount')) el('oilTanksCount').textContent = this.oilTanks;
        if (el('gasTanksCount')) el('gasTanksCount').textContent = this.gasTanks;
        if (el('oilBar')) el('oilBar').style.width = Math.min(100, (this.oilStored / this.oilCapacity) * 100) + '%';
        if (el('gasBar')) el('gasBar').style.width = Math.min(100, (this.gasStored / this.gasCapacity) * 100) + '%';
    }

    renderMiningData() {
        this.render();
        if (window.renderGlobalStats) renderGlobalStats();
    }

    renderEquipmentData() {
        const container = document.getElementById('equipmentList');
        if (!container) return;
        const equipment = [
            { type: 'oilPump',  icon: '🛢️', name: 'Нефтяной насос',  desc: '+2 барр/ч',  cost: '2 TON', count: this.oilPumps },
            { type: 'gasTower', icon: '🏗️', name: 'Газовая вышка',   desc: '+50 м³/ч',   cost: '3 TON', count: this.gasTowers },
            { type: 'oilTank',  icon: '🛢️', name: 'Цистерна нефти',  desc: '+200 барр.', cost: '1 TON', count: this.oilTanks },
            { type: 'gasTank',  icon: '⚗️', name: 'Цистерна газа',   desc: '+2000 м³',   cost: '1 TON', count: this.gasTanks }
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

    // ============================================================
    //  РЕНДЕР ВКЛАДКИ УЛУЧШЕНИЙ
    // ============================================================
    renderUpgradesTab() {
        const container = document.getElementById('upgradesList');
        if (!container) return;

        const cfg = this.getUpgradeConfig();
        const categories = {
            oil:    { label: '🛢️ Нефтяной насос', color: '#8B4513' },
            gas:    { label: '🏗️ Газовая вышка',  color: '#1565C0' },
            common: { label: '⚙️ Общие улучшения', color: '#2E7D32' },
        };

        let html = '';
        for (const [catId, cat] of Object.entries(categories)) {
            const items = Object.entries(cfg).filter(([, v]) => v.category === catId);
            html += `
                <div style="margin-bottom:20px;">
                    <div style="font-size:14px;font-weight:700;color:${cat.color};
                                padding:8px 12px;background:#111;border-radius:8px;
                                margin-bottom:10px;border-left:3px solid ${cat.color};">
                        ${cat.label}
                    </div>
                    ${items.map(([id, upg]) => {
                        const lvl = this.upgrades[id];
                        const maxed = lvl >= upg.maxLevel;
                        const nextCost = maxed ? null : upg.cost(lvl).toFixed(1);
                        const canAfford = !maxed && this.tonBalance >= upg.cost(lvl);
                        const pct = Math.round((lvl / upg.maxLevel) * 100);

                        return `
                        <div style="background:#111122;border:1px solid ${maxed ? '#4ade80' : '#222'};
                                    border-radius:12px;padding:14px;margin-bottom:8px;">
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                                <span style="font-size:24px;">${upg.icon}</span>
                                <div style="flex:1;">
                                    <div style="font-size:13px;font-weight:700;">${upg.name}</div>
                                    <div style="font-size:11px;color:#888;margin-top:2px;">${upg.desc(lvl)}</div>
                                </div>
                                <div style="text-align:right;">
                                    <div style="font-size:12px;font-weight:700;color:${maxed ? '#4ade80' : '#FF8C00'};">
                                        ${maxed ? 'MAX' : `Ур. ${lvl}/${upg.maxLevel}`}
                                    </div>
                                </div>
                            </div>
                            <!-- Прогресс-бар уровня -->
                            <div style="background:#1a1a2e;border-radius:4px;height:4px;margin-bottom:10px;">
                                <div style="background:${maxed ? '#4ade80' : cat.color};height:4px;
                                            border-radius:4px;width:${pct}%;transition:width 0.3s;"></div>
                            </div>
                            ${maxed
                                ? `<div style="text-align:center;font-size:12px;color:#4ade80;">✅ Максимальный уровень</div>`
                                : `<button onclick="window.rurcoinApp.buyUpgrade('${id}')"
                                        style="width:100%;padding:10px;border:none;border-radius:8px;
                                               font-size:13px;font-weight:700;cursor:pointer;
                                               background:${canAfford ? 'linear-gradient(135deg,#FF8C00,#FF6000)' : '#333'};
                                               color:${canAfford ? '#fff' : '#666'};">
                                        ${upg.icon} Улучшить → Ур. ${lvl + 1} &nbsp;|&nbsp; ${nextCost} TON
                                   </button>`
                            }
                        </div>`;
                    }).join('')}
                </div>`;
        }

        container.innerHTML = html;
    }

    renderStorageData() {
        const container = document.getElementById('storageInfo');
        if (!container) return;
        const oilPct = Math.min(100, (this.oilStored / this.oilCapacity) * 100).toFixed(1);
        const gasPct = Math.min(100, (this.gasStored / this.gasCapacity) * 100).toFixed(1);
        const oilPrice = this.getOilSellPrice().toFixed(2);
        const gasPrice = this.getGasSellPrice().toFixed(2);
        container.innerHTML = `
            <div class="storage-card">
                <div class="storage-header">🛢️ Нефть</div>
                <div class="storage-bar-wrap"><div class="storage-bar oil-bar" style="width:${oilPct}%"></div></div>
                <div class="storage-nums">${this.oilStored.toFixed(1)} / ${this.oilCapacity} барр. (${oilPct}%)</div>
                <div style="font-size:11px;color:#888;margin:4px 0;">Цена: ${oilPrice} RURC/барр.</div>
                <button class="sell-btn" onclick="window.rurcoinApp.sellOil()">
                    💰 Продать нефть (${(this.oilStored * this.getOilSellPrice()).toFixed(2)} RURC)
                </button>
            </div>
            <div class="storage-card">
                <div class="storage-header">⛽ Газ</div>
                <div class="storage-bar-wrap"><div class="storage-bar gas-bar" style="width:${gasPct}%"></div></div>
                <div class="storage-nums">${this.gasStored.toFixed(0)} / ${this.gasCapacity} м³ (${gasPct}%)</div>
                <div style="font-size:11px;color:#888;margin:4px 0;">Цена: ${gasPrice} RURC/м³</div>
                <button class="sell-btn" onclick="window.rurcoinApp.sellGas()">
                    💰 Продать газ (${(this.gasStored * this.getGasSellPrice()).toFixed(2)} RURC)
                </button>
            </div>`;
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
            // Убедимся что upgrades объект существует
            if (!this.upgrades) this.upgrades = {};
            const defaultUpgrades = {
                oilPumpSpeed:0,oilPumpEff:0,oilPumpAuto:0,oilPumpDeep:0,oilPumpTurbo:0,
                gasTowerSpeed:0,gasTowerPressure:0,gasTowerAuto:0,gasTowerFilter:0,gasTowerTurbo:0,
                refinery:0,pipeline:0,compressor:0,drillBit:0,aiControl:0
            };
            this.upgrades = Object.assign(defaultUpgrades, this.upgrades);
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
            upgrades: this.upgrades
        }));
    }

    startGameLoop() {
        setInterval(() => {
            this.mine();
            this.calculateStakingRewards();
            this.render();
            if (this.currentTab === 'storage') this.renderStorageData();
            if (this.currentTab === 'upgrades') this.renderUpgradesTab();
            if (this.currentTab === 'mining' && window.renderGlobalStats) renderGlobalStats();
        }, 1000);
    }

    startHalvingTimer() { setInterval(() => { this.updateHalvingTimer(); }, 1000); }

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
                <div style="color:#666;font-size:10px;">${tx.time}</div>
            `;
            feed.appendChild(txElement);
        });
    }

    buyFarm(farmId) { this.buyEquipment('oilPump'); }
}

document.addEventListener('DOMContentLoaded', function() {
    const requiredElements = ['mineBtn', 'balance', 'hashrate'];
    let allElementsExist = true;
    requiredElements.forEach(id => {
        if (!document.getElementById(id)) { console.error('Элемент не найден:', id); allElementsExist = false; }
    });
    if (allElementsExist) {
        window.rurcoinApp = new RURCoinMiner();
        console.log('RURCoin Oil & Gas запущено!');
    }
});

// Обновляем UI при изменении цен
window.addEventListener('priceUpdate', () => {
    if (window.game) {
        window.game.render();
        if (window.renderPriceTicker) renderPriceTicker();
    }
});
