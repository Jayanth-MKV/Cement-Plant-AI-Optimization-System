from typing import Dict, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


#############################################
# Advanced Process & Optimization Calculators
# Consolidated version pulling in richer logic
# from tools/cement_optimization_tools.py while
# preserving backward compatibility for code
# already importing from services.optimization_tools
#############################################


class CementChemistryCalculator:
    """Extended chemistry calculator.

    Backwards compatibility:
    - Retains previous keys (lsf, alumina_modulus)
    - Adds extended metrics (lsf_pct, silica_modulus, c3s, recommendations)
    """

    @staticmethod
    def _bogue_c3s(cao: float, sio2: float, al2o3: float, fe2o3: float) -> float:
        return 4.07 * cao - 7.6 * sio2 - 6.72 * al2o3 - 1.43 * fe2o3

    @staticmethod
    def _lsf_percent(cao: float, sio2: float, al2o3: float, fe2o3: float) -> float:
        denom = 2.8 * sio2 + 1.2 * al2o3 + 0.65 * fe2o3
        if denom == 0:
            return 0
        return (cao / denom) * 100.0

    @staticmethod
    def _silica_modulus(sio2: float, al2o3: float, fe2o3: float) -> float:
        denom = al2o3 + fe2o3
        return (sio2 / denom) if denom else 0

    @staticmethod
    def _alumina_modulus(al2o3: float, fe2o3: float) -> float:
        return (al2o3 / fe2o3) if fe2o3 else 0

    def analyze_chemistry(self, raw_material_data: Dict) -> Dict:
        try:
            cao = raw_material_data.get("cao_pct", 54.0)
            sio2 = raw_material_data.get("sio2_pct", 20.0)
            al2o3 = raw_material_data.get("al2o3_pct", 5.0)
            fe2o3 = raw_material_data.get("fe2o3_pct", 3.0)

            # Legacy (ratio form 0.92-0.98) and percent version (92-98%)
            lsf_ratio = 0
            denom = 2.8 * sio2 + 1.2 * al2o3 + 0.65 * fe2o3
            if denom:
                lsf_ratio = cao / denom
            lsf_pct = self._lsf_percent(cao, sio2, al2o3, fe2o3)
            am = self._alumina_modulus(al2o3, fe2o3)
            sm = self._silica_modulus(sio2, al2o3, fe2o3)
            # Clamp negative C3S (can occur with atypical lab values / partial data)
            c3s = max(0.0, self._bogue_c3s(cao, sio2, al2o3, fe2o3))

            # Status (retain old ranges on ratio; new ranges on percent)
            if 0.92 <= lsf_ratio <= 0.98:
                status = "optimal"
            elif 0.88 <= lsf_ratio <= 1.02:
                status = "acceptable"
            else:
                status = "critical"

            lsf_pct_status = "optimal" if 92 <= lsf_pct <= 98 else ("warning" if 90 <= lsf_pct <= 100 else "critical")
            sm_status = "optimal" if 2.2 <= sm <= 3.2 else "warning"
            am_status = "optimal" if 1.5 <= am <= 2.5 else "warning"

            recommendations: List[str] = []
            if lsf_pct < 92:
                recommendations.append("Increase CaO content - risk of under-burning")
            elif lsf_pct > 98:
                recommendations.append("Reduce CaO content - risk of over-burning and higher energy use")
            if am < 1.5:
                recommendations.append("Increase Al2O3 or reduce Fe2O3 to raise AM")
            elif am > 2.5:
                recommendations.append("Reduce Al2O3 or increase Fe2O3 to lower AM")

            return {
                # Legacy keys
                "lsf": {
                    "value": round(lsf_ratio, 3),
                    "status": status,
                    "target_range": [0.92, 0.98],
                },
                "lsf_pct": {
                    "value": round(lsf_pct, 2),
                    "status": lsf_pct_status,
                    "target": "92-98%",
                },
                "silica_modulus": {
                    "value": round(sm, 2),
                    "status": sm_status,
                    "target": "2.2-3.2",
                },
                "alumina_modulus": {
                    "value": round(am, 2),
                    "status": am_status,
                    "target": "1.25-2.5",
                },
                "c3s": {
                    "value": round(c3s, 2),
                    "status": "calculated",
                    "target": "50-70% (indicative)",
                },
                "recommendations": recommendations,
            }
        except Exception as e:
            # Provide a clearly flagged error structure instead of plausible default values
            logger.error(f"Chemistry analysis error: {e}")
            return {
                "error": f"chemistry_calculation_failed: {e}",
                "lsf": {
                    "value": None,
                    "status": "error",
                    "target_range": [0.92, 0.98],
                },
                "alumina_modulus": {
                    "value": None,
                    "target_range": [1.3, 2.5],
                    "status": "error",
                },
                "lsf_pct": {"value": None, "status": "error", "target": "92-98%"},
                "silica_modulus": {
                    "value": None,
                    "status": "error",
                    "target": "2.2-3.2",
                },
                "c3s": {
                    "value": None,
                    "status": "error",
                    "target": "50-70% (indicative)",
                },
                "recommendations": [],
            }


