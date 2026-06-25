import { useEffect, useMemo, useState } from 'react';
import { ControlPanel } from './components/ControlPanel.jsx';
import { MapCanvas } from './components/MapCanvas.jsx';
import { StatsPanel } from './components/StatsPanel.jsx';
import { Timeline } from './components/Timeline.jsx';
import { fetchJson, filterMatches, getAvailableDates, getAvailableMaps } from './lib/dataApi.js';
import { useAppStore } from './store.js';

export default function App() {
  const [index, setIndex] = useState([]);
  const [summary, setSummary] = useState(null);
  const [match, setMatch] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [status, setStatus] = useState({ loading: true, error: null });

  const {
    selectedMap,
    selectedDate,
    selectedMatchId,
    isPlaying,
    playbackSpeed,
    setCurrentTimeMs,
    setIsPlaying,
  } = useAppStore();

  useEffect(() => {
    let cancelled = false;

    async function loadIndex() {
      try {
        setStatus({ loading: true, error: null });

        const [indexData, summaryData] = await Promise.all([
          fetchJson('/data/index.json'),
          fetchJson('/data/summary.json').catch(() => null),
        ]);

        if (!cancelled) {
          setIndex(indexData);
          setSummary(summaryData);
          setStatus({ loading: false, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setStatus({ loading: false, error: error.message });
        }
      }
    }

    loadIndex();

    return () => {
      cancelled = true;
    };
  }, []);

  const dates = useMemo(() => getAvailableDates(index), [index]);
  const maps = useMemo(() => getAvailableMaps(index), [index]);

  const filteredMatches = useMemo(
    () => filterMatches(index, { mapId: selectedMap, date: selectedDate }),
    [index, selectedMap, selectedDate],
  );

  const selectedMatchIndex = useMemo(
    () => index.find((item) => item.match_id === selectedMatchId) ?? null,
    [index, selectedMatchId],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadMatch() {
      if (!selectedMatchIndex) {
        setMatch(null);
        return;
      }

      try {
        setStatus((prev) => ({ ...prev, error: null }));

        const payload = await fetchJson(`/data/matches/${selectedMatchIndex.data_file}`);

        if (!cancelled) {
          setMatch(payload);
          setCurrentTimeMs(0);
          setIsPlaying(false);
        }
      } catch (error) {
        if (!cancelled) {
          setMatch(null);
          setStatus((prev) => ({ ...prev, error: error.message }));
        }
      }
    }

    loadMatch();

    return () => {
      cancelled = true;
    };
  }, [selectedMatchIndex, setCurrentTimeMs, setIsPlaying]);

  const activeMapId = match?.meta?.map_id ?? (selectedMap !== 'all' ? selectedMap : maps[0]);

  useEffect(() => {
    let cancelled = false;

    async function loadHeatmap() {
      if (!activeMapId) {
        setHeatmap(null);
        return;
      }

      try {
        const payload = await fetchJson(`/data/heatmaps/${activeMapId}.json`);
        if (!cancelled) {
          setHeatmap(payload);
        }
      } catch {
        if (!cancelled) {
          setHeatmap(null);
        }
      }
    }

    loadHeatmap();

    return () => {
      cancelled = true;
    };
  }, [activeMapId]);

  useEffect(() => {
    if (!isPlaying || !match) {
      return undefined;
    }

    let rafId;
    let last = performance.now();
    const duration = Number(match.meta.duration_ms) || 0;

    function tick(now) {
      const delta = now - last;
      last = now;

      const current = useAppStore.getState().currentTimeMs;
      const next = Math.min(duration, current + delta * playbackSpeed);

      setCurrentTimeMs(next);

      if (next >= duration) {
        setIsPlaying(false);
        return;
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [isPlaying, match, playbackSpeed, setCurrentTimeMs, setIsPlaying]);

  return (
    <div className="app-shell">
      <ControlPanel
        index={index}
        matches={filteredMatches}
        dates={dates}
        maps={maps}
        selectedMatch={selectedMatchIndex}
      />

      <main className="workspace">
        {status.error && <div className="notice error">{status.error}</div>}

        {status.loading && <div className="notice">Loading generated data…</div>}

        {!status.loading && index.length === 0 && (
          <div className="notice warn">
            No generated data yet. Run{' '}
            <code>
              python scripts/preprocess.py --input-root player_data --output-root public/data --timestamp-unit ms
            </code>
            .
          </div>
        )}

        <MapCanvas match={match} fallbackMapId={activeMapId} heatmap={heatmap} />
        <Timeline match={match} />
      </main>

      <StatsPanel match={match} selectedMatchIndex={selectedMatchIndex} heatmap={heatmap} />
    </div>
  );
}