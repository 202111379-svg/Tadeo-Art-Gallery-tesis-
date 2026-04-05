import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import type { Risk, RiskProbability, RiskImpact, RiskStatus } from '../types/risk';

interface Props {
  risks: Risk[];
  onChange: (risks: Risk[]) => void;
}

const PROB_LABELS: Record<RiskProbability, string> = {
  low: 'Baja', medium: 'Media', high: 'Alta',
};
const IMPACT_LABELS: Record<RiskImpact, string> = {
  low: 'Bajo', medium: 'Medio', high: 'Alto',
};
const STATUS_LABELS: Record<RiskStatus, string> = {
  open: 'Abierto', mitigated: 'Mitigado', closed: 'Cerrado',
};

const riskColor = (prob: RiskProbability, impact: RiskImpact) => {
  const score = ['low', 'medium', 'high'].indexOf(prob) + ['low', 'medium', 'high'].indexOf(impact);
  if (score >= 3) return 'error';
  if (score >= 1) return 'warning';
  return 'success';
};

export const RisksForm = ({ risks, onChange }: Props) => {
  const [desc, setDesc] = useState('');
  const [prob, setProb] = useState<RiskProbability>('medium');
  const [impact, setImpact] = useState<RiskImpact>('medium');
  const [plan, setPlan] = useState('');

  const addRisk = () => {
    if (!desc.trim()) return;
    const newRisk: Risk = {
      id: Date.now().toString(),
      description: desc.trim(),
      probability: prob,
      impact,
      status: 'open',
      responsePlan: plan.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    onChange([...risks, newRisk]);
    setDesc('');
    setProb('medium');
    setImpact('medium');
    setPlan('');
  };

  const updateStatus = (id: string, status: RiskStatus) =>
    onChange(risks.map((r) => r.id === id ? { ...r, status } : r));

  const removeRisk = (id: string) =>
    onChange(risks.filter((r) => r.id !== id));

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <WarningAmberIcon color="warning" fontSize="small" />
        <Typography variant="subtitle2" fontWeight={600}>
          Riesgos identificados
        </Typography>
        <Typography variant="caption" color="text.secondary">
          (CUS05 — Identificar Riesgo / CUS06 — Plan de Respuesta)
        </Typography>
      </Stack>

      {/* Lista de riesgos */}
      {risks.length > 0 && (
        <Stack spacing={1.5} mb={3}>
          {risks.map((risk) => (
            <Paper key={risk.id} variant="outlined" sx={{ p: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box sx={{ flex: 1, mr: 1 }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" mb={0.5}>
                    <Chip
                      label={`Prob: ${PROB_LABELS[risk.probability]}`}
                      size="small"
                      color={riskColor(risk.probability, risk.impact)}
                      variant="outlined"
                    />
                    <Chip
                      label={`Impacto: ${IMPACT_LABELS[risk.impact]}`}
                      size="small"
                      color={riskColor(risk.probability, risk.impact)}
                      variant="outlined"
                    />
                    <Chip
                      label={STATUS_LABELS[risk.status]}
                      size="small"
                      color={risk.status === 'open' ? 'error' : risk.status === 'mitigated' ? 'warning' : 'success'}
                    />
                  </Stack>
                  <Typography variant="body2">{risk.description}</Typography>
                  {risk.responsePlan && (
                    <Typography variant="caption" color="text.secondary">
                      Plan: {risk.responsePlan}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={0.5}>
                  {risk.status === 'open' && (
                    <Button size="small" onClick={() => updateStatus(risk.id, 'mitigated')}>
                      Mitigar
                    </Button>
                  )}
                  {risk.status === 'mitigated' && (
                    <Button size="small" color="success" onClick={() => updateStatus(risk.id, 'closed')}>
                      Cerrar
                    </Button>
                  )}
                  <IconButton size="small" color="error" onClick={() => removeRisk(risk.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {/* Agregar riesgo */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <TextField
            label="Descripción del riesgo"
            size="small"
            fullWidth
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Ej: Retraso en entrega de materiales artísticos"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField select label="Probabilidad" size="small" fullWidth value={prob}
            onChange={(e) => setProb(e.target.value as RiskProbability)}>
            {Object.entries(PROB_LABELS).map(([k, v]) => (
              <MenuItem key={k} value={k}>{v}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField select label="Impacto" size="small" fullWidth value={impact}
            onChange={(e) => setImpact(e.target.value as RiskImpact)}>
            {Object.entries(IMPACT_LABELS).map(([k, v]) => (
              <MenuItem key={k} value={k}>{v}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<AddIcon />}
            onClick={addRisk}
            disabled={!desc.trim()}
            sx={{ height: '40px' }}
          >
            Agregar riesgo
          </Button>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            label="Plan de respuesta (opcional)"
            size="small"
            fullWidth
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            placeholder="Ej: Contactar proveedor alternativo con 2 semanas de anticipación"
          />
        </Grid>
      </Grid>
    </Box>
  );
};
