from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, BigInteger, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(500), nullable=False)
    original_filename = Column(String(500), nullable=False)
    filepath = Column(String(1000), nullable=False)
    file_type = Column(String(10), nullable=False)  # csv, xlsx, xls
    size_bytes = Column(BigInteger, default=0)
    row_count = Column(Integer, default=0)
    column_count = Column(Integer, default=0)
    column_metadata = Column(JSON, nullable=True)  # [{name, dtype, sample_values}]
    version = Column(Integer, default=1)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="files")
    owner = relationship("User", back_populates="files")
    anomalies = relationship("Anomaly", back_populates="file", cascade="all, delete-orphan")
    rule_violations = relationship("RuleViolation", back_populates="file", cascade="all, delete-orphan")
