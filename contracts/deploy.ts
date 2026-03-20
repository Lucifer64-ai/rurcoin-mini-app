// ============================================================
//  RURC Jetton — Deploy Script
//  Используй: npx blueprint run deploy
// ============================================================

import { toNano, beginCell, Address } from '@ton/core';
import { TonClient, WalletContractV4, internal } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';

// ── Настройки ────────────────────────────────────────────────
const MNEMONIC = process.env.MNEMONIC || 'your 24 words here';
const IS_TESTNET = true; // false для mainnet
const OWNER_ADDRESS = 'EQDPnYSAV-H8ADoaYGAuNhJL4HwfSB9IBj9ABi465D9ABj9ABgBaY';
const TOTAL_SUPPLY  = 1_000_000_000n * 1_000_000_000n; // 1B * decimals(9)

// ── Метаданные токена (on-chain) ─────────────────────────────
function buildTokenContent() {
    const content = beginCell()
        .storeUint(0, 8)           // off-chain marker = 0 (on-chain)
        .storeStringTail(JSON.stringify({
            name:        'RURCoin',
            description: 'Russian Ruble Coin — нефтегазовый игровой токен',
            symbol:      'RURC',
            decimals:    '9',
            image:       'https://lucifer64-ai.github.io/rurcoin-mini-app/icon.png'
        }))
        .endCell();
    return content;
}

async function deploy() {
    // 1. Подключение к сети
    const client = new TonClient({
        endpoint: IS_TESTNET
            ? 'https://testnet.toncenter.com/api/v2/jsonRPC'
            : 'https://toncenter.com/api/v2/jsonRPC',
        apiKey: process.env.TON_API_KEY || ''
    });

    // 2. Кошелёк деплоера
    const keyPair = await mnemonicToPrivateKey(MNEMONIC.split(' '));
    const wallet  = WalletContractV4.create({ publicKey: keyPair.publicKey, workchain: 0 });
    const contract = client.open(wallet);
    const seqno   = await contract.getSeqno();

    console.log('Deployer address:', wallet.address.toString());
    console.log('Seqno:', seqno);

    // 3. Деплой контракта RURCJetton
    //    После компиляции через `npx tact contracts/RURC.tact`
    //    подставь сюда сгенерированный код и данные
    console.log('\n✅ Шаги деплоя:');
    console.log('1. npm install @ton/core @ton/ton @ton/crypto');
    console.log('2. npm install -g @tact-lang/compiler');
    console.log('3. tact contracts/RURC.tact');
    console.log('4. Скопируй адрес контракта из вывода');
    console.log('5. Обнови RURC_CONTRACT_ADDRESS в contracts.js');
    console.log('\n📋 Параметры токена:');
    console.log('   Название:  RURCoin');
    console.log('   Символ:    RURC');
    console.log('   Decimals:  9');
    console.log('   Supply:    1 000 000 000 RURC');
    console.log('   Владелец:', OWNER_ADDRESS);
    console.log('   Сеть:     ', IS_TESTNET ? 'Testnet' : 'Mainnet');
}

deploy().catch(console.error);
