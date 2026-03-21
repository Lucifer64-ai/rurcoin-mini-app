# RURCoin Telegram Bot

## Быстрый старт

### 1. Создай бота
1. Открой [@BotFather](https://t.me/BotFather)
2. Отправь `/newbot`
3. Придумай имя и username
4. Скопируй токен

### 2. Деплой на Railway (бесплатно)
1. Зайди на [railway.app](https://railway.app)
2. New Project → Deploy from GitHub repo
3. Выбери `rurcoin-mini-app`
4. Variables → добавь `BOT_TOKEN` и `ADMIN_IDS` (твой Telegram ID)
5. Deploy!

### 3. Запуск локально
```bash
cd bot
pip install -r requirements.txt
export BOT_TOKEN=your_token
export ADMIN_IDS=your_telegram_id
python main.py
```

## Команды

| Команда | Описание |
|---------|----------|
| /start | Главное меню |
| /stats | Статистика |
| /balance | Баланс |
| /sell oil\|gas\|all | Продать |
| /buy pump\|tower\|oiltank\|gastank | Купить |
| /mining on\|off | Добыча |
| /auto on\|off | Авто-режим |

### Админ-команды
| Команда | Описание |
|---------|----------|
| /admin give \<id\> \<amount\> | Начислить RURC |
| /admin reset \<id\> | Сбросить игрока |
| /admin stats | Статистика платформы |
| /admin top | Топ игроков |
