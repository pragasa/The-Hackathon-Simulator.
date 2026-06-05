#!/bin/bash
# Quick Start Script for The Hackathon Simulator Monorepo

echo ""
echo "===================================="
echo "  THE HACKATHON SIMULATOR - Setup"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "[1/4] Installing frontend dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Frontend installation failed"
    exit 1
fi

echo ""
echo "[2/4] Copying frontend environment template..."
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "HINT: Update frontend/.env.local with your API configuration"
fi

echo ""
echo "[3/4] Installing backend dependencies..."
cd ../backend
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Backend installation failed"
    exit 1
fi

echo ""
echo "[4/4] Copying backend environment template..."
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "HINT: Update backend/.env.local with your API keys"
fi

echo ""
echo "===================================="
echo "  ✓ Setup Complete!"
echo "===================================="
echo ""
echo "Next steps:"
echo "1. Update environment variables:"
echo "   - frontend/.env.local"
echo "   - backend/.env.local"
echo ""
echo "2. Start development (open 2 terminals):"
echo "   Terminal 1: cd frontend && npm run dev"
echo "   Terminal 2: cd backend && npm run dev"
echo ""
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "For more information, see MONOREPO_GUIDE.md"
echo ""
