import sqlite3

conn = sqlite3.connect("backend_data.db")
cursor = conn.cursor()

cursor.execute("""
    CREATE TABLE IF NOT EXISTS Accounts(
        account_id TEXT PRIMARY_KEY,
        token_balance REAL,
        cummulative_energy_month REAL,
        system_status TEXT
    )
""")

cursor.execute("""
    CREATE TABLE IF NOT EXISTS Meter_History (
        log_id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id TEXT,
        timestamp TEXT,
        load_phase REAL,
        load_neutral REAL,
        mismatch REAL
    )
""")
print("Database created...")
conn.commit()
conn.close()