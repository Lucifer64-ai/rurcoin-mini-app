// ============================================================
//  RURCoin Wallet — привязка крипто-кошелька = ID игрока
// ============================================================

const WALLET_CONFIG = {
    tonConnectManifest: 'https://lucifer64-ai.github.io/rurcoin-mini-app/manifest.json',
    supportedWallets: ['tonkeeper', 'tonhub', 'mytonwallet', 'openmask'],
    network: 'mainnet'  // 'mainnet' | 'testnet'
};

// ============================================================
//  Состояние кошелька
// ============================================================
const walletState = {
    connected: false,
    address: null,       // TON-адрес = ID игрока
    shortAddress: null,  // EQ...abc
    walletName: null,
    publicKey: null,
    balance: null,
    rurcBalance: null,
    connector: null
};

// ============================================================
//  Инициализация TON Connect
// ============================================================
async function initWallet() {
    // Загружаем TON Connect SDK
    if (!window.TONConnect) {
        await loadScript('https://unpkg.com/@tonconnect/sdk@latest/dist/tonconnect-sdk.min.js');
    }

    try {
        walletState.connector = new TONConnect.TonConnect({
            manifestUrl: WALLET_CONFIG.tonConnectManifest
        });

        // Восстановить сессию
        const restored = await walletState.connector.restoreConnection();
        if (restored && walletState.connector.connected) {
            const wallet = walletState.connector.wallet;
            onWalletConnected(wallet);
        }

        // Слушаем изменения
        walletState.connector.onStatusChange((wallet) => {
            if (wallet) {
                onWalletConnected(wallet);
            } else {
                onWalletDisconnected();
            }
        });

    } catch (e) {
        console.warn('TON Connect init error:', e);
        // Fallback: ручной ввод адреса
    }

    renderWalletUI();
}

// ============================================================
//  Подключение кошелька
// ============================================================
async function connectWallet(walletId) {
    if (!walletState.connector) {
        showWalletError('TON Connect не инициализирован');
        return;
    }

    try {
        const walletsList = await walletState.connector.getWallets();
        const wallet = walletsList.find(w => w.appName === walletId || w.name.toLowerCase().includes(walletId));

        if (!wallet) {
            showWalletError(`Кошелёк ${walletId} не найден`);
            return;
        }

        if (wallet.universalLink) {
            const link = walletState.connector.connect({ universalLink: wallet.universalLink, bridgeUrl: wallet.bridgeUrl });
            openWalletLink(link, wallet.name);
        } else if (wallet.injected) {
            await walletState.connector.connect({ jsBridgeKey: wallet.jsBridgeKey });
        }

    } catch (e) {
        console.error('Connect error:', e);
        showWalletError('Ошибка подключения: ' + e.message);
    }
}

// Открыть ссылку кошелька
function openWalletLink(link, walletName) {
    const modal = document.getElementById('walletConnectModal');
    if (modal) {
        const qrContainer = document.getElementById('walletQR');
        if (qrContainer) {
            // QR-код через API
            qrContainer.innerHTML = `
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}"
                     style="width:200px; height:200px; border-radius:12px;" />
                <p style="margin-top:12px; color:#888; font-size:12px;">Отсканируй в ${walletName}</p>
                <a href="${link}" target="_blank" style="
                    display:block; margin-top:12px; padding:12px;
                    background:#FF8C00; border-radius:10px; color:#fff;
                    text-decoration:none; font-weight:700; text-align:center;">
                    Открыть ${walletName}
                </a>
            `;
        }
    }
}

// ============================================================
//  Ручной ввод адреса (fallback)
// ============================================================
async function connectManualWallet() {
    const input = document.getElementById('manualWalletInput');
    if (!input) return;

    const address = input.value.trim();
    if (!isValidTonAddress(address)) {
        showWalletError('Неверный TON-адрес. Формат: EQ... или UQ...');
        return;
    }

    // Сохраняем как ID игрока
    walletState.connected = true;
    walletState.address = address;
    walletState.shortAddress = shortenAddress(address);
    walletState.walletName = 'Manual';

    saveWalletData();
    onWalletConnected({ account: { address } });
    showWalletSuccess('Кошелёк привязан!');
}

