# Cement Plant LangGraph Agent

Short, domain-aware ReAct agent that augments a Google Generative AI model with live plant data access through an MCP (Model Context Protocol) Postgres tool.

---

## 🔍 Purpose

Provide concise, actionable reasoning and optimization guidance across:

- Raw materials chemistry (LSF, silica/alumina moduli, clinker phase context)
- Grinding operations (specific energy consumption, efficiency, savings potential)
- Kiln stability & emissions heuristics
- Alternative fuels (TSR, CO₂ impact)
- Cross‑process KPI synthesis & recommendations
- Quality control impacts on throughput & energy

The agent uses real data (not static embeddings) by calling Postgres via MCP tools.

---

## 🧩 Architecture Snapshot

| Layer           | Component                                                      |
| --------------- | -------------------------------------------------------------- |
| LLM             | `gemini-2.5-flash` via `langchain-google-genai`                |
| Orchestration   | LangGraph prebuilt ReAct agent (`create_react_agent`)          |
| Tool Transport  | MCP multi‑server client (`langchain-mcp-adapters`)             |
| Data Source     | `postgres-mcp` tool (stdio transport launched with `uv run`)   |
| Prompt Strategy | Minimal system prompt injecting domain focus + tool discipline |

---

## 🛠️ MCP (Model Context Protocol) Usage

We attach a `MultiServerMCPClient` with a single Postgres server definition:

Run the MCP using this
```
uv run postgres-mcp --sse-port 8080 --transport sse --access-mode unrestricted <DATABASE CONNECTION STRING>
```

The `postgres-mcp` package exposes database schema & query tools following the MCP tool contract so the agent can:

1. Discover available tables / columns
2. Issue targeted SQL
3. Ground explanations in actual numbers

Why MCP? It standardizes tool discovery + schema introspection, avoiding bespoke tool wiring and enabling future multi-tool expansion (e.g., analytics microservice, vector search) without rewriting the agent graph.

---

## 🧠 System Prompt (Concise)

```
You are the Cement Plant Optimization Copilot. Leverage the provided tools (Postgres via MCP) to fetch real plant data and KPIs. Core focus areas: raw materials chemistry (LSF, moduli), grinding energy & SEC, kiln thermal stability & emissions, alternative fuels (TSR & CO₂ impact), cross‑process efficiency, quality KPIs. When a question is broad, briefly outline the main KPI groups then drill down. Always: 1) clarify ambiguous scope in <=1 targeted question, 2) use tools for any factual/quantitative claim, 3) keep answers actionable with ranked recommendations (why + expected impact), 4) be concise. If data is missing, state the gap and suggest which stream/job would populate it.
```

Injected through `state_modifier` in `graph.py`.

---

## 🚀 Run Locally

Prereqs: `uv` (or Python 3.9+), environment variable `GOOGLE_API_KEY`, and a `DATABASE_URI` pointing to your Postgres instance (same schema used by the FastAPI backend).

1. Create `.env` in `server/` or `cement_agent/` (both loaded if in path):

```
GOOGLE_API_KEY=your_key
DATABASE_URI=postgresql://user:pass@host:5432/dbname
```

2. Install deps (handled automatically by uv when running):

```
uv run python -m cement_agent.src.agent.graph
```

Or directly:

```
uv run python cement_agent\src\agent\graph.py
```

You should see a tool list then a streamed answer.

---

## 🔗 Integration Points With Backend

- Shares the same underlying Postgres instance the FastAPI app uses for KPI tables (`raw_material_feed`, `grinding_operations`, `kiln_operations`, etc.).
- Can be wrapped behind an API route or websocket that proxies user questions to the agent graph.
- Future: Add a tool for triggering existing scheduler optimization jobs (e.g., call internal REST endpoint) via a new MCP server definition.

---

## 🧪 Quick Validation Checklist

- Missing `DATABASE_URI` -> startup aborts with clear stderr message.
- Incorrect key -> LLM call error surfaced during first query.
- No tables / empty data -> Agent explicitly states data gap per prompt discipline.

---

## ➕ Extending Tools

Add additional MCP servers (e.g., analytics microservice):

1. Implement an MCP server exposing domain functions.
2. Append config entry in `MultiServerMCPClient({...})`.
3. Re-run; tools auto-populate (`client.get_tools()`).

---

## ⚖️ License

MIT (inherited from project root & package metadata).

---

## 📌 Notes

Keep the system prompt short; rely on real data retrieval rather than verbose instruction. If responses become too wordy, reduce allowed tokens or enforce summarization passes using a follow-up tool-aware query.
