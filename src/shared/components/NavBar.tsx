import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import AppBar from '@mui/material/AppBar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';

import { useAppDispatch } from '../../store/reduxHooks';
import { startLogout } from '../../store/auth';
import { setActiveProject } from '../../projects/store';
import { toggleSideBar } from '../../store/ui';
import { useThemeMode } from '../../theme/ThemeModeContext';
import { useNotifications } from '../../notifications/hooks/useNotifications';

interface Props {
  drawerWidth?: number;
}

export const NavBar = ({ drawerWidth }: Props) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isDark, toggleMode } = useThemeMode();
  const notifications = useNotifications();
  const unreadCount = notifications.unreadCount;
  const notificationList = notifications.notifications;
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const badgeColor = notificationList.some((n) => n.type === 'error')
    ? 'error'
    : notificationList.some((n) => n.type === 'warning')
    ? 'warning'
    : 'info';

  return (
    <AppBar
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${drawerWidth}px)` },
        ml: { md: `${drawerWidth}px` },
      }}
    >
      <Toolbar>
        <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">

          {/* Izquierda */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton sx={{ color: 'white', display: { md: 'none' } }}
              onClick={() => dispatch(toggleSideBar())}>
              <MenuIcon />
            </IconButton>
            <Link component={NavLink} to="/projects"
              onClick={() => dispatch(setActiveProject(null))}
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" fontWeight={700} letterSpacing={0.5} sx={{ color: 'white' }}>
                Tadeo Art Gallery
              </Typography>
            </Link>
          </Box>

          {/* Derecha */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>

            {/* Notificaciones */}
            <Tooltip title="Notificaciones" arrow>
              <IconButton
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{ color: 'white' }}
              >
                <Badge badgeContent={unreadCount} color={badgeColor} max={9}>
                  {unreadCount > 0
                    ? <NotificationsIcon sx={{ fontSize: 22 }} />
                    : <NotificationsNoneIcon sx={{ fontSize: 22 }} />
                  }
                </Badge>
              </IconButton>
            </Tooltip>

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

      {/* Panel de notificaciones */}
      <Popover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 380, borderRadius: 2, mt: 1 } }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Notificaciones {unreadCount > 0 && `(${unreadCount} sin leer)`}
          </Typography>
          {unreadCount > 0 && (
            <Typography
              variant="caption"
              color="primary"
              sx={{ cursor: 'pointer', fontWeight: 600 }}
              onClick={() => notifications.markAllRead()}
            >
              Marcar todas como leídas
            </Typography>
          )}
        </Box>
        <Divider />
        {notificationList.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Sin alertas pendientes
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding sx={{ maxHeight: 400, overflow: 'auto' }}>
            {notificationList.map((n) => (
              <ListItem
                key={n.id}
                divider
                component="button"
                onClick={() => {
                  notifications.markRead(n.id);
                  navigate(`/projects/${n.projectId}`);
                  setAnchorEl(null);
                }}
                sx={{
                  gap: 1,
                  width: '100%',
                  textAlign: 'left',
                  bgcolor: n.read ? 'transparent' : 'action.hover',
                  border: 'none',
                  cursor: 'pointer',
                  opacity: n.read ? 0.6 : 1,
                  color: 'text.primary',
                }}
              >
                {n.type === 'error'
                  ? <ErrorIcon color="error" fontSize="small" sx={{ flexShrink: 0 }} />
                  : n.type === 'warning'
                  ? <WarningAmberIcon color="warning" fontSize="small" sx={{ flexShrink: 0 }} />
                  : <InfoIcon color="info" fontSize="small" sx={{ flexShrink: 0 }} />
                }
                <ListItemText
                  primary={n.message}
                  secondary={`📁 ${n.projectTitle} · ${new Date(n.createdAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                  slotProps={{
                    primary: { variant: 'body2', style: { fontWeight: n.read ? 400 : 600 } },
                    secondary: { variant: 'caption' },
                  }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Popover>
    </AppBar>
  );
};
