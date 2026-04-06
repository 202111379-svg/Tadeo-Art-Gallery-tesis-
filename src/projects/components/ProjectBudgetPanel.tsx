import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { useProjectFinances } from '../hooks/useProjectFinances';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n);

interface Props {
  projectId: string;
  budget?: number;
}

export const ProjectBudgetPanel = ({ projectId, budget }: Props) => {
  const {
    expenses,
    isLoading,
    totalSpentPEN,
    budgetPEN,
    remainingPEN,
    usedPercent,
    exchangeRate,
    isOverBudget,
  } = useProjectFinances(projectId, budget);

  if (isLoading) return null;

  const hasBudget = budgetPEN > 0;
  const barColor = usedPercent >= 90 ? 'error' : usedPercent >= 70 ? 'warning' : 'success';

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <AccountBalanceWalletIcon color="primary" fontSize="small" />
        <Typography variant="subtitle1" fontWeight={600}>
          Presupuesto del proyecto
        </Typography>
        <Typography variant="caption" color="text.secondary">
          (TC: S/ {exchangeRate.toFixed(2)} por USD)
        </Typography>
      </Stack>

      {/* Resumen */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
        <Paper variant="outlined" sx={{ p: 1.5, flex: 1, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary" display="block">
            Presupuesto asignado
          </Typography>
          <Typography variant="h6" fontWeight={700} color="primary.main">
            {hasBudget ? fmt(budgetPEN) : 'Sin asignar'}
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 1.5, flex: 1, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary" display="block">
            Gastado
          </Typography>
          <Typography variant="h6" fontWeight={700} color="error.main">
            {fmt(totalSpentPEN)}
          </Typography>
        </Paper>
        <Paper
          variant="outlined"
          sx={{
            p: 1.5, flex: 1, textAlign: 'center',
            borderColor: isOverBudget ? 'error.main' : 'divider',
          }}
        >
          <Typography variant="caption" color="text.secondary" display="block">
            Disponible
          </Typography>
          <Typography
            variant="h6"
            fontWeight={700}
            color={isOverBudget ? 'error.main' : 'success.main'}
          >
            {hasBudget ? fmt(remainingPEN) : '—'}
          </Typography>
        </Paper>
      </Stack>

      {/* Barra de progreso */}
      {hasBudget && (
        <Box mb={2}>
          <Stack direction="row" justifyContent="space-between" mb={0.5}>
            <Typography variant="caption" color="text.secondary">
              Uso del presupuesto
            </Typography>
            <Typography variant="caption" fontWeight={600}>
              {usedPercent.toFixed(1)}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={usedPercent}
            color={barColor}
            sx={{ height: 10, borderRadius: 5 }}
          />
          {isOverBudget && (
            <Stack direction="row" alignItems="center" spacing={0.5} mt={0.5}>
              <WarningAmberIcon color="error" sx={{ fontSize: 14 }} />
              <Typography variant="caption" color="error">
                Presupuesto excedido en {fmt(Math.abs(remainingPEN))}
              </Typography>
            </Stack>
          )}
        </Box>
      )}

      {/* Tabla de gastos del proyecto */}
      {expenses.length > 0 && (
        <>
          <Divider sx={{ mb: 1.5 }} />
          <Typography variant="subtitle2" fontWeight={600} mb={1}>
            Gastos registrados ({expenses.length})
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell align="right">Monto</TableCell>
                  <TableCell align="right">En PEN</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expenses.map((e) => (
                  <TableRow key={e.id} hover>
                    <TableCell>{e.description}</TableCell>
                    <TableCell>
                      <Chip label={e.category} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      {new Intl.NumberFormat('es-PE', {
                        style: 'currency',
                        currency: e.currency,
                      }).format(e.amount)}
                    </TableCell>
                    <TableCell align="right">
                      {e.currency === 'USD'
                        ? fmt(e.amount * exchangeRate)
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {expenses.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          No hay gastos registrados para este proyecto aún.
        </Typography>
      )}
    </Box>
  );
};
