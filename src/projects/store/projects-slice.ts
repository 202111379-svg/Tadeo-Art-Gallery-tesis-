import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ProjectsState } from '../types/projects-state';
import type { Project } from '../types/project';

const initialState: ProjectsState = {
  isSaving: false,
  savedMessage: '',
  projects: [],
  active: null,
};

export const projectsSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setActiveProject: (state, action: PayloadAction<Project | null>) => {
      state.active = action.payload;
      state.savedMessage = '';
    },

    clearProjectsLogout: (state) => {
      state.isSaving = false;
      state.savedMessage = '';
      state.projects = [];
      state.active = null;
    },

    deleteProjectById: (state, action: PayloadAction<string>) => {
      state.active = null;
      state.projects = state.projects.filter((p) => p.id !== action.payload);
    },
  },
});

export const { setActiveProject, clearProjectsLogout, deleteProjectById } =
  projectsSlice.actions;
