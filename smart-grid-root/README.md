# Decentralized Smart Power Grid

This project simulates a prepaid smart electricity system with four connected layers:

- A smart meter / firmware layer running on ESP32-style hardware
- A FastAPI backend for validation and processing
- A local blockchain (Hardhat + Solidity) for prepaid credit deduction
- A React web dashboard connected to the API, with deterministic fallback demo data

## Project layout

- `backend/` — FastAPI service, SQLite logic, telemetry processing
- `ML_README.md` — ML models, features, runtime usage, and limitations
- `blockchain/` — Solidity smart contract and Hardhat deployment/test setup
- `firmware/` — ESP32 firmware that posts meter telemetry
- `mobile-app/` — optional Expo mobile UI
- `web-app/` — primary React web dashboard for local testing
- `requirements.txt` — Python dependencies for the backend

## How it works

1. The Wokwi ESP32 simulator connects to `Wokwi-GUEST`, reads the phase and tamper inputs, and sends a JSON telemetry packet every three seconds.
2. Wokwi routes `host.wokwi.internal` to the computer running FastAPI. The backend validates the meter, stores the reading, and runs the prepaid-grid business logic.
3. When blockchain services are available, the backend checks the meter wallet and deducts the energy cost. An empty balance or tamper condition returns `isolate_circuit: true`.
4. The firmware uses that response to open or keep closed its relay. Its serial monitor shows the request and safety decision.
5. The React web dashboard requests `/api/v1/dashboard` and displays the live users, load, balance, telemetry state, and provider/client views. When the API is offline, it clearly labels its stable Dharan demo dataset.

The default demo client is **Ram Thapa**, meter `DHARAN-001`, located at Putali Line, Dharan-8.

## Main files

- `backend/main.py` — API startup, CORS policy, dashboard, and telemetry endpoints
- `backend/services.py` — business logic and blockchain deduction
- `backend/database.py` — SQLite account and meter history storage
- `blockchain/contracts/PrepaidGrid.sol` — prepaid energy smart contract
- `firmware/src/main.cpp` — ESP32 telemetry and relay logic
- `web-app/src/App.jsx` — React test dashboard interface

## Data flow

```text
Wokwi ESP32 -> POST /api/v1/telemetry -> FastAPI -> SQLite + Hardhat contract
											|
											+-> GET /api/v1/dashboard -> React web app
```

The API allows the Vite development origins (`localhost:5173` and `127.0.0.1:5173`) so browser `OPTIONS` preflight requests are handled before `GET` and `POST` calls.

## Recommended local workflow

Use the React web app as the main testing interface. It is independent of the Expo mobile project and makes it easy to test the backend and blockchain flow from the browser.

See [RUNNING.md](RUNNING.md) for the full setup sequence.

See [ML_README.md](ML_README.md) for the machine-learning implementation, including the usage baseline, hours-remaining forecast, and current-differential anomaly rule.

## Notes

- This is a local demo system, not a production utility deployment.
- The blockchain runs locally on Hardhat.
- The backend expects a local Hardhat node at `http://127.0.0.1:8545`.
- A default Dharan meter account is seeded in SQLite as `DHARAN-001` for Ram Thapa.
