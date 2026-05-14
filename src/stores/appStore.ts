import { create } from 'zustand';
import { AppState, WeatherData, GeoLocation, AppIndex, OperationLog } from '../types';
import * as apiService from './api';
import { calculateAppIndex } from '../lib/calculations';

interface AppStore extends AppState {
  // Actions
  setLocation: (location: GeoLocation) => void;
  fetchWeatherData: (lat: number, lon: number) => Promise<void>;
  searchLocations: (query: string) => Promise<GeoLocation[]>;
  setOnlineStatus: (online: boolean) => void;
  clearError: () => void;
  logOperation: (operation: Omit<OperationLog, 'id' | 'timestamp'>) => void;
  getOperations: () => OperationLog[];
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  location: null,
  weather: null,
  appIndex: null,
  isLoading: false,
  error: null,
  isOnline: typeof navigator !== 'undefined' && navigator.onLine,
  operations: [],

  // Actions
  setLocation: (location) => set({ location }),

  fetchWeatherData: async (lat, lon) => {
    set({ isLoading: true, error: null });
    try {
      const weather = await apiService.fetchWeather(lat, lon);
      const appIndex = calculateAppIndex(weather);
      set({ weather, appIndex, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch weather',
        isLoading: false,
      });
    }
  },

  searchLocations: async (query: string) => {
    try {
      return await apiService.searchLocation(query);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Search failed' });
      return [];
    }
  },

  setOnlineStatus: (online) => set({ isOnline: online }),

  clearError: () => set({ error: null }),

  logOperation: (operation) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newOp: OperationLog = {
      ...operation,
      id,
      timestamp: new Date().toISOString(),
    };

    const { operations } = get();
    set({ operations: [...operations, newOp] });
  },

  getOperations: () => {
    const { operations } = get();
    return operations;
  },
}));

// Setup online/offline listener
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useAppStore.setState({ isOnline: true }));
  window.addEventListener('offline', () => useAppStore.setState({ isOnline: false }));
}
