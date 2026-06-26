# Architecture

## What I built

This project is a static telemetry visualizer for LILA BLACK match data. I used a Python preprocessing step and a React/Vite frontend because the expensive work is data normalization, coordinate mapping, and aggregation, while the UI only needs to replay already-shaped JSON quickly.

- **Python + pandas/pyarrow/numpy**: reads the raw parquet-like `.nakama-0` files, normalizes timestamps, maps world coordinates to minimap pixels, and writes compact JSON.
- **React + Vite**: gives a lightweight local app for fast iteration and easy static deployment.
- **Zustand**: keeps playback, filter, layer, and visibility state simple without a large state framework.
- **Canvas**: draws many paths, heatmap cells, markers, and moving players more efficiently than DOM/SVG for this use case.

## Data flow

```text
player_data/**/*.nakama-0
        ↓
scripts/preprocess.py
        ↓
read parquet files → normalize fields → convert timestamps → compute relative match time
        ↓
world coordinates x/z → minimap pixels px/py
        ↓
public/data/index.json
public/data/summary.json
public/data/matches/<match>.json
public/data/heatmaps/<map>.json
        ↓
React app fetches static JSON from /data
        ↓
Zustand stores selected map/date/match, playback time, layer toggles
        ↓
MapCanvas draws minimap, heatmap, visible paths, current player positions, and event markers
```

## Coordinate mapping approach

The tricky part is converting game-space positions into 1024×1024 minimap pixels. Each map has a calibration config:

```js
{
  scale,
  originX,
  originZ,
  minimap
}
```

For each telemetry row, I normalize the world position into map-relative coordinates:

```text
u = (x - originX) / scale
v = (z - originZ) / scale
```

Then I convert that normalized position to image pixels:

```text
px = u * 1024
py = (1 - v) * 1024
```

The `1 - v` flip is needed because game `z` increases upward in the world, while canvas/image `y` increases downward from the top-left corner. After conversion, I clip points to the minimap boundary and track out-of-bounds rows in the preprocessing summary. I also kept a known Ambrose Valley calibration check in the pipeline so the formula fails loudly if the mapping is accidentally changed.

## Assumptions and ambiguous data handling

- The raw files are treated as parquet data even though the filenames use the `.nakama-0` suffix.
- Numeric match-relative timestamps appeared to be in seconds, so the pipeline scales them to milliseconds for smooth playback.
- The minimap coordinate configs are manually calibrated per map. This is explicit and easy to audit, but it assumes the minimap image and world bounds stay stable.
- Unknown map IDs are treated as errors instead of silently drawing incorrect positions.
- Out-of-bounds coordinates are clipped rather than dropped so a match remains replayable, while the summary still reports how often this happened.
- Bot and human behavior are separated using event/user metadata and exposed as independent toggles in the UI.

## Major tradeoffs

| Decision | Alternatives considered | Why I chose it |
|---|---|---|
| Preprocess to static JSON | Query parquet directly in the browser or run a backend API | Static JSON keeps the demo easy to run, deploy, and review. |
| Canvas rendering | SVG or DOM elements | Canvas handles dense paths, heatmaps, and animated markers with less overhead. |
| Manual map calibration | Infer map bounds automatically | Manual config is more predictable and easier to verify with known coordinate checks. |
| Precomputed heatmaps | Compute heatmaps live in React | Precomputation keeps the frontend responsive. |
| Clip out-of-bounds points | Drop rows or fail the whole match | Clipping preserves replay continuity while still reporting data quality issues. |
| Single-page app | Multi-page analytics dashboard | The core task is inspection and replay, so one focused workspace is faster to use. |
