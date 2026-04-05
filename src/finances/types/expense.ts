import type { Currency } from './donor';

export type ExpenseCategory =
  | 'materiales'
  | 'personal'
  | 'infraestructura'
  | 'marketing'
  | 'otros';

export interface Expense {
  id: string;
  seasonId?: string;       // Temporada a la que pertenece
  description: string;
  amount: number;
  currency: Currency;
  category: ExpenseCategory;
  date: string;
  notes?: string;
  workerId?: string;
  workerStatus?: 'active' | 'terminated';
}
