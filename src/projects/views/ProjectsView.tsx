import { useState, useMemo } from 'react';
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

/** Normaliza un título para comparación insensible a mayúsculas y acentos */
const normalizarTitulo = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');

export const ProjectsView = () => {
  const { data: projects = [], isLoading } = useProjects();
  const { isPosting, handleDelete } = useDeleteProject();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const activeProjects = projects.filter((project) => project.status !== 'closed');

  /**
   * Conjunto de nombres normalizados que aparecen más de una vez.
   * Los proyectos con esos nombres mostrarán un distintivo con su fecha de inicio.
   */
  const nombresRepetidos = useMemo(() => {
    const conteo = new Map<string, number>();
    for (const p of activeProjects) {
      const norm = normalizarTitulo(p.title ?? '');
      conteo.set(norm, (conteo.get(norm) ?? 0) + 1);
    }
    return new Set([...conteo.entries()].filter(([, n]) => n > 1).map(([k]) => k));
  }, [activeProjects]);

  const pendingProject = activeProjects.find((p) => p.id === pendingDeleteId);

  if (isLoading) return <FullScreenMessage message="Cargando proyectos..." />;

  return (
    <>
      {activeProjects.length > 0 ? (
        <Stack>
          <List>
            {activeProjects.map((project) => {
              const esRepetido = nombresRepetidos.has(normalizarTitulo(project.title ?? ''));
              const distintivo = esRepetido && project.startDate
                ? new Date(project.startDate).toLocaleDateString('es-PE', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })
                : undefined;
              return (
                <ProjectItem
                  key={project.id}
                  projectId={project.id}
                  title={project.title || ''}
                  subtitle={project.description}
                  images={project.imagesUrls}
                  status={project.status}
                  phase={project.phase}
                  isPosting={isPosting}
                  onDelete={() => setPendingDeleteId(project.id)}
                  disambiguator={distintivo}
                />
              );
            })}
          </List>
        </Stack>
      ) : (
        <FullScreenMessage
          icon={<BookIcon sx={{ fontSize: 50, color: 'gray' }} />}
          message="No hay proyectos activos, inicia con uno"
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
