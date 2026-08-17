# Running the project

This file explains how to start the system in the correct order.

## 1) Install Python dependencies

Use Python 3.11 for compatibility with the web3 stack.

```bash
conda create --name myenv python=3.11 -y
conda activate myenv
pip install -r requirements.txt
```

## 2) Install blockchain dependencies

From the repository root:

```bash
cd blockchain
npm install
```

## 3) Start the local blockchain node

```bash
cd blockchain
npx hardhat node --hostname 127.0.0.1 --port 8545
```

Keep this terminal open.

## 4) Deploy the smart contract

Open a second terminal:

```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```

This creates the deployed contract address and writes the ABI and deployment metadata used by the backend.

## 5) Start the backend

Open a third terminal:

```bash
conda activate myenv
cd <project-root>
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

You should be able to open:

- `http://127.0.0.1:8000/` for the health check
- `http://127.0.0.1:8000/docs` for the FastAPI Swagger UI

## 6) Start the React web app

Open a fourth terminal:

```bash
cd web-app
npm install
npm run dev -- --host 0.0.0.0
```

Then open the local Vite address shown in the terminal, usually:

```text
http://localhost:5173
```

This web app is the main testing interface. It can send telemetry directly to the backend and shows the client/provider view without needing the Expo mobile app.

## 7) Test telemetry manually from the browser

Use the form in the web dashboard to submit a payload like:

```json
{
  "device_id": "NEA-KTM-001",
  "load": 2.5,
  "energy": 1.0,
  "is_tampered": 0
}
```

Example success response:

```json
{
  "device_id": "NEA-KTM-001",
  "command": "KEEP_ALIVE",
  "reason": "All systems normal",
  "remaining_balance": 98.0,
  "isolate_circuit": false
}
```

## 8) Optional: run the mobile app

This project still contains the Expo app, but it is not required for testing. If you want to run it anyway:

```bash
cd mobile-app
npm install
npm run dev
```

## 9) Run the firmware

For the ESP32 firmware, open the project in PlatformIO and upload the firmware from:

```text
firmware/
```

The firmware sends telemetry to the backend and reacts to the `isolate_circuit` field by toggling the relay.

## Common issue

If you see a web3 or Ethereum wallet error, make sure you are using Python 3.11 and the project dependencies installed from `requirements.txt`.
