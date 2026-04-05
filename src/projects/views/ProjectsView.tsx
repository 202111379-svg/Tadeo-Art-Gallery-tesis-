import { useState } from 'react';
import { Link } from 'react-router';
import AddOutlined from '@mui/icons-material/AddOutlined';
import BookIcon from '@mui/icons-material/Book';
import Fab from '@mui/material/Fab';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';

import { useProjects } from '../hooks/useProjects';
import { FullScreenMessage } from '../../shared/components/FullScreenMessage';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import { ProjectItem } from '../components/ProjectItem';
import { useDeleteProject } from '../hooks/useDeleteProject';

export const ProjectsView = () => {
  const { data: projects = [], isLoading } = useProjects();
  const { isPosting, handleDelete } = useDeleteProject();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const pendingProject = projects.find((p) => p.id === pendingDeleteId);

  if (isLoading) return <FullScreenMessage message="Cargando proyectos..." />;

  return (
    <>
      {projects.length > 0 ? (
        <Stack>
          <List>
            {projects.map((project) => (
              <ProjectItem
                key={project.id}
                projectId={project.id}
                title={project.title || ''}
                subtitle={project.description}
                images={project.imagesUrls}
                isPosting={isPosting}
                onDelete={() => setPendingDeleteId(project.id)}
              />
            ))}
          </List>
        </Stack>
      ) : (
        <FullScreenMessage
          icon={<BookIcon sx={{ fontSize: 50, color: 'gray' }} />}
          message="No hay proyectos creados, inicia con uno"
        />
      )}

      <Link to="/projects/new">
        <Fab color="error" sx={{ position: 'fixed', right: 50, bottom: 50 }}>
          <AddOutlined sx={{ fontSize: 30 }} />
        </Fab>
      </Link>

      <ConfirmDialog
        open={!!pendingDeleteId}
        title="Eliminar proyecto"
        description={`¿Estás seguro de que deseas eliminar "${pendingProject?.title ?? ''}"? Esta acción no se puede deshacer.`}
        onConfirm={() => {
          if (pendingDeleteId) handleDelete(pendingDeleteId);
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </>
  );
};
