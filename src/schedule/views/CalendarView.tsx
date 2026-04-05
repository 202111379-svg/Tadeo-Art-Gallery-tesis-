import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Calendar, type ToolbarProps, Navigate } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
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

import type { ScheduleEvent } from '../types';
import { dateEventToReduxEvent, reduxEventsToDateEvents } from '../mappers';
import { getMessagesES, localizer } from '../../helpers';
import { setActiveEvent, startLoadingEvents } from '../../store/schedule';
import { openDateModal } from '../../store/ui';
import { useCalendar } from '../hooks';
import { CalendarEvent, CalendarModal, EventOptions } from '../components';
import { useProjects } from '../../projects/hooks/useProjects';

// Toolbar amigable con iconos + etiquetas
const CustomToolbar = ({ label, onNavigate, onView, view }: ToolbarProps) => {
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
  const currentProject = projects.find((p) => p.id === scheduleProjectId);

  const scheduleEvents = useMemo(
    () => reduxEventsToDateEvents(events),
    [events]
  );

  const eventStyleGetter = (event: ScheduleEvent) => {
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

  const onSelectEvent = (event: ScheduleEvent) => {
    dispatch(setActiveEvent(dateEventToReduxEvent(event)));
    dispatch(openDateModal());
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

      {/* Aviso cuando no hay eventos */}
      {events.length === 0 && (
        <Chip
          icon={<TodayIcon />}
          label="Aún no hay actividades. Usa el botón + para agregar la primera."
          color="info"
          variant="outlined"
          sx={{ mb: 1.5, maxWidth: '100%' }}
        />
      )}

      {/* Calendario */}
      <Box sx={{ height: 'calc(100vh - 220px)', minHeight: 400 }}>
        <Calendar
          selectable
          onSelectSlot={onSlotSelect}
          culture="es"
          localizer={localizer}
          events={scheduleEvents}
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
        />
      </Box>

      <CalendarModal />
      <EventOptions />
    </Box>
  );
};
