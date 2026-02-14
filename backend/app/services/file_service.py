import os
import uuid
import pandas as pd
from fastapi import UploadFile
from sqlalchemy.orm import Session
from app.models.file import File
from app.core.config import settings


def save_upload_file(upload_file: UploadFile, project_id: int, owner_id: int, db: Session) -> File:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    ext = upload_file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ("csv", "xlsx", "xls"):
        raise ValueError("Unsupported file type. Only CSV, XLSX, XLS allowed.")

    unique_name = f"{uuid.uuid4().hex}_{upload_file.filename}"
    filepath = os.path.join(settings.UPLOAD_DIR, unique_name)

    content = upload_file.file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    size_bytes = len(content)

    # Parse file for metadata
    try:
        if ext == "csv":
            df = pd.read_csv(filepath)
        else:
            df = pd.read_excel(filepath)
    except Exception:
        df = pd.DataFrame()

    row_count = len(df)
    column_count = len(df.columns)
    column_metadata = []
    for col in df.columns:
        col_info = {
            "name": str(col),
            "dtype": str(df[col].dtype),
            "null_count": int(df[col].isnull().sum()),
            "unique_count": int(df[col].nunique()),
        }
        # Add sample values
        samples = df[col].dropna().head(3).tolist()
        col_info["sample_values"] = [str(s) for s in samples]
        column_metadata.append(col_info)

    # Determine version
    existing_count = db.query(File).filter(
        File.project_id == project_id,
        File.original_filename == upload_file.filename
    ).count()

    file_record = File(
        filename=unique_name,
        original_filename=upload_file.filename,
        filepath=filepath,
        file_type=ext,
        size_bytes=size_bytes,
        row_count=row_count,
        column_count=column_count,
        column_metadata=column_metadata,
        version=existing_count + 1,
        project_id=project_id,
        owner_id=owner_id,
    )
    db.add(file_record)
    db.commit()
    db.refresh(file_record)
    return file_record


def load_dataframe(file_record: File) -> pd.DataFrame:
    if file_record.file_type == "csv":
        return pd.read_csv(file_record.filepath)
    else:
        return pd.read_excel(file_record.filepath)
