#  Player Journey Visualizer

A React + Python tool to preprocess LILA BLACK player telemetry and replay player/bot movement, combat, deaths, loot events, and heatmaps on game minimaps.

## Check it out on; 
- User_tracker(https://user-tracking-open-world.netlify.app/)

## Features
- Match replay timeline
- Human vs bot filtering
- Kill/death/loot/storm markers
- Map heatmaps
- Python parquet preprocessing pipeline

## Setup

```bash
npm install
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python scripts/preprocess.py --input-root player_data --output-root public/data --timestamp-unit ms
npm run dev
