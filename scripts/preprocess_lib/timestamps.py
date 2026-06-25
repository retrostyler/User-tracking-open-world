from __future__ import annotations

import numpy as np
import pandas as pd

from .config import TIMESTAMP_UNITS, TIMESTAMP_UNIT_TO_MS_FACTOR


def infer_numeric_timestamp_unit(numeric: pd.Series) -> str:
    values = numeric.dropna().astype("float64")

    if values.empty:
        raise ValueError("No non-null ts values were found.")

    max_abs = float(values.abs().max())
    span = float(values.max() - values.min())
    has_fractional_values = bool(((values % 1).abs() > 1e-9).any())

    # Epoch-scale timestamps.
    if max_abs >= 1e17:
        return "ns"
    if max_abs >= 1e14:
        return "us"
    if max_abs >= 1e11:
        return "ms"
    if max_abs >= 1e8:
        return "s"

    # Relative elapsed values.
    if has_fractional_values and span <= 24 * 60 * 60:
        return "s"

    return "ms"


def datetime_series_to_ms(series: pd.Series) -> tuple[pd.Series, str]:
    """Convert pandas datetime series to integer milliseconds safely.

    Parquet timestamp(ms) can load as datetime64[ms].
    If we blindly divide by 1_000_000, duration collapses to zero.
    """
    dtype = series.dtype
    unit = getattr(dtype, "unit", None)

    if unit is None:
        unit = np.datetime_data(dtype)[0]

    factor_by_unit = {
        "s": 1000.0,
        "ms": 1.0,
        "us": 1 / 1_000.0,
        "ns": 1 / 1_000_000.0,
    }

    if unit not in factor_by_unit:
        converted = pd.to_datetime(series, errors="coerce")

        if converted.isna().any():
            bad = series[converted.isna()].head(3).tolist()
            raise ValueError(f"Could not convert datetime ts values. Examples: {bad}")

        return converted.astype("datetime64[ms]").astype("int64"), "datetime64[ms]"

    values = series.astype("int64").astype("float64")
    return (values * factor_by_unit[unit]).round().astype("int64"), f"datetime64[{unit}]"


def timestamp_to_ms(series: pd.Series, requested_unit: str = "auto") -> tuple[pd.Series, str]:
    """Return integer milliseconds and the resolved timestamp unit."""
    if requested_unit not in TIMESTAMP_UNITS:
        raise ValueError(
            f"Unsupported timestamp unit {requested_unit!r}. "
            f"Expected one of {TIMESTAMP_UNITS}."
        )

    if pd.api.types.is_datetime64_any_dtype(series):
        return datetime_series_to_ms(series)

    numeric = pd.to_numeric(series, errors="coerce")

    if numeric.notna().all():
        resolved_unit = (
            infer_numeric_timestamp_unit(numeric)
            if requested_unit == "auto"
            else requested_unit
        )

        factor = TIMESTAMP_UNIT_TO_MS_FACTOR[resolved_unit]
        return (numeric.astype("float64") * factor).round().astype("int64"), resolved_unit

    converted = pd.to_datetime(series, errors="coerce")

    if converted.notna().all():
        return datetime_series_to_ms(converted)

    bad_numeric = series[numeric.isna()].head(3).tolist()
    bad_datetime = series[converted.isna()].head(3).tolist()

    raise ValueError(
        "Could not convert ts values to milliseconds. "
        f"Non-numeric examples: {bad_numeric}; non-datetime examples: {bad_datetime}"
    )