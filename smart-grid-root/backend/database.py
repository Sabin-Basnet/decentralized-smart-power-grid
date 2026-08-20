import sqlite3

database_name = 'backend_data.db'

def initialize_database():
    conn = sqlite3.connect(database_name)
    cursor = conn.cursor()

    # 1. Users Table (Clients and Providers)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('client', 'provider'))
        )
    ''')

    # 2. Accounts Table (Each meter account linked to a user)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS Accounts (
            account_id TEXT PRIMARY KEY,                  -- Device MAC Address or Unique ID
            owner_id INTEGER,
            token_balance REAL DEFAULT 10.0,              -- Pre-paid balance in kWh/NPR
            monthly_units REAL DEFAULT 0.0,
            system_status TEXT DEFAULT 'ACTIVE',          -- 'ACTIVE' or 'SHUTOFF'
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(owner_id) REFERENCES users(id)
        )
    ''')

    # 3. Meter History Table (For historical theft and usage analysis)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS Meter_History (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            load_phase REAL,
            load_neutral REAL,
            line_mismatch REAL,
            is_tampered INTEGER,
            FOREIGN KEY(account_id) REFERENCES Accounts(account_id)
        )
    ''')
    print("Database structures initialized successfully...")

    # Apply Indexing to speed up data retrieval
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
        VALUES (?, datetime('now', 'localtime'), ?, ?, ?, ?)
    """, (account_id, current_phase, current_neutral, mismatch, is_tampered))
    conn.commit()
    conn.close()


def seed_test_account():
    """Injects a baseline tracking profile for your Wokwi hardware client to target."""
    conn = sqlite3.connect(database_name)
    cursor = conn.cursor()
    
    # Optional: Seed a default user if users table is empty to keep foreign key constraints happy
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO users (username, password, role) VALUES ('demo_client', 'pass123', 'client')")
        default_user_id = cursor.lastrowid
    else:
        default_user_id = 1

    # Add a mock customer profile with a starting credit balance of 500
    cursor.execute("""
    INSERT OR IGNORE INTO Accounts (account_id, owner_id, token_balance, monthly_units, system_status, last_updated)
    VALUES ('DHARAN-001', ?, 320.0, 0.0, 'ACTIVE', datetime('now', 'localtime'));
    """, (default_user_id,))
    
    conn.commit()
    conn.close()
    print("[SEED] Active Dharan profile 'DHARAN-001' configured.")


if __name__ == "__main__":
    initialize_database()
    seed_test_account()