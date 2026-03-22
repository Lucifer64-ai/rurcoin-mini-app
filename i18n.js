// i18n.js — система переводов RURCoin
const TRANSLATIONS = {
  ru: {
    // Заголовок
    appSubtitle: "Нефть & Газ",
    notConnected: "Не подключён",
    // Статы
    statPumps: "Насосы",
    statTowers: "Вышки",
    statTanks: "Цистерны",
    statUnit: "ед/с",
    // Вкладки
    tabMining: "⛽ Добыча",
    tabEquipment: "🔧 Оборудование",
    tabUpgrades: "⬆️ Улучшения",
    tabStorage: "🏭 Хранилище",
    tabWallet: "🔑 Кошелёк",
    tabStaking: "💎 Стейкинг",
    tabTransactions: "📋 Транзакции",
    tabHalving: "⏳ Халвинг",
    tabExchange: "🔄 Обменник",
    tabCommunity: "🌍 Сообщество",
    tabGps: "🛰️ GPS",
    // Добыча
    oilPrice: "Нефть",
    gasPrice: "Газ",
    mineOil: "⛽ Добыть нефть",
    mineGas: "🔥 Добыть газ",
    autoMining: "⚡ Авто-добыча",
    stopAuto: "⏹ Стоп авто",
    storage: "Хранилище",
    full: "полное",
    // Оборудование
    buyEquipment: "Купить оборудование",
    oilPump: "Нефтяной насос",
    gasTower: "Газовая вышка",
    oilTank: "Цистерна",
    buy: "Купить",
    owned: "Куплено",
    // Улучшения
    upgradeTitle: "Улучшения",
    upgradeSpeed: "Скорость добычи",
    upgradeStorage: "Объём хранилища",
    upgradeEfficiency: "Эффективность",
    upgrade: "Улучшить",
    level: "Уровень",
    // Кошелёк
    walletTitle: "Кошелёк",
    connectWallet: "Подключить кошелёк",
    disconnect: "Отключить",
    send: "Отправить",
    receive: "Получить",
    address: "Адрес",
    amount: "Сумма",
    // Стейкинг
    stakingTitle: "Стейкинг",
    stake: "Застейкать",
    unstake: "Вывести",
    reward: "Награда",
    apy: "Доходность",
    staked: "Застейкано",
    // Транзакции
    txTitle: "История транзакций",
    txEmpty: "Транзакций пока нет",
    txSent: "Отправлено",
    txReceived: "Получено",
    // Халвинг
    halvingTitle: "Халвинг",
    nextHalving: "Следующий халвинг",
    currentReward: "Текущая награда",
    halvingIn: "Халвинг через",
    blocks: "блоков",
    // Обменник
    exchangeTitle: "Обменник",
    buy_tab: "Купить",
    sell_tab: "Продать",
    youPay: "Вы платите",
    youGet: "Вы получаете",
    exchangeBtn: "Обменять",
    commission: "Комиссия",
    // Сообщество
    communityTitle: "Сообщество",
    referral: "Реферальная программа",
    yourLink: "Ваша ссылка",
    copy: "Копировать",
    friends: "Друзей приглашено",
    // GPS
    gpsTitle: "GPS Трекер",
    gpsConnect: "Подключить GPS",
    gpsLocation: "Местоположение",
    // Общее
    confirm: "Подтвердить",
    cancel: "Отмена",
    close: "Закрыть",
    save: "Сохранить",
    loading: "Загрузка...",
    success: "Успешно!",
    error: "Ошибка",
    balance: "Баланс",
    price: "Цена",
    total: "Итого",
  },
  en: {
    appSubtitle: "Oil & Gas",
    notConnected: "Not connected",
    statPumps: "Pumps",
    statTowers: "Towers",
    statTanks: "Tanks",
    statUnit: "u/s",
    tabMining: "⛽ Mining",
    tabEquipment: "🔧 Equipment",
    tabUpgrades: "⬆️ Upgrades",
    tabStorage: "🏭 Storage",
    tabWallet: "🔑 Wallet",
    tabStaking: "💎 Staking",
    tabTransactions: "📋 Transactions",
    tabHalving: "⏳ Halving",
    tabExchange: "🔄 Exchange",
    tabCommunity: "🌍 Community",
    tabGps: "🛰️ GPS",
    oilPrice: "Oil",
    gasPrice: "Gas",
    mineOil: "⛽ Mine Oil",
    mineGas: "🔥 Mine Gas",
    autoMining: "⚡ Auto-mine",
    stopAuto: "⏹ Stop auto",
    storage: "Storage",
    full: "full",
    buyEquipment: "Buy Equipment",
    oilPump: "Oil Pump",
    gasTower: "Gas Tower",
    oilTank: "Oil Tank",
    buy: "Buy",
    owned: "Owned",
    upgradeTitle: "Upgrades",
    upgradeSpeed: "Mining Speed",
    upgradeStorage: "Storage Volume",
    upgradeEfficiency: "Efficiency",
    upgrade: "Upgrade",
    level: "Level",
    walletTitle: "Wallet",
    connectWallet: "Connect Wallet",
    disconnect: "Disconnect",
    send: "Send",
    receive: "Receive",
    address: "Address",
    amount: "Amount",
    stakingTitle: "Staking",
    stake: "Stake",
    unstake: "Unstake",
    reward: "Reward",
    apy: "APY",
    staked: "Staked",
    txTitle: "Transaction History",
    txEmpty: "No transactions yet",
    txSent: "Sent",
    txReceived: "Received",
    halvingTitle: "Halving",
    nextHalving: "Next Halving",
    currentReward: "Current Reward",
    halvingIn: "Halving in",
    blocks: "blocks",
    exchangeTitle: "Exchange",
    buy_tab: "Buy",
    sell_tab: "Sell",
    youPay: "You pay",
    youGet: "You get",
    exchangeBtn: "Exchange",
    commission: "Commission",
    communityTitle: "Community",
    referral: "Referral Program",
    yourLink: "Your link",
    copy: "Copy",
    friends: "Friends invited",
    gpsTitle: "GPS Tracker",
    gpsConnect: "Connect GPS",
    gpsLocation: "Location",
    confirm: "Confirm",
    cancel: "Cancel",
    close: "Close",
    save: "Save",
    loading: "Loading...",
    success: "Success!",
    error: "Error",
    balance: "Balance",
    price: "Price",
    total: "Total",
  },
  zh: {
    appSubtitle: "石油 & 天然气",
    notConnected: "未连接",
    statPumps: "泵站",
    statTowers: "钻塔",
    statTanks: "储罐",
    statUnit: "单/秒",
    tabMining: "⛽ 开采",
    tabEquipment: "🔧 设备",
    tabUpgrades: "⬆️ 升级",
    tabStorage: "🏭 仓库",
    tabWallet: "🔑 钱包",
    tabStaking: "💎 质押",
    tabTransactions: "📋 交易",
    tabHalving: "⏳ 减半",
    tabExchange: "🔄 兑换",
    tabCommunity: "🌍 社区",
    tabGps: "🛰️ GPS",
    oilPrice: "石油",
    gasPrice: "天然气",
    mineOil: "⛽ 开采石油",
    mineGas: "🔥 开采天然气",
    autoMining: "⚡ 自动开采",
    stopAuto: "⏹ 停止自动",
    storage: "仓库",
    full: "已满",
    buyEquipment: "购买设备",
    oilPump: "石油泵",
    gasTower: "天然气塔",
    oilTank: "储油罐",
    buy: "购买",
    owned: "已拥有",
    upgradeTitle: "升级",
    upgradeSpeed: "开采速度",
    upgradeStorage: "仓库容量",
    upgradeEfficiency: "效率",
    upgrade: "升级",
    level: "等级",
    walletTitle: "钱包",
    connectWallet: "连接钱包",
    disconnect: "断开连接",
    send: "发送",
    receive: "接收",
    address: "地址",
    amount: "金额",
    stakingTitle: "质押",
    stake: "质押",
    unstake: "取消质押",
    reward: "奖励",
    apy: "年化收益",
    staked: "已质押",
    txTitle: "交易历史",
    txEmpty: "暂无交易",
    txSent: "已发送",
    txReceived: "已接收",
    halvingTitle: "减半",
    nextHalving: "下次减半",
    currentReward: "当前奖励",
    halvingIn: "减半倒计时",
    blocks: "区块",
    exchangeTitle: "兑换",
    buy_tab: "购买",
    sell_tab: "出售",
    youPay: "您支付",
    youGet: "您获得",
    exchangeBtn: "兑换",
    commission: "手续费",
    communityTitle: "社区",
    referral: "推荐计划",
    yourLink: "您的链接",
    copy: "复制",
    friends: "已邀请好友",
    gpsTitle: "GPS追踪器",
    gpsConnect: "连接GPS",
    gpsLocation: "位置",
    confirm: "确认",
    cancel: "取消",
    close: "关闭",
    save: "保存",
    loading: "加载中...",
    success: "成功！",
    error: "错误",
    balance: "余额",
    price: "价格",
    total: "总计",
  },
  ar: {
    appSubtitle: "النفط والغاز",
    notConnected: "غير متصل",
    statPumps: "مضخات",
    statTowers: "أبراج",
    statTanks: "خزانات",
    statUnit: "و/ث",
    tabMining: "⛽ التعدين",
    tabEquipment: "🔧 المعدات",
    tabUpgrades: "⬆️ الترقيات",
    tabStorage: "🏭 التخزين",
    tabWallet: "🔑 المحفظة",
    tabStaking: "💎 التخزين المربح",
    tabTransactions: "📋 المعاملات",
    tabHalving: "⏳ التنصيف",
    tabExchange: "🔄 التبادل",
    tabCommunity: "🌍 المجتمع",
    tabGps: "🛰️ GPS",
    oilPrice: "النفط",
    gasPrice: "الغاز",
    mineOil: "⛽ استخراج النفط",
    mineGas: "🔥 استخراج الغاز",
    autoMining: "⚡ تعدين تلقائي",
    stopAuto: "⏹ إيقاف التلقائي",
    storage: "التخزين",
    full: "ممتلئ",
    buyEquipment: "شراء المعدات",
    oilPump: "مضخة نفط",
    gasTower: "برج غاز",
    oilTank: "خزان نفط",
    buy: "شراء",
    owned: "مملوك",
    upgradeTitle: "الترقيات",
    upgradeSpeed: "سرعة التعدين",
    upgradeStorage: "حجم التخزين",
    upgradeEfficiency: "الكفاءة",
    upgrade: "ترقية",
    level: "المستوى",
    walletTitle: "المحفظة",
    connectWallet: "ربط المحفظة",
    disconnect: "قطع الاتصال",
    send: "إرسال",
    receive: "استقبال",
    address: "العنوان",
    amount: "المبلغ",
    stakingTitle: "التخزين المربح",
    stake: "تخزين",
    unstake: "سحب",
    reward: "المكافأة",
    apy: "العائد السنوي",
    staked: "مخزّن",
    txTitle: "سجل المعاملات",
    txEmpty: "لا توجد معاملات بعد",
    txSent: "مُرسَل",
    txReceived: "مُستلَم",
    halvingTitle: "التنصيف",
    nextHalving: "التنصيف القادم",
    currentReward: "المكافأة الحالية",
    halvingIn: "التنصيف في",
    blocks: "كتلة",
    exchangeTitle: "التبادل",
    buy_tab: "شراء",
    sell_tab: "بيع",
    youPay: "تدفع",
    youGet: "تحصل على",
    exchangeBtn: "تبادل",
    commission: "العمولة",
    communityTitle: "المجتمع",
    referral: "برنامج الإحالة",
    yourLink: "رابطك",
    copy: "نسخ",
    friends: "الأصدقاء المدعوون",
    gpsTitle: "متتبع GPS",
    gpsConnect: "ربط GPS",
    gpsLocation: "الموقع",
    confirm: "تأكيد",
    cancel: "إلغاء",
    close: "إغلاق",
    save: "حفظ",
    loading: "جارٍ التحميل...",
    success: "نجاح!",
    error: "خطأ",
    balance: "الرصيد",
    price: "السعر",
    total: "الإجمالي",
  }
};

