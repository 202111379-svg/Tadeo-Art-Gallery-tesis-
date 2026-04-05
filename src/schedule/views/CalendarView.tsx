import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router';
import { Calendar, type ToolbarProps, Navigate } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';

import type { ScheduleEvent } from '../types';
import { dateEventToReduxEvent, reduxEventsToDateEvents } from '../mappers';
import { getMessagesES, localizer } from '../../helpers';
import { setActiveEvent, startLoadingEvents } from '../../store/schedule';
import { openDateModal } from '../../store/ui';
import { useCalendar } from '../hooks';
import { CalendarEvent, CalendarModal, EventOptions } from '../components';

// Toolbar personalizado con MUI
const CustomToolbar = ({ label, onNavigate, onView, view }: ToolbarProps) => {
  const views = [
    { key: 'month', label: 'Mes' },
    { key: 'week', label: 'Semana' },
    { key: 'day', label: 'Día' },
    { key: 'agenda', label: 'Agenda' },
  ] as const;

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems="center"
      justifyContent="space-between"
      sx={{ mb: 2, gap: 1 }}
    >
      {/* Navegación */}
      <Stack direction="row" alignItems="center" spacing={1}>
        <IconButton onClick={() => onNavigate(Navigate.PREVIOUS)} size="small">
          <ChevronLeftIcon />
        </IconButton>
        <Button
          size="small"
          variant="outlined"
          startIcon={<TodayIcon />}
          onClick={() => onNavigate(Navigate.TODAY)}
        >
          Hoy
        </Button>
        <IconButton onClick={() => onNavigate(Navigate.NEXT)} size="small">
          <ChevronRightIcon />
        </IconButton>
      </Stack>

      {/* Título del período */}
      <Typography variant="h6" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
        {label}
      </Typography>

      {/* Selector de vista */}
      <ButtonGroup size="small" variant="outlined">
        {views.map((v) => (
          <Button
            key={v.key}
            onClick={() => onView(v.key)}
            variant={view === v.key ? 'contained' : 'outlined'}
          >
            {v.label}
          </Button>
        ))}
      </ButtonGroup>
    </Stack>
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

  const scheduleEvents = useMemo(
    () => reduxEventsToDateEvents(events),
    [events]
  );

  const eventStyleGetter = (event: ScheduleEvent) => {
    const isMyEvent = user.uid === event.userId;
    return {
      style: {
        backgroundColor: isMyEvent ? '#1976d2' : '#546e7a',
        borderRadius: '6px',
        border: 'none',
        color: 'white',
        padding: '2px 6px',
        fontSize: '0.8rem',
      },
    };
  };

  const onDoubleClick = () => {
    dispatch(openDateModal());
  };

  const onSelect = (event: ScheduleEvent) => {
    dispatch(setActiveEvent(dateEventToReduxEvent(event)));
  };

  const onSlotSelect = () => {
    dispatch(setActiveEvent(null));
  };

  useEffect(() => {
    dispatch(startLoadingEvents(scheduleProjectId!));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleProjectId]);

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', p: 1 }}>
      {events.length === 0 && (
        <Chip
          label="Sin eventos — doble click en el calendario para agregar uno"
          variant="outlined"
          color="info"
          sx={{ mb: 1 }}
        />
      )}

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
        onDoubleClickEvent={onDoubleClick}
        onSelectEvent={onSelect}
        onView={onViewChanged}
        onNavigate={onNavigate}
        popup
        showMultiDayTimes
      />

      <CalendarModal />
      <EventOptions />
    </Box>
  );
};
