// ============================================================
//  RURCoin MultiWallet — поддержка TON, ETH, BTC, SOL, BNB, TRX
//  Адрес кошелька = уникальный ID игрока
// ============================================================

const MULTI_WALLET_CONFIG = {
    // Поддерживаемые сети
    networks: {
        TON: {
            name: 'TON',
            icon: '💎',
            color: '#0088CC',
            prefix: ['EQ', 'UQ', '0:'],
            explorer: 'https://tonscan.org/address/',
            apiBase: 'https://tonapi.io/v2',
            decimals: 9
        },
        ETH: {
            name: 'Ethereum',
            icon: '⟠',
            color: '#627EEA',
            prefix: ['0x'],
            explorer: 'https://etherscan.io/address/',
            apiBase: 'https://api.etherscan.io/api',
            decimals: 18
        },
        BTC: {
            name: 'Bitcoin',
            icon: '₿',
            color: '#F7931A',
            prefix: ['1', '3', 'bc1'],
            explorer: 'https://blockstream.info/address/',
            apiBase: 'https://blockstream.info/api',
            decimals: 8
        },
        SOL: {
            name: 'Solana',
            icon: '◎',
            color: '#9945FF',
            prefix: [],
            explorer: 'https://solscan.io/account/',
            apiBase: 'https://api.mainnet-beta.solana.com',
            decimals: 9
        },
        BNB: {
            name: 'BNB Chain',
            icon: '🟡',
            color: '#F3BA2F',
            prefix: ['0x'],
            explorer: 'https://bscscan.com/address/',
            apiBase: 'https://api.bscscan.com/api',
            decimals: 18
        },
        DOT: {
            name: 'Polkadot',
            icon: '⚫',
            color: '#E6007A',
            prefix: ['1', '5'],
            explorer: 'https://polkadot.subscan.io/account/',
            apiBase: 'https://polkadot.api.subscan.io',
            decimals: 10
        },
        XRP: {
            name: 'Ripple (XRP)',
            icon: '🔷',
            color: '#346AA9',
            prefix: ['r'],
            explorer: 'https://xrpscan.com/account/',
            apiBase: 'https://xrplcluster.com',
            decimals: 6
        },
        TRX: {
            name: 'TRON',
            icon: '🔴',
            color: '#FF0013',
            prefix: ['T'],
            explorer: 'https://tronscan.org/#/address/',
            decimals: 6
        }
    },

    // Кошельки для подключения
    walletApps: [
        { id: 'telegram',    name: 'Telegram Wallet', icon: '✈️', networks: ['TON'],             type: 'tonconnect',
          universalLink: 'https://t.me/wallet',
          deeplink: 'https://t.me/wallet' },
        { id: 'tonkeeper',   name: 'Tonkeeper',       icon: '💎', networks: ['TON'],             type: 'tonconnect',
          universalLink: 'https://app.tonkeeper.com/ton-connect',
          deeplink: 'tonkeeper://ton-connect' },
        { id: 'mytonwallet', name: 'MyTonWallet',     icon: '💙', networks: ['TON'],             type: 'tonconnect',
          universalLink: 'https://mytonwallet.io/ton-connect',
          deeplink: 'mytonwallet://ton-connect' },
        { id: 'metamask',    name: 'MetaMask',        icon: '🦊', networks: ['ETH','BNB'],       type: 'injected',   key: 'ethereum',                deeplink: 'https://metamask.app.link/dapp/' + window.location.host + window.location.pathname },
        { id: 'phantom',     name: 'Phantom',         icon: '👻', networks: ['SOL','ETH'],       type: 'injected',   key: 'phantom',                 deeplink: 'https://phantom.app/ul/browse/' + encodeURIComponent(window.location.href) + '?ref=' + encodeURIComponent(window.location.origin) },
        { id: 'trustwallet', name: 'Trust Wallet',    icon: '🛡️', networks: ['ETH','BNB','BTC'], type: 'injected',   key: 'trustwallet',             deeplink: 'https://link.trustwallet.com/open_url?coin_id=60&url=' + encodeURIComponent(window.location.href) },
        { id: 'coinbase',    name: 'Coinbase Wallet', icon: '🔵', networks: ['ETH','SOL','BTC'], type: 'injected',   key: 'coinbaseWalletExtension', deeplink: 'https://go.cb-w.com/dapp?cb_url=' + encodeURIComponent(window.location.href) },
        { id: 'okx',         name: 'OKX Wallet',      icon: '⚫', networks: ['ETH','BNB','BTC','SOL','TON'], type: 'injected', key: 'okxwallet', deeplink: 'okx://wallet/dapp/url?dappUrl=' + encodeURIComponent(window.location.href) },
        { id: 'polkadotjs',  name: 'Polkadot.js',     icon: '⚫', networks: ['DOT'],             type: 'polkadotjs' },
        { id: 'talisman',    name: 'Talisman',        icon: '🔮', networks: ['DOT'],             type: 'polkadotjs' },
        { id: 'subwallet',   name: 'SubWallet',       icon: '🟣', networks: ['DOT'],             type: 'polkadotjs', deeplink: 'subwallet://browser?url=' + encodeURIComponent(window.location.href) },
        { id: 'xumm',        name: 'Xaman (XUMM)',    icon: '🔷', networks: ['XRP'],             type: 'xumm',       deeplink: 'https://xumm.app' },
        { id: 'manual',      name: 'Ввести адрес',    icon: '✍️', networks: ['TON','ETH','BTC','SOL','BNB','TRX','XRP','DOT'], type: 'manual' }
    ]
};

