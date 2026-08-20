from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import initialize_database, seed_test_account
from backend.ml_engine import ML_MODEL
from backend.schemas import MeterHistoryInput
from backend.services import handle_smart_meter_telemetry


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    seed_test_account()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.get("/")
async def ping_server():
    return {"status": "online", "system": "Dharan Smart Power Grid", "version": "2.0.0"}


@app.get("/api/v1/dashboard")
async def dashboard():
    users = []
    for user_id, weight in ML_MODEL.user_weights.items():
        balance = 320.0 if user_id == "DHARAN-001" else 250.0
        users.append({
            "id": user_id,
            "name": "Ram Thapa" if user_id == "DHARAN-001" else "Dharan Residence B",
            "location": "Dharan",
            "balance": balance,
            "hours_remaining": ML_MODEL.predict_hours_remaining(user_id, balance),
            "usage_weight": round(weight, 2),
            "status": "Active",
        })
    return {"users": users, "total_system_load_kw": round(sum(user["usage_weight"] for user in users), 2),
            "anomaly": {"label": "Normal", "is_anomalous": False}}


@app.post("/api/v1/telemetry")
async def process_telemetry(data: MeterHistoryInput):
    return handle_smart_meter_telemetry(data)