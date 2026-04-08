import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { FirebaseDB } from '../../firebase/config';
import { useAppSelector } from '../../store/reduxHooks';
import { useExchangeRate } from '../../finances/hooks/useExchangeRate';
import type { Expense } from '../../finances/types/expense';
import type { Donor } from '../../finances/types/donor';

const getByProject = async <T>(uid: string, col: string, projectId: string): Promise<T[]> => {
  const ref = collection(FirebaseDB, `${uid}/gallery/${col}`);
  const q = query(ref, where('projectId', '==', projectId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as T), id: d.id }));
};

export const useProjectFinances = (projectId: string, budget?: number) => {
  const { uid } = useAppSelector((s) => s.auth);
  const { toPEN, rate } = useExchangeRate();

  const { data: expenses = [], isLoading: loadingExp } = useQuery({
    queryKey: ['project-expenses', uid, projectId],
    queryFn: () => getByProject<Expense>(uid!, 'expenses', projectId),
    enabled: !!uid && !!projectId && projectId !== 'new',
    staleTime: 1000 * 60 * 2,
  });

  const { data: donors = [], isLoading: loadingDon } = useQuery({
    queryKey: ['project-donors', uid, projectId],
    queryFn: () => getByProject<Donor>(uid!, 'donors', projectId),
    enabled: !!uid && !!projectId && projectId !== 'new',
    staleTime: 1000 * 60 * 2,
  });

  const totalIncomePEN  = donors.reduce((acc, d) => acc + toPEN(d.amount, d.currency), 0);
  const totalSpentPEN   = expenses.reduce((acc, e) => acc + toPEN(e.amount, e.currency), 0);
  const budgetPEN       = budget ?? 0;

  // Balance real del proyecto = ingresos propios - gastos propios
  const projectBalancePEN = totalIncomePEN - totalSpentPEN;

  // Si hay presupuesto asignado, también calculamos el uso vs presupuesto
  const remainingBudgetPEN = budgetPEN > 0 ? budgetPEN - totalSpentPEN : null;
  const usedPercent = budgetPEN > 0 ? Math.min(100, (totalSpentPEN / budgetPEN) * 100) : 0;

  return {
    expenses,
    donors,
    isLoading: loadingExp || loadingDon,
    totalIncomePEN,
    totalSpentPEN,
    projectBalancePEN,
    budgetPEN,
    remainingBudgetPEN,
    usedPercent,
    exchangeRate: rate,
    isOverBudget: budgetPEN > 0 && totalSpentPEN > budgetPEN,
  };
};
