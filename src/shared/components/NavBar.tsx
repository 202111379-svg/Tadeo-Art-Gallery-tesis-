import { NavLink } from 'react-router';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';

import { useAppDispatch } from '../../store/reduxHooks';
import { startLogout } from '../../store/auth';
import { setActiveProject } from '../../projects/store';
import { toggleSideBar } from '../../store/ui';
import { useThemeMode } from '../../theme/ThemeModeContext';

interface Props {
  drawerWidth?: number;
}

export const NavBar = ({ drawerWidth }: Props) => {
  const dispatch = useAppDispatch();
  const { isDark, toggleMode } = useThemeMode();

  return (
    <AppBar
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${drawerWidth}px)` },
        ml: { md: `${drawerWidth}px` },
      }}
    >
      <Toolbar>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          width="100%"
        >
          {/* Izquierda */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton
              sx={{ color: 'white', display: { md: 'none' } }}
              onClick={() => dispatch(toggleSideBar())}
            >
              <MenuIcon />
            </IconButton>

            <Link
              component={NavLink}
              to="/projects"
              onClick={() => dispatch(setActiveProject(null))}
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <Typography
                variant="h6"
                fontWeight={700}
                letterSpacing={0.5}
                sx={{ color: 'white' }}
              >
                Tadeo Art Gallery
              </Typography>
            </Link>
          </Box>

          {/* Derecha */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {/* Toggle día/noche */}
            <Tooltip title={isDark ? 'Modo claro' : 'Modo oscuro'} arrow>
              <IconButton
                onClick={toggleMode}
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  borderRadius: 2,
                  px: 1.5,
                  py: 0.75,
                  gap: 0.75,
                  transition: 'background 0.2s',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                }}
              >
                {isDark
                  ? <LightModeRoundedIcon sx={{ fontSize: 18 }} />
                  : <DarkModeRoundedIcon sx={{ fontSize: 18 }} />
                }
                <Typography variant="caption" fontWeight={600} sx={{ color: 'white', lineHeight: 1 }}>
                  {isDark ? 'Claro' : 'Oscuro'}
                </Typography>
              </IconButton>
            </Tooltip>

            {/* Logout */}
            <Tooltip title="Cerrar sesión" arrow>
              <IconButton
                onClick={() => dispatch(startLogout())}
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(239,68,68,0.15)',
                  borderRadius: 2,
                  ml: 0.5,
                  '&:hover': { bgcolor: 'rgba(239,68,68,0.3)' },
                }}
              >
                <LogoutOutlined sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};
