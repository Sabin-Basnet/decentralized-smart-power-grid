# Deployment Guide - Smart Prepaid Power Grid System

This guide covers various deployment scenarios: local development, Docker containerization, and cloud deployment.

---

## 📖 Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Docker Deployment](#docker-deployment)
3. [Production Deployment](#production-deployment)
4. [Blockchain Deployment (Testnet)](#blockchain-deployment-testnet)
5. [Troubleshooting](#troubleshooting)

---

## Local Development Setup

### Quick Start (Single Machine)

#### Prerequisites
- Node.js 16+
- Python 3.9+
- Git

#### Step 1: Clone Repository
```bash
git clone https://github.com/yourusername/smart-grid-root.git
cd smart-grid-root
```

#### Step 2: Run Setup Script

**On Linux/macOS:**
```bash
chmod +x setup.sh
./setup.sh
```

**On Windows (PowerShell):**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\setup.ps1
```

#### Step 3: Start All Services

Use four separate terminal windows:

**Terminal 1 - Blockchain Node:**
```bash
cd blockchain
npx hardhat node
```
*Output: 20 test accounts will be displayed*

**Terminal 2 - Smart Contract Deployment:**
```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```
*Output: Contract address (copy this!)*

**Terminal 3 - Backend API:**
```bash
cd backend
source venv/bin/activate  # Linux/macOS
# .\venv\Scripts\Activate.ps1  # Windows
python main.py
```
*Output: http://localhost:8000 with API docs*

**Terminal 4 - Frontend Dashboard:**
```bash
cd frontend
npm run dev
```
*Output: http://localhost:5173*

#### Step 4: Configure Backend for Blockchain

1. After deployment, copy the contract address from Terminal 2
2. Edit `backend/blockchain_bridge.py`:
   ```python
   CONTRACT_ADDRESS = "0x..."  # Paste here
   ```
3. Restart backend (Terminal 3)

#### Step 5: Hardware (ESP32)

1. Open Arduino IDE
2. Open `hardware/edge_node.ino`
3. Configure WiFi:
   ```cpp
   const char* SSID = "Your_WiFi_Name";
   const char* PASSWORD = "Your_WiFi_Pass";
   const char* BACKEND_URL = "http://YOUR_IP:8000/api/telemetry";
   ```
4. Select Board: ESP32 Dev Module
5. Upload to board

---

## Docker Deployment

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+

### Full Stack Deployment (Recommended)

#### Step 1: Clone and Navigate
```bash
git clone https://github.com/yourusername/smart-grid-root.git
cd smart-grid-root
```

#### Step 2: Build All Images
```bash
docker-compose build
```

#### Step 3: Start All Services
```bash
docker-compose up -d
```

#### Step 4: Verify Services
```bash
# Check running containers
docker-compose ps

# View logs
docker-compose logs -f backend    # Backend logs
docker-compose logs -f hardhat    # Blockchain logs
docker-compose logs -f frontend   # Frontend logs
```

#### Step 5: Access Services
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Hardhat Node:** http://localhost:8545

### Individual Container Deployment

#### Backend Only
```bash
cd backend
docker build -t smart-grid-backend .
docker run -p 8000:8000 -e DATABASE_URL=sqlite:///smart_grid.db smart-grid-backend
```

#### Blockchain Only
```bash
cd blockchain
docker build -t smart-grid-hardhat .
docker run -p 8545:8545 smart-grid-hardhat
```

#### Frontend Only
```bash
cd frontend
docker build -t smart-grid-frontend .
docker run -p 5173:5173 smart-grid-frontend
```

### Stopping Services
```bash
# Stop all running containers
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

---

## Production Deployment

### Backend (Production)

#### Using Gunicorn + Nginx

**Step 1: Install Gunicorn**
```bash
cd backend
pip install gunicorn
```

**Step 2: Create Systemd Service** (Linux)
```ini
# /etc/systemd/system/smart-grid-backend.service
[Unit]
Description=Smart Grid Backend Service
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/smart-grid-root/backend
Environment="PATH=/home/ubuntu/smart-grid-root/backend/venv/bin"
ExecStart=/home/ubuntu/smart-grid-root/backend/venv/bin/gunicorn -w 4 -b 0.0.0.0:8000 main:app

[Install]
WantedBy=multi-user.target
```

**Step 3: Configure Nginx**
```nginx
# /etc/nginx/sites-available/smart-grid-backend
upstream backend {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**Step 4: Enable and Start**
```bash
sudo systemctl enable smart-grid-backend
sudo systemctl start smart-grid-backend
```

### Frontend (Production)

#### Using Vercel (Recommended for React)

**Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

**Step 2: Deploy**
```bash
cd frontend
vercel deploy --prod
```

#### Alternative: Static Hosting (AWS S3 + CloudFront)

**Step 1: Build**
```bash
cd frontend
npm run build
```

**Step 2: Upload to S3**
```bash
aws s3 sync dist/ s3://your-bucket-name/
```

**Step 3: Invalidate CloudFront Cache**
```bash
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### Database (Production)

#### Switch to PostgreSQL

**Step 1: Update Backend**
```python
# backend/database.py
DATABASE_URL = "postgresql://user:password@db.example.com:5432/smart_grid_db"
```

**Step 2: Create Database**
```bash
createdb smart_grid_db
```

**Step 3: Run Migrations (if using Alembic)**
```bash
alembic upgrade head
```

---

## Blockchain Deployment (Testnet)

### Deploy to Ethereum Testnet (Sepolia)

#### Step 1: Get Test ETH
- Visit faucet: https://sepoliafaucet.com

#### Step 2: Configure Hardhat
```javascript
// blockchain/hardhat.config.js
module.exports = {
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
    }
  }
};
```

#### Step 3: Deploy Contract
```bash
cd blockchain
npx hardhat run scripts/deploy.js --network sepolia
```

#### Step 4: Update Backend
```python
# backend/blockchain_bridge.py
CONTRACT_ADDRESS = "0x..."  # Deployed address
HARDHAT_RPC_URL = "https://sepolia.infura.io/v3/YOUR_INFURA_KEY"
```

### Verify Contract on Etherscan

```bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS
```

---

## SSL/TLS Configuration

### Generate Self-Signed Certificate (Development)
```bash
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365
```

### Nginx with SSL
```nginx
server {
    listen 443 ssl;
    server_name api.example.com;

    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;

    location / {
        proxy_pass http://backend;
    }
}
```

---

## Monitoring & Logging

### Backend Logs
```bash
# Using Gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 --access-logfile - --error-logfile - main:app
```

### System Monitoring
```bash
# CPU and Memory
docker stats

# Logs
docker-compose logs --tail=100 -f backend
```

### Database Backups
```bash
# SQLite
cp smart_grid.db smart_grid_backup_$(date +%Y%m%d).db

# PostgreSQL
pg_dump smart_grid_db > backup_$(date +%Y%m%d).sql
```

---

## Scaling Considerations

### Horizontal Scaling (Multiple Backend Instances)

**Using Docker Swarm:**
```bash
docker swarm init
docker stack deploy -c docker-compose.yml smart-grid
```

**Using Kubernetes:**
```bash
kubectl apply -f k8s-deployment.yaml
```

### Load Balancing
- Use Nginx, HAProxy, or AWS ALB in front of backend instances
- Implement session stickiness for WebSocket connections (if added later)

### Caching
```python
# Add Redis caching in backend
from redis import Redis
cache = Redis(host='localhost', port=6379, db=0)
```

---

## Troubleshooting

### Backend won't start
```bash
# Check logs
docker logs smart-grid-backend

# Check port
lsof -i :8000

# Check database permissions
chmod 644 smart_grid.db
```

### Frontend can't reach backend
```bash
# Check backend health
curl http://localhost:8000/api/health

# Update CORS if needed
# in main.py: allow_origins=["*"]
```

### Blockchain connection fails
```bash
# Check Hardhat node
curl http://127.0.0.1:8545 \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","id":1}'
```

### Database corruption
```bash
# Backup old database
mv smart_grid.db smart_grid.db.old

# Delete and recreate
python -c "from database import init_db; init_db()"
```

---

## Performance Tuning

### Backend
```python
# Add uvicorn workers
uvicorn main:app --workers 4 --loop uvloop
```

### Database
```python
# SQLAlchemy connection pooling
engine = create_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=40,
)
```

### Frontend
```bash
# Enable gzip compression in nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

---

## Security Checklist

- [ ] Use HTTPS/SSL in production
- [ ] Set strong database passwords
- [ ] Rotate private keys regularly
- [ ] Use environment variables for secrets
- [ ] Implement rate limiting on API endpoints
- [ ] Enable CORS only for known domains
- [ ] Regular security audits and dependency updates
- [ ] Monitor for suspicious activity

---

## Support

For issues during deployment, check:
1. Docker version: `docker --version`
2. Node version: `node --version`
3. Python version: `python --version`
4. Open an issue on GitHub with logs

---

**Last Updated:** June 2026
