import { drawHeatmap } from './drawHeatmap.js';
import { drawPlayers } from './drawPlayers.js';
import { IMAGE_SIZE } from './mapConfig.js';

export function drawScene({
  canvas,
  image,
  imageReady,
  view,
  players,
  currentTimeMs,
  showPaths,
  eventVisibility,
  heatmap,
  heatmapLayer,
  heatmapOpacity,
}) {
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

  drawPlayers(ctx, players, {
    currentTimeMs,
    showPaths,
    eventVisibility,
  });

  ctx.restore();
}