import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import InventoryIcon from '@mui/icons-material/Inventory';

import type { BudgetItem, BudgetItemCategory } from '../types/budget-item';
import { BUDGET_ITEM_CATEGORY_LABELS } from '../types/budget-item';

interface Props {
  items: BudgetItem[];
  onChange: (items: BudgetItem[]) => void;
  disabled?: boolean;
}

const fmt = (n: number, currency: string) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency, minimumFractionDigits: 2 }).format(n);

export const BudgetItemsForm = ({ items, onChange, disabled }: Props) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<BudgetItemCategory>('infrastructure');
  const [quantity, setQuantity] = useState('1');
  const [cost, setCost] = useState('');
  const [currency, setCurrency] = useState<'PEN' | 'USD'>('PEN');
  const [notes, setNotes] = useState('');

  const addItem = () => {
    if (!name.trim() || !cost) return;
    const newItem: BudgetItem = {
      id: Date.now().toString(),
      name: name.trim(),
      category,
      quantity: Number(quantity) || 1,
      estimatedUnitCost: Number(cost),
      currency,
      notes: notes.trim() || undefined,
    };
    onChange([...items, newItem]);
    setName(''); setCost(''); setNotes(''); setQuantity('1');
  };

  const removeItem = (id: string) => onChange(items.filter((i) => i.id !== id));

  // Totales por moneda
  const totalPEN = items.filter((i) => i.currency === 'PEN')
    .reduce((a, i) => a + i.estimatedUnitCost * i.quantity, 0);
  const totalUSD = items.filter((i) => i.currency === 'USD')
    .reduce((a, i) => a + i.estimatedUnitCost * i.quantity, 0);

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <InventoryIcon color="primary" fontSize="small" />
        <Typography variant="subtitle1" fontWeight={600}>
          Recursos necesarios
        </Typography>
        <Typography variant="caption" color="text.secondary">
          — Lista de ítems planificados con costo estimado
        </Typography>
      </Stack>

      {/* Tabla de ítems */}
      {items.length > 0 && (
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Ítem</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell align="center">Cant.</TableCell>
                <TableCell align="right">Costo unit.</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{item.name}</Typography>
                    {item.notes && (
                      <Typography variant="caption" color="text.secondary">{item.notes}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={BUDGET_ITEM_CATEGORY_LABELS[item.category]} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">{item.quantity}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{fmt(item.estimatedUnitCost, item.currency)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>
                      {fmt(item.estimatedUnitCost * item.quantity, item.currency)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" color="error" disabled={disabled}
                      onClick={() => removeItem(item.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Totales */}
      {items.length > 0 && (
        <Stack direction="row" spacing={2} mb={2} justifyContent="flex-end">
          {totalPEN > 0 && (
            <Chip label={`Total PEN: ${fmt(totalPEN, 'PEN')}`} color="primary" variant="outlined" />
          )}
          {totalUSD > 0 && (
            <Chip label={`Total USD: ${fmt(totalUSD, 'USD')}`} color="secondary" variant="outlined" />
          )}
        </Stack>
      )}

      {!disabled && (
        <>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
            Agrega los recursos que necesitarás para el evento
          </Typography>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="Nombre del recurso" size="small" fullWidth value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Sillas plegables" />
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <TextField select label="Categoría" size="small" fullWidth value={category}
                onChange={(e) => setCategory(e.target.value as BudgetItemCategory)}>
                {Object.entries(BUDGET_ITEM_CATEGORY_LABELS).map(([k, v]) => (
                  <MenuItem key={k} value={k}>{v}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, sm: 1 }}>
              <TextField label="Cant." size="small" fullWidth type="number" value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                slotProps={{ htmlInput: { min: 1 } }} />
            </Grid>
            <Grid size={{ xs: 6, sm: 2 }}>
              <TextField label="Costo unit." size="small" fullWidth type="number" value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0.00"
                slotProps={{ htmlInput: { min: 0, step: '0.01' } }} />
            </Grid>
            <Grid size={{ xs: 6, sm: 1 }}>
              <TextField select label="Moneda" size="small" fullWidth value={currency}
                onChange={(e) => setCurrency(e.target.value as 'PEN' | 'USD')}>
                <MenuItem value="PEN">PEN</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, sm: 2 }}>
              <Button variant="outlined" fullWidth startIcon={<AddIcon />}
                onClick={addItem} disabled={!name.trim() || !cost}
                sx={{ height: 40 }}>
                Agregar
              </Button>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Notas (opcional)" size="small" fullWidth value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Alquilar en empresa X, incluye transporte" />
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};
