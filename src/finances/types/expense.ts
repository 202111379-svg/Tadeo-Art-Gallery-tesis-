import type { Currency } from './donor';

export type ExpenseCategory =
  | 'materiales'
  | 'personal'
  | 'infraestructura'
  | 'marketing'
  | 'otros';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: Currency;
  category: ExpenseCategory;
  date: string; // ISO string
  notes?: string;
  // Trazabilidad de personal — solo para gastos de tipo 'personal' generados desde Distribución
  workerId?: string;
  workerStatus?: 'active' | 'terminated'; // 'terminated' = trabajador dado de baja
}
