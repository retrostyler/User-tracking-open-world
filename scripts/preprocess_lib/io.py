from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pandas as pd
import pyarrow.parquet as pq

from .config import MONTH_LOOKUP, NAKAMA_SUFFIX, UUID_RE


@dataclass
class PreprocessStats:
    files_seen: int = 0
    files_read: int = 0
    files_failed: int = 0
    rows_read: int = 0
    out_of_bounds_rows: int = 0
    failed_files: list[dict[str, str]] | None = None

    def __post_init__(self) -> None:
        if self.failed_files is None:
            self.failed_files = []


def date_from_day_folder(folder_name: str) -> str | None:
    match = re.match(r"^([A-Za-z]+)_(\d{1,2})$", folder_name)

    if not match:
        return None

    month_name, day = match.groups()
    month = MONTH_LOOKUP.get(month_name)

    if not month:
        return None

    return f"2026-{month}-{int(day):02d}"


def is_human_user(user_id: str) -> bool:
    return bool(UUID_RE.match(str(user_id)))


def strip_nakama(match_id: str) -> str:
    return str(match_id).removesuffix(NAKAMA_SUFFIX)


def safe_match_filename(match_id: str) -> str:
    return strip_nakama(match_id).replace("/", "_").replace(".", "_") + ".json"


def decode_event(value: Any) -> str:
    if isinstance(value, bytes):
        return value.decode("utf-8")

    return str(value)


def find_journey_files(input_root: Path) -> list[Path]:
    return sorted(
        path
        for path in input_root.rglob("*.nakama-0")
        if path.is_file() and not path.name.startswith(".")
    )


def read_journey_file(path: Path, stats: PreprocessStats) -> pd.DataFrame | None:
    stats.files_seen += 1

    try:
        table = pq.read_table(path)
        df = table.to_pandas()

        required = {"user_id", "match_id", "map_id", "x", "y", "z", "ts", "event"}
        missing = sorted(required - set(df.columns))

        if missing:
            raise ValueError(f"Missing columns: {missing}")

        df = df.copy()
        df["event"] = df["event"].map(decode_event)
        df["source_file"] = path.name
        df["date"] = date_from_day_folder(path.parent.name)
        df["is_human"] = df["user_id"].astype(str).map(is_human_user)
        df["is_bot"] = ~df["is_human"]

        stats.files_read += 1
        stats.rows_read += len(df)

        return df

    except Exception as exc:
        stats.files_failed += 1

        assert stats.failed_files is not None
        stats.failed_files.append({"file": str(path), "error": str(exc)})

        return None


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    with path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, separators=(",", ":"))


def pretty_write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    with path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
        f.write("\n")