// ============================================================
//  Состояние
// ============================================================
const multiWalletState = {
    connected: false,
    network: null,       // 'TON' | 'ETH' | 'BTC' | 'SOL' | 'BNB' | 'TRX'
    address: null,
    shortAddress: null,
    walletApp: null,
    balance: null,
    playerId: null       // = address (уникальный ID игрока)
};

// ============================================================
//  Определить сеть по адресу
// ============================================================
function detectNetwork(address) {
    if (!address) return null;
    const addr = address.trim();

    if (/^(EQ|UQ)[A-Za-z0-9_\-]{46,}/.test(addr) || addr.startsWith('0:')) return 'TON';
    if (/^0x[a-fA-F0-9]{40}$/.test(addr)) return 'ETH'; // ETH/BNB — одинаковый формат
    if (/^(1|3)[A-Za-z0-9]{25,34}$/.test(addr) || /^bc1[a-z0-9]{39,59}$/.test(addr)) return 'BTC';
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr)) return 'SOL';
    if (/^T[A-Za-z0-9]{33}$/.test(addr)) return 'TRX';
    if (/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(addr)) return 'XRP';
    if (/^1[A-Za-z0-9]{46,47}$/.test(addr) || /^5[A-Za-z0-9]{47}$/.test(addr)) return 'DOT';

    return null;
}

// ============================================================
//  Подключение MetaMask / EVM-кошельков
// ============================================================
async function connectEVM(walletKey, networkId) {
    const provider = window[walletKey] || window.ethereum;
    if (!provider) {
        showWalletMsg(`❌ ${walletKey} не найден. Установи расширение.`, 'error');
        return;
    }

    try {
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts[0]) {
            const address = accounts[0];
            const network = networkId || (walletKey === 'trustwallet' ? 'BNB' : 'ETH');
            onMultiWalletConnected(address, network, walletKey);
        }
    } catch (e) {
        showWalletMsg('❌ Отклонено пользователем', 'error');
    }
}

// ============================================================
//  Подключение Phantom (Solana)
// ============================================================
async function connectPhantom() {
    const phantom = window.phantom?.solana || window.solana;
    if (!phantom) {
        showWalletMsg('❌ Phantom не найден. Установи расширение.', 'error');
        return;
    }

    try {
        const resp = await phantom.connect();
        const address = resp.publicKey.toString();
        onMultiWalletConnected(address, 'SOL', 'phantom');
    } catch (e) {
        showWalletMsg('❌ Phantom: ' + e.message, 'error');
    }
}

