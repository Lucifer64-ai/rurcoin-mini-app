import logging
from telegram.ext import ContextTypes
from telegram.constants import ParseMode
from telegram import InlineKeyboardButton, InlineKeyboardMarkup
from database import get_all_users, get_user, update_user
from game import sync_production, sell_oil, sell_gas, stake

logger = logging.getLogger(__name__)

def sell_keyboard():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🛢️ Продать нефть", callback_data="sell_oil"),
         InlineKeyboardButton("🔥 Продать газ",   callback_data="sell_gas")],
        [InlineKeyboardButton("💰 Продать всё",   callback_data="sell_all")],
    ])

async def notify(context, uid, text, kb=None):
    try:
        await context.bot.send_message(chat_id=uid, text=text, parse_mode=ParseMode.MARKDOWN, reply_markup=kb)
    except Exception as e:
        logger.debug(f"Cannot notify {uid}: {e}")

async def start_scheduler(context: ContextTypes.DEFAULT_TYPE):
    users = get_all_users()
    for u in users:
        try:
            uid = u["user_id"]
            # Синхронизация добычи
            if u["is_mining"] and (u["oil_pumps"] > 0 or u["gas_towers"] > 0):
                u = sync_production(uid)
            # Стейкинг
            if u["staked"] > 0:
                rewards = u["staked"] * 0.001 / 60
                update_user(uid, staking_rewards=u["staking_rewards"] + rewards)
                u = get_user(uid)
            # Авто-продажа нефти
            if u["auto_sell_oil"] and u["oil_stored"] > 0:
                pct = (u["oil_stored"] / u["oil_capacity"]) * 100
                if pct >= u["sell_threshold"]:
                    earned, st = sell_oil(uid)
                    if st == "ok":
                        bal = get_user(uid)["balance"]
                        await notify(context, uid, f"🤖 *Авто-продажа нефти*\n\n🛢️ +`{earned:.2f}` RURC\n💰 Баланс: `{bal:.2f}` RURC", sell_keyboard())
            # Авто-продажа газа
            if u["auto_sell_gas"] and u["gas_stored"] > 0:
                pct = (u["gas_stored"] / u["gas_capacity"]) * 100
                if pct >= u["sell_threshold"]:
                    earned, st = sell_gas(uid)
                    if st == "ok":
                        bal = get_user(uid)["balance"]
                        await notify(context, uid, f"🤖 *Авто-продажа газа*\n\n🔥 +`{earned:.2f}` RURC\n💰 Баланс: `{bal:.2f}` RURC", sell_keyboard())
            # Авто-стейк
            if u["auto_stake"] and u["balance"] >= u["stake_threshold"]:
                amount = u["balance"] * 0.5
                ok, msg = stake(uid, amount)
                if ok: await notify(context, uid, f"🤖 *Авто-стейк*\n\n🔒 {msg}")
            # Уведомление о заполненной цистерне
            if not u["auto_sell_oil"] and u["oil_capacity"] > 0:
                pct = (u["oil_stored"] / u["oil_capacity"]) * 100
                if pct >= 95:
                    await notify(context, uid, f"⚠️ *Цистерна нефти почти полна!*\n\n🛢️ `{u['oil_stored']:.1f}` / `{u['oil_capacity']:.0f}` барр. ({pct:.0f}%)\nПродай нефть!", sell_keyboard())
            if not u["auto_sell_gas"] and u["gas_capacity"] > 0:
                pct = (u["gas_stored"] / u["gas_capacity"]) * 100
                if pct >= 95:
                    await notify(context, uid, f"⚠️ *Цистерна газа почти полна!*\n\n🔥 `{u['gas_stored']:.0f}` / `{u['gas_capacity']:.0f}` м³ ({pct:.0f}%)\nПродай газ!", sell_keyboard())
        except Exception as e:
            logger.warning(f"Scheduler error {u['user_id']}: {e}")
