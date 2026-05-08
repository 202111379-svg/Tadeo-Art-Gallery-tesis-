import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Project } from '../types/project';
import { cerrarProyecto } from '../actions/cerrar-proyecto.action';
import { createUpdateProjectAction } from '../actions/create-update-project.action';
import { getProjectByIdAction } from '../actions/get-project-by-id.action';
import { useAppSelector } from '../../store/reduxHooks';
import { useSeasonContext } from '../../seasons/context/season-context';

export const useProject = (id: string) => {
  const queryClient = useQueryClient();
  const { uid } = useAppSelector((state) => state.auth);
  const { activeSeason } = useSeasonContext();

  const {
    data: project,
    isError,
    error,
  } = useQuery({
    queryKey: ['project', uid, id],
    queryFn: () => getProjectByIdAction(uid!, id),
    enabled: !!uid && !!id,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const mutation = useMutation({
    mutationFn: (projectData: Partial<Project> & { files?: File[] }) => {
      // Inyectar seasonId al crear un proyecto nuevo
      const dataWithSeason = projectData.id === 'new' && activeSeason
        ? { ...projectData, seasonId: activeSeason.id }
        : projectData;
      return createUpdateProjectAction(uid!, dataWithSeason);
    },

    onSuccess: (project) => {
      queryClient.setQueryData(['project', uid, project.id], project);
      queryClient.invalidateQueries({ queryKey: ['projects', uid, activeSeason?.id] });
      queryClient.invalidateQueries({ queryKey: ['projects-all', uid, activeSeason?.id] });
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => cerrarProyecto(uid!, id),
    onSuccess: (closedProject) => {
      queryClient.setQueryData(['project', uid, closedProject.id], closedProject);
      queryClient.invalidateQueries({ queryKey: ['projects', uid, activeSeason?.id] });
      queryClient.invalidateQueries({ queryKey: ['projects-all', uid, activeSeason?.id] });
    },
  });

  return { closeMutation, error, isError, mutation, project };
};
