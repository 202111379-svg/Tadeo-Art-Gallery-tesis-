export type SeasonStatus = 'active' | 'closed';

export interface SeasonClosingSummary {
  // Financiero
  totalIncomePEN: number;
  totalIncomeUSD: number;
  totalExpensePEN: number;
  totalExpenseUSD: number;
  balancePEN: number;

  // Proyectos
  totalProjects: number;
  healthyProjects: number;       // score >= 75
  attentionProjects: number;     // score 45–74
  criticalProjects: number;      // score < 45
  projectsGoalAchieved: number;  // con evaluación: objetivo cumplido
  avgRating: number | null;      // calificación promedio (1–5)

  // Incidencias
  totalIncidents: number;
  highImpactIncidents: number;
  topLessons: string[];          // hasta 3 lecciones más relevantes

  // Personal
  totalWorkers: number;

  // Logística
  venues: string[];              // lugares donde se realizaron eventos
  totalArtists: number;
  totalCapacity: number;

  closedAt: string;
}

export interface Season {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: SeasonStatus;
  createdAt: string;
  closingSummary?: SeasonClosingSummary;
}
