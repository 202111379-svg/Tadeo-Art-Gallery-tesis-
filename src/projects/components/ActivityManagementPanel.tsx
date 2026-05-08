import { useState } from 'react';
import Alert from '@mui/material/Alert';
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
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import TaskAltIcon from '@mui/icons-material/TaskAlt';

import type { Actividad, ActividadEstado, ActividadRecurso } from '../types/activity';
import { ACTIVIDAD_ESTADO_LABELS } from '../types/activity';
import {
  contarRecursosObtenidos,
  validarActividadAntesDeGuardar,
  validarCambioEstadoActividad,
} from '../utils/project-business-rules';

interface Props {
  actividades: Actividad[];
  onChange: (actividades: Actividad[]) => void;
  disabled?: boolean;
}

type DraftActividad = Omit<Actividad, 'id' | 'evidencias' | 'recursos_requeridos' | 'estado' | 'costo_real'>;

const createId = () =>
  crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const emptyDraft: DraftActividad = {
  nombre_actividad: '',
  responsable: '',
  fecha_planificada: '',
  fecha_real: '',
  costo_planificado: 0,
};

const toIsoFromDateInput = (value: string) =>
  value ? new Date(`${value}T00:00:00`).toISOString() : '';

const toDateInputValue = (value?: string) =>
  value ? new Date(value).toISOString().slice(0, 10) : '';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'No se pudo aplicar la regla de negocio.';

