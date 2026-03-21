from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from telegram.constants import ParseMode
from config import ADMIN_IDS
from database import get_user, create_user, update_user, get_top_users
from game import (
    sync_production, sell_oil, sell_gas, sell_all,
    buy_oil_pump, buy_gas_tower, buy_oil_tank, buy_gas_tank,
    oil_pump_cost, gas_tower_cost, oil_tank_cost, gas_tank_cost,
    oil_per_sec, gas_per_sec, stake, unstake
)
import time

def ensure_user(update):
    uid = update.effective_user.id
    uname = update.effective_user.username or update.effective_user.first_name
    u = get_user(uid)
    if not u: u = create_user(uid, uname)
    return u

def main_keyboard():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("📊 Статистика", callback_data="stats"),
         InlineKeyboardButton("⛏️ Добыча",     callback_data="mining")],
        [InlineKeyboardButton("🛍 Магазин",    callback_data="shop"),
         InlineKeyboardButton("💰 Продать всё",callback_data="sell_all")],
        [InlineKeyboardButton("🔒 Стейкинг",   callback_data="staking"),
         InlineKeyboardButton("🤖 Авто-режим", callback_data="auto_menu")],
        [InlineKeyboardButton("🏆 Топ игроков",callback_data="top")],
    ])

def shop_keyboard(u):
    return InlineKeyboardMarkup([
        [InlineKeyboardButton(f"🛢️ Насос ({oil_pump_cost(u['oil_pumps'])} RURC)",   callback_data="buy_pump"),
         InlineKeyboardButton(f"🏗️ Вышка ({gas_tower_cost(u['gas_towers'])} RURC)", callback_data="buy_tower")],
        [InlineKeyboardButton(f"🪣 Цист. нефть ({oil_tank_cost(u['oil_tanks'])} RURC)",  callback_data="buy_oil_tank"),
         InlineKeyboardButton(f"🪣 Цист. газ ({gas_tank_cost(u['gas_tanks'])} RURC)",    callback_data="buy_gas_tank")],
        [InlineKeyboardButton("◀️ Назад", callback_data="main_menu")],
    ])

def sell_keyboard():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🛢️ Продать нефть", callback_data="sell_oil"),
         InlineKeyboardButton("🔥 Продать газ",   callback_data="sell_gas")],
        [InlineKeyboardButton("💰 Продать всё",   callback_data="sell_all")],
        [InlineKeyboardButton("◀️ Назад",          callback_data="main_menu")],
    ])

def staking_keyboard(u):
    rows = []
    if u["balance"] >= 10:
        rows.append([InlineKeyboardButton("🔒 Стейк 50%",  callback_data="stake_50"),
                     InlineKeyboardButton("🔒 Стейк 100%", callback_data="stake_100")])
    if u["staked"] > 0:
        rows.append([InlineKeyboardButton("🔓 Вывести стейк", callback_data="unstake")])
    rows.append([InlineKeyboardButton("◀️ Назад", callback_data="main_menu")])
    return InlineKeyboardMarkup(rows)

def auto_keyboard(u):
    def tog(v): return "✅" if v else "⬜"
    return InlineKeyboardMarkup([
        [InlineKeyboardButton(f"{tog(u['auto_sell_oil'])} Авто-продажа нефти", callback_data="toggle_auto_oil")],
        [InlineKeyboardButton(f"{tog(u['auto_sell_gas'])} Авто-продажа газа",  callback_data="toggle_auto_gas")],
        [InlineKeyboardButton(f"{tog(u['auto_stake'])} Авто-стейкинг",         callback_data="toggle_auto_stake")],
        [InlineKeyboardButton("◀️ Назад", callback_data="main_menu")],
    ])

