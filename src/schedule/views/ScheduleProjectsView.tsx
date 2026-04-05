import { Link as RouterLink } from 'react-router';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import ListItemText from '@mui/material/ListItemText';
import { useProjects } from '../../projects/hooks/useProjects';
import { FullScreenMessage } from '../../shared';

export const ScheduleProjectsView = () => {
  const { data: projects = [], isLoading } = useProjects();

  if (isLoading) return <FullScreenMessage message="Cargando..." />;

  return projects.length > 0 ? (
    <Stack>
      <Typography sx={{ fontSize: 39 }}>
        Administra las actividades de tus proyectos
      </Typography>

      <List>
        {projects.map((project) => (
          <Link
            key={project.id}
            to={`/schedule/${project.id}`}
            component={RouterLink}
          >
            <ListItemButton disableRipple divider>
              <ListItemText primary={project.title} />
            </ListItemButton>
          </Link>
        ))}
      </List>
    </Stack>
  ) : (
    <FullScreenMessage message="No hay proyectos para mostrar" />
  );
};
