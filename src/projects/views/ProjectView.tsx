import { useNavigate, useParams } from 'react-router';

import type { Project } from '../types/project';
import { useAppDispatch } from '../../store/reduxHooks';
import { showSnackbar } from '../../store/ui';
import { useProject } from '../hooks/useProject';
import { FullScreenMessage } from '../../shared/components';
import { ProjectForm } from '../components/ProjectForm';

export const ProjectView = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const dispatch = useAppDispatch();
  const { project, isError, error, mutation } = useProject(projectId || '');

  const handleSubmit = async (
    projectLike: Partial<Project> & { files?: File[] }
  ) => {
    try {
      await mutation.mutateAsync(projectLike, {
        onSuccess: (data) => {
          dispatch(showSnackbar({ isOpen: true, message: 'Proyecto guardado exitosamente' }));
          navigate(`/projects/${data.id}`);
        },
      });
    } catch (err: any) {
      dispatch(showSnackbar({ isOpen: true, message: err?.message ?? 'Error al guardar el proyecto' }));
    }
  };

  if (isError) return <FullScreenMessage message={error!.message} />;

  if (!project) return <FullScreenMessage message="Cargando..." />;

  return (
    <ProjectForm
      isPosting={mutation.isPending}
      project={project}
      onSubmit={handleSubmit}
    />
  );
};
