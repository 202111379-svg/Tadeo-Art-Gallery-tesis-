import type { Milestone } from './milestone';
import type { ProjectLogistics } from './logistics';
import type { Risk } from './risk';

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
  responsible?: string;        // CUS02 — Responsable del proyecto
  phase?: ProjectPhase;        // Fase actual: Planificar → Organizar → Ejecutar → Evaluar
  status?: ProjectStatus;      // CUS07 — Estado del proyecto
  closedAt?: string;           // Fecha de cierre
  startDate: string;
  endDate: string;
  acceptanceCriteria: string[];
  milestones: Milestone[];
  risks?: Risk[];              // CUS05 — Gestión de riesgos
  imagesUrls: string[];
  logistics?: ProjectLogistics;
}
