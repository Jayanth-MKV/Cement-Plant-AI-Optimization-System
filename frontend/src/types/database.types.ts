export interface Database {
  public: {
    Tables: {
      ai_recommendations: {
        Row: {
          id: number;
          created_at: string;
          process_area: string;
          recommendation_type: string;
          priority_level: number;
          description: string;
          estimated_savings_kwh: number | null;
          estimated_savings_cost: number | null;
          action_taken: boolean;
          operator_feedback: string | null;
        };
        Insert: {
          id?: number;
          created_at: string;
          process_area: string;
          recommendation_type: string;
          priority_level: number;
          description: string;
          estimated_savings_kwh?: number | null;
          estimated_savings_cost?: number | null;
          action_taken?: boolean;
          operator_feedback?: string | null;
        };
        Update: {
          id?: number;
          created_at?: string;
          process_area?: string;
          recommendation_type?: string;
          priority_level?: number;
          description?: string;
          estimated_savings_kwh?: number | null;
          estimated_savings_cost?: number | null;
          action_taken?: boolean;
          operator_feedback?: string | null;
        };
      };
      alternative_fuels: {
        Row: {
          id: number;
          created_at: string;
          fuel_type: string;
          calorific_value_mj_kg: number;
          consumption_rate_tph: number | null;
          moisture_content_pct: number | null;
          chlorine_content_pct: number | null;
          thermal_substitution_pct: number | null;
          co2_reduction_tph: number | null;
        };
        Insert: {
          id?: number;
          created_at: string;
          fuel_type: string;
          calorific_value_mj_kg: number;
          consumption_rate_tph?: number | null;
          moisture_content_pct?: number | null;
          chlorine_content_pct?: number | null;
          thermal_substitution_pct?: number | null;
          co2_reduction_tph?: number | null;
        };
        Update: {
          id?: number;
          created_at?: string;
          fuel_type?: string;
          calorific_value_mj_kg?: number;
          consumption_rate_tph?: number | null;
          moisture_content_pct?: number | null;
          chlorine_content_pct?: number | null;
          thermal_substitution_pct?: number | null;
          co2_reduction_tph?: number | null;
        };
      };
      grinding_operations: {
        Row: {
          id: number;
          created_at: string;
          mill_id: number;
          mill_type: string;
          total_feed_rate_tph: number;
          motor_current_a: number;
          power_consumption_kw: number;
          differential_pressure_mbar: number | null;
          mill_temperature_c: number | null;
          fineness_blaine_cm2g: number | null;
          residue_45micron_pct: number | null;
        };
        Insert: {
          id?: number;
          created_at: string;
          mill_id: number;
          mill_type: string;
          total_feed_rate_tph: number;
          motor_current_a: number;
          power_consumption_kw: number;
          differential_pressure_mbar?: number | null;
          mill_temperature_c?: number | null;
          fineness_blaine_cm2g?: number | null;
          residue_45micron_pct?: number | null;
        };
        Update: {
          id?: number;
          created_at?: string;
          mill_id?: number;
          mill_type?: string;
          total_feed_rate_tph?: number;
          motor_current_a?: number;
          power_consumption_kw?: number;
          differential_pressure_mbar?: number | null;
          mill_temperature_c?: number | null;
          fineness_blaine_cm2g?: number | null;
          residue_45micron_pct?: number | null;
        };
      };
      kiln_operations: {
        Row: {
          id: number;
          created_at: string;
          kiln_id: number;
          burning_zone_temp_c: number;
          preheater_temp_c: number | null;
          fuel_rate_tph: number;
          coal_rate_tph: number | null;
          alt_fuel_rate_tph: number | null;
          thermal_substitution_pct: number | null;
          oxygen_pct: number | null;
          co_ppm: number | null;
          nox_ppm: number | null;
          co2_emissions_tph: number | null;
          specific_heat_consumption_mjkg: number | null;
        };
        Insert: {
          id?: number;
          created_at: string;
          kiln_id: number;
          burning_zone_temp_c: number;
          preheater_temp_c?: number | null;
          fuel_rate_tph: number;
          coal_rate_tph?: number | null;
          alt_fuel_rate_tph?: number | null;
          thermal_substitution_pct?: number | null;
          oxygen_pct?: number | null;
          co_ppm?: number | null;
          nox_ppm?: number | null;
          co2_emissions_tph?: number | null;
          specific_heat_consumption_mjkg?: number | null;
        };
        Update: {
          id?: number;
          created_at?: string;
          kiln_id?: number;
          burning_zone_temp_c?: number;
          preheater_temp_c?: number | null;
          fuel_rate_tph?: number;
          coal_rate_tph?: number | null;
          alt_fuel_rate_tph?: number | null;
          thermal_substitution_pct?: number | null;
          oxygen_pct?: number | null;
          co_ppm?: number | null;
          nox_ppm?: number | null;
          co2_emissions_tph?: number | null;
          specific_heat_consumption_mjkg?: number | null;
        };
      };
      optimization_results: {
        Row: {
          id: number;
          created_at: string;
          optimization_type: string;
          baseline_value: number;
          optimized_value: number;
          improvement_pct: number;
          energy_saved_kwh: number | null;
          cost_saved_usd: number | null;
          co2_reduced_kg: number | null;
          model_confidence: number | null;
        };
        Insert: {
          id?: number;
          created_at: string;
          optimization_type: string;
          baseline_value: number;
          optimized_value: number;
          improvement_pct: number;
          energy_saved_kwh?: number | null;
          cost_saved_usd?: number | null;
          co2_reduced_kg?: number | null;
          model_confidence?: number | null;
        };
        Update: {
          id?: number;
          created_at?: string;
          optimization_type?: string;
          baseline_value?: number;
          optimized_value?: number;
          improvement_pct?: number;
          energy_saved_kwh?: number | null;
          cost_saved_usd?: number | null;
          co2_reduced_kg?: number | null;
          model_confidence?: number | null;
        };
      };
      quality_control: {
        Row: {
          id: number;
          created_at: string;
          sample_id: string;
          cement_type: string;
          compressive_strength_1d_mpa: number | null;
          compressive_strength_7d_mpa: number | null;
          compressive_strength_28d_mpa: number | null;
          initial_setting_time_min: number | null;
          final_setting_time_min: number | null;
          fineness_blaine_cm2g: number | null;
          soundness_mm: number | null;
          ai_quality_score: number | null;
          defect_detected: boolean;
        };
        Insert: {
          id?: number;
          created_at: string;
          sample_id: string;
          cement_type: string;
          compressive_strength_1d_mpa?: number | null;
          compressive_strength_7d_mpa?: number | null;
          compressive_strength_28d_mpa?: number | null;
          initial_setting_time_min?: number | null;
          final_setting_time_min?: number | null;
          fineness_blaine_cm2g?: number | null;
          soundness_mm?: number | null;
          ai_quality_score?: number | null;
          defect_detected?: boolean;
        };
        Update: {
          id?: number;
          created_at?: string;
          sample_id?: string;
          cement_type?: string;
          compressive_strength_1d_mpa?: number | null;
          compressive_strength_7d_mpa?: number | null;
          compressive_strength_28d_mpa?: number | null;
          initial_setting_time_min?: number | null;
          final_setting_time_min?: number | null;
          fineness_blaine_cm2g?: number | null;
          soundness_mm?: number | null;
          ai_quality_score?: number | null;
          defect_detected?: boolean;
        };
      };
      raw_material_feed: {
        Row: {
          id: number;
          created_at: string;
          material_type: string | null;
          feed_rate_tph: number | null;
          moisture_pct: number | null;
          cao_pct: number | null;
          sio2_pct: number | null;
          al2o3_pct: number | null;
          fe2o3_pct: number | null;
        };
        Insert: {
          created_at?: string;
          material_type?: string | null;
          feed_rate_tph?: number | null;
          moisture_pct?: number | null;
          cao_pct?: number | null;
          sio2_pct?: number | null;
          al2o3_pct?: number | null;
          fe2o3_pct?: number | null;
        };
        Update: {
          id?: number;
          created_at?: string;
          material_type?: string | null;
          feed_rate_tph?: number | null;
          moisture_pct?: number | null;
          cao_pct?: number | null;
          sio2_pct?: number | null;
          al2o3_pct?: number | null;
          fe2o3_pct?: number | null;
        };
      };
      utilities_monitoring: {
        Row: {
          id: number;
          created_at: string;
          equipment_type: string;
          equipment_id: string;
          power_consumption_kw: number;
          operating_efficiency_pct: number | null;
          maintenance_due_days: number | null;
          predicted_failure_risk: number | null;
        };
        Insert: {
          id?: number;
          created_at: string;
          equipment_type: string;
          equipment_id: string;
          power_consumption_kw: number;
          operating_efficiency_pct?: number | null;
          maintenance_due_days?: number | null;
          predicted_failure_risk?: number | null;
        };
        Update: {
          id?: number;
          created_at?: string;
          equipment_type?: string;
          equipment_id?: string;
          power_consumption_kw?: number;
          operating_efficiency_pct?: number | null;
          maintenance_due_days?: number | null;
          predicted_failure_risk?: number | null;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
