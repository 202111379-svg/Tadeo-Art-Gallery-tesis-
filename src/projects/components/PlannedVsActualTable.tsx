import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import type { Actividad } from '../types/activity';
import { calcularDesviacionDias, calcularDuracionDias } from '../utils/project-business-rules';

interface Props {
  actividades: Actividad[];
}

const fmtMoney = (value: number) =>
  new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(value);

const fmtDias = (dias: number | null) =>
  dias === null ? '-' : `${dias} día${dias === 1 ? '' : 's'}`;

const fmtDesviacion = (dias: number | null) => {
  if (dias === null) return '-';
  if (dias === 0) return 'A tiempo';
  if (dias > 0) return `+${dias} día${dias === 1 ? '' : 's'} (retraso)`;
  return `${dias} día${dias === -1 ? '' : 's'} (adelanto)`;
};

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
            <TableCell align="right">Duración Estimada</TableCell>
            <TableCell align="right">Duración Real</TableCell>
            <TableCell align="right">Desviación de Tiempo</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {[...actividades]
            .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
            .map((actividad) => {
            const diferencia = actividad.costo_real - actividad.costo_planificado;
            const duracionPlan = calcularDuracionDias(
              actividad.fecha_planificada,
              actividad.fecha_fin_planificada
            );
            const duracionReal = calcularDuracionDias(
              actividad.fecha_inicio_real,
              actividad.fecha_real
            );
            const desviacion = calcularDesviacionDias(
              actividad.fecha_fin_planificada ?? actividad.fecha_planificada,
              actividad.fecha_real
            );

            return (
              <TableRow key={actividad.id} hover>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography variant="body2" fontWeight={600}>
                      {actividad.nombre_actividad}
                    </Typography>
                    {actividad.no_planificada && (
                      <Chip label="No planificada" size="small" color="warning" variant="outlined" />
                    )}
                  </Stack>
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
                <TableCell align="right">{fmtDias(duracionPlan)}</TableCell>
                <TableCell align="right">{fmtDias(duracionReal)}</TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color={
                      desviacion === null
                        ? 'text.secondary'
                        : desviacion > 0
                          ? 'error.main'
                          : desviacion < 0
                            ? 'success.main'
                            : 'text.primary'
                    }
                  >
                    {fmtDesviacion(desviacion)}
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
