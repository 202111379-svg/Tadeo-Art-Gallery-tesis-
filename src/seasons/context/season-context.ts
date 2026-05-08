import { createContext, useContext } from 'react';

import type { Season } from '../types/season';

export interface SeasonContextType {
  activeSeason: Season | null;
  seasons: Season[];
  isLoading: boolean;
  errorMessage: string | null;
  clearError: () => void;
  createSeason: (name: string, description?: string) => Promise<void>;
  closeSeason: () => Promise<void>;
}

export const SeasonContext = createContext<SeasonContextType>({
  activeSeason: null,
  seasons: [],
  isLoading: true,
  errorMessage: null,
  clearError: () => {},
  createSeason: async () => {},
  closeSeason: async () => {},
});

export const useSeasonContext = () => useContext(SeasonContext);
