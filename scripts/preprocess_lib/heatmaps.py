from __future__ import annotations

import numpy as np
import pandas as pd

from .config import (
    DEATH_EVENTS,
    GRID_SIZE,
    IMAGE_SIZE,
    KILL_EVENTS,
    LOOT_EVENTS,
    MOVEMENT_EVENTS,
    STORM_EVENTS,
)


def add_to_heatmap(layer: np.ndarray, px: pd.Series, py: pd.Series, grid_size: int) -> None:
    if len(px) == 0:
        return

    gx = np.floor(px.to_numpy(dtype=float) / IMAGE_SIZE * grid_size).astype(int)
    gy = np.floor(py.to_numpy(dtype=float) / IMAGE_SIZE * grid_size).astype(int)

    gx = np.clip(gx, 0, grid_size - 1)
    gy = np.clip(gy, 0, grid_size - 1)

    np.add.at(layer, (gy, gx), 1)


def sparse_grid(grid: np.ndarray) -> list[list[int]]:
    ys, xs = np.nonzero(grid)
    values = grid[ys, xs]

    return [
        [int(x), int(y), int(v)]
        for x, y, v in zip(xs, ys, values, strict=True)
    ]


def build_heatmaps(df: pd.DataFrame, grid_size: int = GRID_SIZE) -> dict[str, dict]:
    output: dict[str, dict] = {}

    for map_id, map_df in df.groupby("map_id"):
        layers = {
            "traffic": np.zeros((grid_size, grid_size), dtype=np.uint32),
            "kills": np.zeros((grid_size, grid_size), dtype=np.uint32),
            "deaths": np.zeros((grid_size, grid_size), dtype=np.uint32),
            "storm": np.zeros((grid_size, grid_size), dtype=np.uint32),
            "loot": np.zeros((grid_size, grid_size), dtype=np.uint32),
        }

        add_to_heatmap(
            layers["traffic"],
            map_df.loc[map_df["event"].isin(MOVEMENT_EVENTS), "px"],
            map_df.loc[map_df["event"].isin(MOVEMENT_EVENTS), "py"],
            grid_size,
        )

        add_to_heatmap(
            layers["kills"],
            map_df.loc[map_df["event"].isin(KILL_EVENTS), "px"],
            map_df.loc[map_df["event"].isin(KILL_EVENTS), "py"],
            grid_size,
        )

        add_to_heatmap(
            layers["deaths"],
            map_df.loc[map_df["event"].isin(DEATH_EVENTS), "px"],
            map_df.loc[map_df["event"].isin(DEATH_EVENTS), "py"],
            grid_size,
        )

        add_to_heatmap(
            layers["storm"],
            map_df.loc[map_df["event"].isin(STORM_EVENTS), "px"],
            map_df.loc[map_df["event"].isin(STORM_EVENTS), "py"],
            grid_size,
        )

        add_to_heatmap(
            layers["loot"],
            map_df.loc[map_df["event"].isin(LOOT_EVENTS), "px"],
            map_df.loc[map_df["event"].isin(LOOT_EVENTS), "py"],
            grid_size,
        )

        output[str(map_id)] = {
            "map_id": str(map_id),
            "size": grid_size,
            "layers": {
                name: sparse_grid(grid)
                for name, grid in layers.items()
            },
            "max": {
                name: int(grid.max())
                for name, grid in layers.items()
            },
            "totals": {
                name: int(grid.sum())
                for name, grid in layers.items()
            },
        }

    return output