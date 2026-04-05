import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ScheduleEvent } from '../types';

interface Props {
  event: ScheduleEvent;
}

export const CalendarEvent = ({ event }: Props) => {
  const startHour = format(event.start, 'HH:mm', { locale: es });

  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
      <span style={{ fontSize: '0.7rem', opacity: 0.85, whiteSpace: 'nowrap' }}>
        {startHour}
      </span>
      <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {event.title}
      </strong>
    </span>
  );
};
