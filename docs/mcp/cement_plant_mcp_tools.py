# Cement Plant AI Optimization - MCP Tools
# Essential 80/20 tools for cement plant operations

from fastmcp import FastMCP
import psycopg2
import pandas as pd
import json
from datetime import datetime
from dataclasses import dataclass

mcp = FastMCP("Cement Plant AI Optimizer")


# Database connection helper
def get_db_connection():
    return psycopg2.connect(host="localhost", database="postgres", user="postgres", password="password")


@dataclass
class ProcessMetrics:
    energy_efficiency: float
    quality_score: float
    cost_savings: float
    co2_reduction: float


# Tool 1: Real-time Process Data Fetcher
@mcp.tool()
def get_realtime_data(table_name: str, hours_back: int = 1, limit: int = 100) -> str:
    """
    Fetch real-time process data from any table for analysis.
    Essential for all AI optimization decisions.

    Args:
        table_name: raw_material_feed, grinding_operations, kiln_operations, etc.
        hours_back: How many hours of historical data to fetch
        limit: Maximum number of records to return

    Returns:
        JSON string of the fetched data
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get recent data from specified table
        query = f"""
        SELECT * FROM {table_name} 
        WHERE created_at >= NOW() - INTERVAL '{hours_back} hours'
        ORDER BY created_at DESC 
        LIMIT {limit}
        """

        cursor.execute(query)
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()

        # Convert to list of dictionaries
        data = []
        for row in rows:
            record = {}
            for i, col in enumerate(columns):
                if isinstance(row[i], datetime):
                    record[col] = row[i].isoformat()
                else:
                    record[col] = row[i]
            data.append(record)

        cursor.close()
        conn.close()

        return json.dumps({"table": table_name, "records_count": len(data), "data": data}, indent=2)

    except Exception as e:
        return f"Error fetching data: {str(e)}"


# Tool 2: Process Efficiency Calculator
@mcp.tool()
def calculate_process_efficiency(process_type: str, data_json: str) -> str:
    """
    Calculate key efficiency metrics for any process using mathematical formulas.
    Core optimization logic that drives AI recommendations.

    Args:
        process_type: 'raw_material', 'grinding', 'kiln', 'quality'
        data_json: JSON string of process data

    Returns:
        Calculated efficiency metrics and recommendations
    """
    try:
        data = json.loads(data_json)

        if process_type == "raw_material":
            # LSF calculation: CaO / (2.8*SiO2 + 1.2*Al2O3 + 0.65*Fe2O3)
            cao = data.get("cao_pct", 0)
            sio2 = data.get("sio2_pct", 0)
            al2o3 = data.get("al2o3_pct", 0)
            fe2o3 = data.get("fe2o3_pct", 0)

            lsf = cao / (2.8 * sio2 + 1.2 * al2o3 + 0.65 * fe2o3) if (sio2 + al2o3 + fe2o3) > 0 else 0

            recommendations = []
            if lsf < 92:
                recommendations.append("Increase CaO content - LSF too low, risk of under-burning")
            elif lsf > 98:
                recommendations.append("Reduce CaO content - LSF too high, risk of hard burning")

            return json.dumps(
                {
                    "process": "Raw Material",
                    "lsf": round(lsf, 2),
                    "target_range": "92-98",
                    "status": "optimal" if 92 <= lsf <= 98 else "needs_adjustment",
                    "recommendations": recommendations,
                },
                indent=2,
            )

        elif process_type == "grinding":
            # Specific Energy Consumption = Power / Feed Rate
            power = data.get("power_consumption_kw", 0)
            feed_rate = data.get("total_feed_rate_tph", 1)

            specific_energy = power / feed_rate
            target_range = (30, 40)  # kWh/ton

            recommendations = []
            if specific_energy > 40:
                recommendations.append("High energy consumption - check grinding aids, mill settings")

            # VRM differential pressure check
            if data.get("mill_type") == "VRM":
                dp = data.get("differential_pressure_mbar", 70)
                if dp < 65:
                    recommendations.append("VRM DP too low - increase feed rate or reduce airflow")
                elif dp > 75:
                    recommendations.append("VRM DP too high - reduce feed rate or increase airflow")

            return json.dumps(
                {
                    "process": "Grinding",
                    "specific_energy_kwh_per_ton": round(specific_energy, 2),
                    "target_range": f"{target_range[0]}-{target_range[1]} kWh/ton",
                    "efficiency_score": max(0, min(100, (50 - specific_energy) * 2)),
                    "recommendations": recommendations,
                },
                indent=2,
            )

        elif process_type == "kiln":
            # Thermal efficiency and temperature optimization
            temp = data.get("burning_zone_temp_c", 1450)
            heat_consumption = data.get("specific_heat_consumption_mjkg", 3.5)
            alt_fuel_rate = data.get("thermal_substitution_pct", 0)

            recommendations = []
            if temp < 1435:
                recommendations.append("Burning zone temperature low - increase fuel or reduce air")
            elif temp > 1465:
                recommendations.append("Burning zone temperature high - reduce fuel or increase air")

            if heat_consumption > 3.7:
                recommendations.append("Heat consumption above target - check insulation")

            if alt_fuel_rate < 25:
                recommendations.append("Alternative fuel usage low - opportunity for CO2 reduction")

            # Calculate potential energy savings
            temp_deviation = abs(temp - 1450)
            energy_saving_potential = min(15, temp_deviation * 0.5)

            return json.dumps(
                {
                    "process": "Kiln",
                    "burning_zone_temp": temp,
                    "target_temp": 1450,
                    "heat_consumption_mjkg": heat_consumption,
                    "alt_fuel_substitution_pct": alt_fuel_rate,
                    "energy_saving_potential_pct": round(energy_saving_potential, 1),
                    "recommendations": recommendations,
                },
                indent=2,
            )

        elif process_type == "quality":
            # 28-day strength prediction
            strength_1d = data.get("compressive_strength_1d_mpa", 0)
            strength_7d = data.get("compressive_strength_7d_mpa", 0)

            if strength_7d > 0:
                predicted_28d = strength_7d * 1.42
            elif strength_1d > 0:
                predicted_28d = strength_1d * 3.2
            else:
                predicted_28d = None

            soundness = data.get("soundness_mm", 0)
            fineness = data.get("fineness_blaine_cm2g", 3800)

            recommendations = []
            if soundness > 10:
                recommendations.append("High soundness - risk of expansion defects")
            if fineness < 3500:
                recommendations.append("Fineness too low - increase grinding time")
            elif fineness > 4200:
                recommendations.append("Fineness too high - reduce grinding time")

            return json.dumps(
                {
                    "process": "Quality Control",
                    "predicted_28d_strength": (round(predicted_28d, 1) if predicted_28d else None),
                    "soundness_mm": soundness,
                    "fineness_blaine": fineness,
                    "target_fineness_range": "3500-4000 cm²/g",
                    "recommendations": recommendations,
                },
                indent=2,
            )

    except Exception as e:
        return f"Error calculating efficiency: {str(e)}"


# Tool 3: Plant-wide KPI Aggregator
@mcp.tool()
def aggregate_plant_kpis(hours_back: int = 1) -> str:
    """
    Aggregate key performance indicators across all plant processes.
    Essential for cross-process optimization and executive dashboards.

    Args:
        hours_back: Hours of data to aggregate

    Returns:
        Plant-wide KPI summary with trends and alerts
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Aggregate energy consumption
        cursor.execute(
            f"""
        SELECT AVG(power_consumption_kw) as avg_grinding_power
        FROM grinding_operations 
        WHERE created_at >= NOW() - INTERVAL '{hours_back} hours'
        """
        )
        grinding_power = cursor.fetchone()[0] or 0

        # Aggregate quality metrics
        cursor.execute(
            f"""
        SELECT AVG(ai_quality_score) as avg_quality
        FROM quality_control 
        WHERE created_at >= NOW() - INTERVAL '{hours_back} hours'
        """
        )
        avg_quality = cursor.fetchone()[0] or 0

        # Aggregate kiln metrics
        cursor.execute(
            f"""
        SELECT 
            AVG(thermal_substitution_pct) as avg_alt_fuel,
            AVG(co2_emissions_tph) as avg_co2
        FROM kiln_operations 
        WHERE created_at >= NOW() - INTERVAL '{hours_back} hours'
        """
        )
        kiln_data = cursor.fetchone()
        avg_alt_fuel = kiln_data[0] or 0
        avg_co2 = kiln_data[1] or 0

        # Calculate overall plant efficiency
        efficiency_factors = {
            "energy": max(0, min(100, (3000 - grinding_power) / 30)),  # Normalized
            "quality": avg_quality,
            "sustainability": min(100, avg_alt_fuel * 2.5),  # 40% alt fuel = 100 points
        }

        overall_efficiency = sum(efficiency_factors.values()) / len(efficiency_factors)

        # Generate alerts
        alerts = []
        if grinding_power > 2500:
            alerts.append("High energy consumption across grinding operations")
        if avg_quality < 90:
            alerts.append("Quality scores below target - investigate process variations")
        if avg_alt_fuel < 20:
            alerts.append("Alternative fuel usage low - sustainability opportunity")

        # Calculate estimated cost savings (simplified model)
        baseline_energy = 2200  # kWh baseline
        energy_savings_kwh = max(0, baseline_energy - grinding_power) * hours_back
        cost_savings_usd = energy_savings_kwh * 0.12  # $0.12 per kWh

        cursor.close()
        conn.close()

        return json.dumps(
            {
                "plant_kpis": {
                    "overall_efficiency_pct": round(overall_efficiency, 1),
                    "avg_grinding_power_kw": round(grinding_power, 1),
                    "avg_quality_score": round(avg_quality, 1),
                    "avg_alt_fuel_pct": round(avg_alt_fuel, 1),
                    "avg_co2_emissions_tph": round(avg_co2, 1),
                },
                "efficiency_breakdown": {
                    "energy_efficiency": round(efficiency_factors["energy"], 1),
                    "quality_performance": round(efficiency_factors["quality"], 1),
                    "sustainability_score": round(efficiency_factors["sustainability"], 1),
                },
                "cost_impact": {
                    "energy_savings_kwh": round(energy_savings_kwh, 1),
                    "estimated_cost_savings_usd": round(cost_savings_usd, 2),
                },
                "alerts": alerts,
                "data_period_hours": hours_back,
            },
            indent=2,
        )

    except Exception as e:
        return f"Error aggregating KPIs: {str(e)}"


