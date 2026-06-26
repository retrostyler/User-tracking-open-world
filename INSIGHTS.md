# Insights

## 1. Ambrose Valley dominates the available telemetry

### What caught my eye

Most of the recorded activity is concentrated on Ambrose Valley. The generated summary shows 61,013 rows for Ambrose Valley out of 89,104 total rows, which is about 68.5% of the dataset. Lockdown has 21,238 rows, about 23.8%, while Grand Rift has only 6,853 rows, about 7.7%.

### Concrete pattern

```text
Ambrose Valley: 61,013 rows / 89,104 = 68.5%
Lockdown:       21,238 rows / 89,104 = 23.8%
Grand Rift:      6,853 rows / 89,104 =  7.7%
```

### Actionable takeaway

Yes. The map sample is not evenly distributed, so design conclusions should be weighted carefully. Ambrose Valley has enough data for confident flow and hotspot analysis, but Grand Rift needs more match coverage before making strong design calls.

### Metrics affected

- Map selection rate
- Match starts per map
- Median session duration per map
- Time-to-first-combat per map
- Loot pickup rate per map
- Death rate per map

### Action items

- Collect more Grand Rift sessions before comparing it against Ambrose Valley.
- Show a “sample size” warning in the UI when a map has low row or match coverage.
- Prioritize Ambrose Valley for immediate pathing/hotspot review because it has the strongest telemetry base.
- Compare future map balance using normalized metrics like events per match or events per minute, not raw event totals.

### Why a level designer should care

A designer might overfit to the best-instrumented map. If Ambrose Valley has most of the data, its hotspots are easier to trust, while Grand Rift may simply look quiet because it has less coverage.

---

## 2. Bot combat dominates the combat signal

### What caught my eye

The combat data is overwhelmingly bot-driven. The summary contains 2,415 `BotKill` events and 700 `BotKilled` events, compared with only 3 `Kill` and 3 `Killed` events for non-bot combat.

### Concrete pattern

```text
Bot combat events:   2,415 BotKill + 700 BotKilled = 3,115
Human combat events:     3 Kill +   3 Killed      =     6
Ratio: 3,115 / 6 ≈ 519x more bot combat events
```

### Actionable takeaway

Yes. The tool is especially useful for reviewing bot placement, patrol routes, encounter density, and bot difficulty. Human-vs-human conclusions are not yet reliable from this sample, but bot encounter design can be studied immediately.

### Metrics affected

- Bot kills per match
- Bot deaths per match
- Player survival time
- Time-to-first-combat
- Damage or death concentration near spawn/loot zones
- Early-session drop-off

### Action items

- Add a bot-only heatmap and a human-only heatmap toggle.
- Review whether bot kill locations cluster near spawn points, choke points, or high-value loot.
- Tune bot density or patrol radius in zones where bot kills repeatedly stack.
- Track “first bot encounter time” as a design metric.

### Why a level designer should care

Bots may be acting as the main source of pressure. If bot encounters are too early, too frequent, or clustered around mandatory routes, the level can feel unfair even when the layout itself is good.

---

## 3. Loot is a major routing signal, while storm deaths are rare

### What caught my eye

Loot appears frequently in the telemetry: 12,885 `Loot` events, about 14.5% of all recorded rows. Storm deaths are much rarer, with only 39 `KilledByStorm` events, about 0.04% of all rows.

### Concrete pattern

```text
Loot events:        12,885 / 89,104 = 14.5%
Storm death events:     39 / 89,104 = 0.04%
```

The median match duration is 382,000 ms, or about 6 minutes 22 seconds. That gives enough time for loot routes and mid-match movement patterns to matter, but storm pressure appears to be a smaller death driver in this sample.

### Actionable takeaway

Yes. Loot placement is likely one of the strongest levers for moving players through the map. Storm tuning may still matter, but the current data suggests designers should first compare loot hotspots against traffic and combat hotspots.

### Metrics affected

- Time-to-first-loot
- Loot pickups per minute
- Traffic density around loot clusters
- Deaths within N seconds after looting
- Storm death rate
- Route diversity

### Action items

- Overlay loot heatmap with traffic heatmap to see whether loot is creating healthy movement or over-concentrated routes.
- Move some loot away from overloaded zones if traffic and combat stack too tightly.
- Add a metric for “death within 30 seconds after loot” to detect baited or risky loot areas.
- Track whether storm deaths increase after map or circle timing changes.

### Why a level designer should care

Loot is not just a reward system; it shapes routes. If loot clusters create predictable movement, the level may develop repetitive paths, overloaded choke points, or dead zones that players rarely visit.
