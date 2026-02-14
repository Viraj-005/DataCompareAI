from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Rule(Base):
    __tablename__ = "rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    column_name = Column(String(255), nullable=False)
    rule_type = Column(String(50), nullable=False)  # unique, positive, not_null, range, regex
    parameters = Column(JSON, nullable=True)  # {min, max, pattern, etc.}
    is_active = Column(Integer, default=1)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="rules")
    owner = relationship("User", back_populates="rules")
    violations = relationship("RuleViolation", back_populates="rule", cascade="all, delete-orphan")


class RuleViolation(Base):
    __tablename__ = "rule_violations"

    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(Integer, ForeignKey("rules.id"), nullable=False)
    file_id = Column(Integer, ForeignKey("files.id"), nullable=False)
    row_index = Column(Integer, nullable=False)
    column_name = Column(String(255), nullable=False)
    value = Column(String(500), nullable=True)
    message = Column(Text, nullable=False)
    detected_at = Column(DateTime, default=datetime.utcnow)

    rule = relationship("Rule", back_populates="violations")
    file = relationship("File", back_populates="rule_violations")
