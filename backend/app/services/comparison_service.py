import pandas as pd
import numpy as np
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.comparison import Comparison
from app.models.file import File
from app.services.file_service import load_dataframe


def run_comparison(db: Session, comparison: Comparison) -> Comparison:
    comparison.status = "running"
    db.commit()

    try:
        source_file = db.query(File).filter(File.id == comparison.source_file_id).first()
        target_file = db.query(File).filter(File.id == comparison.target_file_id).first()

        if not source_file or not target_file:
            raise ValueError("Source or target file not found")

        df_source = load_dataframe(source_file)
        df_target = load_dataframe(target_file)

        config = comparison.config or {}
        primary_key = config.get("primary_key")
        ignore_columns = config.get("ignore_columns", [])
        case_sensitive = config.get("case_sensitive", True)
        tolerance = config.get("tolerance", 0.0)
        column_mapping = config.get("column_mapping", {})

        # Apply column mapping
        if column_mapping:
            df_target = df_target.rename(columns=column_mapping)

        # Remove ignored columns
        compare_cols_source = [c for c in df_source.columns if c not in ignore_columns]
        compare_cols_target = [c for c in df_target.columns if c not in ignore_columns]
        common_cols = list(set(compare_cols_source) & set(compare_cols_target))

        df_source_cmp = df_source[common_cols].copy()
        df_target_cmp = df_target[common_cols].copy()

        # Case insensitivity
        if not case_sensitive:
            for col in common_cols:
                if df_source_cmp[col].dtype == object:
                    df_source_cmp[col] = df_source_cmp[col].str.lower()
                if df_target_cmp[col].dtype == object:
                    df_target_cmp[col] = df_target_cmp[col].str.lower()

        result_details = {
            "added_rows": [],
            "removed_rows": [],
            "modified_rows": [],
            "duplicates": [],
        }

        if primary_key and primary_key in common_cols:
            # Key-based comparison
            df_source_cmp = df_source_cmp.set_index(primary_key)
            df_target_cmp = df_target_cmp.set_index(primary_key)

            source_keys = set(df_source_cmp.index)
            target_keys = set(df_target_cmp.index)

            added_keys = target_keys - source_keys
            removed_keys = source_keys - target_keys
            common_keys = source_keys & target_keys

            # Added rows
            for key in list(added_keys)[:500]:
                row = df_target_cmp.loc[key]
                result_details["added_rows"].append({
                    "key": str(key),
                    "values": {c: _safe_val(row.get(c)) for c in df_target_cmp.columns[:20]},
                })

            # Removed rows
            for key in list(removed_keys)[:500]:
                row = df_source_cmp.loc[key]
                result_details["removed_rows"].append({
                    "key": str(key),
                    "values": {c: _safe_val(row.get(c)) for c in df_source_cmp.columns[:20]},
                })

            # Modified rows
            value_cols = [c for c in df_source_cmp.columns if c in df_target_cmp.columns]
            for key in list(common_keys)[:2000]:
                src_row = df_source_cmp.loc[key]
                tgt_row = df_target_cmp.loc[key]

                if isinstance(src_row, pd.DataFrame):
                    src_row = src_row.iloc[0]
                if isinstance(tgt_row, pd.DataFrame):
                    tgt_row = tgt_row.iloc[0]

                changes = {}
                for col in value_cols:
                    src_val = src_row.get(col)
                    tgt_val = tgt_row.get(col)
                    if _values_differ(src_val, tgt_val, tolerance):
                        changes[col] = {
                            "source": _safe_val(src_val),
                            "target": _safe_val(tgt_val),
                        }
                if changes:
                    result_details["modified_rows"].append({
                        "key": str(key),
                        "changes": changes,
                    })

            # Duplicates in target
            dups = df_target[primary_key][df_target[primary_key].duplicated(keep=False)]
            if len(dups) > 0:
                for val in dups.unique()[:100]:
                    result_details["duplicates"].append({"key": str(val), "count": int((dups == val).sum())})

        else:
            # Index-based comparison
            max_rows = max(len(df_source_cmp), len(df_target_cmp))
            min_rows = min(len(df_source_cmp), len(df_target_cmp))

            for i in range(min(min_rows, 2000)):
                src_row = df_source_cmp.iloc[i] if i < len(df_source_cmp) else None
                tgt_row = df_target_cmp.iloc[i] if i < len(df_target_cmp) else None

                if src_row is not None and tgt_row is not None:
                    changes = {}
                    for col in common_cols:
                        if _values_differ(src_row.get(col), tgt_row.get(col), tolerance):
                            changes[col] = {
                                "source": _safe_val(src_row.get(col)),
                                "target": _safe_val(tgt_row.get(col)),
                            }
                    if changes:
                        result_details["modified_rows"].append({
                            "key": str(i),
                            "changes": changes,
                        })

            if len(df_target_cmp) > len(df_source_cmp):
                for i in range(len(df_source_cmp), min(len(df_target_cmp), len(df_source_cmp) + 500)):
                    row = df_target_cmp.iloc[i]
                    result_details["added_rows"].append({
                        "key": str(i),
                        "values": {c: _safe_val(row.get(c)) for c in common_cols[:20]},
                    })
            elif len(df_source_cmp) > len(df_target_cmp):
                for i in range(len(df_target_cmp), min(len(df_source_cmp), len(df_target_cmp) + 500)):
                    row = df_source_cmp.iloc[i]
                    result_details["removed_rows"].append({
                        "key": str(i),
                        "values": {c: _safe_val(row.get(c)) for c in common_cols[:20]},
                    })

        # Build summary
        result_summary = {
            "total_source_rows": len(df_source),
            "total_target_rows": len(df_target),
            "columns_compared": len(common_cols),
            "matched_rows": len(df_source) - len(result_details["removed_rows"]) - len(result_details["modified_rows"]),
            "added_rows": len(result_details["added_rows"]),
            "removed_rows": len(result_details["removed_rows"]),
            "modified_rows": len(result_details["modified_rows"]),
            "duplicates": len(result_details["duplicates"]),
        }

        comparison.result_summary = result_summary
        comparison.result_details = result_details
        comparison.status = "completed"
        comparison.completed_at = datetime.utcnow()

    except Exception as e:
        comparison.status = "failed"
        comparison.result_summary = {"error": str(e)}

    db.commit()
    db.refresh(comparison)
    return comparison


def _safe_val(val):
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return None
    return str(val)


def _values_differ(a, b, tolerance=0.0):
    if a is None and b is None:
        return False
    if a is None or b is None:
        return True
    if isinstance(a, float) and isinstance(b, float):
        if np.isnan(a) and np.isnan(b):
            return False
        if np.isnan(a) or np.isnan(b):
            return True
        return abs(a - b) > tolerance
    try:
        fa, fb = float(a), float(b)
        if abs(fa - fb) <= tolerance:
            return False
    except (ValueError, TypeError):
        pass
    return str(a) != str(b)
