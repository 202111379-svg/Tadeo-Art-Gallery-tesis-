import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from '../../store/reduxHooks';
import { useSeasonContext } from '../../seasons/context/SeasonContext';
import { addDonorAction, deleteDonorAction, getDonorsAction } from '../actions/donors.action';
import type { Donor } from '../types/donor';

export const useDonors = () => {
  const { uid } = useAppSelector((s) => s.auth);
  const { activeSeason } = useSeasonContext();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['donors', uid, activeSeason?.id],
    queryFn: () => getDonorsAction(uid!, activeSeason?.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!uid,
  });

  const add = useMutation({
    mutationFn: (donor: Omit<Donor, 'id'>) => addDonorAction(uid!, donor),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['donors', uid, activeSeason?.id] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteDonorAction(uid!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['donors', uid, activeSeason?.id] }),
  });

  return { query, add, remove };
};
