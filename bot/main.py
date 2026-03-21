import asyncio
import logging
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters
from config import BOT_TOKEN
from handlers import (
    start, stats, sell, buy, auto_cmd, admin_cmd,
    button_handler, help_cmd, balance_cmd, mining_cmd
)
from scheduler import start_scheduler
from database import init_db

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

def main():
    init_db()
    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start",   start))
    app.add_handler(CommandHandler("help",    help_cmd))
    app.add_handler(CommandHandler("stats",   stats))
    app.add_handler(CommandHandler("balance", balance_cmd))
    app.add_handler(CommandHandler("sell",    sell))
    app.add_handler(CommandHandler("buy",     buy))
    app.add_handler(CommandHandler("mining",  mining_cmd))
    app.add_handler(CommandHandler("auto",    auto_cmd))
    app.add_handler(CommandHandler("admin",   admin_cmd))
    app.add_handler(CallbackQueryHandler(button_handler))

    app.job_queue.run_repeating(start_scheduler, interval=60, first=10)

    logger.info("RURCoin Bot запущен!")
    app.run_polling(drop_pending_updates=True)

if __name__ == "__main__":
    main()
