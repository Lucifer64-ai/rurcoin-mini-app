// Управление смарт-контрактами RURCoin
class RURCoinContracts {
    constructor() {
        this.contracts = {
            main: 'EQD3dus1qIQq0xem1AvYv0IliQrCxP935TgWJwcbovfrBrYF',
            treasury: 'UQAfEl3NlWxvs9pNcuszZeBa5sSGfgrfCFsmp9kc-_ZGy-xF',
            liquidity: 'EQA9z4hQ9eWv-1eSgm3NJu1meb5QLJAoTjROMlBZBM15a7Z_'
        };
        
        this.apiKey = 'AHVHQCBZEV2TA6IAAAAJHMD6BQFJMEKBTA6WY3STOQMD5ZAPNOSYAM7ETRGBDN7S7JYYQZI';
    }

    async getContractBalance(address) {
        try {
            const response = await fetch(`https://tonapi.io/v2/accounts/${address}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return this.nanoToTon(data.balance);
            }
        } catch (error) {
            console.error('Ошибка получения баланса:', error);
            return 0;
        }
    }

    nanoToTon(nano) {
        return (nano / 1000000000).toFixed(2);
    }

    async verifyContracts() {
        const balances = {};
        
        for (const [name, address] of Object.entries(this.contracts)) {
            balances[name] = await this.getContractBalance(address);
        }
        
        return balances;
    }
}

// Инициализация менеджера контрактов
window.contractManager = new RURCoinContracts();