import type { Project } from './project';

export interface ProjectsState {
  isSaving: boolean;
  savedMessage: string;
  projects: Project[];
  active: Project | null;
}
