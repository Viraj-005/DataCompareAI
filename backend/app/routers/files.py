from fastapi import APIRouter, Depends, HTTPException, UploadFile, File as FastAPIFile, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.file import File
from app.models.project import Project
from app.schemas.file import FileResponse
from app.services.file_service import save_upload_file

router = APIRouter(prefix="/api/files", tags=["Files"])


@router.post("/upload", response_model=FileResponse)
def upload_file(
    project_id: int,
    file: UploadFile = FastAPIFile(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        file_record = save_upload_file(file, project_id, current_user.id, db)
        return FileResponse(
            id=file_record.id,
            filename=file_record.filename,
            original_filename=file_record.original_filename,
            file_type=file_record.file_type,
            size_bytes=file_record.size_bytes,
            row_count=file_record.row_count,
            column_count=file_record.column_count,
            column_metadata=file_record.column_metadata,
            version=file_record.version,
            project_id=file_record.project_id,
            project_name=project.name,
            owner_id=file_record.owner_id,
            uploaded_at=file_record.uploaded_at,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/upload-multiple", response_model=List[FileResponse])
def upload_multiple_files(
    project_id: int,
    files: List[UploadFile] = FastAPIFile(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    results = []
    for file in files:
        try:
            file_record = save_upload_file(file, project_id, current_user.id, db)
            results.append(FileResponse(
                id=file_record.id,
                filename=file_record.filename,
                original_filename=file_record.original_filename,
                file_type=file_record.file_type,
                size_bytes=file_record.size_bytes,
                row_count=file_record.row_count,
                column_count=file_record.column_count,
                column_metadata=file_record.column_metadata,
                version=file_record.version,
                project_id=file_record.project_id,
                project_name=project.name,
                owner_id=file_record.owner_id,
                uploaded_at=file_record.uploaded_at,
            ))
        except ValueError as e:
            continue
    return results


@router.get("", response_model=List[FileResponse])
def list_files(
    project_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(File).filter(File.owner_id == current_user.id)
    if project_id:
        query = query.filter(File.project_id == project_id)
    files = query.order_by(File.uploaded_at.desc()).all()

    results = []
    for f in files:
        project = db.query(Project).filter(Project.id == f.project_id).first()
        results.append(FileResponse(
            id=f.id,
            filename=f.filename,
            original_filename=f.original_filename,
            file_type=f.file_type,
            size_bytes=f.size_bytes,
            row_count=f.row_count,
            column_count=f.column_count,
            column_metadata=f.column_metadata,
            version=f.version,
            project_id=f.project_id,
            project_name=project.name if project else None,
            owner_id=f.owner_id,
            uploaded_at=f.uploaded_at,
        ))
    return results


@router.get("/{file_id}", response_model=FileResponse)
def get_file(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    f = db.query(File).filter(File.id == file_id, File.owner_id == current_user.id).first()
    if not f:
        raise HTTPException(status_code=404, detail="File not found")
    project = db.query(Project).filter(Project.id == f.project_id).first()
    return FileResponse(
        id=f.id,
        filename=f.filename,
        original_filename=f.original_filename,
        file_type=f.file_type,
        size_bytes=f.size_bytes,
        row_count=f.row_count,
        column_count=f.column_count,
        column_metadata=f.column_metadata,
        version=f.version,
        project_id=f.project_id,
        project_name=project.name if project else None,
        owner_id=f.owner_id,
        uploaded_at=f.uploaded_at,
    )


@router.delete("/{file_id}")
def delete_file(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    f = db.query(File).filter(File.id == file_id, File.owner_id == current_user.id).first()
    if not f:
        raise HTTPException(status_code=404, detail="File not found")
    import os
    if os.path.exists(f.filepath):
        os.remove(f.filepath)
    db.delete(f)
    db.commit()
    return {"message": "File deleted"}
