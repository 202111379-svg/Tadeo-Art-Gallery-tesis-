import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthState } from '../../auth';

const initialState: AuthState = {
  status: 'checking',
  uid: null,
  email: null,
  fullName: null,
  photoURL: null,
  errorMessage: null,
};

type LoginPayload = Omit<AuthState, 'status' | 'errorMessage'>;

export const authSlice = createSlice({
  name: 'auth',
  initialState: initialState,

  reducers: {
    login: (state, { payload }: PayloadAction<LoginPayload>) => {
      state.status = 'authenticated';
      state.uid = payload.uid;
      state.email = payload.email;
      state.fullName = payload.fullName;
      state.photoURL = payload.photoURL;
      state.errorMessage = null;
    },

    logout: (
      state,
      { payload }: PayloadAction<{ errorMessage?: string } | undefined>
    ) => {
      state.status = 'not-authenticated';
      state.uid = null;
      state.email = null;
      state.fullName = null;
      state.photoURL = null;
      state.errorMessage = payload?.errorMessage ?? null;
    },

    checkingCredencials: (state) => {
      state.status = 'checking';
    },
  },
});

// Action creators are generated for each case reducer function
export const { login, logout, checkingCredencials } = authSlice.actions;
