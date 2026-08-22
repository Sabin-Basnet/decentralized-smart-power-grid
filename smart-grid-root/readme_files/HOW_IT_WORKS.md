# How the system works

This repository is a local prototype of a prepaid smart electricity grid. The Wokwi ESP32 simulator sends meter readings to a FastAPI service. The service validates the meter, updates SQLite, and uses a local Hardhat smart contract to deduct prepaid credit before telling the firmware whether to keep the relay active.

## System flow

```text
Wokwi ESP32 firmware
   -> JSON telemetry every 3 seconds
   -> POST /api/v1/telemetry
   -> FastAPI validates the meter in SQLite
   -> tamper check and current-differential analysis
   -> PowerGrid contract reads/funds/deducts meter credit
   -> SQLite account and meter history are updated
   -> response contains KEEP_ALIVE or DISCONNECT
   -> firmware keeps the relay closed or opens it
```

## Layer by layer

### 1) Firmware layer

The firmware in `firmware/src/main.cpp` connects to the Wokwi `Wokwi-GUEST` network and posts telemetry to `http://host.wokwi.internal:8000/api/v1/telemetry` every three seconds. It reads:

- phase input on GPIO 34
- tamper switch on GPIO 25
- relay control on GPIO 27

The phase reading is converted to a simulated load between 0 and 5, and energy is calculated as `load * 0.25`. The normal payload is:

```json
{
  "device_id": "DHARAN-001",
  "load": 2.5,
  "energy": 0.625,
  "is_tampered": 0
}
```

When the tamper switch is active, the firmware sends `is_tampered: 1` and sets load and energy to zero. A response with `isolate_circuit: true` sets the relay LOW, opening the circuit; otherwise the relay remains HIGH.

### 2) Backend API and processing

`backend/main.py` starts the FastAPI application, initializes and seeds SQLite, and exposes:

- `GET /` - health check
- `GET /api/v1/dashboard` - dashboard data for the web app
- `POST /api/v1/telemetry` - meter telemetry processing

`backend/services.py` handles telemetry as follows:

1. It validates the request with the `MeterHistoryInput` schema. Both `device_id` and the compatibility alias `account_id` are accepted.
2. It looks up the meter in SQLite. An unknown meter returns HTTP 404.
3. A tampered reading immediately updates the account to `TAMPER_DETECTED`, records the reading, and returns `DISCONNECT` without performing a blockchain deduction.
4. For normal readings, it derives a deterministic Ethereum address from the meter ID using `keccak(device_id)` and uses the final 20 bytes as the meter wallet.
5. It connects to the local Hardhat node, funds a zero-balance meter wallet with 100 contract units when needed, and deducts `max(1, ceil(energy))` units through the contract owner account.
6. It reads the remaining contract balance, updates the local account balance and monthly energy total, and records meter history.
7. It returns `KEEP_ALIVE` when credit remains or `DISCONNECT` when the contract reports a zero balance.

The backend also classifies a current mismatch as an anomaly when the absolute difference between line and neutral current is greater than `0.2` amps. The result is included in the response as `anomaly` and `theft_flag`; in the current implementation this classification does not itself trigger a relay disconnect.

### 3) Blockchain layer

The active deployment path is `blockchain/contracts/PowerGrid.sol`. `blockchain/scripts/deploy.js` deploys `PowerGrid`, writes its address to `blockchain/deployment.json`, and writes its ABI to `blockchain/contract-abi.json`.

`PowerGrid` stores a private prepaid balance for each meter wallet and exposes the functions used by the backend:

- `fundAccount(address, amount)` - owner-only crediting used for the demo bootstrap
- `getBalance(address)` - reads the meter balance
- `deductForConsumption(address, amount)` - owner-only deduction; insufficient credit sets the balance to zero
- `isBalanceZero(address)` - checks whether the meter should be isolated

`blockchain/contracts/PrepaidGrid.sol` is a separate, more extensive contract source with purchase, authorization, and anomaly-cutoff features. It is not the contract selected by the current deployment script.

### 4) Local database layer

`backend/database.py` stores data in `backend_data.db` with three tables:

- `users` - demo client/provider credentials and roles
- `Accounts` - meter ID, owner, token balance, monthly units, and system status
- `Meter_History` - timestamped load, neutral load, mismatch, and tamper values

On startup, the backend seeds meter `DHARAN-001` with a local balance of `320.0` and status `ACTIVE`. The demo profile represents Ram Thapa in Dharan.

## Dashboard clients

The primary human-facing interface is the React Vite app in `web-app/`. It polls `GET /api/v1/dashboard` every 30 seconds and provides separate client and provider routes behind demo authentication. If the backend is unavailable, it switches to a deterministic Dharan dataset and labels the interface as demo mode. The Expo project in `mobile-app/` is an optional mobile UI and is not required for the main local workflow.

## Current behavior

- Normal telemetry with remaining credit returns `KEEP_ALIVE` and `isolate_circuit: false`.
- A tamper signal returns `DISCONNECT`, marks the account `TAMPER_DETECTED`, and isolates the relay immediately.
- A zero contract balance returns `DISCONNECT`, marks the account `OUT_OF_CREDIT`, and isolates the relay. Because the backend automatically funds a zero-balance wallet with 100 units before deduction, this path is primarily relevant when the funding step is unavailable or the deployed contract state differs from the demo setup.
- Current-differential anomalies are reported for analysis but do not currently call the contract's anomaly-cutoff functions.

## Real-world interpretation

This is a local demonstration system, not a production utility deployment. It shows how simulated sensing, API validation, local operational storage, prepaid blockchain credit, anomaly analysis, and relay control can be connected into one workflow. See `RUNNING.md` for the startup order and local test commands.
