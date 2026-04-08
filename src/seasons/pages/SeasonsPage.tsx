import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Rating from '@mui/material/Rating';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import LockIcon from '@mui/icons-material/Lock';
import EventIcon from '@mui/icons-material/Event';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArchiveIcon from '@mui/icons-material/Archive';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PeopleIcon from '@mui/icons-material/People';
import FolderIcon from '@mui/icons-material/Folder';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LightbulbIcon from '@mui/icons-material/Lightbulb';

import { useSeasonContext } from '../context/SeasonContext';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import type { SeasonClosingSummary } from '../types/season';

const fmt = (n: number, currency: string) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(n);

// ── Componente de resumen de cierre ──────────────────────────────────────────
const ClosingSummaryPanel = ({ s }: { s: SeasonClosingSummary }) => (
  <Box sx={{ mt: 2 }}>
    <Divider sx={{ mb: 2 }} />

    <Grid container spacing={2}>
      {/* Financiero */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Stack direction="row" alignItems="center" spacing={0.5} mb={1}>
            <AttachMoneyIcon fontSize="small" color="success" />
            <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">
              Financiero
            </Typography>
          </Stack>
          <Stack spacing={0.5}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">Ingresos</Typography>
              <Typography variant="caption" fontWeight={600} color="success.main">{fmt(s.totalIncomePEN, 'PEN')}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">Gastos</Typography>
              <Typography variant="caption" fontWeight={600} color="error.main">{fmt(s.totalExpensePEN, 'PEN')}</Typography>
            </Stack>
            <Divider />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" fontWeight={700}>Balance</Typography>
              <Typography variant="caption" fontWeight={700} color={(s.balancePEN ?? 0) >= 0 ? 'primary.main' : 'warning.main'}>
                {fmt(s.balancePEN ?? (s.totalIncomePEN - s.totalExpensePEN), 'PEN')}
              </Typography>
            </Stack>
            {s.totalIncomeUSD > 0 && (
              <Typography variant="caption" color="text.disabled">
                + ${s.totalIncomeUSD.toFixed(2)} USD ingresos · ${s.totalExpenseUSD.toFixed(2)} USD gastos
              </Typography>
            )}
          </Stack>
        </Paper>
      </Grid>

      {/* Proyectos */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Stack direction="row" alignItems="center" spacing={0.5} mb={1}>
            <FolderIcon fontSize="small" color="primary" />
            <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">
              Proyectos ({s.totalProjects})
            </Typography>
          </Stack>
          <Stack spacing={0.5}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">Saludables</Typography>
              <Chip label={s.healthyProjects ?? 0} size="small" color="success" sx={{ height: 18, fontSize: '0.65rem' }} />
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">En atención</Typography>
              <Chip label={s.attentionProjects ?? 0} size="small" color="warning" sx={{ height: 18, fontSize: '0.65rem' }} />
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">Críticos</Typography>
              <Chip label={s.criticalProjects ?? 0} size="small" color="error" sx={{ height: 18, fontSize: '0.65rem' }} />
            </Stack>
            {s.avgRating != null && (
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary">Calificación prom.</Typography>
                <Rating value={s.avgRating} readOnly size="small" precision={0.5} />
              </Stack>
            )}
            <Typography variant="caption" color="text.secondary">
              {s.projectsGoalAchieved ?? 0}/{s.totalProjects} objetivos cumplidos
            </Typography>
          </Stack>
        </Paper>
      </Grid>

      {/* Personal y logística */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Stack direction="row" alignItems="center" spacing={0.5} mb={1}>
            <PeopleIcon fontSize="small" color="action" />
            <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">
              Operaciones
            </Typography>
          </Stack>
          <Stack spacing={0.5}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">Personal</Typography>
              <Typography variant="caption" fontWeight={600}>{s.totalWorkers} trabajador(es)</Typography>
            </Stack>
            {s.totalArtists > 0 && (
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">Artistas</Typography>
                <Typography variant="caption" fontWeight={600}>{s.totalArtists}</Typography>
              </Stack>
            )}
            {s.totalCapacity > 0 && (
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">Aforo total</Typography>
                <Typography variant="caption" fontWeight={600}>{s.totalCapacity.toLocaleString()}</Typography>
              </Stack>
            )}
            {s.venues?.length > 0 && (
              <Stack direction="row" alignItems="flex-start" spacing={0.5}>
                <LocationOnIcon sx={{ fontSize: 12, mt: 0.3, color: 'text.disabled' }} />
                <Typography variant="caption" color="text.secondary">
                  {s.venues.join(' · ')}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Paper>
      </Grid>

      {/* Incidencias y lecciones */}
      {((s.totalIncidents ?? 0) > 0 || (s.topLessons?.length ?? 0) > 0) && (
        <Grid size={{ xs: 12 }}>
          <Paper variant="outlined" sx={{ p: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={0.5} mb={1}>
              <ReportProblemIcon fontSize="small" color="warning" />
              <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">
                Incidencias y lecciones aprendidas
              </Typography>
              <Chip label={`${s.totalIncidents ?? 0} incidencia(s)`} size="small" variant="outlined"
                color={(s.highImpactIncidents ?? 0) > 0 ? 'error' : 'default'} />
              {(s.highImpactIncidents ?? 0) > 0 && (
                <Chip label={`${s.highImpactIncidents} alto impacto`} size="small" color="error" />
              )}
            </Stack>
            {(s.topLessons?.length ?? 0) > 0 && (
              <Stack spacing={0.5}>
                {(s.topLessons ?? []).map((lesson, i) => (
                  <Stack key={i} direction="row" alignItems="flex-start" spacing={0.5}>
                    <LightbulbIcon sx={{ fontSize: 13, color: 'warning.main', mt: 0.2 }} />
                    <Typography variant="caption" color="text.secondary" fontStyle="italic">
                      {lesson}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      )}
    </Grid>
  </Box>
);

// ── Página principal ──────────────────────────────────────────────────────────
export const SeasonsPage = () => {
  const { activeSeason, seasons, isLoading, createSeason, closeSeason } = useSeasonContext();

  const [createOpen, setCreateOpen] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await createSeason(newName.trim(), newDesc.trim() || undefined);
      setNewName(''); setNewDesc(''); setCreateOpen(false);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleClose = async () => {
    setSaving(true);
    try {
      await closeSeason();
      setCloseConfirmOpen(false);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const closedSeasons = seasons.filter((s) => s.status === 'closed');
  const showTopButton = !activeSeason && !isLoading && closedSeasons.length > 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Temporadas / Eventos</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Cada temporada agrupa proyectos, personal y finanzas de un evento o exposición.
          </Typography>
        </Box>
        {showTopButton && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            Nueva temporada
          </Button>
        )}
      </Stack>

      <Divider sx={{ mb: 3 }} />
      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}

      {/* Temporada activa */}
      {activeSeason ? (
        <Card variant="outlined" sx={{ mb: 4, borderColor: 'success.main', borderWidth: 2 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                  <EventIcon color="success" />
                  <Typography variant="h5" fontWeight={700}>{activeSeason.name}</Typography>
                  <Chip label="Activa" color="success" size="small" icon={<CheckCircleIcon />} />
                </Stack>
                {activeSeason.description && (
                  <Typography variant="body2" color="text.secondary" mb={1}>{activeSeason.description}</Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  Iniciada el {new Date(activeSeason.startDate).toLocaleDateString('es-PE', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </Typography>
              </Box>
              <Button variant="outlined" color="warning" startIcon={<LockIcon />}
                onClick={() => setCloseConfirmOpen(true)}>
                Cerrar temporada
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ) : !isLoading ? (
        <Card variant="outlined" sx={{ mb: 4, borderStyle: 'dashed' }}>
          <CardContent sx={{ textAlign: 'center', py: 5 }}>
            <EventIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>No hay ninguna temporada activa</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Crea una nueva temporada para comenzar a registrar proyectos, personal y finanzas.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
              Crear primera temporada
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Historial */}
      {closedSeasons.length > 0 && (
        <>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <ArchiveIcon color="action" />
            <Typography variant="h6" fontWeight={600}>Historial de temporadas</Typography>
          </Stack>

          <Stack spacing={3}>
            {closedSeasons.map((season) => (
              <Card key={season.id} variant="outlined">
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <Typography variant="subtitle1" fontWeight={700}>{season.name}</Typography>
                        <Chip label="Cerrada" size="small" variant="outlined" />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(season.startDate).toLocaleDateString('es-PE')}
                        {season.endDate && ` → ${new Date(season.endDate).toLocaleDateString('es-PE')}`}
                      </Typography>
                      {season.description && (
                        <Typography variant="body2" color="text.secondary" mt={0.5}>{season.description}</Typography>
                      )}
                    </Box>
                    {season.closingSummary && (
                      <Chip
                        label={`Balance: ${fmt(season.closingSummary.balancePEN ?? (season.closingSummary.totalIncomePEN - season.closingSummary.totalExpensePEN), 'PEN')}`}
                        color={(season.closingSummary.balancePEN ?? 0) >= 0 ? 'success' : 'warning'}
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </Stack>

                  {season.closingSummary && <ClosingSummaryPanel s={season.closingSummary} />}
                </CardContent>
              </Card>
            ))}
          </Stack>
        </>
      )}

      {/* Dialog crear */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>Nueva temporada</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Nombre del evento / exposición" fullWidth autoFocus required
              value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej: Exposición Arte Contemporáneo 2026" />
            <TextField label="Descripción (opcional)" fullWidth multiline rows={3}
              value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Describe brevemente el evento o exposición" />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setCreateOpen(false)} color="inherit" variant="outlined" fullWidth>Cancelar</Button>
          <Button onClick={handleCreate} variant="contained" disabled={!newName.trim() || saving} fullWidth>
            {saving ? 'Creando...' : 'Crear temporada'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmación cierre */}
      <ConfirmDialog
        open={closeConfirmOpen}
        title="Cerrar temporada"
        description={`¿Cerrar "${activeSeason?.name}"? Se guardará un resumen completo con finanzas, proyectos, incidencias y lecciones aprendidas. Los datos no se eliminan.`}
        confirmLabel="Cerrar temporada"
        onConfirm={handleClose}
        onCancel={() => setCloseConfirmOpen(false)}
      />
    </Container>
  );
};
