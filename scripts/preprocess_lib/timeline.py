from __future__ import annotations

import pandas as pd


def infer_timeline_scale(match_durations: pd.Series) -> tuple[float, str]:
    """Infer how to scale per-match timestamp deltas into frontend milliseconds.

    The frontend expects milliseconds.

    In this dataset, parquet loads ts as datetime64[ms], but the per-match
    deltas are seconds-like values. Example: median duration ~382 should mean
    382 seconds, not 382 ms, because matches last several minutes.

    This keeps the decision isolated and documented.
    """
    durations = match_durations.dropna().astype("float64")

    if durations.empty:
        return 1.0, "empty"

    median_duration = float(durations.median())
    max_duration = float(durations.max())

    # If almost every match appears shorter than 1 second, but the values are
    # in the 100-900 range, they are gameplay seconds and need ms conversion.
    if median_duration < 1000 and max_duration < 5000:
        return 1000.0, "seconds_to_ms"

    return 1.0, "already_ms"


def add_relative_match_time(df: pd.DataFrame) -> tuple[pd.DataFrame, str, dict]:
    """Add ts_rel_ms after detecting whether match deltas need scaling."""
    df = df.copy()

    raw_rel = (
        df.groupby("match_id")["ts_ms"]
        .transform(lambda values: values - values.min())
        .astype("float64")
    )

    raw_match_durations = raw_rel.groupby(df["match_id"]).max()

    scale, scale_mode = infer_timeline_scale(raw_match_durations)

    df["ts_rel_ms"] = (raw_rel * scale).round().astype("int64")

    scaled_match_durations = df.groupby("match_id")["ts_rel_ms"].max()

    duration_summary = {
        "raw_min": int(raw_match_durations.min()),
        "raw_median": int(raw_match_durations.median()),
        "raw_max": int(raw_match_durations.max()),
        "scaled_min_ms": int(scaled_match_durations.min()),
        "scaled_median_ms": int(scaled_match_durations.median()),
        "scaled_max_ms": int(scaled_match_durations.max()),
        "scale": scale,
        "scale_mode": scale_mode,
    }

    return df, scale_mode, duration_summary