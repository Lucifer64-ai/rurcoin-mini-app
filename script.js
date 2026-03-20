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
        const T={F:{c:1},E:{c:4},D:{c:12},C:{c:30},B:{c:75},A:{c:180},S:{c:450},SS:{c:1200}};
        return {
            oilPumpSpeed:   {icon:'⚡',  cat:'oil',    tier:'F',  name:'Скорость насоса',       desc:(l)=>`+${l*30}% скорость нефти`,           max:10, cost:(l)=>(l+1)*T.F.c,  fx:(l)=>1+l*0.30},
            oilPumpEff:     {icon:'🔧', cat:'oil',    tier:'E',  name:'КПД насоса',             desc:(l)=>`+${l*15}% эффективность`,             max:10, cost:(l)=>(l+1)*T.E.c,  fx:(l)=>1+l*0.15},
            oilPumpAuto:    {icon:'🤖', cat:'oil',    tier:'D',  name:'Автонасос',              desc:(l)=>`+${l*20}% авто-добыча нефти`,         max:5,  cost:(l)=>(l+1)*T.D.c,  fx:(l)=>l*0.20},
            oilPumpDeep:    {icon:'⛏️', cat:'oil',    tier:'C',  name:'Глубокое бурение',       desc:(l)=>`+${l*50}% доступ к пластам`,          max:8,  cost:(l)=>(l+1)*T.C.c,  fx:(l)=>1+l*0.50},
            oilPumpTurbo:   {icon:'🚀', cat:'oil',    tier:'B',  name:'Турбонасос',             desc:(l)=>`x${(1+l*0.5).toFixed(1)} произв.`,    max:5,  cost:(l)=>(l+1)*T.B.c,  fx:(l)=>1+l*0.50},
            oilPumpPlasma:  {icon:'⚛️', cat:'oil',    tier:'A',  name:'Плазменный насос',       desc:(l)=>`+${l*80}% добыча + авто-продажа`,     max:5,  cost:(l)=>(l+1)*T.A.c,  fx:(l)=>1+l*0.80},
            oilPumpQuantum: {icon:'🌀', cat:'oil',    tier:'S',  name:'Квантовый насос',        desc:(l)=>`x${1+l*2} вся нефтедобыча`,           max:3,  cost:(l)=>(l+1)*T.S.c,  fx:(l)=>1+l*2},
            oilPumpGod:     {icon:'👑', cat:'oil',    tier:'SS', name:'Богоуровень насоса',     desc:(l)=>`x${1+l*5} ВСЯ нефть`,                 max:1,  cost:(l)=>(l+1)*T.SS.c, fx:(l)=>1+l*5},
            gasTowerSpeed:  {icon:'💨', cat:'gas',    tier:'F',  name:'Скорость вышки',         desc:(l)=>`+${l*30}% скорость газа`,             max:10, cost:(l)=>(l+1)*T.F.c,  fx:(l)=>1+l*0.30},
            gasTowerPres:   {icon:'🔴', cat:'gas',    tier:'E',  name:'Давление газа',          desc:(l)=>`+${l*25}% объём добычи`,              max:10, cost:(l)=>(l+1)*T.E.c,  fx:(l)=>1+l*0.25},
            gasTowerAuto:   {icon:'🤖', cat:'gas',    tier:'D',  name:'Автовышка',              desc:(l)=>`+${l*20}% авто-добыча газа`,          max:5,  cost:(l)=>(l+1)*T.D.c,  fx:(l)=>l*0.20},
            gasTowerFilter: {icon:'🧪', cat:'gas',    tier:'C',  name:'Фильтрация газа',        desc:(l)=>`+${l*20}% цена газа`,                 max:8,  cost:(l)=>(l+1)*T.C.c,  fx:(l)=>1+l*0.20},
            gasTowerTurbo:  {icon:'🚀', cat:'gas',    tier:'B',  name:'Турбовышка',             desc:(l)=>`x${(1+l*0.5).toFixed(1)} произв.`,    max:5,  cost:(l)=>(l+1)*T.B.c,  fx:(l)=>1+l*0.50},
            gasTowerCryo:   {icon:'❄️', cat:'gas',    tier:'A',  name:'Крио-сжижение',          desc:(l)=>`+${l*70}% ёмкость + цена газа`,       max:5,  cost:(l)=>(l+1)*T.A.c,  fx:(l)=>1+l*0.70},
            gasTowerFusion: {icon:'☢️', cat:'gas',    tier:'S',  name:'Термоядерная вышка',     desc:(l)=>`x${1+l*2} вся газодобыча`,            max:3,  cost:(l)=>(l+1)*T.S.c,  fx:(l)=>1+l*2},
            gasTowerGod:    {icon:'🌌', cat:'gas',    tier:'SS', name:'Богоуровень вышки',      desc:(l)=>`x${1+l*5} ВЕСЬ газ`,                  max:1,  cost:(l)=>(l+1)*T.SS.c, fx:(l)=>1+l*5},
            refinery:       {icon:'🏭', cat:'common', tier:'E',  name:'Нефтезавод',             desc:(l)=>`+${l*40}% цена нефти`,                max:5,  cost:(l)=>(l+1)*T.E.c,  fx:(l)=>1+l*0.40},
            pipeline:       {icon:'🔩', cat:'common', tier:'D',  name:'Трубопровод',            desc:(l)=>`Авто-продажа каждые ${Math.max(5,30-l*5)} мин`, max:5, cost:(l)=>(l+1)*T.D.c, fx:(l)=>Math.max(5,30-l*5)},
            compressor:     {icon:'⚙️', cat:'common', tier:'D',  name:'Компрессор',             desc:(l)=>`+${l*50}% ёмкость цистерн`,           max:8,  cost:(l)=>(l+1)*T.D.c,  fx:(l)=>1+l*0.50},
            drillBit:       {icon:'💎', cat:'common', tier:'C',  name:'Алмазное сверло',        desc:(l)=>`+${l*20}% ко всей добыче`,            max:10, cost:(l)=>(l+1)*T.C.c,  fx:(l)=>1+l*0.20},
            aiControl:      {icon:'🧠', cat:'common', tier:'B',  name:'ИИ-управление',          desc:(l)=>`+${l*35}% ко всем показателям`,       max:5,  cost:(l)=>(l+1)*T.B.c,  fx:(l)=>1+l*0.35},
            satellite:      {icon:'🛰️', cat:'common', tier:'A',  name:'Спутниковый мониторинг', desc:(l)=>`+${l*60}% точность добычи`,           max:5,  cost:(l)=>(l+1)*T.A.c,  fx:(l)=>1+l*0.60},
            nanoTech:       {icon:'🔬', cat:'common', tier:'S',  name:'Нанотехнологии',         desc:(l)=>`x${(1+l*1.5).toFixed(1)} весь доход`, max:3,  cost:(l)=>(l+1)*T.S.c,  fx:(l)=>1+l*1.5},
            godMode:        {icon:'🌈', cat:'common', tier:'SS', name:'Режим Бога',             desc:(l)=>`x${1+l*10} ВСЁ`,                      max:1,  cost:(l)=>(l+1)*T.SS.c, fx:(l)=>1+l*10},
        };
    }

    renderUpgradesTab() {
        const el = document.getElementById('upgradesList');
        if (!el) return;
        const cfg = this.getUpgradeConfig();
        const TC = {
            F: {color:'#e0e0e0',bg:'#161616',glow:'0 0 8px #fff5'},
            E: {color:'#4ade80',bg:'#0a1a0a',glow:'0 0 8px #22c55e6'},
            D: {color:'#60a5fa',bg:'#0a0f1f',glow:'0 0 8px #3b82f66'},
            C: {color:'#c084fc',bg:'#130a1f',glow:'0 0 8px #a855f76'},
            B: {color:'#fb923c',bg:'#1f0f0a',glow:'0 0 8px #f973166'},
            A: {color:'#f87171',bg:'#1f0a0a',glow:'0 0 10px #ef44446'},
            S: {color:'#fbbf24',bg:'#1a1400',glow:'0 0 12px #f59e0b9'},
            SS:{color:'#fff',   bg:'#0d0d1a',glow:'0 0 16px #f0fa'},
        };
        const cats={oil:'🛢️ Нефтяной насос',gas:'🏗️ Газовая вышка',common:'⚙️ Общие улучшения'};
        let h='';
        for(const[catId,catLabel]of Object.entries(cats)){
            const items=Object.entries(cfg).filter(([,v])=>v.cat===catId);
            h+=`<div style="margin-bottom:22px"><div style="font-size:11px;font-weight:700;color:#555;letter-spacing:2px;padding:4px 0 10px">${catLabel}</div>`;
            for(const[id,u]of items){
                const lvl=this.upgrades[id]||0,maxed=lvl>=u.max,tc=TC[u.tier],isRainbow=u.tier==='SS';
                const pct=Math.round(lvl/u.max*100),cost=maxed?0:u.cost(lvl),canAfford=!maxed&&this.tonBalance>=cost;
                const badge=isRainbow
                    ?`<span style="font-size:9px;font-weight:900;padding:2px 6px;border-radius:5px;background:linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f);color:#fff">SS</span>`
                    :`<span style="font-size:9px;font-weight:900;padding:2px 6px;border-radius:5px;color:${tc.color};border:1px solid ${tc.color};background:${tc.color}18">${u.tier}</span>`;
                const bdr=isRainbow
                    ?`border:2px solid transparent;background:linear-gradient(${tc.bg},${tc.bg}) padding-box,linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00) border-box`
                    :`border:1px solid ${maxed?tc.color:'#1e1e1e'};box-shadow:${maxed?tc.glow:'none'}`;
                const btnBg=canAfford?(isRainbow?'linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f)':`linear-gradient(135deg,${tc.color}bb,${tc.color})`):'#181818';
                h+=`<div style="background:${tc.bg};${bdr};border-radius:14px;padding:14px;margin-bottom:8px">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
                        <span style="font-size:26px;filter:drop-shadow(0 0 6px ${isRainbow?'#f0f':tc.color})">${u.icon}</span>
                        <div style="flex:1">
                            <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">${badge}<span style="font-size:13px;font-weight:700;color:#eee">${u.name}</span></div>
                            <div style="font-size:11px;color:#555">${u.desc(lvl)}</div>
                        </div>
                        <div style="font-size:11px;font-weight:700;color:${maxed?tc.color:'#444'}">${maxed?'MAX':`${lvl}/${u.max}`}</div>
                    </div>
                    <div style="background:#111;border-radius:3px;height:4px;margin-bottom:10px;overflow:hidden">
                        <div style="height:4px;border-radius:3px;width:${pct}%;transition:width .4s;background:${isRainbow?'linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f)':tc.color};box-shadow:${maxed?tc.glow:'none'}"></div>
                    </div>
                    ${maxed
                        ?`<div style="text-align:center;font-size:12px;color:${tc.color}">✅ Максимальный уровень</div>`
                        :`<button onclick="window.rurcoinApp.buyUpgrade('${id}')" style="width:100%;padding:10px;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;background:${btnBg};color:${canAfford?'#fff':'#444'};box-shadow:${canAfford?tc.glow:'none'};border:1px solid ${canAfford?tc.color:'#2a2a2a'};transition:transform .15s" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">${u.icon} Улучшить → Ур.${lvl+1} | 💎 ${cost.toFixed(1)} TON</button>`
                    }
                </div>`;
            }
            h+='</div>';
        }
        el.innerHTML=h;
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
            if (window.updateCompareStats) updateCompareStats(this.oilStored, this.gasStored, this.totalOilMined || this.oilStored, this.totalGasMined || this.gasStored);
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


// ============================================================
//  СЛАЙДЕР РЕСУРСОВ (Нефть / Газ)
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
        oilBtn.classList.add('active');
        gasBtn.classList.remove('active');
    } else {
        oilSlide.style.display = 'none';
        gasSlide.style.display = 'block';
        gasBtn.classList.add('active');
        oilBtn.classList.remove('active');
    }
}
window.switchResourceSlide = switchResourceSlide;

// ============================================================
//  АНИМАЦИЯ SVG ЦИСТЕРН
// ============================================================
function updateTankSVG(type, stored, capacity) {
    const pct = Math.min(100, capacity > 0 ? (stored / capacity) * 100 : 0);
    const pctRounded = Math.round(pct);
    if (type === 'oil') {
        const rect    = document.getElementById('oilLiquidRect');
        const wave    = document.getElementById('oilWavePath');
        const pctEl   = document.getElementById('oilTankPct');
        const storedEl= document.getElementById('oilStoredLabel');
        const capEl   = document.getElementById('oilCapLabel');
        if (!rect) return;
        const maxH = 118, y0 = 140;
        const h = (pct / 100) * maxH;
        const y = y0 - h;
        rect.setAttribute('y', h > 0 ? y : y0);
        rect.setAttribute('height', h);
        if (wave) wave.setAttribute('d', `M12,${y} Q36,${y-4} 60,${y} Q84,${y+4} 108,${y} L108,${y} L12,${y} Z`);
        if (pctEl)    pctEl.textContent    = pctRounded + '%';
        if (storedEl) storedEl.textContent = stored.toFixed(1) + ' барр.';
        if (capEl)    capEl.textContent    = '/ ' + capacity.toFixed(0) + ' барр.';
        if (rect) rect.setAttribute('fill', pct > 80 ? '#cc2200' : pct > 50 ? '#3d1a00' : '#2a1000');
    } else {
        const rect    = document.getElementById('gasLiquidRect');
        const wave    = document.getElementById('gasWavePath');
        const pctEl   = document.getElementById('gasTankPct');
        const storedEl= document.getElementById('gasStoredLabel');
        const capEl   = document.getElementById('gasCapLabel');
        if (!rect) return;
        const maxH = 64, y0 = 92;
        const h = (pct / 100) * maxH;
        const y = y0 - h;
        rect.setAttribute('y', h > 0 ? y : y0);
        rect.setAttribute('height', h);
        if (wave) wave.setAttribute('d', `M14,${y} Q47,${y-4} 80,${y} Q113,${y+4} 146,${y} L146,${y} L14,${y} Z`);
        if (pctEl)    { pctEl.textContent = pctRounded + '%'; pctEl.style.color = '#4ade80'; }
        if (storedEl) storedEl.textContent = stored.toFixed(0) + ' м³';
        if (capEl)    capEl.textContent    = '/ ' + capacity.toFixed(0) + ' м³';
    }
}
window.updateTankSVG = updateTankSVG;

// ============================================================
//  СРАВНЕНИЕ С ПРОШЛЫМ
// ============================================================
const _compareHistory = { oil: [], gas: [] };

function updateCompareStats(oilStored, gasStored, oilTotal, gasTotal) {
    const now = Date.now();
    _compareHistory.oil.push({ t: now, v: oilTotal });
    _compareHistory.gas.push({ t: now, v: gasTotal });
    const cut = now - 25 * 3600 * 1000;
    _compareHistory.oil = _compareHistory.oil.filter(x => x.t > cut);
    _compareHistory.gas = _compareHistory.gas.filter(x => x.t > cut);

    function getDelta(arr, ms) {
        const cutoff = now - ms;
        const old = arr.filter(x => x.t <= cutoff);
        if (!old.length) return null;
        return arr[arr.length-1].v - old[old.length-1].v;
    }
    function renderDelta(valId, deltaId, current, delta, unit) {
        const v = document.getElementById(valId);
        const d = document.getElementById(deltaId);
        if (v) v.textContent = current.toFixed(unit === 'м³' ? 0 : 1) + ' ' + unit;
        if (d) {
            if (delta === null) { d.textContent = 'нет данных'; d.className = 'compare-delta'; return; }
            const sign = delta >= 0 ? '+' : '';
            d.textContent = sign + delta.toFixed(unit === 'м³' ? 0 : 1) + ' ' + unit;
            d.className = 'compare-delta' + (delta < 0 ? ' neg' : '');
        }
    }
    renderDelta('oilHourCompare','oilHourDelta', oilStored, getDelta(_compareHistory.oil, 3600000),     'барр.');
    renderDelta('oilDayCompare', 'oilDayDelta',  oilStored, getDelta(_compareHistory.oil, 86400000),    'барр.');
    renderDelta('gasHourCompare','gasHourDelta', gasStored, getDelta(_compareHistory.gas, 3600000),     'м³');
    renderDelta('gasDayCompare', 'gasDayDelta',  gasStored, getDelta(_compareHistory.gas, 86400000),    'м³');
    const oT = document.getElementById('oilTotalCompare');
    const gT = document.getElementById('gasTotalCompare');
    if (oT) oT.textContent = oilTotal.toFixed(1);
    if (gT) gT.textContent = gasTotal.toFixed(0);
}
window.updateCompareStats = updateCompareStats;

// ============================================================
//  ОБНОВЛЕНИЕ СТАТУСА КАЧАЛКИ / МОРСКОЙ ПЛАТФОРМЫ
// ============================================================
function updateRigVisuals(isMining, oilPerHour, gasPerHour) {
    const oilBadge = document.getElementById('oilRigStatus');
    const gasBadge = document.getElementById('gasRigStatus');
    const oilText  = document.getElementById('oilRigStatusText');
    const gasText  = document.getElementById('gasRigStatusText');
    const oilRate  = document.getElementById('oilRateText');
    const gasRate  = document.getElementById('gasRateText');
    const beam     = document.getElementById('pumpBeam');
    const flame    = document.getElementById('gasFlameTip');

    if (isMining) {
        if (oilBadge) { oilBadge.textContent = '▶ Добыча идёт'; oilBadge.style.background = 'rgba(255,100,0,0.25)'; }
        if (gasBadge) { gasBadge.textContent = '▶ Добыча идёт'; gasBadge.style.background = 'rgba(74,222,128,0.2)'; }
        if (oilText)  oilText.textContent = '⚙ Работает';
        if (gasText)  gasText.textContent = '⚙ Работает';
        if (beam)  beam.style.animationPlayState  = 'running';
        if (flame) flame.style.animationPlayState = 'running';
    } else {
        if (oilBadge) { oilBadge.textContent = '⏸ Остановлено'; oilBadge.style.background = 'rgba(255,100,0,0.1)'; }
        if (gasBadge) { gasBadge.textContent = '⏸ Остановлено'; gasBadge.style.background = 'rgba(74,222,128,0.08)'; }
        if (oilText)  oilText.textContent = '⏸ Остановлено';
        if (gasText)  gasText.textContent = '⏸ Остановлено';
        if (beam)  beam.style.animationPlayState  = 'paused';
        if (flame) flame.style.animationPlayState = 'paused';
    }
    if (oilRate) oilRate.textContent = oilPerHour.toFixed(1) + ' барр/ч';
    if (gasRate) gasRate.textContent = gasPerHour.toFixed(0) + ' м³/ч';

    // Кнопки
    const oilBtnText = document.getElementById('mineBtnOilText');
    const gasBtnText = document.getElementById('mineBtnGasText');
    const oilBtnIcon = document.getElementById('mineBtnOilIcon');
    const gasBtnIcon = document.getElementById('mineBtnGasIcon');
    if (isMining) {
        if (oilBtnText) oilBtnText.textContent = 'Остановить добычу нефти';
        if (gasBtnText) gasBtnText.textContent = 'Остановить добычу газа';
        if (oilBtnIcon) oilBtnIcon.textContent = '⏹';
        if (gasBtnIcon) gasBtnIcon.textContent = '⏹';
    } else {
        if (oilBtnText) oilBtnText.textContent = 'Начать добычу нефти';
        if (gasBtnText) gasBtnText.textContent = 'Начать добычу газа';
        if (oilBtnIcon) oilBtnIcon.textContent = '⛽';
        if (gasBtnIcon) gasBtnIcon.textContent = '🔥';
    }
}
window.updateRigVisuals = updateRigVisuals;
