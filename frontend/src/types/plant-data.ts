export interface QualityMetrics {
    cao_percent?: number;
    sio2_percent: number;
    al2o3_percent: number;
    fe2o3_percent: number;
    moisture_content: number;
}

export interface RawMaterial {
    quality_metrics: QualityMetrics;
    feed_rate: number;
    ai_predicted_variability: number;
    optimization_score: number;
}

export interface GrindingEfficiency {
    current_efficiency: number;
    ai_optimized_efficiency: number;
    energy_consumption_kwh: number;
    predicted_savings_percent: number;
}

export interface RawMaterials {
    limestone: RawMaterial;
    clay: RawMaterial;
    grinding_efficiency: GrindingEfficiency;
}

export interface TemperatureZones {
    preheater_top: number;
    preheater_bottom: number;
    calciner: number;
    kiln_inlet: number;
    burning_zone: number;
    cooler_inlet: number;
}

export interface FuelData {
    coal_consumption: number;
    alternative_fuel_rate: number;
    thermal_substitution_rate: number;
    energy_consumption: number;
    ai_optimized_consumption: number;
}

export interface ProductionMetrics {
    clinker_production_rate: number;
    kiln_efficiency: number;
    energy_savings_percent: number;
    co2_emissions: number;
}

export interface KilnOperations {
    temperature_zones: TemperatureZones;
    fuel_data: FuelData;
    production_metrics: ProductionMetrics;
}

export interface RealTimeQuality {
    compressive_strength_predicted: number;
    fineness_blaine: number;
    setting_time_initial: number;
    free_lime_content: number;
    ai_quality_score: number;
}

export interface DefectDetection {
    vision_accuracy: number;
    defects_detected_today: number;
    false_positive_rate: number;
    quality_corrections_made: number;
}

export interface BatchConsistency {
    variation_coefficient: number;
    specification_compliance: number;
    customer_complaints: number;
}

export interface QualityControl {
    real_time_quality: RealTimeQuality;
    defect_detection: DefectDetection;
    batch_consistency: BatchConsistency;
}

export interface FuelSource {
    percentage: number;
    cost_per_ton: number;
    co2_factor: number;
}

export interface FuelSources {
    coal: FuelSource;
    pet_coke: FuelSource;
    biomass: FuelSource;
    refuse_derived_fuel: FuelSource;
}

export interface OptimizationResults {
    current_fuel_cost: number;
    ai_optimized_cost: number;
    cost_savings_percent: number;
    co2_reduction_percent: number;
    alternative_fuel_max_potential: number;
}

export interface FuelOptimization {
    fuel_sources: FuelSources;
    optimization_results: OptimizationResults;
}

export interface EnergyOptimization {
    total_energy_consumption: number;
    ai_predicted_consumption: number;
    savings_potential: number;
}

export interface ProductionOptimization {
    current_throughput: number;
    ai_optimized_throughput: number;
    improvement_percent: number;
}

export interface CrossProcessIntegration {
    overall_plant_efficiency: number;
    ai_optimized_efficiency: number;
    energy_optimization: EnergyOptimization;
    production_optimization: ProductionOptimization;
}

export interface PowerConsumption {
    grinding_mills: number;
    kiln_fans: number;
    compressors: number;
    conveyors: number;
    lighting_others: number;
    total_kwh_per_ton: number;
    ai_optimized_kwh: number;
}

export interface MaterialHandling {
    conveyor_efficiency: number;
    loading_time_minutes: number;
    ai_optimized_time: number;
    bottleneck_prediction: string;
}

export interface UtilitiesMaterialHandling {
    power_consumption: PowerConsumption;
    material_handling: MaterialHandling;
}

export interface HistoricalDataPoint {
    created_at: string;
    energy_consumption: number;
    production_rate: number;
    quality_score: number;
    efficiency: number;
    co2_emissions: number;
}

export interface AIInsights {
    immediate_actions: string[];
    predictive_alerts: string[];
    optimization_opportunities: string[];
}

export interface DailySavings {
    energy_cost_saved: number;
    fuel_cost_saved: number;
    maintenance_cost_saved: number;
    total_daily_savings: number;
}

export interface MonthlyProjections {
    energy_savings: number;
    production_increase: number;
    quality_improvement: number;
    sustainability_score: number;
}

export interface AnnualImpact {
    cost_reduction: number;
    co2_reduction: number;
    efficiency_improvement: number;
    roi_percentage: number;
}

export interface BusinessMetrics {
    daily_savings: DailySavings;
    monthly_projections: MonthlyProjections;
    annual_impact: AnnualImpact;
}

export interface SystemHealth {
    ai_model_accuracy: number;
    data_quality_score: number;
    system_uptime: number;
    active_sensors: string;
}

export interface PlantData {
    created_at: string;
    plant_status: string;
    raw_materials: RawMaterials;
    kiln_operations: KilnOperations;
    quality_control: QualityControl;
    fuel_optimization: FuelOptimization;
    cross_process_integration: CrossProcessIntegration;
    utilities_material_handling: UtilitiesMaterialHandling;
    historical_performance: HistoricalDataPoint[];
    ai_insights: AIInsights;
    business_metrics: BusinessMetrics;
    system_health: SystemHealth;
}

export type ModuleId =
    | 'executive'
    | 'rawmaterials'
    | 'kiln'
    | 'quality'
    | 'fuel'
    | 'integration'
    | 'utilities'
    | 'insights';

export interface NavigationItem {
    id: ModuleId;
    label: string;
    icon: string;
}
