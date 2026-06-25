from __future__ import annotations

import numpy as np
import pandas as pd

from .config import IMAGE_SIZE, MAP_CONFIG


def world_to_pixel_arrays(df: pd.DataFrame) -> tuple[pd.Series, pd.Series, pd.Series]:
    px = pd.Series(np.nan, index=df.index, dtype="float64")
    py = pd.Series(np.nan, index=df.index, dtype="float64")
    oob = pd.Series(False, index=df.index, dtype="bool")

    for map_id, cfg in MAP_CONFIG.items():
        mask = df["map_id"] == map_id

        if not mask.any():
            continue

        scale = float(cfg["scale"])
        origin_x = float(cfg["origin_x"])
        origin_z = float(cfg["origin_z"])

        u = (df.loc[mask, "x"].astype(float) - origin_x) / scale
        v = (df.loc[mask, "z"].astype(float) - origin_z) / scale

        raw_px = u * IMAGE_SIZE
        raw_py = (1 - v) * IMAGE_SIZE

        oob.loc[mask] = (
            (raw_px < 0)
            | (raw_px > IMAGE_SIZE - 1)
            | (raw_py < 0)
            | (raw_py > IMAGE_SIZE - 1)
        )

        px.loc[mask] = raw_px.clip(0, IMAGE_SIZE - 1)
        py.loc[mask] = raw_py.clip(0, IMAGE_SIZE - 1)

    unknown_maps = sorted(set(df["map_id"].dropna()) - set(MAP_CONFIG))

    if unknown_maps:
        raise ValueError(f"Unknown map_id values found: {unknown_maps}")

    return px.round(2), py.round(2), oob


def validate_coordinate_formula() -> None:
    cfg = MAP_CONFIG["AmbroseValley"]

    x = -301.45
    z = -355.55

    u = (x - float(cfg["origin_x"])) / float(cfg["scale"])
    v = (z - float(cfg["origin_z"])) / float(cfg["scale"])

    px = u * IMAGE_SIZE
    py = (1 - v) * IMAGE_SIZE

    assert round(px) == 78, f"Expected px≈78, got {px}"
    assert round(py) == 890, f"Expected py≈890, got {py}"