from contextlib import asynccontextmanager
import logging
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.core.config import settings
from app.core.logging_config import setup_logging
from app.services.database import SupabaseManager
from app.services.scheduler import setup_scheduler
from app.utils.websocket_manager import ConnectionManager
from app.routers import data, ai, websockets, analytics

setup_logging(settings.debug)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Cement Plant AI System...")
    try:
        supabase_manager = SupabaseManager()
        await supabase_manager.initialize()
        websocket_manager = ConnectionManager()
        scheduler = AsyncIOScheduler(timezone=settings.scheduler_timezone)
        plant_scheduler = setup_scheduler(
            scheduler, supabase_manager, websocket_manager
        )
        scheduler.start()
        app.state.supabase = supabase_manager
        app.state.scheduler = scheduler
        app.state.websocket_manager = websocket_manager
        app.state.plant_scheduler = plant_scheduler
        # Inject manager into websockets router
        from app.routers import websockets as ws_router

        ws_router.manager = websocket_manager
        logger.info("Cement Plant AI System ready")
        yield
    except Exception as e:
        logger.error(f"Startup failed: {e}")
        raise
    logger.info("Shutting down Cement Plant AI System...")
    try:
        if hasattr(app.state, "scheduler"):
            app.state.scheduler.shutdown(wait=True)
        if hasattr(app.state, "supabase"):
            await app.state.supabase.close()
        logger.info("Shutdown complete")
    except Exception as e:
        logger.error(f"Shutdown error: {e}")


app = FastAPI(
    title="Cement Plant AI Optimization System",
    description="API for cement plant AI optimization with real-time monitoring.",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(websockets.router)
app.include_router(analytics.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "message": "Cement Plant AI Optimization System",
        "version": "2.0.0",
        "status": "operational",
        "features": ["Real-time plant monitoring", "Comprehensive plant analytics"],
        "endpoints": {"docs": "/docs", "websocket": "/ws/plant-data"},
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.0.0",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
        log_level="info" if settings.debug else "warning",
    )
