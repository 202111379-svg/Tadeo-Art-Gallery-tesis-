import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import type { Actividad } from '../types/activity';

interface Props {
  actividades: Actividad[];
}

const fmtMoney = (value: number) =>
  new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(value);

const fmtDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString('es-PE') : '-';

export const PlannedVsActualTable = ({ actividades }: Props) => {
  if (actividades.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No hay actividades registradas para comparar.
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Actividad</TableCell>
            <TableCell align="right">Costo Planificado</TableCell>
            <TableCell align="right">Costo Real</TableCell>
            <TableCell align="right">Diferencia</TableCell>
            <TableCell>Fecha Planificada</TableCell>
            <TableCell>Fecha Real</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {actividades.map((actividad) => {
            const diferencia = actividad.costo_real - actividad.costo_planificado;

            return (
              <TableRow key={actividad.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {actividad.nombre_actividad}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {actividad.estado}
                  </Typography>
                </TableCell>
                <TableCell align="right">{fmtMoney(actividad.costo_planificado)}</TableCell>
                <TableCell align="right">{fmtMoney(actividad.costo_real)}</TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color={diferencia > 0 ? 'error.main' : diferencia < 0 ? 'success.main' : 'text.primary'}
                  >
                    {diferencia > 0 ? '+' : ''}
                    {fmtMoney(diferencia)}
                  </Typography>
                </TableCell>
                <TableCell>{fmtDate(actividad.fecha_planificada)}</TableCell>
                <TableCell>{fmtDate(actividad.fecha_real)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
