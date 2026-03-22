// Смарт-контракты RURCoin
const CONTRACTS = {
    rurc: {
        name: "RURCoin",
        address: "EQA8u0W168DzY440TOU8vjStCGHpROrYvd42ZJ8zDdrNn_Nd",
        decimals: 9,
        symbol: "RURC",
        description: "Российская криптовалюта на блокчейне TON"
    },
    staking: {
        name: "RURCoin Staking",
        address: "EQA8u0W168DzY440TOU8vjStCGHpROrYvd42ZJ8zDdrNn_Nd",
        apy: 15,
        description: "Контракт для стейкинга RURC с начислением 15% годовых"
    },
    farmFactory: {
        name: "Farm Factory",
        address: "EQA8u0W168DzY440TOU8vjStCGHpROrYvd42ZJ8zDdrNn_Nd",
        description: "Создание и управление майнинг-фермами"
    }
};

const RURC_ABI = {
    balanceOf: "balanceOf(address):uint256",
    transfer: "transfer(address,uint256)",
    approve: "approve(address,uint256)",
    allowance: "allowance(address,address):uint256",
    totalSupply: "totalSupply():uint256",
    mint: "mint(address,uint256)",
    burn: "burn(uint256)",
    freeze: "freeze(address,uint256)",
    unfreeze: "unfreeze(address,uint256)",
    frozenBalanceOf: "frozenBalanceOf(address):uint256"
};

// Хранилище замороженных средств (локально для демо)
const frozenBalances = {};

async function initContracts() {
    if (typeof window.ton === 'undefined') {
        console.log('TON Wallet не подключён');
        return null;
    }

    try {
        const provider = window.ton;
        const contracts = {};

        for (const [key, config] of Object.entries(CONTRACTS)) {
            contracts[key] = {
                ...config,
                contract: await provider.contract(config.address)
            };
        }

        return contracts;
    } catch (error) {
        console.error('Ошибка инициализации контрактов:', error);
        return null;
    }
}

async function getRURCBalance(address) {
    try {
        const result = await window.ton.provider.call(
            CONTRACTS.rurc.address,
            'balanceOf',
            { address: address }
        );
        return parseInt(result) / Math.pow(10, CONTRACTS.rurc.decimals);
    } catch (error) {
        console.error('Ошибка получения баланса:', error);
        return 0;
    }
}

async function transferRURC(to, amount) {
    try {
        const sender = await window.ton.sender;
        await sender.send({
            to: CONTRACTS.rurc.address,
            amount: amount * Math.pow(10, CONTRACTS.rurc.decimals),
            payload: {
                method: 'transfer',
                params: { to, amount: amount * Math.pow(10, CONTRACTS.rurc.decimals) }
            }
        });
        return true;
    } catch (error) {
        console.error('Ошибка перевода:', error);
        return false;
    }
}

// ============ MINT ============
async function mintRURC(toAddress, amount) {
    try {
        const sender = await window.ton.sender;
        const mintPayload = {
            method: 'mint',
            params: {
                to: toAddress,
                amount: amount * Math.pow(10, CONTRACTS.rurc.decimals)
            }
        };

        await sender.send({
            to: CONTRACTS.rurc.address,
            amount: 0,
            payload: mintPayload
        });

        console.log(`Minted ${amount} RURC to ${toAddress}`);
        return true;
    } catch (error) {
        console.error('Ошибка mint:', error);
        return false;
    }
}

async function mintToSelf(amount) {
    try {
        const walletAddress = await window.ton.getWalletAddress();
        return await mintRURC(walletAddress, amount);
    } catch (error) {
        console.error('Ошибка mint to self:', error);
        return false;
    }
}

async function mintWithUI(amount, onSuccess, onError) {
    try {
        const walletAddress = await window.ton.getWalletAddress();
        showNotification('⛽ Майнинг...', 'pending');

        const result = await mintRURC(walletAddress, amount);

        if (result) {
            showNotification(`✅ Майнинг завершён! +${amount} RURC`, 'success');
            if (onSuccess) onSuccess();
        } else {
            showNotification('❌ Ошибка майнинга', 'error');
            if (onError) onError();
        }
        return result;
    } catch (error) {
        showNotification('❌ Ошибка: ' + error.message, 'error');
        if (onError) onError(error);
        return false;
    }
}

// ============ BURN ============
async function burnRURC(amount) {
    try {
        const sender = await window.ton.sender;
        const burnPayload = {
            method: 'burn',
            params: {
                amount: amount * Math.pow(10, CONTRACTS.rurc.decimals)
            }
        };

        await sender.send({
            to: CONTRACTS.rurc.address,
            amount: 0,
            payload: burnPayload
        });

        console.log(`Burned ${amount} RURC`);
        return true;
    } catch (error) {
        console.error('Ошибка burn:', error);
        return false;
    }
}

