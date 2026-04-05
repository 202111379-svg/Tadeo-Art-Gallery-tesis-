import { configureStore } from '@reduxjs/toolkit';

import { authSlice } from './auth';
import { projectsSlice } from '../projects/store';
import { uiSlice } from './ui';
import { scheduleSlice } from './schedule/schedule-slice';

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    projects: projectsSlice.reducer,
    schedule: scheduleSlice.reducer,
    ui: uiSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispach = typeof store.dispatch;
