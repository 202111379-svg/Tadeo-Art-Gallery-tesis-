import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '../../store/reduxHooks';
import { useSeasonContext } from '../../seasons/context/SeasonContext';
import { getProjectsAction } from '../actions/get-projects.action';

export const useProjects = () => {
  const { uid } = useAppSelector((state) => state.auth);
  const { activeSeason } = useSeasonContext();

  return useQuery({
    queryKey: ['projects', uid, activeSeason?.id],
    queryFn: () => getProjectsAction(uid!, activeSeason?.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!uid,
  });
};
