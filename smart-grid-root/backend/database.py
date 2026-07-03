import sqlite3

database_name = 'backend_data.db'

def initialize_database():
    conn = sqlite3.connect(database_name)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Accounts(
            account_id TEXT PRIMARY KEY ,
            token_balance REAL NOT NULL DEFAULT 0.0,
            monthly_units REAL NOT NULL DEFAULT 0.0,
            system_status TEXT NOT NULL DEFAULT 'ACTIVE',
            last_updated TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Meter_History (
            log_id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            load_phase REAL NOT NULL,
            load_neutral REAL NOT NULL,
            line_mismatch REAL NOT NULL,
            is_tampered INTEGER NOT NULL,
            FOREIGN KEY (account_id) REFERENCES Accounts(account_id) ON DELETE CASCADE
        )
    """)
    print("Database created...")

    #  Apply Indexing to speed up ML model batch downloads
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_telemetry_account ON Meter_History(account_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_telemetry_time ON Meter_History(timestamp);")

    conn.commit()
    conn.close()


def get_info_by_account_id(account_id):
    conn = sqlite3.connect(database_name)
    cursor = conn.cursor()
    cursor.execute("SELECT token_balance, monthly_units, system_status FROM Accounts WHERE account_id = ?", (account_id,))
    account = cursor.fetchone()
    conn.close()
    return account


#just checking 
# cursor.execute("""
# INSERT INTO Accounts (account_id, token_balance, monthly_units, system_status) VALUES('mine',300, 45, 'this is good')
# """)
# conn.commit()
# get_info_by_account_id('mine')

def update_account(account_id, new_balance, updated_units, current_status):
    conn = sqlite3.connect(database_name)
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE Accounts 
        SET token_balance = ?, monthly_units = ?, system_status = ?
        WHERE account_id = ?
    """, (new_balance, updated_units, current_status, account_id))
    conn.commit()
    conn.close()


def append_meter_data(account_id, current_phase, current_neutral, mismatch, is_tampered):
    conn = sqlite3.connect(database_name)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO Meter_History (account_id, timestamp, load_phase, load_neutral, line_mismatch, is_tampered)
        VALUES (?, datetime('now'), ?, ?, ?, ?)
    """, (account_id, current_phase, current_neutral, mismatch, is_tampered))
    conn.commit()
    conn.close()

def seed_test_account():
    """Injects a baseline tracking profile for your Wokwi hardware client to target."""
    conn = sqlite3.connect(database_name)
    cursor = conn.cursor()
    
    # Add a mock customer profile with a starting credit balance of 500 NPR
    cursor.execute("""
    INSERT OR IGNORE INTO Accounts (account_id, token_balance, monthly_units, system_status, last_updated)
    VALUES ('NEA-KTM-001', 500.0, 0.0, 'ACTIVE', datetime('now', 'localtime'));
    """)
    
    conn.commit()
    conn.close()
    print("[SEED] Active testing profile 'NEA-KTM-001' configured.")

if __name__ == "__main__":
    initialize_database()
    seed_test_account()

