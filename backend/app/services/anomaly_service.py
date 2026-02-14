import numpy as np
import pandas as pd
from scipy import stats
from sqlalchemy.orm import Session
from app.models.anomaly import Anomaly
from app.models.file import File
from app.services.file_service import load_dataframe


def detect_anomalies(db: Session, file_id: int, comparison_id: int = None) -> list:
    file_record = db.query(File).filter(File.id == file_id).first()
    if not file_record:
        raise ValueError("File not found")

    df = load_dataframe(file_record)
    anomalies = []

    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

    for col in numeric_cols:
        series = df[col].dropna()
        if len(series) < 3:
            continue

        # Z-score outlier detection
        z_scores = np.abs(stats.zscore(series))
        z_outliers = series.index[z_scores > 3].tolist()
        for idx in z_outliers:
            row_idx = int(idx)
            val = float(df.at[row_idx, col])
            z_val = float(z_scores[series.index.get_loc(idx)]) if idx in series.index else 0.0
            severity = min(10.0, round(z_val * 1.5, 1))
            anomalies.append(Anomaly(
                comparison_id=comparison_id,
                file_id=file_id,
                row_index=row_idx,
                column_name=col,
                value=str(val),
                reason=f"Z-score outlier (z={z_val:.2f}). Value {val} significantly deviates from mean {float(series.mean()):.2f}",
                severity=severity,
                anomaly_type="zscore",
            ))

        # IQR outlier detection
        q1 = float(series.quantile(0.25))
        q3 = float(series.quantile(0.75))
        iqr = q3 - q1
        if iqr > 0:
            lower = q1 - 1.5 * iqr
            upper = q3 + 1.5 * iqr
            iqr_outliers = series[(series < lower) | (series > upper)]
            for idx, val in iqr_outliers.items():
                row_idx = int(idx)
                # Avoid duplicating z-score detections
                if row_idx in z_outliers:
                    continue
                val_float = float(val)
                distance = max(abs(val_float - lower), abs(val_float - upper)) / iqr if iqr > 0 else 0.0
                severity = min(10.0, round(3 + distance, 1))
                anomalies.append(Anomaly(
                    comparison_id=comparison_id,
                    file_id=file_id,
                    row_index=row_idx,
                    column_name=col,
                    value=str(val_float),
                    reason=f"IQR outlier. Value {val_float} outside range [{lower:.2f}, {upper:.2f}]",
                    severity=severity,
                    anomaly_type="iqr",
                ))

        # Negative value detection (for columns that seem like they should be positive)
        if series.median() > 0 and series.min() < 0:
            neg_values = series[series < 0]
            for idx, val in neg_values.items():
                row_idx = int(idx)
                val_float = float(val)
                anomalies.append(Anomaly(
                    comparison_id=comparison_id,
                    file_id=file_id,
                    row_index=row_idx,
                    column_name=col,
                    value=str(val_float),
                    reason=f"Unexpected negative value {val_float} in predominantly positive column (median={float(series.median()):.2f})",
                    severity=6.0,
                    anomaly_type="negative",
                ))

        # Spike detection (sudden changes between consecutive rows)
        if len(series) > 5:
            pct_change = series.pct_change().abs()
            # Handle infinite changes (0 to something)
            pct_change = pct_change.replace([np.inf, -np.inf], 100.0) # Treat 0->N as 10000% change equivalent for thresholding
            
            std_dev = float(pct_change.std())
            median_change = float(pct_change.median())
            spike_threshold = median_change + 3 * std_dev if std_dev > 0 else 10.0
            
            spikes = pct_change[pct_change > max(spike_threshold, 5.0)]
            for idx, change_val in list(spikes.items())[:50]:
                row_idx = int(idx)
                actual_val = float(df.at[row_idx, col])
                change_val_float = float(change_val)
                
                # Cap severity at 10
                severity = min(10.0, round(4 + change_val_float, 1))
                
                reason_str = f"Abnormal spike detected. {change_val_float*100:.1f}% change from previous row"
                if change_val_float >= 99.0: # Check for the 100.0 placeholder we set for infinity
                     reason_str = "Abnormal spike detected. Jump from 0 or extreme change."

                anomalies.append(Anomaly(
                    comparison_id=comparison_id,
                    file_id=file_id,
                    row_index=row_idx,
                    column_name=col,
                    value=str(actual_val),
                    reason=reason_str,
                    severity=severity,
                    anomaly_type="spike",
                ))

    # Save anomalies to DB (limit to 1000 per file)
    anomalies = anomalies[:1000]
    for anomaly in anomalies:
        db.add(anomaly)
    db.commit()

    return anomalies


def detect_cross_version_anomalies(db: Session, source_file_id: int, target_file_id: int, comparison_id: int = None) -> list:
    source = db.query(File).filter(File.id == source_file_id).first()
    target = db.query(File).filter(File.id == target_file_id).first()

    if not source or not target:
        return []

    df_source = load_dataframe(source)
    df_target = load_dataframe(target)

    anomalies = []
    common_cols = list(set(df_source.columns) & set(df_target.columns))
    numeric_cols = [c for c in common_cols if pd.api.types.is_numeric_dtype(df_source[c]) and pd.api.types.is_numeric_dtype(df_target[c])]

    for col in numeric_cols:
        src_mean = float(df_source[col].mean())
        tgt_mean = float(df_target[col].mean())
        src_std = float(df_source[col].std())

        if src_std > 0:
            change_zscore = abs(tgt_mean - src_mean) / src_std
            if change_zscore > 2:
                anomalies.append(Anomaly(
                    comparison_id=comparison_id,
                    file_id=target.id,
                    row_index=0,
                    column_name=col,
                    value=f"{tgt_mean:.2f}",
                    reason=f"Significant mean shift between versions: {src_mean:.2f} -> {tgt_mean:.2f} (z={change_zscore:.2f})",
                    severity=min(10.0, round(change_zscore * 2, 1)),
                    anomaly_type="deviation",
                ))

    for anomaly in anomalies:
        db.add(anomaly)
    db.commit()

    return anomalies
