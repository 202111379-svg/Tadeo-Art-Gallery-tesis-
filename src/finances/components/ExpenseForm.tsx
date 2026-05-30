import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import type { Expense, ExpenseCategory } from '../types/expense';
import type { Currency } from '../types/donor';
import type { BudgetItem } from '../../projects/types/budget-item';
import type { Actividad } from '../../projects/types/activity';

interface ProjectOption {
  id: string;
  title: string;
  budgetItems?: BudgetItem[];
  actividades?: Actividad[];
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
  const [selectedActividadId, setSelectedActividadId] = useState('');
  const [selectedBudgetItemId, setSelectedBudgetItemId] = useState('');

  const { control, handleSubmit, reset, setValue, watch } = useForm<FormInputs>({
    defaultValues: { description: '', amount: 0, currency: 'PEN', category: 'otros', notes: '' },
  });

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const budgetItems = selectedProject?.budgetItems ?? [];
  const actividades = selectedProject?.actividades ?? [];
  const selectedActividad = actividades.find((actividad) => actividad.id === selectedActividadId);
  const requiresActivity = !!selectedProjectId;
  const activityAllowsExpense = !requiresActivity || !!selectedActividad?.fecha_real;

  // Contraste contra la "plantilla" planificada: el gasto se compara con el ítem
  // de presupuesto vinculado o, en su defecto, con el costo planificado de la actividad.
  const amount = Number(watch('amount')) || 0;
  const currency = watch('currency');
  const selectedItem = budgetItems.find((b) => b.id === selectedBudgetItemId);
  const referenciaPlan = selectedItem
    ? {
        monto: selectedItem.estimatedUnitCost * selectedItem.quantity,
        moneda: selectedItem.currency,
        etiqueta: selectedItem.name,
      }
    : selectedActividad
      ? {
          monto: selectedActividad.costo_planificado,
          moneda: 'PEN' as const,
          etiqueta: selectedActividad.nombre_actividad,
        }
      : null;
  const sobregiro =
    referenciaPlan && referenciaPlan.monto > 0 && referenciaPlan.moneda === currency
      ? amount - referenciaPlan.monto
      : 0;
  const fmtMoneda = (value: number, moneda: Currency) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: moneda }).format(value);

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

  const handleActivityChange = (actividadId: string) => {
    setSelectedActividadId(actividadId);
    const actividad = actividades.find((item) => item.id === actividadId);
    if (!actividad) return;

    setValue('description', actividad.nombre_actividad);
    if (actividad.costo_real > 0) {
      setValue('amount', actividad.costo_real);
    }
  };

  const onSubmit = (data: FormInputs) => {
    if (!activityAllowsExpense) return;

    onAdd({
      ...data,
      amount: Number(data.amount),
      date: new Date().toISOString(),
      ...(selectedProjectId && { projectId: selectedProjectId }),
      ...(selectedActividadId && { actividadId: selectedActividadId }),
      ...(selectedBudgetItemId && { budgetItemId: selectedBudgetItemId }),
    });
    reset({ description: '', amount: 0, currency: 'PEN', category: 'otros', notes: '' });
    setSelectedProjectId('');
    setSelectedActividadId('');
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
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setSelectedActividadId('');
                setSelectedBudgetItemId('');
                setValue('description', '');
                setValue('amount', 0);
              }}
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
        {requiresActivity && (
          <Grid size={{ xs: 12 }}>
            <TextField
              select
              label="Actividad ejecutada"
              fullWidth
              required
              value={selectedActividadId}
              onChange={(e) => handleActivityChange(e.target.value)}
              error={actividades.length === 0 || (!!selectedActividadId && !selectedActividad?.fecha_real)}
              helperText={
                actividades.length === 0
                  ? 'Este proyecto aun no tiene actividades planificadas; no se puede registrar gasto real.'
                  : selectedActividadId && !selectedActividad?.fecha_real
                  ? 'Esta actividad no tiene fecha real; no se puede registrar gasto.'
                  : 'Solo se permiten gastos de actividades con fecha real registrada.'
              }
            >
              <MenuItem value="">Selecciona una actividad</MenuItem>
              {actividades.map((actividad) => (
                <MenuItem key={actividad.id} value={actividad.id} disabled={!actividad.fecha_real}>
                  {actividad.nombre_actividad} {actividad.fecha_real ? '' : '- sin fecha real'}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        )}

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

        {sobregiro > 0 && referenciaPlan && (
          <Grid size={{ xs: 12 }}>
            <Alert severity="warning">
              Este gasto ({fmtMoneda(amount, currency)}) supera lo planificado para
              {' '}<strong>{referenciaPlan.etiqueta}</strong> ({fmtMoneda(referenciaPlan.monto, currency)})
              {' '}en <strong>{fmtMoneda(sobregiro, currency)}</strong>. Puedes registrarlo,
              pero quedará marcado como desviación frente al presupuesto planificado.
            </Alert>
          </Grid>
        )}

        <Grid size={{ xs: 12 }}>
          <Button type="submit" variant="contained" color="error" disabled={isLoading || !activityAllowsExpense} fullWidth>
            {isLoading ? 'Registrando...' : 'Registrar gasto'}
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};
