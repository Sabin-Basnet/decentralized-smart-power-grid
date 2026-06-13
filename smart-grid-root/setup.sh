#!/bin/bash

# Smart Grid Root - Setup Script for Linux/macOS
# This script automates the installation of all dependencies and project setup

set -e  # Exit on any error

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js installed: $NODE_VERSION"
    else
        print_error "Node.js not found. Please install Node.js >= 16.x"
        exit 1
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm installed: $NPM_VERSION"
    else
        print_error "npm not found. Please install npm"
        exit 1
    fi
    
    # Check Python
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version)
        print_success "Python installed: $PYTHON_VERSION"
    else
        print_error "Python3 not found. Please install Python >= 3.9"
        exit 1
    fi
    
    # Check pip
    if command -v pip3 &> /dev/null; then
        print_success "pip3 found"
    else
        print_error "pip3 not found. Please install pip3"
        exit 1
    fi
}

# Setup Backend
setup_backend() {
    print_header "Setting Up Backend (FastAPI + SQLAlchemy + ML Engine)"
    
    cd backend
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        print_warning "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    print_success "Virtual environment activated"
    
    # Upgrade pip
    pip install --upgrade pip
    
    # Install requirements
    print_warning "Installing Python dependencies from requirements.txt..."
    pip install -r requirements.txt
    print_success "Backend dependencies installed"
    
    cd ..
}

# Setup Blockchain
setup_blockchain() {
    print_header "Setting Up Blockchain (Hardhat + Solidity)"
    
    cd blockchain
    
    print_warning "Installing blockchain dependencies..."
    npm install
    print_success "Blockchain dependencies installed"
    
    # Compile contracts
    print_warning "Compiling Solidity contracts..."
    npx hardhat compile
    print_success "Smart contracts compiled"
    
    cd ..
}

# Setup Frontend
setup_frontend() {
    print_header "Setting Up Frontend (React + Vite + Tailwind)"
    
    cd frontend
    
    print_warning "Installing frontend dependencies..."
    npm install
    print_success "Frontend dependencies installed"
    
    cd ..
}

# Main execution
main() {
    clear
    echo -e "${BLUE}"
    cat << "EOF"
  _____ _   _ __     __      _    __ ___   ___ ___       _    ___ ____  
 / ___/| \_/ /  \   / /\    / |  / /|  _ \|  _ )  _ \   / \  / _//  __) 
\___ \|     / _/  \/  /<_>  | |_/ / | | ) | / / | | |  / /) ( (_  \__ \ 
/____/|_|\_\__/   /  /\     |__  /  | |_/ | |_\ |_| | /__/  \___)/____)
                                                                         
    Smart Prepaid Power Grid - Complete Setup Script
EOF
    echo -e "${NC}"
    
    print_header "Starting Installation"
    
    # Check prerequisites
    check_prerequisites
    
    # Setup each component
    setup_backend
    setup_blockchain
    setup_frontend
    
    # Success message
    print_header "Installation Complete!"
    
    echo -e "${GREEN}"
    cat << "EOF"
✓ All components successfully installed!

Next steps:

1. Start the Blockchain Node (Terminal 1):
   cd smart-grid-root/blockchain
   npx hardhat node

2. Deploy Smart Contract (Terminal 2):
   cd smart-grid-root/blockchain
   npx hardhat run scripts/deploy.js --network localhost

3. Start FastAPI Backend (Terminal 3):
   cd smart-grid-root/backend
   source venv/bin/activate  # On Linux/macOS
   python main.py

4. Start React Frontend (Terminal 4):
   cd smart-grid-root/frontend
   npm run dev

5. Upload ESP32 Hardware Sketch:
   - Open hardware/edge_node.ino in Arduino IDE
   - Configure WiFi credentials
   - Upload to your ESP32 board

API Documentation: http://localhost:8000/docs
Dashboard: http://localhost:5173

For more information, see README.md
EOF
    echo -e "${NC}"
}

# Run main
main
