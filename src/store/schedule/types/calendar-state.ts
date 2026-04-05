import type { ScheduleEvent } from '../../../schedule/types';

export interface ReduxScheduleEvent
  extends Omit<ScheduleEvent, 'id' | 'start' | 'end'> {
  id?: string;
  start: string;
  end: string;
  bgColor?: string;
}

export interface CalendarState {
  isLoadingEvents: boolean;
  events: ReduxScheduleEvent[];
  activeEvent?: ReduxScheduleEvent | null;
}
