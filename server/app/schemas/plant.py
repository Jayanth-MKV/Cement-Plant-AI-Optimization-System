from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class PlantOverview(BaseModel):
    energy_consumption_kwh: int = Field(..., description="Current energy consumption in kWh")
    quality_score: int = Field(..., description="AI quality score (0-100)")
    cost_savings_usd: int = Field(..., description="Cost savings in USD")
    co2_reduction_kg: int = Field(..., description="CO2 reduction in kg")
    overall_efficiency: int = Field(..., description="Overall efficiency percentage")


class RawMaterialData(BaseModel):
    id: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.now)
    material_type: str
    feed_rate_tph: float
    moisture_pct: float
    cao_pct: float
    sio2_pct: float
    al2o3_pct: float
    fe2o3_pct: float


class GrindingOperations(BaseModel):
    id: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.now)
    mill_id: int
    mill_type: str
    total_feed_rate_tph: float
    motor_current_a: float
    power_consumption_kw: float
    differential_pressure_mbar: Optional[float] = None
    mill_temperature_c: float
    fineness_blaine_cm2g: float
    residue_45micron_pct: float


class KilnOperations(BaseModel):
    id: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.now)
    kiln_id: int
    burning_zone_temp_c: float
    preheater_temp_c: float
    fuel_rate_tph: float
    coal_rate_tph: float
    alt_fuel_rate_tph: float
    thermal_substitution_pct: float
    oxygen_pct: float
    co_ppm: float
    nox_ppm: float
    co2_emissions_tph: float
    specific_heat_consumption_mjkg: float


class AIRecommendation(BaseModel):
    id: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.now, description="Creation timestamp (aligned with DB column)")
    process_area: str
    recommendation_type: str
    priority_level: int
    description: str
    estimated_savings_kwh: float
    estimated_savings_cost: float
    action_taken: bool = False


class QualityControl(BaseModel):
    """Minimal quality control lab result schema.

    Extended fields can be added once the upstream ingestion provides them.
    """

    id: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.now)
    ai_quality_score: float = Field(..., description="Model-assigned quality score (0-100)")


class AlternativeFuelRecord(BaseModel):
    id: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.now)
    fuel_type: str = Field(..., description="Fuel descriptor (e.g. biomass, rdf, tire)")
    heating_value_mjkg: float = Field(..., description="Higher heating value in MJ/kg")
    consumption_rate_tph: float = Field(..., description="Consumption rate (tph)")
    moisture_pct: float = Field(..., description="Moisture percentage")


class UtilitiesMonitoringRecord(BaseModel):
    id: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.now)
    equipment_name: str
    power_kw: float
    efficiency_pct: float
    status: str = Field(..., description="Operational status (e.g. running, standby, fault)")


class OptimizationResult(BaseModel):
    id: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.now)
    energy_saved_kwh: float
    cost_saved_usd: float
    co2_reduced_kg: float
    model_confidence: float


class OptimizationRequest(BaseModel):
    process_area: str
    parameters: Optional[dict] = None


class PlantDataResponse(BaseModel):
    plant_overview: PlantOverview
    raw_material: List[RawMaterialData]
    grinding: List[GrindingOperations]
    kiln: List[KilnOperations]
    ai_recommendations: List[AIRecommendation]
