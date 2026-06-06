import { useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
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
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteIcon from '@mui/icons-material/Delete';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import UploadFileIcon from '@mui/icons-material/UploadFile';

import type { Actividad, ActividadEstado, ActividadRecurso } from '../types/activity';
import { ACTIVIDAD_ESTADO_LABELS } from '../types/activity';
import { fileUpload } from '../../helpers';
import {
  calcularDesviacionDias,
  calcularDuracionDias,
  contarRecursosObtenidos,
  validarActividadAntesDeGuardar,
  validarCambioEstadoActividad,
} from '../utils/project-business-rules';

type PanelMode = 'planning' | 'organizing' | 'execution';

interface Props {
  actividades: Actividad[];
  onChange: (actividades: Actividad[]) => void;
  disabled?: boolean;
  mode?: PanelMode;
  /** Fecha de inicio del proyecto — restringe las fechas de actividades */
  projectStartDate?: string;
  /** Fecha de cierre del proyecto — restringe las fechas de actividades */
  projectEndDate?: string;
}

// En Planificación solo se define el QUÉ y el CUÁNDO de cada actividad.
type DraftActividad = {
  nombre_actividad: string;
  fecha_planificada: Date | null;
  fecha_fin_planificada: Date | null;
};

const createId = () =>
  crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const emptyDraft: DraftActividad = {
  nombre_actividad: '',
  fecha_planificada: null,
  fecha_fin_planificada: null,
};

const fmtFecha = (value?: string) =>
  value ? new Date(value).toLocaleDateString('es-PE') : '—';

const etiquetaDias = (dias: number | null) =>
  dias === null ? '—' : `${dias} día${dias === 1 ? '' : 's'}`;

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'No se pudo aplicar la regla de negocio.';

export const ActivityManagementPanel = ({
  actividades,
  onChange,
  disabled,
  mode = 'planning',
  projectStartDate,
  projectEndDate,
}: Props) => {
  const [draft, setDraft] = useState<DraftActividad>(emptyDraft);
  const [unplannedDraft, setUnplannedDraft] = useState({ nombre: '', responsable: '' });
  const [activityEvidenceInputs, setActivityEvidenceInputs] = useState<Record<string, string>>({});
  const [resourceEvidenceInputs, setResourceEvidenceInputs] = useState<Record<string, string>>({});
  const [newResourceInputs, setNewResourceInputs] = useState<Record<string, string>>({});
  const [uploadingEvidenceKey, setUploadingEvidenceKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isPlanning = mode === 'planning';
  const isOrganizing = mode === 'organizing';
  const isExecution = mode === 'execution';

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

  const nextOrden = () =>
    actividades.reduce((max, a) => Math.max(max, a.orden ?? 0), -1) + 1;

  const addActivity = () => {
    const actividad: Actividad = {
      id: createId(),
      nombre_actividad: draft.nombre_actividad,
      responsable: '',
      orden: nextOrden(),
      fecha_planificada: draft.fecha_planificada?.toISOString() ?? new Date().toISOString(),
      fecha_fin_planificada: draft.fecha_fin_planificada?.toISOString() ?? undefined,
      recursos_requeridos: [],
      estado: 'Pendiente',
      evidencias: [],
      costo_planificado: 0,
      costo_real: 0,
    };

    try {
      validarActividadAntesDeGuardar(actividad);
      onChange([...actividades, actividad]);
      setDraft(emptyDraft);
      setFeedback(null);
    } catch (error) {
      setFeedback(getErrorMessage(error));
    }
  };

  // Actividad imprevista: surge durante la ejecución (p. ej. por una incidencia).
  const addUnplannedActivity = () => {
    if (!unplannedDraft.nombre.trim()) return;
    const actividad: Actividad = {
      id: createId(),
      nombre_actividad: unplannedDraft.nombre.trim(),
      responsable: unplannedDraft.responsable.trim(),
      orden: nextOrden(),
      no_planificada: true,
      fecha_planificada: new Date().toISOString(),
      recursos_requeridos: [],
      estado: 'Pendiente',
      evidencias: [],
      costo_planificado: 0,
      costo_real: 0,
    };

    try {
      validarActividadAntesDeGuardar(actividad);
      onChange([...actividades, actividad]);
      setUnplannedDraft({ nombre: '', responsable: '' });
      setFeedback(null);
    } catch (error) {
      setFeedback(getErrorMessage(error));
    }
  };

  const removeActivity = (id: string) =>
    onChange(actividades.filter((item) => item.id !== id));

  const setResponsable = (id: string, value: string) =>
    trySetActividad(id, (current) => ({ ...current, responsable: value }));

  const setContacto = (id: string, value: string) =>
    trySetActividad(id, (current) => ({ ...current, contacto_responsable: value || undefined }));

  const setCostoPlanificado = (id: string, value: string) =>
    trySetActividad(id, (current) => ({ ...current, costo_planificado: Number(value) || 0 }));

  const addResourceToActivity = (actividadId: string) => {
    const value = newResourceInputs[actividadId]?.trim();
    if (!value) return;

    trySetActividad(actividadId, (current) => ({
      ...current,
      recursos_requeridos: [
        ...current.recursos_requeridos,
        { id: createId(), nombre_recurso: value, obtenido: false, evidencias: [] },
      ],
    }));
    setNewResourceInputs((prev) => ({ ...prev, [actividadId]: '' }));
  };

  const removeResource = (actividad: Actividad, recursoId: string) => {
    trySetActividad(actividad.id, (current) => ({
      ...current,
      recursos_requeridos: current.recursos_requeridos.filter((item) => item.id !== recursoId),
    }));
  };

  const changeStatus = (actividad: Actividad, estado: ActividadEstado) => {
    trySetActividad(actividad.id, (current) => {
      // Al pasar a En Ejecución o Completado sin inicio real,
      // se pre-rellena con la fecha planificada (el responsable puede corregirla).
      const withStart =
        (estado === 'En Ejecución' || estado === 'Completado') && !current.fecha_inicio_real
          ? { ...current, fecha_inicio_real: current.fecha_planificada ?? new Date().toISOString() }
          : current;

      // Al marcar Completado sin fin real, se pre-rellena con la fecha fin planificada
      // (o la de inicio si no hay fin planificado). Nunca con "hoy" para evitar
      // que quede antes de fecha_inicio_real cuando la actividad es futura.
      const withDates =
        estado === 'Completado' && !withStart.fecha_real
          ? {
              ...withStart,
              fecha_real:
                withStart.fecha_fin_planificada ??
                withStart.fecha_planificada ??
                withStart.fecha_inicio_real!,
            }
          : withStart;

      validarCambioEstadoActividad(withDates, estado);
      return { ...withDates, estado };
    });
  };

  const toggleResource = (actividad: Actividad, recurso: ActividadRecurso) => {
    trySetActividad(actividad.id, (current) => ({
      ...current,
      recursos_requeridos: current.recursos_requeridos.map((item) =>
        item.id === recurso.id
          ? {
              ...item,
              obtenido: !item.obtenido,
              fecha_obtenido: !item.obtenido ? new Date().toISOString() : item.fecha_obtenido,
            }
          : item
      ),
    }));
  };

  const addActivityEvidence = (actividad: Actividad) => {
    const value = activityEvidenceInputs[actividad.id]?.trim();
    if (!value) return;

    trySetActividad(actividad.id, (current) => ({
      ...current,
      evidencias: [...current.evidencias, value],
    }));
    setActivityEvidenceInputs((prev) => ({ ...prev, [actividad.id]: '' }));
  };

  const addResourceEvidence = (actividad: Actividad, recurso: ActividadRecurso) => {
    const key = `${actividad.id}-${recurso.id}`;
    const value = resourceEvidenceInputs[key]?.trim();
    if (!value) return;

    trySetActividad(actividad.id, (current) => ({
      ...current,
      recursos_requeridos: current.recursos_requeridos.map((item) =>
        item.id === recurso.id
          ? {
              ...item,
              obtenido: true,
              fecha_obtenido: item.fecha_obtenido ?? new Date().toISOString(),
              evidencias: [...(item.evidencias ?? []), value],
            }
          : item
      ),
    }));
    setResourceEvidenceInputs((prev) => ({ ...prev, [key]: '' }));
  };

  const attachActivityEvidence = (actividad: Actividad, evidenciaUrl: string) => {
    trySetActividad(actividad.id, (current) => ({
      ...current,
      evidencias: [...current.evidencias, evidenciaUrl],
    }));
  };

  const attachResourceEvidence = (
    actividad: Actividad,
    recurso: ActividadRecurso,
    evidenciaUrl: string
  ) => {
    trySetActividad(actividad.id, (current) => ({
      ...current,
      recursos_requeridos: current.recursos_requeridos.map((item) =>
        item.id === recurso.id
          ? {
              ...item,
              obtenido: true,
              fecha_obtenido: item.fecha_obtenido ?? new Date().toISOString(),
              evidencias: [...(item.evidencias ?? []), evidenciaUrl],
            }
          : item
      ),
    }));
  };

  const uploadActivityEvidence = async (actividad: Actividad, file?: File) => {
    if (!file) return;
    const key = `${actividad.id}-activity-upload`;

    try {
      setUploadingEvidenceKey(key);
      const url = await fileUpload(file);
      attachActivityEvidence(actividad, url);
      setFeedback(null);
    } catch (error) {
      setFeedback(getErrorMessage(error));
    } finally {
      setUploadingEvidenceKey(null);
    }
  };

  const uploadResourceEvidence = async (
    actividad: Actividad,
    recurso: ActividadRecurso,
    file?: File
  ) => {
    if (!file) return;
    const key = `${actividad.id}-${recurso.id}-upload`;

    try {
      setUploadingEvidenceKey(key);
      const url = await fileUpload(file);
      attachResourceEvidence(actividad, recurso, url);
      setFeedback(null);
    } catch (error) {
      setFeedback(getErrorMessage(error));
    } finally {
      setUploadingEvidenceKey(null);
    }
  };

  const draftDuracion = calcularDuracionDias(
    draft.fecha_planificada?.toISOString() ?? '',
    draft.fecha_fin_planificada?.toISOString() ?? ''
  );

  // Límites de fecha derivados del proyecto: las actividades no pueden
  // planificarse fuera del rango del proyecto.
  const minFechaAct = projectStartDate ? new Date(projectStartDate) : undefined;
  const maxFechaAct = projectEndDate   ? new Date(projectEndDate)   : undefined;

  // La secuencia marca los tiempos: mostramos y movemos las actividades por orden.
  const ordenadas = [...actividades].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

  const moveActivity = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= ordenadas.length) return;
    const reordered = [...ordenadas];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    onChange(reordered.map((actividad, i) => ({ ...actividad, orden: i })));
  };

  const headerCopy: Record<PanelMode, { title: string; caption: string }> = {
    planning: {
      title: 'Actividades del proyecto',
      caption: 'Lista qué se hará y cuánto durará cada actividad. El responsable y los recursos se asignan en Organización.',
    },
    organizing: {
      title: 'Asignación de responsables y recursos',
      caption: 'Define quién hará cada actividad, qué recursos necesita y cuánto costará.',
    },
    execution: {
      title: 'Seguimiento de ejecución',
      caption: 'Marca lo ejecutado, adjunta evidencias y registra fechas y costos reales.',
    },
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <TaskAltIcon color="primary" fontSize="small" />
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            {headerCopy[mode].title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {headerCopy[mode].caption}
          </Typography>
        </Box>
      </Stack>

      {feedback && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setFeedback(null)}>
          {feedback}
        </Alert>
      )}

      {actividades.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {isPlanning
            ? 'Aún no hay actividades. Agrega la primera más abajo.'
            : 'No hay actividades planificadas. Agrégalas en la fase de Planificación.'}
        </Typography>
      )}

      <Stack spacing={2}>
        {ordenadas.map((actividad, index) => {
          const resumen = contarRecursosObtenidos(actividad);
          const duracionPlan = calcularDuracionDias(
            actividad.fecha_planificada,
            actividad.fecha_fin_planificada
          );
          const duracionReal = calcularDuracionDias(
            actividad.fecha_inicio_real,
            actividad.fecha_real
          );
          const desviacion = calcularDesviacionDias(
            actividad.fecha_fin_planificada ?? actividad.fecha_planificada,
            actividad.fecha_real
          );
          const sinResponsable = !actividad.responsable.trim();

          return (
            <Paper key={actividad.id} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={2}>
                {/* Cabecera: identidad + ventana planificada + duración estimada */}
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={1.5}
                  justifyContent="space-between"
                  alignItems={{ md: 'flex-start' }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {index + 1}. {actividad.nombre_actividad}
                      </Typography>
                      {actividad.no_planificada && (
                        <Chip label="No planificada" size="small" color="warning" variant="outlined" />
                      )}
                    </Stack>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {actividad.no_planificada ? 'Surgió en ejecución' : 'Planificado'}: {fmtFecha(actividad.fecha_planificada)}
                      {actividad.fecha_fin_planificada && ` → ${fmtFecha(actividad.fecha_fin_planificada)}`}
                    </Typography>
                    {isExecution && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Responsable: {actividad.responsable || '— sin asignar —'}
                        {actividad.contacto_responsable && ` · ${actividad.contacto_responsable}`}
                        {actividad.costo_planificado > 0 && ` · Materiales: S/ ${actividad.costo_planificado.toLocaleString('es-PE')}`}
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Chip
                      label={`Duración estimada: ${etiquetaDias(duracionPlan)}`}
                      color={duracionPlan === null ? 'default' : 'info'}
                      variant="outlined"
                      size="small"
                    />
                    {(isOrganizing || isExecution) && (
                      <Chip
                        label={resumen.etiqueta}
                        color={resumen.total > 0 && resumen.obtenidos === resumen.total ? 'success' : 'warning'}
                        variant="outlined"
                        size="small"
                      />
                    )}
                    {isPlanning && (
                      <>
                        <Tooltip title="Subir">
                          <span>
                            <IconButton
                              size="small"
                              disabled={disabled || index === 0}
                              onClick={() => moveActivity(index, -1)}
                            >
                              <ArrowUpwardIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Bajar">
                          <span>
                            <IconButton
                              size="small"
                              disabled={disabled || index === ordenadas.length - 1}
                              onClick={() => moveActivity(index, 1)}
                            >
                              <ArrowDownwardIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </>
                    )}
                    {!isExecution && (
                      <Tooltip title="Eliminar actividad">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={disabled}
                            onClick={() => removeActivity(actividad.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </Stack>
                </Stack>

                {/* Organización: asignar responsable + costo planificado */}
                {isOrganizing && (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField
                        size="small"
                        label="Responsable de la actividad"
                        fullWidth
                        required
                        disabled={disabled}
                        error={sinResponsable}
                        helperText={sinResponsable ? 'Asigna a la persona encargada antes de ejecutar.' : ' '}
                        value={actividad.responsable}
                        onChange={(event) => setResponsable(actividad.id, event.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField
                        size="small"
                        label="Contacto (teléfono o email)"
                        fullWidth
                        disabled={disabled}
                        placeholder="Ej: 999-123-456 o pablo@correo.com"
                        helperText="Por si no puede asistir y hay que ubicarlo."
                        value={actividad.contacto_responsable ?? ''}
                        onChange={(event) => setContacto(actividad.id, event.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField
                        size="small"
                        label="Costo de materiales (S/)"
                        type="number"
                        fullWidth
                        disabled={disabled}
                        value={actividad.costo_planificado || ''}
                        onChange={(event) => setCostoPlanificado(actividad.id, event.target.value)}
                        slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
                        helperText="Solo insumos y materiales. Los sueldos van en Distribución de Personal."
                      />
                    </Grid>
                  </Grid>
                )}

                {/* Ejecución: registro real de fechas y costo + duración real y desviación */}
                {isExecution && (
                  <Box>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <DatePicker
                          label="Inicio real"
                          value={actividad.fecha_inicio_real ? new Date(actividad.fecha_inicio_real) : null}
                          onChange={(date) =>
                            trySetActividad(actividad.id, (current) => ({
                              ...current,
                              fecha_inicio_real: date?.toISOString() ?? undefined,
                            }))
                          }
                          minDate={actividad.fecha_planificada ? new Date(actividad.fecha_planificada) : minFechaAct}
                          maxDate={maxFechaAct}
                          disabled={disabled || actividad.estado === 'Pendiente'}
                          slotProps={{
                            textField: {
                              size: 'small',
                              fullWidth: true,
                              helperText: actividad.estado === 'Pendiente'
                                ? 'Cambia el estado a "En Ejecución" para registrar la fecha'
                                : undefined,
                            },
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <DatePicker
                          label="Fin real"
                          value={actividad.fecha_real ? new Date(actividad.fecha_real) : null}
                          onChange={(date) =>
                            trySetActividad(actividad.id, (current) => ({
                              ...current,
                              fecha_real: date?.toISOString() ?? undefined,
                            }))
                          }
                          minDate={
                            actividad.fecha_inicio_real
                              ? new Date(actividad.fecha_inicio_real)
                              : minFechaAct
                          }
                          maxDate={maxFechaAct}
                          disabled={disabled || actividad.estado !== 'Completado'}
                          slotProps={{
                            textField: {
                              size: 'small',
                              fullWidth: true,
                              helperText: actividad.estado !== 'Completado'
                                ? 'Se registra al marcar la actividad como "Completado"'
                                : undefined,
                            },
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                          size="small"
                          label="Costo real de materiales (S/)"
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
                    </Grid>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mt={1.5}>
                      <Chip
                        size="small"
                        variant="outlined"
                        color={duracionReal === null ? 'default' : 'primary'}
                        label={`Duración real: ${etiquetaDias(duracionReal)}`}
                      />
                      {desviacion !== null && (
                        <Chip
                          size="small"
                          variant={desviacion === 0 ? 'outlined' : 'filled'}
                          color={desviacion > 0 ? 'error' : desviacion < 0 ? 'success' : 'default'}
                          label={
                            desviacion === 0
                              ? 'Cerró a tiempo'
                              : desviacion > 0
                                ? `${desviacion} día${desviacion === 1 ? '' : 's'} de retraso`
                                : `${Math.abs(desviacion)} día${Math.abs(desviacion) === 1 ? '' : 's'} de adelanto`
                          }
                        />
                      )}
                    </Stack>
                  </Box>
                )}

                {/* Recursos requeridos (visibles en Organización y Ejecución) */}
                {(isOrganizing || isExecution) && actividad.recursos_requeridos.length > 0 && (
                  <Stack spacing={1}>
                    {actividad.recursos_requeridos.map((recurso) => {
                      const key = `${actividad.id}-${recurso.id}`;

                      return (
                        <Paper key={recurso.id} variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover' }}>
                          <Stack spacing={1}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" fontWeight={600}>
                                  {recurso.nombre_recurso}
                                </Typography>
                                {recurso.fecha_obtenido && (
                                  <Typography variant="caption" color="text.secondary">
                                    Obtenido el {new Date(recurso.fecha_obtenido).toLocaleDateString('es-PE')}
                                  </Typography>
                                )}
                              </Box>
                              <Chip
                                label={recurso.obtenido ? 'Obtenido' : 'Pendiente'}
                                color={recurso.obtenido ? 'success' : 'default'}
                                variant={recurso.obtenido ? 'filled' : 'outlined'}
                                size="small"
                                disabled={disabled || isOrganizing}
                                onClick={() => isExecution && toggleResource(actividad, recurso)}
                              />
                              {isOrganizing && (
                                <Tooltip title="Quitar recurso">
                                  <span>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      disabled={disabled}
                                      onClick={() => removeResource(actividad, recurso.id)}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              )}
                            </Stack>

                            {isExecution && (
                              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                                <TextField
                                  size="small"
                                  label="URL de evidencia del recurso"
                                  fullWidth
                                  disabled={disabled}
                                  value={resourceEvidenceInputs[key] ?? ''}
                                  onChange={(event) =>
                                    setResourceEvidenceInputs((prev) => ({ ...prev, [key]: event.target.value }))
                                  }
                                />
                                <Button
                                  variant="outlined"
                                  disabled={disabled || !(resourceEvidenceInputs[key] ?? '').trim()}
                                  onClick={() => addResourceEvidence(actividad, recurso)}
                                >
                                  Adjuntar
                                </Button>
                                <Button
                                  component="label"
                                  variant="outlined"
                                  startIcon={<UploadFileIcon />}
                                  disabled={disabled || uploadingEvidenceKey === `${key}-upload`}
                                  sx={{ whiteSpace: 'nowrap' }}
                                >
                                  {uploadingEvidenceKey === `${key}-upload` ? 'Subiendo...' : 'Subir archivo'}
                                  <input
                                    hidden
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(event) => {
                                      const file = event.target.files?.[0];
                                      event.target.value = '';
                                      uploadResourceEvidence(actividad, recurso, file);
                                    }}
                                  />
                                </Button>
                              </Stack>
                            )}

                            {(recurso.evidencias?.length ?? 0) > 0 && (
                              <Stack direction="row" spacing={1} flexWrap="wrap">
                                {recurso.evidencias!.map((evidencia, index) => (
                                  <Chip
                                    key={`${evidencia}-${index}`}
                                    label={`Doc. ${index + 1}`}
                                    component="a"
                                    href={evidencia}
                                    target="_blank"
                                    clickable
                                    size="small"
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
                )}

                {/* Organización: agregar recurso a la actividad */}
                {isOrganizing && !disabled && (
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <TextField
                      size="small"
                      label="Agregar recurso a esta actividad"
                      fullWidth
                      value={newResourceInputs[actividad.id] ?? ''}
                      onChange={(event) =>
                        setNewResourceInputs((prev) => ({ ...prev, [actividad.id]: event.target.value }))
                      }
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          addResourceToActivity(actividad.id);
                        }
                      }}
                    />
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      disabled={!(newResourceInputs[actividad.id] ?? '').trim()}
                      onClick={() => addResourceToActivity(actividad.id)}
                    >
                      Recurso
                    </Button>
                  </Stack>
                )}

                {/* Ejecución: evidencia general de la actividad */}
                {isExecution && (
                  <>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>
                        Evidencia de la actividad
                      </Typography>
                      {actividad.evidencias.length > 0 ? (
                        <Chip
                          label={`✓ ${actividad.evidencias.length} evidencia${actividad.evidencias.length === 1 ? '' : 's'}`}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      ) : (
                        <Chip
                          label="Sin evidencia"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                      <TextField
                        size="small"
                        label="URL de evidencia general de la actividad"
                        fullWidth
                        disabled={disabled}
                        value={activityEvidenceInputs[actividad.id] ?? ''}
                        onChange={(event) =>
                          setActivityEvidenceInputs((prev) => ({ ...prev, [actividad.id]: event.target.value }))
                        }
                      />
                      <Button
                        variant="outlined"
                        disabled={disabled || !(activityEvidenceInputs[actividad.id] ?? '').trim()}
                        onClick={() => addActivityEvidence(actividad)}
                      >
                        Adjuntar
                      </Button>
                      <Button
                        component="label"
                        variant="outlined"
                        startIcon={<UploadFileIcon />}
                        disabled={disabled || uploadingEvidenceKey === `${actividad.id}-activity-upload`}
                        sx={{ whiteSpace: 'nowrap' }}
                      >
                        {uploadingEvidenceKey === `${actividad.id}-activity-upload` ? 'Subiendo...' : 'Subir archivo'}
                        <input
                          hidden
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            event.target.value = '';
                            uploadActivityEvidence(actividad, file);
                          }}
                        />
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
                  </>
                )}
              </Stack>
            </Paper>
          );
        })}
      </Stack>

      {/* Ejecución: registrar una actividad imprevista (p. ej. por una incidencia) */}
      {isExecution && !disabled && (
        <>
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <ReportProblemIcon color="warning" fontSize="small" />
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                Registrar actividad imprevista
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Algo que no estaba planificado y tuvo que hacerse. Quedará marcado como desviación en la evaluación.
              </Typography>
            </Box>
          </Stack>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Nombre de la actividad imprevista"
                size="small"
                fullWidth
                value={unplannedDraft.nombre}
                onChange={(event) => setUnplannedDraft((prev) => ({ ...prev, nombre: event.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                label="Responsable"
                size="small"
                fullWidth
                value={unplannedDraft.responsable}
                onChange={(event) => setUnplannedDraft((prev) => ({ ...prev, responsable: event.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Button
                variant="outlined"
                color="warning"
                fullWidth
                startIcon={<AddIcon />}
                disabled={!unplannedDraft.nombre.trim()}
                onClick={addUnplannedActivity}
                sx={{ height: 40 }}
              >
                Agregar
              </Button>
            </Grid>
          </Grid>
        </>
      )}

      {/* Planificación: alta de nuevas actividades (solo qué y cuándo) */}
      {isPlanning && !disabled && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" fontWeight={600}>
            Nueva actividad
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
            Define el inicio y el fin planificados: el sistema calcula la duración estimada automáticamente.
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
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DatePicker
                label="Inicio planificado"
                value={draft.fecha_planificada}
                onChange={(date) => setDraft((prev) => ({ ...prev, fecha_planificada: date }))}
                minDate={minFechaAct}
                maxDate={maxFechaAct}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    helperText: minFechaAct ? 'Dentro del rango del proyecto' : undefined,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DatePicker
                label="Fin planificado"
                value={draft.fecha_fin_planificada}
                onChange={(date) => setDraft((prev) => ({ ...prev, fecha_fin_planificada: date }))}
                minDate={draft.fecha_planificada ?? minFechaAct}
                maxDate={maxFechaAct}
                slotProps={{
                  textField: { size: 'small', fullWidth: true },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Chip
                sx={{ height: 40, width: '100%', borderRadius: 1 }}
                variant="outlined"
                color={draftDuracion === null ? 'default' : 'info'}
                label={`Duración: ${etiquetaDias(draftDuracion)}`}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={addActivity}
                sx={{ float: { sm: 'right' } }}
              >
                Agregar actividad
              </Button>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};
