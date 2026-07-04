from pydantic import BaseModel

class MeterHistoryInput(BaseModel):
    account_id: str
    load_phase: float
    load_neutral: float