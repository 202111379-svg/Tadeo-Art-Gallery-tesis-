import { useState, useMemo } from 'react';

import { ThemeModeContext } from './theme-mode-context';

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
