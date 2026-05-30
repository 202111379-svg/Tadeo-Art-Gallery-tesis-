export interface Milestone {
  id?: string;
  title: string;
  description?: string;
  date: number;
  completed?: boolean;
  completedAt?: string;
  /** Actividades cuya finalización lleva a este hito (un hito significa algo concreto). */
  activityIds?: string[];
}
