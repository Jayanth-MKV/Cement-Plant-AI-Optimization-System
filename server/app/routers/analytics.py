from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict
import logging
from datetime import datetime

from app.core.dependencies import get_supabase
from app.services.database import SupabaseManager

# Import previously unused toolkits so they become part of runtime feature set
from app.tools.cement_optimization_tools import (
    CementChemistryCalculator as LegacyChemistryCalculator,
    EnergyEfficiencyCalculator as LegacyEnergyCalculator,
    AlternativeFuelOptimizer as LegacyFuelOptimizer,
    PlantKPIDashboard as LegacyDashboard,
)
from app.tools.cement_math_toolkit import CementMathTools
from app.tools.advanced_math_toolkit import AdvancedCementCalculations

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["Advanced Analytics"])

chemistry_calc = LegacyChemistryCalculator()
energy_calc = LegacyEnergyCalculator()
fuel_optimizer = LegacyFuelOptimizer()
dashboard = LegacyDashboard()
math_tools = CementMathTools()
advanced_calc = AdvancedCementCalculations()


@router.get("/plant-report", response_model=Dict)
async def generate_plant_report(db: SupabaseManager = Depends(get_supabase)):
    """Generate a comprehensive plant report using legacy optimization toolkit."""
    try:
        raw_material = await db.get_latest("raw_material_feed") or {}
        grinding = await db.get_latest("grinding_operations") or {}
        kiln = await db.get_latest("kiln_operations") or {}
        overview = {
            "specific_energy_consumption": (grinding.get("power_consumption_kw", 0) / grinding.get("total_feed_rate_tph", 1)) if grinding else 0,
            "ai_quality_score": (await db.get_latest("quality_control") or {}).get("ai_quality_score", 90),
            "thermal_substitution_pct": kiln.get("thermal_substitution_pct", 0),
            "plant_availability_pct": 87,
            "co2_emissions_per_ton": kiln.get("co2_emissions_tph", 0) * 1000 if kiln else 850,
        }
        plant_data = {"raw_material": raw_material, "grinding": grinding, "kiln": kiln, "overview": overview}
        report = dashboard.generate_comprehensive_report(plant_data)
        return {"generated_at": datetime.utcnow().isoformat(), "report": report}
    except Exception as e:
        logger.error(f"Error generating plant report: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate plant report")


@router.get("/chemistry", response_model=Dict)
async def chemistry_analysis(db: SupabaseManager = Depends(get_supabase)):
    try:
        raw_material = await db.get_latest("raw_material_feed") or {}
        return {"analysis": chemistry_calc.analyze_chemistry(raw_material), "created_at": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error(f"Chemistry analysis error: {e}")
        raise HTTPException(status_code=500, detail="Chemistry analysis failed")


@router.get("/grinding", response_model=Dict)
async def grinding_efficiency(db: SupabaseManager = Depends(get_supabase)):
    try:
        grinding = await db.get_latest("grinding_operations") or {}
        return {"efficiency": energy_calc.analyze_grinding_efficiency(grinding), "created_at": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error(f"Grinding efficiency error: {e}")
        raise HTTPException(status_code=500, detail="Grinding efficiency analysis failed")


@router.get("/fuel", response_model=Dict)
async def fuel_mix(db: SupabaseManager = Depends(get_supabase), target_tsr: float = Query(30, ge=0, le=60)):
    try:
        kiln = await db.get_latest("kiln_operations") or {}
        return {"optimization": fuel_optimizer.optimize_fuel_mix(kiln, target_tsr=target_tsr), "created_at": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error(f"Fuel optimization error: {e}")
        raise HTTPException(status_code=500, detail="Fuel optimization failed")


@router.get("/math/oee", response_model=Dict)
async def overall_equipment_effectiveness(
    availability_pct: float = Query(87, ge=0, le=100),
    performance_pct: float = Query(92, ge=0, le=100),
    quality_pct: float = Query(95, ge=0, le=100),
):
    try:
        result = math_tools.calculate_overall_equipment_effectiveness(availability_pct, performance_pct, quality_pct)
        return {"oee": result.__dict__, "created_at": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error(f"OEE calculation error: {e}")
        raise HTTPException(status_code=500, detail="OEE calculation failed")


@router.get("/advanced/circulating-load", response_model=Dict)
async def circulating_load(
    mill_feed_tph: float = Query(120, gt=0),
    mill_product_tph: float = Query(110, gt=0),  # kept for future extension
    separator_efficiency_pct: float = Query(80, gt=0, lt=100),
):
    try:
        metric = advanced_calc.calculate_mill_circulating_load(mill_feed_tph, mill_product_tph, separator_efficiency_pct)
        return {"circulating_load": metric.__dict__, "created_at": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error(f"Circulating load calc error: {e}")
        raise HTTPException(status_code=500, detail="Circulating load calculation failed")


@router.get("/advanced/separator", response_model=Dict)
async def separator_efficiency(
    coarse_feed_tph: float = Query(50, gt=0),
    coarse_reject_tph: float = Query(35, gt=0),
    fine_feed_tph: float = Query(70, gt=0),
    fine_product_tph: float = Query(65, gt=0),
):
    try:
        metric = advanced_calc.calculate_separator_efficiency(coarse_feed_tph, coarse_reject_tph, fine_feed_tph, fine_product_tph)
        return {"separator_efficiency": metric.__dict__, "created_at": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error(f"Separator efficiency calc error: {e}")
        raise HTTPException(status_code=500, detail="Separator efficiency calculation failed")


@router.get("/health", response_model=Dict)
async def analytics_health():
    return {
        "status": "ok",
        "module_usage": [
            "cement_optimization_tools.CementChemistryCalculator",
            "cement_optimization_tools.EnergyEfficiencyCalculator",
            "cement_optimization_tools.AlternativeFuelOptimizer",
            "cement_optimization_tools.PlantKPIDashboard",
            "cement_math_toolkit.CementMathTools",
            "advanced_math_toolkit.AdvancedCementCalculations",
        ],
        "created_at": datetime.utcnow().isoformat(),
    }
