import time
import math
from config import (
    OIL_PUMP_BASE_COST, GAS_TOWER_BASE_COST,
    OIL_TANK_BASE_COST, GAS_TANK_BASE_COST,
    OIL_SELL_PRICE, GAS_SELL_PRICE,
    OIL_PER_PUMP_PER_SEC, GAS_PER_TOWER_PER_SEC,
    OIL_TANK_CAPACITY, GAS_TANK_CAPACITY,
    STAKING_RATE
)
from database import get_user, update_user, add_transaction

def oil_pump_cost(pumps):  return math.floor(OIL_PUMP_BASE_COST  * (1.5 ** pumps))
def gas_tower_cost(towers): return math.floor(GAS_TOWER_BASE_COST * (1.6 ** towers))
def oil_tank_cost(tanks):  return math.floor(OIL_TANK_BASE_COST  * (1.4 ** tanks))
def gas_tank_cost(tanks):  return math.floor(GAS_TANK_BASE_COST  * (1.4 ** tanks))
def oil_per_sec(u):  return u["oil_pumps"]  * OIL_PER_PUMP_PER_SEC
def gas_per_sec(u):  return u["gas_towers"] * GAS_PER_TOWER_PER_SEC

def sync_production(user_id: int):
    u = get_user(user_id)
    if not u or not u["is_mining"]: return u
    now = time.time()
    elapsed = now - (u["last_update"] or now)
    if elapsed <= 0: return u
    oil_gain = min(oil_per_sec(u) * elapsed, u["oil_capacity"] - u["oil_stored"])
    gas_gain = min(gas_per_sec(u) * elapsed, u["gas_capacity"] - u["gas_stored"])
    update_user(user_id,
        oil_stored=min(u["oil_capacity"], u["oil_stored"] + oil_gain),
        gas_stored=min(u["gas_capacity"], u["gas_stored"] + gas_gain),
        total_mined=u["total_mined"] + oil_gain + gas_gain * 0.01,
        last_update=now
    )
    return get_user(user_id)

def sell_oil(user_id: int):
    u = sync_production(user_id)
    if u["oil_stored"] <= 0: return 0, "empty"
    earned = u["oil_stored"] * OIL_SELL_PRICE
    update_user(user_id, balance=u["balance"] + earned, oil_stored=0)
    add_transaction(user_id, "sell_oil", earned)
    return earned, "ok"

def sell_gas(user_id: int):
    u = sync_production(user_id)
    if u["gas_stored"] <= 0: return 0, "empty"
    earned = u["gas_stored"] * GAS_SELL_PRICE
    update_user(user_id, balance=u["balance"] + earned, gas_stored=0)
    add_transaction(user_id, "sell_gas", earned)
    return earned, "ok"

def sell_all(user_id: int):
    u = sync_production(user_id)
    total = 0
    if u["oil_stored"] > 0: total += u["oil_stored"] * OIL_SELL_PRICE
    if u["gas_stored"] > 0: total += u["gas_stored"] * GAS_SELL_PRICE
    if total > 0:
        update_user(user_id, balance=u["balance"] + total, oil_stored=0, gas_stored=0)
        add_transaction(user_id, "sell_all", total)
    return total

def buy_oil_pump(user_id: int):
    u = sync_production(user_id)
    cost = oil_pump_cost(u["oil_pumps"])
    if u["balance"] < cost: return False, f"Нужно {cost:.0f} RURC, у тебя {u['balance']:.2f}"
    update_user(user_id, balance=u["balance"]-cost, oil_pumps=u["oil_pumps"]+1, is_mining=1, last_update=time.time())
    return True, f"Насос куплен! Всего: {u['oil_pumps']+1}"

def buy_gas_tower(user_id: int):
    u = sync_production(user_id)
    cost = gas_tower_cost(u["gas_towers"])
    if u["balance"] < cost: return False, f"Нужно {cost:.0f} RURC, у тебя {u['balance']:.2f}"
    update_user(user_id, balance=u["balance"]-cost, gas_towers=u["gas_towers"]+1, is_mining=1, last_update=time.time())
    return True, f"Вышка куплена! Всего: {u['gas_towers']+1}"

def buy_oil_tank(user_id: int):
    u = sync_production(user_id)
    cost = oil_tank_cost(u["oil_tanks"])
    if u["balance"] < cost: return False, f"Нужно {cost:.0f} RURC, у тебя {u['balance']:.2f}"
    new_cap = u["oil_capacity"] + OIL_TANK_CAPACITY
    update_user(user_id, balance=u["balance"]-cost, oil_tanks=u["oil_tanks"]+1, oil_capacity=new_cap)
    return True, f"Цистерна нефти куплена! Ёмкость: {new_cap} барр."

def buy_gas_tank(user_id: int):
    u = sync_production(user_id)
    cost = gas_tank_cost(u["gas_tanks"])
    if u["balance"] < cost: return False, f"Нужно {cost:.0f} RURC, у тебя {u['balance']:.2f}"
    new_cap = u["gas_capacity"] + GAS_TANK_CAPACITY
    update_user(user_id, balance=u["balance"]-cost, gas_tanks=u["gas_tanks"]+1, gas_capacity=new_cap)
    return True, f"Цистерна газа куплена! Ёмкость: {new_cap} м³"

def stake(user_id: int, amount: float):
    u = get_user(user_id)
    if u["balance"] < amount: return False, f"Нужно {amount:.2f} RURC, у тебя {u['balance']:.2f}"
    update_user(user_id, balance=u["balance"]-amount, staked=u["staked"]+amount)
    return True, f"Застейкано {amount:.2f} RURC"

def unstake(user_id: int):
    u = get_user(user_id)
    if u["staked"] <= 0: return 0, "empty"
    total = u["staked"] + u["staking_rewards"]
    update_user(user_id, balance=u["balance"]+total, staked=0, staking_rewards=0)
    add_transaction(user_id, "unstake", total)
    return total, "ok"
