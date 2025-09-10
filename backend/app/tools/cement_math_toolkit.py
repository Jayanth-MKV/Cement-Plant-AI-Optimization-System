# Simple Mathematical Tools for Cement Plant Operations
# Using database columns to calculate key efficiency metrics

from app.schemas.tool_metrics import CementMetrics


class CementMathTools:
    """Mathematical tools for cement plant efficiency analysis"""

    # 1. RAW MATERIAL CHEMISTRY TOOLS
    def calculate_lsf(self, cao_pct: float, sio2_pct: float, al2o3_pct: float, fe2o3_pct: float, so3_pct: float = 0) -> CementMetrics:
        """Lime Saturation Factor - Critical for clinker formation"""
        lsf = (cao_pct - 0.7 * so3_pct) / (2.8 * sio2_pct + 1.2 * al2o3_pct + 0.65 * fe2o3_pct)

        if 0.92 <= lsf <= 0.98:
            status = "OPTIMAL"
            recommendation = "LSF within target range"
        elif lsf < 0.92:
            status = "LOW"
            recommendation = "Increase limestone or reduce siliceous materials"
        else:
            status = "HIGH"
            recommendation = "Reduce limestone or increase clay/iron ore"

        return CementMetrics(lsf, status, recommendation, 0.92, 0.98)

    def calculate_silica_modulus(self, sio2_pct: float, al2o3_pct: float, fe2o3_pct: float) -> CementMetrics:
        """Silica Modulus - Controls setting time and strength development"""
        sm = sio2_pct / (al2o3_pct + fe2o3_pct)

        if 2.0 <= sm <= 3.0:
            status = "OPTIMAL"
            recommendation = "SM within target range"
        elif sm < 2.0:
            status = "LOW"
            recommendation = "Increase silica content or reduce alumina/iron"
        else:
            status = "HIGH"
            recommendation = "Reduce silica content or increase alumina/iron"

        return CementMetrics(sm, status, recommendation, 2.0, 3.0)

    def calculate_alumina_modulus(self, al2o3_pct: float, fe2o3_pct: float) -> CementMetrics:
        """Alumina Modulus - Affects cement color and heat of hydration"""
        am = al2o3_pct / fe2o3_pct

        if 1.5 <= am <= 2.5:
            status = "OPTIMAL"
            recommendation = "AM within target range"
        elif am < 1.5:
            status = "LOW"
            recommendation = "Increase alumina content or reduce iron"
        else:
            status = "HIGH"
            recommendation = "Reduce alumina content or increase iron"

        return CementMetrics(am, status, recommendation, 1.5, 2.5)

    # 2. GRINDING EFFICIENCY TOOLS
    def calculate_specific_power_consumption(self, power_consumption_kw: float, total_feed_rate_tph: float) -> CementMetrics:
        """Specific Power Consumption - Energy efficiency metric"""
        if total_feed_rate_tph <= 0:
            return CementMetrics(0, "ERROR", "Invalid feed rate")

        spc = power_consumption_kw / total_feed_rate_tph

        if spc <= 35:
            status = "EXCELLENT"
            recommendation = "Excellent energy efficiency"
        elif spc <= 40:
            status = "GOOD"
            recommendation = "Good energy efficiency"
        elif spc <= 50:
            status = "AVERAGE"
            recommendation = "Consider optimization - check mill loading"
        else:
            status = "POOR"
            recommendation = "High energy consumption - check liner wear, ball charge, or separator efficiency"

        return CementMetrics(spc, status, recommendation, 0, 50)

    def calculate_mill_loading(self, motor_current_a: float, rated_current_a: float = 100) -> CementMetrics:
        """Mill Loading Assessment"""
        loading_pct = (motor_current_a / rated_current_a) * 100

        if 85 <= loading_pct <= 95:
            status = "OPTIMAL"
            recommendation = "Optimal mill loading"
        elif loading_pct < 85:
            status = "UNDERLOADED"
            recommendation = "Increase feed rate or check material flow"
        else:
            status = "OVERLOADED"
            recommendation = "Reduce feed rate or check for mill blockages"

        return CementMetrics(loading_pct, status, recommendation, 85, 95)

    # 3. KILN THERMAL EFFICIENCY TOOLS
    def calculate_thermal_efficiency(self, fuel_rate_tph: float, calorific_value_mj_kg: float, clinker_production_tph: float) -> CementMetrics:
        """Kiln Thermal Efficiency"""
        if clinker_production_tph <= 0:
            return CementMetrics(0, "ERROR", "Invalid clinker production")

        heat_input_mj_h = fuel_rate_tph * 1000 * calorific_value_mj_kg
        specific_heat_consumption = heat_input_mj_h / (clinker_production_tph * 1000)  # MJ/kg clinker

        if specific_heat_consumption <= 3.2:
            status = "EXCELLENT"
            recommendation = "Excellent thermal efficiency"
        elif specific_heat_consumption <= 3.5:
            status = "GOOD"
            recommendation = "Good thermal efficiency"
        elif specific_heat_consumption <= 3.8:
            status = "AVERAGE"
            recommendation = "Consider preheater optimization or heat recovery"
        else:
            status = "POOR"
            recommendation = "High heat consumption - check kiln insulation, preheater efficiency"

        return CementMetrics(specific_heat_consumption, status, recommendation, 0, 3.8)

    def calculate_oxygen_efficiency(self, oxygen_pct: float) -> CementMetrics:
        """Kiln Oxygen Level Assessment"""
        if 2.0 <= oxygen_pct <= 4.0:
            status = "OPTIMAL"
            recommendation = "Optimal combustion air control"
        elif oxygen_pct < 2.0:
            status = "LOW"
            recommendation = "Increase secondary air - risk of incomplete combustion"
        else:
            status = "HIGH"
            recommendation = "Reduce excess air to improve thermal efficiency"

        return CementMetrics(oxygen_pct, status, recommendation, 2.0, 4.0)

    # 4. QUALITY PREDICTION TOOLS
    def predict_28day_strength(self, strength_1d: float, strength_7d: float) -> CementMetrics:
        """Predict 28-day strength from early age data"""
        if strength_7d > 0:
            # Empirical relationship: 28d = 7d * (1.2 to 1.4)
            predicted_28d = strength_7d * 1.3
        elif strength_1d > 0:
            # Empirical relationship: 28d = 1d * (2.5 to 3.5)
            predicted_28d = strength_1d * 3.0
        else:
            return CementMetrics(0, "ERROR", "Insufficient data")

        if predicted_28d >= 53:
            status = "GOOD"
            recommendation = "Strength development on track"
        elif predicted_28d >= 45:
            status = "MARGINAL"
            recommendation = "Monitor closely - may need process adjustment"
        else:
            status = "LOW"
            recommendation = "Adjust fineness, clinker factor, or check raw mix"

        return CementMetrics(predicted_28d, status, recommendation, 53, None)

    def calculate_fineness_efficiency(self, blaine_cm2g: float, residue_45micron_pct: float) -> CementMetrics:
        """Assess grinding fineness efficiency"""
        # Ideal: High Blaine with low residue
        if blaine_cm2g >= 3200 and residue_45micron_pct <= 10:
            status = "EXCELLENT"
            recommendation = "Excellent fineness distribution"
        elif blaine_cm2g >= 2800 and residue_45micron_pct <= 15:
            status = "GOOD"
            recommendation = "Good fineness distribution"
        else:
            status = "NEEDS_IMPROVEMENT"
            recommendation = "Optimize separator efficiency or mill parameters"

        return CementMetrics(blaine_cm2g, status, recommendation, 2800, 4000)

    # 5. ALTERNATIVE FUEL EFFICIENCY TOOLS
    def calculate_thermal_substitution_rate(self, alt_fuel_energy_mj: float, total_fuel_energy_mj: float) -> CementMetrics:
        """Calculate thermal substitution rate"""
        if total_fuel_energy_mj <= 0:
            return CementMetrics(0, "ERROR", "Invalid total fuel energy")

        tsr = (alt_fuel_energy_mj / total_fuel_energy_mj) * 100

        if tsr >= 30:
            status = "EXCELLENT"
            recommendation = "Excellent alternative fuel utilization"
        elif tsr >= 20:
            status = "GOOD"
            recommendation = "Good alternative fuel usage"
        elif tsr >= 10:
            status = "MODERATE"
            recommendation = "Potential to increase alternative fuel usage"
        else:
            status = "LOW"
            recommendation = "Significant opportunity for alternative fuel increase"

        return CementMetrics(tsr, status, recommendation, 0, 100)

    def calculate_co2_savings(self, coal_replaced_tph: float, alt_fuel_tph: float, coal_co2_factor: float = 2.4, alt_fuel_co2_factor: float = 1.8) -> CementMetrics:
        """Calculate CO2 savings from alternative fuel use"""
        co2_savings_tph = (coal_replaced_tph * coal_co2_factor) - (alt_fuel_tph * alt_fuel_co2_factor)

        if co2_savings_tph > 0:
            status = "POSITIVE"
            recommendation = f"CO2 reduction of {co2_savings_tph:.2f} t/h achieved"
        else:
            status = "NEGATIVE"
            recommendation = "Alternative fuel has higher CO2 emissions than coal"

        return CementMetrics(co2_savings_tph, status, recommendation)

    # 6. OVERALL PLANT EFFICIENCY TOOLS
    def calculate_overall_equipment_effectiveness(self, availability_pct: float, performance_pct: float, quality_pct: float) -> CementMetrics:
        """Calculate OEE for plant sections"""
        oee = (availability_pct * performance_pct * quality_pct) / 10000  # Convert to percentage

        if oee >= 85:
            status = "WORLD_CLASS"
            recommendation = "World-class performance"
        elif oee >= 75:
            status = "GOOD"
            recommendation = "Good performance"
        elif oee >= 65:
            status = "AVERAGE"
            recommendation = "Room for improvement"
        else:
            status = "POOR"
            recommendation = "Significant improvement needed"

        return CementMetrics(oee, status, recommendation, 65, 100)

    def calculate_energy_intensity(self, total_power_kwh: float, cement_production_tons: float) -> CementMetrics:
        """Calculate plant energy intensity"""
        if cement_production_tons <= 0:
            return CementMetrics(0, "ERROR", "Invalid production data")

        energy_intensity = total_power_kwh / cement_production_tons  # kWh/ton

        if energy_intensity <= 90:
            status = "EXCELLENT"
            recommendation = "Excellent energy efficiency"
        elif energy_intensity <= 110:
            status = "GOOD"
            recommendation = "Good energy efficiency"
        elif energy_intensity <= 130:
            status = "AVERAGE"
            recommendation = "Energy optimization opportunities exist"
        else:
            status = "POOR"
            recommendation = "High energy consumption - comprehensive audit needed"

        return CementMetrics(energy_intensity, status, recommendation, 0, 130)


# Example usage and testing
if __name__ == "__main__":
    tools = CementMathTools()

    # Test LSF calculation
    lsf_result = tools.calculate_lsf(cao_pct=65.2, sio2_pct=21.5, al2o3_pct=5.2, fe2o3_pct=3.1)
    print(f"LSF: {lsf_result.value:.3f} - {lsf_result.status} - {lsf_result.recommendation}")

    # Test SPC calculation
    spc_result = tools.calculate_specific_power_consumption(power_consumption_kw=850, total_feed_rate_tph=25)
    print(f"SPC: {spc_result.value:.1f} kWh/t - {spc_result.status} - {spc_result.recommendation}")

    print("Mathematical tools created successfully!")
