# Quick Start Guide - Smart Prepaid Power Grid System

**Get up and running in 5 minutes!**

---

## 🚀 Prerequisites

- Node.js 16+ ([Download](https://nodejs.org/))
- Python 3.9+ ([Download](https://python.org/))
- Git ([Download](https://git-scm.com/))

---

## 📦 Installation

### Option 1: Automated Setup (Recommended)

**Linux/macOS:**
```bash
./setup.sh
```

**Windows (PowerShell as Admin):**
```powershell
.\setup.ps1
```

### Option 2: Manual Setup

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

## 🏃 Running the System

Open **4 terminal windows** and run these commands:

### Terminal 1: Start Blockchain Node
```bash
cd blockchain
npx hardhat node
```
📌 **Copy the accounts displayed here!**

### Terminal 2: Deploy Smart Contract
```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```
📌 **Copy the contract address from the output!**

### Terminal 3: Start Backend API
```bash
cd backend
source venv/bin/activate  # macOS/Linux
# .\venv\Scripts\Activate.ps1  # Windows
python main.py
```
✅ **API running on http://localhost:8000**

### Terminal 4: Start React Dashboard
```bash
cd frontend
npm run dev
```
✅ **Dashboard available on http://localhost:5173**

---

## 🔧 Configuration

### 1. Update Backend for Blockchain

Edit `backend/blockchain_bridge.py`:

```python
CONTRACT_ADDRESS = "0x..."  # Paste address from Terminal 2
```

Restart backend (stop and rerun in Terminal 3)

### 2. Setup ESP32 Hardware

1. Install [Arduino IDE](https://www.arduino.cc/en/software)
2. Add ESP32 board support: Tools → Board Manager → Search "ESP32"
3. Open `hardware/edge_node.ino`
4. Update WiFi credentials:
   ```cpp
   const char* SSID = "Your_Network";
   const char* PASSWORD = "Your_Password";
   const char* BACKEND_URL = "http://192.168.1.X:8000/api/telemetry";
   ```
5. Upload to board

---

## 📊 Verify Everything Works

### Check Backend Health
```bash
curl http://localhost:8000/api/health
```

### Send Test Data
```bash
curl -X POST http://localhost:8000/api/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "TEST_NODE",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "power_consumption_kw": 2.5,
    "load_percentage": 25,
    "relay_status": "ACTIVE",
    "authorization_flag": true
  }'
```

### Access Dashboard
Open: http://localhost:5173

---

## 📚 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/telemetry` | POST | Submit sensor data |
| `/api/dashboard/data` | GET | Get dashboard payload |
| `/api/balance/{wallet}` | GET | Get user balance |
| `/api/ml/forecast` | GET | 24-hour forecast |
| `/api/health` | GET | System status |
| `/docs` | GET | Swagger UI |

---

## 🧪 Testing

### Test Anomaly Detection
```bash
# This will trigger anomaly detection due to high consumption
curl -X POST http://localhost:8000/api/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "TEST_NODE",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "power_consumption_kw": 50.0,
    "load_percentage": 100,
    "relay_status": "ACTIVE",
    "authorization_flag": true
  }'
```

### Check Anomalies
```bash
curl http://localhost:8000/api/dashboard/data | python -m json.tool
```

---

## 🐳 Using Docker (Alternative)

```bash
# Build and start all services
docker-compose up

# Stop all services
docker-compose down
```

Access:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Blockchain: http://localhost:8545

---

## ❌ Troubleshooting

### Backend won't start
```bash
# Check if port 8000 is free
lsof -i :8000

# Check Python version
python --version  # Should be 3.9+
```

### Frontend blank
```bash
# Check backend is running
curl http://localhost:8000/api/health

# Clear cache
rm -rf frontend/node_modules
npm install
```

### Blockchain issues
```bash
# Verify Hardhat running
curl http://127.0.0.1:8545

# Restart node
# Kill Terminal 1 and restart
```

---

## 📖 Documentation

- **Full README:** [README.md](README.md)
- **Deployment Guide:** [DEPLOYMENT.md](DEPLOYMENT.md)
- **API Docs:** http://localhost:8000/docs (when running)

---

## 🎯 Next Steps

1. ✅ Get it running
2. 📊 Explore the dashboard
3. 🔬 Send test data from curl
4. 📱 Upload sketch to ESP32
5. 🚀 Customize for your use case

---

**Questions?** Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed guides.

**Last Updated:** June 2026
