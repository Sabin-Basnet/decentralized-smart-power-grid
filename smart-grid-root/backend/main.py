"""
main.py - FastAPI server for Smart Grid backend
Handles telemetry ingestion, ML analysis, blockchain integration, and dashboard API
"""
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta
import pytz
import logging
import asyncio
from typing import List, Optional

# Import local modules
from database import init_db, get_db, engine, Base
from models import TelemetryLog, UserBalance, ConsumptionHistory, AnomalyAlert
from ml_engine import ml_pipeline
from blockchain_bridge import blockchain_bridge

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ======================== FASTAPI APP INITIALIZATION ========================
app = FastAPI(
    title="Smart Grid Backend API",
    description="Prepaid Smart Power Grid System",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database and log startup."""
    Base.metadata.create_all(bind=engine)
    logger.info("[Startup] Database initialized")
    logger.info("[Startup] FastAPI server started")


# ======================== PYDANTIC SCHEMAS ========================
class TelemetryRequest(BaseModel):
    """Incoming telemetry payload from edge node."""
    device_id: str
    timestamp: str
    power_consumption_kw: float
    load_percentage: float
    relay_status: str
    authorization_flag: bool


class TelemetryResponse(BaseModel):
    """Response to telemetry submission."""
    success: bool
    message: str
    authorized: bool
    hours_remaining: Optional[float]
    is_anomalous: bool


class BalanceRequest(BaseModel):
    """Update user balance."""
    wallet_address: str
    balance_tokens: float


class BalanceResponse(BaseModel):
    """User balance response."""
    wallet_address: str
    balance_tokens: float
    is_authorized: bool
    last_updated: datetime


class ConsumptionStatsResponse(BaseModel):
    """Consumption statistics for dashboard."""
    mean_consumption: float
    std_consumption: float
    current_balance: float
    hours_remaining: Optional[float]
    is_anomalous: bool
    anomaly_score: float
    total_samples: int


class DashboardDataResponse(BaseModel):
    """Complete dashboard data payload."""
    current_consumption_kw: float
    current_balance_tokens: float
    hours_remaining: Optional[float]
    status: str  # "NORMAL", "ANOMALOUS", "DISCONNECTED"
    anomaly_score: float
    recent_telemetry: List[TelemetryResponse]
    recent_alerts: List[dict]
    stats: ConsumptionStatsResponse


# ======================== TELEMETRY ENDPOINTS ========================
@app.post("/api/telemetry", response_model=TelemetryResponse)
async def submit_telemetry(
    data: TelemetryRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Receive and process telemetry from edge node.
    Performs ML analysis and updates blockchain state.
    """
    try:
        # Parse and store telemetry
        tz = pytz.UTC
        timestamp = datetime.fromisoformat(data.timestamp.replace('Z', '+00:00'))
        if timestamp.tzinfo is None:
            timestamp = tz.localize(timestamp)
        
        # Log telemetry to database
        telemetry_log = TelemetryLog(
            device_id=data.device_id,
            timestamp=timestamp,
            power_consumption_kw=data.power_consumption_kw,
            load_percentage=data.load_percentage,
            relay_status=data.relay_status,
            authorization_flag=data.authorization_flag
        )
        
        # Add to ML pipeline buffer
        ml_pipeline.add_telemetry(
            power_consumption_kw=data.power_consumption_kw,
            load_percentage=data.load_percentage,
            timestamp=timestamp
        )
        
        # Detect anomalies
        anomaly_result = ml_pipeline.detect_anomaly({
            'power_consumption_kw': data.power_consumption_kw,
            'load_percentage': data.load_percentage
        })
        
        telemetry_log.is_anomalous = anomaly_result['is_anomalous']
        telemetry_log.anomaly_score = anomaly_result['anomaly_score']
        
        # Calculate hours remaining
        # Default balance for demo (should fetch from blockchain in production)
        current_balance = 100.0
        hours_remaining = ml_pipeline.calculate_hours_remaining(current_balance)
        telemetry_log.hours_remaining = hours_remaining
        
        # Log to database
        db.add(telemetry_log)
        db.commit()
        db.refresh(telemetry_log)
        
        # Log anomalies
        if anomaly_result['is_anomalous']:
            alert = AnomalyAlert(
                device_id=data.device_id,
                wallet_address="0x" + "0" * 40,  # Placeholder
                anomaly_type="THEFT_DETECTION",
                severity=anomaly_result['severity'],
                anomaly_score=anomaly_result['anomaly_score'],
                description=f"Anomaly detected: {anomaly_result['severity']} severity",
                telemetry_snapshot=data.json()
            )
            db.add(alert)
            db.commit()
            
            logger.warning(
                f"[Telemetry] ANOMALY: device={data.device_id}, "
                f"score={anomaly_result['anomaly_score']}, "
                f"severity={anomaly_result['severity']}"
            )
        
        logger.info(
            f"[Telemetry] Received: {data.device_id}, "
            f"Power={data.power_consumption_kw}kW, "
            f"Anomalous={anomaly_result['is_anomalous']}"
        )
        
        return TelemetryResponse(
            success=True,
            message="Telemetry processed successfully",
            authorized=data.authorization_flag,
            hours_remaining=hours_remaining,
            is_anomalous=anomaly_result['is_anomalous']
        )
    
    except Exception as e:
        logger.error(f"[Telemetry] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/telemetry/latest")
async def get_latest_telemetry(
    device_id: Optional[str] = None,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get most recent telemetry records."""
    try:
        query = db.query(TelemetryLog)
        if device_id:
            query = query.filter(TelemetryLog.device_id == device_id)
        
        records = query.order_by(TelemetryLog.timestamp.desc()).limit(limit).all()
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ======================== BALANCE ENDPOINTS ========================
@app.get("/api/balance/{wallet_address}", response_model=BalanceResponse)
async def get_balance(
    wallet_address: str,
    db: Session = Depends(get_db)
):
    """Retrieve user balance from database."""
    try:
        balance = db.query(UserBalance).filter(
            UserBalance.wallet_address == wallet_address
        ).first()
        
        if not balance:
            # Create default balance entry
            balance = UserBalance(
                wallet_address=wallet_address,
                balance_tokens=100.0,
                is_authorized=True
            )
            db.add(balance)
            db.commit()
            db.refresh(balance)
        
        return BalanceResponse(
            wallet_address=balance.wallet_address,
            balance_tokens=balance.balance_tokens,
            is_authorized=balance.is_authorized,
            last_updated=balance.last_updated
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/balance/update")
async def update_balance(
    data: BalanceRequest,
    db: Session = Depends(get_db)
):
    """Update user balance (called by blockchain listener)."""
    try:
        balance = db.query(UserBalance).filter(
            UserBalance.wallet_address == data.wallet_address
        ).first()
        
        if not balance:
            balance = UserBalance(wallet_address=data.wallet_address)
            db.add(balance)
        
        balance.balance_tokens = data.balance_tokens
        balance.last_updated = datetime.utcnow(pytz.UTC)
        
        db.commit()
        db.refresh(balance)
        
        logger.info(f"[Balance] Updated: {data.wallet_address} -> {data.balance_tokens} tokens")
        
        return {
            "success": True,
            "message": "Balance updated",
            "wallet": data.wallet_address,
            "new_balance": data.balance_tokens
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ======================== ML ENGINE ENDPOINTS ========================
@app.get("/api/ml/stats")
async def get_ml_stats():
    """Get current ML engine statistics."""
    try:
        stats = ml_pipeline.get_statistics()
        
        return {
            "buffer_samples": stats['samples'],
            "mean_consumption_kw": stats['mean'],
            "std_consumption_kw": stats['std'],
            "min_consumption_kw": stats['min'],
            "max_consumption_kw": stats['max'],
            "is_trained": ml_pipeline.is_trained
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ml/forecast")
async def get_forecast(hours: int = 24):
    """Forecast power consumption for next N hours."""
    try:
        forecast = ml_pipeline.forecast_consumption(hours_ahead=hours)
        
        if forecast is None:
            return {
                "success": False,
                "message": "Insufficient data for forecasting",
                "forecast": []
            }
        
        return {
            "success": True,
            "hours_ahead": hours,
            "forecast": forecast
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ======================== DASHBOARD ENDPOINTS ========================
@app.get("/api/dashboard/data", response_model=DashboardDataResponse)
async def get_dashboard_data(
    wallet_address: Optional[str] = None,
    device_id: Optional[str] = "ESP32_GRID_NODE_001",
    db: Session = Depends(get_db)
):
    """Get comprehensive dashboard data."""
    try:
        # Get latest telemetry
        latest_telemetry = db.query(TelemetryLog).filter(
            TelemetryLog.device_id == device_id
        ).order_by(TelemetryLog.timestamp.desc()).first()
        
        # Get recent alerts
        recent_alerts = db.query(AnomalyAlert).filter(
            AnomalyAlert.device_id == device_id,
            AnomalyAlert.resolved == False
        ).order_by(AnomalyAlert.created_at.desc()).limit(5).all()
        
        # Get balance
        balance = db.query(UserBalance).filter(
            UserBalance.wallet_address == wallet_address
        ).first() if wallet_address else None
        
        current_balance = balance.balance_tokens if balance else 100.0
        
        # Calculate stats
        stats = ml_pipeline.get_statistics()
        hours_remaining = ml_pipeline.calculate_hours_remaining(current_balance)
        
        # Determine status
        if latest_telemetry:
            if latest_telemetry.is_anomalous:
                status = "ANOMALOUS"
            elif not latest_telemetry.authorization_flag:
                status = "DISCONNECTED"
            else:
                status = "NORMAL"
        else:
            status = "UNKNOWN"
        
        return DashboardDataResponse(
            current_consumption_kw=latest_telemetry.power_consumption_kw if latest_telemetry else 0.0,
            current_balance_tokens=current_balance,
            hours_remaining=hours_remaining,
            status=status,
            anomaly_score=latest_telemetry.anomaly_score if latest_telemetry else 0.0,
            recent_telemetry=[],
            recent_alerts=[{
                "id": alert.id,
                "type": alert.anomaly_type,
                "severity": alert.severity,
                "score": alert.anomaly_score,
                "created_at": alert.created_at.isoformat()
            } for alert in recent_alerts],
            stats=ConsumptionStatsResponse(
                mean_consumption=stats['mean'],
                std_consumption=stats['std'],
                current_balance=current_balance,
                hours_remaining=hours_remaining,
                is_anomalous=latest_telemetry.is_anomalous if latest_telemetry else False,
                anomaly_score=latest_telemetry.anomaly_score if latest_telemetry else 0.0,
                total_samples=stats['samples']
            )
        )
    except Exception as e:
        logger.error(f"[Dashboard] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ======================== HEALTH CHECK ========================
@app.get("/api/health")
async def health_check():
    """System health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(pytz.UTC).isoformat(),
        "ml_ready": ml_pipeline.is_trained,
        "blockchain_connected": blockchain_bridge.is_connected
    }


# ======================== ROOT ENDPOINT ========================
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "Smart Grid Backend API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health"
    }


# ======================== STARTUP ========================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
