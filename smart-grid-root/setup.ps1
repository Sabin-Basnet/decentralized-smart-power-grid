# Smart Grid Root - Setup Script for Windows PowerShell
# This script automates the installation of all dependencies and project setup

# Error handling
$ErrorActionPreference = "Stop"

# Color functions
function Write-Header {
    param([string]$Message)
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

# Check prerequisites
function Check-Prerequisites {
    Write-Header "Checking Prerequisites"
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Success "Node.js installed: $nodeVersion"
    }
    catch {
        Write-Error "Node.js not found. Please install Node.js >= 16.x from https://nodejs.org"
        exit 1
    }
    
    # Check npm
    try {
        $npmVersion = npm --version
        Write-Success "npm installed: $npmVersion"
    }
    catch {
        Write-Error "npm not found. Please install npm"
        exit 1
    }
    
    # Check Python
    try {
        $pythonVersion = python --version
        Write-Success "Python installed: $pythonVersion"
    }
    catch {
        Write-Error "Python not found. Please install Python >= 3.9 from https://python.org"
        exit 1
    }
    
    # Check pip
    try {
        pip --version | Out-Null
        Write-Success "pip found"
    }
    catch {
        Write-Error "pip not found. Please install pip"
        exit 1
    }
}

# Setup Backend
function Setup-Backend {
    Write-Header "Setting Up Backend (FastAPI + SQLAlchemy + ML Engine)"
    
    Push-Location backend
    
    # Create virtual environment
    if (!(Test-Path "venv")) {
        Write-Warning "Creating Python virtual environment..."
        python -m venv venv
    }
    
    # Activate virtual environment
    & ".\venv\Scripts\Activate.ps1"
    Write-Success "Virtual environment activated"
    
    # Upgrade pip
    python -m pip install --upgrade pip
    
    # Install requirements
    Write-Warning "Installing Python dependencies from requirements.txt..."
    pip install -r requirements.txt
    Write-Success "Backend dependencies installed"
    
    Pop-Location
}

# Setup Blockchain
function Setup-Blockchain {
    Write-Header "Setting Up Blockchain (Hardhat + Solidity)"
    
    Push-Location blockchain
    
    Write-Warning "Installing blockchain dependencies..."
    npm install
    Write-Success "Blockchain dependencies installed"
    
    # Compile contracts
    Write-Warning "Compiling Solidity contracts..."
    npx hardhat compile
    Write-Success "Smart contracts compiled"
    
    Pop-Location
}

# Setup Frontend
function Setup-Frontend {
    Write-Header "Setting Up Frontend (React + Vite + Tailwind)"
    
    Push-Location frontend
    
    Write-Warning "Installing frontend dependencies..."
    npm install
    Write-Success "Frontend dependencies installed"
    
    Pop-Location
}

# Main execution
function Main {
    Clear-Host
    Write-Host @"
  _____ _   _ __     __      _    __ ___   ___ ___       _    ___ ____  
 / ___/| \_/ /  \   / /\    / |  / /|  _ \|  _ )  _ \   / \  / _//  __) 
\___ \|     / _/  \/  /<_>  | |_/ / | | ) | / / | | |  / /) ( (_  \__ \ 
/____/|_|\_\__/   /  /\     |__  /  | |_/ | |_\ |_| | /__/  \___)/____)

    Smart Prepaid Power Grid - Complete Setup Script
"@ -ForegroundColor Cyan
    
    Write-Header "Starting Installation"
    
    # Check prerequisites
    Check-Prerequisites
    
    # Setup each component
    Setup-Backend
    Setup-Blockchain
    Setup-Frontend
    
    # Success message
    Write-Header "Installation Complete!"
    
    Write-Host @"
✓ All components successfully installed!

Next steps:

1. Start the Blockchain Node (PowerShell 1):
   cd blockchain
   npx hardhat node

2. Deploy Smart Contract (PowerShell 2):
   cd blockchain
   npx hardhat run scripts/deploy.js --network localhost

3. Start FastAPI Backend (PowerShell 3):
   cd backend
   .\venv\Scripts\Activate.ps1
   python main.py

4. Start React Frontend (PowerShell 4):
   cd frontend
   npm run dev

5. Upload ESP32 Hardware Sketch:
   - Open hardware/edge_node.ino in Arduino IDE
   - Configure WiFi credentials
   - Upload to your ESP32 board

API Documentation: http://localhost:8000/docs
Dashboard: http://localhost:5173

For more information, see README.md
"@ -ForegroundColor Green
}

# Run main
Main
