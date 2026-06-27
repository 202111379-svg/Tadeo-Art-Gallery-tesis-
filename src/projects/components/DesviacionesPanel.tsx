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
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DeleteIcon from '@mui/icons-material/Delete';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ShieldIcon from '@mui/icons-material/Shield';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

import type { Actividad } from '../types/activity';
import type { Risk } from '../types/risk';
import type { Desviacion, DesviacionCausa, DesviacionImpacto, DesviacionTipo } from '../types/incident';
import {
  DESVIACION_CAUSA_LABELS,
  DESVIACION_IMPACTO_LABELS,
  DESVIACION_TIPO_LABELS,
} from '../types/incident';
import { computeAutoDesviaciones } from '../utils/desviaciones';

interface Props {
  actividades: Actividad[];
  /** Lista persistida: auto-desviaciones con datos editados + manuales. */
  desviaciones: Desviacion[];
  /** Riesgos identificados en planificación, para enlazar los que se materializaron. */
  risks: Risk[];
  onChange: (desviaciones: Desviacion[]) => void;
  readOnly?: boolean;
}

const TIPO_COLOR: Record<DesviacionTipo, 'error' | 'warning' | 'info' | 'default'> = {
  retraso:        'error',
  sobrecosto:     'warning',
  no_planificada: 'info',
  problema:       'default',
};

const IMPACTO_COLOR: Record<DesviacionImpacto, 'error' | 'warning' | 'success'> = {
  high:   'error',
  medium: 'warning',
  low:    'success',
};

const NINGUNO = '';

