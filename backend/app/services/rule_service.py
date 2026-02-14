import re
import pandas as pd
from sqlalchemy.orm import Session
from app.models.rule import Rule, RuleViolation
from app.models.file import File
from app.services.file_service import load_dataframe


def validate_rules(db: Session, file_id: int, project_id: int) -> list:
    file_record = db.query(File).filter(File.id == file_id).first()
    if not file_record:
        raise ValueError("File not found")

    rules = db.query(Rule).filter(
        Rule.project_id == project_id,
        Rule.is_active == 1
    ).all()

    if not rules:
        return []

    df = load_dataframe(file_record)
    violations = []

    for rule in rules:
        if rule.column_name not in df.columns:
            continue

        col_data = df[rule.column_name]
        params = rule.parameters or {}

        if rule.rule_type == "not_null":
            null_rows = col_data[col_data.isnull()].index.tolist()
            for idx in null_rows[:200]:
                violations.append(RuleViolation(
                    rule_id=rule.id,
                    file_id=file_id,
                    row_index=int(idx),
                    column_name=rule.column_name,
                    value=None,
                    message=f"Null value found in column '{rule.column_name}' (rule: {rule.name})",
                ))

        elif rule.rule_type == "unique":
            duplicated = col_data[col_data.duplicated(keep=False)]
            seen = set()
            for idx, val in duplicated.items():
                if str(val) not in seen:
                    seen.add(str(val))
                    violations.append(RuleViolation(
                        rule_id=rule.id,
                        file_id=file_id,
                        row_index=int(idx),
                        column_name=rule.column_name,
                        value=str(val),
                        message=f"Duplicate value '{val}' in column '{rule.column_name}' (rule: {rule.name})",
                    ))
                if len(violations) > 500:
                    break

        elif rule.rule_type == "positive":
            numeric_data = pd.to_numeric(col_data, errors="coerce")
            neg_rows = numeric_data[numeric_data < 0].dropna()
            for idx, val in list(neg_rows.items())[:200]:
                violations.append(RuleViolation(
                    rule_id=rule.id,
                    file_id=file_id,
                    row_index=int(idx),
                    column_name=rule.column_name,
                    value=str(val),
                    message=f"Non-positive value {val} in column '{rule.column_name}' (rule: {rule.name})",
                ))

        elif rule.rule_type == "range":
            min_val = params.get("min")
            max_val = params.get("max")
            numeric_data = pd.to_numeric(col_data, errors="coerce")
            for idx, val in numeric_data.items():
                if pd.isna(val):
                    continue
                if min_val is not None and val < min_val:
                    violations.append(RuleViolation(
                        rule_id=rule.id,
                        file_id=file_id,
                        row_index=int(idx),
                        column_name=rule.column_name,
                        value=str(val),
                        message=f"Value {val} below minimum {min_val} (rule: {rule.name})",
                    ))
                elif max_val is not None and val > max_val:
                    violations.append(RuleViolation(
                        rule_id=rule.id,
                        file_id=file_id,
                        row_index=int(idx),
                        column_name=rule.column_name,
                        value=str(val),
                        message=f"Value {val} above maximum {max_val} (rule: {rule.name})",
                    ))
                if len(violations) > 500:
                    break

        elif rule.rule_type == "regex":
            pattern = params.get("pattern", "")
            if pattern:
                for idx, val in col_data.items():
                    if pd.isna(val):
                        continue
                    if not re.match(pattern, str(val)):
                        violations.append(RuleViolation(
                            rule_id=rule.id,
                            file_id=file_id,
                            row_index=int(idx),
                            column_name=rule.column_name,
                            value=str(val),
                            message=f"Value '{val}' does not match pattern '{pattern}' (rule: {rule.name})",
                        ))
                    if len(violations) > 500:
                        break

    # Save violations
    # Clear old violations for this file
    db.query(RuleViolation).filter(RuleViolation.file_id == file_id).delete()
    for v in violations:
        db.add(v)
    db.commit()

    return violations
