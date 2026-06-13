# Smart Prepaid Power Grid System

**A Complete End-to-End IoT + Blockchain + ML + React Solution for Decentralized Electricity Distribution**

---

## 📋 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    React Dashboard (5173)                   │
│         Tailwind CSS + Recharts Real-Time Visualizations    │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP Fetch Polling
┌──────────────────────▼──────────────────────────────────────┐
│           FastAPI Backend (8000)                            │
│    ┌─────────────────────────────────────────────────┐      │
│    │ • Telemetry Ingestion Endpoint (/api/telemetry)│      │
│    │ • Balance Management APIs                       │      │
│    │ • ML Engine Integration                         │      │
│    │ • Dashboard Data Aggregation                    │      │
│    └─────────────────────────────────────────────────┘      │
│    ┌─────────────────────────────────────────────────┐      │
│    │ SQLAlchemy ORM + SQLite Database                │      │
│    │ • TelemetryLog (real-time sensor data)         │      │
│    │ • UserBalance (prepaid ledger)                 │      │
│    │ • AnomalyAlert (ML detections)                 │      │
│    └─────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
         │                           │
         │ HTTP POST                 │ Web3.py
         │ (2-sec interval)          │ (Event Listener)
┌────────▼─────┐          ┌──────────▼────────────────┐
│  ESP32 Edge  │          │   Blockchain Layer       │
│  Node        │          │   (Hardhat Local Node)   │
│              │          │                          │
│ • WiFi       │          │ Solidity Contract:       │
│ • Sensor     │          │ • Balance Deduction      │
│ • Relay      │          │ • Authorization Control  │
│ • JSON POST  │          │ • Anomaly-Triggered      │
│              │          │   Cutoff Events          │
└──────────────┘          └──────────────────────────┘

ML Engine (scikit-learn):
├── Isolation Forest    → Anomaly Detection (Theft Detection)
└── Linear Regression   → Consumption Forecasting + Hours Remaining Calc
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** >= 16.x
- **Python** >= 3.9
- **npm** or **yarn**
- **Hardhat CLI** (for blockchain)

### 1. Install All Dependencies

```bash
# From the smart-grid-root directory:
bash setup.sh
```

Or manually:

```bash
# Backend
cd backend
pip install -r requirements.txt

# Blockchain
cd ../blockchain
npm install

# Frontend
cd ../frontend
npm install
```

---

## ⚙️ Configuration

### Backend Setup (FastAPI)

Edit `backend/main.py` for custom settings:
- API host/port: `uvicorn.run(app, host="0.0.0.0", port=8000)`
- CORS origins: Update `allow_origins` in `CORSMiddleware`
- Database: `DATABASE_URL` in `database.py`

### Blockchain Setup (Hardhat)

1. Start a local Hardhat node:
   ```bash
   cd blockchain
   npx hardhat node
   ```
   This will output 20 test accounts. Use one for contract deployment.

2. Deploy the contract:
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```
   Copy the deployed contract address.

3. Update `backend/blockchain_bridge.py`:
   ```python
   CONTRACT_ADDRESS = "0x..."  # Paste deployed address
   CONTRACT_ABI = [...]  # Load from artifacts/contracts/PrepaidGrid.sol/PrepaidGrid.json
   ```

### Hardware Setup (ESP32)

1. Install **Arduino IDE** or **PlatformIO**
2. Install ESP32 board support (in Arduino IDE: Tools → Board Manager → Search "ESP32")
3. Open `hardware/edge_node.ino`
4. Update WiFi credentials:
   ```cpp
   const char* SSID = "YOUR_WIFI_SSID";
   const char* PASSWORD = "YOUR_WIFI_PASSWORD";
   const char* BACKEND_URL = "http://192.168.1.X:8000/api/telemetry";
   ```
5. Upload to ESP32 board

### Frontend Setup (React + Vite)

Frontend is pre-configured. Just run:
```bash
cd frontend
npm run dev
```
Access at `http://localhost:5173`

---

## 🔄 Running the Complete System

### Terminal 1: Start Blockchain Node
```bash
cd smart-grid-root/blockchain
npx hardhat node
```
*Keep this running — listens on http://127.0.0.1:8545*

### Terminal 2: Deploy Contract & Start Event Listener
```bash
cd smart-grid-root/blockchain
npx hardhat run scripts/deploy.js --network localhost
```

### Terminal 3: Start FastAPI Backend
```bash
cd smart-grid-root/backend
python main.py
```
*API available at http://localhost:8000*
*Interactive docs: http://localhost:8000/docs*

### Terminal 4: Start React Frontend
```bash
cd smart-grid-root/frontend
npm run dev
```
*Dashboard at http://localhost:5173*

