from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class RawMaterialFeed(BaseModel):
    id: int
    created_at: datetime
    material_type: str
    feed_rate_tph: float
    moisture_pct: float
    cao_pct: Optional[float]
    sio2_pct: Optional[float]
    al2o3_pct: Optional[float]
    fe2o3_pct: Optional[float]


class GrindingOperations(BaseModel):
    id: int
    created_at: datetime
    mill_id: int
    mill_type: str
    total_feed_rate_tph: float
    motor_current_a: float
    power_consumption_kw: float
    differential_pressure_mbar: Optional[float]
    mill_temperature_c: Optional[float]
    fineness_blaine_cm2g: Optional[float]
    residue_45micron_pct: Optional[float]


class KilnOperations(BaseModel):
    id: int
    created_at: datetime
    kiln_id: int
    burning_zone_temp_c: float
    preheater_temp_c: Optional[float]
    fuel_rate_tph: float
    coal_rate_tph: Optional[float]
    alt_fuel_rate_tph: Optional[float] = 0
    thermal_substitution_pct: Optional[float] = 0
    oxygen_pct: Optional[float]
    co_ppm: Optional[float]
    nox_ppm: Optional[float]
    co2_emissions_tph: Optional[float]
    specific_heat_consumption_mjkg: Optional[float]


class QualityControl(BaseModel):
    id: int
    created_at: datetime
    sample_id: str
    cement_type: str
    compressive_strength_1d_mpa: Optional[float]
    compressive_strength_7d_mpa: Optional[float]
    compressive_strength_28d_mpa: Optional[float]
    initial_setting_time_min: Optional[int]
    final_setting_time_min: Optional[int]
    fineness_blaine_cm2g: Optional[float]
    soundness_mm: Optional[float]
    ai_quality_score: Optional[float]
    defect_detected: Optional[bool] = False


class AlternativeFuels(BaseModel):
    id: int
    created_at: datetime
    fuel_type: str
    calorific_value_mj_kg: float
    consumption_rate_tph: Optional[float]
    moisture_content_pct: Optional[float]
    chlorine_content_pct: Optional[float]
    thermal_substitution_pct: Optional[float]
    co2_reduction_tph: Optional[float]


class UtilitiesMonitoring(BaseModel):
    id: int
    created_at: datetime
    equipment_type: str
    equipment_id: str
    power_consumption_kw: float
    operating_efficiency_pct: Optional[float]
    maintenance_due_days: Optional[int]
    predicted_failure_risk: Optional[float]


class AIRecommendations(BaseModel):
    id: int
    created_at: datetime
    process_area: str
    recommendation_type: str
    priority_level: int
    description: str
    estimated_savings_kwh: Optional[float]
    estimated_savings_cost: Optional[float]
    action_taken: Optional[bool] = False
    operator_feedback: Optional[str]


class OptimizationResults(BaseModel):
    id: int
    created_at: datetime
    optimization_type: str
    baseline_value: float
    optimized_value: float
    improvement_pct: float
    energy_saved_kwh: Optional[float]
    cost_saved_usd: Optional[float]
    co2_reduced_kg: Optional[float]
    model_confidence: Optional[float]
