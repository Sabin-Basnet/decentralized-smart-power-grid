import sqlite3

database_name = 'backend_data.db'
conn = sqlite3.connect(database_name)
cursor = conn.cursor()

cursor.execute("""
    CREATE TABLE IF NOT EXISTS Accounts(
        account_id TEXT PRIMARY_KEY,
        token_balance REAL,
        cumulative_energy_month REAL,
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


def get_info_by_account_id(account_id):
    conn = sqlite3.connect(database_name)
    cursor = conn.cursor()
    cursor.execute("SELECT token_balance, cumulative_energy_month, system_status FROM Accounts WHERE account_id = ?", (account_id,))
    account = cursor.fetchone()
    conn.close()
    return account


#just checking 
# cursor.execute("""
# INSERT INTO Accounts (account_id, token_balance, cumulative_energy_month, system_status) VALUES('mine',300, 45, 'this is good')
# """)
# conn.commit()
# get_info_by_account_id('mine')

def update_account(account_id, new_balance, updated_units, current_status):
    conn = sqlite3.connect(database_name)
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE Accounts 
        SET token_balance = ?, cumulative_energy_month = ?, system_status = ?
        WHERE account_id = ?
    """, (new_balance, updated_units, current_status, account_id))
    conn.commit()
    conn.close()


def append_meter_data(account_id, current_phase, current_neutral, mismatch):
    conn = sqlite3.connect(database_name)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO Meter_History (account_id, timestamp, load_phase, load_neutral, mismatch)
        VALUES (?, datetime('now'), ?, ?, ?)
    """, (account_id, current_phase, current_neutral, mismatch))
    conn.commit()
    conn.close()

