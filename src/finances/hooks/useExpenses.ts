import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from '../../store/reduxHooks';
import {
  addExpenseAction,
  deleteExpenseAction,
  getExpensesAction,
} from '../actions/expenses.action';
import type { Expense } from '../types/expense';

export const useExpenses = () => {
  const { uid } = useAppSelector((s) => s.auth);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['expenses'],
    queryFn: () => getExpensesAction(uid!),
    staleTime: 1000 * 60 * 5,
  });

  const add = useMutation({
    mutationFn: (expense: Omit<Expense, 'id'>) =>
      addExpenseAction(uid!, expense),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteExpenseAction(uid!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });

  return { query, add, remove };
};
