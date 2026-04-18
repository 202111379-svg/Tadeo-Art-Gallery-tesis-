import type { Currency } from './donor';

export type ExpenseCategory =
  | 'materiales'
  | 'personal'
  | 'infraestructura'
  | 'marketing'
  | 'otros';

export interface Expense {
  id: string;
  seasonId?: string;
  projectId?: string;
  budgetItemId?: string;       // Ítem de recursos planificados al que corresponde
  description: string;
  amount: number;
  currency: Currency;
  category: ExpenseCategory;
  date: string;
  notes?: string;
  workerId?: string;
  workerStatus?: 'active' | 'terminated';
}