def format_stats(u):
    oil_pct = (u["oil_stored"]/u["oil_capacity"]*100) if u["oil_capacity"] else 0
    gas_pct = (u["gas_stored"]/u["gas_capacity"]*100) if u["gas_capacity"] else 0
    oil_bar = "█"*int(oil_pct/10) + "░"*(10-int(oil_pct/10))
    gas_bar = "█"*int(gas_pct/10) + "░"*(10-int(gas_pct/10))
    auto_list = []
    if u["auto_sell_oil"]: auto_list.append("🛢️ нефть")
    if u["auto_sell_gas"]: auto_list.append("🔥 газ")
    if u["auto_stake"]:    auto_list.append("🔒 стейк")
    return (
        f"📊 *Статистика*\n\n"
        f"💰 Баланс: `{u['balance']:.2f}` RURC\n"
        f"💎 TON: `{u['ton_balance']:.3f}`\n\n"
        f"🛢️ Нефть: `{u['oil_stored']:.1f}` / `{u['oil_capacity']:.0f}` барр.\n"
        f"`{oil_bar}` {oil_pct:.0f}%\n"
        f"🔥 Газ: `{u['gas_stored']:.0f}` / `{u['gas_capacity']:.0f}` м³\n"
        f"`{gas_bar}` {gas_pct:.0f}%\n\n"
        f"⚙️ Насосы: `{u['oil_pumps']}` | Вышки: `{u['gas_towers']}`\n"
        f"🪣 Цист. нефть: `{u['oil_tanks']}` | Газ: `{u['gas_tanks']}`\n\n"
        f"📈 Добыча/ч: `{oil_per_sec(u)*3600:.1f}` барр | `{gas_per_sec(u)*3600:.0f}` м³\n\n"
        f"🔒 Стейк: `{u['staked']:.2f}` RURC\n"
        f"🎁 Награды: `{u['staking_rewards']:.4f}` RURC\n\n"
        f"⛏️ Добыча: {'\u26a1 Активна' if u['is_mining'] else '\u23f8 Остановлена'}\n"
        f"🤖 Авто: {', '.join(auto_list) if auto_list else 'выкл'}"
    )

async def start(update, ctx):
    ensure_user(update)
    await update.message.reply_text(
        "🛢️ *Добро пожаловать в RURCoin Oil & Gas!*\n\n"
        "Добывай нефть и газ, продавай, стейкай и богатей.\n\n"
        "🎁 Стартовый бонус: `5 TON` уже на счету!\n\n"
        "Выбери действие:",
        parse_mode=ParseMode.MARKDOWN, reply_markup=main_keyboard()
    )

async def help_cmd(update, ctx):
    await update.message.reply_text(
        "📖 *Команды*\n\n"
        "/start — главное меню\n/stats — статистика\n/balance — баланс\n"
        "/sell oil|gas|all — продать\n/buy pump|tower|oiltank|gastank — купить\n"
        "/mining on|off — добыча\n/auto on|off — авто-режим\n\n"
        "👑 *Админ:*\n/admin give <id> <amount>\n/admin reset <id>\n/admin stats\n/admin top",
        parse_mode=ParseMode.MARKDOWN
    )

async def stats(update, ctx):
    u = ensure_user(update)
    u = sync_production(u["user_id"])
    await update.message.reply_text(format_stats(u), parse_mode=ParseMode.MARKDOWN, reply_markup=main_keyboard())

async def balance_cmd(update, ctx):
    u = ensure_user(update)
    await update.message.reply_text(
        f"💰 Баланс: `{u['balance']:.2f}` RURC\n💎 TON: `{u['ton_balance']:.3f}`",
        parse_mode=ParseMode.MARKDOWN
    )

async def sell(update, ctx):
    u = ensure_user(update)
    args = ctx.args
    if not args:
        await update.message.reply_text("Что продать?", reply_markup=sell_keyboard())
        return
    arg = args[0].lower()
    if arg == "oil":
        earned, st = sell_oil(u["user_id"])
        await update.message.reply_text(f"🛢️ Продано! +`{earned:.2f}` RURC" if st=="ok" else "🛢️ Нефть не накоплена", parse_mode=ParseMode.MARKDOWN)
    elif arg == "gas":
        earned, st = sell_gas(u["user_id"])
        await update.message.reply_text(f"🔥 Продано! +`{earned:.2f}` RURC" if st=="ok" else "🔥 Газ не накоплен", parse_mode=ParseMode.MARKDOWN)
    elif arg == "all":
        total = sell_all(u["user_id"])
        await update.message.reply_text(f"💰 Продано всё! +`{total:.2f}` RURC" if total>0 else "⚠️ Нечего продавать", parse_mode=ParseMode.MARKDOWN)

async def buy(update, ctx):
    u = ensure_user(update)
    args = ctx.args
    if not args:
        await update.message.reply_text("🛍 Магазин:", reply_markup=shop_keyboard(u))
        return
    m = {"pump": buy_oil_pump, "tower": buy_gas_tower, "oiltank": buy_oil_tank, "gastank": buy_gas_tank}
    fn = m.get(args[0].lower())
    if not fn:
        await update.message.reply_text("Используй: /buy pump | tower | oiltank | gastank")
        return
    ok, msg = fn(u["user_id"])
    await update.message.reply_text(f"{'\u2705' if ok else '\u274c'} {msg}")

async def mining_cmd(update, ctx):
    u = ensure_user(update)
    args = ctx.args
    if not args:
        st = "активна ⚡" if u["is_mining"] else "остановлена ⏸"
        await update.message.reply_text(f"⛏️ Добыча {st}\n\nИспользуй: /mining on | off")
        return
    if args[0].lower() == "on":
        update_user(u["user_id"], is_mining=1, last_update=time.time())
        await update.message.reply_text("⚡ Добыча запущена!")
    else:
        sync_production(u["user_id"])
        update_user(u["user_id"], is_mining=0)
        await update.message.reply_text("⏸ Добыча остановлена")

