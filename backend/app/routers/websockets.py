from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from typing import Optional
import json
import asyncio
from datetime import datetime
import logging

from app.core.dependencies import get_supabase
from app.core.tables import (
    GRINDING_OPERATIONS,
    KILN_OPERATIONS,
    RAW_MATERIAL_FEED,
    AI_RECOMMENDATIONS,
)
from app.services.database import SupabaseManager
from app.utils.websocket_manager import ConnectionManager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSockets"])

# This manager reference will be injected at startup
default_manager = ConnectionManager()
manager = default_manager


@router.websocket("/ws/plant-data")
async def websocket_plant_data(
    websocket: WebSocket,
    client_id: Optional[str] = Query(None),
    db: SupabaseManager = Depends(get_supabase),
):
    client_info = {
        "client_id": client_id or f"client_{datetime.now().timestamp()}",
        "connected_at": datetime.now().isoformat(),
        "subscription": "plant_data",
    }
    await manager.connect(websocket, client_info)
    try:
        initial_data = await _get_initial_plant_data(db)
        await manager.send_personal_message(json.dumps({"type": "initial", "data": initial_data}), websocket)
        while True:
            await asyncio.sleep(30)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info(f"Client {client_info['client_id']} disconnected")
    except Exception as e:
        logger.error(f"WebSocket error for client {client_info['client_id']}: {e}")
        manager.disconnect(websocket)


@router.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket, priority_filter: Optional[int] = Query(None, ge=1, le=5)):
    client_info = {
        "client_id": f"alerts_client_{datetime.now().timestamp()}",
        "connected_at": datetime.now().isoformat(),
        "subscription": "alerts",
        "priority_filter": priority_filter,
    }
    await manager.connect(websocket, client_info)
    try:
        await manager.send_personal_message(json.dumps({"type": "welcome", "message": "Subscribed to alerts"}), websocket)
        while True:
            await asyncio.sleep(60)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info(f"Alerts client {client_info['client_id']} disconnected")
    except Exception as e:
        logger.error(f"WebSocket alerts error: {e}")
        manager.disconnect(websocket)


async def _get_initial_plant_data(db: SupabaseManager) -> dict:
    try:
        latest_grinding = await db.get_latest(GRINDING_OPERATIONS)
        latest_kiln = await db.get_latest(KILN_OPERATIONS)
        latest_raw_material = await db.get_latest(RAW_MATERIAL_FEED)
        recent_recommendations = await db.get_recent(AI_RECOMMENDATIONS, limit=5)
        return {"grinding": latest_grinding, "kiln": latest_kiln, "raw_material": latest_raw_material, "recommendations": recent_recommendations}
    except Exception as e:
        logger.error(f"Error getting initial plant data: {e}")
        return {"error": "Failed to load initial data"}


@router.get("/ws/status")
async def websocket_status():
    return {"active_connections": manager.get_connection_count(), "connection_details": manager.get_connection_info(), "timestamp": datetime.now().isoformat()}