async function burnToAddress(amount, burnAddress = "0x0000000000000000000000000000000000000000") {
    try {
        const sender = await window.ton.sender;
        await sender.send({
            to: CONTRACTS.rurc.address,
            amount: amount * Math.pow(10, CONTRACTS.rurc.decimals),
            payload: {
                method: 'transfer',
                params: { to: burnAddress, amount: amount * Math.pow(10, CONTRACTS.rurc.decimals) }
            }
        });
        console.log(`Burned ${amount} RURC`);
        return true;
    } catch (error) {
        console.error('Ошибка burn:', error);
        return false;
    }
}

async function burnWithUI(amount, onSuccess, onError) {
    try {
        showNotification('🔥 Сжигание токенов...', 'pending');
        const result = await burnRURC(amount);

        if (result) {
            showNotification(`🔥 Сожжено ${amount} RURC`, 'success');
            if (onSuccess) onSuccess();
        } else {
            showNotification('❌ Ошибка сжигания', 'error');
            if (onError) onError();
        }
        return result;
    } catch (error) {
        showNotification('❌ Ошибка: ' + error.message, 'error');
        if (onError) onError(error);
        return false;
    }
}

// ============ FREEZE ============
// Заморозка токенов (доступны только после разморозки)

async function freezeRURC(address, amount) {
    try {
        const sender = await window.ton.sender;

        const freezePayload = {
            method: 'freeze',
            params: {
                account: address,
                amount: amount * Math.pow(10, CONTRACTS.rurc.decimals)
            }
        };

        await sender.send({
            to: CONTRACTS.rurc.address,
            amount: 0,
            payload: freezePayload
        });

        // Локальное хранилище для демо
        if (!frozenBalances[address]) frozenBalances[address] = 0;
        frozenBalances[address] += amount;

        console.log(`Frozen ${amount} RURC for ${address}`);
        return true;
    } catch (error) {
        console.error('Ошибка freeze:', error);
        return false;
    }
}

// Заморозка своих токенов
async function freezeSelf(amount) {
    try {
        const walletAddress = await window.ton.getWalletAddress();
        return await freezeRURC(walletAddress, amount);
    } catch (error) {
        console.error('Ошибка freeze self:', error);
        return false;
    }
}

// Разморозка токенов
async function unfreezeRURC(address, amount) {
    try {
        const sender = await window.ton.sender;

        const unfreezePayload = {
            method: 'unfreeze',
            params: {
                account: address,
                amount: amount * Math.pow(10, CONTRACTS.rurc.decimals)
            }
        };

        await sender.send({
            to: CONTRACTS.rurc.address,
            amount: 0,
            payload: unfreezePayload
        });

        // Локальное хранилище
        if (frozenBalances[address]) {
            frozenBalances[address] = Math.max(0, frozenBalances[address] - amount);
        }

        console.log(`Unfrozen ${amount} RURC for ${address}`);
        return true;
    } catch (error) {
        console.error('Ошибка unfreeze:', error);
        return false;
    }
}

// Получить замороженный баланс
async function getFrozenBalance(address) {
    try {
        // Пробуем получить с контракта
        const result = await window.ton.provider.call(
            CONTRACTS.rurc.address,
            'frozenBalanceOf',
            { address: address }
        );
        return parseInt(result || 0) / Math.pow(10, CONTRACTS.rurc.decimals);
    } catch (error) {
        // Локальное хранилище для демо
        return frozenBalances[address] || 0;
    }
}

// Freeze с UI
async function freezeWithUI(amount, onSuccess, onError) {
    try {
        const walletAddress = await window.ton.getWalletAddress();

        // Проверка баланса
        const balance = await getRURCBalance(walletAddress);
        const frozen = await getFrozenBalance(walletAddress);
        const available = balance - frozen;

        if (amount > available) {
            showNotification('❌ Недостаточно доступных токенов', 'error');
            return false;
        }

        showNotification('❄️ Заморозка токенов...', 'pending');

        const result = await freezeRURC(walletAddress, amount);

        if (result) {
            showNotification(`❄️ Заморожено ${amount} RURC`, 'success');
            if (onSuccess) onSuccess();
        } else {
            showNotification('❌ Ошибка заморозки', 'error');
            if (onError) onError();
        }
        return result;
    } catch (error) {
        showNotification('❌ Ошибка: ' + error.message, 'error');
        if (onError) onError(error);
        return false;
    }
}

// Unfreeze с UI
async function unfreezeWithUI(amount, onSuccess, onError) {
    try {
        const walletAddress = await window.ton.getWalletAddress();

        showNotification('🔥 Разморозка токенов...', 'pending');

        const result = await unfreezeRURC(walletAddress, amount);

        if (result) {
            showNotification(`✅ Разморожено ${amount} RURC`, 'success');
            if (onSuccess) onSuccess();
        } else {
            showNotification('❌ Ошибка разморозки', 'error');
            if (onError) onError();
        }
        return result;
    } catch (error) {
        showNotification('❌ Ошибка: ' + error.message, 'error');
        if (onError) onError(error);
        return false;
    }
}

// ============ ОБЩИЕ ============
async function getTotalSupply() {
    try {
        const result = await window.ton.provider.call(
            CONTRACTS.rurc.address,
            'totalSupply'
        );
        return parseInt(result || 0) / Math.pow(10, CONTRACTS.rurc.decimals);
    } catch (error) {
        return 0;
    }
}

