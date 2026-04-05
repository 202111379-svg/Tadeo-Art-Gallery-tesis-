import { Link as RouterLink } from 'react-router';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LockIcon from '@mui/icons-material/Lock';

import { useProjects } from '../../projects/hooks/useProjects';
import { FullScreenMessage } from '../../shared';
import { PHASE_LABELS } from '../../projects/types/project';

export const ScheduleProjectsView = () => {
  const { data: allProjects = [], isLoading } = useProjects();

  const projects = allProjects.filter((p) => p.status !== 'closed');
  const closedCount = allProjects.length - projects.length;

  if (isLoading) return <FullScreenMessage message="Cargando proyectos..." />;

  if (allProjects.length === 0)
    return <FullScreenMessage message="No hay proyectos. Crea uno primero desde el menú Proyectos." />;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={1}>
        <CalendarMonthIcon color="primary" sx={{ fontSize: 36 }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>Cronograma de actividades</Typography>
          <Typography variant="body2" color="text.secondary">
            Selecciona un proyecto para ver y gestionar sus actividades en el calendario.
          </Typography>
        </Box>
      </Stack>

      {closedCount > 0 && (
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <LockIcon fontSize="small" color="disabled" />
          <Typography variant="caption" color="text.secondary">
            {closedCount} proyecto(s) cerrado(s) no se muestran aquí.
          </Typography>
        </Stack>
      )}

      <Divider sx={{ mb: 3 }} />

      {projects.length === 0 ? (
        <FullScreenMessage message="Todos los proyectos están cerrados. Crea uno nuevo o reactiva uno existente." />
      ) : (
        <Grid container spacing={2}>
          {projects.map((project) => (
            <Grid key={project.id} size={{ xs: 12, sm: 6 }}>
              <Card
                variant="outlined"
                sx={{
                  transition: 'all 0.2s',
                  borderColor: project.status === 'on_hold' ? 'warning.main' : 'divider',
                  '&:hover': { borderColor: 'primary.main', boxShadow: 3 },
                }}
              >
                <CardActionArea component={RouterLink} to={`/schedule/${project.id}`} sx={{ p: 0 }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" fontWeight={600} noWrap>
                          {project.title}
                        </Typography>
                        {project.description && (
                          <Typography variant="caption" color="text.secondary" display="block" noWrap>
                            {project.description}
                          </Typography>
                        )}
                        <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                          {project.status === 'on_hold' && (
                            <Chip label="En pausa" size="small" color="warning" variant="outlined" />
                          )}
                          {project.phase && (
                            <Chip label={PHASE_LABELS[project.phase]} size="small" color="primary" variant="outlined" />
                          )}
                          {project.startDate && (
                            <Chip
                              label={`Inicio: ${new Date(project.startDate).toLocaleDateString('es-PE')}`}
                              size="small" variant="outlined"
                            />
                          )}
                        </Stack>
                      </Box>
                      <ArrowForwardIcon color="action" sx={{ ml: 1, flexShrink: 0 }} />
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};
