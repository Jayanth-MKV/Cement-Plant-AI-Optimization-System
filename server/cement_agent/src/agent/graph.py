"""ReAct Agent graph integrating Google Generative AI and MCP tools.

This file was transformed from the initial single-node template into a
LangGraph-compatible ReAct agent that loads tools from an MCP (Multi-Server MCP) client.

It both:
1. Exposes a `graph` variable for LangGraph runtime usage (referenced in langgraph.json).
2. Provides a CLI-style `main` for ad-hoc local execution / debugging.

If you only need the script behavior, run: `python graph.py` from this directory.
"""

from __future__ import annotations

import asyncio
from typing import Any, Dict

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.prebuilt import create_react_agent
from dotenv import load_dotenv

load_dotenv()

# -----------------------------------------------------------------------------
# Model Initialization
# -----------------------------------------------------------------------------

# NOTE: Ensure the proper Google Generative AI key is set in environment variables
# (e.g., GOOGLE_API_KEY) per langchain-google-genai docs.
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",  # Adjust model name if necessary
    temperature=0,
    streaming=True,
)

import os
import sys

db_uri = os.getenv("DATABASE_URI")


# Add a validation check to ensure the environment variable is set
if not db_uri:
    print("Error: The DATABASE_URI environment variable is not set.", file=sys.stderr)
    sys.exit(1)

# -----------------------------------------------------------------------------
# MCP Client & Tool Loading
# -----------------------------------------------------------------------------
# Create a copy of the current environment and add your custom variable
postgres_env = os.environ.copy()
postgres_env["DATABASE_URI"] = db_uri

client = MultiServerMCPClient(
    {
        "postgres_db": {
            "transport": "sse",
            "url": "http://localhost:8080/sse",
        }
        # "postgres": {
        #     "transport": "stdio",
        #     "command": "uv",
        #     "args": ["run", "postgres-mcp", "--access-mode=unrestricted"],
        #     "env": postgres_env,
        # }
    }
)


async def _load_tools() -> Any:
    """Internal helper to asynchronously load tools.

    We call this at import time (synchronously) to construct `graph` so LangGraph
    can reference it immediately via langgraph.json. If an event loop is already
    running (rare in this context), fallback to creating a task.
    """
    return await client.get_tools()


def _load_tools_sync():
    try:
        return asyncio.run(_load_tools())
    except RuntimeError:
        # If already inside an event loop (e.g. some hosting environment), use loop.
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(_load_tools())


# Pre-load tools so we can expose a ready-to-use graph variable.
_tools = _load_tools_sync()

# Domain-specific, concise system prompt (kept short by design):
SYSTEM_PROMPT = (
    "You are the Cement Plant Optimization Copilot. "
    "Leverage the provided tools (Postgres via MCP) to fetch real plant data and KPIs. "
    "prefer dates from 2025-01-01 and before. If time frame not specified."
    "use the raw materials, kiln operations, grinding operations, ai_recommnedations tables to get insights about the dat. aggregate and group them to get better insights"
    "DONT ask too many questions to the user - understand their intent and ask only what you need to know. No need to ask permissions to use tools."
    "Explore as much as you can - dont ask the user to let u explore"
    "Explore more and talk with numbers and recommendations"
)

# Exposed graph for LangGraph runtime usage with system prompt.
graph = create_react_agent(llm, _tools, prompt=SYSTEM_PROMPT)


# -----------------------------------------------------------------------------
# CLI Execution / Debug Helper
# -----------------------------------------------------------------------------
async def main():  # pragma: no cover - manual execution helper
    print(f"Loaded {_tools and len(_tools) or 0} tools from the MCP server.")
    for tool in _tools:
        print(f"- {tool.name}: {tool.description}")

    # Ask the agent a sample question (broad, triggers structured outline)
    query: Dict[str, Any] = {
        "messages": [
            (
                "user",
                "Provide a concise current operations summary and top 3 optimization opportunities.",
            )
        ]
    }

    print("\n--- Streaming response ---\n")
    async for chunk in graph.astream(query):
        for key, value in chunk.items():
            if key == "__end__":
                continue
            print(f"--- {key} ---")
            print(value)
            print()


if __name__ == "__main__":  # pragma: no cover
    asyncio.run(main())