export const ActivityManagementPanel = ({ actividades, onChange, disabled }: Props) => {
  const [draft, setDraft] = useState<DraftActividad>(emptyDraft);
  const [draftResources, setDraftResources] = useState<ActividadRecurso[]>([]);
  const [resourceName, setResourceName] = useState('');
  const [evidenceInputs, setEvidenceInputs] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  const setActividad = (id: string, updater: (actividad: Actividad) => Actividad) => {
    setFeedback(null);
    const next = actividades.map((actividad) => {
      if (actividad.id !== id) return actividad;
      const updated = updater(actividad);
      validarActividadAntesDeGuardar(updated);
      return updated;
    });
    onChange(next);
  };

  const trySetActividad = (id: string, updater: (actividad: Actividad) => Actividad) => {
    try {
      setActividad(id, updater);
    } catch (error) {
      setFeedback(getErrorMessage(error));
    }
  };

  const addDraftResource = () => {
    if (!resourceName.trim()) return;
    setDraftResources((prev) => [
      ...prev,
      { id: createId(), nombre_recurso: resourceName.trim(), obtenido: false },
    ]);
    setResourceName('');
  };

  const addActivity = () => {
    const actividad: Actividad = {
      ...draft,
      id: createId(),
      fecha_planificada: toIsoFromDateInput(draft.fecha_planificada),
      fecha_real: draft.fecha_real ? toIsoFromDateInput(draft.fecha_real) : undefined,
      recursos_requeridos: draftResources,
      estado: 'Pendiente',
      evidencias: [],
      costo_planificado: Number(draft.costo_planificado) || 0,
      costo_real: 0,
    };

    try {
      validarActividadAntesDeGuardar(actividad);
      onChange([...actividades, actividad]);
      setDraft(emptyDraft);
      setDraftResources([]);
      setFeedback(null);
    } catch (error) {
      setFeedback(getErrorMessage(error));
    }
  };

  const changeStatus = (actividad: Actividad, estado: ActividadEstado) => {
    trySetActividad(actividad.id, (current) => {
      validarCambioEstadoActividad(current, estado);
      return { ...current, estado };
    });
  };

  const addEvidence = (actividad: Actividad) => {
    const value = evidenceInputs[actividad.id]?.trim();
    if (!value) return;

    trySetActividad(actividad.id, (current) => ({
      ...current,
      evidencias: [...current.evidencias, value],
    }));
    setEvidenceInputs((prev) => ({ ...prev, [actividad.id]: '' }));
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <TaskAltIcon color="primary" fontSize="small" />
        <Typography variant="subtitle1" fontWeight={600}>
          Actividades, recursos y evidencias
        </Typography>
      </Stack>

      {feedback && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setFeedback(null)}>
          {feedback}
        </Alert>
      )}

      <Stack spacing={2}>
        {actividades.map((actividad) => {
          const resumen = contarRecursosObtenidos(actividad);

          return (
            <Paper key={actividad.id} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {actividad.nombre_actividad}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Responsable: {actividad.responsable}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                    <TextField
                      select
                      size="small"
                      label="Estado"
                      fullWidth
                      disabled={disabled}
                      value={actividad.estado}
                      onChange={(event) => changeStatus(actividad, event.target.value as ActividadEstado)}
                    >
                      {Object.entries(ACTIVIDAD_ESTADO_LABELS).map(([value, label]) => (
                        <MenuItem key={value} value={value}>
                          {label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                    <TextField
                      size="small"
                      label="Fecha real"
                      type="date"
                      fullWidth
                      disabled={disabled}
                      value={toDateInputValue(actividad.fecha_real)}
                      onChange={(event) =>
                        trySetActividad(actividad.id, (current) => ({
                          ...current,
                          fecha_real: event.target.value
                            ? toIsoFromDateInput(event.target.value)
                            : undefined,
                        }))
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                    <TextField
                      size="small"
                      label="Costo real"
                      type="number"
                      fullWidth
                      disabled={disabled}
                      value={actividad.costo_real || ''}
                      onChange={(event) =>
                        trySetActividad(actividad.id, (current) => ({
                          ...current,
                          costo_real: Number(event.target.value) || 0,
                        }))
                      }
                      slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                    <Stack direction="row" spacing={1} justifyContent={{ md: 'flex-end' }}>
                      <Chip
                        label={resumen.etiqueta}
                        color={resumen.obtenidos === resumen.total ? 'success' : 'warning'}
                        variant="outlined"
                        size="small"
                      />
                      <Tooltip title="Eliminar actividad">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={disabled}
                            onClick={() => onChange(actividades.filter((item) => item.id !== actividad.id))}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </Grid>
                </Grid>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {actividad.recursos_requeridos.map((recurso) => (
                    <Chip
                      key={recurso.id}
                      label={recurso.nombre_recurso}
                      color={recurso.obtenido ? 'success' : 'default'}
                      variant={recurso.obtenido ? 'filled' : 'outlined'}
                      disabled={disabled}
                      onClick={() =>
                        trySetActividad(actividad.id, (current) => ({
                          ...current,
                          recursos_requeridos: current.recursos_requeridos.map((item) =>
                            item.id === recurso.id ? { ...item, obtenido: !item.obtenido } : item
                          ),
                        }))
                      }
                    />
                  ))}
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField
                    size="small"
                    label="URL de evidencia documental"
                    fullWidth
                    disabled={disabled}
                    value={evidenceInputs[actividad.id] ?? ''}
                    onChange={(event) =>
                      setEvidenceInputs((prev) => ({ ...prev, [actividad.id]: event.target.value }))
                    }
                  />
                  <Button
                    variant="outlined"
                    disabled={disabled || !(evidenceInputs[actividad.id] ?? '').trim()}
                    onClick={() => addEvidence(actividad)}
                  >
                    Adjuntar
                  </Button>
                </Stack>

                {actividad.evidencias.length > 0 && (
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {actividad.evidencias.map((evidencia, index) => (
                      <Chip
                        key={`${evidencia}-${index}`}
                        label={`Evidencia ${index + 1}`}
                        component="a"
                        href={evidencia}
                        target="_blank"
                        clickable
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                )}
              </Stack>
            </Paper>
          );
        })}
      </Stack>

      {!disabled && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" fontWeight={600} mb={1.5}>
            Nueva actividad
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Nombre de la actividad"
                size="small"
                fullWidth
                value={draft.nombre_actividad}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, nombre_actividad: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                label="Responsable"
                size="small"
                fullWidth
                value={draft.responsable}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, responsable: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                label="Fecha planificada"
                size="small"
                type="date"
                fullWidth
                value={draft.fecha_planificada}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, fecha_planificada: event.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                label="Costo planificado"
                size="small"
                type="number"
                fullWidth
                value={draft.costo_planificado || ''}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, costo_planificado: Number(event.target.value) || 0 }))
                }
                slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<AddIcon />}
                onClick={addActivity}
                sx={{ height: 40 }}
              >
                Agregar
              </Button>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField
                  label="Recurso requerido"
                  size="small"
                  fullWidth
                  value={resourceName}
                  onChange={(event) => setResourceName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addDraftResource();
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  disabled={!resourceName.trim()}
                  onClick={addDraftResource}
                >
                  Recurso
                </Button>
              </Stack>
              {draftResources.length > 0 && (
                <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                  {draftResources.map((recurso) => (
                    <Chip
                      key={recurso.id}
                      label={recurso.nombre_recurso}
                      onDelete={() =>
                        setDraftResources((prev) => prev.filter((item) => item.id !== recurso.id))
                      }
                    />
                  ))}
                </Stack>
              )}
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};
