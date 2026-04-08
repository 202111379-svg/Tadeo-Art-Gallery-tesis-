import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
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
import Rating from '@mui/material/Rating';
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
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import StarIcon from '@mui/icons-material/Star';

import { useProjects } from '../../projects/hooks/useProjects';
import { computeProjectHealthFull, healthLabel } from '../../helpers/project-health';
import { PHASE_LABELS, STATUS_LABELS } from '../../projects/types/project';
import { INCIDENT_CATEGORY_LABELS, INCIDENT_IMPACT_LABELS } from '../../projects/types/incident';
import { useSeasonContext } from '../../seasons/context/SeasonContext';

export const ReportView = () => {
  const componentRef = useRef<HTMLDivElement>(null);
  const { data: projects = [] } = useProjects();
  const { activeSeason } = useSeasonContext();

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'Reporte_Proyectos',
  });

  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button variant="contained" color="primary" startIcon={<PictureAsPdf />}
          onClick={() => handlePrint && handlePrint()}>
          Descargar PDF / Imprimir
        </Button>
      </Box>

      <Box ref={componentRef} sx={{ p: 4, bgcolor: 'background.paper' }}>

        {/* ── Encabezado ── */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Reporte de Proyectos
          </Typography>
          {activeSeason && (
            <Typography variant="subtitle1" color="primary" fontWeight={600}>
              Temporada: {activeSeason.name}
            </Typography>
          )}
          <Typography variant="subtitle2" color="text.secondary">
            Generado el {new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}{projects.length} proyecto(s)
          </Typography>
          <Divider sx={{ mt: 2 }} />
        </Box>

        {projects.length === 0 && (
          <Typography color="text.secondary" textAlign="center">
            No hay proyectos en esta temporada.
          </Typography>
        )}

        {/* ── Proyectos ── */}
        <Stack spacing={5}>
          {projects.map((project) => {
            const healthResult = computeProjectHealthFull(project);
            const isHealthy = healthResult.state === 'green';
            const hasIncidents = (project.incidents?.length ?? 0) > 0;
            const hasEvaluation = !!project.evaluation;

            return (
              <Card key={project.id} variant="outlined" sx={{ breakInside: 'avoid', boxShadow: 2 }}>
                <CardContent>

                  {/* ── Cabecera ── */}
                  <Grid container spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
                    <Grid size={{ xs: 12, md: 8 }}>
                      <Typography variant="h4" color="primary" gutterBottom>
                        {project.title || 'Sin Título'}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip
                          icon={isHealthy ? <CheckCircleOutline /> : <ErrorOutline />}
                          label={`Salud: ${healthLabel[healthResult.state]} (${healthResult.score}/100)`}
                          color={isHealthy ? 'success' : healthResult.state === 'amber' ? 'warning' : 'error'}
                          size="small"
                        />
                        {project.phase && (
                          <Chip label={PHASE_LABELS[project.phase]} size="small" color="primary" variant="outlined" />
                        )}
                        {project.status && (
                          <Chip label={STATUS_LABELS[project.status]} size="small" variant="outlined" />
                        )}
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Stack spacing={0.5} alignItems={{ md: 'flex-end' }}>
                        {project.responsible && (
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <PersonIcon fontSize="small" color="action" />
                            <Typography variant="body2">{project.responsible}</Typography>
                          </Stack>
                        )}
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <CalendarToday fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {fmtDate(project.startDate)} → {fmtDate(project.endDate)}
                          </Typography>
                        </Stack>
                        {project.budget && (
                          <Typography variant="caption" color="text.secondary">
                            Presupuesto: S/ {project.budget.toLocaleString('es-PE')}
                          </Typography>
                        )}
                      </Stack>
                    </Grid>
                  </Grid>

                  {/* Descripción */}
                  {project.description && (
                    <>
                      <Typography variant="subtitle2" gutterBottom>Descripción</Typography>
                      <Typography variant="body2" paragraph color="text.secondary">
                        {project.description}
                      </Typography>
                    </>
                  )}

                  <Divider sx={{ my: 2 }} />

                  {/* ── Logística ── */}
                  {project.logistics?.venue?.name && (
                    <Box sx={{ mb: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={0.5} mb={0.5}>
                        <LocationOnIcon fontSize="small" color="primary" />
                        <Typography variant="subtitle2">Lugar del evento</Typography>
                      </Stack>
                      <Typography variant="body2">
                        {project.logistics.venue.name}
                        {project.logistics.venue.address && ` — ${project.logistics.venue.address}`}
                        {project.logistics.venue.city && `, ${project.logistics.venue.city}`}
                      </Typography>
                      <Stack direction="row" spacing={2} mt={0.5}>
                        {project.logistics.capacity && (
                          <Typography variant="caption" color="text.secondary">
                            Aforo: {project.logistics.capacity}
                          </Typography>
                        )}
                        {(project.logistics.artists?.length ?? 0) > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            Artistas: {project.logistics.artists!.map((a) => a.name).join(', ')}
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  )}

                  {/* ── Hitos y Criterios ── */}
                  <Grid container spacing={3} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom color="primary.main">
                          Hitos ({project.milestones.length})
                        </Typography>
                        {project.milestones.length > 0 ? (
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Hito</TableCell>
                                  <TableCell align="right">Fecha</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {project.milestones.map((ms, i) => (
                                  <TableRow key={i}>
                                    <TableCell>
                                      <Typography variant="caption" fontWeight={600}>{ms.title}</Typography>
                                      {ms.description && (
                                        <Typography variant="caption" color="text.secondary" display="block">
                                          {ms.description}
                                        </Typography>
                                      )}
                                    </TableCell>
                                    <TableCell align="right">
                                      <Typography variant="caption">
                                        {new Date(ms.date).toLocaleDateString('es-PE')}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography variant="caption" color="text.secondary">Sin hitos registrados.</Typography>
                        )}
                      </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom color="primary.main">
                          Criterios de aceptación ({project.acceptanceCriteria.length})
                        </Typography>
                        {project.acceptanceCriteria.length > 0 ? (
                          <List dense disablePadding>
                            {project.acceptanceCriteria.map((c, i) => (
                              <ListItem key={i} disableGutters>
                                <ListItemText primary={`${i + 1}. ${c}`}
                                  slotProps={{ primary: { variant: 'caption' } }} />
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          <Typography variant="caption" color="text.secondary">Sin criterios definidos.</Typography>
                        )}
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* ── Riesgos ── */}
                  {(project.risks?.length ?? 0) > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom color="primary.main">
                        Riesgos identificados ({project.risks!.length})
                      </Typography>
                      <Stack spacing={0.5}>
                        {project.risks!.map((r, i) => (
                          <Stack key={i} direction="row" spacing={1} alignItems="center">
                            <Chip label={r.impact === 'high' ? 'Alto' : r.impact === 'medium' ? 'Medio' : 'Bajo'}
                              size="small" color={r.impact === 'high' ? 'error' : r.impact === 'medium' ? 'warning' : 'success'}
                              variant="outlined" />
                            <Chip label={r.status === 'open' ? 'Abierto' : r.status === 'mitigated' ? 'Mitigado' : 'Cerrado'}
                              size="small" variant="outlined" />
                            <Typography variant="caption">{r.description}</Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* ── Incidencias ── */}
                  {hasIncidents && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ mb: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={0.5} mb={1}>
                          <ReportProblemIcon fontSize="small" color="warning" />
                          <Typography variant="subtitle2" color="warning.main">
                            Incidencias registradas ({project.incidents!.length})
                          </Typography>
                        </Stack>
                        <Stack spacing={1}>
                          {project.incidents!.map((inc, i) => (
                            <Paper key={i} variant="outlined" sx={{ p: 1.5 }}>
                              <Stack direction="row" spacing={1} mb={0.5} flexWrap="wrap">
                                <Chip label={INCIDENT_CATEGORY_LABELS[inc.category]} size="small" variant="outlined" />
                                <Chip
                                  label={`Impacto: ${INCIDENT_IMPACT_LABELS[inc.impact]}`}
                                  size="small"
                                  color={inc.impact === 'high' ? 'error' : inc.impact === 'medium' ? 'warning' : 'success'}
                                  variant="outlined"
                                />
                              </Stack>
                              <Typography variant="body2">{inc.description}</Typography>
                              {inc.lesson && (
                                <Stack direction="row" alignItems="flex-start" spacing={0.5} mt={0.5}>
                                  <LightbulbIcon sx={{ fontSize: 13, color: 'warning.main', mt: 0.2 }} />
                                  <Typography variant="caption" color="text.secondary" fontStyle="italic">
                                    Lección: {inc.lesson}
                                  </Typography>
                                </Stack>
                              )}
                            </Paper>
                          ))}
                        </Stack>
                      </Box>
                    </>
                  )}

                  {/* ── Evaluación final ── */}
                  {hasEvaluation && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={0.5} mb={1}>
                          <StarIcon fontSize="small" color="warning" />
                          <Typography variant="subtitle2">Evaluación final</Typography>
                        </Stack>
                        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                          <Chip
                            icon={project.evaluation!.goalAchieved ? <CheckCircleOutline /> : <ErrorOutline />}
                            label={project.evaluation!.goalAchieved ? 'Objetivo cumplido' : 'Objetivo no cumplido'}
                            color={project.evaluation!.goalAchieved ? 'success' : 'error'}
                            size="small"
                          />
                          <Rating value={project.evaluation!.rating} readOnly size="small" />
                          <Typography variant="caption" color="text.secondary">
                            {['', 'Muy deficiente', 'Deficiente', 'Aceptable', 'Bueno', 'Excelente'][project.evaluation!.rating]}
                          </Typography>
                        </Stack>
                        {project.evaluation!.notes && (
                          <Typography variant="body2" color="text.secondary" mt={1}>
                            {project.evaluation!.notes}
                          </Typography>
                        )}
                      </Box>
                    </>
                  )}

                  {/* ── Imágenes ── */}
                  {project.imagesUrls.length > 0 && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        Evidencia visual ({project.imagesUrls.length})
                      </Typography>
                      <Grid container spacing={1}>
                        {project.imagesUrls.map((url, idx) => (
                          <Grid size={{ xs: 6, sm: 4, md: 3 }} key={idx}>
                            <Box component="img" src={url} alt={`Evidencia ${idx + 1}`}
                              sx={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }} />
                          </Grid>
                        ))}
                      </Grid>
                    </>
                  )}

                </CardContent>
              </Card>
            );
          })}
        </Stack>
      </Box>
    </Container>
  );
};
