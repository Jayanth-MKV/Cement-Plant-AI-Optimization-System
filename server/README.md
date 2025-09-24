# Cement Plant AI Optimization System

FastAPI + Supabase backend providing: real‑time plant telemetry aggregation, scheduled AI/analytics jobs, cross‑process KPI generation, WebSocket streaming for UI dashboards, plus a LangGraph agent + MCP Postgres tools.

---

## ⚡ Quick Start (TL;DR)

Clone repo at root (where `dev.ps1` lives) then create a `.env` in `server/`.

Server runtime variables (FastAPI backend):

```
SUPABASE_URL=...
SUPABASE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=true
SCHEDULER_TIMEZONE=UTC
DATABASE_URL=postgresql://user:pass@host:5432/postgres
```

Agent + MCP variables (can live in same `.env` OR a dedicated `server/cement_agent/.env`):

```
DATABASE_URI=postgresql://user:pass@host:5432/postgres   # consumed by postgres-mcp & agent graph
GEMINI_API_KEY=...      # primary Gemini key (alias of GOOGLE_API_KEY if you prefer one)
GOOGLE_API_KEY=...      # retained for google-genai client compatibility
GROQ_API_KEY=...        # optional future model provider
LANGSMITH_PROJECT=cement-plant-optimization  # optional tracing/observability
```

Install frontend deps (once):

```
cd frontend
npm install
```

Backend & agent use `uv` (fast Python package manager). From project root run one of:

```
./dev.ps1 back    # backend API only (FastAPI)
./dev.ps1 agent   # LangGraph agent (Gemini + MCP Postgres)
./dev.ps1 mcp     # Start Postgres MCP server (SSE on :8080)
./dev.ps1 front   # Next.js frontend
./dev.ps1 dev     # Launch all (opens separate terminals)
```

Manual (without script):

```
cd server
uv run main.py              # API
uv run postgres-mcp --sse-port 8080 --transport sse --access-mode unrestricted <DATABASE_URI>
cd cement_agent && uv run langgraph dev --allow-blocking  # Agent dev server (expects MCP already running)
```

Access:

- API Docs: http://localhost:8000/docs
- WebSocket Endpoint: ws://localhost:8000/ws/plant-data
- Agent (LangGraph Dev UI): http://localhost:2024 (default langgraph dev)
- Frontend: http://localhost:3000

---

---

## 🔎 High-Level Architecture

Components:

1. API Layer (`FastAPI`): REST endpoints under `/api/*` for plant data, AI recommendations, analytics, optimization triggers.
2. Data Access (`SupabaseManager`): Async wrapper (`app/services/database.py`) for CRUD + RPC with admin and standard clients.
3. Schedulers (`apscheduler`): Periodic jobs executing analysis & broadcasting updates (`app/services/scheduler.py`).
4. Optimization / Analysis Toolkits (`app/services/optimization_tools.py` + legacy under `app/tools/*`).
5. Realtime Channel (`WebSockets`): Push snapshots & optimization events to connected dashboards.
6. Schemas (`pydantic`): Validated models for core entities in `app/schemas/plant.py`.
7. Routing Modules:
   - `data.py` – curated plant data slices
   - `ai.py` – recommendations, manual optimization triggers
   - `analytics.py` – advanced / legacy KPIs & math utilities
   - `websockets.py` – realtime feed endpoints

Runtime lifecycle (see `main.py`): on startup initialize Supabase clients, scheduler, websocket manager, register jobs, expose routers; on shutdown gracefully stop scheduler & sign out.

---

## �️ Data Model (Logical Tables)

| Table                  | Purpose                       | Populated By                        | Frequency / Trigger                   |
| ---------------------- | ----------------------------- | ----------------------------------- | ------------------------------------- |
| `raw_material_feed`    | Chemistry & feed moisture     | External ingestion                  | Intended 30–60s (currently only read) |
| `grinding_operations`  | Mill performance & energy     | External ingestion                  | Intended 30–60s                       |
| `kiln_operations`      | Kiln thermal & emissions      | External ingestion                  | Intended 30–60s                       |
| `utilities_monitoring` | Equipment power & status      | External ingestion                  | Intended 30–60s / on change           |
| `quality_control`      | Lab strength & quality KPIs   | Lab batch ingestion                 | 2–6 h                                 |
| `alternative_fuels`    | Alt fuel usage & properties   | External / manual                   | 2–6 h                                 |
| `ai_recommendations`   | Actionable AI outputs         | Scheduler (realtime + optimization) | On condition / every 15s & 15m        |
| `optimization_results` | Periodic optimization summary | Scheduler (15m job)                 | 15m                                   |

Pydantic models implemented: `RawMaterialData`, `GrindingOperations`, `KilnOperations`, `AIRecommendation`, `QualityControl`, `AlternativeFuelRecord`, `UtilitiesMonitoringRecord`, `OptimizationResult`, `PlantOverview`.

Centralized table name constants: `app/core/tables.py` (import to avoid string literals).

---

## ⏱️ Scheduler Jobs (Current Intervals)

