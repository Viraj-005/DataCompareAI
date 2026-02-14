from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class AnomalyResponse(BaseModel):
    id: int
    comparison_id: Optional[int]
    file_id: int
    filename: Optional[str] = None
    row_index: int
    column_name: str
    value: Optional[str]
    reason: str
    severity: float
    anomaly_type: str
    detected_at: datetime

    class Config:
        from_attributes = True


class AnomalyListResponse(BaseModel):
    anomalies: List[AnomalyResponse]
    total: int
    critical_count: int
    warning_count: int
    info_count: int
