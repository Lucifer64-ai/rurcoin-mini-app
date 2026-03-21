import os

BOT_TOKEN   = os.getenv("BOT_TOKEN", "YOUR_BOT_TOKEN_HERE")
ADMIN_IDS   = list(map(int, os.getenv("ADMIN_IDS", "0").split(",")))
DB_PATH     = os.getenv("DB_PATH", "rurcoin.db")

# Игровые константы
OIL_PUMP_BASE_COST    = 10
GAS_TOWER_BASE_COST   = 25
OIL_TANK_BASE_COST    = 50
GAS_TANK_BASE_COST    = 80
OIL_SELL_PRICE        = 2.5
GAS_SELL_PRICE        = 0.8
OIL_PER_PUMP_PER_SEC  = 0.05
GAS_PER_TOWER_PER_SEC = 2.0
OIL_TANK_CAPACITY     = 50
GAS_TANK_CAPACITY     = 500
BASE_OIL_CAPACITY     = 100
BASE_GAS_CAPACITY     = 1000
STAKING_RATE          = 0.001
