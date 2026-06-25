import { formatDuration } from '../lib/mapConfig.js';

export function StatsPanel({ match, selectedMatchIndex, heatmap }) {
  if (!match) {
    return (
      <aside className="panel stats-panel empty-state">
        <h2>No match loaded</h2>
        <p>Choose a map/date/match from the left panel. After preprocessing, matches load on demand from static JSON.</p>
      </aside>
    );
  }

  const counts = match.meta.event_counts || {};
  const heatTotals = heatmap?.totals || {};

  return (
    <aside className="panel stats-panel">
      <div className="eyebrow">Selected match</div>
      <h2>{match.meta.map_id}</h2>
      <p className="mono small">{match.meta.match_key}</p>

      <div className="stats-list">
        <Row label="Date" value={match.meta.date ?? selectedMatchIndex?.date ?? '—'} />
        <Row label="Duration" value={formatDuration(match.meta.duration_ms)} />
        <Row label="Humans" value={match.meta.humans} />
        <Row label="Bots" value={match.meta.bots} />
        <Row label="Rows" value={match.meta.rows?.toLocaleString()} />
      </div>

      <h3>Events</h3>
      <div className="stats-list compact">
        <Row label="Human kills" value={counts.Kill ?? 0} />
        <Row label="Human deaths" value={counts.Killed ?? 0} />
        <Row label="Bot kills" value={counts.BotKill ?? 0} />
        <Row label="Bot-caused deaths" value={counts.BotKilled ?? 0} />
        <Row label="Storm deaths" value={counts.KilledByStorm ?? 0} />
        <Row label="Loot pickups" value={counts.Loot ?? 0} />
      </div>

      {heatmap && (
        <>
          <h3>Global map heatmap totals</h3>
          <div className="stats-list compact">
            <Row label="Traffic samples" value={(heatTotals.traffic ?? 0).toLocaleString()} />
            <Row label="Kill cells" value={(heatmap.layers?.kills?.length ?? 0).toLocaleString()} />
            <Row label="Death cells" value={(heatmap.layers?.deaths?.length ?? 0).toLocaleString()} />
            <Row label="Loot cells" value={(heatmap.layers?.loot?.length ?? 0).toLocaleString()} />
          </div>
        </>
      )}
    </aside>
  );
}

function Row({ label, value }) {
  return (
    <div className="stat-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
