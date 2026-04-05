import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const initialState = {
  isSnackbarOpen: false,
  isDateModalOpen: false,
  isSideBarOpen: false,
  savedMessage: '',
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState: initialState,
  reducers: {
    showSnackbar: (
      state,
      { payload }: PayloadAction<{ isOpen: boolean; message?: string }>
    ) => {
      state.isSnackbarOpen = payload.isOpen;
      state.savedMessage = payload.message || '';
    },

    openDateModal: (state) => {
      state.isDateModalOpen = true;
    },

    closeDateModal: (state) => {
      state.isDateModalOpen = false;
    },

    toggleSideBar: (state) => {
      state.isSideBarOpen = !state.isSideBarOpen;
    },
  },
});

// Action creators are generated for each case reducer function
export const { closeDateModal, openDateModal, showSnackbar, toggleSideBar } =
  uiSlice.actions;