async def auto_cmd(update, ctx):
    u = ensure_user(update)
    args = ctx.args
    if not args:
        await update.message.reply_text("🤖 Авто-режим:", reply_markup=auto_keyboard(u))
        return
    if args[0].lower() == "on":
        update_user(u["user_id"], auto_sell_oil=1, auto_sell_gas=1)
        await update.message.reply_text("🤖 Авто-режим включён!")
    else:
        update_user(u["user_id"], auto_sell_oil=0, auto_sell_gas=0, auto_stake=0)
        await update.message.reply_text("🤖 Авто-режим выключен")

async def admin_cmd(update, ctx):
    uid = update.effective_user.id
    if uid not in ADMIN_IDS:
        await update.message.reply_text("⛔ Нет доступа")
        return
    args = ctx.args
    if not args:
        await update.message.reply_text("👑 /admin give <id> <amount>\n/admin reset <id>\n/admin stats\n/admin top")
        return
    cmd = args[0].lower()
    if cmd == "give" and len(args) >= 3:
        try:
            tid, amt = int(args[1]), float(args[2])
            t = get_user(tid)
            if not t: await update.message.reply_text("❌ Пользователь не найден"); return
            update_user(tid, balance=t["balance"]+amt)
            await update.message.reply_text(f"✅ Начислено `{amt:.2f}` RURC пользователю `{tid}`", parse_mode=ParseMode.MARKDOWN)
        except: await update.message.reply_text("❌ Формат: /admin give <id> <amount>")
    elif cmd == "reset" and len(args) >= 2:
        try:
            tid = int(args[1])
            update_user(tid, balance=0, oil_stored=0, gas_stored=0, oil_pumps=0, gas_towers=0,
                       oil_tanks=0, gas_tanks=0, oil_capacity=100, gas_capacity=1000,
                       staked=0, staking_rewards=0, total_mined=0, is_mining=0)
            await update.message.reply_text(f"✅ Игрок `{tid}` сброшен", parse_mode=ParseMode.MARKDOWN)
        except: await update.message.reply_text("❌ Формат: /admin reset <id>")
    elif cmd == "stats":
        from database import get_all_users
        users = get_all_users()
        await update.message.reply_text(
            f"📊 *Статистика платформы*\n\n"
            f"👥 Игроков: `{len(users)}`\n"
            f"💰 Всего RURC: `{sum(u['balance'] for u in users):.2f}`\n"
            f"🔒 В стейке: `{sum(u['staked'] for u in users):.2f}`",
            parse_mode=ParseMode.MARKDOWN
        )
    elif cmd == "top":
        top = get_top_users(10)
        medals = ["🥇","🥈","🥉"]+["4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"]
        lines = ["🏆 *Топ игроков:*\n"]
        for i, u in enumerate(top):
            lines.append(f"{medals[i]} `{u['username'] or u['user_id']}` — `{u['balance']:.2f}` RURC")
        await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.MARKDOWN)

