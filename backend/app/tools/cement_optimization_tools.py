"""
Cement Plant AI Optimization - MCP Toolkit
20% tools that do 80% of the work

Based on industry standards and formulas from research:
- LSF calculations (Lime Saturation Factor)
- Energy efficiency optimization
- Alternative fuel management
- Plant KPI dashboard
"""

from typing import Dict, List
import json
from dataclasses import dataclass


@dataclass
class CementKPI:
    """Data class for cement plant KPIs"""

    name: str
    value: float
    unit: str
    target_range: tuple
    status: str  # optimal, warning, critical


# Tool 1: Cement Chemistry Calculator (LSF, SM, AM, C3S)
class CementChemistryCalculator:
    """
    Core cement chemistry calculations - most important for quality control
    Based on industry standards and formulas
    """

    @staticmethod
    def calculate_lsf(cao: float, sio2: float, al2o3: float, fe2o3: float) -> float:
        """
        Calculate Lime Saturation Factor (LSF)
        Formula: LSF = CaO / (2.8*SiO2 + 1.2*Al2O3 + 0.65*Fe2O3)
        Target range: 92-98%
        """
        denominator = 2.8 * sio2 + 1.2 * al2o3 + 0.65 * fe2o3
        if denominator == 0:
            return 0
        return (cao / denominator) * 100

    @staticmethod
    def calculate_silica_modulus(sio2: float, al2o3: float, fe2o3: float) -> float:
        """
        Calculate Silica Modulus (SM)
        Formula: SM = SiO2 / (Al2O3 + Fe2O3)
        Target range: 2.2-3.2
        """
        denominator = al2o3 + fe2o3
        if denominator == 0:
            return 0
        return sio2 / denominator

    @staticmethod
    def calculate_alumina_modulus(al2o3: float, fe2o3: float) -> float:
        """
        Calculate Alumina Modulus (AM)
        Formula: AM = Al2O3 / Fe2O3
        Target range: 1.5-2.5 (optimal: 1.6)
        """
        if fe2o3 == 0:
            return 0
        return al2o3 / fe2o3

    @staticmethod
    def calculate_c3s(cao: float, sio2: float, al2o3: float, fe2o3: float) -> float:
        """
        Calculate C3S (Tricalcium Silicate) using Bogue calculation
        Formula: C3S = 4.07*CaO - 7.6*SiO2 - 6.72*Al2O3 - 1.43*Fe2O3
        """
        return 4.07 * cao - 7.6 * sio2 - 6.72 * al2o3 - 1.43 * fe2o3

    def analyze_chemistry(self, raw_material_data: Dict) -> Dict:
        """
        Comprehensive chemistry analysis with recommendations
        """
        cao = raw_material_data.get("cao_pct", 0)
        sio2 = raw_material_data.get("sio2_pct", 0)
        al2o3 = raw_material_data.get("al2o3_pct", 0)
        fe2o3 = raw_material_data.get("fe2o3_pct", 0)

        lsf = self.calculate_lsf(cao, sio2, al2o3, fe2o3)
        sm = self.calculate_silica_modulus(sio2, al2o3, fe2o3)
        am = self.calculate_alumina_modulus(al2o3, fe2o3)
        c3s = self.calculate_c3s(cao, sio2, al2o3, fe2o3)

        # Status evaluation
        lsf_status = "optimal" if 92 <= lsf <= 98 else ("warning" if 90 <= lsf <= 100 else "critical")
        sm_status = "optimal" if 2.2 <= sm <= 3.2 else "warning"
        am_status = "optimal" if 1.5 <= am <= 2.5 else "warning"

        recommendations = []
        if lsf < 92:
            recommendations.append("Increase CaO content - risk of under-burning")
        elif lsf > 98:
            recommendations.append("Reduce CaO content - risk of hard burning and high energy consumption")

        if am < 1.5:
            recommendations.append("Increase Al2O3 or reduce Fe2O3 - low heat of hydration")
        elif am > 2.5:
            recommendations.append("Reduce Al2O3 or increase Fe2O3 - risk of fast setting")

        return {
            "lsf": {"value": lsf, "status": lsf_status, "target": "92-98%"},
            "silica_modulus": {"value": sm, "status": sm_status, "target": "2.2-3.2"},
            "alumina_modulus": {"value": am, "status": am_status, "target": "1.5-2.5"},
            "c3s": {"value": c3s, "status": "calculated", "target": "50-70%"},
            "recommendations": recommendations,
        }


