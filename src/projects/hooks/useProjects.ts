import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '../../store/reduxHooks';
import { getProjectsAction } from '../actions/get-projects.action';

export const useProjects = () => {
  const { uid } = useAppSelector((state) => state.auth);

  return useQuery({
    queryKey: ['projects', uid],
    queryFn: () => getProjectsAction(uid!),
    staleTime: 1000 * 60 * 5,
  });
};
