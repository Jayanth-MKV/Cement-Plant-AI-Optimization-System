// Backend API Response Types
export interface PlantOverview {
  energy_consumption_kwh: number;
  quality_score: number;
  cost_savings_usd: number;
  co2_reduction_kg: number;
  overall_efficiency: number;
}

export interface RawMaterialData {
  id: number;
  created_at: string;
  material_type: string;
  feed_rate_tph: number;
  moisture_content_pct?: number;
  chemical_composition?: any;
}

export interface GrindingData {
  id: number;
  created_at: string;
  mill_id: number;
  total_feed_rate_tph: number;
  power_consumption_kw: number;
  specific_energy_consumption_kwh_per_ton: number;
  fineness_blaine_cm2_per_g?: number;
  mill_load_pct?: number;
}

export interface KilnData {
  id: number;
  created_at: string;
  kiln_id: number;
  burning_zone_temp_c: number;
  fuel_rate_tph: number;
  coal_rate_tph?: number;
  alt_fuel_rate_tph?: number;
  thermal_substitution_pct?: number;
  co2_emissions_tph?: number;
  specific_heat_consumption_mjkg?: number;
}

export interface QualityData {
  id: number;
  created_at: string;
  cement_type: string;
  compressive_strength_28d_mpa?: number;
  blaine_fineness_cm2_per_g?: number;
  setting_time_initial_min?: number;
  setting_time_final_min?: number;
  ai_quality_score?: number;
}

export interface AlternativeFuelsData {
  id: number;
  created_at: string;
  fuel_type: string;
  calorific_value_mj_kg: number;
  thermal_substitution_pct?: number;
  co2_reduction_tph?: number;
}

export interface UtilitiesData {
  id: number;
  created_at: string;
  equipment_id: string;
  equipment_type: string;
  power_consumption_kw: number;
  operating_hours: number;
  efficiency_pct?: number;
  maintenance_status?: string;
}

export interface AIRecommendation {
  id: number;
  created_at: string;
  recommendation_type: string;
  process_area: string;
  description: string;
  priority_level: number;
  expected_savings_usd?: number;
  action_taken: boolean;
  action_timestamp?: string;
}

export interface OptimizationResult {
  id: number;
  created_at: string;
  optimization_type: string;
  baseline_value: number;
  optimized_value: number;
  improvement_pct: number;
  cost_saved_usd?: number;
  energy_saved_kwh?: number;
  co2_reduced_kg?: number;
}

export interface CombinedPlantData {
  plant_overview: PlantOverview;
  raw_material: RawMaterialData[];
  grinding: GrindingData[];
  kiln: KilnData[];
  quality: QualityData[];
  alternative_fuels: AlternativeFuelsData[];
  utilities: UtilitiesData[];
  recommendations?: AIRecommendation[]; // Added for WebSocket integration
  created_at: string;
}

export interface PlantReport {
  generated_at: string;
  report: {
    plant_efficiency_score: number;
    chemistry_analysis: {
      lsf: {
        value: number;
        status: string;
        target: string;
      };
      silica_modulus: {
        value: number;
        status: string;
        target: string;
      };
      alumina_modulus: {
        value: number;
        status: string;
        target: string;
      };
      c3s: {
        value: number;
        status: string;
        target: string;
      };
      recommendations: string[];
    };
    grinding_efficiency: {
      specific_energy_consumption: {
        value: number;
        unit: string;
        status: string;
      };
      target_sec: string;
      recommendations: string[];
      optimization_potential: number;
    };
    fuel_optimization: {
      current_tsr: number;
      target_tsr: number;
      recommended_coal_rate: number;
      recommended_alt_fuel_rate: number;
      co2_reduction_kg_h: number;
      feasibility: string;
    };
    energy_savings: {
      energy_saved_kwh: number;
      savings_percentage: number;
      cost_saved_usd: number;
      co2_reduced_kg: number;
    };
    recommendations: Array<{
      priority: string;
      area: string;
      action: string;
      impact: string;
      estimated_savings: string;
    }>;
    business_impact: {
      estimated_annual_savings: number;
      co2_reduction_annual: number;
      efficiency_improvement_pct: number;
    };
  };
}

export interface OptimizationRequest {
  parameters?: Record<string, any>;
  target_values?: Record<string, number>;
}

export interface ChemistryAnalysis {
  analysis: any;
  created_at: string;
}

export interface GrindingEfficiency {
  efficiency: any;
  created_at: string;
}

export interface FuelMixOptimization {
  optimization: any;
  created_at: string;
}

export interface OEECalculation {
  oee: {
    availability: number;
    performance: number;
    quality: number;
    overall_oee: number;
  };
  created_at: string;
}

export interface KPISummary {
  total_energy_saved_kwh: number;
  last_optimization: string | null;
  open_recommendations: number;
}

export interface WebSocketStatus {
  active_connections: number;
  connection_details: any[];
  created_at: string;
}

// API Response wrapper
export interface APIResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
  timestamp: string;
}