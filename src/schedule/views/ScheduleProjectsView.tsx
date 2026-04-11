import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import { Calendar, Navigate, type ToolbarProps } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import GridViewIcon from '@mui/icons-material/GridView';
import ListAltIcon from '@mui/icons-material/ListAlt';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import TodayIcon from '@mui/icons-material/Today';
import ViewDayIcon from '@mui/icons-material/ViewDay';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';

import { useProjects } from '../../projects/hooks/useProjects';
import { FullScreenMessage } from '../../shared';
import { PHASE_LABELS } from '../../projects/types/project';
import { localizer, getMessagesES } from '../../helpers';
import { useThemeMode } from '../../theme/ThemeModeContext';

// Paleta de colores por proyecto
const PROJECT_COLORS = [
  '#7C3AED', '#0891b2', '#059669', '#d97706',
  '#dc2626', '#7c3aed', '#db2777', '#65a30d',
];

interface GlobalEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  projectId: string;
  projectTitle: string;
  type: 'project' | 'milestone';
  color: string;
}

const CustomToolbar = ({ label, onNavigate, onView, view }: ToolbarProps<GlobalEvent>) => {
  const views = [
    { key: 'month',  label: 'Mes',    icon: <CalendarViewMonthIcon fontSize="small" /> },
    { key: 'week',   label: 'Semana', icon: <ViewWeekIcon fontSize="small" /> },
    { key: 'day',    label: 'Día',    icon: <ViewDayIcon fontSize="small" /> },
    { key: 'agenda', label: 'Lista',  icon: <ListAltIcon fontSize="small" /> },
  ] as const;

  return (
    <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5, borderRadius: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" gap={1.5}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Tooltip title="Anterior">
            <IconButton onClick={() => onNavigate(Navigate.PREVIOUS)} size="small">
              <ChevronLeftIcon />
            </IconButton>
          </Tooltip>
          <Button size="small" variant="outlined" startIcon={<TodayIcon />}
            onClick={() => onNavigate(Navigate.TODAY)} sx={{ px: 2 }}>
            Hoy
          </Button>
          <Tooltip title="Siguiente">
            <IconButton onClick={() => onNavigate(Navigate.NEXT)} size="small">
              <ChevronRightIcon />
            </IconButton>
          </Tooltip>
        </Stack>
        <Typography variant="h6" fontWeight={700} sx={{ textTransform: 'capitalize', textAlign: 'center' }}>
          {label}
        </Typography>
        <Stack direction="row" spacing={0.5}>
          {views.map((v) => (
            <Tooltip key={v.key} title={v.label}>
              <Button size="small" onClick={() => onView(v.key)}
                variant={view === v.key ? 'contained' : 'outlined'}
                sx={{ minWidth: 0, px: 1.5, gap: 0.5 }}>
                {v.icon}
                <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>{v.label}</Box>
              </Button>
            </Tooltip>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
};

export const ScheduleProjectsView = () => {
  const { data: allProjects = [], isLoading } = useProjects();
  const [globalView, setGlobalView] = useState(false);
  const { isDark } = useThemeMode();

  const projects = allProjects.filter((p) => p.status !== 'closed');
  const closedCount = allProjects.length - projects.length;

  // Construir eventos globales: rango del proyecto + hitos
  const globalEvents = useMemo<GlobalEvent[]>(() => {
    const events: GlobalEvent[] = [];
    projects.forEach((p, i) => {
      const color = PROJECT_COLORS[i % PROJECT_COLORS.length];
      if (p.startDate && p.endDate) {
        events.push({
          id: `project-${p.id}`,
          title: `📁 ${p.title}`,
          start: new Date(p.startDate),
          end: new Date(p.endDate),
          projectId: p.id,
          projectTitle: p.title,
          type: 'project',
          color,
        });
      }
      p.milestones?.forEach((m) => {
        const d = new Date(typeof m.date === 'number' ? m.date : m.date);
        events.push({
          id: `milestone-${p.id}-${m.date}`,
          title: `🏁 ${m.title} (${p.title})`,
          start: d,
          end: d,
          projectId: p.id,
          projectTitle: p.title,
          type: 'milestone',
          color,
        });
      });
    });
    return events;
  }, [projects]);

  const eventStyleGetter = (event: GlobalEvent) => ({
    style: {
      backgroundColor: event.color,
      opacity: event.type === 'milestone' ? 1 : 0.75,
      borderRadius: '6px',
      border: 'none',
      color: 'white',
      padding: '2px 8px',
      fontSize: '0.78rem',
      fontWeight: 500,
    },
  });

  if (isLoading) return <FullScreenMessage message="Cargando proyectos..." />;
  if (allProjects.length === 0)
    return <FullScreenMessage message="No hay proyectos. Crea uno primero desde el menú Proyectos." />;

  return (
    <Container maxWidth={globalView ? false : 'md'} sx={{ py: 4 }}>
      {/* Cabecera */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1} flexWrap="wrap" gap={1}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <CalendarMonthIcon color="primary" sx={{ fontSize: 36 }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>Cronograma de actividades</Typography>
            <Typography variant="body2" color="text.secondary">
              {globalView
                ? 'Vista global — todos los proyectos en un calendario'
                : 'Selecciona un proyecto para ver y gestionar sus actividades.'}
            </Typography>
          </Box>
        </Stack>

        {/* Toggle vista */}
        <Stack direction="row" spacing={1}>
          <Tooltip title="Vista por proyecto">
            <Button size="small" variant={!globalView ? 'contained' : 'outlined'}
              startIcon={<GridViewIcon />} onClick={() => setGlobalView(false)}>
              Por proyecto
            </Button>
          </Tooltip>
          <Tooltip title="Vista global de todos los proyectos">
            <Button size="small" variant={globalView ? 'contained' : 'outlined'}
              startIcon={<PublicIcon />} onClick={() => setGlobalView(true)}>
              Global
            </Button>
          </Tooltip>
        </Stack>
      </Stack>

      {closedCount > 0 && (
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <LockIcon fontSize="small" color="disabled" />
          <Typography variant="caption" color="text.secondary">
            {closedCount} proyecto(s) cerrado(s) no se muestran aquí.
          </Typography>
        </Stack>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* Vista global */}
      {globalView ? (
        <Box>
          {/* Leyenda de colores */}
          <Stack direction="row" flexWrap="wrap" gap={1} mb={2}>
            {projects.map((p, i) => (
              <Chip
                key={p.id}
                label={p.title}
                size="small"
                sx={{ bgcolor: PROJECT_COLORS[i % PROJECT_COLORS.length], color: 'white', fontWeight: 600 }}
              />
            ))}
          </Stack>

          <Box sx={{ height: 'calc(100vh - 280px)', minHeight: 500 }}>
            <Calendar<GlobalEvent>
              culture="es"
              localizer={localizer}
              events={globalEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              messages={getMessagesES()}
              eventPropGetter={eventStyleGetter}
              components={{ toolbar: CustomToolbar }}
              popup
              showMultiDayTimes
              tooltipAccessor={(e) => `${e.projectTitle} — ${e.title}`}
              className={isDark ? 'dark-calendar' : ''}
            />
          </Box>
        </Box>
      ) : (
        /* Vista por proyecto */
        projects.length === 0 ? (
          <FullScreenMessage message="Todos los proyectos están cerrados." />
        ) : (
          <Grid container spacing={2}>
            {projects.map((project, i) => (
              <Grid key={project.id} size={{ xs: 12, sm: 6 }}>
                <Card variant="outlined" sx={{
                  transition: 'all 0.2s',
                  borderLeft: `4px solid ${PROJECT_COLORS[i % PROJECT_COLORS.length]}`,
                  '&:hover': { boxShadow: 3 },
                }}>
                  <CardActionArea component={RouterLink} to={`/schedule/${project.id}`}>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle1" fontWeight={600} noWrap>
                            {project.title}
                          </Typography>
                          {project.description && (
                            <Typography variant="caption" color="text.secondary" display="block" noWrap>
                              {project.description}
                            </Typography>
                          )}
                          <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                            {project.phase && (
                              <Chip label={PHASE_LABELS[project.phase]} size="small" color="primary" variant="outlined" />
                            )}
                            {project.startDate && (
                              <Chip label={`Inicio: ${new Date(project.startDate).toLocaleDateString('es-PE')}`}
                                size="small" variant="outlined" />
                            )}
                          </Stack>
                        </Box>
                        <ArrowForwardIcon color="action" sx={{ ml: 1, flexShrink: 0 }} />
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )
      )}
    </Container>
  );
};
