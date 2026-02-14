from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.file import File
from app.models.comparison import Comparison
from app.models.anomaly import Anomaly

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_projects = db.query(func.count(Project.id)).filter(Project.owner_id == current_user.id).scalar()
    total_files = db.query(func.count(File.id)).filter(File.owner_id == current_user.id).scalar()
    total_comparisons = db.query(func.count(Comparison.id)).filter(Comparison.owner_id == current_user.id).scalar()
    total_anomalies = db.query(func.count(Anomaly.id)).join(File).filter(File.owner_id == current_user.id).scalar()
    critical_anomalies = db.query(func.count(Anomaly.id)).join(File).filter(
        File.owner_id == current_user.id, Anomaly.severity >= 8
    ).scalar()

    return {
        "total_projects": total_projects,
        "total_files": total_files,
        "total_comparisons": total_comparisons,
        "total_anomalies": total_anomalies,
        "critical_anomalies": critical_anomalies,
    }


@router.get("/recent-comparisons")
def get_recent_comparisons(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    comparisons = db.query(Comparison).filter(
        Comparison.owner_id == current_user.id
    ).order_by(Comparison.created_at.desc()).limit(10).all()

    results = []
    for c in comparisons:
        project = db.query(Project).filter(Project.id == c.project_id).first()
        summary = c.result_summary or {}
        results.append({
            "id": c.id,
            "name": c.name,
            "project_name": project.name if project else "",
            "status": c.status,
            "date": str(c.created_at.date()) if c.created_at else "",
            "matched": summary.get("matched_rows", 0),
            "modified": summary.get("modified_rows", 0),
        })
    return results


@router.get("/activity")
def get_activity_data(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from datetime import datetime, timedelta
    today = datetime.utcnow().date()
    days = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_name = day.strftime("%a")
        comparisons_count = db.query(func.count(Comparison.id)).filter(
            Comparison.owner_id == current_user.id,
            func.date(Comparison.created_at) == day,
        ).scalar()
        anomalies_count = db.query(func.count(Anomaly.id)).join(File).filter(
            File.owner_id == current_user.id,
            func.date(Anomaly.detected_at) == day,
        ).scalar()
        days.append({
            "day": day_name,
            "comparisons": comparisons_count,
            "anomalies": anomalies_count,
        })
    return days


@router.get("/top-anomaly-columns")
def get_top_anomaly_columns(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    results = db.query(
        Anomaly.column_name,
        func.count(Anomaly.id).label("count"),
        func.avg(Anomaly.severity).label("avg_severity"),
    ).join(File).filter(
        File.owner_id == current_user.id
    ).group_by(Anomaly.column_name).order_by(func.count(Anomaly.id).desc()).limit(10).all()

    return [
        {"column": r.column_name, "count": r.count, "avg_severity": round(float(r.avg_severity), 1)}
        for r in results
    ]
