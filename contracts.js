// Смарт-контракты RURCoin
const CONTRACTS = {
    // Основной токен RURC
    rurc: {
        name: "RURCoin",
        address: "EQDPnYSAV-H8ADoaYGAuNhJL4HwfSB9IBj9ABi465D9ABj9ABgBaY",
        decimals: 9,
        symbol: "RURC",
        description: "Российская криптовалюта на блокчейне TON"
    },

    // Стейкинг контракт
    staking: {
        name: "RURCoin Staking",
        address: "EQDPnYSAV-H8ADoaYGAuNhJL4HwfSB9IBj9ABi465D9ABj9ABgBaY",
        apy: 15,
        description: "Контракт для стейкинга RURC с начислением 15% годовых"
    },

    // Фабрика ферм
    farmFactory: {
        name: "Farm Factory",
        address: "EQDPnYSAV-H8ADoaYGAuNhJL4HwfSB9IBj9ABi465D9ABj9ABgBaY",
        description: "Создание и управление майнинг-фермами"
    }
};

// ABI контракта
const RURC_ABI = {
    balanceOf: "balanceOf(address):uint256",
    transfer: "transfer(address,uint256)",
    approve: "approve(address,uint256)",
    allowance: "allowance(address,address):uint256",
    totalSupply: "totalSupply():uint256",
    mint: "mint(address,uint256)",
    burn: "burn(uint256)"
};

// Инициализация контрактов
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

// Получить баланс RURC
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

// Перевод RURC
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

// ============ MINT ФУНКЦИЯ ============
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
        console.error('Mint error:', error);
        showNotification('❌ Ошибка: ' + error.message, 'error');
        if (onError) onError(error);
        return false;
    }
}

// ============ BURN ФУНКЦИЯ ============
// Сжигание токенов (уменьшает totalSupply)

async function burnRURC(amount) {
    try {
        const sender = await window.ton.sender;

        // Сначала approve контракту на сжигание
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

// Сжигание со своего кошелька через transfer на burn адрес
async function burnToAddress(amount, burnAddress = "0x0000000000000000000000000000000000000000") {
    try {
        // Стандартный способ burn - отправить на нулевой адрес
        const sender = await window.ton.sender;

        await sender.send({
            to: CONTRACTS.rurc.address,
            amount: amount * Math.pow(10, CONTRACTS.rurc.decimals),
            payload: {
                method: 'transfer',
                params: { 
                    to: burnAddress, 
                    amount: amount * Math.pow(10, CONTRACTS.rurc.decimals) 
                }
            }
        });

        console.log(`Burned ${amount} RURC (sent to burn address)`);
        return true;
    } catch (error) {
        console.error('Ошибка burn:', error);
        return false;
    }
}

// Burn с UI уведомлением
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
        console.error('Burn error:', error);
        showNotification('❌ Ошибка: ' + error.message, 'error');
        if (onError) onError(error);
        return false;
    }
}

// ============ ОБЩИЕ ФУНКЦИИ ============
async function getTotalSupply() {
    try {
        const result = await window.ton.provider.call(
            CONTRACTS.rurc.address,
            'totalSupply'
        );
        return parseInt(result || 0) / Math.pow(10, CONTRACTS.rurc.decimals);
    } catch (error) {
        console.error('Ошибка получения totalSupply:', error);
        return 0;
    }
}

// Отобразить контракты в UI
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

// UI для майнинга и сжигания
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
            <div class="burn-info">
                <p>⚠️ Внимание: сожжённые токены нельзя восстановить</p>
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
}

async function handleMint() {
    const input = document.getElementById('mintAmount');
    const amount = parseFloat(input.value);

    if (!amount || amount <= 0) {
        showNotification('Введите корректное количество', 'error');
        return;
    }

    await mintWithUI(amount, () => {
        updateBalance();
    });
}

async function handleBurn() {
    const input = document.getElementById('burnAmount');
    const amount = parseFloat(input.value);

    if (!amount || amount <= 0) {
        showNotification('Введите корректное количество', 'error');
        return;
    }

    // Подтверждение
    if (!confirm(`Вы уверены, что хотите сжечь ${amount} RURC?`)) {
        return;
    }

    await burnWithUI(amount, () => {
        updateBalance();
    });
}

function showNotification(message, type) {
    const container = document.getElementById('notifications');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    container.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 5000);
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
window.getTotalSupply = getTotalSupply;
window.renderContracts = renderContracts;
window.renderMintUI = renderMintUI;
