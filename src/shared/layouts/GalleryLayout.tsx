import { Link, useLocation } from 'react-router';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import EventIcon from '@mui/icons-material/Event';
import LockIcon from '@mui/icons-material/Lock';
import { Outlet } from 'react-router';

import { mainMenu } from '../../config/menu/main-menu';
import { useAppSelector } from '../../store/reduxHooks';
import { NavBar, SideBar } from '..';
import { useSeasonContext } from '../../seasons/context/SeasonContext';

const drawerWidth = 240;

// Rutas que NO requieren temporada activa
const FREE_ROUTES = ['/seasons', '/dashboard'];

export const GalleryLayout = () => {
  const { fullName } = useAppSelector((state) => state.auth);
  const { activeSeason, isLoading } = useSeasonContext();
  const { pathname } = useLocation();

  const requiresSeason = !FREE_ROUTES.some((r) => pathname.startsWith(r));
  const isBlocked = !isLoading && !activeSeason && requiresSeason;

  return (
    <Box sx={{ display: 'flex' }}>
      <NavBar drawerWidth={drawerWidth} />
      <SideBar title={fullName!} drawerWidth={drawerWidth} items={mainMenu} />

      <Box
        className="animate__animated animate__fadeIn animate__faster"
        component="main"
        sx={{ flexGrow: 1, p: 3 }}
      >
        <Toolbar />

        {/* Banner de temporada */}
        {!isLoading && (
          <Box sx={{ mb: 2 }}>
            {activeSeason ? (
              <Tooltip title="Ver temporadas" arrow>
                <Chip
                  component={Link}
                  to="/seasons"
                  icon={<EventIcon />}
                  label={`Temporada activa: ${activeSeason.name}`}
                  color="success"
                  variant="outlined"
                  clickable
                  sx={{ fontWeight: 600 }}
                />
              </Tooltip>
            ) : (
              <Chip
                component={Link}
                to="/seasons"
                icon={<LockIcon />}
                label="Sin temporada activa"
                color="warning"
                variant="outlined"
                clickable
                sx={{ fontWeight: 600 }}
              />
            )}
          </Box>
        )}

        {/* Bloqueo si no hay temporada activa */}
        {isBlocked ? (
          <Paper
            variant="outlined"
            sx={{
              textAlign: 'center',
              py: 8,
              px: 4,
              borderStyle: 'dashed',
              maxWidth: 480,
              mx: 'auto',
              mt: 6,
            }}
          >
            <LockIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Necesitas una temporada activa
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Crea o activa una temporada antes de registrar proyectos, personal o finanzas.
              Cada temporada representa un evento o exposición de la galería.
            </Typography>
            <Button
              component={Link}
              to="/seasons"
              variant="contained"
              startIcon={<EventIcon />}
            >
              Ir a Temporadas
            </Button>
          </Paper>
        ) : (
          <Outlet />
        )}
      </Box>
    </Box>
  );
};
