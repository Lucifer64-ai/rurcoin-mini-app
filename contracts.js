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

// ABI контракта (упрощённый)
const RURC_ABI = {
    // Баланс
    balanceOf: "balanceOf(address):uint256",
    // Перевод
    transfer: "transfer(address,uint256)",
    // approve
    approve: "approve(address,uint256)",
    // allowance
    allowance: "allowance(address,address):uint256",
    // totalSupply
    totalSupply: "totalSupply():uint256"
};

// Инициализация контрактов
async function initContracts() {
    if (typeof window.ethereum === 'undefined') {
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

// Экспорт
window.RURC_CONTRACTS = CONTRACTS;
window.RURC_ABI = RURC_ABI;
window.initContracts = initContracts;
window.getRURCBalance = getRURCBalance;
window.transferRURC = transferRURC;
window.renderContracts = renderContracts;
