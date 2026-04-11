import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Calendar, type ToolbarProps, Navigate } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import ViewDayIcon from '@mui/icons-material/ViewDay';
import ListAltIcon from '@mui/icons-material/ListAlt';
import FlagIcon from '@mui/icons-material/Flag';

import type { ScheduleEvent } from '../types';
import { dateEventToReduxEvent, reduxEventsToDateEvents } from '../mappers';
import { getMessagesES, localizer } from '../../helpers';
import { setActiveEvent, startLoadingEvents } from '../../store/schedule';
import { openDateModal } from '../../store/ui';
import { useCalendar } from '../hooks';
import { CalendarEvent, CalendarModal, EventOptions } from '../components';
import { useProjects } from '../../projects/hooks/useProjects';
import { useProject } from '../../projects/hooks/useProject';
import { useThemeMode } from '../../theme/ThemeModeContext';

// Toolbar amigable con iconos + etiquetas
const CustomToolbar = ({ label, onNavigate, onView, view }: ToolbarProps<ScheduleEvent>) => {
  const views = [
    { key: 'month',  label: 'Mes',     icon: <CalendarViewMonthIcon fontSize="small" /> },
    { key: 'week',   label: 'Semana',  icon: <ViewWeekIcon fontSize="small" /> },
    { key: 'day',    label: 'Día',     icon: <ViewDayIcon fontSize="small" /> },
    { key: 'agenda', label: 'Lista',   icon: <ListAltIcon fontSize="small" /> },
  ] as const;

  return (
    <Paper
      variant="outlined"
      sx={{ p: 1.5, mb: 1.5, borderRadius: 2 }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems="center"
        justifyContent="space-between"
        gap={1.5}
      >
        {/* Navegación */}
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Tooltip title="Mes anterior">
            <IconButton onClick={() => onNavigate(Navigate.PREVIOUS)} size="small">
              <ChevronLeftIcon />
            </IconButton>
          </Tooltip>
          <Button
            size="small"
            variant="outlined"
            startIcon={<TodayIcon />}
            onClick={() => onNavigate(Navigate.TODAY)}
            sx={{ px: 2 }}
          >
            Hoy
          </Button>
          <Tooltip title="Mes siguiente">
            <IconButton onClick={() => onNavigate(Navigate.NEXT)} size="small">
              <ChevronRightIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Período actual */}
        <Typography variant="h6" fontWeight={700} sx={{ textTransform: 'capitalize', textAlign: 'center' }}>
          {label}
        </Typography>

        {/* Selector de vista con iconos */}
        <Stack direction="row" spacing={0.5}>
          {views.map((v) => (
            <Tooltip key={v.key} title={v.label}>
              <Button
                size="small"
                onClick={() => onView(v.key)}
                variant={view === v.key ? 'contained' : 'outlined'}
                sx={{ minWidth: 0, px: 1.5, gap: 0.5 }}
              >
                {v.icon}
                <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                  {v.label}
                </Box>
              </Button>
            </Tooltip>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
};

export const CalendarView = () => {
  const {
    date,
    events,
    lastView,
    user,
    dispatch,
    onNavigate,
    onViewChanged,
  } = useCalendar();

  const { scheduleProjectId } = useParams();
  const navigate = useNavigate();
  const { data: projects = [] } = useProjects();
  const { isDark } = useThemeMode();
  const currentProject = projects.find((p) => p.id === scheduleProjectId);
  const { mutation } = useProject(scheduleProjectId ?? '');

  // Popover para resumen de hito
  const [milestoneAnchor, setMilestoneAnchor] = useState<{ el: HTMLElement; event: ScheduleEvent } | null>(null);

  const scheduleEvents = useMemo(
    () => reduxEventsToDateEvents(events),
    [events]
  );

  // Hitos del proyecto como eventos de solo lectura
  const milestoneEvents = useMemo<ScheduleEvent[]>(() => {
    if (!currentProject?.milestones) return [];
    return currentProject.milestones.map((m) => {
      const d = new Date(typeof m.date === 'number' ? m.date : m.date);
      return {
        id: `milestone-${m.date}`,
        title: `${m.completed ? '✅' : '🏁'} ${m.title}`,
        notes: m.description ?? '',
        userId: user.uid ?? '',
        start: d,
        end: d,
      };
    });
  }, [currentProject, user.uid]);

  // Rango del proyecto como evento de fondo
  const projectRangeEvents = useMemo<ScheduleEvent[]>(() => {
    if (!currentProject?.startDate || !currentProject?.endDate) return [];
    return [{
      id: `project-range`,
      title: `📁 ${currentProject.title}`,
      notes: '',
      userId: user.uid ?? '',
      start: new Date(currentProject.startDate),
      end: new Date(currentProject.endDate),
    }];
  }, [currentProject, user.uid]);

  const allEvents = useMemo(
    () => [...projectRangeEvents, ...scheduleEvents, ...milestoneEvents],
    [projectRangeEvents, scheduleEvents, milestoneEvents]
  );

  const eventStyleGetter = (event: ScheduleEvent) => {
    if (event.id === 'project-range') {
      return {
        style: {
          backgroundColor: 'rgba(124,58,237,0.15)',
          borderLeft: '3px solid #7C3AED',
          borderRadius: '4px',
          color: isDark ? '#c4b5fd' : '#5b21b6',
          fontSize: '0.75rem',
          fontWeight: 500,
        },
      };
    }
    if (String(event.id).startsWith('milestone-')) {
      const milestoneDate = Number(String(event.id).replace('milestone-', ''));
      const milestone = currentProject?.milestones?.find((m) => m.date === milestoneDate);
      return {
        style: {
          backgroundColor: milestone?.completed ? '#374151' : '#059669',
          borderRadius: '6px',
          border: 'none',
          color: 'white',
          padding: '2px 8px',
          fontSize: '0.78rem',
          fontWeight: 600,
          opacity: milestone?.completed ? 0.7 : 1,
          textDecoration: milestone?.completed ? 'line-through' : 'none',
        },
      };
    }
    const isMyEvent = user.uid === event.userId;
    return {
      style: {
        backgroundColor: isMyEvent ? '#7C3AED' : '#546e7a',
        borderRadius: '6px',
        border: 'none',
        color: 'white',
        padding: '2px 8px',
        fontSize: '0.82rem',
        fontWeight: 500,
      },
    };
  };

  const onSelectEvent = (event: ScheduleEvent, e: React.SyntheticEvent) => {
    // Los hitos abren un popover de resumen
    if (String(event.id).startsWith('milestone-')) {
      setMilestoneAnchor({ el: e.currentTarget as HTMLElement, event });
      return;
    }
    // El rango del proyecto es de solo lectura
    if (event.id === 'project-range') return;
    dispatch(setActiveEvent(dateEventToReduxEvent(event)));
    dispatch(openDateModal());
  };

  const toggleMilestone = async (milestoneDate: number, completed: boolean) => {
    if (!currentProject) return;
    const updatedMilestones = currentProject.milestones.map((m) =>
      m.date === milestoneDate
        ? { ...m, completed, completedAt: completed ? new Date().toISOString() : undefined }
        : m
    );
    await mutation.mutateAsync({ ...currentProject, milestones: updatedMilestones });
    setMilestoneAnchor(null);
  };

  const onSlotSelect = () => {
    dispatch(setActiveEvent(null));
  };

  useEffect(() => {
    dispatch(startLoadingEvents(scheduleProjectId!));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleProjectId]);

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      {/* Cabecera con nombre del proyecto y botón volver */}
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Tooltip title="Volver a proyectos">
          <IconButton size="small" onClick={() => navigate('/schedule')}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {currentProject?.title ?? 'Cronograma'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Haz clic en un evento para editarlo · Usa el botón + para agregar uno nuevo
          </Typography>
        </Box>
      </Stack>

      {/* Aviso cuando no hay eventos manuales */}
      {scheduleEvents.length === 0 && (
        <Chip
          icon={<TodayIcon />}
          label="Aún no hay actividades manuales. Usa el botón + para agregar la primera."
          color="info"
          variant="outlined"
          sx={{ mb: 1.5, maxWidth: '100%' }}
        />
      )}

      {/* Leyenda */}
      <Stack direction="row" spacing={2} mb={1.5} flexWrap="wrap">
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#059669' }} />
          <Typography variant="caption" color="text.secondary">Hito del proyecto</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#7C3AED' }} />
          <Typography variant="caption" color="text.secondary">Actividad manual</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'rgba(124,58,237,0.4)' }} />
          <Typography variant="caption" color="text.secondary">Duración del proyecto</Typography>
        </Stack>
      </Stack>

      {/* Calendario */}
      <Box sx={{ height: 'calc(100vh - 260px)', minHeight: 400 }}>
        <Calendar
          selectable
          onSelectSlot={onSlotSelect}
          culture="es"
          localizer={localizer}
          events={allEvents}
          date={date}
          view={lastView}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          messages={getMessagesES()}
          eventPropGetter={eventStyleGetter}
          components={{
            event: CalendarEvent,
            toolbar: CustomToolbar,
          }}
          onSelectEvent={onSelectEvent}
          onView={onViewChanged}
          onNavigate={onNavigate}
          popup
          showMultiDayTimes
          className={isDark ? 'dark-calendar' : ''}
        />
      </Box>

      <CalendarModal />
      <EventOptions />

      {/* Popover resumen de hito */}
      <Popover
        open={!!milestoneAnchor}
        anchorEl={milestoneAnchor?.el}
        onClose={() => setMilestoneAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        PaperProps={{ sx: { p: 2, maxWidth: 320, borderRadius: 2 } }}
      >
        {milestoneAnchor && (() => {
          const milestoneDate = Number(String(milestoneAnchor.event.id).replace('milestone-', ''));
          const milestone = currentProject?.milestones?.find((m) => m.date === milestoneDate);
          if (!milestone) return null;
          const isOverdue = !milestone.completed && new Date(milestone.date) < new Date();
          return (
            <Stack spacing={1.5}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <FlagIcon color={milestone.completed ? 'disabled' : 'success'} fontSize="small" />
                <Typography variant="subtitle2" fontWeight={700}
                  sx={{ textDecoration: milestone.completed ? 'line-through' : 'none' }}>
                  {milestone.title}
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                📅 {new Date(milestone.date).toLocaleDateString('es-PE', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                })}
              </Typography>
              {milestone.description && (
                <Typography variant="body2" color="text.secondary">
                  {milestone.description}
                </Typography>
              )}
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  size="small"
                  label={milestone.completed ? 'Completado' : isOverdue ? 'Vencido' : 'Pendiente'}
                  color={milestone.completed ? 'default' : isOverdue ? 'error' : 'success'}
                  variant="outlined"
                />
                {milestone.completed && milestone.completedAt && (
                  <Typography variant="caption" color="text.secondary">
                    {new Date(milestone.completedAt).toLocaleDateString('es-PE')}
                  </Typography>
                )}
              </Stack>
              <Button
                size="small"
                variant={milestone.completed ? 'outlined' : 'contained'}
                color={milestone.completed ? 'inherit' : 'success'}
                disabled={mutation.isPending}
                onClick={() => toggleMilestone(milestone.date, !milestone.completed)}
              >
                {mutation.isPending
                  ? 'Guardando...'
                  : milestone.completed
                  ? '↩ Marcar como pendiente'
                  : '✓ Marcar como completado'}
              </Button>
            </Stack>
          );
        })()}
      </Popover>
    </Box>
  );
};
