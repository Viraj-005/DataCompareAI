from pydantic import BaseModel
from typing import Optional, Any, List
from datetime import datetime


class RuleCreate(BaseModel):
    name: str
    column_name: str
    rule_type: str  # unique, positive, not_null, range, regex
    parameters: Optional[dict] = None
    project_id: int


class RuleUpdate(BaseModel):
    name: Optional[str] = None
    column_name: Optional[str] = None
    rule_type: Optional[str] = None
    parameters: Optional[dict] = None
    is_active: Optional[int] = None


class RuleResponse(BaseModel):
    id: int
    name: str
    column_name: str
    rule_type: str
    parameters: Optional[Any]
    is_active: int
    project_id: int
    owner_id: int
    violation_count: Optional[int] = 0
    created_at: datetime

    class Config:
        from_attributes = True


class RuleViolationResponse(BaseModel):
    id: int
    rule_id: int
    rule_name: Optional[str] = None
    file_id: int
    filename: Optional[str] = None
    row_index: int
    column_name: str
    value: Optional[str]
    message: str
    detected_at: datetime

    class Config:
        from_attributes = True
