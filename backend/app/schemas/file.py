from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class FileResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_type: str
    size_bytes: int
    row_count: int
    column_count: int
    column_metadata: Optional[Any] = None
    version: int
    project_id: int
    project_name: Optional[str] = None
    owner_id: int
    uploaded_at: datetime

    class Config:
        from_attributes = True


class FileListResponse(BaseModel):
    files: List[FileResponse]
    total: int
