import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { Sector, Worker } from '../types/items';
import { SectorForm, WorkerForm, SectorList, WorkerList } from '../components';
import { useAppSelector } from '../../store/reduxHooks';
import { useSeasonContext } from '../../seasons/context/SeasonContext';
import {
  getSectorsAction,
  addSectorAction,
  deleteSectorAction,
  addWorkerToSectorAction,
  removeWorkerFromSectorAction,
} from '../actions/distribution.action';
import {
  addExpenseAction,
  markWorkerExpensesAsTerminated,
} from '../../finances/actions/expenses.action';
import { queryClient } from '../../GalleryApp';

export const DistributionPage = () => {
  const { uid } = useAppSelector((s) => s.auth);
  const { activeSeason } = useSeasonContext();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    getSectorsAction(uid, activeSeason?.id)
      .then(setSectors)
      .catch((e) => setError(`Error al cargar sectores: ${e.message}`))
      .finally(() => setLoading(false));
  }, [uid, activeSeason?.id]);

  const selectedSector = sectors.find((s) => s.id === selectedSectorId);

  const addSector = async (sector: Omit<Sector, 'id' | 'workers'>) => {
    if (!uid) return;
    try {
      const newSector = await addSectorAction(uid, {
        ...sector,
        seasonId: activeSeason?.id,
      });
      setSectors((prev) => [...prev, newSector]);
      setError(null);
    } catch (e: any) {
      setError(`Error al agregar sector: ${e.message}`);
    }
  };

  const addWorker = async (worker: Omit<Worker, 'id'>) => {
    if (!selectedSectorId || !uid) return;
    const newWorker: Worker = { ...worker, id: Date.now().toString() };
    try {
      await addWorkerToSectorAction(uid, selectedSectorId, newWorker);

      // Registrar sueldo como gasto con trazabilidad de workerId y seasonId
      await addExpenseAction(uid, {
        description: `Sueldo: ${newWorker.name} (${newWorker.role}) — Sector: ${selectedSector?.name ?? ''}`,
        amount: newWorker.salary,
        currency: newWorker.currency,
        category: 'personal',
        date: newWorker.addedAt,
        notes: 'Registrado automáticamente desde Distribución de Personal',
        workerId: newWorker.id,
        workerStatus: 'active',
        seasonId: activeSeason?.id,
      });

      queryClient.invalidateQueries({ queryKey: ['expenses', uid, activeSeason?.id] });
      setSectors((prev) =>
        prev.map((s) =>
          s.id === selectedSectorId ? { ...s, workers: [...s.workers, newWorker] } : s
        )
      );
      setError(null);
    } catch (e: any) {
      setError(`Error al agregar trabajador: ${e.message}`);
    }
  };

  const deleteSector = async (sectorId: string) => {
    if (!uid) return;
    try {
      const sector = sectors.find((s) => s.id === sectorId);
      await deleteSectorAction(uid, sectorId);

      // Marcar como 'terminated' los gastos de todos los trabajadores del sector
      if (sector?.workers.length) {
        await Promise.all(
          sector.workers.map((w) => markWorkerExpensesAsTerminated(uid, w.id))
        );
        queryClient.invalidateQueries({ queryKey: ['expenses', uid, activeSeason?.id] });
      }

      setSectors((prev) => prev.filter((s) => s.id !== sectorId));
      if (selectedSectorId === sectorId) setSelectedSectorId(null);
      setError(null);
    } catch (e: any) {
      setError(`Error al eliminar sector: ${e.message}`);
    }
  };

  const deleteWorker = async (workerId: string) => {
    if (!selectedSectorId || !uid) return;
    const worker = selectedSector?.workers.find((w) => w.id === workerId);
    if (!worker) return;
    try {
      await removeWorkerFromSectorAction(uid, selectedSectorId, worker);

      // El gasto histórico se conserva pero se marca como 'terminated'
      await markWorkerExpensesAsTerminated(uid, worker.id);
      queryClient.invalidateQueries({ queryKey: ['expenses', uid, activeSeason?.id] });

      setSectors((prev) =>
        prev.map((s) =>
          s.id === selectedSectorId
            ? { ...s, workers: s.workers.filter((w) => w.id !== workerId) }
            : s
        )
      );
      setError(null);
    } catch (e: any) {
      setError(`Error al eliminar trabajador: ${e.message}`);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Distribución de Personal
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Organiza los sectores de la galería y asigna trabajadores. Los sueldos se registran automáticamente como gastos.
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Sectores</Typography>
            <Divider sx={{ mb: 2 }} />
            <SectorForm onAddSector={addSector} />
            <SectorList
              sectors={sectors}
              selectedSectorId={selectedSectorId}
              onSelectSector={setSelectedSectorId}
              onDeleteSector={deleteSector}
            />
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {selectedSector ? `Trabajadores — ${selectedSector.name}` : 'Trabajadores'}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {selectedSector ? (
              <>
                <WorkerForm onAddWorker={addWorker} />
                <WorkerList workers={selectedSector.workers} onDeleteWorker={deleteWorker} />
              </>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 6, fontStyle: 'italic' }}>
                Selecciona un sector para ver y gestionar sus trabajadores
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
