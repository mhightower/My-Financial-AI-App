#!/usr/bin/env bash
set -euo pipefail

echo "Setting up environment..."
if [ ! -f backend/.env ]; then
  cp .env.example backend/.env
  echo "  Created backend/.env from .env.example"
fi

if grep -q "ALPHA_VANTAGE_API_KEY=demo" backend/.env; then
  echo ""
  echo "  ⚠  Market data is running in demo mode (limited tickers)."
  echo "     Replace ALPHA_VANTAGE_API_KEY in backend/.env with a real key."
  echo "     Free key: https://www.alphavantage.co/support/#api-key"
  echo ""
fi

echo "Installing frontend dependencies..."
npm install

echo "Installing backend dependencies..."
cd backend
uv sync --extra dev

echo "Devcontainer setup complete."
echo "Run backend: cd backend && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
echo "Run frontend: npm run dev -- --host 0.0.0.0 --port 5173"
