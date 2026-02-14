import io
import pandas as pd
from sqlalchemy.orm import Session
from app.models.comparison import Comparison
from app.models.anomaly import Anomaly
from app.models.rule import RuleViolation


def export_comparison_results(db: Session, comparison_id: int, format: str = "csv") -> tuple:
    comparison = db.query(Comparison).filter(Comparison.id == comparison_id).first()
    if not comparison or not comparison.result_details:
        raise ValueError("Comparison results not found")

    details = comparison.result_details
    rows = []

    for item in details.get("added_rows", []):
        row = {"Type": "Added", "Key": item.get("key", "")}
        row.update(item.get("values", {}))
        rows.append(row)

    for item in details.get("removed_rows", []):
        row = {"Type": "Removed", "Key": item.get("key", "")}
        row.update(item.get("values", {}))
        rows.append(row)

    for item in details.get("modified_rows", []):
        for col, change in item.get("changes", {}).items():
            rows.append({
                "Type": "Modified",
                "Key": item.get("key", ""),
                "Column": col,
                "Source Value": change.get("source", ""),
                "Target Value": change.get("target", ""),
            })

    df = pd.DataFrame(rows)
    return _export_df(df, f"comparison_{comparison_id}", format)


def export_anomalies(db: Session, file_id: int = None, comparison_id: int = None, format: str = "csv") -> tuple:
    query = db.query(Anomaly)
    if file_id:
        query = query.filter(Anomaly.file_id == file_id)
    if comparison_id:
        query = query.filter(Anomaly.comparison_id == comparison_id)

    anomalies = query.all()
    rows = []
    for a in anomalies:
        rows.append({
            "Row": a.row_index,
            "Column": a.column_name,
            "Value": a.value,
            "Reason": a.reason,
            "Severity": a.severity,
            "Type": a.anomaly_type,
            "Detected At": str(a.detected_at),
        })

    df = pd.DataFrame(rows)
    return _export_df(df, "anomalies", format)


def export_violations(db: Session, file_id: int = None, project_id: int = None, format: str = "csv") -> tuple:
    query = db.query(RuleViolation)
    if file_id:
        query = query.filter(RuleViolation.file_id == file_id)

    violations = query.all()
    rows = []
    for v in violations:
        rows.append({
            "Row": v.row_index,
            "Column": v.column_name,
            "Value": v.value,
            "Message": v.message,
            "Detected At": str(v.detected_at),
        })

    df = pd.DataFrame(rows)
    return _export_df(df, "violations", format)


def _export_df(df: pd.DataFrame, name: str, format: str) -> tuple:
    buffer = io.BytesIO()
    if format == "xlsx":
        df.to_excel(buffer, index=False, engine="xlsxwriter")
        content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename = f"{name}.xlsx"
    else:
        buffer.write(df.to_csv(index=False).encode("utf-8"))
        content_type = "text/csv"
        filename = f"{name}.csv"

    buffer.seek(0)
    return buffer, filename, content_type
