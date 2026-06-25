import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../store.js';

const IMAGE_SIZE = 1024;

const MAPS = {
  AmbroseValley: {
    label: 'Ambrose Valley',
    minimap: '/minimaps/AmbroseValley_Minimap.png',
  },
  GrandRift: {
    label: 'Grand Rift',
    minimap: '/minimaps/GrandRift_Minimap.png',
  },
  Lockdown: {
    label: 'Lockdown',
    minimap: '/minimaps/Lockdown_Minimap.jpg',
  },
};

const EVENT_COLORS = {
  Kill: '#f97316',
  BotKill: '#f97316',
  Killed: '#ef4444',
  BotKilled: '#ef4444',
  KilledByStorm: '#a855f7',
  Loot: '#22c55e',
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getVisiblePath(path, currentTimeMs) {
  if (!Array.isArray(path) || path.length === 0) return [];
  return path.filter((point) => Number(point[2]) <= currentTimeMs);
}

function getCurrentPoint(path, currentTimeMs) {
  if (!Array.isArray(path) || path.length === 0) return null;

  let current = path[0];

  for (const point of path) {
    if (Number(point[2]) <= currentTimeMs) {
      current = point;
    } else {
      break;
    }
  }

  return current;
}

function drawRoundedMarker(ctx, x, y, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - size / 2, y - size / 2, size, size, 3);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawHeatmap(ctx, heatmap, layerName, opacity) {
  if (!heatmap || !heatmap.layers || layerName === 'none') return;

  const cells = heatmap.layers[layerName] ?? [];
  const maxValue = heatmap.max?.[layerName] || 1;
  const gridSize = heatmap.size || 256;
  const cellSize = IMAGE_SIZE / gridSize;

  ctx.save();
  ctx.globalAlpha = opacity;

  for (const [gx, gy, value] of cells) {
    const intensity = Math.min(1, value / maxValue);
    ctx.fillStyle = `rgba(56, 189, 248, ${0.12 + intensity * 0.55})`;
    ctx.fillRect(gx * cellSize, gy * cellSize, cellSize, cellSize);
  }

  ctx.restore();
}

export function MapCanvas({ match, fallbackMapId, heatmap }) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const dragRef = useRef(null);

  const [imageReady, setImageReady] = useState(false);
  const [view, setView] = useState({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });

  const {
    currentTimeMs,
    showHumans,
    showBots,
    showPaths,
    eventVisibility,
    heatmapLayer,
    heatmapOpacity,
  } = useAppStore();

  const mapId = match?.meta?.map_id ?? fallbackMapId;
  const map = MAPS[mapId];

  const mapLabel = map?.label ?? mapId ?? 'Map';

  useEffect(() => {
    setView({
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    });
  }, [mapId, match?.meta?.match_id]);

  useEffect(() => {
    if (!map?.minimap) {
      imageRef.current = null;
      setImageReady(false);
      return;
    }

    const image = new Image();
    image.src = map.minimap;

    image.onload = () => {
      imageRef.current = image;
      setImageReady(true);
    };

    image.onerror = () => {
      imageRef.current = null;
      setImageReady(false);
    };
  }, [map?.minimap]);

  const visiblePlayers = useMemo(() => {
    if (!match?.players) return [];

    return match.players.filter((player) => {
      if (player.is_bot) return showBots;
      return showHumans;
    });
  }, [match, showHumans, showBots]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;

    if (!canvas) return;

    const parent = canvas.parentElement;
    const size = parent?.clientWidth || IMAGE_SIZE;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    ctx.save();

    const baseScale = size / IMAGE_SIZE;
    ctx.translate(size / 2, size / 2);
    ctx.scale(view.scale, view.scale);
    ctx.translate(-size / 2 + view.offsetX, -size / 2 + view.offsetY);
    ctx.scale(baseScale, baseScale);

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, IMAGE_SIZE, IMAGE_SIZE);

    if (image && imageReady) {
      ctx.drawImage(image, 0, 0, IMAGE_SIZE, IMAGE_SIZE);
    } else {
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, IMAGE_SIZE, IMAGE_SIZE);
    }

    drawHeatmap(ctx, heatmap, heatmapLayer, heatmapOpacity);

    for (const player of visiblePlayers) {
      const path = Array.isArray(player.path) ? player.path : [];
      const visiblePath = getVisiblePath(path, currentTimeMs);
      const currentPoint = getCurrentPoint(path, currentTimeMs);

      const isBot = Boolean(player.is_bot);
      const lineColor = isBot ? '#fb7185' : '#67e8f9';

      if (showPaths && visiblePath.length > 1) {
        ctx.save();
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = isBot ? 2 : 2.5;
        ctx.globalAlpha = isBot ? 0.75 : 0.9;
        ctx.setLineDash(isBot ? [8, 7] : []);
        ctx.beginPath();

        visiblePath.forEach(([x, y], index) => {
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });

        ctx.stroke();
        ctx.restore();
      }

      if (currentPoint) {
        ctx.save();
        ctx.fillStyle = lineColor;
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(currentPoint[0], currentPoint[1], isBot ? 6 : 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = lineColor;
        ctx.globalAlpha = 0.25;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(currentPoint[0], currentPoint[1], isBot ? 12 : 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      const events = Array.isArray(player.events) ? player.events : [];

      for (const event of events) {
        if (!eventVisibility[event.type]) continue;
        if (Number(event.t) > currentTimeMs) continue;

        const color = EVENT_COLORS[event.type] ?? '#e5e7eb';
        const size = event.type === 'Loot' ? 10 : 9;

        drawRoundedMarker(ctx, event.px, event.py, size, color);
      }
    }

    ctx.restore();
  }, [
    match,
    visiblePlayers,
    currentTimeMs,
    showPaths,
    eventVisibility,
    heatmap,
    heatmapLayer,
    heatmapOpacity,
    view,
    imageReady,
  ]);

  function zoomBy(delta) {
    setView((current) => ({
      ...current,
      scale: clamp(current.scale + delta, 1, 5),
    }));
  }

  function resetZoom() {
    setView({
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    });
  }

  function handleWheel(event) {
    event.preventDefault();

    const delta = event.deltaY > 0 ? -0.18 : 0.18;

    setView((current) => ({
      ...current,
      scale: clamp(current.scale + delta, 1, 5),
    }));
  }

  function handlePointerDown(event) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(event.pointerId);

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: view.offsetX,
      offsetY: view.offsetY,
    };
  }

  function handlePointerMove(event) {
    if (!dragRef.current) return;

    const dx = (event.clientX - dragRef.current.startX) / view.scale;
    const dy = (event.clientY - dragRef.current.startY) / view.scale;

    setView((current) => ({
      ...current,
      offsetX: dragRef.current.offsetX + dx,
      offsetY: dragRef.current.offsetY + dy,
    }));
  }

  function handlePointerUp(event) {
    const canvas = canvasRef.current;

    if (canvas && dragRef.current?.pointerId === event.pointerId) {
      canvas.releasePointerCapture(event.pointerId);
    }

    dragRef.current = null;
  }

  return (
    <section className="panel map-shell">
      <div className="map-header">
        <div>
          <div className="eyebrow">Minimap</div>
          <h2>{mapLabel}</h2>
        </div>

        <div className="legend">
          <span><i className="human-line" /> Human</span>
          <span><i className="bot-line" /> Bot</span>
          <span><i className="marker kill" /> Kill</span>
          <span><i className="marker death" /> Death</span>
          <span><i className="marker loot" /> Loot</span>
          <span><i className="marker storm" /> Storm</span>
        </div>
      </div>

      <div className="map-toolbar">
        <button type="button" className="zoom-button" onClick={() => zoomBy(-0.35)}>
          −
        </button>
        <span className="zoom-readout">{Math.round(view.scale * 100)}%</span>
        <button type="button" className="zoom-button" onClick={() => zoomBy(0.35)}>
          +
        </button>
        <button type="button" className="zoom-reset" onClick={resetZoom}>
          Reset
        </button>
      </div>

      <div className="canvas-wrap">
        <canvas
          ref={canvasRef}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />

        {!match && (
          <div className="canvas-message">
            Select a match to inspect player movement.
          </div>
        )}

        {match && Number(match.meta?.duration_ms) < 1000 && (
          <div className="canvas-message warn">
            This match duration is under 1 second. Re-run preprocessing with the correct timestamp unit.
          </div>
        )}
      </div>
    </section>
  );
}