import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from '../../store/reduxHooks';
import {
  addDonorAction,
  deleteDonorAction,
  getDonorsAction,
} from '../actions/donors.action';
import type { Donor } from '../types/donor';

export const useDonors = () => {
  const { uid } = useAppSelector((s) => s.auth);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['donors'],
    queryFn: () => getDonorsAction(uid!),
    staleTime: 1000 * 60 * 5,
  });

  const add = useMutation({
    mutationFn: (donor: Omit<Donor, 'id'>) => addDonorAction(uid!, donor),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['donors'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteDonorAction(uid!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['donors'] }),
  });

  return { query, add, remove };
};
