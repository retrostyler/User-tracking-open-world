from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from .timeline import add_relative_match_time

import pandas as pd

from .builders import build_index, build_match_payload
from .config import GRID_SIZE, TIMESTAMP_UNITS
from .coordinates import validate_coordinate_formula, world_to_pixel_arrays
from .heatmaps import build_heatmaps
from .io import (
    PreprocessStats,
    find_journey_files,
    pretty_write_json,
    read_journey_file,
    safe_match_filename,
    write_json,
)
from .timestamps import timestamp_to_ms


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Preprocess LILA BLACK player telemetry")

    parser.add_argument(
        "--input-root",
        default="player_data",
        help="Path to raw player_data folder.",
    )

    parser.add_argument(
        "--output-root",
        default="public/data",
        help="Where generated JSON assets should be written.",
    )

    parser.add_argument(
        "--grid-size",
        type=int,
        default=GRID_SIZE,
        help="Heatmap grid resolution per axis.",
    )

    parser.add_argument(
        "--max-path-points-per-player",
        type=int,
        default=2500,
        help="Safety cap for movement samples per player per match.",
    )

    parser.add_argument(
        "--timestamp-unit",
        choices=TIMESTAMP_UNITS,
        default="auto",
        help="Unit for numeric ts values. Parquet timestamp(ms) is auto-detected safely.",
    )

    return parser.parse_args()


def load_all_data(input_root: Path, stats: PreprocessStats) -> pd.DataFrame:
    files = find_journey_files(input_root)

    if not files:
        raise FileNotFoundError(f"No .nakama-0 files found under {input_root}")

    frames: list[pd.DataFrame] = []

    for path in files:
        frame = read_journey_file(path, stats)

        if frame is not None and len(frame):
            frames.append(frame)

    if not frames:
        raise RuntimeError("No readable parquet files were found.")

    return pd.concat(frames, ignore_index=True)


def prepare_dataframe(
    df: pd.DataFrame,
    timestamp_unit: str,
    stats: PreprocessStats,
) -> tuple[pd.DataFrame, str]:
    df = df.copy()

    df["user_id"] = df["user_id"].astype(str)
    df["match_id"] = df["match_id"].astype(str)
    df["map_id"] = df["map_id"].astype(str)

    df["ts_ms"], timestamp_unit_used = timestamp_to_ms(df["ts"], timestamp_unit)

    df, timeline_scale_mode, duration_summary = add_relative_match_time(df)

    df.attrs["timeline_scale_mode"] = timeline_scale_mode
    df.attrs["duration_summary"] = duration_summary

    df["px"], df["py"], df["coord_oob"] = world_to_pixel_arrays(df)

    stats.out_of_bounds_rows = int(df["coord_oob"].sum())

    return df, timestamp_unit_used


def clear_generated_json(output_root: Path) -> None:
    for subdir in (output_root / "matches", output_root / "heatmaps"):
        subdir.mkdir(parents=True, exist_ok=True)

        for old_file in subdir.glob("*.json"):
            old_file.unlink()


def write_outputs(
    df: pd.DataFrame,
    output_root: Path,
    grid_size: int,
    max_path_points_per_player: int,
) -> list[dict]:
    clear_generated_json(output_root)

    index = build_index(df)
    write_json(output_root / "index.json", index)

    for match_id, match_df in df.groupby("match_id", sort=True):
        payload = build_match_payload(
            str(match_id),
            match_df,
            max_path_points_per_player,
        )

        write_json(
            output_root / "matches" / safe_match_filename(str(match_id)),
            payload,
        )

    heatmaps = build_heatmaps(df, grid_size)

    for map_id, payload in heatmaps.items():
        write_json(output_root / "heatmaps" / f"{map_id}.json", payload)

    return index


def build_summary(
    df: pd.DataFrame,
    index: list[dict],
    stats: PreprocessStats,
    input_root: Path,
    output_root: Path,
    timestamp_unit_requested: str,
    timestamp_unit_used: str,
) -> dict:
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "input_root": str(input_root),
        "output_root": str(output_root),
        "timestamp_unit_requested": timestamp_unit_requested,
        "timestamp_unit_used": timestamp_unit_used,
        "files_seen": stats.files_seen,
        "files_read": stats.files_read,
        "files_failed": stats.files_failed,
        "rows_read": stats.rows_read,
        "rows_written": int(len(df)),
        "out_of_bounds_rows": stats.out_of_bounds_rows,
        "unique_players": int(df["user_id"].nunique()),
        "unique_matches": int(df["match_id"].nunique()),
        "maps": sorted(df["map_id"].unique().tolist()),
        "rows_by_map": {
            str(k): int(v)
            for k, v in df["map_id"].value_counts().sort_index().items()
        },
        "rows_by_event": {
            str(k): int(v)
            for k, v in df["event"].value_counts().sort_index().items()
        },
        "matches_by_date": {
            str(k): int(v)
            for k, v in pd.Series({row["match_id"]: row["date"] for row in index})
            .value_counts()
            .sort_index()
            .items()
        },
        "timeline_scale_mode": df.attrs.get("timeline_scale_mode"),
        "duration_ms": {
            "min": int(df.groupby("match_id")["ts_rel_ms"].max().min()),
            "median": int(df.groupby("match_id")["ts_rel_ms"].max().median()),
            "max": int(df.groupby("match_id")["ts_rel_ms"].max().max()),
        },
        "duration_debug": df.attrs.get("duration_summary"),
        "failed_files": stats.failed_files[:50],
    }


def main() -> int:
    args = parse_args()

    input_root = Path(args.input_root)
    output_root = Path(args.output_root)

    stats = PreprocessStats()

    try:
        validate_coordinate_formula()

        if not input_root.exists():
            print(f"Input root not found: {input_root}", file=sys.stderr)
            return 1

        raw_df = load_all_data(input_root, stats)

        df, timestamp_unit_used = prepare_dataframe(
            raw_df,
            args.timestamp_unit,
            stats,
        )

        index = write_outputs(
            df,
            output_root,
            args.grid_size,
            args.max_path_points_per_player,
        )

        summary = build_summary(
            df,
            index,
            stats,
            input_root,
            output_root,
            args.timestamp_unit,
            timestamp_unit_used,
        )

        pretty_write_json(output_root / "summary.json", summary)

        print(json.dumps(summary, indent=2))

        return 0

    except Exception as exc:
        print(f"Preprocessing failed: {exc}", file=sys.stderr)
        return 1