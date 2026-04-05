import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from '../../store/reduxHooks';
import { useSeasonContext } from '../../seasons/context/SeasonContext';
import { addExpenseAction, deleteExpenseAction, getExpensesAction } from '../actions/expenses.action';
import type { Expense } from '../types/expense';

export const useExpenses = () => {
  const { uid } = useAppSelector((s) => s.auth);
  const { activeSeason } = useSeasonContext();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['expenses', uid, activeSeason?.id],
    queryFn: () => getExpensesAction(uid!, activeSeason?.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!uid,
  });

  const add = useMutation({
    mutationFn: (expense: Omit<Expense, 'id'>) => addExpenseAction(uid!, expense),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses', uid, activeSeason?.id] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteExpenseAction(uid!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses', uid, activeSeason?.id] }),
  });

  return { query, add, remove };
};
