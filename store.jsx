import { create } from 'zustand';

const finiteNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const defaultEventVisibility = {
  Kill: true,
  Killed: true,
  BotKill: true,
  BotKilled: true,
  KilledByStorm: true,
  Loot: true,
};

export const useAppStore = create((set) => ({
  selectedMap: 'all',
  selectedDate: 'all',
  selectedMatchId: null,
  showHumans: true,
  showBots: true,
  showPaths: true,
  eventVisibility: defaultEventVisibility,
  heatmapLayer: 'none',
  heatmapOpacity: 0.55,
  currentTimeMs: 0,
  isPlaying: false,
  playbackSpeed: 1,

  setSelectedMap: (selectedMap) =>
    set({
      selectedMap,
      selectedMatchId: null,
      currentTimeMs: 0,
      isPlaying: false,
    }),

  setSelectedDate: (selectedDate) =>
    set({
      selectedDate,
      selectedMatchId: null,
      currentTimeMs: 0,
      isPlaying: false,
    }),

  setSelectedMatchId: (selectedMatchId) =>
    set({
      selectedMatchId,
      currentTimeMs: 0,
      isPlaying: false,
    }),

  setShowHumans: (showHumans) => set({ showHumans: Boolean(showHumans) }),
  setShowBots: (showBots) => set({ showBots: Boolean(showBots) }),
  setShowPaths: (showPaths) => set({ showPaths: Boolean(showPaths) }),

  setHeatmapLayer: (heatmapLayer) => set({ heatmapLayer }),

  setHeatmapOpacity: (heatmapOpacity) =>
    set({
      heatmapOpacity: Math.min(1, Math.max(0, finiteNumber(heatmapOpacity, 0.55))),
    }),

  setCurrentTimeMs: (currentTimeMs) =>
    set({
      currentTimeMs: Math.max(0, finiteNumber(currentTimeMs, 0)),
    }),

  setIsPlaying: (isPlaying) =>
    set({
      isPlaying: Boolean(isPlaying),
    }),

  setPlaybackSpeed: (playbackSpeed) =>
    set({
      playbackSpeed: Math.max(0.25, finiteNumber(playbackSpeed, 1)),
    }),

  toggleEvent: (eventType) =>
    set((state) => ({
      eventVisibility: {
        ...state.eventVisibility,
        [eventType]: !state.eventVisibility[eventType],
      },
    })),
}));