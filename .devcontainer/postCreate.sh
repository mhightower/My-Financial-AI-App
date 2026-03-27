#!/usr/bin/env bash
set -euo pipefail

echo "Installing frontend dependencies..."
npm install

echo "Installing backend dependencies..."
cd backend
uv sync --extra dev

echo "Devcontainer setup complete."
echo "Run backend: cd backend && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
echo "Run frontend: npm run dev -- --host 0.0.0.0 --port 5173"
