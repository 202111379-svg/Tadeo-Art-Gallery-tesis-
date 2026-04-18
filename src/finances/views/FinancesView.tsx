import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import FolderIcon from '@mui/icons-material/Folder';
import PublicIcon from '@mui/icons-material/Public';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { DonorForm } from '../components/DonorForm';
import { DonorsTable } from '../components/DonorsTable';
import { ExpenseForm } from '../components/ExpenseForm';
import { ExpensesTable } from '../components/ExpensesTable';
import { useDonors } from '../hooks/useDonors';
import { useExpenses } from '../hooks/useExpenses';
import { useExchangeRate } from '../hooks/useExchangeRate';
import { useSeasonContext } from '../../seasons/context/SeasonContext';
import { useProjects } from '../../projects/hooks/useProjects';
import type { Donor } from '../types/donor';
import type { Expense } from '../types/expense';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n);

const SummaryCard = ({
  icon, label, amount, sub, accentColor,
}: {
  icon: React.ReactNode;
  label: string;
  amount: string;
  sub?: React.ReactNode;
  accentColor: 'success' | 'error' | 'primary' | 'warning';
}) => (
  <Paper
    variant="outlined"
    sx={{ p: 2.5, borderLeftWidth: 4, borderLeftStyle: 'solid', borderLeftColor: `${accentColor}.main` }}
  >
    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
      <Box sx={{ color: `${accentColor}.main`, display: 'flex' }}>{icon}</Box>
      <Typography variant="subtitle2" color="text.secondary">{label}</Typography>
    </Stack>
    <Typography variant="h5" fontWeight={700} color={`${accentColor}.main`}>{amount}</Typography>
    {sub}
  </Paper>
);

