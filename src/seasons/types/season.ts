export type SeasonStatus = 'active' | 'closed';

export interface Season {
  id: string;
  name: string;           // Ej: "Exposición Primavera 2026"
  description?: string;
  startDate: string;      // ISO string
  endDate?: string;       // ISO string — se llena al cerrar
  status: SeasonStatus;
  createdAt: string;      // ISO string
  // Snapshot financiero al cierre (se llena al cerrar la temporada)
  closingSummary?: {
    totalIncomePEN: number;
    totalIncomeUSD: number;
    totalExpensePEN: number;
    totalExpenseUSD: number;
    totalProjects: number;
    totalWorkers: number;
    closedAt: string;
  };
}
