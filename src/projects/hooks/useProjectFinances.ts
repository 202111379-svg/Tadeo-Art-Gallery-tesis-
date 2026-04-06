import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { FirebaseDB } from '../../firebase/config';
import { useAppSelector } from '../../store/reduxHooks';
import { useExchangeRate } from '../../finances/hooks/useExchangeRate';
import type { Expense } from '../../finances/types/expense';

const getExpensesByProject = async (uid: string, projectId: string): Promise<Expense[]> => {
  const col = collection(FirebaseDB, `${uid}/gallery/expenses`);
  const q = query(col, where('projectId', '==', projectId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as Expense), id: d.id }));
};

export const useProjectFinances = (projectId: string, budget?: number) => {
  const { uid } = useAppSelector((s) => s.auth);
  const { toPEN, rate } = useExchangeRate();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['project-expenses', uid, projectId],
    queryFn: () => getExpensesByProject(uid!, projectId),
    enabled: !!uid && !!projectId && projectId !== 'new',
    staleTime: 1000 * 60 * 2,
  });

  const totalSpentPEN = expenses.reduce((acc, e) => acc + toPEN(e.amount, e.currency), 0);
  const budgetPEN = budget ?? 0;
  const remainingPEN = budgetPEN - totalSpentPEN;
  const usedPercent = budgetPEN > 0 ? Math.min(100, (totalSpentPEN / budgetPEN) * 100) : 0;

  return {
    expenses,
    isLoading,
    totalSpentPEN,
    budgetPEN,
    remainingPEN,
    usedPercent,
    exchangeRate: rate,
    isOverBudget: budgetPEN > 0 && totalSpentPEN > budgetPEN,
  };
};