class EnergyEfficiencyCalculator:
    """Enhanced energy efficiency calculator.

    Preserves previous return structure but adds optimization_potential & recommendations.
    """

    def analyze_grinding_efficiency(self, grinding_data: Dict) -> Dict:
        try:
            power = grinding_data.get("power_consumption_kw", 2000)
            feed_rate = grinding_data.get("total_feed_rate_tph", 80)
            mill_type = grinding_data.get("mill_type")
            dp_mbar = grinding_data.get("differential_pressure_mbar")
            sec = power / feed_rate if feed_rate > 0 else 30

            if sec <= 25:
                status = "optimal"
                potential_savings = 0
            elif sec <= 30:
                status = "acceptable"
                potential_savings = (sec - 25) * feed_rate
            else:
                status = "critical"
                potential_savings = (sec - 25) * feed_rate

            recommendations: List[str] = []
            if mill_type == "VRM" and isinstance(dp_mbar, (int, float)):
                if dp_mbar < 65:
                    recommendations.append("VRM DP low: increase feed or reduce airflow")
                elif dp_mbar > 75:
                    recommendations.append("VRM DP high: reduce feed or increase airflow")
            if sec > 30:
                recommendations.append("Investigate grinding aid dosage & classifier settings")
            if potential_savings > 0:
                recommendations.append("Execute energy tuning to capture SEC savings")

            optimization_potential_kw = max(0, sec - 25) * feed_rate

            return {
                "specific_energy_consumption": {
                    "value": round(sec, 2),
                    "status": status,
                    "potential_savings_kwh": round(potential_savings, 2),
                    "target": 25,
                },
                "efficiency_pct": min(100, max(60, 100 - (sec - 25) * 3)),
                "optimization_potential_kw": round(optimization_potential_kw, 2),
                "recommendations": recommendations,
            }
        except Exception as e:
            logger.error(f"Grinding efficiency analysis error: {e}")
            return {
                "error": f"grinding_efficiency_failed: {e}",
                "specific_energy_consumption": {
                    "value": None,
                    "status": "error",
                    "potential_savings_kwh": None,
                    "target": 25,
                },
                "efficiency_pct": None,
                "optimization_potential_kw": None,
                "recommendations": [],
            }


