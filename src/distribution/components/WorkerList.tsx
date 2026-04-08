import { useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import type { Worker } from '../types/items';
import type { Project } from '../../projects/types/project';

interface Props {
  workers: Worker[];
  projects?: Project[];
  onDeleteWorker: (id: string) => void;
  onReassignProject?: (workerId: string, projectId: string) => void;
}

const fmt = (amount: number, currency: string) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(amount);

export const WorkerList = ({ workers, projects = [], onDeleteWorker, onReassignProject }: Props) => {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectValue, setEditProjectValue] = useState('');
  const pendingWorker = workers.find((w) => w.id === pendingId);

  const startEditProject = (worker: Worker) => {
    setEditingProjectId(worker.id);
    setEditProjectValue(worker.projectId ?? '');
  };

  const confirmEditProject = (workerId: string) => {
    onReassignProject?.(workerId, editProjectValue);
    setEditingProjectId(null);
  };

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
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>{worker.name}</Typography>

                <Stack direction="row" spacing={1} mt={0.5} flexWrap="wrap" alignItems="center">
                  <Chip label={worker.role} size="small" variant="outlined" />
                  <Chip label={fmt(worker.salary, worker.currency)} size="small" color="primary" variant="outlined" />

                  {/* Proyecto asignado — editable */}
                  {editingProjectId === worker.id ? (
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Select
                        size="small"
                        value={editProjectValue}
                        onChange={(e) => setEditProjectValue(e.target.value)}
                        sx={{ fontSize: '0.75rem', height: 24, minWidth: 160 }}
                      >
                        <MenuItem value="">Sin proyecto</MenuItem>
                        {projects.map((p) => (
                          <MenuItem key={p.id} value={p.id}>{p.title}</MenuItem>
                        ))}
                      </Select>
                      <Tooltip title="Confirmar">
                        <IconButton size="small" color="success" onClick={() => confirmEditProject(worker.id)}>
                          <CheckIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Cancelar">
                        <IconButton size="small" onClick={() => setEditingProjectId(null)}>
                          <CloseIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  ) : (
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      {worker.projectTitle ? (
                        <Chip label={`📁 ${worker.projectTitle}`} size="small" color="secondary" variant="outlined" />
                      ) : (
                        <Typography variant="caption" color="text.disabled" fontStyle="italic">
                          Sin proyecto
                        </Typography>
                      )}
                      {onReassignProject && (
                        <Tooltip title="Cambiar proyecto">
                          <IconButton size="small" onClick={() => startEditProject(worker)}>
                            <EditIcon sx={{ fontSize: 13 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  )}
                </Stack>
              </Box>

              <IconButton size="small" color="error" onClick={() => setPendingId(worker.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Stack>
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
