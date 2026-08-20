# How the system works

## System flow

```text
ESP32 firmware
   -> sends JSON telemetry
   -> FastAPI backend
   -> validates meter + account
   -> reads/writes SQLite account data
   -> checks prepaid balance on Hardhat smart contract
   -> deducts energy cost from the meter wallet
   -> returns status and relay control
```

## Layer by layer

### 1) Firmware layer
The ESP32 firmware in `firmware/src/main.cpp` reads meter values and posts JSON like:

```json
{
  "device_id": "DHARAN-001",
  "load": 2.5,
  "energy": 1.0,
  "is_tampered": 0
}
```

It then reads the API response and decides whether to keep the relay closed or open the circuit.

### 2) Backend layer
The API in `backend/main.py` exposes a telemetry endpoint:

- `POST /api/v1/telemetry`

The logic in `backend/services.py` does the real processing:

- verifies the meter exists in SQLite
- checks if tampering is detected
- derives a wallet address from the meter ID
- ensures the wallet has a blockchain balance
- deducts the energy amount from the smart contract
- writes the updated balance and status back to SQLite

### 3) Blockchain layer
The Solidity contract in `blockchain/contracts/PrepaidGrid.sol` stores prepaid balances per wallet and exposes functions such as:

- `getBalance(address)`
- `fundAccount(...)` or equivalent funding flow
- `deductForConsumption(...)`
- `isBalanceZero(...)`

This is the trust layer for the prepaid model. The backend is effectively reading and updating balances stored on the local blockchain.

### 4) Local database layer
`backend/database.py` manages the SQLite record set for each meter account:

- account ID
- token balance
- monthly usage
- system status
- meter history log

The default demo account is `DHARAN-001`.

## Why the system is built this way

The design separates concerns:

- firmware handles physical sensing
- backend handles business rules and security checks
- blockchain stores the prepaid balance as an immutable ledger
- SQLite stores operational state and historical meter records
- mobile app gives a human-facing view of the system

## Expected behavior

- Normal usage: system remains live and returns `isolate_circuit: false`
- Empty balance: system disconnects the circuit and returns `isolate_circuit: true`
- Tamper detected: firmware reports tampering and the backend disconnects immediately

## Real-world interpretation

This is a local prototype for a prepaid energy grid. It demonstrates how a meter, backend logic, and smart contract can work together to enforce prepaid credits before power stays active.