// ============================================================
//  Подключение TON Connect (Tonkeeper / MyTonWallet)
// ============================================================
async function connectTONWallet(walletId) {
    const appCfg = MULTI_WALLET_CONFIG.walletApps.find(w => w.id === walletId);
    const manifestUrl = 'https://lucifer64-ai.github.io/rurcoin-mini-app/tonconnect-manifest.json';

    // --- Telegram Wallet (встроенный в Telegram) ---
    if (walletId === 'telegram') {
        // Если открыто внутри Telegram WebApp — используем TON Connect через Telegram
        if (window.Telegram?.WebApp) {
            try {
                if (window.TONConnect) {
                    const connector = new TONConnect.TonConnect({ manifestUrl });
                    const wallets = await connector.getWallets();
                    const tgWallet = wallets.find(w =>
                        w.appName === 'telegram-wallet' ||
                        w.name?.toLowerCase().includes('telegram')
                    );
                    if (tgWallet) {
                        const link = connector.connect({
                            universalLink: tgWallet.universalLink,
                            bridgeUrl: tgWallet.bridgeUrl
                        });
                        // Открываем Telegram Wallet прямо в Telegram
                        window.Telegram.WebApp.openTelegramLink(tgWallet.universalLink || 'https://t.me/wallet');
                        connector.onStatusChange((w) => {
                            if (w) {
                                onMultiWalletConnected(w.account.address, 'TON', 'Telegram Wallet');
                                closeTONQRModal();
                            }
                        });
                        showWalletMsg('📲 Открываем Telegram Wallet...', 'info');
                        return;
                    }
                }
            } catch (e) {
                console.warn('Telegram Wallet TON Connect error:', e);
            }
        }
        // Fallback — открываем t.me/wallet с deeplink
        showTONConnectQR('https://t.me/wallet', 'Telegram Wallet', '✈️', true);
        return;
    }

    // --- TON Connect 2.0 для Tonkeeper / MyTonWallet ---
    if (window.TONConnect) {
        try {
            const connector = new TONConnect.TonConnect({ manifestUrl });
            const wallets = await connector.getWallets();

            // Ищем по appName или имени
            const searchKey = walletId === 'mytonwallet' ? 'mytonwallet' : walletId;
            const wallet = wallets.find(w =>
                w.appName?.toLowerCase() === searchKey ||
                w.name?.toLowerCase().includes(searchKey.replace('my', ''))
            );

            if (wallet && wallet.universalLink) {
                const link = connector.connect({
                    universalLink: wallet.universalLink,
                    bridgeUrl: wallet.bridgeUrl
                });

                const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
                if (isMobile && wallet.universalLink) {
                    // На мобильном — сразу открываем приложение
                    showTONConnectQR(link, wallet.name, appCfg?.icon || '💎', false, link);
                } else {
                    // На десктопе — QR-код
                    showTONConnectQR(link, wallet.name, appCfg?.icon || '💎', false);
                }

                connector.onStatusChange((w) => {
                    if (w) {
                        onMultiWalletConnected(w.account.address, 'TON', wallet.name);
                        closeTONQRModal();
                    }
                });
                return;
            }
        } catch (e) {
            console.warn('TON Connect error:', e);
        }
    }

    // Fallback — deeplink напрямую
    if (appCfg?.deeplink) {
        showTONConnectQR(link || appCfg.deeplink, appCfg.name, appCfg.icon || '💎', false, link || appCfg.deeplink);
    } else {
        showWalletMsg('💡 Введи TON-адрес вручную ниже', 'info');
    }
}

// ============================================================
//  Ручной ввод адреса
// ============================================================
function connectManualAddress() {
    const input = document.getElementById('manualAddrInput');
    if (!input) return;

    const address = input.value.trim();
    if (!address) {
        showWalletMsg('❌ Введи адрес', 'error');
        return;
    }

    const network = detectNetwork(address);
    if (!network) {
        showWalletMsg('❌ Неизвестный формат адреса. Поддерживаются: TON, ETH, BTC, SOL, BNB, TRX', 'error');
        return;
    }

    onMultiWalletConnected(address, network, 'manual');
}

// ============================================================
//  Универсальный обработчик подключения
// ============================================================
function onMultiWalletConnected(address, network, walletApp) {
    multiWalletState.connected = true;
    multiWalletState.address = address;
    multiWalletState.network = network;
    multiWalletState.shortAddress = shortenAddr(address);
    multiWalletState.walletApp = walletApp;
    multiWalletState.playerId = address; // ID игрока = адрес

    saveMultiWalletData();
    renderMultiWalletUI();
    loadMultiBalance(address, network);
    loadPlayerProgress(address);

    // Регистрируем игрока в глобальной статистике
    if (window.registerPlayer) {
        const isNew = registerPlayer(address, network);
        if (!isNew) {
            console.log('[Wallet] Игрок уже зарегистрирован:', address.slice(0,8) + '...');
        }
    }

    showWalletMsg(`✅ ${MULTI_WALLET_CONFIG.networks[network].name} подключён!`, 'success');
    updateHeaderWallet();
}

