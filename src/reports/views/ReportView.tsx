import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

// Importaciones directas de MUI (Sin archivos de barril para optimización)
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import PictureAsPdf from '@mui/icons-material/PictureAsPdf';
import CalendarToday from '@mui/icons-material/CalendarToday';
import { useProjects } from '../../projects/hooks/useProjects';
import { isProjectHealthy } from '../../helpers/project-health';

import type { Project } from '../../projects/types/project';

export const ReportView = () => {
  const componentRef = useRef<HTMLDivElement>(null);

  const { data: projects = [] } = useProjects();

  // Hook para imprimir
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'Reporte_De_Proyectos',
  });

  const getProjectHealth = (project: Project): 'Saludable' | 'Crítico' =>
    isProjectHealthy(project) ? 'Saludable' : 'Crítico';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Botón de Acción (No se imprime) */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PictureAsPdf />}
          onClick={() => handlePrint && handlePrint()}
        >
          Descargar PDF / Imprimir
        </Button>
      </Box>

      {/* Área Imprimible */}
      <Box ref={componentRef} sx={{ p: 4, bgcolor: 'background.paper' }}>
        {/* Encabezado del Reporte */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Reporte de Estado de Proyectos
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Generado el: {new Date().toLocaleDateString()}
          </Typography>
          <Divider sx={{ mt: 2 }} />
        </Box>

        {/* Lista de Proyectos */}
        <Stack spacing={4}>
          {projects.map((project) => {
            const health = getProjectHealth(project);
            const isHealthy = health === 'Saludable';

            return (
              <Card
                key={project.id}
                variant="outlined"
                sx={{
                  breakInside: 'avoid', // Evita que un proyecto se corte entre páginas al imprimir
                  boxShadow: 3,
                }}
              >
                <CardContent>
                  {/* Cabecera del Proyecto */}
                  <Grid
                    container
                    spacing={2}
                    alignItems="center"
                    sx={{ mb: 2 }}
                  >
                    <Grid item xs={12} md={8}>
                      <Typography variant="h4" color="primary">
                        {project.title || 'Sin Título'}
                      </Typography>
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      md={4}
                      sx={{
                        display: 'flex',
                        justifyContent: { xs: 'flex-start', md: 'flex-end' },
                      }}
                    >
                      <Chip
                        icon={
                          isHealthy ? <CheckCircleOutline /> : <ErrorOutline />
                        }
                        label={`Estado: ${health}`}
                        color={isHealthy ? 'success' : 'error'}
                        variant={isHealthy ? 'filled' : 'outlined'}
                        sx={{ fontSize: '1rem', py: 2 }}
                      />
                    </Grid>
                  </Grid>

                  {/* Fechas */}
                  <Stack
                    direction="row"
                    spacing={3}
                    sx={{ mb: 3, color: 'text.secondary' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarToday fontSize="small" />
                      <Typography variant="body2">
                        Inicio: {project.startDate}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarToday fontSize="small" />
                      <Typography variant="body2">
                        Fin: {project.endDate}
                      </Typography>
                    </Box>
                  </Stack>

                  <Typography variant="h6" gutterBottom>
                    Descripción
                  </Typography>
                  <Typography variant="body1" paragraph sx={{ mb: 3 }}>
                    {project.description || (
                      <Typography
                        component="span"
                        color="error"
                        fontStyle="italic"
                      >
                        Sin descripción disponible.
                      </Typography>
                    )}
                  </Typography>

                  <Grid container spacing={4}>
                    {/* Criterios de Aceptación */}
                    <Grid item xs={12} md={6}>
                      <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                        <Typography
                          variant="h6"
                          gutterBottom
                          color="primary.main"
                        >
                          Criterios de Aceptación
                        </Typography>
                        {project.acceptanceCriteria.length > 0 ? (
                          <List dense>
                            {project.acceptanceCriteria.map(
                              (criteria, index) => (
                                <ListItem key={index}>
                                  <ListItemText primary={`• ${criteria}`} />
                                </ListItem>
                              )
                            )}
                          </List>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No hay criterios definidos.
                          </Typography>
                        )}
                      </Paper>
                    </Grid>

                    {/* Hitos (Milestones) */}
                    <Grid item xs={12} md={6}>
                      <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                        <Typography
                          variant="h6"
                          gutterBottom
                          color="primary.main"
                        >
                          Hitos (Milestones)
                        </Typography>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Hito</TableCell>
                                <TableCell align="right">Fecha</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {project.milestones.length > 0 ? (
                                project.milestones.map((ms, index) => (
                                  <TableRow key={index}>
                                    <TableCell component="th" scope="row">
                                      <Typography variant="subtitle2">
                                        {ms.title}
                                      </Typography>
                                      {ms.description && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                        >
                                          {ms.description}
                                        </Typography>
                                      )}
                                    </TableCell>
                                    <TableCell align="right">
                                      {new Date(ms.date).toLocaleDateString()}
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={2} align="center">
                                    Sin hitos registrados
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* Galería de Imágenes */}
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Evidencia Visual ({project.imagesUrls.length})
                    </Typography>
                    {project.imagesUrls.length > 0 ? (
                      <Grid container spacing={2}>
                        {project.imagesUrls.map((url, idx) => (
                          <Grid item xs={6} sm={4} md={3} key={idx}>
                            <Box
                              component="img"
                              src={url}
                              alt={`Project evidence ${idx + 1}`}
                              sx={{
                                width: '100%',
                                height: 150,
                                objectFit: 'cover',
                                borderRadius: 1,
                                border: '1px solid #ddd',
                              }}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Typography
                        color="error"
                        variant="body2"
                        fontStyle="italic"
                      >
                        No se han adjuntado imágenes (Requerido: mín. 2).
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      </Box>
    </Container>
  );
};
