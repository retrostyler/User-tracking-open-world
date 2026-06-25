import { formatDuration } from '../lib/mapConfig.js';
import { useAppStore } from '../store.js';

export function Timeline({ match }) {
  const {
    currentTimeMs,
    isPlaying,
    setCurrentTimeMs,
    setIsPlaying,
  } = useAppStore();

  const duration = match?.meta?.duration_ms ?? 0;

  return (
    <div className="timeline panel">
      <button
        type="button"
        className="play"
        disabled={!match}
        onClick={() => setIsPlaying(!isPlaying)}
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <div className="time-readout">{formatDuration(currentTimeMs)} / {formatDuration(duration)}</div>
      <input
        aria-label="Match timeline"
        type="range"
        min="0"
        max={duration || 0}
        step="250"
        value={Math.min(currentTimeMs, duration || 0)}
        disabled={!match}
        onChange={(e) => setCurrentTimeMs(e.target.value)}
      />
    </div>
  );
}
