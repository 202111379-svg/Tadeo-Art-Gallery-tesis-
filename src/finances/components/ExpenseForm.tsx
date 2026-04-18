import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import type { Expense, ExpenseCategory } from '../types/expense';
import type { Currency } from '../types/donor';
import type { BudgetItem } from '../../projects/types/budget-item';

interface ProjectOption {
  id: string;
  title: string;
  budgetItems?: BudgetItem[];
}

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
  const [selectedBudgetItemId, setSelectedBudgetItemId] = useState('');

  const { control, handleSubmit, reset, setValue } = useForm<FormInputs>({
    defaultValues: { description: '', amount: 0, currency: 'PEN', category: 'otros', notes: '' },
  });

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const budgetItems = selectedProject?.budgetItems ?? [];

  const handleBudgetItemChange = (itemId: string) => {
    setSelectedBudgetItemId(itemId);
    if (!itemId) {
      setValue('description', '');
      setValue('amount', 0);
      return;
    }
    const item = budgetItems.find((b) => b.id === itemId);
    if (item) {
      // Mapear categoría de BudgetItem a ExpenseCategory
      const categoryMap: Record<string, ExpenseCategory> = {
        infrastructure: 'infraestructura',
        technology:     'materiales',
        marketing:      'marketing',
        personnel:      'personal',
        transport:      'materiales',
        catering:       'otros',
        other:          'otros',
      };
      setValue('description', `${item.name} × ${item.quantity}`);
      setValue('amount', item.estimatedUnitCost * item.quantity);
      setValue('currency', item.currency);
      setValue('category', categoryMap[item.category] ?? 'otros');
    }
  };

  const onSubmit = (data: FormInputs) => {
    onAdd({
      ...data,
      amount: Number(data.amount),
      date: new Date().toISOString(),
      ...(selectedProjectId && { projectId: selectedProjectId }),
      ...(selectedBudgetItemId && { budgetItemId: selectedBudgetItemId }),
    });
    reset({ description: '', amount: 0, currency: 'PEN', category: 'otros', notes: '' });
    setSelectedProjectId('');
    setSelectedBudgetItemId('');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>

        {/* Proyecto destino */}
        {projects.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <TextField select label="Proyecto destino" fullWidth
              value={selectedProjectId}
              onChange={(e) => { setSelectedProjectId(e.target.value); setSelectedBudgetItemId(''); setValue('description', ''); setValue('amount', 0); }}
              helperText="¿A qué proyecto corresponde este gasto?">
              <MenuItem value="">
                <Typography variant="body2" color="text.secondary">Gasto general de temporada</Typography>
              </MenuItem>
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id}>📁 {p.title}</MenuItem>
              ))}
            </TextField>
          </Grid>
        )}

        {/* Ítem de recursos planificados */}
        {selectedProjectId && budgetItems.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <TextField select label="Ítem planificado (opcional)" fullWidth
              value={selectedBudgetItemId}
              onChange={(e) => handleBudgetItemChange(e.target.value)}
              helperText="Vincula este gasto a un recurso planificado para comparar estimado vs real">
              <MenuItem value="">Sin vinculación</MenuItem>
              {budgetItems.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name} — Est: {new Intl.NumberFormat('es-PE', { style: 'currency', currency: item.currency }).format(item.estimatedUnitCost * item.quantity)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        )}

        <Grid size={{ xs: 12 }}>
          <Controller control={control} name="description"
            rules={{ required: true }}
            render={({ field }) => (
              <TextField label="Descripción del gasto" fullWidth required
                {...field}
                InputLabelProps={{ shrink: !!field.value }}
              />
            )} />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller control={control} name="amount"
            rules={{ required: true, min: 0 }}
            render={({ field }) => (
              <TextField label="Cantidad" type="number" fullWidth required
                {...field}
                value={field.value || ''}
                onChange={(e) => field.onChange(Number(e.target.value))}
                InputLabelProps={{ shrink: !!field.value }}
                slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
              />
            )} />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller control={control} name="currency"
            render={({ field }) => (
              <TextField select label="Moneda" fullWidth {...field}>
                <MenuItem value="PEN">Soles (PEN)</MenuItem>
                <MenuItem value="USD">Dólares (USD)</MenuItem>
              </TextField>
            )} />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller control={control} name="category"
            render={({ field }) => (
              <TextField select label="Categoría" fullWidth {...field}>
                {categories.map((c) => (
                  <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                ))}
              </TextField>
            )} />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Controller control={control} name="notes"
            render={({ field }) => (
              <TextField label="Notas (opcional)" fullWidth multiline rows={2} {...field} />
            )} />
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
