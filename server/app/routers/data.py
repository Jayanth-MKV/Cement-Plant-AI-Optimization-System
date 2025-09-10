from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict
from datetime import datetime
import logging

from app.core.dependencies import get_supabase
from app.core.tables import (
    GRINDING_OPERATIONS,
    KILN_OPERATIONS,
    QUALITY_CONTROL,
    OPTIMIZATION_RESULTS,
    RAW_MATERIAL_FEED,
    ALTERNATIVE_FUELS,
    UTILITIES_MONITORING,
)
from app.services.database import SupabaseManager
from app.schemas.plant import PlantOverview

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/data", tags=["Plant Data"])


@router.get("/plant-overview", response_model=PlantOverview)
async def get_plant_overview(db: SupabaseManager = Depends(get_supabase)):
    try:
        latest_grinding = await db.get_latest(GRINDING_OPERATIONS)
        latest_kiln = await db.get_latest(KILN_OPERATIONS)
        latest_quality = await db.get_latest(QUALITY_CONTROL)
        latest_optimization = await db.get_latest(OPTIMIZATION_RESULTS)
        energy_consumption = latest_grinding.get("power_consumption_kw", 2450) if latest_grinding else 2450
        quality_score = latest_quality.get("ai_quality_score", 94) if latest_quality else 94
        cost_savings = latest_optimization.get("cost_saved_usd", 125420) if latest_optimization else 125420
        co2_reduction = latest_optimization.get("co2_reduced_kg", 8750) if latest_optimization else 8750
        if latest_grinding:
            feed_rate = latest_grinding.get("total_feed_rate_tph", 80) or 80
            sec = energy_consumption / feed_rate if feed_rate else 0
            overall_efficiency = 100 - max(0, (sec - 25) * 2)
        else:
            overall_efficiency = 85
        if latest_kiln:
            kiln_temp = latest_kiln.get("burning_zone_temp_c")
            if isinstance(kiln_temp, (int, float)):
                temp_deviation = abs(kiln_temp - 1450)
                kiln_penalty = 0
                if temp_deviation > 5:
                    kiln_penalty = min(15, (temp_deviation - 5) * 0.3)
                overall_efficiency -= kiln_penalty
            shc = latest_kiln.get("specific_heat_consumption_mjkg")
            if isinstance(shc, (int, float)) and shc > 0:
                heat_penalty = max(0, min(10, (shc - 3.3) * 8))
                overall_efficiency -= heat_penalty
        overall_efficiency = max(50, min(100, overall_efficiency))
        return PlantOverview(
            energy_consumption_kwh=round(energy_consumption),
            quality_score=round(quality_score),
            cost_savings_usd=round(cost_savings),
            co2_reduction_kg=round(co2_reduction),
            overall_efficiency=round(overall_efficiency),
        )
    except Exception as e:
        logger.error(f"Error getting plant overview: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/raw-material", response_model=List[Dict])
async def get_raw_material_data(
    limit: int = Query(default=3, ge=1, le=50),
    db: SupabaseManager = Depends(get_supabase),
):
    try:
        return await db.get_recent(RAW_MATERIAL_FEED, limit=limit)
    except Exception as e:
        logger.error(f"Error getting raw material data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/grinding", response_model=List[Dict])
async def get_grinding_data(
    limit: int = Query(default=2, ge=1, le=20),
    db: SupabaseManager = Depends(get_supabase),
):
    try:
        return await db.get_recent(GRINDING_OPERATIONS, limit=limit)
    except Exception as e:
        logger.error(f"Error getting grinding data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/kiln", response_model=List[Dict])
async def get_kiln_data(
    limit: int = Query(default=1, ge=1, le=10),
    db: SupabaseManager = Depends(get_supabase),
):
    try:
        return await db.get_recent(KILN_OPERATIONS, limit=limit)
    except Exception as e:
        logger.error(f"Error getting kiln data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/quality", response_model=List[Dict])
async def get_quality_data(
    limit: int = Query(default=1, ge=1, le=10),
    db: SupabaseManager = Depends(get_supabase),
):
    try:
        return await db.get_recent(QUALITY_CONTROL, limit=limit)
    except Exception as e:
        logger.error(f"Error getting quality data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/alternative-fuels", response_model=List[Dict])
async def get_alternative_fuels_data(
    limit: int = Query(default=2, ge=1, le=10),
    db: SupabaseManager = Depends(get_supabase),
):
    try:
        return await db.get_recent(ALTERNATIVE_FUELS, limit=limit)
    except Exception as e:
        logger.error(f"Error getting alternative fuels data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/utilities", response_model=List[Dict])
async def get_utilities_data(
    limit: int = Query(default=10, ge=1, le=50),
    db: SupabaseManager = Depends(get_supabase),
):
    try:
        return await db.get_recent(UTILITIES_MONITORING, limit=limit)
    except Exception as e:
        logger.error(f"Error getting utilities data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/combined", response_model=Dict)
async def get_combined_plant_data(db: SupabaseManager = Depends(get_supabase)):
    try:
        plant_overview = await get_plant_overview(db)  # type: ignore
        raw_material = await get_raw_material_data(db=db)  # type: ignore
        grinding = await get_grinding_data(db=db)  # type: ignore
        kiln = await get_kiln_data(db=db)  # type: ignore
        quality = await get_quality_data(db=db)  # type: ignore
        alternative_fuels = await get_alternative_fuels_data(db=db)  # type: ignore
        utilities = await get_utilities_data(db=db)  # type: ignore
        return {
            "plant_overview": plant_overview.dict(),
            "raw_material": raw_material,
            "grinding": grinding,
            "kiln": kiln,
            "quality": quality,
            "alternative_fuels": alternative_fuels,
            "utilities": utilities,
            "created_at": datetime.now().isoformat(),
        }
    except Exception as e:
        logger.error(f"Error getting combined plant data: {e}")
        raise HTTPException(status_code=500, detail=str(e))