export const FinancesView = () => {
  const [tab, setTab] = useState(0);
  const [rateInput, setRateInput] = useState('');
  const [rateSaved, setRateSaved] = useState(false);

  const { activeSeason } = useSeasonContext();
  const { data: projects = [] } = useProjects();
  const { query: donorsQuery, add: addDonor, remove: removeDonor } = useDonors();
  const { query: expensesQuery, add: addExpense, remove: removeExpense } = useExpenses();
  const { rate, updateRate, toPEN } = useExchangeRate();

  const donors = donorsQuery.data ?? [];
  const expenses = expensesQuery.data ?? [];

  // ── Totales generales ──────────────────────────────────────────────────────
  const totalIncomePEN  = donors.reduce((a, d) => a + toPEN(d.amount, d.currency), 0);
  const totalExpensePEN = expenses.reduce((a, e) => a + toPEN(e.amount, e.currency), 0);
  const balancePEN = totalIncomePEN - totalExpensePEN;

  const incomeUSD  = donors.filter((d) => d.currency === 'USD').reduce((a, d) => a + d.amount, 0);
  const expenseUSD = expenses.filter((e) => e.currency === 'USD').reduce((a, e) => a + e.amount, 0);
  const hasUSD = incomeUSD > 0 || expenseUSD > 0;

  // Mapa projectId → title para la tabla de gastos
  const projectMap = Object.fromEntries(
    projects.map((p) => [p.id, p.title])
  );
  const expensesByProject = expenses.filter((e) => !!e.projectId);
  const expensesGeneral   = expenses.filter((e) => !e.projectId);

  const totalByProjectPEN = expensesByProject.reduce((a, e) => a + toPEN(e.amount, e.currency), 0);
  const totalGeneralPEN   = expensesGeneral.reduce((a, e) => a + toPEN(e.amount, e.currency), 0);

  // Agrupar gastos por proyecto para mostrar resumen
  const projectExpenseSummary = projects
    .filter((p) => expensesByProject.some((e) => e.projectId === p.id))
    .map((p) => ({
      title: p.title,
      total: expensesByProject
        .filter((e) => e.projectId === p.id)
        .reduce((a, e) => a + toPEN(e.amount, e.currency), 0),
    }));

  const handleSaveRate = async () => {
    const n = parseFloat(rateInput);
    if (!n || n <= 0) return;
    await updateRate(n);
    setRateInput('');
    setRateSaved(true);
    setTimeout(() => setRateSaved(false), 3000);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>Finanzas</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Registro de ingresos y gastos de la temporada.
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {/* ── Tipo de cambio ── */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
            <AttachMoneyIcon color="action" fontSize="small" />
            <Typography variant="subtitle2" fontWeight={600}>Tipo de cambio USD → PEN</Typography>
            <Tooltip title="Convierte dólares a soles para el balance. El monto original siempre queda registrado." arrow>
              <InfoOutlinedIcon fontSize="small" color="action" sx={{ cursor: 'help' }} />
            </Tooltip>
            <Chip label={`TC: S/ ${rate.toFixed(2)}`} size="small" color="primary" variant="outlined" />
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              type="number"
              placeholder="Ej: 3.85"
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRate(); }}
              slotProps={{
                htmlInput: { min: 0.01, step: '0.01' },
                input: { startAdornment: <InputAdornment position="start">S/</InputAdornment> },
              }}
              sx={{ width: 140 }}
            />
            <Typography variant="body2" color="primary" fontWeight={600}
              sx={{ cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={handleSaveRate}>
              Actualizar TC
            </Typography>
          </Stack>
        </Stack>
        {rateSaved && <Alert severity="success" sx={{ mt: 1.5, py: 0 }}>Tipo de cambio actualizado.</Alert>}
      </Paper>

      {/* ── Tarjetas de resumen ── */}
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard icon={<AttachMoneyIcon />} label="Ingresos (PEN)" amount={fmt(totalIncomePEN)}
            accentColor="success"
            sub={incomeUSD > 0 && <Typography variant="caption" color="text.secondary">Incluye ${incomeUSD.toFixed(2)} USD × {rate.toFixed(2)}</Typography>}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard icon={<MoneyOffIcon />} label="Gastos (PEN)" amount={fmt(totalExpensePEN)}
            accentColor="error"
            sub={expenseUSD > 0 && <Typography variant="caption" color="text.secondary">Incluye ${expenseUSD.toFixed(2)} USD × {rate.toFixed(2)}</Typography>}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard icon={<AccountBalanceIcon />} label="Balance (PEN)" amount={fmt(balancePEN)}
            accentColor={balancePEN >= 0 ? 'primary' : 'warning'}
            sub={hasUSD && <Typography variant="caption" color="text.secondary">TC: S/ {rate.toFixed(2)} por USD</Typography>}
          />
        </Grid>
      </Grid>

      {/* ── Desglose de gastos ── */}
      {expenses.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} mb={1.5}>
            Desglose de gastos
          </Typography>
          <Grid container spacing={2}>
            {/* Gastos por proyecto */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <FolderIcon fontSize="small" color="primary" />
                <Typography variant="body2" fontWeight={600}>Gastos por proyecto</Typography>
                <Chip label={fmt(totalByProjectPEN)} size="small" color="primary" variant="outlined" />
              </Stack>
              {projectExpenseSummary.length > 0 ? (
                <Stack spacing={0.75}>
                  {projectExpenseSummary.map((p) => (
                    <Stack key={p.title} direction="row" justifyContent="space-between" alignItems="center"
                      sx={{ bgcolor: 'action.hover', borderRadius: 1, px: 1.5, py: 0.5 }}>
                      <Typography variant="caption" color="text.primary" fontWeight={500}>
                        📁 {p.title}
                      </Typography>
                      <Typography variant="caption" fontWeight={700} color="error.main">
                        {fmt(p.total)}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Typography variant="caption" color="text.disabled" fontStyle="italic">
                  Ningún gasto vinculado a proyectos aún
                </Typography>
              )}
            </Grid>

            {/* Gastos generales */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <PublicIcon fontSize="small" color="action" />
                <Typography variant="body2" fontWeight={600}>Gastos generales</Typography>
                <Chip label={fmt(totalGeneralPEN)} size="small" variant="outlined" />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {expensesGeneral.length > 0
                  ? `${expensesGeneral.length} gasto(s) de operación general — personal compartido entre eventos, infraestructura, etc.`
                  : 'Sin gastos generales registrados.'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* ── Tabs ── */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label={`Ingresos (${donors.length})`} />
        <Tab label={`Gastos (${expenses.length})`} />
      </Tabs>

      {tab === 0 && (
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Typography variant="h6" gutterBottom>Registrar donante</Typography>
            <DonorForm
              onAdd={(donor) => addDonor.mutate({ ...donor, seasonId: activeSeason?.id } as Omit<Donor, 'id'>)}
              isLoading={addDonor.isPending}
              projects={projects.filter((p) => p.status !== 'closed').map((p) => ({ id: p.id, title: p.title }))}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography variant="h6" gutterBottom>Historial de donaciones</Typography>
            <DonorsTable
              donors={donors}
              onDelete={(id) => removeDonor.mutate(id)}
              projectMap={projectMap}
            />
          </Grid>
        </Grid>
      )}

      {tab === 1 && (
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Typography variant="h6" gutterBottom>Registrar gasto</Typography>
            <ExpenseForm
              onAdd={(expense) => addExpense.mutate({ ...expense, seasonId: activeSeason?.id } as Omit<Expense, 'id'>)}
              isLoading={addExpense.isPending}
              projects={projects.filter((p) => p.status !== 'closed').map((p) => ({ id: p.id, title: p.title, budgetItems: p.budgetItems }))}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography variant="h6" gutterBottom>Historial de gastos</Typography>
            <ExpensesTable
              expenses={expenses}
              onDelete={(id) => removeExpense.mutate(id)}
              projectMap={projectMap}
            />
          </Grid>
        </Grid>
      )}
    </Container>
  );
};
