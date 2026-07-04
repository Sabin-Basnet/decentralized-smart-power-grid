from fastapi import HTTPException
from database import get_info_by_account_id, update_account, append_meter_data
from schemas import MeterHistoryInput

def handle_smart_meter_telemetry(data: MeterHistoryInput) -> dict:
    """Executes fraud detection, billing deductions, and updates the database state."""
    
    # 1. Verification Check
    account = get_info_by_account_id(data.account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Smart Meter ID unregistered.")
        
    token_balance, monthly_units, current_status = account
    
    # 2. Safety & Tamper Math
    mismatch = abs(data.load_phase - data.load_neutral)
    is_tampered = 1 if mismatch > 0.2 else 0
    
    # 3. Decision Tree Logic
    if is_tampered == 1:
        new_status = "TAMPER_DETECTED"
        update_account(data.account_id, token_balance, monthly_units, new_status)
        append_meter_data(data.account_id, data.load_phase, data.load_neutral, mismatch, is_tampered)
        return {"command": "DISCONNECT", "reason": "Mismatched lines detected"}
        
    # 4. Billing Operations
    new_balance = max(0.0, token_balance - 0.1)
    updated_units = monthly_units + 0.01 
    
    if new_balance <= 0:
        new_status = "OUT_OF_CREDIT"
        update_account(data.account_id, new_balance, updated_units, new_status)
        append_meter_data(data.account_id, data.load_phase, data.load_neutral, mismatch, is_tampered)
        return {"command": "DISCONNECT", "reason": "Prepaid balance depleted"}
        
    # 5. Safe State Continuation
    update_account(data.account_id, new_balance, updated_units, current_status)
    append_meter_data(data.account_id, data.load_phase, data.load_neutral, mismatch, is_tampered)
    
    return {"command": "ACTIVE", "reason": "All systems normal"}