// ============================================================
//  Загрузка баланса по сети
// ============================================================
async function loadMultiBalance(address, network) {
    try {
        let balance = '...';

        if (network === 'TON') {
            try {
                // Пробуем toncenter (без ключа, публичный)
                const r = await fetch(`https://toncenter.com/api/v2/getAddressBalance?address=${address}`);
                const d = await r.json();
                if (d.ok && d.result !== undefined) {
                    balance = (parseInt(d.result) / 1e9).toFixed(4) + ' TON';
                } else {
                    throw new Error('toncenter failed');
                }
            } catch(e1) {
                try {
                    // Fallback: tonapi без ключа
                    const r2 = await fetch(`https://tonapi.io/v2/accounts/${address}`);
                    const d2 = await r2.json();
                    if (d2.balance) balance = (parseInt(d2.balance) / 1e9).toFixed(4) + ' TON';
                } catch(e2) {
                    balance = 'Ошибка загрузки';
                }
            }

        } else if (network === 'ETH' || network === 'BNB') {
            // Используем публичный RPC
            const rpc = network === 'ETH'
                ? 'https://eth.llamarpc.com'
                : 'https://bsc-dataseed.binance.org/';
            const r = await fetch(rpc, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jsonrpc:'2.0', method:'eth_getBalance', params:[address,'latest'], id:1 })
            });
            const d = await r.json();
            if (d.result) {
                const wei = parseInt(d.result, 16);
                balance = (wei / 1e18).toFixed(6) + (network === 'ETH' ? ' ETH' : ' BNB');
            }

        } else if (network === 'BTC') {
            const r = await fetch(`https://blockstream.info/api/address/${address}`);
            const d = await r.json();
            if (d.chain_stats) {
                const sat = d.chain_stats.funded_txo_sum - d.chain_stats.spent_txo_sum;
                balance = (sat / 1e8).toFixed(8) + ' BTC';
            }

        } else if (network === 'SOL') {
            const r = await fetch('https://api.mainnet-beta.solana.com', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jsonrpc:'2.0', id:1, method:'getBalance', params:[address] })
            });
            const d = await r.json();
            if (d.result) balance = (d.result.value / 1e9).toFixed(4) + ' SOL';


        } else if (network === 'DOT') {
            try {
                // Subscan публичный API
                const r = await fetch('https://polkadot.api.subscan.io/api/v2/scan/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-API-Key': 'anonymous' },
                    body: JSON.stringify({ key: address })
                });
                const d = await r.json();
                if (d.data && d.data.account) {
                    const planck = parseInt(d.data.account.balance || 0);
                    balance = (planck / 1e10).toFixed(4) + ' DOT';
                } else {
                    // Fallback: Polkadot RPC
                    const r2 = await fetch('https://rpc.polkadot.io', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            jsonrpc: '2.0', id: 1,
                            method: 'system_accountNextIndex',
                            params: [address]
                        })
                    });
                    balance = 'DOT (подключён)';
                }
            } catch(e2) {
                balance = 'Ошибка загрузки';
            }
        } else if (network === 'XRP') {
            try {
                // XRPL публичный API
                const r = await fetch('https://xrplcluster.com', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        method: 'account_info',
                        params: [{ account: address, ledger_index: 'current' }]
                    })
                });
                const d = await r.json();
                if (d.result && d.result.account_data) {
                    const drops = parseInt(d.result.account_data.Balance);
                    balance = (drops / 1e6).toFixed(4) + ' XRP';
                } else {
                    // Fallback: xrpscan API
                    const r2 = await fetch(`https://api.xrpscan.com/api/v1/account/${address}`);
                    const d2 = await r2.json();
                    if (d2.xrpBalance) balance = parseFloat(d2.xrpBalance).toFixed(4) + ' XRP';
                }
            } catch(e2) {
                balance = 'Ошибка загрузки';
            }
        } else if (network === 'TRX') {
            const r = await fetch(`https://apilist.tronscan.org/api/account?address=${address}`);
            const d = await r.json();
            if (d.balance !== undefined) balance = (d.balance / 1e6).toFixed(4) + ' TRX';
        }

        multiWalletState.balance = balance;
        const el = document.getElementById('mwBalance');
        if (el) el.textContent = balance;

    } catch (e) {
        console.warn('Balance error:', e);
        const el = document.getElementById('mwBalance');
        if (el) el.textContent = 'Ошибка загрузки';
    }
}

// ============================================================
//  Прогресс игрока по адресу
// ============================================================
function loadPlayerProgress(address) {
    const key = 'rurcoin_player_' + address;
    const saved = localStorage.getItem(key);
    if (saved && window.rurcoinApp) {
        const data = JSON.parse(saved);
        Object.assign(window.rurcoinApp, data);
        window.rurcoinApp.render();
        showWalletMsg('📂 Прогресс загружен!', 'success');
    }
}

function savePlayerProgress() {
    if (!multiWalletState.address || !window.rurcoinApp) return;
    const key = 'rurcoin_player_' + multiWalletState.address;
    const app = window.rurcoinApp;
    localStorage.setItem(key, JSON.stringify({
        balance: app.balance,
        tonBalance: app.tonBalance,
        stakedBalance: app.stakedBalance,
        stakingRewards: app.stakingRewards,
        totalMined: app.totalMined,
        oilPumps: app.oilPumps,
        gasTowers: app.gasTowers,
        oilTanks: app.oilTanks,
        gasTanks: app.gasTanks,
        oilStored: app.oilStored,
        gasStored: app.gasStored,
        oilCapacity: app.oilCapacity,
        gasCapacity: app.gasCapacity,
        lastSaved: Date.now()
    }));
}

setInterval(savePlayerProgress, 10000);

// ============================================================
//  Отключить кошелёк
// ============================================================
function disconnectMultiWallet() {
    multiWalletState.connected = false;
    multiWalletState.address = null;
    multiWalletState.network = null;
    multiWalletState.shortAddress = null;
    multiWalletState.balance = null;
    multiWalletState.playerId = null;
    localStorage.removeItem('rurcoin_mwallet');
    renderMultiWalletUI();
    updateHeaderWallet();
}