| Job ID                  | Function                    | Interval | Output                           | Side Effects                                                                                 |
| ----------------------- | --------------------------- | -------- | -------------------------------- | -------------------------------------------------------------------------------------------- |
| `realtime_processing`   | `process_realtime_data`     | 15s      | Plant snapshot + optional alerts | Inserts into `ai_recommendations`, broadcasts `plant_update`                                 |
| `optimization_analysis` | `run_optimization_analysis` | 15m      | KPI report + cross-process recs  | Inserts multiple `ai_recommendations`, one `optimization_results`, broadcasts `optimization` |
| `equipment_health`      | `check_equipment_health`    | 4h       | (stub)                           | Reserved for utilities scoring                                                               |
| `sample_data`           | `populate_sample_data`      | 30s      | (stub)                           | Future seeding/simulation                                                                    |

Note: README original 30–60s cadence differs—either adjust ingestion layer or update intervals here if actual sensor feed exists.

---

## 🔁 Realtime WebSocket Contracts

Endpoint: `GET ws://<host>/ws/plant-data`

Initial push (type=`initial`):

```
{
  "type": "initial",
  "data": {
	 "grinding": { ...latest grinding row },
	 "kiln": { ...latest kiln row },
	 "raw_material": { ...latest raw row },
	 "recommendations": [ { ... }, ... up to 5 ]
  }
}
```

Periodic broadcast (every 15s, type=`plant_update`):

```
{
  "type": "plant_update",
  "created_at": "ISO8601",
  "data": {
	 "raw_material": {...},
	 "grinding": {...},
	 "kiln": {...},
	 "overview": {
		 "specific_energy_consumption": <float>,
		 "ai_quality_score": <float>,
		 "plant_availability_pct": 87
	 }
  }
}
```

Optimization broadcast (every 15m, type=`optimization`): full KPI/dash payload from `PlantKPIDashboard.generate_comprehensive_report` including `chemistry`, `energy`, `fuel_optimization`, `plant_efficiency_score`, `energy_savings`, `recommendations`.

Alerts channel (future extension) uses `/ws/alerts` with lightweight keep‑alive loop.

---

## 🌐 REST API Overview (Frontend Cheatsheet)

Base Prefix: `/api`

Data Slice Endpoints (`data.py`):
| Endpoint | Returns | Notes |
|----------|---------|-------|
| `GET /api/data/plant-overview` | `PlantOverview` | Aggregated KPIs (energy, quality, savings) |
| `GET /api/data/raw-material` | List rows | Query param `limit` (default 3) |
| `GET /api/data/grinding` | List rows | Recent grinding metrics |
| `GET /api/data/kiln` | List rows | Kiln latest samples |
| `GET /api/data/quality` | List rows | Lab results |
| `GET /api/data/alternative-fuels` | List rows | Alt fuel consumption |
| `GET /api/data/utilities` | List rows | Equipment power & efficiency |
| `GET /api/data/combined` | Composite JSON | Bundles above for dashboard hydration |

