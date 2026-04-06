import { useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

import { DonorForm } from '../components/DonorForm';
import { DonorsTable } from '../components/DonorsTable';
import { ExpenseForm } from '../components/ExpenseForm';
import { ExpensesTable } from '../components/ExpensesTable';
import { useDonors } from '../hooks/useDonors';
import { useExpenses } from '../hooks/useExpenses';
import { useSeasonContext } from '../../seasons/context/SeasonContext';
import type { Donor } from '../types/donor';
import type { Expense } from '../types/expense';

const formatPEN = (n: number) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n);

const SummaryCard = ({
  icon,
  label,
  amount,
  chipLabel,
  accentColor,
}: {
  icon: React.ReactNode;
  label: string;
  amount: string;
  chipLabel?: string;
  accentColor: 'success' | 'error' | 'primary' | 'warning';
}) => (
  <Paper
    variant="outlined"
    sx={{
      p: 2.5,
      borderLeftWidth: 4,
      borderLeftStyle: 'solid',
      borderLeftColor: `${accentColor}.main`,
    }}
  >
    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
      <Box sx={{ color: `${accentColor}.main`, display: 'flex' }}>{icon}</Box>
      <Typography variant="subtitle2" color="text.secondary">
        {label}
      </Typography>
    </Stack>
    <Typography variant="h5" fontWeight={700} color={`${accentColor}.main`}>
      {amount}
    </Typography>
    {chipLabel && (
      <Chip
        size="small"
        label={chipLabel}
        color={accentColor}
        variant="outlined"
        sx={{ mt: 0.5 }}
      />
    )}
  </Paper>
);

export const FinancesView = () => {
  const [tab, setTab] = useState(0);
  const { activeSeason } = useSeasonContext();
  const { query: donorsQuery, add: addDonor, remove: removeDonor } = useDonors();
  const { query: expensesQuery, add: addExpense, remove: removeExpense } = useExpenses();

  const donors = donorsQuery.data ?? [];
  const expenses = expensesQuery.data ?? [];

  const totalIncomePEN = donors.filter((d) => d.currency === 'PEN').reduce((a, d) => a + d.amount, 0);
  const totalIncomeUSD = donors.filter((d) => d.currency === 'USD').reduce((a, d) => a + d.amount, 0);
  const totalExpensePEN = expenses.filter((e) => e.currency === 'PEN').reduce((a, e) => a + e.amount, 0);
  const totalExpenseUSD = expenses.filter((e) => e.currency === 'USD').reduce((a, e) => a + e.amount, 0);
  const balancePEN = totalIncomePEN - totalExpensePEN;
  const balanceUSD = totalIncomeUSD - totalExpenseUSD;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Finanzas
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Registro de ingresos (donaciones) y gastos del proyecto.
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {/* Tarjetas de resumen */}
      <Grid container spacing={2} mb={4}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            icon={<AttachMoneyIcon />}
            label="Ingresos"
            amount={formatPEN(totalIncomePEN)}
            chipLabel={totalIncomeUSD > 0 ? `+ ${totalIncomeUSD.toFixed(2)} USD` : undefined}
            accentColor="success"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            icon={<MoneyOffIcon />}
            label="Gastos"
            amount={formatPEN(totalExpensePEN)}
            chipLabel={totalExpenseUSD > 0 ? `- ${totalExpenseUSD.toFixed(2)} USD` : undefined}
            accentColor="error"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            icon={<AccountBalanceIcon />}
            label="Balance (PEN)"
            amount={formatPEN(balancePEN)}
            chipLabel={
              totalIncomeUSD > 0 || totalExpenseUSD > 0
                ? `USD: ${balanceUSD.toFixed(2)}`
                : undefined
            }
            accentColor={balancePEN >= 0 ? 'primary' : 'warning'}
          />
        </Grid>
      </Grid>

      {/* Tabs */}
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
            />
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography variant="h6" gutterBottom>Historial de donaciones</Typography>
            <DonorsTable donors={donors} onDelete={(id) => removeDonor.mutate(id)} />
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
            />
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography variant="h6" gutterBottom>Historial de gastos</Typography>
            <ExpensesTable expenses={expenses} onDelete={(id) => removeExpense.mutate(id)} />
          </Grid>
        </Grid>
      )}
    </Container>
  );
};
