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
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import LockIcon from '@mui/icons-material/Lock';
import EventIcon from '@mui/icons-material/Event';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArchiveIcon from '@mui/icons-material/Archive';

import { useSeasonContext } from '../context/SeasonContext';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';

const fmt = (n: number, currency: string) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(n);

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
      setNewName('');
      setNewDesc('');
      setCreateOpen(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async () => {
    setSaving(true);
    try {
      await closeSeason();
      setCloseConfirmOpen(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const closedSeasons = seasons.filter((s) => s.status === 'closed');
  // El botón superior solo aparece cuando ya hay historial (no es la primera vez)
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
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
          >
            Nueva temporada
          </Button>
        )}
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}

      {/* Temporada activa */}
      {activeSeason ? (
        <Card
          variant="outlined"
          sx={{ mb: 4, borderColor: 'success.main', borderWidth: 2 }}
        >
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                  <EventIcon color="success" />
                  <Typography variant="h5" fontWeight={700}>{activeSeason.name}</Typography>
                  <Chip label="Activa" color="success" size="small" icon={<CheckCircleIcon />} />
                </Stack>
                {activeSeason.description && (
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    {activeSeason.description}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  Iniciada el {new Date(activeSeason.startDate).toLocaleDateString('es-PE', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </Typography>
              </Box>

              <Button
                variant="outlined"
                color="warning"
                startIcon={<LockIcon />}
                onClick={() => setCloseConfirmOpen(true)}
              >
                Cerrar temporada
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ) : !isLoading ? (
        <Card variant="outlined" sx={{ mb: 4, borderStyle: 'dashed' }}>
          <CardContent sx={{ textAlign: 'center', py: 5 }}>
            <EventIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay ninguna temporada activa
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Crea una nueva temporada para comenzar a registrar proyectos, personal y finanzas.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
              Crear primera temporada
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Historial de temporadas cerradas */}
      {closedSeasons.length > 0 && (
        <>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <ArchiveIcon color="action" />
            <Typography variant="h6" fontWeight={600}>Historial de temporadas</Typography>
          </Stack>

          <Stack spacing={2}>
            {closedSeasons.map((season) => (
              <Card key={season.id} variant="outlined" sx={{ opacity: 0.85 }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <Typography variant="subtitle1" fontWeight={600}>{season.name}</Typography>
                        <Chip label="Cerrada" size="small" variant="outlined" color="default" />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(season.startDate).toLocaleDateString('es-PE')}
                        {season.endDate && ` → ${new Date(season.endDate).toLocaleDateString('es-PE')}`}
                      </Typography>
                    </Box>

                    {/* Resumen financiero del cierre */}
                    {season.closingSummary && (
                      <Grid container spacing={2} sx={{ maxWidth: 500 }}>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Typography variant="caption" color="text.secondary" display="block">Ingresos PEN</Typography>
                          <Typography variant="body2" fontWeight={600} color="success.main">
                            {fmt(season.closingSummary.totalIncomePEN, 'PEN')}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Typography variant="caption" color="text.secondary" display="block">Gastos PEN</Typography>
                          <Typography variant="body2" fontWeight={600} color="error.main">
                            {fmt(season.closingSummary.totalExpensePEN, 'PEN')}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Typography variant="caption" color="text.secondary" display="block">Proyectos</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {season.closingSummary.totalProjects}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Typography variant="caption" color="text.secondary" display="block">Personal</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {season.closingSummary.totalWorkers}
                          </Typography>
                        </Grid>
                        {season.closingSummary.totalIncomeUSD > 0 && (
                          <Grid size={{ xs: 12 }}>
                            <Typography variant="caption" color="text.secondary">
                              USD — Ingresos: {fmt(season.closingSummary.totalIncomeUSD, 'USD')} ·
                              Gastos: {fmt(season.closingSummary.totalExpenseUSD, 'USD')}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </>
      )}

      {/* Dialog: crear temporada */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>Nueva temporada</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nombre del evento / exposición"
              fullWidth
              autoFocus
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej: Exposición Arte Contemporáneo 2026"
            />
            <TextField
              label="Descripción (opcional)"
              fullWidth
              multiline
              rows={3}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Describe brevemente el evento o exposición"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setCreateOpen(false)} color="inherit" variant="outlined" fullWidth>
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={!newName.trim() || saving}
            fullWidth
          >
            {saving ? 'Creando...' : 'Crear temporada'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmación: cerrar temporada */}
      <ConfirmDialog
        open={closeConfirmOpen}
        title="Cerrar temporada"
        description={`¿Cerrar "${activeSeason?.name}"? Se guardará un resumen financiero y la temporada quedará en modo lectura. Los datos no se eliminan. Podrás crear una nueva temporada después.`}
        confirmLabel="Cerrar temporada"
        onConfirm={handleClose}
        onCancel={() => setCloseConfirmOpen(false)}
      />
    </Container>
  );
};