// ============================================================
//  Сохранение / загрузка
// ============================================================
function saveMultiWalletData() {
    localStorage.setItem('rurcoin_mwallet', JSON.stringify({
        address: multiWalletState.address,
        network: multiWalletState.network,
        shortAddress: multiWalletState.shortAddress,
        walletApp: multiWalletState.walletApp
    }));
}

function loadSavedMultiWallet() {
    const s = localStorage.getItem('rurcoin_mwallet');
    if (!s) return false;
    const d = JSON.parse(s);
    Object.assign(multiWalletState, d, { connected: true, playerId: d.address });
    return true;
}

// ============================================================
//  Рендер UI
// ============================================================
function renderMultiWalletUI() {
    const section = document.getElementById('walletSection');
    if (!section) return;

    if (multiWalletState.connected) {
        const net = MULTI_WALLET_CONFIG.networks[multiWalletState.network];
        section.innerHTML = `
            <!-- Подключённый кошелёк -->
            <div style="background:linear-gradient(135deg,#0a1a0a,#0d2d0d);border:1px solid #4ade80;border-radius:14px;padding:16px;margin-bottom:12px;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="font-size:36px;">${net.icon}</div>
                    <div style="flex:1;">
                        <div style="font-size:14px;font-weight:700;color:#4ade80;">${net.name}</div>
                        <div style="font-size:12px;color:#aaa;font-family:monospace;margin-top:4px;cursor:pointer;"
                             onclick="copyMWAddress()" title="Скопировать">
                            ${multiWalletState.shortAddress} 📋
                        </div>
                        <div style="font-size:10px;color:#555;margin-top:3px;">🆔 ID игрока</div>
                    </div>
                    <button onclick="disconnectMultiWallet()" style="background:#333;border:none;border-radius:8px;color:#f44;padding:8px 12px;font-size:12px;cursor:pointer;">
                        Выйти
                    </button>
                </div>
            </div>

            <!-- Баланс -->
            <div style="background:#111122;border:1px solid #222;border-radius:12px;padding:14px;margin-bottom:12px;">
                <div style="font-size:11px;color:#555;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Баланс</div>
                <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #1a1a2e;">
                    <span style="font-size:20px;">${net.icon}</span>
                    <span style="font-size:14px;font-weight:600;color:#FF8C00;" id="mwBalance">Загрузка...</span>
                </div>
                <div style="display:flex;align-items:center;gap:10px;padding:8px 0;">
                    <span style="font-size:20px;">🛢️</span>
                    <span style="font-size:14px;font-weight:600;color:#FF8C00;">
                        ${window.rurcoinApp ? window.rurcoinApp.balance.toFixed(2) : '0.00'} RURC
                    </span>
                </div>
            </div>

            <!-- Полный адрес -->
            <div style="background:#111122;border:1px solid #222;border-radius:12px;padding:14px;margin-bottom:12px;">
                <div style="font-size:11px;color:#555;margin-bottom:8px;">Полный адрес</div>
                <div style="font-size:11px;color:#aaa;font-family:monospace;word-break:break-all;line-height:1.6;">
                    ${multiWalletState.address}
                </div>
                <button onclick="copyMWAddress()" style="margin-top:10px;width:100%;padding:10px;background:#222;border:none;border-radius:8px;color:#fff;font-size:13px;cursor:pointer;">
                    📋 Скопировать адрес
                </button>
                <a href="${net.explorer}${multiWalletState.address}" target="_blank"
                   style="display:block;margin-top:8px;padding:10px;background:#1a1a33;border:none;border-radius:8px;color:#888;font-size:13px;text-align:center;text-decoration:none;">
                    🔍 Открыть в Explorer
                </a>
            </div>
        `;

        // Загрузить баланс
        loadMultiBalance(multiWalletState.address, multiWalletState.network);

    } else {
        // Экран подключения
        section.innerHTML = `
            <div style="text-align:center;padding:10px 0 20px;">
                <div style="font-size:48px;margin-bottom:12px;">🔗</div>
                <div style="font-size:16px;font-weight:700;margin-bottom:8px;">Подключи кошелёк</div>
                <div style="font-size:13px;color:#888;margin-bottom:20px;">
                    Твой адрес = ID игрока.<br>Прогресс сохраняется навсегда.
                </div>
            </div>

            <!-- Выбор сети -->
            <div style="font-size:11px;color:#555;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Выбери сеть</div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:20px;">
                ${Object.entries(MULTI_WALLET_CONFIG.networks).map(([id, net]) => `
                    <button onclick="selectNetwork('${id}')" id="netBtn_${id}"
                        style="padding:10px 6px;background:#111122;border:1px solid #333;border-radius:10px;
                               color:#fff;font-size:12px;cursor:pointer;display:flex;flex-direction:column;
                               align-items:center;gap:4px;">
                        <span style="font-size:20px;">${net.icon}</span>
                        <span>${net.name}</span>
                    </button>
                `).join('')}
            </div>

            <!-- Кошельки -->
            <div style="font-size:11px;color:#555;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Кошельки</div>
            <div id="walletAppsList" style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px;">
                ${renderWalletApps(null)}
            </div>

            <!-- Ручной ввод -->
            <div style="font-size:11px;color:#555;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Или введи адрес вручную</div>
            <input type="text" id="manualAddrInput"
                   placeholder="TON: EQ...  |  ETH: 0x...  |  BTC: 1...  |  SOL: ...  |  TRX: T..."
                   style="width:100%;padding:12px;background:#0d0d1a;border:1px solid #333;
                          border-radius:8px;color:#fff;font-size:12px;margin-bottom:10px;">
            <button onclick="connectManualAddress()"
                    style="width:100%;padding:12px;background:linear-gradient(135deg,#FF8C00,#FF6000);
                           border:none;border-radius:10px;color:#fff;font-size:14px;font-weight:700;cursor:pointer;">
                🔗 Привязать адрес
            </button>
        `;
    }
}

