import { DISCRETE_EVENTS, HEATMAP_LAYERS, MAP_CONFIG, formatDuration } from '../lib/mapConfig.js';
import { useAppStore } from '../store.js';

export function ControlPanel({ index, matches, dates, maps, selectedMatch }) {
  const {
    selectedMap,
    selectedDate,
    selectedMatchId,
    showHumans,
    showBots,
    showPaths,
    eventVisibility,
    heatmapLayer,
    heatmapOpacity,
    playbackSpeed,
    setSelectedMap,
    setSelectedDate,
    setSelectedMatchId,
    setShowHumans,
    setShowBots,
    setShowPaths,
    setHeatmapLayer,
    setHeatmapOpacity,
    setPlaybackSpeed,
    toggleEvent,
  } = useAppStore();

  const totalRows = index.reduce((sum, match) => sum + (match.rows || 0), 0);

  return (
    <aside className="panel controls">
      <div className="brand">
        <div className="eyebrow">LILA BLACK</div>
        <h1>Player Journey Visualizer</h1>
        <p>Replay matches, inspect player flow, and compare combat, death, loot, and traffic hotspots.</p>
      </div>

      <section className="control-section stats-grid">
        <Stat label="Matches" value={index.length.toLocaleString()} />
        <Stat label="Rows" value={totalRows.toLocaleString()} />
        <Stat label="Loaded" value={selectedMatch ? formatDuration(selectedMatch.duration_ms) : '—'} />
      </section>

      <section className="control-section">
        <h2>Filters</h2>
        <label>
          Map
          <select value={selectedMap} onChange={(e) => setSelectedMap(e.target.value)}>
            <option value="all">All maps</option>
            {maps.map((mapId) => (
              <option key={mapId} value={mapId}>{MAP_CONFIG[mapId]?.label ?? mapId}</option>
            ))}
          </select>
        </label>

        <label>
          Date
          <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
            <option value="all">All dates</option>
            {dates.map((date) => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>
        </label>

        <label>
          Match
          <select
            value={selectedMatchId ?? ''}
            onChange={(e) => setSelectedMatchId(e.target.value || null)}
          >
            <option value="">Select a match</option>
            {matches.map((match) => (
              <option key={match.match_id} value={match.match_id}>
                {match.date ?? 'unknown'} · {match.map_id} · {match.match_key.slice(0, 8)} · H{match.humans}/B{match.bots}
              </option>
            ))}
          </select>
        </label>

        {matches.length > 0 && !selectedMatchId && (
          <button className="secondary" type="button" onClick={() => setSelectedMatchId(matches[0].match_id)}>
            Load first filtered match
          </button>
        )}
      </section>

      <section className="control-section">
        <h2>Layers</h2>
        <label className="check"><input type="checkbox" checked={showPaths} onChange={(e) => setShowPaths(e.target.checked)} /> Player paths</label>
        <label className="check"><input type="checkbox" checked={showHumans} onChange={(e) => setShowHumans(e.target.checked)} /> Humans</label>
        <label className="check"><input type="checkbox" checked={showBots} onChange={(e) => setShowBots(e.target.checked)} /> Bots</label>

        <label>
          Heatmap
          <select value={heatmapLayer} onChange={(e) => setHeatmapLayer(e.target.value)}>
            {HEATMAP_LAYERS.map((layer) => (
              <option key={layer.value} value={layer.value}>{layer.label}</option>
            ))}
          </select>
        </label>

        {heatmapLayer !== 'none' && (
          <label>
            Heatmap opacity
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={heatmapOpacity}
              onChange={(e) => setHeatmapOpacity(e.target.value)}
            />
          </label>
        )}
      </section>

      <section className="control-section">
        <h2>Event markers</h2>
        <div className="event-grid">
          {DISCRETE_EVENTS.map((eventType) => (
            <button
              key={eventType}
              type="button"
              className={`event-toggle ${eventVisibility[eventType] ? 'on' : ''}`}
              onClick={() => toggleEvent(eventType)}
            >
              <span className={`dot ${eventType}`} />
              {eventType}
            </button>
          ))}
        </div>
      </section>

      <section className="control-section">
        <h2>Playback</h2>
        <label>
          Speed
          <select value={playbackSpeed} onChange={(e) => setPlaybackSpeed(e.target.value)}>
            <option value="0.5">0.5×</option>
            <option value="1">1×</option>
            <option value="2">2×</option>
            <option value="4">4×</option>
            <option value="8">8×</option>
          </select>
        </label>
      </section>
    </aside>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
