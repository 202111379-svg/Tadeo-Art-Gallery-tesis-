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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

import { useProjectFinances } from '../hooks/useProjectFinances';
import type { BudgetItem } from '../types/budget-item';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n);

interface Props {
  projectId: string;
  budget?: number;
  budgetItems?: BudgetItem[];
}

export const ProjectBudgetPanel = ({ projectId, budget, budgetItems = [] }: Props) => {
  const {
    expenses,
    donors,
    isLoading,
    totalIncomePEN,
    totalSpentPEN,
    projectBalancePEN,
    budgetPEN,
    remainingBudgetPEN,
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
          Finanzas del proyecto
        </Typography>
        <Typography variant="caption" color="text.secondary">
          (TC: S/ {exchangeRate.toFixed(2)} por USD)
        </Typography>
      </Stack>

      {/* Resumen financiero */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
        {/* Ingresos propios */}
        <Paper variant="outlined" sx={{ p: 1.5, flex: 1, textAlign: 'center', borderColor: 'success.main' }}>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5} mb={0.5}>
            <TrendingUpIcon color="success" fontSize="small" />
            <Typography variant="caption" color="text.secondary">Ingresos del proyecto</Typography>
          </Stack>
          <Typography variant="h6" fontWeight={700} color="success.main">
            {fmt(totalIncomePEN)}
          </Typography>
          {donors.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              {donors.length} donación(es) vinculada(s)
            </Typography>
          )}
        </Paper>

        {/* Gastos propios */}
        <Paper variant="outlined" sx={{ p: 1.5, flex: 1, textAlign: 'center', borderColor: 'error.main' }}>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5} mb={0.5}>
            <TrendingDownIcon color="error" fontSize="small" />
            <Typography variant="caption" color="text.secondary">Gastos del proyecto</Typography>
          </Stack>
          <Typography variant="h6" fontWeight={700} color="error.main">
            {fmt(totalSpentPEN)}
          </Typography>
          {expenses.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              {expenses.length} gasto(s) registrado(s)
            </Typography>
          )}
        </Paper>

        {/* Balance real */}
        <Paper
          variant="outlined"
          sx={{
            p: 1.5, flex: 1, textAlign: 'center',
            borderColor: projectBalancePEN >= 0 ? 'primary.main' : 'warning.main',
          }}
        >
          <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
            Balance del proyecto
          </Typography>
          <Typography
            variant="h6"
            fontWeight={700}
            color={projectBalancePEN >= 0 ? 'primary.main' : 'warning.main'}
          >
            {fmt(projectBalancePEN)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {projectBalancePEN >= 0 ? 'Superávit' : 'Déficit'}
          </Typography>
        </Paper>

        {/* Presupuesto asignado (si existe) */}
        {hasBudget && (
          <Paper variant="outlined" sx={{ p: 1.5, flex: 1, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              Presupuesto asignado
            </Typography>
            <Typography variant="h6" fontWeight={700} color="text.primary">
              {fmt(budgetPEN)}
            </Typography>
            <Typography
              variant="caption"
              color={isOverBudget ? 'error.main' : 'success.main'}
              fontWeight={600}
            >
              {isOverBudget
                ? `Excedido en ${fmt(Math.abs(remainingBudgetPEN!))}`
                : `Disponible: ${fmt(remainingBudgetPEN!)}`}
            </Typography>
          </Paper>
        )}
      </Stack>

      {/* Barra de uso del presupuesto */}
      {hasBudget && (
        <Box mb={2}>
          <Stack direction="row" justifyContent="space-between" mb={0.5}>
            <Typography variant="caption" color="text.secondary">Uso del presupuesto</Typography>
            <Typography variant="caption" fontWeight={600}>{usedPercent.toFixed(1)}%</Typography>
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
                Presupuesto excedido en {fmt(Math.abs(remainingBudgetPEN!))}
              </Typography>
            </Stack>
          )}
        </Box>
      )}

      {/* Tabla comparativa: estimado vs real por ítem */}
      {budgetItems.length > 0 && (
        <>
          <Divider sx={{ mb: 1.5 }} />
          <Typography variant="subtitle2" fontWeight={600} mb={1}>
            Recursos planificados vs gastos reales
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Recurso</TableCell>
                  <TableCell align="right">Estimado</TableCell>
                  <TableCell align="right">Real</TableCell>
                  <TableCell align="right">Diferencia</TableCell>
                  <TableCell align="center">Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {budgetItems.map((item) => {
                  const linkedExpenses = expenses.filter((e) => e.budgetItemId === item.id);
                  const realPEN = linkedExpenses.reduce((a, e) => a + (e.currency === 'USD' ? e.amount * exchangeRate : e.amount), 0);
                  const estimatedPEN = item.currency === 'USD' ? item.estimatedUnitCost * item.quantity * exchangeRate : item.estimatedUnitCost * item.quantity;
                  const diff = estimatedPEN - realPEN;
                  const hasReal = linkedExpenses.length > 0;
                  const isOver = realPEN > estimatedPEN;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{item.name}</Typography>
                        <Typography variant="caption" color="text.secondary">× {item.quantity}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{fmt(estimatedPEN)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color={hasReal ? 'text.primary' : 'text.disabled'}>
                          {hasReal ? fmt(realPEN) : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {hasReal && (
                          <Typography variant="body2" fontWeight={600} color={isOver ? 'error.main' : 'success.main'}>
                            {isOver ? `+${fmt(Math.abs(diff))}` : `-${fmt(Math.abs(diff))}`}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {!hasReal
                          ? <HourglassEmptyIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                          : isOver
                          ? <WarningAmberIcon sx={{ fontSize: 16 }} color="error" />
                          : <CheckCircleIcon sx={{ fontSize: 16 }} color="success" />
                        }
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Tabla de gastos */}
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
                      {new Intl.NumberFormat('es-PE', { style: 'currency', currency: e.currency }).format(e.amount)}
                    </TableCell>
                    <TableCell align="right">
                      {e.currency === 'USD' ? fmt(e.amount * exchangeRate) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Tabla de donaciones vinculadas */}
      {donors.length > 0 && (
        <>
          <Divider sx={{ mb: 1.5, mt: 2 }} />
          <Typography variant="subtitle2" fontWeight={600} mb={1}>
            Donaciones vinculadas ({donors.length})
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Donante</TableCell>
                  <TableCell align="right">Monto</TableCell>
                  <TableCell>Fecha</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {donors.map((d) => (
                  <TableRow key={d.id} hover>
                    <TableCell>
                      {d.type === 'individual'
                        ? `${d.firstName} ${d.lastName}`
                        : d.organizationName}
                    </TableCell>
                    <TableCell align="right">
                      {new Intl.NumberFormat('es-PE', { style: 'currency', currency: d.currency }).format(d.amount)}
                    </TableCell>
                    <TableCell>{new Date(d.date).toLocaleDateString('es-PE')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {expenses.length === 0 && donors.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          No hay movimientos financieros registrados para este proyecto aún.
        </Typography>
      )}
    </Box>
  );
};