# Tool 4: Anomaly Detection Engine
@mcp.tool()
def detect_process_anomalies(process_type: str, threshold_std: float = 2.0) -> str:
    """
    Detect anomalies in process parameters using statistical methods.
    Critical for predictive maintenance and quality control.

    Args:
        process_type: Process to analyze for anomalies
        threshold_std: Standard deviations from mean to consider anomalous

    Returns:
        List of detected anomalies with severity and recommendations
    """
    try:
        conn = get_db_connection()

        anomalies = []

        if process_type == "grinding":
            # Analyze power consumption anomalies
            df = pd.read_sql(
                """
            SELECT created_at, power_consumption_kw, mill_id, mill_type
            FROM grinding_operations 
            WHERE created_at >= NOW() - INTERVAL '24 hours'
            ORDER BY created_at
            """,
                conn,
            )

            if len(df) > 10:  # Need sufficient data points
                mean_power = df["power_consumption_kw"].mean()
                std_power = df["power_consumption_kw"].std()

                for _, row in df.iterrows():
                    z_score = abs(row["power_consumption_kw"] - mean_power) / std_power
                    if z_score > threshold_std:
                        severity = "high" if z_score > 3.0 else "medium"
                        anomalies.append(
                            {
                                "timestamp": row["created_at"].isoformat(),
                                "parameter": "power_consumption_kw",
                                "value": row["power_consumption_kw"],
                                "expected_range": f"{mean_power - 2 * std_power:.1f}-{mean_power + 2 * std_power:.1f}",
                                "z_score": round(z_score, 2),
                                "severity": severity,
                                "mill_id": row["mill_id"],
                                "recommendation": "Investigate mill condition, check for blockages or wear",
                            }
                        )

        elif process_type == "kiln":
            # Analyze temperature anomalies
            df = pd.read_sql(
                """
            SELECT created_at, burning_zone_temp_c, specific_heat_consumption_mjkg
            FROM kiln_operations 
            WHERE created_at >= NOW() - INTERVAL '24 hours'
            ORDER BY created_at
            """,
                conn,
            )

            if len(df) > 10:
                mean_temp = df["burning_zone_temp_c"].mean()
                std_temp = df["burning_zone_temp_c"].std()

                # Use both deviation from target and statistical z-score relative to recent distribution
                for _, row in df.iterrows():
                    temp_value = row["burning_zone_temp_c"]
                    target_temp = 1450
                    temp_deviation = temp_value - target_temp
                    deviation_abs = abs(temp_deviation)
                    if std_temp and std_temp > 0:
                        z_score = (temp_value - mean_temp) / std_temp
                    else:
                        z_score = 0.0

                    # Trigger anomaly if either statistically unusual or large absolute deviation from target
                    if (std_temp and abs(z_score) > threshold_std) or deviation_abs > 20:
                        # Composite severity scoring
                        severity_level = max(
                            abs(z_score) / (threshold_std if threshold_std else 1),
                            deviation_abs / 30,  # 30°C deviation ~ severe
                        )
                        if severity_level >= 1.5:
                            severity = "high"
                        elif severity_level >= 1.0:
                            severity = "medium"
                        else:
                            severity = "low"
                        anomalies.append(
                            {
                                "timestamp": row["created_at"].isoformat(),
                                "parameter": "burning_zone_temp_c",
                                "value": temp_value,
                                "target": target_temp,
                                "deviation": round(deviation_abs, 1),
                                "mean": round(mean_temp, 2),
                                "std_dev": round(std_temp, 2),
                                "expected_range": (f"{mean_temp - threshold_std * std_temp:.1f}-{mean_temp + threshold_std * std_temp:.1f}" if std_temp else None),
                                "z_score": round(z_score, 2),
                                "severity": severity,
                                "recommendation": "Stabilize kiln: tune fuel feed, adjust secondary air, verify burner momentum",
                            }
                        )

        conn.close()

        # Sort anomalies by severity
        severity_order = {"high": 3, "medium": 2, "low": 1}
        anomalies.sort(key=lambda x: severity_order.get(x.get("severity", "low"), 1), reverse=True)

        return json.dumps(
            {
                "process_type": process_type,
                "anomalies_detected": len(anomalies),
                "analysis_period": "24 hours",
                "threshold_std_dev": threshold_std,
                "anomalies": anomalies[:10],  # Limit to top 10 most severe
            },
            indent=2,
        )

    except Exception as e:
        return f"Error detecting anomalies: {str(e)}"


