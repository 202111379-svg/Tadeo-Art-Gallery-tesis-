import type { Milestone } from './milestone';
import type { ProjectLogistics } from './logistics';
import type { Risk } from './risk';
import type { Incident, ProjectEvaluation } from './incident';

export type ProjectPhase = 'planning' | 'organizing' | 'executing' | 'evaluating';
export type ProjectStatus = 'active' | 'closed' | 'on_hold';

export const PHASE_LABELS: Record<ProjectPhase, string> = {
  planning:   'Planificación',
  organizing: 'Organización',
  executing:  'Ejecución',
  evaluating: 'Evaluación',
};

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  active:   'Activo',
  closed:   'Cerrado',
  on_hold:  'En pausa',
};

export interface Project {
  id: string;
  seasonId?: string;
  title: string;
  description?: string;
  responsible?: string;
  phase?: ProjectPhase;
  status?: ProjectStatus;
  closedAt?: string;
  startDate: string;
  endDate: string;
  budget?: number;
  acceptanceCriteria: string[];
  milestones: Milestone[];
  risks?: Risk[];
  incidents?: Incident[];
  evaluation?: ProjectEvaluation;
  imagesUrls: string[];
  logistics?: ProjectLogistics;
}
