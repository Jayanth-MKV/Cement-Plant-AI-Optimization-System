from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict
from datetime import datetime
import logging

from app.core.dependencies import get_supabase, get_websocket_manager
from app.services.database import SupabaseManager
from app.utils.websocket_manager import ConnectionManager
from app.schemas.plant import OptimizationRequest
from app.services.optimization_tools import EnergyEfficiencyCalculator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI & Optimization"])


@router.get("/recommendations", response_model=List[Dict])
async def get_ai_recommendations(limit: int = 3, priority_filter: int = None, db: SupabaseManager = Depends(get_supabase)):
    try:
        where_clause = {"action_taken": False}
        if priority_filter:
            where_clause["priority_level"] = priority_filter
        return await db.get_recent("ai_recommendations", where=where_clause, limit=limit, order_by="priority_level")
    except Exception as e:
        logger.error(f"Error getting AI recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize/{process_area}")
async def trigger_optimization(
    process_area: str, request: OptimizationRequest = None, db: SupabaseManager = Depends(get_supabase), websocket_manager: ConnectionManager = Depends(get_websocket_manager)
):
    valid_areas = ["feed", "grinding", "kiln", "fuel", "quality"]
    if process_area not in valid_areas:
        raise HTTPException(status_code=400, detail=f"Invalid process area. Must be one of: {', '.join(valid_areas)}")
    try:
        result = {"message": f"Optimization initiated for {process_area}", "status": "started"}
        if process_area == "grinding":
            latest_grinding = await db.get_latest("grinding_operations")
            if latest_grinding:
                energy_calc = EnergyEfficiencyCalculator()
                analysis_result = energy_calc.analyze_grinding_efficiency(latest_grinding)
                result["analysis"] = analysis_result
        return result
    except Exception as e:
        logger.error(f"Error in manual optimization: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommendations/{recommendation_id}/action")
async def mark_recommendation_action(recommendation_id: int, db: SupabaseManager = Depends(get_supabase)):
    try:
        result = await db.update("ai_recommendations", {"id": recommendation_id}, {"action_taken": True, "action_timestamp": datetime.now().isoformat()})
        if result:
            return {"message": "Recommendation marked as acted upon", "id": recommendation_id}
        raise HTTPException(status_code=404, detail="Recommendation not found")
    except Exception as e:
        logger.error(f"Error marking recommendation action: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/optimization-history", response_model=List[Dict])
async def get_optimization_history(limit: int = 10, db: SupabaseManager = Depends(get_supabase)):
    try:
        return await db.get_recent("optimization_results", limit=limit)
    except Exception as e:
        logger.error(f"Error getting optimization history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/kpi-summary")
async def get_kpi_summary(db: SupabaseManager = Depends(get_supabase)):
    try:
        latest_optimization = await db.get_latest("optimization_results")
        recent_recommendations = await db.get_recent("ai_recommendations", limit=50)
        open_recommendations = [r for r in recent_recommendations if not r.get("action_taken", False)]
        return {
            "total_energy_saved_kwh": latest_optimization.get("energy_saved_kwh", 0) if latest_optimization else 0,
            "last_optimization": latest_optimization.get("created_at") if latest_optimization else None,
            "open_recommendations": len(open_recommendations),
        }
    except Exception as e:
        logger.error(f"Error getting KPI summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))
