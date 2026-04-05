import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Project } from '../types/project';
import { createUpdateProjectAction } from '../actions/create-update-project.action';
import { getProjectByIdAction } from '../actions/get-project-by-id.action';
import { useAppSelector } from '../../store/reduxHooks';

export const useProject = (id: string) => {
  const queryClient = useQueryClient();
  const { uid } = useAppSelector((state) => state.auth);

  const {
    data: project,
    isError,
    error,
  } = useQuery({
    queryKey: ['project', { id }],
    queryFn: () => getProjectByIdAction(uid!, id),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const mutation = useMutation({
    mutationFn: (projectData: Partial<Project> & { files?: File[] }) => {
      return createUpdateProjectAction(uid!, projectData);
    },

    onSuccess: (project) => {
      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: ['projects', uid] });
      queryClient.invalidateQueries({
        queryKey: ['project', { id: project.id }],
      });

      //Update queryData
      queryClient.setQueryData(['projects', uid, { id: project.id }], project);
    },
  });

  return {
    //* Props
    error,
    isError,
    mutation,
    project,
  };
};
