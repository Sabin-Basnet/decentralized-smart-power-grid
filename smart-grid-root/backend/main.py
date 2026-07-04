from fastapi import FastAPI
from contextlib import asynccontextmanager
from database import initialize_database
from schemas import MeterHistoryInput
from services import handle_smart_meter_telemetry

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Self-heals table structures if the .db file is ever deleted
    initialize_database()  
    yield

app = FastAPI(lifespan=lifespan)

@app.get("/")
async def ping_server():
    return {"status": "online", "system": "NEA Smart Prepaid Grid Backend", "version": "1.0.0"}

@app.post("/api/v1/telemetry")
async def process_telemetry(data: MeterHistoryInput):
    # Hand the incoming data packet straight to the logic engine
    return handle_smart_meter_telemetry(data)