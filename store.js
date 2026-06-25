import { create } from 'zustand';

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

  setSelectedMap: (selectedMap) => set({ selectedMap, selectedMatchId: null, currentTimeMs: 0, isPlaying: false }),
  setSelectedDate: (selectedDate) => set({ selectedDate, selectedMatchId: null, currentTimeMs: 0, isPlaying: false }),
  setSelectedMatchId: (selectedMatchId) => set({ selectedMatchId, currentTimeMs: 0, isPlaying: false }),
  setShowHumans: (showHumans) => set({ showHumans }),
  setShowBots: (showBots) => set({ showBots }),
  setShowPaths: (showPaths) => set({ showPaths }),
  setHeatmapLayer: (heatmapLayer) => set({ heatmapLayer }),
  setHeatmapOpacity: (heatmapOpacity) => set({ heatmapOpacity: Number(heatmapOpacity) }),
  setCurrentTimeMs: (currentTimeMs) => set({ currentTimeMs: Number(currentTimeMs) }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed: Number(playbackSpeed) }),
  toggleEvent: (eventType) =>
    set((state) => ({
      eventVisibility: {
        ...state.eventVisibility,
        [eventType]: !state.eventVisibility[eventType],
      },
    })),
}));