# Tool 5: Optimization Recommendation Engine
@mcp.tool()
def generate_optimization_recommendations(target_improvement: str = "energy", priority_level: int = 2) -> str:
    """
    Generate actionable optimization recommendations based on current plant data.
    The core AI reasoning engine that provides specific improvement actions.

    Args:
        target_improvement: 'energy', 'quality', 'emissions', or 'overall'
        priority_level: 1=critical, 2=high, 3=medium, 4=low

    Returns:
        Prioritized list of optimization recommendations with expected impact
    """
    try:
        conn = get_db_connection()
        recommendations = []

        # Get latest data from all processes
        cursor = conn.cursor()

        # Grinding optimization opportunities
        cursor.execute(
            """
        SELECT power_consumption_kw, total_feed_rate_tph, mill_type, differential_pressure_mbar
        FROM grinding_operations 
        ORDER BY created_at DESC LIMIT 1
        """
        )
        grinding_data = cursor.fetchone()

        if grinding_data:
            power, feed_rate, mill_type, dp = grinding_data
            specific_energy = power / feed_rate if feed_rate > 0 else 0

            if specific_energy > 35:
                impact = min(20, (specific_energy - 30) * 2)  # Max 20% improvement
                recommendations.append(
                    {
                        "area": "Grinding",
                        "type": "energy_optimization",
                        "priority": 2,
                        "description": f"Reduce specific energy consumption from {specific_energy:.1f} to 30-35 kWh/ton",
                        "actions": [
                            "Optimize grinding aids dosage",
                            "Adjust separator settings",
                            "Check mill loading",
                        ],
                        "expected_energy_savings_pct": round(impact, 1),
                        "implementation_effort": "medium",
                        "payback_months": 3,
                    }
                )

            if mill_type == "VRM" and dp and (dp < 65 or dp > 75):
                recommendations.append(
                    {
                        "area": "Grinding - VRM",
                        "type": "process_optimization",
                        "priority": 1,
                        "description": f"VRM differential pressure ({dp} mbar) outside optimal range",
                        "actions": [
                            "Adjust feed rate" if dp > 75 else "Increase feed rate",
                            "Optimize air flow",
                            "Check for blockages",
                        ],
                        "expected_energy_savings_pct": 8,
                        "implementation_effort": "low",
                        "payback_months": 1,
                    }
                )

        # Kiln optimization opportunities
        cursor.execute(
            """
        SELECT burning_zone_temp_c, thermal_substitution_pct, specific_heat_consumption_mjkg
        FROM kiln_operations 
        ORDER BY created_at DESC LIMIT 1
        """
        )
        kiln_data = cursor.fetchone()

        if kiln_data:
            temp, alt_fuel_pct, heat_consumption = kiln_data

            if abs(temp - 1450) > 10:
                temp_deviation = abs(temp - 1450)
                energy_impact = min(12, temp_deviation * 0.6)
                recommendations.append(
                    {
                        "area": "Kiln",
                        "type": "temperature_optimization",
                        "priority": 2,
                        "description": f"Burning zone temperature ({temp}°C) deviates from optimal 1450°C",
                        "actions": [
                            "Adjust primary air flow",
                            "Optimize coal feed rate",
                            "Check kiln coating condition",
                        ],
                        "expected_energy_savings_pct": round(energy_impact, 1),
                        "implementation_effort": "low",
                        "payback_months": 2,
                    }
                )

            if alt_fuel_pct < 30:
                co2_reduction = (30 - alt_fuel_pct) * 15  # kg CO2 per % increase
                recommendations.append(
                    {
                        "area": "Alternative Fuel",
                        "type": "sustainability",
                        "priority": 3,
                        "description": f"Alternative fuel usage ({alt_fuel_pct}%) below target of 30%+",
                        "actions": [
                            "Increase waste tire consumption",
                            "Optimize biomass feeding",
                            "Trial RDF introduction",
                        ],
                        "expected_co2_reduction_kg_per_hour": round(co2_reduction, 1),
                        "expected_fuel_cost_savings_pct": 12,
                        "implementation_effort": "medium",
                        "payback_months": 6,
                    }
                )

        cursor.close()
        conn.close()

        # Filter by priority level
        filtered_recommendations = [r for r in recommendations if r["priority"] <= priority_level]

        # Sort by priority and impact
        filtered_recommendations.sort(key=lambda x: (x["priority"], -x.get("expected_energy_savings_pct", 0)))

        # Calculate total potential impact
        total_energy_savings = sum(r.get("expected_energy_savings_pct", 0) for r in filtered_recommendations)
        total_co2_reduction = sum(r.get("expected_co2_reduction_kg_per_hour", 0) for r in filtered_recommendations)

        return json.dumps(
            {
                "target_improvement": target_improvement,
                "recommendations_count": len(filtered_recommendations),
                "total_potential_impact": {
                    "energy_savings_pct": round(min(25, total_energy_savings), 1),  # Cap at 25%
                    "co2_reduction_kg_per_hour": round(total_co2_reduction, 1),
                    "estimated_annual_savings_usd": round(total_energy_savings * 50000, 0),  # $50k per % energy saved
                },
                "recommendations": filtered_recommendations,
            },
            indent=2,
        )

    except Exception as e:
        return f"Error generating recommendations: {str(e)}"


