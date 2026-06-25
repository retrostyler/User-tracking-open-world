from __future__ import annotations

import math
from collections import Counter
from typing import Any

import pandas as pd

from .config import ALL_EVENTS, MOVEMENT_EVENTS
from .io import safe_match_filename, strip_nakama


def downsample_path(points: list[list[float | int]], max_points: int) -> list[list[float | int]]:
    if len(points) <= max_points:
        return points

    step = math.ceil(len(points) / max_points)
    return points[::step]


def event_counter_dict(series: pd.Series) -> dict[str, int]:
    counts = Counter(series.tolist())

    return {
        event: int(counts.get(event, 0))
        for event in ALL_EVENTS
        if counts.get(event, 0)
    }


def compact_event(row: pd.Series) -> dict[str, Any]:
    return {
        "type": row["event"],
        "px": float(row["px"]),
        "py": float(row["py"]),
        "t": int(row["ts_rel_ms"]),
        "x": round(float(row["x"]), 2),
        "z": round(float(row["z"]), 2),
        "user_id": str(row["user_id"]),
        "is_bot": bool(row["is_bot"]),
    }


def build_match_payload(
    match_id: str,
    match_df: pd.DataFrame,
    max_path_points: int,
) -> dict[str, Any]:
    match_df = match_df.sort_values(["ts_rel_ms", "user_id", "event"])

    map_id = str(match_df["map_id"].value_counts().index[0])

    date_counts = match_df["date"].dropna().value_counts()
    date = str(date_counts.index[0]) if not date_counts.empty else None

    duration_ms = int(match_df["ts_rel_ms"].max()) if len(match_df) else 0

    players: list[dict[str, Any]] = []

    for user_id, player_df in match_df.groupby("user_id", sort=True):
        movement_df = player_df[player_df["event"].isin(MOVEMENT_EVENTS)].sort_values("ts_rel_ms")

        path_points = [
            [float(row.px), float(row.py), int(row.ts_rel_ms)]
            for row in movement_df[["px", "py", "ts_rel_ms"]].itertuples(index=False)
        ]

        path_points = downsample_path(path_points, max_path_points)

        discrete_df = player_df[~player_df["event"].isin(MOVEMENT_EVENTS)].sort_values("ts_rel_ms")
        event_items = [compact_event(row) for _, row in discrete_df.iterrows()]

        is_bot = bool(player_df["is_bot"].iloc[0])

        players.append(
            {
                "user_id": str(user_id),
                "is_bot": is_bot,
                "is_human": not is_bot,
                "path": path_points,
                "events": event_items,
                "event_counts": event_counter_dict(player_df["event"]),
            }
        )

    timeline_df = match_df[~match_df["event"].isin(MOVEMENT_EVENTS)].sort_values("ts_rel_ms")

    return {
        "meta": {
            "match_id": match_id,
            "match_key": strip_nakama(match_id),
            "map_id": map_id,
            "date": date,
            "duration_ms": duration_ms,
            "humans": int((match_df.groupby("user_id")["is_human"].first()).sum()),
            "bots": int((match_df.groupby("user_id")["is_bot"].first()).sum()),
            "rows": int(len(match_df)),
            "event_counts": event_counter_dict(match_df["event"]),
        },
        "players": players,
        "timeline": [compact_event(row) for _, row in timeline_df.iterrows()],
    }


def build_index(df: pd.DataFrame) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []

    for match_id, match_df in df.groupby("match_id", sort=True):
        players = match_df.groupby("user_id")[["is_human", "is_bot"]].first()

        map_id = str(match_df["map_id"].value_counts().index[0])

        date_counts = match_df["date"].dropna().value_counts()
        date = str(date_counts.index[0]) if not date_counts.empty else None

        event_counts = event_counter_dict(match_df["event"])

        rows.append(
            {
                "match_id": str(match_id),
                "match_key": strip_nakama(str(match_id)),
                "data_file": safe_match_filename(str(match_id)),
                "map_id": map_id,
                "date": date,
                "duration_ms": int(match_df["ts_rel_ms"].max()),
                "rows": int(len(match_df)),
                "humans": int(players["is_human"].sum()),
                "bots": int(players["is_bot"].sum()),
                "event_counts": event_counts,
            }
        )

    return sorted(rows, key=lambda row: (row["date"] or "", row["map_id"], row["match_key"]))