# Tool 2: Energy Efficiency Calculator
class EnergyEfficiencyCalculator:
    """
    Energy consumption and efficiency calculations
    Critical for cost optimization and sustainability
    """

    @staticmethod
    def calculate_specific_energy_consumption(power_kw: float, production_tph: float) -> float:
        """
        Calculate Specific Energy Consumption (SEC)
        Formula: SEC = Power (kW) / Production (tph)
        Target: <30-40 kWh/ton for grinding, 740 kCal/kg clinker for kiln
        """
        if production_tph == 0:
            return 0
        return power_kw / production_tph

    @staticmethod
    def calculate_thermal_efficiency(heat_input_mj_kg: float, theoretical_min: float = 1.75) -> float:
        """
        Calculate kiln thermal efficiency
        Formula: Efficiency = (Theoretical minimum / Actual consumption) * 100
        Theoretical minimum: ~1.75 MJ/kg clinker
        """
        if heat_input_mj_kg == 0:
            return 0
        return (theoretical_min / heat_input_mj_kg) * 100

    @staticmethod
    def calculate_energy_savings(baseline_kwh: float, optimized_kwh: float, cost_per_kwh: float = 0.15) -> Dict:
        """
        Calculate energy savings and cost benefits
        """
        savings_kwh = baseline_kwh - optimized_kwh
        savings_percentage = (savings_kwh / baseline_kwh) * 100 if baseline_kwh > 0 else 0
        cost_savings = savings_kwh * cost_per_kwh
        co2_reduction = savings_kwh * 0.5  # Approx 0.5 kg CO2/kWh

        return {"energy_saved_kwh": savings_kwh, "savings_percentage": savings_percentage, "cost_saved_usd": cost_savings, "co2_reduced_kg": co2_reduction}

    def analyze_grinding_efficiency(self, grinding_data: Dict) -> Dict:
        """
        Comprehensive grinding efficiency analysis
        """
        power_kw = grinding_data.get("power_consumption_kw", 0)
        feed_rate = grinding_data.get("total_feed_rate_tph", 0)
        mill_type = grinding_data.get("mill_type", "")
        dp_mbar = grinding_data.get("differential_pressure_mbar", 0)

        sec = self.calculate_specific_energy_consumption(power_kw, feed_rate)

        # Mill-specific analysis
        recommendations = []
        if mill_type == "VRM":
            if dp_mbar < 65:
                recommendations.append("Increase feed rate or reduce air flow - VRM DP too low")
            elif dp_mbar > 75:
                recommendations.append("Reduce feed rate or increase air flow - VRM DP too high")

        status = "optimal" if sec < 35 else ("warning" if sec < 45 else "critical")

        if sec > 40:
            recommendations.append("High specific energy consumption - check grinding aids and mill optimization")

        return {
            "specific_energy_consumption": {"value": sec, "unit": "kWh/ton", "status": status},
            "target_sec": "30-40 kWh/ton",
            "recommendations": recommendations,
            "optimization_potential": max(0, sec - 35) * feed_rate,  # Potential savings in kW
        }


