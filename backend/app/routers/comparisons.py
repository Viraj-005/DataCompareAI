from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.comparison import Comparison
from app.models.file import File
from app.models.project import Project
from app.schemas.comparison import ComparisonCreate, ComparisonResponse
from app.services.comparison_service import run_comparison
from app.services.anomaly_service import detect_anomalies, detect_cross_version_anomalies

router = APIRouter(prefix="/api/comparisons", tags=["Comparisons"])


@router.get("", response_model=List[ComparisonResponse])
def list_comparisons(
    project_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Comparison).filter(Comparison.owner_id == current_user.id)
    if project_id:
        query = query.filter(Comparison.project_id == project_id)
    comparisons = query.order_by(Comparison.created_at.desc()).all()

    results = []
    for c in comparisons:
        project = db.query(Project).filter(Project.id == c.project_id).first()
        source = db.query(File).filter(File.id == c.source_file_id).first()
        target = db.query(File).filter(File.id == c.target_file_id).first()
        results.append(ComparisonResponse(
            id=c.id,
            name=c.name,
            description=c.description,
            status=c.status,
            config=c.config,
            result_summary=c.result_summary,
            result_details=None,  # Don't include full details in list
            project_id=c.project_id,
            project_name=project.name if project else None,
            source_file_id=c.source_file_id,
            source_filename=source.original_filename if source else None,
            target_file_id=c.target_file_id,
            target_filename=target.original_filename if target else None,
            owner_id=c.owner_id,
            created_at=c.created_at,
            completed_at=c.completed_at,
        ))
    return results


@router.post("", response_model=ComparisonResponse)
def create_comparison(
    data: ComparisonCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify project and files belong to user
    project = db.query(Project).filter(Project.id == data.project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    source = db.query(File).filter(File.id == data.source_file_id).first()
    target = db.query(File).filter(File.id == data.target_file_id).first()
    if not source or not target:
        raise HTTPException(status_code=404, detail="Source or target file not found")

    comparison = Comparison(
        name=data.name,
        description=data.description,
        project_id=data.project_id,
        source_file_id=data.source_file_id,
        target_file_id=data.target_file_id,
        config=data.config,
        owner_id=current_user.id,
    )
    db.add(comparison)
    db.commit()
    db.refresh(comparison)

    # Run comparison synchronously
    comparison = run_comparison(db, comparison)

    # Auto-detect anomalies on target file
    try:
        detect_anomalies(db, data.target_file_id, comparison.id)
        detect_cross_version_anomalies(db, data.source_file_id, data.target_file_id, comparison.id)
    except Exception:
        pass  # Don't fail the comparison if anomaly detection fails

    return ComparisonResponse(
        id=comparison.id,
        name=comparison.name,
        description=comparison.description,
        status=comparison.status,
        config=comparison.config,
        result_summary=comparison.result_summary,
        result_details=comparison.result_details,
        project_id=comparison.project_id,
        project_name=project.name,
        source_file_id=comparison.source_file_id,
        source_filename=source.original_filename,
        target_file_id=comparison.target_file_id,
        target_filename=target.original_filename,
        owner_id=comparison.owner_id,
        created_at=comparison.created_at,
        completed_at=comparison.completed_at,
    )


@router.get("/{comparison_id}", response_model=ComparisonResponse)
def get_comparison(comparison_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    c = db.query(Comparison).filter(Comparison.id == comparison_id, Comparison.owner_id == current_user.id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Comparison not found")
    project = db.query(Project).filter(Project.id == c.project_id).first()
    source = db.query(File).filter(File.id == c.source_file_id).first()
    target = db.query(File).filter(File.id == c.target_file_id).first()
    return ComparisonResponse(
        id=c.id,
        name=c.name,
        description=c.description,
        status=c.status,
        config=c.config,
        result_summary=c.result_summary,
        result_details=c.result_details,
        project_id=c.project_id,
        project_name=project.name if project else None,
        source_file_id=c.source_file_id,
        source_filename=source.original_filename if source else None,
        target_file_id=c.target_file_id,
        target_filename=target.original_filename if target else None,
        owner_id=c.owner_id,
        created_at=c.created_at,
        completed_at=c.completed_at,
    )


@router.delete("/{comparison_id}")
def delete_comparison(comparison_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    c = db.query(Comparison).filter(Comparison.id == comparison_id, Comparison.owner_id == current_user.id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Comparison not found")
    db.delete(c)
    db.commit()
    return {"message": "Comparison deleted"}
