from __future__ import annotations

import re

IMAGE_SIZE = 1024
GRID_SIZE = 256
NAKAMA_SUFFIX = ".nakama-0"

TIMESTAMP_UNITS = ("auto", "ms", "s", "us", "ns")

TIMESTAMP_UNIT_TO_MS_FACTOR = {
    "s": 1000.0,
    "ms": 1.0,
    "us": 1 / 1_000.0,
    "ns": 1 / 1_000_000.0,
}

MAP_CONFIG: dict[str, dict[str, float | str]] = {
    "AmbroseValley": {
        "scale": 900,
        "origin_x": -370,
        "origin_z": -473,
        "minimap": "AmbroseValley_Minimap.png",
    },
    "GrandRift": {
        "scale": 581,
        "origin_x": -290,
        "origin_z": -290,
        "minimap": "GrandRift_Minimap.png",
    },
    "Lockdown": {
        "scale": 1000,
        "origin_x": -500,
        "origin_z": -500,
        "minimap": "Lockdown_Minimap.jpg",
    },
}

MOVEMENT_EVENTS = {"Position", "BotPosition"}
KILL_EVENTS = {"Kill", "BotKill"}
DEATH_EVENTS = {"Killed", "BotKilled", "KilledByStorm"}
STORM_EVENTS = {"KilledByStorm"}
LOOT_EVENTS = {"Loot"}

ALL_EVENTS = sorted(
    MOVEMENT_EVENTS
    | KILL_EVENTS
    | DEATH_EVENTS
    | STORM_EVENTS
    | LOOT_EVENTS
)

UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    re.IGNORECASE,
)

MONTH_LOOKUP = {
    "January": "01",
    "February": "02",
    "March": "03",
    "April": "04",
    "May": "05",
    "June": "06",
    "July": "07",
    "August": "08",
    "September": "09",
    "October": "10",
    "November": "11",
    "December": "12",
}