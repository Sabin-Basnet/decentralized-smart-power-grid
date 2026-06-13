"""
models.py - SQLAlchemy ORM models for Smart Grid telemetry and transactions
"""
from sqlalchemy import Column, Integer, Float, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from database import Base
from datetime import datetime
import pytz

class TelemetryLog(Base):
    """
    Stores all incoming telemetry data from edge nodes.
    Includes power consumption, load, and authorization status.
    """
    __tablename__ = "telemetry_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(100), index=True, nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=func.now())
    power_consumption_kw = Column(Float, nullable=False)
    load_percentage = Column(Float, nullable=False)
    relay_status = Column(String(50), nullable=False)  # "ACTIVE" or "DISCONNECTED"
    authorization_flag = Column(Boolean, default=True)
    
    # Derived fields (computed by ML engine)
    is_anomalous = Column(Boolean, default=False)
    hours_remaining = Column(Float, nullable=True)
    anomaly_score = Column(Float, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return (f"<TelemetryLog(device_id={self.device_id}, "
                f"power={self.power_consumption_kw}kW, "
                f"timestamp={self.timestamp})>")


class UserBalance(Base):
    """
    Tracks prepaid token balances for each user wallet.
    Linked to blockchain smart contract.
    """
    __tablename__ = "user_balances"
    
    id = Column(Integer, primary_key=True, index=True)
    wallet_address = Column(String(255), unique=True, index=True, nullable=False)
    balance_tokens = Column(Float, default=100.0, nullable=False)
    is_authorized = Column(Boolean, default=True)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Blockchain transaction hash for audit trail
    tx_hash = Column(String(255), nullable=True)
    
    def __repr__(self):
        return f"<UserBalance(wallet={self.wallet_address}, balance={self.balance_tokens})>"


class ConsumptionHistory(Base):
    """
    Aggregated consumption metrics for ML analysis and billing.
    """
    __tablename__ = "consumption_history"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(100), index=True, nullable=False)
    wallet_address = Column(String(255), index=True, nullable=False)
    
    # Aggregated metrics
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)
    total_consumption_kwh = Column(Float, nullable=False)
    average_load_percentage = Column(Float, nullable=False)
    peak_load_percentage = Column(Float, nullable=False)
    
    # Billing data
    cost_tokens = Column(Float, nullable=False)
    is_settled = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return (f"<ConsumptionHistory(device={self.device_id}, "
                f"consumption={self.total_consumption_kwh}kWh)>")


class AnomalyAlert(Base):
    """
    Records anomaly detections from ML engine for audit and investigation.
    """
    __tablename__ = "anomaly_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(100), index=True, nullable=False)
    wallet_address = Column(String(255), index=True, nullable=False)
    
    anomaly_type = Column(String(50), nullable=False)  # "THEFT", "MALFUNCTION", etc.
    severity = Column(String(20), nullable=False)  # "LOW", "MEDIUM", "HIGH"
    anomaly_score = Column(Float, nullable=False)
    
    description = Column(Text, nullable=True)
    telemetry_snapshot = Column(Text, nullable=True)  # JSON snapshot
    
    resolved = Column(Boolean, default=False)
    action_taken = Column(String(255), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self):
        return (f"<AnomalyAlert(device={self.device_id}, "
                f"type={self.anomaly_type}, score={self.anomaly_score})>")
