from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from contextlib import asynccontextmanager

# Clean Import: Pulling your verified worker engines directly into the API
from database import initialize_database, seed_test_account, get_info_by_account_id, update_account, append_meter_data

# runs everytime if backend server is started
@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    seed_test_account()
    yield

app = FastAPI(lifespan=lifespan)

class TelemetryIn(BaseModel):
    account_id: str
    load_phase: float
    load_neutral: float

@app.post("/api/v1/telemetry")
async def process_telemetry(data: TelemetryIn):
    # 1. Fetch current wallet balance state
    account = get_info_by_account_id(data.account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Smart Meter ID unregistered.")
        
    token_balance, monthly_units, system_status = account
    
    # 2. Perform Security Math Checks
    mismatch = abs(data.load_phase - data.load_neutral)
    is_tampered = 1 if mismatch > 0.2 else 0
    
    # 3. Handle a Tamper Event
    if is_tampered == 1:
        current_status = "TAMPER_LOCKOUT"
        update_account(data.account_id, token_balance, monthly_units, current_status)
        append_meter_data(data.account_id, data.load_phase, data.load_neutral, mismatch, is_tampered)
        return {"command": "DISCONNECT", "reason": "Mismatched lines detected"}
        
    # 4. Handle Normal Energy Billing Deductions
    # (For testing purposes, we deduct 0.1 NPR per telemetry ping)
    new_balance = max(0.0, token_balance - 0.1)
    updated_units = monthly_units + 0.01 
    
    if new_balance <= 0:
        current_status = "OUT_OF_CREDIT"
        update_account(data.account_id, new_balance, updated_units, current_status)
        append_meter_data(data.account_id, data.load_phase, data.load_neutral, mismatch, is_tampered)
        return {"command": "DISCONNECT", "reason": "Prepaid balance depleted"}
        
    # 5. Keep alive and save logs
    update_account(data.account_id, new_balance, updated_units, system_status)
    append_meter_data(data.account_id, data.load_phase, data.load_neutral, mismatch, is_tampered)
    
    return {"command": "KEEP_ALIVE"}