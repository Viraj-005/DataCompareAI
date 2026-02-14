from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(Integer, primary_key=True, index=True)
    comparison_id = Column(Integer, ForeignKey("comparisons.id"), nullable=True)
    file_id = Column(Integer, ForeignKey("files.id"), nullable=False)
    row_index = Column(Integer, nullable=False)
    column_name = Column(String(255), nullable=False)
    value = Column(String(500), nullable=True)
    reason = Column(Text, nullable=False)
    severity = Column(Float, default=5.0)  # 1-10 scale
    anomaly_type = Column(String(50), nullable=False)  # zscore, iqr, negative, spike, deviation
    detected_at = Column(DateTime, default=datetime.utcnow)

    comparison = relationship("Comparison", back_populates="anomalies")
    file = relationship("File", back_populates="anomalies")
