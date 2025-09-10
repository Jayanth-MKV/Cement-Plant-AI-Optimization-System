"""Central definition of logical table names used across the application.

Using constants (instead of scattered string literals) reduces risk of typos
and makes future refactors (e.g. table renames / schema versioning) easier.
"""

from enum import Enum


class Tables(str, Enum):
    RAW_MATERIAL_FEED = "raw_material_feed"
    GRINDING_OPERATIONS = "grinding_operations"
    KILN_OPERATIONS = "kiln_operations"
    UTILITIES_MONITORING = "utilities_monitoring"
    QUALITY_CONTROL = "quality_control"
    ALTERNATIVE_FUELS = "alternative_fuels"
    AI_RECOMMENDATIONS = "ai_recommendations"
    OPTIMIZATION_RESULTS = "optimization_results"


# Convenience direct string aliases (optional import style)
RAW_MATERIAL_FEED = Tables.RAW_MATERIAL_FEED.value
GRINDING_OPERATIONS = Tables.GRINDING_OPERATIONS.value
KILN_OPERATIONS = Tables.KILN_OPERATIONS.value
UTILITIES_MONITORING = Tables.UTILITIES_MONITORING.value
QUALITY_CONTROL = Tables.QUALITY_CONTROL.value
ALTERNATIVE_FUELS = Tables.ALTERNATIVE_FUELS.value
AI_RECOMMENDATIONS = Tables.AI_RECOMMENDATIONS.value
OPTIMIZATION_RESULTS = Tables.OPTIMIZATION_RESULTS.value