// Текущий язык
let currentLang = localStorage.getItem('rurcoin_lang') || 'ru';

// Получить перевод
function t(key) {
  return (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key]) 
    || TRANSLATIONS['ru'][key] 
    || key;
}

// Применить язык ко всей странице
function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('rurcoin_lang', lang);

  // RTL для арабского
  document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;

  // Обновляем все элементы с data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  // Обновляем placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });

  // Обновляем активную кнопку языка
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // Обновляем subtitle в header
  const subtitle = document.querySelector('.app-logo-text p');
  if (subtitle) subtitle.textContent = t('appSubtitle');

  // Обновляем статы
  const statLabels = document.querySelectorAll('.stat-lbl');
  const statKeys = ['statPumps', 'statTowers', 'statTanks', 'statUnit'];
  statLabels.forEach((el, i) => { if (statKeys[i]) el.textContent = t(statKeys[i]); });

  // Обновляем вкладки
  const tabKeys = {
    'mining': 'tabMining', 'equipment': 'tabEquipment', 'upgrades': 'tabUpgrades',
    'storage': 'tabStorage', 'wallet': 'tabWallet', 'staking': 'tabStaking',
    'transactions': 'tabTransactions', 'halving': 'tabHalving',
    'exchange': 'tabExchange', 'community': 'tabCommunity', 'gps': 'tabGps'
  };
  document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
    const key = tabKeys[btn.dataset.tab];
    if (key) btn.textContent = t(key);
  });

  // Обновляем кнопки добычи
  const mineOilBtn = document.getElementById('mineOilBtn');
  const mineGasBtn = document.getElementById('mineGasBtn');
  const autoBtn = document.getElementById('autoMineBtn');
  if (mineOilBtn) mineOilBtn.textContent = t('mineOil');
  if (mineGasBtn) mineGasBtn.textContent = t('mineGas');
  if (autoBtn) autoBtn.textContent = t('autoMining');
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
  applyLanguage(currentLang);
});
