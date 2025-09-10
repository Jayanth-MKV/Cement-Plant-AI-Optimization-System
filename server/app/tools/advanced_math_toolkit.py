from typing import Dict, List
from app.schemas.tool_metrics import CementMetrics


class AdvancedCementCalculations:
    """Advanced mathematical calculations for cement plant optimization"""

    # 7. KILN PERFORMANCE CALCULATIONS
    def calculate_kiln_drive_power(self, kiln_diameter_m: float, kiln_length_m: float, rotation_rpm: float, clinker_load_t: float) -> CementMetrics:
        """Calculate theoretical kiln drive power requirement"""
        # Empirical formula: P = K * D^2.5 * L * RPM * Load_factor
        k_factor = 0.015  # Empirical constant
        power_kw = k_factor * (kiln_diameter_m**2.5) * kiln_length_m * rotation_rpm * (clinker_load_t / 100)

        status = "CALCULATED"
        recommendation = f"Theoretical drive power: {power_kw:.1f} kW"

        return CementMetrics(power_kw, status, recommendation)

    def calculate_kiln_residence_time(self, kiln_length_m: float, slope_pct: float, rotation_rpm: float) -> CementMetrics:
        """Calculate material residence time in kiln"""
        # Residence time = L / (3.6 * slope * RPM * D)
        # Simplified formula for estimation
        residence_time_min = kiln_length_m / (0.3 * slope_pct * rotation_rpm)

        if 20 <= residence_time_min <= 40:
            status = "OPTIMAL"
            recommendation = "Optimal residence time for clinker formation"
        elif residence_time_min < 20:
            status = "SHORT"
            recommendation = "Increase slope or reduce RPM for better burning"
        else:
            status = "LONG"
            recommendation = "Reduce slope or increase RPM to improve efficiency"

        return CementMetrics(residence_time_min, status, recommendation, 20, 40)

    def calculate_heat_balance_efficiency(self, fuel_input_mj: float, clinker_output_kg: float, heat_losses_mj: float = 0) -> CementMetrics:
        """Calculate kiln heat balance efficiency"""
        theoretical_heat_required = clinker_output_kg * 1.8  # 1.8 MJ/kg theoretical minimum

        if heat_losses_mj == 0:
            heat_losses_mj = fuel_input_mj * 0.15  # Assume 15% heat loss

        efficiency_pct = (theoretical_heat_required / fuel_input_mj) * 100

        if efficiency_pct >= 70:
            status = "EXCELLENT"
            recommendation = "Excellent heat utilization"
        elif efficiency_pct >= 60:
            status = "GOOD"
            recommendation = "Good heat utilization"
        elif efficiency_pct >= 50:
            status = "AVERAGE"
            recommendation = "Consider heat recovery improvements"
        else:
            status = "POOR"
            recommendation = "Significant heat losses - audit required"

        return CementMetrics(efficiency_pct, status, recommendation, 50, 100)

    # 8. GRINDING CIRCUIT CALCULATIONS
    def calculate_mill_circulating_load(self, mill_feed_tph: float, mill_product_tph: float, separator_efficiency_pct: float) -> CementMetrics:
        """Calculate circulating load in grinding circuit"""
        if separator_efficiency_pct >= 100 or separator_efficiency_pct <= 0:
            return CementMetrics(0, "ERROR", "Invalid separator efficiency")

        circulating_load_pct = ((100 - separator_efficiency_pct) / separator_efficiency_pct) * 100

        if circulating_load_pct <= 300:
            status = "OPTIMAL"
            recommendation = "Optimal circulating load"
        elif circulating_load_pct <= 500:
            status = "HIGH"
            recommendation = "High circulating load - check separator efficiency"
        else:
            status = "EXCESSIVE"
            recommendation = "Excessive circulating load - separator maintenance needed"

        return CementMetrics(circulating_load_pct, status, recommendation, 0, 500)

    def calculate_separator_efficiency(self, coarse_feed_tph: float, coarse_reject_tph: float, fine_feed_tph: float, fine_product_tph: float) -> CementMetrics:
        """Calculate separator efficiency using Tromp curve data"""
        if coarse_feed_tph <= 0 or fine_feed_tph <= 0:
            return CementMetrics(0, "ERROR", "Invalid feed data")

        # Simplified separator efficiency calculation
        coarse_efficiency = (coarse_reject_tph / coarse_feed_tph) * 100
        fine_efficiency = (fine_product_tph / fine_feed_tph) * 100
        overall_efficiency = (coarse_efficiency + fine_efficiency) / 2

        if overall_efficiency >= 85:
            status = "EXCELLENT"
            recommendation = "Excellent separator performance"
        elif overall_efficiency >= 75:
            status = "GOOD"
            recommendation = "Good separator performance"
        elif overall_efficiency >= 65:
            status = "AVERAGE"
            recommendation = "Separator tuning recommended"
        else:
            status = "POOR"
            recommendation = "Separator maintenance or replacement needed"

        return CementMetrics(overall_efficiency, status, recommendation, 65, 100)

    # 9. QUALITY CONTROL CALCULATIONS
    def calculate_setting_time_prediction(self, cao_pct: float, so3_pct: float, c3a_pct: float, fineness_blaine: float) -> CementMetrics:
        """Predict initial setting time based on chemistry and fineness"""
        # Empirical formula for setting time prediction
        base_time = 120  # Base setting time in minutes

        # Adjustments based on composition
        cao_factor = (cao_pct - 64) * 2  # CaO effect
        so3_factor = (so3_pct - 2.5) * -10  # SO3 retarding effect
        c3a_factor = (c3a_pct - 8) * -3  # C3A accelerating effect
        fineness_factor = (fineness_blaine - 3200) / 100 * -2  # Fineness effect

        predicted_time = base_time + cao_factor + so3_factor + c3a_factor + fineness_factor

        if 45 <= predicted_time <= 375:  # ASTM C150 requirements
            status = "WITHIN_SPEC"
            recommendation = "Setting time within specification"
        elif predicted_time < 45:
            status = "TOO_FAST"
            recommendation = "Increase SO3 or reduce fineness"
        else:
            status = "TOO_SLOW"
            recommendation = "Reduce SO3 or increase fineness/C3A"

        return CementMetrics(predicted_time, status, recommendation, 45, 375)

    def calculate_soundness_expansion(self, cao_free_pct: float, mgo_pct: float) -> CementMetrics:
        """Calculate potential soundness expansion"""
        # Simplified soundness calculation
        expansion_mm = (cao_free_pct * 0.5) + (max(0, mgo_pct - 5) * 0.3)

        if expansion_mm <= 10:
            status = "GOOD"
            recommendation = "Sound cement, no expansion issues"
        elif expansion_mm <= 20:
            status = "MARGINAL"
            recommendation = "Monitor free CaO and MgO levels"
        else:
            status = "UNSOUND"
            recommendation = "Reduce free CaO or MgO content"

        return CementMetrics(expansion_mm, status, recommendation, 0, 10)

    # 10. ALTERNATIVE FUEL CALCULATIONS
    def calculate_fuel_blend_optimization(self, fuels_data: List[Dict]) -> Dict:
        """Optimize fuel blend for cost and environmental impact"""
        results = {}
        total_cost = 0
        total_co2 = 0
        total_energy = 0

        for fuel in fuels_data:
            fuel_cost = fuel["consumption_tph"] * fuel.get("cost_per_ton", 100)
            fuel_co2 = fuel["consumption_tph"] * fuel.get("co2_factor", 2.4)
            fuel_energy = fuel["consumption_tph"] * fuel["calorific_value_mj_kg"]

            total_cost += fuel_cost
            total_co2 += fuel_co2
            total_energy += fuel_energy

        results["total_cost_per_hour"] = total_cost
        results["total_co2_tph"] = total_co2
        results["total_energy_mj_h"] = total_energy

        if len(fuels_data) > 1:
            alt_fuel_ratio = sum(f["consumption_tph"] for f in fuels_data[1:]) / sum(f["consumption_tph"] for f in fuels_data) * 100
            results["alt_fuel_percentage"] = alt_fuel_ratio

        return results

    def calculate_chlorine_balance(self, raw_materials_cl: float, fuel_cl: float, clinker_production_tph: float) -> CementMetrics:
        """Calculate chlorine balance in kiln system"""
        total_cl_input = raw_materials_cl + fuel_cl
        cl_concentration_ppm = (total_cl_input / clinker_production_tph) * 1000

        if cl_concentration_ppm <= 100:
            status = "LOW"
            recommendation = "Chlorine level acceptable"
        elif cl_concentration_ppm <= 300:
            status = "MODERATE"
            recommendation = "Monitor chlorine levels"
        elif cl_concentration_ppm <= 500:
            status = "HIGH"
            recommendation = "Consider reducing high-chlorine fuels"
        else:
            status = "CRITICAL"
            recommendation = "Immediate action required - reduce chlorine inputs"

        return CementMetrics(cl_concentration_ppm, status, recommendation, 0, 500)
