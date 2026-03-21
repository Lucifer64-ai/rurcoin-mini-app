import sqlite3
import time
from config import DB_PATH

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id         INTEGER PRIMARY KEY,
                username        TEXT,
                balance         REAL    DEFAULT 0,
                ton_balance     REAL    DEFAULT 5,
                oil_stored      REAL    DEFAULT 0,
                gas_stored      REAL    DEFAULT 0,
                oil_capacity    REAL    DEFAULT 100,
                gas_capacity    REAL    DEFAULT 1000,
                oil_pumps       INTEGER DEFAULT 0,
                gas_towers      INTEGER DEFAULT 0,
                oil_tanks       INTEGER DEFAULT 0,
                gas_tanks       INTEGER DEFAULT 0,
                staked          REAL    DEFAULT 0,
                staking_rewards REAL    DEFAULT 0,
                total_mined     REAL    DEFAULT 0,
                is_mining       INTEGER DEFAULT 0,
                auto_sell_oil   INTEGER DEFAULT 0,
                auto_sell_gas   INTEGER DEFAULT 0,
                auto_stake      INTEGER DEFAULT 0,
                sell_threshold  REAL    DEFAULT 80,
                stake_threshold REAL    DEFAULT 100,
                last_update     REAL    DEFAULT 0,
                created_at      REAL    DEFAULT 0
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id    INTEGER,
                type       TEXT,
                amount     REAL,
                created_at REAL
            )
        """)
        conn.commit()

def get_user(user_id: int):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM users WHERE user_id=?", (user_id,)).fetchone()
        return dict(row) if row else None

def create_user(user_id: int, username: str):
    now = time.time()
    with get_conn() as conn:
        conn.execute("""
            INSERT OR IGNORE INTO users (user_id, username, last_update, created_at)
            VALUES (?, ?, ?, ?)
        """, (user_id, username or "", now, now))
        conn.commit()
    return get_user(user_id)

def update_user(user_id: int, **kwargs):
    if not kwargs:
        return
    fields = ", ".join(f"{k}=?" for k in kwargs)
    values = list(kwargs.values()) + [user_id]
    with get_conn() as conn:
        conn.execute(f"UPDATE users SET {fields} WHERE user_id=?", values)
        conn.commit()

def add_transaction(user_id: int, type_: str, amount: float):
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO transactions (user_id, type, amount, created_at) VALUES (?,?,?,?)",
            (user_id, type_, amount, time.time())
        )
        conn.commit()

def get_all_users():
    with get_conn() as conn:
        return [dict(r) for r in conn.execute("SELECT * FROM users").fetchall()]

def get_top_users(limit=10):
    with get_conn() as conn:
        return [dict(r) for r in conn.execute(
            "SELECT * FROM users ORDER BY balance DESC LIMIT ?", (limit,)
        ).fetchall()]
