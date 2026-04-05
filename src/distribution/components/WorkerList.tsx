import { useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';

import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import type { Worker } from '../types/items';

interface Props {
  workers: Worker[];
  onDeleteWorker: (id: string) => void;
}

const fmt = (amount: number, currency: string) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(amount);

export const WorkerList = ({ workers, onDeleteWorker }: Props) => {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const pendingWorker = workers.find((w) => w.id === pendingId);

  if (workers.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3, fontStyle: 'italic' }}>
        No hay trabajadores en este sector
      </Typography>
    );
  }

  const totalPEN = workers.filter((w) => w.currency === 'PEN').reduce((s, w) => s + w.salary, 0);
  const totalUSD = workers.filter((w) => w.currency === 'USD').reduce((s, w) => s + w.salary, 0);

  return (
    <>
      {/* Resumen de sueldos */}
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: 'success.main', borderColor: 'success.main' }}>
        <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
          {totalPEN > 0 && (
            <Typography variant="subtitle2" fontWeight={700} color="white">
              Total PEN: {fmt(totalPEN, 'PEN')}
            </Typography>
          )}
          {totalUSD > 0 && (
            <Typography variant="subtitle2" fontWeight={700} color="white">
              Total USD: {fmt(totalUSD, 'USD')}
            </Typography>
          )}
        </Stack>
      </Paper>

      <Stack spacing={1}>
        {workers.map((worker) => (
          <Paper key={worker.id} variant="outlined" sx={{ p: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {worker.name}
                </Typography>
                <Stack direction="row" spacing={1} mt={0.5} flexWrap="wrap">
                  <Chip label={worker.role} size="small" variant="outlined" />
                  <Chip
                    label={fmt(worker.salary, worker.currency)}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Stack>
              </Box>
              <IconButton size="small" color="error" onClick={() => setPendingId(worker.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Paper>
        ))}
      </Stack>

      <ConfirmDialog
        open={!!pendingId}
        title="Eliminar trabajador"
        description={`¿Eliminar a "${pendingWorker?.name ?? ''}" del sector? Su gasto de sueldo también será eliminado de Finanzas.`}
        onConfirm={() => { if (pendingId) onDeleteWorker(pendingId); setPendingId(null); }}
        onCancel={() => setPendingId(null)}
      />
    </>
  );
};