function renderContracts() {
    const container = document.getElementById('contractsList');
    if (!container) return;

    container.innerHTML = Object.entries(CONTRACTS).map(([key, contract]) => `
        <div class="contract-item">
            <div class="contract-name">${contract.name}</div>
            <div class="contract-desc">${contract.description}</div>
            <div class="contract-address">${contract.address.slice(0, 20)}...</div>
        </div>
    `).join('');
}

function renderMintUI() {
    const container = document.getElementById('mintSection');
    if (!container) return;

    container.innerHTML = `
        <div class="mint-panel">
            <h3>⛏️ Майнинг RURC</h3>
            <div class="mint-form">
                <input type="number" id="mintAmount" placeholder="Количество RURC" min="1" max="1000000">
                <button onclick="handleMint()">Майнить</button>
            </div>
        </div>

        <div class="burn-panel">
            <h3>🔥 Сжигание RURC</h3>
            <div class="burn-form">
                <input type="number" id="burnAmount" placeholder="Количество RURC" min="1" max="1000000">
                <button onclick="handleBurn()" class="burn-btn">Сжечь</button>
            </div>
        </div>

        <div class="freeze-panel">
            <h3>❄️ Заморозка RURC</h3>
            <div class="freeze-form">
                <input type="number" id="freezeAmount" placeholder="Количество RURC" min="1" max="1000000">
                <button onclick="handleFreeze()" class="freeze-btn">Заморозить</button>
            </div>
            <div class="freeze-form">
                <input type="number" id="unfreezeAmount" placeholder="Количество RURC" min="1" max="1000000">
                <button onclick="handleUnfreeze()" class="unfreeze-btn">Разморозить</button>
            </div>
            <div class="freeze-info">
                <p>💡 Замороженные токены недоступны для переводов</p>
                <p>🔒 Заморожено: <span id="frozenBalance">...</span> RURC</p>
            </div>
        </div>

        <div class="mint-info">
            <p>📊 Total Supply: <span id="totalSupply">...</span> RURC</p>
        </div>
    `;

    getTotalSupply().then(supply => {
        const el = document.getElementById('totalSupply');
        if (el) el.textContent = supply.toLocaleString();
    });

    // Загружаем замороженный баланс
    loadFrozenBalance();
}

async function loadFrozenBalance() {
    try {
        const walletAddress = await window.ton.getWalletAddress();
        const frozen = await getFrozenBalance(walletAddress);
        const el = document.getElementById('frozenBalance');
        if (el) el.textContent = frozen.toLocaleString();
    } catch (e) {}
}

async function handleMint() {
    const input = document.getElementById('mintAmount');
    const amount = parseFloat(input.value);

    if (!amount || amount <= 0) {
        showNotification('Введите корректное количество', 'error');
        return;
    }

    await mintWithUI(amount, () => updateBalance());
}

async function handleBurn() {
    const input = document.getElementById('burnAmount');
    const amount = parseFloat(input.value);

    if (!amount || amount <= 0) {
        showNotification('Введите корректное количество', 'error');
        return;
    }

    if (!confirm(`Вы уверены, что хотите сжечь ${amount} RURC?`)) {
        return;
    }

    await burnWithUI(amount, () => updateBalance());
}

async function handleFreeze() {
    const input = document.getElementById('freezeAmount');
    const amount = parseFloat(input.value);

    if (!amount || amount <= 0) {
        showNotification('Введите корректное количество', 'error');
        return;
    }

    await freezeWithUI(amount, () => {
        updateBalance();
        loadFrozenBalance();
    });
}

async function handleUnfreeze() {
    const input = document.getElementById('unfreezeAmount');
    const amount = parseFloat(input.value);

    if (!amount || amount <= 0) {
        showNotification('Введите корректное количество', 'error');
        return;
    }

    await unfreezeWithUI(amount, () => {
        updateBalance();
        loadFrozenBalance();
    });
}

function showNotification(message, type) {
    const container = document.getElementById('notifications');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    container.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}

// Экспорт
window.RURC_CONTRACTS = CONTRACTS;
window.RURC_ABI = RURC_ABI;
window.initContracts = initContracts;
window.getRURCBalance = getRURCBalance;
window.transferRURC = transferRURC;
window.mintRURC = mintRURC;
window.mintToSelf = mintToSelf;
window.mintWithUI = mintWithUI;
window.burnRURC = burnRURC;
window.burnToAddress = burnToAddress;
window.burnWithUI = burnWithUI;
window.freezeRURC = freezeRURC;
window.freezeSelf = freezeSelf;
window.unfreezeRURC = unfreezeRURC;
window.getFrozenBalance = getFrozenBalance;
window.freezeWithUI = freezeWithUI;
window.unfreezeWithUI = unfreezeWithUI;
window.getTotalSupply = getTotalSupply;
window.renderContracts = renderContracts;
window.renderMintUI = renderMintUI;
