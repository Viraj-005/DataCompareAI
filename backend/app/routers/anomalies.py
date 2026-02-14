from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.anomaly import Anomaly
from app.models.file import File
from app.schemas.anomaly import AnomalyResponse, AnomalyListResponse
from app.services.anomaly_service import detect_anomalies

router = APIRouter(prefix="/api/anomalies", tags=["Anomalies"])


@router.get("", response_model=AnomalyListResponse)
def list_anomalies(
    file_id: Optional[int] = Query(None),
    comparison_id: Optional[int] = Query(None),
    anomaly_type: Optional[str] = Query(None),
    min_severity: Optional[float] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Anomaly).join(File).filter(File.owner_id == current_user.id)
    if file_id:
        query = query.filter(Anomaly.file_id == file_id)
    if comparison_id:
        query = query.filter(Anomaly.comparison_id == comparison_id)
    if anomaly_type:
        query = query.filter(Anomaly.anomaly_type == anomaly_type)
    if min_severity:
        query = query.filter(Anomaly.severity >= min_severity)

    anomalies = query.order_by(Anomaly.severity.desc()).all()

    results = []
    for a in anomalies:
        f = db.query(File).filter(File.id == a.file_id).first()
        results.append(AnomalyResponse(
            id=a.id,
            comparison_id=a.comparison_id,
            file_id=a.file_id,
            filename=f.original_filename if f else None,
            row_index=a.row_index,
            column_name=a.column_name,
            value=a.value,
            reason=a.reason,
            severity=a.severity,
            anomaly_type=a.anomaly_type,
            detected_at=a.detected_at,
        ))

    critical = sum(1 for a in anomalies if a.severity >= 8)
    warning = sum(1 for a in anomalies if 5 <= a.severity < 8)
    info = sum(1 for a in anomalies if a.severity < 5)

    return AnomalyListResponse(
        anomalies=results,
        total=len(results),
        critical_count=critical,
        warning_count=warning,
        info_count=info,
    )


@router.post("/detect/{file_id}")
def trigger_anomaly_detection(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    f = db.query(File).filter(File.id == file_id, File.owner_id == current_user.id).first()
    if not f:
        raise HTTPException(status_code=404, detail="File not found")

    # Clear existing anomalies for this file
    db.query(Anomaly).filter(Anomaly.file_id == file_id).delete()
    db.commit()

    anomalies = detect_anomalies(db, file_id)
    return {"message": f"Detected {len(anomalies)} anomalies", "count": len(anomalies)}