// ============================================================
//  Callbacks
// ============================================================
function onWalletConnected(wallet) {
    const address = wallet.account?.address || wallet.address;
    walletState.connected = true;
    walletState.address = address;
    walletState.shortAddress = shortenAddress(address);
    walletState.walletName = wallet.device?.appName || wallet.name || 'TON Wallet';
    walletState.publicKey = wallet.account?.publicKey;

    saveWalletData();
    renderWalletUI();
    loadWalletBalance(address);

    // Загружаем данные игрока по адресу
    loadPlayerDataByWallet(address);

    console.log('✅ Кошелёк подключён:', walletState.shortAddress);
}

function onWalletDisconnected() {
    walletState.connected = false;
    walletState.address = null;
    walletState.shortAddress = null;
    walletState.walletName = null;
    walletState.balance = null;
    walletState.rurcBalance = null;

    clearWalletData();
    renderWalletUI();
}

// ============================================================
//  Загрузка баланса TON
// ============================================================
async function loadWalletBalance(address) {
    try {
        const resp = await fetch(`https://tonapi.io/v2/accounts/${address}`, {
            headers: { 'Authorization': 'Bearer AHVHQCBZEV2TA6IAAAAJHMD6BQFJMEKBTA6WY3STOQMD5ZAPNOSYAM7ETRGBDN7S7JYYQZI' }
        });
        const data = await resp.json();
        if (data.balance) {
            walletState.balance = (parseInt(data.balance) / 1e9).toFixed(2);
            updateWalletBalanceUI();
        }
    } catch (e) {
        console.warn('Balance load error:', e);
    }
}

// ============================================================
//  Данные игрока привязаны к адресу кошелька
// ============================================================
function loadPlayerDataByWallet(address) {
    const key = `rurcoin_player_${address}`;
    const saved = localStorage.getItem(key);
    if (saved) {
        const data = JSON.parse(saved);
        // Загружаем прогресс игрока
        if (window.rurcoinApp) {
            Object.assign(window.rurcoinApp, data);
            window.rurcoinApp.render();
            console.log('📂 Прогресс игрока загружен для', shortenAddress(address));
        }
    } else {
        console.log('🆕 Новый игрок:', shortenAddress(address));
    }
}

function savePlayerDataByWallet() {
    if (!walletState.address || !window.rurcoinApp) return;
    const key = `rurcoin_player_${walletState.address}`;
    const app = window.rurcoinApp;
    const data = {
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
    };
    localStorage.setItem(key, JSON.stringify(data));
}

// Автосохранение каждые 10 сек
setInterval(savePlayerDataByWallet, 10000);

// ============================================================
//  Отключить кошелёк
// ============================================================
async function disconnectWallet() {
    if (walletState.connector && walletState.connected) {
        try { await walletState.connector.disconnect(); } catch(e) {}
    }
    onWalletDisconnected();
}

// ============================================================
//  Сохранение / загрузка адреса
// ============================================================
function saveWalletData() {
    localStorage.setItem('rurcoin_wallet', JSON.stringify({
        address: walletState.address,
        walletName: walletState.walletName,
        shortAddress: walletState.shortAddress
    }));
}

function clearWalletData() {
    localStorage.removeItem('rurcoin_wallet');
}

function loadSavedWallet() {
    const saved = localStorage.getItem('rurcoin_wallet');
    if (saved) {
        const data = JSON.parse(saved);
        walletState.connected = true;
        walletState.address = data.address;
        walletState.shortAddress = data.shortAddress;
        walletState.walletName = data.walletName;
        return true;
    }
    return false;
}

