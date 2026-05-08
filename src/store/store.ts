import { configureStore } from '@reduxjs/toolkit';

import { authSlice } from './auth';
import { uiSlice } from './ui';
import { scheduleSlice } from './schedule/schedule-slice';

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    schedule: scheduleSlice.reducer,
    ui: uiSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispach = typeof store.dispatch;