async def button_handler(update, ctx):
    q = update.callback_query
    await q.answer()
    uid = q.from_user.id
    u = get_user(uid)
    if not u: u = create_user(uid, q.from_user.username or "")
    d = q.data

    async def edit(text, kb=None):
        await q.edit_message_text(text, parse_mode=ParseMode.MARKDOWN, reply_markup=kb)

    if d == "main_menu":
        u = sync_production(uid)
        await edit("🛢️ *RURCoin Oil & Gas*\nВыбери действие:", main_keyboard())
    elif d == "stats":
        u = sync_production(uid)
        await edit(format_stats(u), main_keyboard())
    elif d == "mining":
        u = sync_production(uid)
        st = "⚡ Активна" if u["is_mining"] else "⏸ Остановлена"
        kb = InlineKeyboardMarkup([[InlineKeyboardButton("▶️ Запустить" if not u["is_mining"] else "⏸ Остановить", callback_data="toggle_mining")],[InlineKeyboardButton("◀️ Назад", callback_data="main_menu")]])
        await edit(f"⛏️ *Добыча*\n\nСтатус: {st}\n🛢️ Нефть/ч: `{oil_per_sec(u)*3600:.1f}` барр.\n🔥 Газ/ч: `{gas_per_sec(u)*3600:.0f}` м³", kb)
    elif d == "toggle_mining":
        if u["is_mining"]: sync_production(uid); update_user(uid, is_mining=0); await edit("⏸ Добыча остановлена", InlineKeyboardMarkup([[InlineKeyboardButton("◀️ Назад", callback_data="main_menu")]]))
        else: update_user(uid, is_mining=1, last_update=time.time()); await edit("⚡ Добыча запущена!", InlineKeyboardMarkup([[InlineKeyboardButton("◀️ Назад", callback_data="main_menu")]]))
    elif d == "shop":
        u = sync_production(uid)
        await edit(f"🛍 *Магазин*\n\n💰 Баланс: `{u['balance']:.2f}` RURC", shop_keyboard(u))
    elif d == "buy_pump":
        ok, msg = buy_oil_pump(uid); u = get_user(uid)
        await edit(f"{'\u2705' if ok else '\u274c'} {msg}\n\n💰 Баланс: `{u['balance']:.2f}` RURC", shop_keyboard(u))
    elif d == "buy_tower":
        ok, msg = buy_gas_tower(uid); u = get_user(uid)
        await edit(f"{'\u2705' if ok else '\u274c'} {msg}\n\n💰 Баланс: `{u['balance']:.2f}` RURC", shop_keyboard(u))
    elif d == "buy_oil_tank":
        ok, msg = buy_oil_tank(uid); u = get_user(uid)
        await edit(f"{'\u2705' if ok else '\u274c'} {msg}\n\n💰 Баланс: `{u['balance']:.2f}` RURC", shop_keyboard(u))
    elif d == "buy_gas_tank":
        ok, msg = buy_gas_tank(uid); u = get_user(uid)
        await edit(f"{'\u2705' if ok else '\u274c'} {msg}\n\n💰 Баланс: `{u['balance']:.2f}` RURC", shop_keyboard(u))
    elif d == "sell_oil":
        earned, st = sell_oil(uid)
        await edit(f"🛢️ Продано! +`{earned:.2f}` RURC" if st=="ok" else "🛢️ Нефть не накоплена", sell_keyboard())
    elif d == "sell_gas":
        earned, st = sell_gas(uid)
        await edit(f"🔥 Продано! +`{earned:.2f}` RURC" if st=="ok" else "🔥 Газ не накоплен", sell_keyboard())
    elif d == "sell_all":
        total = sell_all(uid)
        await edit(f"💰 Продано всё! +`{total:.2f}` RURC" if total>0 else "⚠️ Нечего продавать", main_keyboard())
    elif d == "staking":
        u = get_user(uid)
        await edit(f"🔒 *Стейкинг*\n\n💰 Баланс: `{u['balance']:.2f}` RURC\n🔒 Застейкано: `{u['staked']:.2f}` RURC\n🎁 Награды: `{u['staking_rewards']:.4f}` RURC\n📈 Ставка: 0.1%/час", staking_keyboard(u))
    elif d == "stake_50":
        ok, msg = stake(uid, u["balance"]*0.5); u = get_user(uid)
        await edit(f"{'\u2705' if ok else '\u274c'} {msg}", staking_keyboard(u))
    elif d == "stake_100":
        ok, msg = stake(uid, u["balance"]); u = get_user(uid)
        await edit(f"{'\u2705' if ok else '\u274c'} {msg}", staking_keyboard(u))
    elif d == "unstake":
        total, st = unstake(uid); u = get_user(uid)
        await edit(f"🔓 Выведено `{total:.2f}` RURC" if st=="ok" else "⚠️ Нет застейканных средств", staking_keyboard(u))
    elif d == "auto_menu":
        u = get_user(uid)
        await edit("🤖 *Авто-режим*\n\nВключи нужные опции:", auto_keyboard(u))
    elif d == "toggle_auto_oil":
        update_user(uid, auto_sell_oil=0 if u["auto_sell_oil"] else 1); u = get_user(uid)
        await edit("🤖 *Авто-режим*\n\nВключи нужные опции:", auto_keyboard(u))
    elif d == "toggle_auto_gas":
        update_user(uid, auto_sell_gas=0 if u["auto_sell_gas"] else 1); u = get_user(uid)
        await edit("🤖 *Авто-режим*\n\nВключи нужные опции:", auto_keyboard(u))
    elif d == "toggle_auto_stake":
        update_user(uid, auto_stake=0 if u["auto_stake"] else 1); u = get_user(uid)
        await edit("🤖 *Авто-режим*\n\nВключи нужные опции:", auto_keyboard(u))
    elif d == "top":
        top = get_top_users(10)
        medals = ["🥇","🥈","🥉"]+["4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"]
        lines = ["🏆 *Топ игроков:*\n"]
        for i, ut in enumerate(top):
            lines.append(f"{medals[i]} `{ut['username'] or ut['user_id']}` — `{ut['balance']:.2f}` RURC")
        await edit("\n".join(lines), InlineKeyboardMarkup([[InlineKeyboardButton("◀️ Назад", callback_data="main_menu")]]))
