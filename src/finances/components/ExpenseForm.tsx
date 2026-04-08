import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import type { Expense, ExpenseCategory } from '../types/expense';
import type { Currency } from '../types/donor';

interface ProjectOption { id: string; title: string; }

interface Props {
  onAdd: (expense: Omit<Expense, 'id'>) => void;
  isLoading: boolean;
  projects?: ProjectOption[];
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

export const ExpenseForm = ({ onAdd, isLoading, projects = [] }: Props) => {
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const { register, handleSubmit, reset } = useForm<FormInputs>({
    defaultValues: { currency: 'PEN', category: 'otros' },
  });

  const onSubmit = (data: FormInputs) => {
    onAdd({
      ...data,
      amount: Number(data.amount),
      date: new Date().toISOString(),
      ...(selectedProjectId && { projectId: selectedProjectId }),
    });
    reset({ currency: 'PEN', category: 'otros' });
    setSelectedProjectId('');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>

        {/* Proyecto destino */}
        {projects.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <TextField
              select
              label="Proyecto destino"
              fullWidth
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              helperText="¿A qué proyecto corresponde este gasto?"
            >
              <MenuItem value="">
                <Typography variant="body2" color="text.secondary">
                  Gasto general de temporada
                </Typography>
              </MenuItem>
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id}>📁 {p.title}</MenuItem>
              ))}
            </TextField>
          </Grid>
        )}

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
            slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
            {...register('amount', { required: true, min: 0 })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField select label="Moneda" fullWidth defaultValue="PEN" {...register('currency')}>
            <MenuItem value="PEN">Soles (PEN)</MenuItem>
            <MenuItem value="USD">Dólares (USD)</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField select label="Categoría" fullWidth defaultValue="otros" {...register('category')}>
            {categories.map((c) => (
              <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField label="Notas (opcional)" fullWidth multiline rows={2} {...register('notes')} />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Button type="submit" variant="contained" color="error" disabled={isLoading} fullWidth>
            {isLoading ? 'Registrando...' : 'Registrar gasto'}
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};