# Tool 3: Alternative Fuel Optimizer
class AlternativeFuelOptimizer:
    """
    Alternative fuel calculation and optimization
    Key for sustainability and cost reduction
    """

    # Standard fuel properties
    FUEL_PROPERTIES = {
        "coal": {"cv": 25.0, "co2_factor": 0.094},  # MJ/kg, kg CO2/MJ
        "waste_tire": {"cv": 32.5, "co2_factor": 0.085},
        "biomass": {"cv": 18.7, "co2_factor": 0.000},  # Carbon neutral
        "RDF": {"cv": 15.5, "co2_factor": 0.083},
        "petcoke": {"cv": 35.0, "co2_factor": 0.102},
    }

    @staticmethod
    def calculate_thermal_substitution_rate(alt_fuel_mj: float, total_fuel_mj: float) -> float:
        """
        Calculate thermal substitution rate
        Formula: TSR = (Alt fuel energy / Total fuel energy) * 100
        """
        if total_fuel_mj == 0:
            return 0
        return (alt_fuel_mj / total_fuel_mj) * 100

    def calculate_fuel_energy(self, fuel_type: str, consumption_tph: float) -> float:
        """
        Calculate energy content of fuel
        """
        cv = self.FUEL_PROPERTIES.get(fuel_type, {}).get("cv", 25.0)
        return consumption_tph * cv * 1000  # MJ/h

    def optimize_fuel_mix(self, kiln_data: Dict, target_tsr: float = 30.0) -> Dict:
        """
        Optimize fuel mix for maximum alternative fuel usage
        """
        coal_rate = kiln_data.get("coal_rate_tph", 0)
        alt_fuel_rate = kiln_data.get("alt_fuel_rate_tph", 0)
        fuel_type = kiln_data.get("alt_fuel_type", "waste_tire")

        coal_energy = self.calculate_fuel_energy("coal", coal_rate)
        alt_fuel_energy = self.calculate_fuel_energy(fuel_type, alt_fuel_rate)
        total_energy = coal_energy + alt_fuel_energy

        current_tsr = self.calculate_thermal_substitution_rate(alt_fuel_energy, total_energy)

        # Calculate optimal mix
        target_alt_energy = (target_tsr / 100) * total_energy
        target_alt_fuel_rate = target_alt_energy / (self.FUEL_PROPERTIES[fuel_type]["cv"] * 1000)
        target_coal_energy = total_energy - target_alt_energy
        target_coal_rate = target_coal_energy / (self.FUEL_PROPERTIES["coal"]["cv"] * 1000)

        # CO2 reduction calculation
        coal_co2 = coal_energy * self.FUEL_PROPERTIES["coal"]["co2_factor"]
        alt_co2 = alt_fuel_energy * self.FUEL_PROPERTIES[fuel_type]["co2_factor"]
        current_co2_kg_h = (coal_co2 + alt_co2) / 3.6  # Convert to kg/h

        optimized_coal_co2 = target_coal_energy * self.FUEL_PROPERTIES["coal"]["co2_factor"]
        optimized_alt_co2 = target_alt_energy * self.FUEL_PROPERTIES[fuel_type]["co2_factor"]
        optimized_co2_kg_h = (optimized_coal_co2 + optimized_alt_co2) / 3.6

        co2_reduction = current_co2_kg_h - optimized_co2_kg_h

        return {
            "current_tsr": current_tsr,
            "target_tsr": target_tsr,
            "recommended_coal_rate": target_coal_rate,
            "recommended_alt_fuel_rate": target_alt_fuel_rate,
            "co2_reduction_kg_h": co2_reduction,
            "feasibility": "feasible" if target_tsr <= 40 else "review_required",
        }