function renderWalletApps(selectedNetwork) {
    return MULTI_WALLET_CONFIG.walletApps
        .filter(w => !selectedNetwork || w.networks.includes(selectedNetwork))
        .map(w => `
            <button onclick="handleWalletConnect('${w.id}')"
                style="display:flex;align-items:center;gap:10px;padding:12px 14px;
                       background:#111122;border:1px solid #333;border-radius:10px;
                       color:#fff;font-size:14px;font-weight:600;cursor:pointer;width:100%;">
                <span style="font-size:22px;">${w.icon}</span>
                <div style="flex:1;text-align:left;">
                    <div>${w.name}</div>
                    <div style="font-size:10px;color:#555;">${w.networks.join(' · ')}</div>
                </div>
                <span style="color:#555;font-size:12px;">→</span>
            </button>
        `).join('');
}

function selectNetwork(networkId) {
    // Подсветить выбранную сеть
    document.querySelectorAll('[id^="netBtn_"]').forEach(b => {
        b.style.borderColor = '#333';
        b.style.color = '#fff';
    });
    const btn = document.getElementById('netBtn_' + networkId);
    if (btn) {
        const net = MULTI_WALLET_CONFIG.networks[networkId];
        btn.style.borderColor = net.color;
        btn.style.color = net.color;
    }

    // Обновить список кошельков
    const list = document.getElementById('walletAppsList');
    if (list) list.innerHTML = renderWalletApps(networkId);
}



// ============================================================
//  Подключение Polkadot.js / Talisman / SubWallet
// ============================================================
async function connectPolkadotJS(walletId) {
    // Проверяем наличие расширения
    const injected = window.injectedWeb3;

    if (!injected || Object.keys(injected).length === 0) {
        showWalletMsg('❌ Polkadot-кошелёк не найден. Установи Polkadot.js, Talisman или SubWallet.', 'error');
        // Показываем ссылки на установку
        const container = document.getElementById('walletMsg');
        if (container) {
            setTimeout(() => {
                container.innerHTML = `
                    <div style="font-size:12px;line-height:1.8;">
                        Установи кошелёк:<br>
                        <a href="https://polkadot.js.org/extension/" target="_blank" style="color:#E6007A;">⚫ Polkadot.js</a> &nbsp;|&nbsp;
                        <a href="https://talisman.xyz/" target="_blank" style="color:#E6007A;">🔮 Talisman</a> &nbsp;|&nbsp;
                        <a href="https://subwallet.app/" target="_blank" style="color:#E6007A;">🟣 SubWallet</a>
                    </div>`;
            }, 100);
        }
        return;
    }

    try {
        // Определяем какое расширение использовать
        let extensionKey = Object.keys(injected)[0];
        if (walletId === 'talisman' && injected['talisman']) extensionKey = 'talisman';
        if (walletId === 'subwallet' && injected['subwallet-js']) extensionKey = 'subwallet-js';
        if (walletId === 'polkadotjs' && injected['polkadot-js']) extensionKey = 'polkadot-js';

        const extension = await injected[extensionKey].enable('RURCoin Mining App');
        const accounts = await extension.accounts.get();

        if (!accounts || accounts.length === 0) {
            showWalletMsg('❌ Нет аккаунтов в кошельке. Создай аккаунт Polkadot.', 'error');
            return;
        }

        // Если несколько аккаунтов — показываем выбор
        if (accounts.length === 1) {
            onMultiWalletConnected(accounts[0].address, 'DOT', walletId);
        } else {
            showDOTAccountSelector(accounts, walletId);
        }

    } catch (e) {
        if (e.message && e.message.includes('not allowed')) {
            showWalletMsg('❌ Доступ отклонён. Разреши доступ в расширении.', 'error');
        } else {
            showWalletMsg('❌ Ошибка: ' + e.message, 'error');
        }
    }
}

