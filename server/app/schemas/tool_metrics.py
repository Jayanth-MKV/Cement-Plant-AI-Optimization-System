from typing import Optional
from dataclasses import dataclass


@dataclass
class CementMetrics:
    """Container for calculated metrics"""

    value: float
    status: str
    recommendation: str
    threshold_min: Optional[float] = None
    threshold_max: Optional[float] = None