### Terminal 5: Power Up ESP32 Hardware
- Connect ESP32 to USB and ensure proper serial drivers are installed
- Upload `hardware/edge_node.ino` sketch
- Edge node will automatically start sending telemetry every 2 seconds

---

## 📡 API Endpoints

### Telemetry
- **POST** `/api/telemetry` — Submit sensor data from edge node
  ```json
  {
    "device_id": "ESP32_GRID_NODE_001",
    "timestamp": "2026-06-13T15:30:45Z",
    "power_consumption_kw": 3.5,
    "load_percentage": 35.2,
    "relay_status": "ACTIVE",
    "authorization_flag": true
  }
  ```

- **GET** `/api/telemetry/latest?device_id=...&limit=50` — Fetch recent telemetry

### Balance Management
- **GET** `/api/balance/{wallet_address}` — Get user balance
- **POST** `/api/balance/update` — Update balance (called by blockchain listener)

### ML Engine
- **GET** `/api/ml/stats` — Get current ML buffer statistics
- **GET** `/api/ml/forecast?hours=24` — Forecast next 24 hours of consumption

### Dashboard
- **GET** `/api/dashboard/data?wallet_address=...` — Complete dashboard payload

### Health
- **GET** `/api/health` — System status
- **GET** `/` — API info

---

## 🧠 ML Engine Details

### Isolation Forest (Anomaly Detection)
- **Purpose:** Detect non-linear consumption patterns indicating theft or malfunction
- **Window:** Last 100 samples
- **Contamination:** 5% (expects ~5% anomalies)
- **Threshold:** Automatic based on deviation from recent average

### Linear Regression (Forecasting)
- **Purpose:** Predict consumption for next 24 hours
- **Input:** Historical consumption rate (kW)
- **Output:** Hourly consumption forecast + "Hours Remaining" calculation
- **Formula:** `Hours Remaining = Balance (tokens) / Avg Consumption Rate (kW)`

---

## 🔐 Smart Contract Functions

### User Functions
- `purchaseTokens(uint256 _amount)` — Buy prepaid tokens
- `getBalance(address _wallet)` → uint256
- `checkAuthorization(address _wallet)` → bool

### Admin Functions
- `deductBalance(address _wallet, uint256 _amount)` — Called by backend for consumption billing
- `triggerAnomalyCutoff(address _wallet, string memory _anomalyType, uint256 _anomalyScore)` — Disconnect user on anomaly
- `clearAnomalyAndReauthorize(address _wallet, uint256 _newBalance)` — Manual override
- `reauthorizeUser(address _wallet)` / `deauthorizeUser(address _wallet)` — Auth management

### Events
- `TokensPurchased(address indexed wallet, uint256 amount, uint256 timestamp)`
- `ConsumptionDeducted(address indexed wallet, uint256 amount, uint256 remainingBalance, uint256 timestamp)`
- **`CutoffTriggered(address indexed wallet_address, string reason, uint256 timestamp)`** ← Listened by backend
- `AnomalyDetected(address indexed wallet, string anomalyType, uint256 anomalyScore, uint256 timestamp)`

---

## 📊 Database Schema

### TelemetryLog
| Column | Type | Purpose |
|--------|------|---------|
| id | Integer | Primary key |
| device_id | String | Edge node identifier |
| timestamp | DateTime | Sensor timestamp (UTC) |
| power_consumption_kw | Float | Current power (kW) |
| load_percentage | Float | Load % (0-100) |
| relay_status | String | "ACTIVE" or "DISCONNECTED" |
| authorization_flag | Boolean | Current auth state |
| is_anomalous | Boolean | ML anomaly flag |
| hours_remaining | Float | Calculated hours until cutoff |
| anomaly_score | Float | Anomaly severity (-1 to 1) |

### UserBalance
| Column | Type | Purpose |
|--------|------|---------|
| id | Integer | Primary key |
| wallet_address | String (unique) | User's blockchain address |
| balance_tokens | Float | Prepaid token balance |
| is_authorized | Boolean | Current authorization |
| last_updated | DateTime | Last balance update |
| tx_hash | String | Blockchain tx reference |

### AnomalyAlert
| Column | Type | Purpose |
|--------|------|---------|
| id | Integer | Primary key |
| device_id | String | Device reporting anomaly |
| wallet_address | String | User wallet |
| anomaly_type | String | "THEFT", "MALFUNCTION", etc. |
| severity | String | "LOW", "MEDIUM", "HIGH" |
| anomaly_score | Float | Numerical score |
| resolved | Boolean | Investigation status |
| action_taken | String | Admin action taken |

---

## 🎨 Frontend Features

### Real-Time Dashboard
- **Status Banner:** Color-coded (Green=Normal, Yellow=Anomalous, Red=Disconnected)
- **KPI Cards:** Current Load, Balance, Time Remaining, Anomaly Score
- **Consumption Chart:** Last 50 telemetry points (Line chart via Recharts)
- **Forecast Chart:** 24-hour consumption prediction
- **Recent Alerts:** Last 5 anomaly detections with severity badges
- **System Statistics:** Mean, Std Dev, Total Samples, Refresh Rate

