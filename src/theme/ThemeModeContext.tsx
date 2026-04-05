import { createContext, useContext, useState, useMemo } from 'react';

interface ThemeModeContextType {
  isDark: boolean;
  toggleMode: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextType>({
  isDark: false,
  toggleMode: () => {},
});

export const useThemeMode = () => useContext(ThemeModeContext);

export const ThemeModeProvider = ({ children }: React.PropsWithChildren) => {
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem('themeMode') === 'dark'
  );

  const toggleMode = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem('themeMode', next ? 'dark' : 'light');
      return next;
    });
  };

  const value = useMemo(() => ({ isDark, toggleMode }), [isDark]);

  return (
    <ThemeModeContext.Provider value={value}>
      {children}
    </ThemeModeContext.Provider>
  );
};
