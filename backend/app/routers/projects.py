from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.file import File
from app.models.comparison import Comparison
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse

router = APIRouter(prefix="/api/projects", tags=["Projects"])


@router.get("", response_model=List[ProjectResponse])
def list_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    projects = db.query(Project).filter(Project.owner_id == current_user.id).order_by(Project.updated_at.desc()).all()
    result = []
    for p in projects:
        file_count = db.query(func.count(File.id)).filter(File.project_id == p.id).scalar()
        last_comparison = db.query(Comparison).filter(
            Comparison.project_id == p.id
        ).order_by(Comparison.created_at.desc()).first()
        result.append(ProjectResponse(
            id=p.id,
            name=p.name,
            description=p.description,
            status=p.status,
            owner_id=p.owner_id,
            owner_name=current_user.full_name,
            file_count=file_count,
            last_run=last_comparison.created_at if last_comparison else None,
            created_at=p.created_at,
            updated_at=p.updated_at,
        ))
    return result


@router.post("", response_model=ProjectResponse)
def create_project(data: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = Project(
        name=data.name,
        description=data.description,
        owner_id=current_user.id,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        status=project.status,
        owner_id=project.owner_id,
        owner_name=current_user.full_name,
        file_count=0,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    file_count = db.query(func.count(File.id)).filter(File.project_id == project.id).scalar()
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        status=project.status,
        owner_id=project.owner_id,
        owner_name=current_user.full_name,
        file_count=file_count,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: int, data: ProjectUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if data.name is not None:
        project.name = data.name
    if data.description is not None:
        project.description = data.description
    if data.status is not None:
        project.status = data.status
    db.commit()
    db.refresh(project)
    file_count = db.query(func.count(File.id)).filter(File.project_id == project.id).scalar()
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        status=project.status,
        owner_id=project.owner_id,
        owner_name=current_user.full_name,
        file_count=file_count,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"message": "Project deleted"}
