import { useForm } from 'react-hook-form';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

import type { Expense, ExpenseCategory } from '../types/expense';
import type { Currency } from '../types/donor';

interface Props {
  onAdd: (expense: Omit<Expense, 'id'>) => void;
  isLoading: boolean;
}

interface FormInputs {
  description: string;
  amount: number;
  currency: Currency;
  category: ExpenseCategory;
  notes: string;
}

const categories: { value: ExpenseCategory; label: string }[] = [
  { value: 'materiales', label: 'Materiales' },
  { value: 'personal', label: 'Personal' },
  { value: 'infraestructura', label: 'Infraestructura' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'otros', label: 'Otros' },
];

export const ExpenseForm = ({ onAdd, isLoading }: Props) => {
  const { register, handleSubmit, reset } = useForm<FormInputs>({
    defaultValues: { currency: 'PEN', category: 'otros' },
  });

  const onSubmit = (data: FormInputs) => {
    onAdd({
      ...data,
      amount: Number(data.amount),
      date: new Date().toISOString(),
    });
    reset({ currency: 'PEN', category: 'otros' });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <TextField
            label="Descripción del gasto"
            fullWidth
            required
            {...register('description', { required: true })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            label="Cantidad"
            type="number"
            fullWidth
            required
            inputProps={{ min: 0, step: '0.01' }}
            {...register('amount', { required: true, min: 0 })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            select
            label="Moneda"
            fullWidth
            defaultValue="PEN"
            {...register('currency')}
          >
            <MenuItem value="PEN">Soles (PEN)</MenuItem>
            <MenuItem value="USD">Dólares (USD)</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            select
            label="Categoría"
            fullWidth
            defaultValue="otros"
            {...register('category')}
          >
            {categories.map((c) => (
              <MenuItem key={c.value} value={c.value}>
                {c.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            label="Notas (opcional)"
            fullWidth
            multiline
            rows={2}
            {...register('notes')}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Button
            type="submit"
            variant="contained"
            color="error"
            disabled={isLoading}
            fullWidth
          >
            {isLoading ? 'Registrando...' : 'Registrar gasto'}
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};
