from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class ComparisonCreate(BaseModel):
    name: str
    description: Optional[str] = None
    project_id: int
    source_file_id: int
    target_file_id: int
    config: Optional[dict] = None  # {primary_key, column_mapping, ignore_columns, case_sensitive, tolerance}


class ComparisonResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    status: str
    config: Optional[Any]
    result_summary: Optional[Any]
    result_details: Optional[Any]
    project_id: int
    project_name: Optional[str] = None
    source_file_id: int
    source_filename: Optional[str] = None
    target_file_id: int
    target_filename: Optional[str] = None
    owner_id: int
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True
