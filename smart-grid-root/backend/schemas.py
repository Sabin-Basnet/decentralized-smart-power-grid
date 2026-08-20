from typing import Optional

from pydantic import AliasChoices, BaseModel, Field


class MeterHistoryInput(BaseModel):
    device_id: str = Field(
        ...,
        validation_alias=AliasChoices("device_id", "account_id"),
        description="Unique device identifier from the ESP32 meter",
    )
    load: float = Field(..., ge=0, description="Electrical load in amps")
    line_current: Optional[float] = Field(default=None, ge=0)
    neutral_current: Optional[float] = Field(default=None, ge=0)
    energy: float = Field(..., ge=0, description="Energy consumed in kWh")
    is_tampered: int = Field(default=0, description="0 = Normal, 1 = Hardware Tampered")
    account_id: Optional[str] = Field(default=None, exclude=True)

    @property
    def meter_id(self) -> str:
        return self.device_id or self.account_id or ""

    @property
    def currents(self) -> tuple[float, float]:
        return self.line_current if self.line_current is not None else self.load, self.neutral_current or 0.0


class TokenPurchaseInput(BaseModel):
    account_id: str
    amount_npr: float = Field(..., gt=0, description="Amount in Nepalese Rupees to top up")


class UserAuthInput(BaseModel):
    username: str
    password: str