class AlternativeFuelOptimizer:
    """Alternative fuel optimization and TSR (thermal substitution rate) calculations."""

    FUEL_PROPERTIES = {
        "coal": {"cv": 25.0, "co2_factor": 0.094},
        "waste_tire": {"cv": 32.5, "co2_factor": 0.085},
        "biomass": {"cv": 18.7, "co2_factor": 0.0},
        "RDF": {"cv": 15.5, "co2_factor": 0.083},
        "petcoke": {"cv": 35.0, "co2_factor": 0.102},
    }

    def _fuel_energy(self, fuel: str, rate_tph: float) -> float:
        cv = self.FUEL_PROPERTIES.get(fuel, {}).get("cv", 25.0)
        return rate_tph * cv * 1000  # MJ/h

    def optimize_fuel_mix(self, kiln_data: Dict, target_tsr: float = 30.0) -> Dict:
        try:
            coal_rate = kiln_data.get("coal_rate_tph", 0)
            alt_rate = kiln_data.get("alt_fuel_rate_tph", 0)
            alt_type = kiln_data.get("alt_fuel_type", "waste_tire")
            coal_energy = self._fuel_energy("coal", coal_rate)
            alt_energy = self._fuel_energy(alt_type, alt_rate)
            total = coal_energy + alt_energy
            tsr = (alt_energy / total * 100) if total else 0
            target_alt_energy = (target_tsr / 100) * total if total else 0
            alt_cv = self.FUEL_PROPERTIES.get(alt_type, {}).get("cv", 25.0) * 1000
            coal_cv = self.FUEL_PROPERTIES.get("coal", {}).get("cv", 25.0) * 1000
            recommended_alt_rate = target_alt_energy / alt_cv if alt_cv else 0
            recommended_coal_rate = (total - target_alt_energy) / coal_cv if coal_cv else 0
            coal_co2 = coal_energy * self.FUEL_PROPERTIES["coal"]["co2_factor"]
            alt_co2 = alt_energy * self.FUEL_PROPERTIES.get(alt_type, {}).get("co2_factor", 0)
            current_co2_kg_h = (coal_co2 + alt_co2) / 3.6
            rec_coal_co2 = ((total - target_alt_energy) * self.FUEL_PROPERTIES["coal"]["co2_factor"]) if total else 0
            rec_alt_co2 = target_alt_energy * self.FUEL_PROPERTIES.get(alt_type, {}).get("co2_factor", 0)
            optimized_co2_kg_h = (rec_coal_co2 + rec_alt_co2) / 3.6
            co2_reduction = current_co2_kg_h - optimized_co2_kg_h
            feasibility = "feasible" if target_tsr <= 40 else "review_required"
            return {
                "current_tsr": round(tsr, 2),
                "target_tsr": target_tsr,
                "recommended_coal_rate_tph": round(recommended_coal_rate, 3),
                "recommended_alt_fuel_rate_tph": round(recommended_alt_rate, 3),
                "co2_reduction_kg_h": round(co2_reduction, 2),
                "feasibility": feasibility,
            }
        except Exception as e:
            logger.error(f"Fuel optimization error: {e}")
            return {
                "error": f"fuel_optimization_failed: {e}",
                "current_tsr": None,
                "target_tsr": target_tsr,
                "recommended_coal_rate_tph": None,
                "recommended_alt_fuel_rate_tph": None,
                "co2_reduction_kg_h": None,
                "feasibility": "error",
            }


