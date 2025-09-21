"""Lightweight LangChain tool wrappers for core cement plant optimization logic.

This module exposes a few calculation/analysis utilities as LangChain-compatible
Tools WITHOUT wiring them into any agent or graph. Import this file, grab the
functions (or the aggregated `ALL_TOOLS` list) and register them as you see fit.

Design goals:
- Pure / side-effect-free tools (no outbound DB calls) so they are safe & fast.
- Wrap existing domain calculators in `app.services.optimization_tools`.
- Provide both sync + async variants where computation is CPU-bound & trivial.
- Keep parameter signatures simple JSON-serializable structures for agent use.

If you later want DB-backed tools (e.g., fetch latest kiln row), you can extend
with SupabaseManager initialization, but that is intentionally omitted here to
avoid hidden I/O in tool execution.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

# Prefer latest core decorator, fallback for older langchain versions
try:  # pragma: no cover - import fallback logic
    from langchain_core.tools import tool
except ImportError:  # pragma: no cover
    from langchain.tools import tool  # type: ignore

from app.services.optimization_tools import (
    CementChemistryCalculator,
    EnergyEfficiencyCalculator,
    AlternativeFuelOptimizer,
    PlantKPIDashboard,
)

# Instantiate calculators once (they are lightweight, stateless)
_chem_calc = CementChemistryCalculator()
_energy_calc = EnergyEfficiencyCalculator()
_fuel_opt = AlternativeFuelOptimizer()
_kpi_dash = PlantKPIDashboard()


# ---------------------------------------------------------------------------
# Helper validation utilities (internal)
# ---------------------------------------------------------------------------


def _coerce_dict(
    value: Optional[Dict[str, Any]], default: Dict[str, Any]
) -> Dict[str, Any]:
    if not isinstance(value, dict):
        return default
    return value


# ---------------------------------------------------------------------------
# Tool definitions
# ---------------------------------------------------------------------------


@tool("analyze_raw_material_chemistry", return_direct=False)
def analyze_raw_material_chemistry(
    raw_material: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Analyze raw meal chemistry & return LSF, C3S, modulus values & recommendations.

    Parameters
    ----------
    raw_material : dict (optional)
        Keys may include: cao_pct, sio2_pct, al2o3_pct, fe2o3_pct

    Returns
    -------
    dict : structured chemistry analysis with status & recommendations.
    """
    data = _coerce_dict(raw_material, {})
    return _chem_calc.analyze_chemistry(data)


@tool("analyze_grinding_efficiency")
def analyze_grinding_efficiency(
    grinding: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Evaluate grinding circuit energy efficiency & potential savings.

    Expected keys: power_consumption_kw, total_feed_rate_tph, mill_type, differential_pressure_mbar
    """
    data = _coerce_dict(grinding, {})
    return _energy_calc.analyze_grinding_efficiency(data)


@tool("optimize_fuel_mix")
def optimize_fuel_mix(
    kiln: Optional[Dict[str, Any]] = None, target_tsr: float = 30.0
) -> Dict[str, Any]:
    """Suggest alternative vs coal fuel rates to reach a target TSR (thermal substitution rate).

    kiln : dict with keys like coal_rate_tph, alt_fuel_rate_tph, alt_fuel_type.
    target_tsr : desired TSR percentage (default 30.0)
    """
    data = _coerce_dict(kiln, {})
    return _fuel_opt.optimize_fuel_mix(data, target_tsr=target_tsr)


@tool("generate_kpi_report")
def generate_kpi_report(
    raw_material: Optional[Dict[str, Any]] = None,
    grinding: Optional[Dict[str, Any]] = None,
    kiln: Optional[Dict[str, Any]] = None,
    overview: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Generate a comprehensive KPI snapshot combining chemistry, energy & fuel optimization.

    Provide partial plant dictionaries; missing sections will use safe defaults.
    """
    plant_data = {
        "raw_material": _coerce_dict(raw_material, {}),
        "grinding": _coerce_dict(grinding, {}),
        "kiln": _coerce_dict(kiln, {}),
        "overview": _coerce_dict(overview, {}),
    }
    return _kpi_dash.generate_comprehensive_report(plant_data)


@tool("quick_plant_insight")
def quick_plant_insight(plant_snapshot: Dict[str, Any]) -> Dict[str, Any]:
    """Convenience tool: takes a combined plant snapshot and returns condensed key insights.

    Parameters
    ----------
    plant_snapshot : dict
        Should contain nested keys: raw_material, grinding, kiln, overview (any may be omitted)

    Returns
    -------
    dict with a minimal high-signal summary for fast agent responses.
    """
    report = generate_kpi_report(
        raw_material=plant_snapshot.get("raw_material"),
        grinding=plant_snapshot.get("grinding"),
        kiln=plant_snapshot.get("kiln"),
        overview=plant_snapshot.get("overview"),
    )

    chemistry = report.get("chemistry", {})
    energy = report.get("energy", {})
    fuel = report.get("fuel_optimization", {})

    sec = energy.get("specific_energy_consumption", {}).get("value")
    lsf_status = chemistry.get("lsf_pct", {}).get("status")
    tsr = fuel.get("current_tsr")

    headline = []
    if sec is not None:
        headline.append(f"Grinding SEC: {sec}")
    if tsr is not None:
        headline.append(f"TSR: {tsr}%")
    if lsf_status:
        headline.append(f"LSF status: {lsf_status}")

    return {
        "headline": ", ".join(headline) or "No key metrics available",
        "efficiency_score": report.get("plant_efficiency_score"),
        "energy_savings_kwh": report.get("energy_savings", {}).get("energy_saved_kwh"),
        "co2_reduced_kg": report.get("energy_savings", {}).get("co2_reduced_kg"),
        "top_recommendations": report.get("recommendations", [])[:3],
    }


# Aggregate for convenience import
ALL_TOOLS = [
    analyze_raw_material_chemistry,
    analyze_grinding_efficiency,
    optimize_fuel_mix,
    generate_kpi_report,
    quick_plant_insight,
]

__all__ = ["ALL_TOOLS"] + [t.name for t in ALL_TOOLS]
