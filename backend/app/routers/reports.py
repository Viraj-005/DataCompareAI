from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.services.export_service import export_comparison_results, export_anomalies, export_violations

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/comparison/{comparison_id}")
def download_comparison_report(
    comparison_id: int,
    format: str = Query("csv", pattern="^(csv|xlsx)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        buffer, filename, content_type = export_comparison_results(db, comparison_id, format)
        return StreamingResponse(
            buffer,
            media_type=content_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/anomalies")
def download_anomaly_report(
    file_id: int = None,
    comparison_id: int = None,
    format: str = Query("csv", pattern="^(csv|xlsx)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        buffer, filename, content_type = export_anomalies(db, file_id, comparison_id, format)
        return StreamingResponse(
            buffer,
            media_type=content_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/violations")
def download_violations_report(
    file_id: int = None,
    project_id: int = None,
    format: str = Query("csv", pattern="^(csv|xlsx)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        buffer, filename, content_type = export_violations(db, file_id, project_id, format)
        return StreamingResponse(
            buffer,
            media_type=content_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
