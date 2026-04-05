import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { ReduxScheduleEvent, CalendarState } from './types/calendar-state';

const initialState: CalendarState = {
  isLoadingEvents: true,
  events: [],
  activeEvent: null,
};

export const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    setActiveEvent: (
      state,
      { payload }: PayloadAction<ReduxScheduleEvent | null>
    ) => {
      state.activeEvent = payload;
    },

    addNewEvent: (state, { payload }: PayloadAction<ReduxScheduleEvent>) => {
      state.events.push(payload);
      state.activeEvent = null;
    },

    updateEvent: (state, { payload }: PayloadAction<ReduxScheduleEvent>) => {
      state.events = state.events.map((event) => {
        if (event.id === payload.id) {
          return payload;
        }

        return event;
      });
    },

    deleteEvent: (state) => {
      if (state.activeEvent) {
        state.events = state.events.filter(
          (event) => event.id !== state.activeEvent!.id
        );
        state.activeEvent = null;
      }
    },

    loadEvents: (state, { payload }: PayloadAction<ReduxScheduleEvent[]>) => {
      state.isLoadingEvents = false;
      state.events = payload;
    },

    clearEventsOnLogout: (state) => {
      state.isLoadingEvents = true;
      state.events = [];
      state.activeEvent = null;
    },
  },
});

// Action creators are generated for each case reducer function
export const {
  addNewEvent,
  deleteEvent,
  loadEvents,
  clearEventsOnLogout,
  setActiveEvent,
  updateEvent,
} = scheduleSlice.actions;
