# Cement Plant AI Optimization System

Modern FastAPI application with Supabase integration, background scheduling, and WebSocket real-time updates.

## Features
- Async Supabase data layer
- APScheduler background jobs
- Modular routers (data, AI, websockets)
- WebSocket real-time broadcasting
- KPI and optimization analytics

## Quick Start
```bash
python -m venv .venv
# Activate venv (Windows PowerShell)
. .venv/Scripts/Activate.ps1
pip install -r requirements.txt
cp .env.example .env  # fill in Supabase values
python run.py
```

Visit: http://localhost:8000/docs
WebSocket: ws://localhost:8000/ws/plant-data
