from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Comparison(Base):
    __tablename__ = "comparisons"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="pending")  # pending, running, completed, failed
    config = Column(JSON, nullable=True)  # {primary_key, column_mapping, ignore_columns, case_sensitive, tolerance}
    result_summary = Column(JSON, nullable=True)  # {total_rows, matched, added, removed, modified, duplicates}
    result_details = Column(JSON, nullable=True)  # detailed diff data
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    source_file_id = Column(Integer, ForeignKey("files.id"), nullable=False)
    target_file_id = Column(Integer, ForeignKey("files.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    project = relationship("Project", back_populates="comparisons")
    owner = relationship("User", back_populates="comparisons")
    source_file = relationship("File", foreign_keys=[source_file_id])
    target_file = relationship("File", foreign_keys=[target_file_id])
    anomalies = relationship("Anomaly", back_populates="comparison", cascade="all, delete-orphan")
