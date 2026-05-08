import { createContext, useContext } from 'react';

export interface ThemeModeContextType {
  isDark: boolean;
  toggleMode: () => void;
}

export const ThemeModeContext = createContext<ThemeModeContextType>({
  isDark: false,
  toggleMode: () => {},
});

export const useThemeMode = () => useContext(ThemeModeContext);
