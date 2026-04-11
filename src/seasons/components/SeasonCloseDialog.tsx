import { useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import FolderIcon from '@mui/icons-material/Folder';
import LockIcon from '@mui/icons-material/Lock';
import PeopleIcon from '@mui/icons-material/People';
import WarningIcon from '@mui/icons-material/Warning';

import type { Season } from '../types/season';
import { useProjects } from '../../projects/hooks/useProjects';
import { computeProjectHealthFull, healthLabel } from '../../helpers/project-health';
import { PHASE_LABELS } from '../../projects/types/project';
import { generatePDF } from '../../helpers/generate-pdf';

const fmt = (n: number, currency: string) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(n);

interface Props {
  open: boolean;
  season: Season | null;
  saving: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Contenido imprimible del reporte
const PrintableReport = ({ season, projects }: { season: Season | null; projects: any[] }) => (
  <Box sx={{ p: 4 }}>
    <Typography variant="h4" fontWeight={700} gutterBottom>
      Reporte de Cierre de Temporada
    </Typography>
    <Typography variant="subtitle1" color="primary" fontWeight={600}>
      {season?.name}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      Generado el {new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
      {' · '} Inicio: {season?.startDate ? new Date(season.startDate).toLocaleDateString('es-PE') : '—'}
    </Typography>
    <Divider sx={{ my: 2 }} />

    <Typography variant="h6" fontWeight={600} gutterBottom>Proyectos ({projects.length})</Typography>
    <Stack spacing={2}>
      {projects.map((p) => {
        const health = computeProjectHealthFull(p);
        return (
          <Paper key={p.id} variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>{p.title}</Typography>
                {p.responsible && (
                  <Typography variant="caption" color="text.secondary">Responsable: {p.responsible}</Typography>
                )}
                {p.phase && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Fase: {PHASE_LABELS[p.phase]}
                  </Typography>
                )}
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  label={`${healthLabel[health.state]} (${health.score}/100)`}
                  size="small"
                  color={health.state === 'green' ? 'success' : health.state === 'amber' ? 'warning' : 'error'}
                />
                {p.budget && (
                  <Chip label={`Presupuesto: S/ ${Number(p.budget).toLocaleString('es-PE')}`} size="small" variant="outlined" />
                )}
              </Stack>
            </Stack>

            {p.description && (
              <Typography variant="body2" color="text.secondary" mt={1}>{p.description}</Typography>
            )}

            {/* Hitos */}
            {p.milestones?.length > 0 && (
              <Box mt={1}>
                <Typography variant="caption" fontWeight={600}>Hitos:</Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.5}>
                  {p.milestones.map((m: any, i: number) => (
                    <Chip
                      key={i}
                      label={`${m.completed ? '✅' : '🏁'} ${m.title} · ${new Date(m.date).toLocaleDateString('es-PE')}`}
                      size="small"
                      variant="outlined"
                      color={m.completed ? 'success' : 'default'}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Evaluación */}
            {p.evaluation && (
              <Box mt={1}>
                <Typography variant="caption" fontWeight={600}>Evaluación: </Typography>
                <Typography variant="caption" color={p.evaluation.goalAchieved ? 'success.main' : 'error.main'}>
                  {p.evaluation.goalAchieved ? 'Objetivo cumplido' : 'Objetivo no cumplido'}
                  {' · '}Calificación: {p.evaluation.rating}/5
                </Typography>
                {p.evaluation.notes && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {p.evaluation.notes}
                  </Typography>
                )}
              </Box>
            )}

            {/* Incidencias */}
            {p.incidents?.length > 0 && (
              <Box mt={1}>
                <Typography variant="caption" fontWeight={600} color="warning.main">
                  Incidencias ({p.incidents.length}):
                </Typography>
                {p.incidents.map((inc: any, i: number) => (
                  <Typography key={i} variant="caption" color="text.secondary" display="block">
                    • {inc.description}{inc.lesson ? ` → Lección: ${inc.lesson}` : ''}
                  </Typography>
                ))}
              </Box>
            )}
          </Paper>
        );
      })}
    </Stack>
  </Box>
);

export const SeasonCloseDialog = ({ open, season, saving, onConfirm, onCancel }: Props) => {
  const { data: projects = [] } = useProjects();
  const [downloaded, setDownloaded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!printRef.current) return;
    setGenerating(true);
    try {
      // Hacer visible temporalmente para que html2canvas pueda renderizarlo
      printRef.current.style.display = 'block';
      printRef.current.style.position = 'fixed';
      printRef.current.style.top = '-9999px';
      printRef.current.style.left = '0';
      printRef.current.style.width = '794px'; // A4 width en px a 96dpi
      printRef.current.style.background = '#ffffff';
      printRef.current.style.color = '#000000';

      await new Promise((r) => setTimeout(r, 100)); // esperar render

      const filename = `Reporte_Cierre_${season?.name ?? 'Temporada'}_${new Date().toLocaleDateString('es-PE').replace(/\//g, '-')}`;
      await generatePDF(printRef.current, filename);
      setDownloaded(true);
    } finally {
      if (printRef.current) {
        printRef.current.style.display = 'none';
        printRef.current.style.position = '';
        printRef.current.style.top = '';
        printRef.current.style.left = '';
        printRef.current.style.width = '';
      }
      setGenerating(false);
    }
  };

  const healthCounts = projects.reduce(
    (acc, p) => {
      const s = computeProjectHealthFull(p).state;
      acc[s]++;
      return acc;
    },
    { green: 0, amber: 0, red: 0 }
  );

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <LockIcon color="warning" />
          <Typography variant="h6" fontWeight={700}>Cerrar temporada: {season?.name}</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Esta acción es irreversible. Descarga el reporte antes de confirmar el cierre.
        </Alert>

        {/* Resumen rápido */}
        <Grid container spacing={2} mb={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5} mb={0.5}>
                <FolderIcon fontSize="small" color="primary" />
                <Typography variant="caption" fontWeight={700} textTransform="uppercase">Proyectos</Typography>
              </Stack>
              <Typography variant="h5" fontWeight={700}>{projects.length}</Typography>
              <Stack direction="row" justifyContent="center" spacing={0.5} mt={0.5}>
                <Chip label={`${healthCounts.green} ✓`} size="small" color="success" />
                <Chip label={`${healthCounts.amber} ⚠`} size="small" color="warning" />
                <Chip label={`${healthCounts.red} ✗`} size="small" color="error" />
              </Stack>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5} mb={0.5}>
                <AttachMoneyIcon fontSize="small" color="success" />
                <Typography variant="caption" fontWeight={700} textTransform="uppercase">Hitos</Typography>
              </Stack>
              <Typography variant="h5" fontWeight={700}>
                {projects.reduce((a, p) => a + (p.milestones?.filter((m: any) => m.completed).length ?? 0), 0)}
                <Typography component="span" variant="caption" color="text.secondary">
                  /{projects.reduce((a, p) => a + (p.milestones?.length ?? 0), 0)}
                </Typography>
              </Typography>
              <Typography variant="caption" color="text.secondary">completados</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5} mb={0.5}>
                <PeopleIcon fontSize="small" color="action" />
                <Typography variant="caption" fontWeight={700} textTransform="uppercase">Incidencias</Typography>
              </Stack>
              <Typography variant="h5" fontWeight={700}>
                {projects.reduce((a, p) => a + (p.incidents?.length ?? 0), 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">registradas</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Estado de descarga */}
        {downloaded ? (
          <Alert severity="success" icon={<CheckCircleIcon />}>
            Reporte descargado. Ya puedes confirmar el cierre.
          </Alert>
        ) : (
          <Alert severity="info">
            Descarga el reporte PDF para habilitar el botón de cierre.
          </Alert>
        )}

        {/* Contenido imprimible oculto */}
        <Box ref={printRef} style={{ display: 'none' }}>
          <PrintableReport season={season} projects={projects} />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onCancel} color="inherit" variant="outlined" disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<DownloadIcon />}
          disabled={generating}
          onClick={handleDownload}
        >
          {generating ? 'Generando PDF...' : 'Descargar reporte PDF'}
        </Button>
        <Button
          variant="contained"
          color="warning"
          startIcon={<LockIcon />}
          disabled={!downloaded || saving}
          onClick={onConfirm}
        >
          {saving ? 'Cerrando...' : 'Confirmar cierre'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
