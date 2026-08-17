# Decentralized Smart Power Grid

This project simulates a prepaid smart electricity system with four connected layers:

- A smart meter / firmware layer running on ESP32-style hardware
- A FastAPI backend for validation and processing
- A local blockchain (Hardhat + Solidity) for prepaid credit deduction
- A React web dashboard for easier local testing and demo use

## Project layout

- `backend/` — FastAPI service, SQLite logic, telemetry processing
- `blockchain/` — Solidity smart contract and Hardhat deployment/test setup
- `firmware/` — ESP32 firmware that posts meter telemetry
- `mobile-app/` — optional Expo mobile UI
- `web-app/` — primary React web dashboard for local testing
- `requirements.txt` — Python dependencies for the backend

## What this system does

1. The ESP32 firmware reads a phase load and sends telemetry to the backend.
2. The FastAPI API validates the meter ID and checks the local SQLite account.
3. The backend derives a per-meter blockchain wallet and checks the prepaid balance on-chain.
4. If the balance is sufficient, it deducts the energy cost from the smart contract.
5. If the balance is empty, the system marks the circuit as isolated and prevents further use.
6. The React web dashboard shows live status, form-based telemetry testing, and the provider/client view.

## Main files

- `backend/main.py` — API startup and telemetry endpoint
- `backend/services.py` — business logic and blockchain deduction
- `backend/database.py` — SQLite account and meter history storage
- `blockchain/contracts/PrepaidGrid.sol` — prepaid energy smart contract
- `firmware/src/main.cpp` — ESP32 telemetry and relay logic
- `web-app/src/App.jsx` — React test dashboard interface

## Recommended local workflow

Use the React web app as the main testing interface. It is independent of the Expo mobile project and makes it easy to test the backend and blockchain flow from the browser.

See [RUNNING.md](RUNNING.md) for the full setup sequence.

## Notes

- This is a local demo system, not a production utility deployment.
- The blockchain runs locally on Hardhat.
- The backend expects a local Hardhat node at `http://127.0.0.1:8545`.
- A default demo meter account is seeded in SQLite as `NEA-KTM-001`.
