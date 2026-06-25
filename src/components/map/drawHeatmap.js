import { IMAGE_SIZE } from './mapConfig.js';

export function drawHeatmap(ctx, heatmap, layerName, opacity) {
  if (!heatmap || !heatmap.layers || layerName === 'none') return;

  const cells = heatmap.layers[layerName] ?? [];
  const maxValue = heatmap.max?.[layerName] || 1;
  const gridSize = heatmap.size || 256;
  const cellSize = IMAGE_SIZE / gridSize;

  ctx.save();
  ctx.globalAlpha = opacity;

  for (const [gridX, gridY, value] of cells) {
    const intensity = Math.min(1, value / maxValue);

    ctx.fillStyle = `rgba(56, 189, 248, ${0.12 + intensity * 0.55})`;
    ctx.fillRect(
      gridX * cellSize,
      gridY * cellSize,
      cellSize,
      cellSize,
    );
  }

  ctx.restore();
}