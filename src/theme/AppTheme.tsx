import { useMemo } from 'react';
import { ThemeProvider, createTheme, alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import { ThemeModeProvider, useThemeMode } from './ThemeModeContext';

const buildTheme = (isDark: boolean) =>
  createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary:   { main: '#7C3AED' },   // violeta vibrante
      secondary: { main: '#A78BFA' },   // violeta suave
      error:     { main: '#EF4444' },
      warning:   { main: '#F59E0B' },
      success:   { main: '#10B981' },
      info:      { main: '#3B82F6' },
      background: isDark
        ? { default: '#0F0F1A', paper: '#1A1A2E' }
        : { default: '#F5F4FF', paper: '#FFFFFF' },
      text: isDark
        ? { primary: '#F1F0FF', secondary: '#A89FC0' }
        : { primary: '#1A1033', secondary: '#6B5E8A' },
    },

    typography: {
      fontFamily: '"Inter", "Segoe UI", sans-serif',
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 600 },
    },

    shape: { borderRadius: 12 },

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            transition: 'background-color 0.3s ease, color 0.3s ease',
          },
        },
      },

      MuiAppBar: {
        styleOverrides: {
          root: {
            background: isDark
              ? 'linear-gradient(135deg, #1A1A2E 0%, #2D1B69 100%)'
              : 'linear-gradient(135deg, #262254 0%, #7C3AED 100%)',
            boxShadow: isDark
              ? '0 1px 0 rgba(124,58,237,0.3)'
              : '0 2px 12px rgba(38,34,84,0.25)',
          },
        },
      },

      MuiDrawer: {
        styleOverrides: {
          paper: {
            background: isDark
              ? 'linear-gradient(180deg, #1A1A2E 0%, #0F0F1A 100%)'
              : 'linear-gradient(180deg, #262254 0%, #3D2B8A 100%)',
            color: '#FFFFFF',
            borderRight: 'none',
            boxShadow: isDark
              ? '2px 0 20px rgba(0,0,0,0.5)'
              : '2px 0 20px rgba(38,34,84,0.2)',
          },
        },
      },

      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            margin: '2px 8px',
            width: 'calc(100% - 16px)',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: alpha('#A78BFA', 0.15),
            },
            '&.Mui-selected': {
              backgroundColor: alpha('#7C3AED', 0.3),
              '&:hover': {
                backgroundColor: alpha('#7C3AED', 0.4),
              },
            },
          },
        },
      },

      MuiListItemText: {
        styleOverrides: {
          primary: { color: '#FFFFFF', fontWeight: 500 },
          secondary: { color: alpha('#FFFFFF', 0.6) },
        },
      },

      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          },
        },
      },

      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },

      MuiLink: {
        styleOverrides: {
          root: { textDecoration: 'none' },
        },
      },

      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600 },
        },
      },

      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 10,
          },
          contained: {
            boxShadow: 'none',
            '&:hover': { boxShadow: '0 4px 12px rgba(124,58,237,0.4)' },
          },
        },
      },

      MuiTextField: {
        defaultProps: { variant: 'outlined' },
      },

      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: isDark
              ? alpha('#A78BFA', 0.15)
              : alpha('#262254', 0.1),
          },
        },
      },
    },
  });

const ThemedApp = ({ children }: React.PropsWithChildren) => {
  const { isDark } = useThemeMode();
  const theme = useMemo(() => buildTheme(isDark), [isDark]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export const AppTheme = ({ children }: React.PropsWithChildren) => (
  <ThemeModeProvider>
    <ThemedApp>{children}</ThemedApp>
  </ThemeModeProvider>
);