AI & Optimization (`ai.py`):
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai/recommendations?limit=5&priority_filter=` | GET | Recent open AI recs |
| `/api/ai/optimize/{process_area}` | POST | Trigger ad‑hoc analysis (areas: feed, grinding, kiln, fuel, quality) |
| `/api/ai/recommendations/{id}/action` | POST | Mark recommendation as acted |
| `/api/ai/optimization-history` | GET | Recent optimization summary rows |
| `/api/ai/kpi-summary` | GET | High-level KPI badge data |

Advanced Analytics (`analytics.py`):
| Endpoint | Purpose |
|----------|---------|
| `/api/analytics/plant-report` | Full legacy toolkit report |
| `/api/analytics/chemistry` | Chemistry analysis (raw feed) |
| `/api/analytics/grinding` | Grinding energy efficiency |
| `/api/analytics/fuel?target_tsr=30` | Alternative fuel optimization |
| `/api/analytics/math/oee` | OEE calc (query params) |
| `/api/analytics/advanced/circulating-load` | Circulating load metric |
| `/api/analytics/advanced/separator` | Separator efficiency metric |

Utility:
| Endpoint | Purpose |
|----------|---------|
| `/` | Root metadata |
| `/health` | Health probe |
| `/ws/status` | WebSocket connection diagnostics |

---

## 🧠 Optimization & KPI Logic (Implemented Highlights)

Implemented in `app/services/optimization_tools.py`:

- Chemistry: LSF ratio & % (dual representation), silica & alumina moduli, C3S estimate, contextual recommendations.
- Grinding: Specific energy consumption (SEC), efficiency %, optimization potential, VRM DP heuristics, energy savings potential.
- Alternative Fuel: TSR calculation (simplified), CO₂ reduction estimate, fuel mix recommendations.
- Cross‑Process Dashboard: Aggregates chemistry + energy + fuel into plant efficiency & savings; emits structured recommendations inserted into `ai_recommendations`.
- Maintenance (placeholder): Equipment health scoring skeleton.

Legacy toolkits replicate similar metrics under `app/tools/*` for backward compatibility.

---

## 🧩 Suggested Frontend Integration Patterns

1. Dashboard Hydration Flow:
   - On load: call `GET /api/data/combined` then open WebSocket `/ws/plant-data`.
   - Merge incoming `plant_update` payloads to refresh charts minimally (diff by key).
2. KPI Panels:
   - Use `/api/ai/kpi-summary` for header badges (energy saved, open recs count, last optimization time).
3. Recommendations Drawer:
   - Poll `/api/ai/recommendations` every 30–60s OR push future via separate alerts socket.
   - On user action: POST `/api/ai/recommendations/{id}/action` then optimistic UI update.
4. Optimization Trigger Button:
   - POST `/api/ai/optimize/grinding` (or other area) and surface returned `analysis` block.
5. Historical Trend Pages:
   - Paginate backend later; currently `limit` param only (client can time‑bucket).
6. Resilience:
   - WebSocket reconnect with exponential backoff (e.g., 1s → 2s → 5s → 10s capped).
   - If WS down >30s fallback to polling `/api/data/plant-overview`.

---

## 🔐 Environment / Configuration

Environment variables (see `app/core/config.py`):

```
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
API_PORT=8000
DEBUG=true
```

Create `.env` at project root with the above. Service role key required for admin operations (insertion of AI rows).

---

## 🚀 Running Locally (Expanded Details)

Preferred: PowerShell helper script `dev.ps1` (Windows). For other shells, replicate commands shown in Quick Start.

1. Install Node + deps (`frontend/`)
2. Ensure Python 3.13 (root backend) & `uv` installed (`pip install uv` or see uv docs).
3. Populate `server/.env`.
4. Start MCP (optional but required for agent DB tools): `./dev.ps1 mcp`
5. Start backend: `./dev.ps1 back`
6. Start agent: `./dev.ps1 agent`
7. Start frontend: `./dev.ps1 front`

Hot reload:

- Backend auto reload via `uv run main.py`
- Agent auto reload via `langgraph dev`
- Frontend via `npm run dev`

Health check: `GET http://localhost:8000/health` should return OK JSON.

---

## 📡 Data Consistency & Gaps (Next Improvements)

| Gap                                            | Impact              | Action                                        |
| ---------------------------------------------- | ------------------- | --------------------------------------------- |
| Missing ingestion jobs for raw/periodic tables | Demo data stale     | Implement simulator in `populate_sample_data` |
| Equipment health logic placeholder             | No utility insights | Implement scoring & alerts                    |
| No auth / RBAC                                 | Open endpoints      | Add API key / JWT layer                       |
| Lack of pagination                             | Heavy queries later | Add cursor/limit params                       |

---

## 🧪 Testing Strategy (Proposed)

Minimal tests should mock Supabase and validate:

- Scheduler: alert insert when SEC critical.
- KPI dashboard: energy savings computation.
- Routers: 200 responses & schema adherence.

---

## 🗺️ Component Map

| Layer         | File(s)                                                       | Responsibility                                |
| ------------- | ------------------------------------------------------------- | --------------------------------------------- |
| Entry         | `main.py`                                                     | App lifecycle, router wiring, scheduler start |
| Config        | `app/core/config.py`                                          | Settings via environment                      |
| Tables Const  | `app/core/tables.py`                                          | Central table name enum/strings               |
| DB Access     | `app/services/database.py`                                    | Async Supabase CRUD                           |
| Schedulers    | `app/services/scheduler.py`                                   | Periodic analytics + broadcasting             |
| Toolkits      | `app/services/optimization_tools.py`, `app/tools/*`           | KPI & recommendation logic                    |
| Schemas       | `app/schemas/plant.py`                                        | Pydantic models                               |
| WebSockets    | `app/routers/websockets.py`, `app/utils/websocket_manager.py` | Realtime delivery                             |
| Data API      | `app/routers/data.py`                                         | Plant data slices                             |
| AI API        | `app/routers/ai.py`                                           | Recommendations & optimization actions        |
| Analytics API | `app/routers/analytics.py`                                    | Advanced/legacy metrics                       |

---

## 🧭 Extensibility Roadmap

1. Add anomaly detection (z-score / EWMA) for each stream.
2. Implement multi-tenant plant key isolation.
3. Add event sourcing / change-log table.
4. Integrate model registry for ML-driven predictions.
5. Provide GraphQL layer for complex dashboard queries.

---

## 📑 License

See `LICENSE` file.

---

## 🙋 FAQ (Quick Answers)

| Question                             | Answer                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------ |
| Why 15s scheduler if sensors 30–60s? | Faster cadence ensures rapid alerting; can be throttled.                       |
| How to get all KPIs at once?         | Use WebSocket initial + `optimization` event or `/api/analytics/plant-report`. |
| How to mark a rec done?              | POST `/api/ai/recommendations/{id}/action`.                                    |
| How to simulate data?                | Extend `populate_sample_data` job to insert synthetic rows.                    |

---