export const DesviacionesPanel = ({
  actividades,
  desviaciones,
  risks,
  onChange,
  readOnly = false,
}: Props) => {
  const [desc, setDesc]             = useState('');
  const [tipo, setTipo]             = useState<DesviacionTipo>('problema');
  const [impacto, setImpacto]       = useState<DesviacionImpacto>('medium');
  const [causaNew, setCausaNew]     = useState<DesviacionCausa | ''>('');
  const [riesgoNew, setRiesgoNew]   = useState<string>(NINGUNO);
  const [leccionNew, setLeccionNew] = useState('');

  const autoDesviaciones = computeAutoDesviaciones(actividades, desviaciones);
  const manuales         = desviaciones.filter((d) => !d.auto);
  const efectivas        = [...autoDesviaciones, ...manuales];

  const riskLabel = (id?: string) =>
    id ? risks.find((r) => r.id === id)?.description ?? null : null;

  /** Aplica un parche a una desviación (auto o manual), persistiéndola si era auto sin guardar. */
  const patchDesviacion = (id: string, patch: Partial<Desviacion>) => {
    const alreadyStored = desviaciones.find((d) => d.id === id);
    if (alreadyStored) {
      onChange(desviaciones.map((d) => (d.id === id ? { ...d, ...patch } : d)));
      return;
    }
    const isAuto = autoDesviaciones.find((d) => d.id === id);
    if (isAuto) {
      onChange([...desviaciones, { ...isAuto, ...patch }]);
    }
  };

  const addManual = () => {
    if (!desc.trim()) return;
    const nueva: Desviacion = {
      id:          Date.now().toString(),
      tipo,
      descripcion: desc.trim(),
      impacto,
      causa:       causaNew || undefined,
      riesgoId:    riesgoNew || undefined,
      leccion:     leccionNew.trim() || undefined,
      auto:        false,
      createdAt:   new Date().toISOString(),
    };
    onChange([...desviaciones, nueva]);
    setDesc('');
    setLeccionNew('');
    setTipo('problema');
    setImpacto('medium');
    setCausaNew('');
    setRiesgoNew(NINGUNO);
  };

  const removeManual = (id: string) =>
    onChange(desviaciones.filter((d) => d.id !== id));

  // ── Estadísticas para evaluación ───────────────────────────────────────────
  const conCausa = efectivas.filter((d) => d.causa).length;
  const causaTop = (() => {
    const conteo = new Map<DesviacionCausa, number>();
    for (const d of efectivas) {
      if (d.causa) conteo.set(d.causa, (conteo.get(d.causa) ?? 0) + 1);
    }
    const top = [...conteo.entries()].sort((a, b) => b[1] - a[1])[0];
    return top ? `${DESVIACION_CAUSA_LABELS[top[0]]} (${top[1]})` : null;
  })();
  const riesgosMaterializados = new Set(
    efectivas.map((d) => d.riesgoId).filter(Boolean) as string[]
  ).size;

  return (
    <Box>
      {/* Encabezado */}
      <Stack direction="row" alignItems="center" spacing={1} mb={2} flexWrap="wrap">
        <TrendingDownIcon color="warning" fontSize="small" />
        <Typography variant="subtitle2" fontWeight={600}>
          Desviaciones del proyecto
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Diferencias entre lo planificado y lo ejecutado
        </Typography>
        {autoDesviaciones.length > 0 && (
          <Chip
            label={`${autoDesviaciones.length} detectada${autoDesviaciones.length === 1 ? '' : 's'} automáticamente`}
            size="small"
            color="warning"
            variant="outlined"
            icon={<AutoAwesomeIcon />}
          />
        )}
      </Stack>

      {/* Resumen estadístico */}
      {efectivas.length > 0 && (
        <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: 'action.hover' }}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip size="small" label={`Total: ${efectivas.length}`} />
            <Chip
              size="small"
              variant="outlined"
              label={`Con causa codificada: ${conCausa}/${efectivas.length}`}
              color={conCausa === efectivas.length ? 'success' : 'default'}
            />
            {causaTop && (
              <Chip size="small" variant="outlined" label={`Causa más frecuente: ${causaTop}`} />
            )}
            <Chip
              size="small"
              variant="outlined"
              icon={<ShieldIcon />}
              label={`Riesgos previstos materializados: ${riesgosMaterializados}${risks.length ? ` de ${risks.length}` : ''}`}
              color={riesgosMaterializados > 0 ? 'warning' : 'default'}
            />
          </Stack>
        </Paper>
      )}

      {/* Sin desviaciones */}
      {efectivas.length === 0 && (
        <Typography variant="body2" color="text.secondary" fontStyle="italic" mb={2}>
          Sin desviaciones. Los retrasos y sobrecostos se detectan automáticamente al completar actividades.
        </Typography>
      )}

      {/* Lista */}
      {efectivas.length > 0 && (
        <Stack spacing={1.5} mb={3}>
          {efectivas.map((dev) => {
            const riesgoDesc = riskLabel(dev.riesgoId);
            return (
              <Paper
                key={dev.id}
                variant="outlined"
                sx={{
                  p:           1.5,
                  borderColor: dev.auto ? 'warning.main' : undefined,
                  borderStyle: dev.auto ? 'dashed' : 'solid',
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ flex: 1, mr: 1 }}>
                    {/* Chips de tipo, impacto, causa */}
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" mb={0.75} alignItems="center" useFlexGap>
                      {dev.auto && (
                        <Chip
                          label="Auto"
                          size="small"
                          color="warning"
                          variant="filled"
                          icon={<AutoAwesomeIcon />}
                          sx={{ fontSize: '0.65rem' }}
                        />
                      )}
                      <Chip
                        label={DESVIACION_TIPO_LABELS[dev.tipo]}
                        size="small"
                        color={TIPO_COLOR[dev.tipo]}
                        variant="outlined"
                      />
                      <Chip
                        label={`Impacto: ${DESVIACION_IMPACTO_LABELS[dev.impacto]}`}
                        size="small"
                        color={IMPACTO_COLOR[dev.impacto]}
                        variant="outlined"
                      />
                      {dev.causa && (
                        <Chip
                          label={`Causa: ${DESVIACION_CAUSA_LABELS[dev.causa]}`}
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      )}
                    </Stack>

                    {/* Descripción */}
                    <Typography variant="body2" mb={0.75}>{dev.descripcion}</Typography>

                    {/* Riesgo materializado */}
                    {riesgoDesc && (
                      <Stack direction="row" alignItems="center" spacing={0.5} mb={0.75}>
                        <ShieldIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                        <Typography variant="caption" color="warning.main">
                          Riesgo previsto materializado: {riesgoDesc}
                        </Typography>
                      </Stack>
                    )}

                    {readOnly ? (
                      dev.leccion ? (
                        <Stack direction="row" alignItems="flex-start" spacing={0.5}>
                          <LightbulbIcon sx={{ fontSize: 14, color: 'warning.main', mt: 0.2 }} />
                          <Typography variant="caption" color="text.secondary" fontStyle="italic">
                            Lección: {dev.leccion}
                          </Typography>
                        </Stack>
                      ) : null
                    ) : (
                      // Edición: causa, riesgo y lección
                      <Grid container spacing={1} sx={{ mt: 0.25 }}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            select size="small" fullWidth label="Causa raíz"
                            value={dev.causa ?? ''}
                            onChange={(e) =>
                              patchDesviacion(dev.id, { causa: (e.target.value || undefined) as DesviacionCausa | undefined })
                            }
                          >
                            <MenuItem value=""><em>Sin codificar</em></MenuItem>
                            {Object.entries(DESVIACION_CAUSA_LABELS).map(([k, v]) => (
                              <MenuItem key={k} value={k}>{v}</MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            select size="small" fullWidth label="¿Era un riesgo previsto?"
                            value={dev.riesgoId ?? NINGUNO}
                            onChange={(e) =>
                              patchDesviacion(dev.id, { riesgoId: e.target.value || undefined })
                            }
                            disabled={risks.length === 0}
                            helperText={risks.length === 0 ? 'No hay riesgos identificados' : undefined}
                          >
                            <MenuItem value={NINGUNO}><em>No estaba previsto</em></MenuItem>
                            {risks.map((r) => (
                              <MenuItem key={r.id} value={r.id}>
                                {r.description.length > 50 ? `${r.description.slice(0, 50)}…` : r.description}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            size="small"
                            fullWidth
                            label="Lección aprendida (opcional)"
                            placeholder="¿Qué harías diferente la próxima vez?"
                            value={dev.leccion ?? ''}
                            onChange={(e) => patchDesviacion(dev.id, { leccion: e.target.value })}
                          />
                        </Grid>
                      </Grid>
                    )}
                  </Box>

                  {/* Eliminar solo en manuales */}
                  {!readOnly && !dev.auto && (
                    <IconButton size="small" color="error" onClick={() => removeManual(dev.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}

      {/* Formulario para agregar desviación manual */}
      {!readOnly && (
        <>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
            Registrar problema no detectado automáticamente
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select label="Tipo" size="small" fullWidth
                value={tipo}
                onChange={(e) => setTipo(e.target.value as DesviacionTipo)}
              >
                <MenuItem value="problema">Problema</MenuItem>
                <MenuItem value="no_planificada">Actividad imprevista</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select label="Impacto" size="small" fullWidth
                value={impacto}
                onChange={(e) => setImpacto(e.target.value as DesviacionImpacto)}
              >
                {Object.entries(DESVIACION_IMPACTO_LABELS).map(([k, v]) => (
                  <MenuItem key={k} value={k}>{v}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select label="Causa raíz" size="small" fullWidth
                value={causaNew}
                onChange={(e) => setCausaNew(e.target.value as DesviacionCausa | '')}
              >
                <MenuItem value=""><em>Sin codificar</em></MenuItem>
                {Object.entries(DESVIACION_CAUSA_LABELS).map(([k, v]) => (
                  <MenuItem key={k} value={k}>{v}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="¿Qué pasó?" size="small" fullWidth multiline rows={2}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Ej: El artista principal canceló 2 días antes sin previo aviso"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                select label="¿Era un riesgo previsto?" size="small" fullWidth
                value={riesgoNew}
                onChange={(e) => setRiesgoNew(e.target.value)}
                disabled={risks.length === 0}
                helperText={
                  risks.length === 0
                    ? 'No hay riesgos identificados en planificación'
                    : 'Enlaza esta desviación con el riesgo que la predijo'
                }
              >
                <MenuItem value={NINGUNO}><em>No estaba previsto</em></MenuItem>
                {risks.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.description.length > 60 ? `${r.description.slice(0, 60)}…` : r.description}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Lección aprendida (opcional)" size="small" fullWidth multiline rows={2}
                value={leccionNew}
                onChange={(e) => setLeccionNew(e.target.value)}
                placeholder="Ej: Firmar contrato con cláusula de penalización y tener artista de respaldo confirmado"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Button
                variant="outlined"
                color="warning"
                startIcon={<AddIcon />}
                onClick={addManual}
                disabled={!desc.trim()}
              >
                Registrar desviación
              </Button>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};
