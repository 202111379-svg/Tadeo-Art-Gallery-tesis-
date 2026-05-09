import { useNavigate, useParams } from 'react-router';

import type { Project } from '../types/project';
import { useAppDispatch } from '../../store/reduxHooks';
import { showSnackbar } from '../../store/ui';
import { useProject } from '../hooks/useProject';
import { FullScreenMessage } from '../../shared/components';
import { ProjectForm } from '../components/ProjectForm';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Error al guardar el proyecto';

export const ProjectView = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const dispatch = useAppDispatch();
  const { project, isError, error, mutation } = useProject(projectId || '');

  const handleSubmit = async (
    projectLike: Partial<Project> & { files?: File[] }
  ) => {
    try {
      const data = await mutation.mutateAsync(projectLike);
      dispatch(showSnackbar({ isOpen: true, message: 'Proyecto guardado exitosamente' }));
      navigate(`/projects/${data.id}`);
    } catch (err: unknown) {
      dispatch(showSnackbar({ isOpen: true, message: getErrorMessage(err) }));
      throw err;
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
