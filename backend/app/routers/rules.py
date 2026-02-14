from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.rule import Rule, RuleViolation
from app.models.file import File
from app.models.project import Project
from app.schemas.rule import RuleCreate, RuleUpdate, RuleResponse, RuleViolationResponse
from app.services.rule_service import validate_rules

router = APIRouter(prefix="/api/rules", tags=["Rules"])


@router.get("", response_model=List[RuleResponse])
def list_rules(
    project_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Rule).filter(Rule.owner_id == current_user.id)
    if project_id:
        query = query.filter(Rule.project_id == project_id)
    rules = query.order_by(Rule.created_at.desc()).all()

    results = []
    for r in rules:
        violation_count = db.query(RuleViolation).filter(RuleViolation.rule_id == r.id).count()
        results.append(RuleResponse(
            id=r.id,
            name=r.name,
            column_name=r.column_name,
            rule_type=r.rule_type,
            parameters=r.parameters,
            is_active=r.is_active,
            project_id=r.project_id,
            owner_id=r.owner_id,
            violation_count=violation_count,
            created_at=r.created_at,
        ))
    return results


@router.post("", response_model=RuleResponse)
def create_rule(
    data: RuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == data.project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    rule = Rule(
        name=data.name,
        column_name=data.column_name,
        rule_type=data.rule_type,
        parameters=data.parameters,
        project_id=data.project_id,
        owner_id=current_user.id,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)

    return RuleResponse(
        id=rule.id,
        name=rule.name,
        column_name=rule.column_name,
        rule_type=rule.rule_type,
        parameters=rule.parameters,
        is_active=rule.is_active,
        project_id=rule.project_id,
        owner_id=rule.owner_id,
        violation_count=0,
        created_at=rule.created_at,
    )


@router.put("/{rule_id}", response_model=RuleResponse)
def update_rule(
    rule_id: int,
    data: RuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rule = db.query(Rule).filter(Rule.id == rule_id, Rule.owner_id == current_user.id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    if data.name is not None:
        rule.name = data.name
    if data.column_name is not None:
        rule.column_name = data.column_name
    if data.rule_type is not None:
        rule.rule_type = data.rule_type
    if data.parameters is not None:
        rule.parameters = data.parameters
    if data.is_active is not None:
        rule.is_active = data.is_active
    db.commit()
    db.refresh(rule)
    violation_count = db.query(RuleViolation).filter(RuleViolation.rule_id == rule.id).count()
    return RuleResponse(
        id=rule.id,
        name=rule.name,
        column_name=rule.column_name,
        rule_type=rule.rule_type,
        parameters=rule.parameters,
        is_active=rule.is_active,
        project_id=rule.project_id,
        owner_id=rule.owner_id,
        violation_count=violation_count,
        created_at=rule.created_at,
    )


@router.delete("/{rule_id}")
def delete_rule(rule_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rule = db.query(Rule).filter(Rule.id == rule_id, Rule.owner_id == current_user.id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(rule)
    db.commit()
    return {"message": "Rule deleted"}


@router.post("/validate/{file_id}", response_model=List[RuleViolationResponse])
def validate_file_rules(
    file_id: int,
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    f = db.query(File).filter(File.id == file_id, File.owner_id == current_user.id).first()
    if not f:
        raise HTTPException(status_code=404, detail="File not found")

    violations = validate_rules(db, file_id, project_id)
    results = []
    for v in violations:
        rule = db.query(Rule).filter(Rule.id == v.rule_id).first()
        results.append(RuleViolationResponse(
            id=v.id,
            rule_id=v.rule_id,
            rule_name=rule.name if rule else None,
            file_id=v.file_id,
            filename=f.original_filename,
            row_index=v.row_index,
            column_name=v.column_name,
            value=v.value,
            message=v.message,
            detected_at=v.detected_at,
        ))
    return results


@router.get("/violations", response_model=List[RuleViolationResponse])
def list_violations(
    file_id: int = None,
    rule_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(RuleViolation).join(Rule).filter(Rule.owner_id == current_user.id)
    if file_id:
        query = query.filter(RuleViolation.file_id == file_id)
    if rule_id:
        query = query.filter(RuleViolation.rule_id == rule_id)
    violations = query.order_by(RuleViolation.detected_at.desc()).all()

    results = []
    for v in violations:
        rule = db.query(Rule).filter(Rule.id == v.rule_id).first()
        f = db.query(File).filter(File.id == v.file_id).first()
        results.append(RuleViolationResponse(
            id=v.id,
            rule_id=v.rule_id,
            rule_name=rule.name if rule else None,
            file_id=v.file_id,
            filename=f.original_filename if f else None,
            row_index=v.row_index,
            column_name=v.column_name,
            value=v.value,
            message=v.message,
            detected_at=v.detected_at,
        ))
    return results
