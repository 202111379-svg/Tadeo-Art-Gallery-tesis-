import { useState } from 'react';
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
import type { Donor } from '../types/donor';

interface Props {
  donors: Donor[];
  onDelete: (id: string) => void;
}

const fmt = (amount: number, currency: string) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(amount);

const donorName = (d: Donor) =>
  d.type === 'individual' ? `${d.firstName} ${d.lastName}` : d.organizationName;

export const DonorsTable = ({ donors, onDelete }: Props) => {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const pending = donors.find((d) => d.id === pendingId);

  if (donors.length === 0)
    return (
      <Typography color="text.secondary" sx={{ mt: 2 }}>
        No hay donantes registrados.
      </Typography>
    );

  return (
    <>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Tipo</TableCell>
              <TableCell>Nombre / Institución</TableCell>
              <TableCell>RUC / DNI</TableCell>
              <TableCell>Contacto</TableCell>
              <TableCell align="right">Monto</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {donors.map((d) => (
              <TableRow key={d.id} hover>
                <TableCell>
                  <Chip
                    size="small"
                    label={d.type === 'individual' ? 'Persona' : 'Empresa'}
                    color={d.type === 'individual' ? 'primary' : 'secondary'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{donorName(d)}</TableCell>
                <TableCell>{d.ruc || '—'}</TableCell>
                <TableCell>
                  {d.type === 'individual'
                    ? `${d.email || ''} ${d.phone || ''}`.trim() || '—'
                    : `${d.contactEmail || ''} ${d.contactPhone || ''}`.trim() || '—'}
                </TableCell>
                <TableCell align="right">{fmt(d.amount, d.currency)}</TableCell>
                <TableCell>{new Date(d.date).toLocaleDateString('es-PE')}</TableCell>
                <TableCell>
                  <IconButton size="small" color="error" onClick={() => setPendingId(d.id)}>
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
        title="Eliminar donante"
        description={`¿Eliminar el registro de "${pending ? donorName(pending) : ''}"? Esta acción no se puede deshacer.`}
        onConfirm={() => { if (pendingId) onDelete(pendingId); setPendingId(null); }}
        onCancel={() => setPendingId(null)}
      />
    </>
  );
};