class PlantKPIDashboard:
    def __init__(self):
        self.chemistry_calc = CementChemistryCalculator()
        self.energy_calc = EnergyEfficiencyCalculator()
        self.fuel_optimizer = AlternativeFuelOptimizer()

    def generate_comprehensive_report(self, plant_data: Dict) -> Dict:
        try:
            chemistry_result = self.chemistry_calc.analyze_chemistry(plant_data.get("raw_material", {}))
            energy_result = self.energy_calc.analyze_grinding_efficiency(plant_data.get("grinding", {}))
            fuel_result = self.fuel_optimizer.optimize_fuel_mix(plant_data.get("kiln", {}))

            plant_efficiency_score = self._calculate_plant_efficiency(plant_data, energy_result, fuel_result, chemistry_result)
            energy_savings = self._calculate_energy_savings(plant_data, energy_result)

            recommendations = self._generate_recommendations(plant_data, energy_result, chemistry_result, fuel_result)

            return {
                "timestamp": datetime.now().isoformat(),
                "chemistry": chemistry_result,
                "energy": energy_result,
                "fuel_optimization": fuel_result,
                "plant_efficiency_score": plant_efficiency_score,
                "energy_savings": energy_savings,
                "recommendations": recommendations,
            }
        except Exception as e:
            logger.error(f"KPI report error: {e}")
            return {
                "timestamp": datetime.now().isoformat(),
                "error": f"kpi_report_failed: {e}",
                "chemistry": {},
                "energy": {},
                "fuel_optimization": {},
                "plant_efficiency_score": None,
                "energy_savings": {},
                "recommendations": [],
            }

    def _calculate_plant_efficiency(self, plant_data: Dict, energy: Dict, fuel: Dict, chemistry: Dict) -> float:
        base = 70.0
        overview = plant_data.get("overview", {})
        sec = overview.get(
            "specific_energy_consumption",
            energy.get("specific_energy_consumption", {}).get("value", 28),
        )
        if sec <= 25:
            base += 10
        elif sec <= 30:
            base += 5
        quality_score = overview.get("ai_quality_score", 90)
        if quality_score >= 95:
            base += 8
        elif quality_score >= 90:
            base += 5
        tsr = fuel.get("current_tsr", 0)
        if tsr >= 30:
            base += 5
        elif tsr >= 20:
            base += 2
        lsf_pct_status = chemistry.get("lsf_pct", {}).get("status")
        if lsf_pct_status == "optimal":
            base += 2
        elif lsf_pct_status == "critical":
            base -= 4
        return min(100, max(55, base))

    def _calculate_energy_savings(self, plant_data: Dict, energy: Dict) -> Dict:
        overview = plant_data.get("overview", {})
        current_sec = overview.get(
            "specific_energy_consumption",
            energy.get("specific_energy_consumption", {}).get("value", 28),
        )
        target_sec = 25.0
        reference_feed = plant_data.get("grinding", {}).get("total_feed_rate_tph", 80) or 80
        energy_saved_kwh = max(0, (current_sec - target_sec) * reference_feed)
        cost_saved_usd = energy_saved_kwh * 0.15
        co2_reduced_kg = energy_saved_kwh * 0.5
        return {
            "energy_saved_kwh": round(energy_saved_kwh, 2),
            "cost_saved_usd": round(cost_saved_usd, 2),
            "co2_reduced_kg": round(co2_reduced_kg, 2),
        }

    def _generate_recommendations(self, plant_data: Dict, energy: Dict, chemistry: Dict, fuel: Dict) -> List[Dict]:
        recs: List[Dict] = []
        # Energy optimization
        sec_data = energy.get("specific_energy_consumption", {})
        if sec_data.get("status") == "critical":
            recs.append(
                {
                    "process_area": "grinding",
                    "recommendation_type": "energy_optimization",
                    "priority_level": 1,
                    "description": "Critical grinding SEC - implement mill audit & adjust classifier/feed.",
                    "estimated_savings_kwh": sec_data.get("potential_savings_kwh", 0),
                    "estimated_savings_cost": round(sec_data.get("potential_savings_kwh", 0) * 0.15, 2),
                }
            )
        elif sec_data.get("potential_savings_kwh", 0) > 0:
            recs.append(
                {
                    "process_area": "grinding",
                    "recommendation_type": "energy_optimization",
                    "priority_level": 2,
                    "description": "Capture grinding SEC improvement potential.",
                    "estimated_savings_kwh": sec_data.get("potential_savings_kwh", 0),
                    "estimated_savings_cost": round(sec_data.get("potential_savings_kwh", 0) * 0.15, 2),
                }
            )
        # Chemistry
        if chemistry.get("lsf_pct", {}).get("status") == "critical":
            recs.append(
                {
                    "process_area": "raw_material",
                    "recommendation_type": "quality_stability",
                    "priority_level": 1,
                    "description": "LSF out of control limits - adjust raw mix proportioning.",
                    "estimated_savings_kwh": 0,
                    "estimated_savings_cost": 0,
                }
            )
        # Fuel optimization
        if fuel.get("current_tsr", 0) < fuel.get("target_tsr", 30):
            recs.append(
                {
                    "process_area": "kiln",
                    "recommendation_type": "alternative_fuel",
                    "priority_level": 3,
                    "description": "Increase alternative fuel rate to reach TSR target.",
                    "estimated_savings_kwh": 0,
                    "estimated_savings_cost": 0,
                }
            )
        return recs


class MaintenanceCalculator:
    """Legacy maintenance calculator retained for compatibility.

    Could be extended later with fleet analytics from predictive model.
    """

    def calculate_equipment_health_score(
        self,
        efficiency: float,
        current_power: float,
        baseline_power: float,
        maintenance_days: int,
    ) -> Dict:
        try:
            health_score = efficiency
            power_ratio = current_power / baseline_power if baseline_power > 0 else 1.0
            if power_ratio > 1.1:
                health_score -= (power_ratio - 1.0) * 20
            if maintenance_days > 7:
                health_score -= (maintenance_days - 7) * 3
            failure_risk = max(0, 100 - health_score)
            if failure_risk < 20:
                status = "good"
            elif failure_risk < 40:
                status = "warning"
            else:
                status = "critical"
            return {
                "health_score": round(health_score, 2),
                "failure_risk": round(failure_risk, 2),
                "status": status,
                "maintenance_required": maintenance_days > 14,
            }
        except Exception as e:
            logger.error(f"Maintenance calculation error: {e}")
            return {
                "error": f"maintenance_health_failed: {e}",
                "health_score": None,
                "failure_risk": None,
                "status": "error",
                "maintenance_required": None,
            }
