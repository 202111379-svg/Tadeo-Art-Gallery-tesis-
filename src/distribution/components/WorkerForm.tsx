import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';

import type { Worker } from '../types/items';

interface Props {
  onAddWorker: (worker: Omit<Worker, 'id'>) => void;
}

// Roles organizados por área — contexto galería de arte y eventos
const ROLES_BY_AREA: Record<string, string[]> = {
  'Curaduría y Arte': [
    'Curador/a',
    'Asistente de curaduría',
    'Gestor/a cultural',
    'Investigador/a de arte',
    'Restaurador/a',
    'Conservador/a',
    'Montajista',
  ],
  'Atención al Público': [
    'Guía de sala',
    'Recepcionista',
    'Anfitrión/a de eventos',
    'Educador/a artístico',
    'Mediador/a cultural',
    'Taquillero/a',
  ],
  'Producción y Eventos': [
    'Coordinador/a de eventos',
    'Productor/a ejecutivo',
    'Asistente de producción',
    'Técnico/a de iluminación',
    'Técnico/a de sonido',
    'Técnico/a audiovisual',
    'Escenógrafo/a',
    'Fotógrafo/a',
    'Videógrafo/a',
  ],
  'Comunicación y Marketing': [
    'Community manager',
    'Diseñador/a gráfico',
    'Relacionista público',
    'Prensa y comunicaciones',
    'Gestor/a de redes sociales',
  ],
  'Administración': [
    'Director/a',
    'Administrador/a',
    'Contador/a',
    'Asistente administrativo',
    'Coordinador/a general',
  ],
  'Operaciones': [
    'Seguridad',
    'Vigilante nocturno',
    'Personal de limpieza',
    'Mantenimiento',
    'Almacenista',
    'Transporte y logística',
  ],
};

const ALL_ROLES = Object.values(ROLES_BY_AREA).flat();

export const WorkerForm = ({ onAddWorker }: Props) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [salary, setSalary] = useState('');
  const [currency, setCurrency] = useState<'PEN' | 'USD'>('PEN');

  const canSubmit = name.trim() && role && parseFloat(salary) > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onAddWorker({
      name: name.trim(),
      role,
      salary: parseFloat(salary),
      currency,
      addedAt: new Date().toISOString(),
    });
    setName('');
    setRole('');
    setSalary('');
    setCurrency('PEN');
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
      <Stack spacing={1.5}>
        {/* Nombre */}
        <TextField
          label="Nombre completo"
          size="small"
          fullWidth
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: María García"
        />

        {/* Rol — select agrupado */}
        <TextField
          select
          label="Rol"
          size="small"
          fullWidth
          required
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <MenuItem value="" disabled>
            <Typography variant="body2" color="text.disabled">
              Selecciona un rol
            </Typography>
          </MenuItem>

          {Object.entries(ROLES_BY_AREA).map(([area, roles]) => [
            // Cabecera de área (no seleccionable)
            <MenuItem
              key={`header-${area}`}
              disabled
              sx={{
                opacity: '1 !important',
                bgcolor: 'action.hover',
                py: 0.5,
                mt: 0.5,
              }}
            >
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {area}
              </Typography>
            </MenuItem>,
            // Roles del área
            ...roles.map((r) => (
              <MenuItem key={r} value={r} sx={{ pl: 3 }}>
                {r}
              </MenuItem>
            )),
          ])}
        </TextField>

        {/* Sueldo y moneda */}
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 7 }}>
            <TextField
              label="Sueldo"
              size="small"
              fullWidth
              required
              type="number"
              inputProps={{ min: 0, step: '0.01' }}
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="0.00"
            />
          </Grid>
          <Grid size={{ xs: 5 }}>
            <TextField
              select
              label="Moneda"
              size="small"
              fullWidth
              value={currency}
              onChange={(e) => setCurrency(e.target.value as 'PEN' | 'USD')}
            >
              <MenuItem value="PEN">Soles (PEN)</MenuItem>
              <MenuItem value="USD">Dólares (USD)</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        <Button
          type="submit"
          variant="contained"
          startIcon={<AddIcon />}
          disabled={!canSubmit}
        >
          Agregar Trabajador
        </Button>
      </Stack>
    </Box>
  );
};
