import { useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import ListSubheader from '@mui/material/ListSubheader';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import AddIcon from '@mui/icons-material/Add';

import type { Worker } from '../types/items';

interface Props {
  onAddWorker: (worker: Omit<Worker, 'id'>) => void;
  disabled?: boolean;
}

// Roles predefinidos agrupados por área
const ROLES_BY_AREA: Record<string, string[]> = {
  'Curaduría y Arte': [
    'Curador/a', 'Asistente de curaduría', 'Gestor/a cultural',
    'Investigador/a de arte', 'Restaurador/a', 'Conservador/a', 'Montajista',
  ],
  'Atención al Público': [
    'Guía de sala', 'Recepcionista', 'Anfitrión/a de eventos',
    'Educador/a artístico', 'Mediador/a cultural', 'Taquillero/a',
  ],
  'Producción y Eventos': [
    'Coordinador/a de eventos', 'Productor/a ejecutivo', 'Asistente de producción',
    'Técnico/a de iluminación', 'Técnico/a de sonido', 'Técnico/a audiovisual',
    'Escenógrafo/a', 'Fotógrafo/a', 'Videógrafo/a',
  ],
  'Comunicación y Marketing': [
    'Community manager', 'Diseñador/a gráfico', 'Relacionista público',
    'Prensa y comunicaciones', 'Gestor/a de redes sociales',
  ],
  'Administración': [
    'Director/a', 'Administrador/a', 'Contador/a',
    'Asistente administrativo', 'Coordinador/a general',
  ],
  'Operaciones': [
    'Seguridad', 'Vigilante nocturno', 'Personal de limpieza',
    'Mantenimiento', 'Almacenista', 'Transporte y logística',
  ],
};

// Lista plana con etiqueta de grupo para el Autocomplete
const ROLE_OPTIONS = Object.entries(ROLES_BY_AREA).flatMap(([area, roles]) =>
  roles.map((role) => ({ area, role }))
);

export const WorkerForm = ({ onAddWorker, disabled = false }: Props) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [salary, setSalary] = useState('');
  const [currency, setCurrency] = useState<'PEN' | 'USD'>('PEN');

  const canSubmit = !disabled && name.trim() && role.trim() && parseFloat(salary) > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onAddWorker({
      name: name.trim(),
      role: role.trim(),   // puede ser predefinido o personalizado — se guarda tal cual
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

        {/* Rol — Autocomplete con opciones predefinidas + texto libre */}
        <Autocomplete
          freeSolo                          // permite escribir cualquier texto
          options={ROLE_OPTIONS}
          groupBy={(option) => option.area}
          getOptionLabel={(option) =>
            typeof option === 'string' ? option : option.role
          }
          value={role ? { area: '', role } : null}
          inputValue={role}
          onInputChange={(_, value) => setRole(value)}
          onChange={(_, value) => {
            if (!value) { setRole(''); return; }
            setRole(typeof value === 'string' ? value : value.role);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Rol"
              size="small"
              required
              placeholder="Selecciona o escribe un rol personalizado"
              helperText="Elige de la lista o escribe uno nuevo"
            />
          )}
          renderGroup={(params) => (
            <li key={params.key}>
              <ListSubheader
                sx={{
                  bgcolor: 'action.hover',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  lineHeight: '28px',
                }}
              >
                {params.group}
              </ListSubheader>
              <ul style={{ padding: 0 }}>{params.children}</ul>
            </li>
          )}
        />

        {/* Sueldo y moneda */}
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 7 }}>
            <TextField
              label="Sueldo"
              size="small"
              fullWidth
              required
              type="number"
              slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
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
              SelectProps={{ native: false }}
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
