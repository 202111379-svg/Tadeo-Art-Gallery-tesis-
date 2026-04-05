import { useState } from 'react';
import Box from '@mui/material/Box';
import DeleteIcon from '@mui/icons-material/Delete';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import type { Expense } from '../types/expense';

interface Props {
  expenses: Expense[];
  onDelete: (id: string) => void;
}

const fmt = (amount: number, currency: string) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(amount);

export const ExpensesTable = ({ expenses, onDelete }: Props) => {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const pending = expenses.find((e) => e.id === pendingId);

  if (expenses.length === 0)
    return (
      <Typography color="text.secondary" sx={{ mt: 2 }}>
        No hay gastos registrados.
      </Typography>
    );

  return (
    <>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Descripción</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell align="right">Monto</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Notas</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.map((e) => (
              <TableRow key={e.id} hover sx={{ opacity: e.workerStatus === 'terminated' ? 0.7 : 1 }}>
                <TableCell>
                  <Box>
                    {e.description}
                    {e.workerStatus === 'terminated' && (
                      <Chip
                        label="Trabajador dado de baja"
                        size="small"
                        color="warning"
                        variant="outlined"
                        sx={{ ml: 1, fontSize: '0.65rem', height: 18 }}
                      />
                    )}
                    {e.workerStatus === 'active' && (
                      <Chip
                        label="Activo"
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ ml: 1, fontSize: '0.65rem', height: 18 }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip size="small" label={e.category} variant="outlined" />
                </TableCell>
                <TableCell align="right">{fmt(e.amount, e.currency)}</TableCell>
                <TableCell>{new Date(e.date).toLocaleDateString('es-PE')}</TableCell>
                <TableCell>{e.notes || '—'}</TableCell>
                <TableCell>
                  <IconButton size="small" color="error" onClick={() => setPendingId(e.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <ConfirmDialog
        open={!!pendingId}
        title="Eliminar gasto"
        description={`¿Eliminar el gasto "${pending?.description ?? ''}"? Esta acción no se puede deshacer.`}
        onConfirm={() => { if (pendingId) onDelete(pendingId); setPendingId(null); }}
        onCancel={() => setPendingId(null)}
      />
    </>
  );
};