# Tool 6: Alert Management System
@mcp.tool()
def manage_alerts(action: str = "list", alert_id: int = None, new_alert: str = None) -> str:
    """
    Manage plant alerts and notifications for operators.
    Essential for maintaining plant safety and operational awareness.

    Args:
        action: 'list', 'create', 'acknowledge', 'resolve'
        alert_id: ID of alert to manage (for acknowledge/resolve)
        new_alert: JSON string of new alert data (for create)

    Returns:
        Alert management results
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        if action == "list":
            # Get active alerts
            cursor.execute(
                """
            SELECT id, created_at, process_area, recommendation_type, priority_level, 
                   description, action_taken
            FROM ai_recommendations 
            WHERE priority_level <= 2 AND action_taken = FALSE
            ORDER BY priority_level, created_at DESC
            LIMIT 20
            """
            )

            alerts = []
            for row in cursor.fetchall():
                alerts.append(
                    {
                        "id": row[0],
                        "timestamp": row[1].isoformat(),
                        "process_area": row[2],
                        "type": row[3],
                        "priority": row[4],
                        "description": row[5],
                        "status": "open" if not row[6] else "acknowledged",
                    }
                )

            return json.dumps(
                {
                    "action": "list_alerts",
                    "active_alerts_count": len(alerts),
                    "alerts": alerts,
                },
                indent=2,
            )

        elif action == "create" and new_alert:
            # Create new alert
            alert_data = json.loads(new_alert)
            cursor.execute(
                """
            INSERT INTO ai_recommendations 
            (process_area, recommendation_type, priority_level, description, 
             estimated_savings_kwh, estimated_savings_cost)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
                (
                    alert_data.get("process_area"),
                    alert_data.get("type", "alert"),
                    alert_data.get("priority", 3),
                    alert_data.get("description"),
                    alert_data.get("estimated_savings_kwh", 0),
                    alert_data.get("estimated_savings_cost", 0),
                ),
            )

            alert_id = cursor.fetchone()[0]
            conn.commit()

            return json.dumps({"action": "create_alert", "alert_id": alert_id, "status": "created"})

        elif action == "acknowledge" and alert_id:
            # Acknowledge alert
            cursor.execute(
                """
            UPDATE ai_recommendations 
            SET action_taken = TRUE, operator_feedback = 'Acknowledged by operator'
            WHERE id = %s
            """,
                (alert_id,),
            )
            conn.commit()

            return json.dumps(
                {
                    "action": "acknowledge_alert",
                    "alert_id": alert_id,
                    "status": "acknowledged",
                }
            )

        cursor.close()
        conn.close()

    except Exception as e:
        return f"Error managing alerts: {str(e)}"


if __name__ == "__main__":
    mcp.run()
