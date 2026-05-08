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
  const { project, isError, error, mutation, closeMutation } = useProject(projectId || '');

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
    } catch (err: unknown) {
      dispatch(showSnackbar({ isOpen: true, message: getErrorMessage(err) }));
    }
  };

  const handleCloseProject = async () => {
    try {
      await closeMutation.mutateAsync(undefined, {
        onSuccess: () => {
          dispatch(showSnackbar({ isOpen: true, message: 'Proyecto cerrado y enviado al historial' }));
          navigate('/reports');
        },
      });
    } catch (err: unknown) {
      dispatch(showSnackbar({ isOpen: true, message: getErrorMessage(err) }));
    }
  };

  if (isError) return <FullScreenMessage message={error!.message} />;

  if (!project) return <FullScreenMessage message="Cargando..." />;

  return (
    <ProjectForm
      isPosting={mutation.isPending}
      isClosing={closeMutation.isPending}
      project={project}
      onSubmit={handleSubmit}
      onCloseProject={handleCloseProject}
    />
  );
};
