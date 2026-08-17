from contextlib import asynccontextmanager

from fastapi import FastAPI

from backend.database import initialize_database, seed_test_account
from backend.schemas import MeterHistoryInput
from backend.services import handle_smart_meter_telemetry


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    seed_test_account()
    yield


app = FastAPI(lifespan=lifespan)


@app.get("/")
async def ping_server():
    return {"status": "online", "system": "NEA Smart Prepaid Grid Backend", "version": "1.0.0"}


@app.post("/api/v1/telemetry")
async def process_telemetry(data: MeterHistoryInput):
    return handle_smart_meter_telemetry(data)