import { parseISO } from 'date-fns';

import type { ReduxScheduleEvent } from '../../store/schedule/types/calendar-state';
import type { ScheduleEvent } from '../types';

export const reduxEventsToDateEvents = (
  events: ReduxScheduleEvent[] = []
): ScheduleEvent[] => {
  return events.map((event) => {
    return reduxEventToDateEvent(event);
  });
};

export const reduxEventToDateEvent = (
  event: ReduxScheduleEvent
): ScheduleEvent => {
  return {
    id: event.id!,
    title: event.title,
    notes: event.notes,
    userId: event.userId,
    start: parseISO(event.start),
    end: parseISO(event.end),
  };
};

export const dateEventToReduxEvent = (
  event: ScheduleEvent
): ReduxScheduleEvent => {
  return {
    ...event,
    start: event.start.toISOString(),
    end: event.end.toISOString(),
  };
};
