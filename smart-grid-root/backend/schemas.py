from pydantic import BaseModel, Field

# 1. Telemetry input coming from the Wokwi ESP32
class MeterHistoryInput(BaseModel):
    account_id: str
    load_phase: float
    load_neutral: float
    is_tampered: int = Field(default=0, description="0 = Normal, 1 = Hardware Tampered")


# 2. Client Input when buying energy tokens on the dashboard
class TokenPurchaseInput(BaseModel):
    account_id: str
    amount_npr: float = Field(..., gt=0, description="Amount in Nepalese Rupees to top up")


# 3. User Authentication Input (For Login/Signup screens)
class UserAuthInput(BaseModel):
    username: str
    password: str