// ============================================================
//  UI
// ============================================================
function renderWalletUI() {
    const walletSection = document.getElementById('walletSection');
    if (!walletSection) return;

    if (walletState.connected) {
        walletSection.innerHTML = `
            <div class="wallet-connected">
                <div class="wallet-avatar">🔑</div>
                <div class="wallet-info">
                    <div class="wallet-name">${walletState.walletName || 'TON Wallet'}</div>
                    <div class="wallet-address" onclick="copyWalletAddress()" title="Нажми чтобы скопировать">
                        ${walletState.shortAddress}
                        <span style="color:#555; font-size:10px;"> 📋</span>
                    </div>
                    <div class="wallet-id-label">🆔 ID игрока</div>
                </div>
                <button class="wallet-disconnect-btn" onclick="disconnectWallet()">Выйти</button>
            </div>
            <div class="wallet-balances">
                <div class="wb-item">
                    <span class="wb-icon">💎</span>
                    <span class="wb-val" id="walletTonBal">${walletState.balance || '...'} TON</span>
                </div>
                <div class="wb-item">
                    <span class="wb-icon">🛢️</span>
                    <span class="wb-val" id="walletRurcBal">${window.rurcoinApp ? window.rurcoinApp.balance.toFixed(2) : '0.00'} RURC</span>
                </div>
            </div>
        `;
    } else {
        walletSection.innerHTML = `
            <div class="wallet-connect-prompt">
                <div style="font-size:48px; margin-bottom:12px;">🔗</div>
                <div style="font-size:16px; font-weight:700; margin-bottom:8px;">Подключи кошелёк</div>
                <div style="font-size:13px; color:#888; margin-bottom:20px;">
                    Твой TON-адрес = твой ID игрока.<br>Прогресс сохраняется на кошелёк.
                </div>
                <div class="wallet-list">
                    <button class="wallet-btn" onclick="connectWallet('tonkeeper')">
                        <img src="https://tonkeeper.com/assets/tonconnect-icon.png" onerror="this.style.display='none'" style="width:24px; height:24px; border-radius:6px;">
                        Tonkeeper
                    </button>
                    <button class="wallet-btn" onclick="connectWallet('mytonwallet')">
                        <span style="font-size:20px;">💎</span>
                        MyTonWallet
                    </button>
                    <button class="wallet-btn" onclick="connectWallet('tonhub')">
                        <span style="font-size:20px;">🔵</span>
                        Tonhub
                    </button>
                </div>
                <div class="wallet-divider">или введи адрес вручную</div>
                <div class="manual-input-wrap">
                    <input type="text" id="manualWalletInput"
                           placeholder="EQ... или UQ..."
                           style="width:100%; padding:12px; background:#0d0d1a; border:1px solid #333;
                                  border-radius:8px; color:#fff; font-size:13px; margin-bottom:10px;">
                    <button class="wallet-btn-primary" onclick="connectManualWallet()">
                        🔗 Привязать адрес
                    </button>
                </div>
            </div>
        `;
    }

    // Обновляем шапку
    updateHeaderWallet();
}

function updateHeaderWallet() {
    const headerWallet = document.getElementById('headerWallet');
    if (!headerWallet) return;
    if (walletState.connected) {
        headerWallet.textContent = walletState.shortAddress;
        headerWallet.style.color = '#4ade80';
    } else {
        headerWallet.textContent = 'Не подключён';
        headerWallet.style.color = '#f44336';
    }
}

function updateWalletBalanceUI() {
    const el = document.getElementById('walletTonBal');
    if (el) el.textContent = walletState.balance + ' TON';
}

function copyWalletAddress() {
    if (!walletState.address) return;
    navigator.clipboard.writeText(walletState.address).then(() => {
        showWalletSuccess('Адрес скопирован!');
    });
}

// ============================================================
//  Helpers
// ============================================================
function isValidTonAddress(addr) {
    return /^(EQ|UQ|0:)[A-Za-z0-9_\-+/]{46,}/.test(addr);
}

function shortenAddress(addr) {
    if (!addr) return '';
    return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

function showWalletError(msg) {
    const el = document.getElementById('walletMsg');
    if (el) { el.textContent = '❌ ' + msg; el.style.color = '#f44'; }
    else alert('❌ ' + msg);
}

function showWalletSuccess(msg) {
    const el = document.getElementById('walletMsg');
    if (el) { el.textContent = '✅ ' + msg; el.style.color = '#4ade80'; }
    else alert('✅ ' + msg);
}

// ============================================================
//  Инициализация при загрузке
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    // Восстановить сохранённый кошелёк
    const restored = loadSavedWallet();
    if (restored) {
        renderWalletUI();
        loadWalletBalance(walletState.address);
        // Загрузим прогресс после инициализации приложения
        setTimeout(() => loadPlayerDataByWallet(walletState.address), 500);
    } else {
        renderWalletUI();
    }

    // Инициализируем TON Connect
    await initWallet();
});

// Экспорт
window.walletState = walletState;
window.connectWallet = connectWallet;
window.disconnectWallet = disconnectWallet;
window.connectManualWallet = connectManualWallet;
window.copyWalletAddress = copyWalletAddress;
window.savePlayerDataByWallet = savePlayerDataByWallet;