# Tool 4: Plant KPI Dashboard Calculator
class PlantKPIDashboard:
    """
    Comprehensive plant performance calculator
    Aggregates all key metrics for management dashboard
    """

    def __init__(self):
        self.chemistry_calc = CementChemistryCalculator()
        self.energy_calc = EnergyEfficiencyCalculator()
        self.fuel_optimizer = AlternativeFuelOptimizer()

    def calculate_plant_efficiency_score(self, plant_data: Dict) -> float:
        """
        Calculate overall plant efficiency score (0-100)
        Weighted average of key performance areas
        """
        weights = {"energy_efficiency": 0.25, "quality_score": 0.25, "thermal_substitution": 0.20, "availability": 0.15, "environmental": 0.15}

        # Energy efficiency score (based on SEC)
        sec = plant_data.get("specific_energy_consumption", 80)
        energy_score = max(0, 100 - (sec - 60) * 2)  # 60 kWh/ton = 100 points

        # Quality score (from AI quality control)
        quality_score = plant_data.get("ai_quality_score", 90)

        # Thermal substitution score
        tsr = plant_data.get("thermal_substitution_pct", 0)
        tsr_score = min(100, tsr * 2.5)  # 40% TSR = 100 points

        # Plant availability
        availability = plant_data.get("plant_availability_pct", 85)

        # Environmental score (CO2 emissions)
        co2_emissions = plant_data.get("co2_emissions_per_ton", 900)
        env_score = max(0, 100 - (co2_emissions - 600) * 0.2)  # 600 kg/ton = 100 points

        overall_score = (
            weights["energy_efficiency"] * energy_score
            + weights["quality_score"] * quality_score
            + weights["thermal_substitution"] * tsr_score
            + weights["availability"] * availability
            + weights["environmental"] * env_score
        )

        return round(overall_score, 1)

    def generate_comprehensive_report(self, all_plant_data: Dict) -> Dict:
        """
        Generate comprehensive plant performance report
        """
        # Chemistry analysis
        chemistry = self.chemistry_calc.analyze_chemistry(all_plant_data.get("raw_material", {}))

        # Energy efficiency
        grinding_efficiency = self.energy_calc.analyze_grinding_efficiency(all_plant_data.get("grinding", {}))

        # Fuel optimization
        fuel_optimization = self.fuel_optimizer.optimize_fuel_mix(all_plant_data.get("kiln", {}))

        # Overall efficiency score
        efficiency_score = self.calculate_plant_efficiency_score(all_plant_data.get("overview", {}))

        # Business impact calculations
        energy_baseline = all_plant_data.get("energy_baseline_kwh", 5000)
        current_energy = all_plant_data.get("current_energy_kwh", 4500)
        energy_savings = self.energy_calc.calculate_energy_savings(energy_baseline, current_energy)

        return {
            "plant_efficiency_score": efficiency_score,
            "chemistry_analysis": chemistry,
            "grinding_efficiency": grinding_efficiency,
            "fuel_optimization": fuel_optimization,
            "energy_savings": energy_savings,
            "recommendations": self.generate_priority_recommendations(chemistry, grinding_efficiency, fuel_optimization),
            "business_impact": {
                "estimated_annual_savings": energy_savings["cost_saved_usd"] * 8760,  # Annual
                "co2_reduction_annual": energy_savings["co2_reduced_kg"] * 8760,
                "efficiency_improvement_pct": (efficiency_score - 70) if efficiency_score > 70 else 0,
            },
        }

    def generate_priority_recommendations(self, chemistry: Dict, grinding: Dict, fuel: Dict) -> List[Dict]:
        """
        Generate prioritized recommendations based on impact and feasibility
        """
        recommendations = []

        # High priority - immediate impact
        if chemistry["lsf"]["status"] == "critical":
            recommendations.append(
                {
                    "priority": "HIGH",
                    "area": "Raw Material",
                    "action": "Adjust CaO content immediately",
                    "impact": "Quality and energy efficiency",
                    "estimated_savings": "5-10% energy reduction",
                }
            )

        if grinding.get("optimization_potential", 0) > 500:  # >500 kW potential savings
            recommendations.append(
                {
                    "priority": "HIGH",
                    "area": "Grinding",
                    "action": "Optimize mill parameters and grinding aids",
                    "impact": "Energy cost reduction",
                    "estimated_savings": f"{grinding['optimization_potential']:.0f} kW potential",
                }
            )

        # Medium priority - strategic improvements
        if fuel.get("current_tsr", 0) < 25:
            recommendations.append(
                {
                    "priority": "MEDIUM",
                    "area": "Alternative Fuel",
                    "action": "Increase alternative fuel usage",
                    "impact": "Cost and CO2 reduction",
                    "estimated_savings": f"{fuel.get('co2_reduction_kg_h', 0):.1f} kg CO2/h reduction",
                }
            )

        return recommendations


