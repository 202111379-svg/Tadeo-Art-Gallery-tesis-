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
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import LightbulbIcon from '@mui/icons-material/Lightbulb';

import type { Incident, IncidentCategory, IncidentImpact } from '../types/incident';
import { INCIDENT_CATEGORY_LABELS, INCIDENT_IMPACT_LABELS } from '../types/incident';

interface Props {
  incidents: Incident[];
  onChange: (incidents: Incident[]) => void;
  readOnly?: boolean;
}

const IMPACT_COLORS: Record<IncidentImpact, 'error' | 'warning' | 'success'> = {
  high: 'error', medium: 'warning', low: 'success',
};

export const IncidentsForm = ({ incidents, onChange, readOnly = false }: Props) => {
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState<IncidentCategory>('other');
  const [impact, setImpact] = useState<IncidentImpact>('medium');
  const [lesson, setLesson] = useState('');

  const addIncident = () => {
    if (!desc.trim()) return;
    const newIncident: Incident = {
      id: Date.now().toString(),
      category,
      description: desc.trim(),
      impact,
      lesson: lesson.trim(),
      createdAt: new Date().toISOString(),
    };
    onChange([...incidents, newIncident]);
    setDesc('');
    setLesson('');
    setCategory('other');
    setImpact('medium');
  };

  const removeIncident = (id: string) =>
    onChange(incidents.filter((i) => i.id !== id));

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <ReportProblemIcon color="warning" fontSize="small" />
        <Typography variant="subtitle2" fontWeight={600}>
          Incidencias del proyecto
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Problemas ocurridos durante la ejecución
        </Typography>
      </Stack>

      {/* Lista de incidencias */}
      {incidents.length > 0 && (
        <Stack spacing={1.5} mb={3}>
          {incidents.map((inc) => (
            <Paper key={inc.id} variant="outlined" sx={{ p: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box sx={{ flex: 1, mr: 1 }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" mb={0.5}>
                    <Chip
                      label={INCIDENT_CATEGORY_LABELS[inc.category]}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`Impacto: ${INCIDENT_IMPACT_LABELS[inc.impact]}`}
                      size="small"
                      color={IMPACT_COLORS[inc.impact]}
                      variant="outlined"
                    />
                  </Stack>
                  <Typography variant="body2" mb={0.5}>{inc.description}</Typography>
                  {inc.lesson && (
                    <Stack direction="row" alignItems="flex-start" spacing={0.5}>
                      <LightbulbIcon sx={{ fontSize: 14, color: 'warning.main', mt: 0.2 }} />
                      <Typography variant="caption" color="text.secondary" fontStyle="italic">
                        Lección: {inc.lesson}
                      </Typography>
                    </Stack>
                  )}
                  <Typography variant="caption" color="text.disabled">
                    {new Date(inc.createdAt).toLocaleDateString('es-PE')}
                  </Typography>
                </Box>
                {!readOnly && (
                  <IconButton size="small" color="error" onClick={() => removeIncident(inc.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {incidents.length === 0 && (
        <Typography variant="body2" color="text.secondary" fontStyle="italic" mb={2}>
          Sin incidencias registradas.
        </Typography>
      )}

      {/* Formulario para agregar */}
      {!readOnly && (
        <>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
            Registrar nueva incidencia
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select label="Tipo de problema" size="small" fullWidth
                value={category} onChange={(e) => setCategory(e.target.value as IncidentCategory)}
              >
                {Object.entries(INCIDENT_CATEGORY_LABELS).map(([k, v]) => (
                  <MenuItem key={k} value={k}>{v}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select label="Impacto" size="small" fullWidth
                value={impact} onChange={(e) => setImpact(e.target.value as IncidentImpact)}
              >
                {Object.entries(INCIDENT_IMPACT_LABELS).map(([k, v]) => (
                  <MenuItem key={k} value={k}>{v}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="¿Qué pasó?"
                size="small" fullWidth multiline rows={2}
                value={desc} onChange={(e) => setDesc(e.target.value)}
                placeholder="Ej: El artista principal canceló 2 días antes del evento sin previo aviso"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Lección aprendida — ¿Qué harías diferente?"
                size="small" fullWidth multiline rows={2}
                value={lesson} onChange={(e) => setLesson(e.target.value)}
                placeholder="Ej: Firmar contrato con cláusula de penalización y tener artista de respaldo confirmado"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Button
                variant="outlined"
                color="warning"
                startIcon={<AddIcon />}
                onClick={addIncident}
                disabled={!desc.trim()}
              >
                Registrar incidencia
              </Button>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};
