from fastapi import Request
from app.services.database import SupabaseManager
from app.utils.websocket_manager import ConnectionManager
from apscheduler.schedulers.asyncio import AsyncIOScheduler


def get_supabase(request: Request) -> SupabaseManager:
    return request.app.state.supabase


def get_scheduler(request: Request) -> AsyncIOScheduler:
    return request.app.state.scheduler


def get_websocket_manager(request: Request) -> ConnectionManager:
    return request.app.state.websocket_manager