# Tool 5: Predictive Maintenance Calculator
class PredictiveMaintenanceCalculator:
    """
    Equipment health and maintenance optimization
    Critical for uptime and cost control
    """

    @staticmethod
    def calculate_equipment_health_score(efficiency_pct: float, power_consumption: float, baseline_power: float, maintenance_due_days: int) -> Dict:
        """
        Calculate equipment health score and failure risk
        """
        # Efficiency component (0-40 points)
        efficiency_score = min(40, efficiency_pct * 0.4) if efficiency_pct else 30

        # Power deviation component (0-30 points)
        power_deviation = abs(power_consumption - baseline_power) / baseline_power if baseline_power > 0 else 0
        power_score = max(0, 30 - (power_deviation * 100))

        # Maintenance component (0-30 points)
        if maintenance_due_days > 60:
            maintenance_score = 30
        elif maintenance_due_days > 30:
            maintenance_score = 20
        elif maintenance_due_days > 0:
            maintenance_score = 10
        else:
            maintenance_score = 0

        total_score = efficiency_score + power_score + maintenance_score

        # Failure risk calculation (inverse of health score)
        failure_risk = max(0, 100 - total_score)

        status = "optimal" if failure_risk < 20 else ("warning" if failure_risk < 50 else "critical")

        return {
            "health_score": total_score,
            "failure_risk": failure_risk,
            "status": status,
            "maintenance_recommendation": "immediate" if failure_risk > 70 else ("schedule" if failure_risk > 40 else "routine"),
        }

    def analyze_equipment_fleet(self, equipment_data: List[Dict]) -> Dict:
        """
        Analyze entire equipment fleet health
        """
        fleet_analysis = []
        total_risk = 0
        critical_equipment = []

        for equipment in equipment_data:
            health = self.calculate_equipment_health_score(
                equipment.get("operating_efficiency_pct", 85),
                equipment.get("power_consumption_kw", 100),
                equipment.get("baseline_power_kw", 100),
                equipment.get("maintenance_due_days", 30),
            )

            equipment_analysis = {"equipment_id": equipment.get("equipment_id", "Unknown"), "equipment_type": equipment.get("equipment_type", "Unknown"), "health_analysis": health}

            fleet_analysis.append(equipment_analysis)
            total_risk += health["failure_risk"]

            if health["status"] == "critical":
                critical_equipment.append(equipment_analysis)

        average_risk = total_risk / len(equipment_data) if equipment_data else 0

        return {
            "fleet_health_score": 100 - average_risk,
            "critical_equipment_count": len(critical_equipment),
            "critical_equipment": critical_equipment,
            "fleet_analysis": fleet_analysis,
            "maintenance_priority": "urgent" if len(critical_equipment) > 2 else "normal",
        }


# Example usage and test functions
def test_cement_tools():
    """Test all cement optimization tools"""

    # Test chemistry calculator
    chemistry_calc = CementChemistryCalculator()
    raw_material = {"cao_pct": 54.2, "sio2_pct": 3.1, "al2o3_pct": 0.8, "fe2o3_pct": 0.4}
    chemistry_result = chemistry_calc.analyze_chemistry(raw_material)
    print("Chemistry Analysis:", json.dumps(chemistry_result, indent=2))

    # Test energy calculator
    energy_calc = EnergyEfficiencyCalculator()
    grinding_data = {"power_consumption_kw": 1850, "total_feed_rate_tph": 85.2, "mill_type": "VRM", "differential_pressure_mbar": 68.5}
    energy_result = energy_calc.analyze_grinding_efficiency(grinding_data)
    print("\nGrinding Efficiency:", json.dumps(energy_result, indent=2))

    # Test fuel optimizer
    fuel_optimizer = AlternativeFuelOptimizer()
    kiln_data = {"coal_rate_tph": 10.2, "alt_fuel_rate_tph": 2.6, "alt_fuel_type": "waste_tire"}
    fuel_result = fuel_optimizer.optimize_fuel_mix(kiln_data, target_tsr=30)
    print("\nFuel Optimization:", json.dumps(fuel_result, indent=2))

    # Test KPI dashboard
    kpi_dashboard = PlantKPIDashboard()
    plant_data = {
        "raw_material": raw_material,
        "grinding": grinding_data,
        "kiln": kiln_data,
        "overview": {"specific_energy_consumption": 75, "ai_quality_score": 92.5, "thermal_substitution_pct": 20.3, "plant_availability_pct": 87, "co2_emissions_per_ton": 850},
    }
    kpi_result = kpi_dashboard.generate_comprehensive_report(plant_data)
    print("\nKPI Dashboard:", json.dumps(kpi_result, indent=2))


if __name__ == "__main__":
    print("Cement Plant AI Optimization - MCP Toolkit")
    print("Testing all tools...")
    test_cement_tools()
