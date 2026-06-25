import { EVENT_COLORS } from './mapConfig.js';

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

function drawMarker(ctx, x, y, size, color) {
  ctx.save();

  ctx.fillStyle = color;
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(x, y, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawCurrentPlayerDot(ctx, point, isBot) {
  const color = isBot ? '#fb7185' : '#67e8f9';
  const radius = isBot ? 6 : 7;

  ctx.save();

  ctx.fillStyle = color;
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.arc(point[0], point[1], radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.arc(point[0], point[1], radius + 8, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawPlayerPath(ctx, path, isBot) {
  if (!Array.isArray(path) || path.length < 2) return;

  const color = isBot ? '#fb7185' : '#67e8f9';

  ctx.save();

  ctx.strokeStyle = color;
  ctx.lineWidth = isBot ? 2 : 2.5;
  ctx.globalAlpha = isBot ? 0.72 : 0.9;
  ctx.setLineDash(isBot ? [8, 7] : []);

  ctx.beginPath();

  path.forEach(([x, y], index) => {
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();

  ctx.restore();
}

function drawPlayerEvents(ctx, events, currentTimeMs, eventVisibility) {
  if (!Array.isArray(events)) return;

  for (const event of events) {
    if (!eventVisibility[event.type]) continue;
    if (Number(event.t) > currentTimeMs) continue;

    const color = EVENT_COLORS[event.type] ?? '#e5e7eb';
    const size = event.type === 'Loot' ? 9 : 11;

    drawMarker(ctx, event.px, event.py, size, color);
  }
}

export function drawPlayers(ctx, players, options) {
  const {
    currentTimeMs,
    showPaths,
    eventVisibility,
  } = options;

  for (const player of players) {
    const path = Array.isArray(player.path) ? player.path : [];
    const visiblePath = getVisiblePath(path, currentTimeMs);
    const currentPoint = getCurrentPoint(path, currentTimeMs);
    const isBot = Boolean(player.is_bot);

    if (showPaths) {
      drawPlayerPath(ctx, visiblePath, isBot);
    }

    drawPlayerEvents(ctx, player.events, currentTimeMs, eventVisibility);

    if (currentPoint) {
      drawCurrentPlayerDot(ctx, currentPoint, isBot);
    }
  }
}