function showDOTAccountSelector(accounts, walletId) {
    const existing = document.getElementById('dotAccountModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'dotAccountModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:1000;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML = `
        <div style="background:#111122;border:1px solid #E6007A;border-radius:16px;padding:24px;max-width:320px;width:90%;">
            <div style="font-size:16px;font-weight:700;margin-bottom:16px;color:#E6007A;">⚫ Выбери аккаунт</div>
            ${accounts.map((acc, i) => `
                <button onclick="selectDOTAccount('${acc.address}','${acc.name || 'Account ' + i}','${walletId}')"
                    style="display:block;width:100%;padding:12px;margin-bottom:8px;background:#1a1a2e;
                           border:1px solid #333;border-radius:10px;color:#fff;cursor:pointer;text-align:left;">
                    <div style="font-size:13px;font-weight:600;">${acc.name || 'Account ' + i}</div>
                    <div style="font-size:10px;color:#888;font-family:monospace;margin-top:4px;">
                        ${acc.address.slice(0,12)}...${acc.address.slice(-8)}
                    </div>
                </button>
            `).join('')}
            <button onclick="document.getElementById('dotAccountModal').remove()"
                style="width:100%;padding:10px;background:#333;border:none;border-radius:8px;color:#fff;cursor:pointer;margin-top:4px;">
                Отмена
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

function selectDOTAccount(address, name, walletId) {
    const modal = document.getElementById('dotAccountModal');
    if (modal) modal.remove();
    onMultiWalletConnected(address, 'DOT', walletId + ' (' + name + ')');
}

// ============================================================
//  Подключение Xaman (XUMM) — Ripple кошелёк
// ============================================================
async function connectXUMM() {
    // Проверяем наличие XUMM SDK
    if (window.xumm) {
        try {
            const xumm = new window.xumm.Xumm('YOUR_XUMM_API_KEY');
            await xumm.authorize();
            const account = await xumm.user.account;
            if (account) {
                onMultiWalletConnected(account, 'XRP', 'xumm');
                return;
            }
        } catch(e) {
            console.warn('XUMM SDK error:', e);
        }
    }

    // Fallback: ручной ввод XRP-адреса
    showWalletMsg('💡 Введи XRP-адрес вручную (начинается с r...)', 'info');
    const input = document.getElementById('manualAddrInput');
    if (input) {
        input.placeholder = 'XRP: rN7n3473SaZBCG4dFL83w7PB5AMgDn9rB...';
        input.focus();
    }
}

// ============================================================
//  Диспетчер подключения
// ============================================================
async function handleWalletConnect(walletId) {
    if (walletId === 'manual') {
        document.getElementById('manualAddrInput')?.focus();
        return;
    }

    const app = MULTI_WALLET_CONFIG.walletApps.find(w => w.id === walletId);
    if (!app) return;

    showWalletMsg('🔄 Подключение...', 'info');

    switch (app.type) {
        case 'injected':
            if (walletId === 'phantom') {
                await connectPhantom();
            } else {
                const network = app.networks.includes('BNB') && !app.networks.includes('ETH') ? 'BNB' : 'ETH';
                await connectEVM(app.key, network);
            }
            break;

        case 'tonconnect':
            await connectTONWallet(walletId);
            break;

        case 'polkadotjs':
            await connectPolkadotJS(walletId);
            break;

        case 'xumm':
            await connectXUMM();
            break;
    }
}

// ============================================================
//  QR для TON Connect
// ============================================================
function showTONConnectQR(link, walletName, icon, isTelegram, mobileLink) {
    const existing = document.getElementById('tonQRModal');
    if (existing) existing.remove();

    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    const openLink = mobileLink || link;

    const modal = document.createElement('div');
    modal.id = 'tonQRModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:1000;display:flex;align-items:center;justify-content:center;';

    if (isTelegram) {
        // Специальная модалка для Telegram Wallet
        modal.innerHTML = `
            <div style="background:#111122;border:1px solid #2481cc;border-radius:16px;padding:24px;text-align:center;max-width:300px;width:90%;">
                <div style="font-size:48px;margin-bottom:12px;">✈️</div>
                <div style="font-size:18px;font-weight:700;margin-bottom:8px;color:#2481cc;">Telegram Wallet</div>
                <div style="font-size:13px;color:#888;margin-bottom:20px;">
                    Встроенный TON-кошелёк в Telegram.<br>Нажми кнопку — откроется @wallet.
                </div>
                <a href="https://t.me/wallet" target="_blank"
                   style="display:block;padding:14px;background:linear-gradient(135deg,#2481cc,#1a6aaa);border-radius:10px;color:#fff;text-decoration:none;font-weight:700;font-size:15px;margin-bottom:8px;">
                    ✈️ Открыть Telegram Wallet
                </a>
                <div style="font-size:11px;color:#555;margin-bottom:14px;">
                    После подключения введи свой TON-адрес вручную
                </div>
                <button onclick="closeTONQRModal()" style="width:100%;padding:10px;background:#333;border:none;border-radius:8px;color:#fff;cursor:pointer;">
                    Отмена
                </button>
            </div>
        `;
    } else if (isMobile && openLink) {
        // Мобильная модалка — кнопка открытия приложения
        modal.innerHTML = `
            <div style="background:#111122;border:1px solid #333;border-radius:16px;padding:24px;text-align:center;max-width:300px;width:90%;">
                <div style="font-size:48px;margin-bottom:12px;">${icon || '💎'}</div>
                <div style="font-size:18px;font-weight:700;margin-bottom:8px;">Подключить ${walletName}</div>
                <div style="font-size:13px;color:#888;margin-bottom:20px;">
                    Нажми кнопку — откроется приложение ${walletName} с запросом на подключение.
                </div>
                <a href="${openLink}" target="_blank"
                   style="display:block;padding:14px;background:linear-gradient(135deg,#FF8C00,#FF6000);border-radius:10px;color:#fff;text-decoration:none;font-weight:700;font-size:15px;margin-bottom:10px;">
                    📲 Открыть ${walletName}
                </a>
                <button onclick="closeTONQRModal()" style="width:100%;padding:10px;background:#333;border:none;border-radius:8px;color:#fff;cursor:pointer;">
                    Отмена
                </button>
            </div>
        `;
    } else {
        // Десктоп — QR-код
        modal.innerHTML = `
            <div style="background:#111122;border:1px solid #333;border-radius:16px;padding:24px;text-align:center;max-width:300px;width:90%;">
                <div style="font-size:18px;font-weight:700;margin-bottom:16px;">Подключить ${walletName}</div>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}"
                     style="width:200px;height:200px;border-radius:12px;margin-bottom:12px;">
                <p style="color:#888;font-size:12px;margin-bottom:16px;">Отсканируй в ${walletName}</p>
                <a href="${link}" target="_blank"
                   style="display:block;padding:12px;background:#FF8C00;border-radius:10px;color:#fff;text-decoration:none;font-weight:700;margin-bottom:10px;">
                    Открыть ${walletName}
                </a>
                <button onclick="closeTONQRModal()" style="width:100%;padding:10px;background:#333;border:none;border-radius:8px;color:#fff;cursor:pointer;">
                    Отмена
                </button>
            </div>
        `;
    }

    document.body.appendChild(modal);
}

function closeTONQRModal() {
    const m = document.getElementById('tonQRModal');
    if (m) m.remove();
}

// ============================================================
//  Helpers
// ============================================================
function shortenAddr(addr) {
    if (!addr) return '';
    return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function copyMWAddress() {
    if (!multiWalletState.address) return;
    navigator.clipboard.writeText(multiWalletState.address).then(() => {
        showWalletMsg('✅ Адрес скопирован!', 'success');
    });
}

function showWalletMsg(msg, type) {
    const el = document.getElementById('walletMsg');
    if (!el) return;
    const colors = { success: '#4ade80', error: '#f44336', info: '#FF8C00' };
    el.textContent = msg;
    el.style.color = colors[type] || '#fff';
    setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, 4000);
}

function updateHeaderWallet() {
    const el = document.getElementById('headerWallet');
    if (!el) return;
    if (multiWalletState.connected) {
        const net = MULTI_WALLET_CONFIG.networks[multiWalletState.network];
        el.textContent = net.icon + ' ' + multiWalletState.shortAddress;
        el.style.color = '#4ade80';
    } else {
        el.textContent = 'Не подключён';
        el.style.color = '#f44336';
    }
}

// ============================================================
//  Инициализация
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const restored = loadSavedMultiWallet();
    renderMultiWalletUI();
    updateHeaderWallet();

    if (restored && multiWalletState.address) {
        loadMultiBalance(multiWalletState.address, multiWalletState.network);
        setTimeout(() => loadPlayerProgress(multiWalletState.address), 600);
    }
});

// Экспорт
window.multiWalletState = multiWalletState;
window.handleWalletConnect = handleWalletConnect;
window.connectManualAddress = connectManualAddress;
window.disconnectMultiWallet = disconnectMultiWallet;
window.copyMWAddress = copyMWAddress;
window.selectNetwork = selectNetwork;
window.savePlayerProgress = savePlayerProgress;
window.connectXUMM = connectXUMM;
window.connectPolkadotJS = connectPolkadotJS;
window.selectDOTAccount = selectDOTAccount;
window.showDOTAccountSelector = showDOTAccountSelector;
