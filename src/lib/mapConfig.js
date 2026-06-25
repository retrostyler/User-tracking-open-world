export const MAP_CONFIG = {
  AmbroseValley: {
    label: 'Ambrose Valley',
    scale: 900,
    originX: -370,
    originZ: -473,
    minimap: '/minimaps/AmbroseValley_Minimap.png',
  },
  GrandRift: {
    label: 'Grand Rift',
    scale: 581,
    originX: -290,
    originZ: -290,
    minimap: '/minimaps/GrandRift_Minimap.png',
  },
  Lockdown: {
    label: 'Lockdown',
    scale: 1000,
    originX: -500,
    originZ: -500,
    minimap: '/minimaps/Lockdown_Minimap.jpg',
  },
};

export const EVENT_GROUPS = {
  movement: ['Position', 'BotPosition'],
  kills: ['Kill', 'BotKill'],
  deaths: ['Killed', 'BotKilled'],
  storm: ['KilledByStorm'],
  loot: ['Loot'],
};

export const DISCRETE_EVENTS = [
  'Kill',
  'Killed',
  'BotKill',
  'BotKilled',
  'KilledByStorm',
  'Loot',
];

export const HEATMAP_LAYERS = [
  { value: 'none', label: 'None' },
  { value: 'traffic', label: 'Traffic' },
  { value: 'kills', label: 'Kills' },
  { value: 'deaths', label: 'Deaths' },
  { value: 'storm', label: 'Storm deaths' },
  { value: 'loot', label: 'Loot' },
];

export function formatDuration(ms = 0) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