### Styling
- **Tailwind CSS:** Utility-first responsive design
- **Color Scheme:** Dark slate with blue/cyan accents
- **Animations:** Smooth transitions, loading spinners
- **Responsive:** Mobile, tablet, desktop layouts

---

## 🧪 Testing

### Backend Health Check
```bash
curl http://localhost:8000/api/health
```

### Submit Test Telemetry
```bash
curl -X POST http://localhost:8000/api/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "ESP32_GRID_NODE_001",
    "timestamp": "2026-06-13T15:30:45Z",
    "power_consumption_kw": 2.5,
    "load_percentage": 25,
    "relay_status": "ACTIVE",
    "authorization_flag": true
  }'
```

### Blockchain Contract Interaction
```bash
cd blockchain
npx hardhat console --network localhost

# Inside console:
const PrepaidGrid = await ethers.getContractFactory("PrepaidGrid");
const contract = await PrepaidGrid.attach("0x...");
await contract.purchaseTokens({ value: ethers.utils.parseEther("10") });
```

---

## 📁 File Structure

```
smart-grid-root/
├── hardware/
│   └── edge_node.ino                 # ESP32 C++ sketch
├── backend/
│   ├── main.py                       # FastAPI server
│   ├── database.py                   # SQLAlchemy setup
│   ├── models.py                     # ORM models
│   ├── ml_engine.py                  # ML pipeline (Isolation Forest + Linear Regression)
│   ├── blockchain_bridge.py          # Web3.py contract interaction
│   ├── requirements.txt              # Python dependencies
│   └── smart_grid.db                 # SQLite database (auto-created)
├── blockchain/
│   ├── contracts/
│   │   └── PrepaidGrid.sol           # Smart contract
│   ├── hardhat.config.js             # Hardhat configuration
│   ├── package.json                  # npm dependencies
│   └── artifacts/                    # Compiled contracts (auto-generated)
├── frontend/
│   ├── src/
│   │   ├── App.jsx                   # Main React component
│   │   ├── DashboardCharts.jsx       # Recharts visualization
│   │   ├── main.jsx                  # React entry
│   │   └── index.css                 # Tailwind styles
│   ├── index.html                    # HTML template
│   ├── package.json                  # npm dependencies
│   ├── vite.config.js                # Vite bundler config
│   ├── tailwind.config.js            # Tailwind configuration
│   └── postcss.config.js             # PostCSS configuration
├── setup.sh                          # Automated setup script (Linux/Mac)
├── setup.ps1                         # Automated setup script (Windows)
└── README.md                         # This file
```

---

## 🔧 Troubleshooting

### Backend won't start
- Check port 8000 not in use: `netstat -an | grep 8000`
- Ensure Python 3.9+: `python --version`
- Install dependencies: `pip install -r requirements.txt`

### Frontend blank/errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Check backend is running: `curl http://localhost:8000/api/health`
- Browser console shows CORS errors? Update `allow_origins` in FastAPI

### Blockchain connection issues
- Hardhat node running? Check `http://127.0.0.1:8545` is accessible
- Contract address wrong? Re-deploy and copy address
- Out of test accounts? Restart Hardhat node for fresh accounts

### ESP32 not connecting
- Check WiFi credentials in code
- Verify backend URL is correct (use actual IP, not localhost)
- Monitor serial output (9600 baud) for debug messages

---

## 📝 Production Deployment

### Backend
```bash
# Use Gunicorn + Nginx reverse proxy
gunicorn -w 4 -b 0.0.0.0:8000 backend.main:app
```

### Blockchain
```bash
# Deploy to Ethereum testnet (Goerli, Sepolia) or mainnet
# Update hardhat.config.js with RPC endpoints
npx hardhat run scripts/deploy.js --network goerli
```

### Frontend
```bash
# Build production bundle
npm run build
# Deploy dist/ to CDN or static hosting
```

---

## 📚 References

- **FastAPI:** https://fastapi.tiangolo.com/
- **Solidity:** https://docs.soliditylang.org/
- **Hardhat:** https://hardhat.org/
- **Web3.py:** https://web3py.readthedocs.io/
- **scikit-learn:** https://scikit-learn.org/
- **React:** https://react.dev/
- **Recharts:** https://recharts.org/
- **Tailwind CSS:** https://tailwindcss.com/

---

## 📄 License

This project is provided as-is for educational and commercial purposes.

---

## 👨‍💼 Support & Contact

For issues, questions, or contributions, please open an issue on GitHub or contact the development team.

---

**Last Updated:** June 2026  
**Version:** 1.0.0  
**Status:** Production-Ready
