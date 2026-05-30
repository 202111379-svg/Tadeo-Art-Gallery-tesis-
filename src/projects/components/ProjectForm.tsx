import { addMinutes, isBefore, endOfYear } from 'date-fns';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import LockIcon from '@mui/icons-material/Lock';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router';

import type { Project, ProjectPhase, ProjectStatus } from '../types/project';
import type { Milestone } from '../types/milestone';
import type { ProjectLogistics } from '../types/logistics';
import type { Risk, RiskStatus } from '../types/risk';
import type { Actividad } from '../types/activity';
import filesMapper from '../../shared/mapers/files.mapper';
import { CustomDatePicker, EditableTypography, ImageGallery } from '../../shared/components';
import { LogisticsForm } from './LogisticsForm';
import { RisksForm } from './RisksForm';
import { ProjectBudgetPanel } from './ProjectBudgetPanel';
import { IncidentsForm } from './IncidentsForm';
import { ProjectEvaluationForm } from './ProjectEvaluationForm';
import { BudgetItemsForm } from './BudgetItemsForm';
import { ActivityManagementPanel } from './ActivityManagementPanel';
import { ResponsibleWorkloadPanel } from './ResponsibleWorkloadPanel';
import { PlannedVsActualTable } from './PlannedVsActualTable';
import { ActivityEvidenceSummary } from './ActivityEvidenceSummary';
import { toDate } from '../../helpers';

const MAX_DATE = endOfYear(new Date());

const PHASES: { key: ProjectPhase; label: string; step: number }[] = [
  { key: 'planning',   label: 'Planificación', step: 0 },
  { key: 'organizing', label: 'Organización',  step: 1 },
  { key: 'executing',  label: 'Ejecución',     step: 2 },
  { key: 'evaluating', label: 'Evaluación',    step: 3 },
];

interface Props {
  isPosting: boolean;
  project: Project;
  onSubmit: (projectLike: Partial<Project> & { files?: File[] }) => Promise<void>;
}

interface MilestoneField extends Milestone { id: string }

interface FormInputs extends Omit<Project, 'milestones' | 'acceptanceCriteria'> {
  files: File[];
  milestones: Milestone[];
  acceptanceCriteria: string[];
}

const isNewProject = (p: Project) => p.id === 'new';
const isClosed = (p: Project) => p.status === 'closed';
const isOnHold = (p: Project) => p.status === 'on_hold';

const phaseToStep = (phase?: ProjectPhase): number =>
  PHASES.find((p) => p.key === phase)?.step ?? 0;

const stepToPhase = (step: number): ProjectPhase =>
  PHASES[step]?.key ?? 'planning';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'No se pudo completar la accion.';

// Validación mínima para avanzar de Planificación a Organización
const validatePlanningPhase = (
  responsible: string | undefined,
  startDate: unknown,
  endDate: unknown,
  budget: number | undefined,
  actividades: Actividad[]
): string | null => {
  if (!responsible?.trim()) return 'Debes asignar un responsable antes de avanzar.';
  if (!startDate) return 'Debes definir la fecha de inicio antes de avanzar.';
  if (!endDate) return 'Debes definir la fecha de cierre antes de avanzar.';
  if (!budget || budget <= 0) return 'Debes asignar un presupuesto antes de avanzar.';
  if (actividades.length === 0) return 'Debes planificar al menos una actividad antes de avanzar a Organizacion.';
  return null;
};

export const ProjectForm = ({ isPosting, project, onSubmit }: Props) => {
  const { control, handleSubmit, register, watch, reset, setValue, formState: { errors } } =
    useForm<FormInputs>({
      defaultValues: {
        ...project,
        title: isNewProject(project) ? '' : project.title,
        milestones: project.milestones ?? [],
        acceptanceCriteria: project.acceptanceCriteria ?? [],
        phase: project.phase ?? 'planning',
        status: project.status ?? 'active',
        files: [],
      },
    });

  const { fields: milestoneFields, append: appendMilestone, remove: removeMilestone, update: updateMilestone } =
    useFieldArray<FormInputs, 'milestones'>({ control, name: 'milestones' });

  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState<Date | null>(null);
  const [newMilestoneActivityIds, setNewMilestoneActivityIds] = useState<string[]>([]);

  const handleAddMilestone = () => {
    if (!newMilestoneTitle.trim() || !newMilestoneDate) return;
    appendMilestone({
      title: newMilestoneTitle.trim(),
      description: newMilestoneDesc.trim() || undefined,
      date: newMilestoneDate.getTime(),
      activityIds: newMilestoneActivityIds.length > 0 ? newMilestoneActivityIds : undefined,
    });
    setNewMilestoneTitle(''); setNewMilestoneDesc(''); setNewMilestoneDate(null); setNewMilestoneActivityIds([]);
  };

  // Nombres de las actividades vinculadas a un hito (un hito significa algo concreto).
  const activityNames = (ids?: string[]) =>
    (ids ?? [])
      .map((id) => actividades.find((a) => a.id === id)?.nombre_actividad)
      .filter(Boolean) as string[];

  // Marcar hito como completado/pendiente directamente en Ejecución
  const toggleMilestoneCompleted = (index: number, ms: MilestoneField) => {
    const updated = {
      ...ms,
      completed: !ms.completed,
      completedAt: !ms.completed ? new Date().toISOString() : undefined,
    };
    updateMilestone(index, updated);
  };

  const [logistics, setLogistics] = useState<ProjectLogistics>(project.logistics ?? {});
  const [risks, setRisks] = useState<Risk[]>(project.risks ?? []);
  const [incidents, setIncidents] = useState(project.incidents ?? []);
  const [evaluation, setEvaluation] = useState(project.evaluation);
  const [budgetItems, setBudgetItems] = useState(project.budgetItems ?? []);
  const [actividades, setActividades] = useState<Actividad[]>(project.actividades ?? []);
  const [criteriaList, setCriteriaList] = useState<string[]>(project.acceptanceCriteria ?? []);
  const [newCriteria, setNewCriteria] = useState('');
  const [activeStep, setActiveStep] = useState(phaseToStep(project.phase));
  const [phaseError, setPhaseError] = useState<string | null>(null);

  const handleAddCriteria = () => {
    if (!newCriteria.trim()) return;
    setCriteriaList((prev) => [...prev, newCriteria.trim()]);
    setNewCriteria('');
  };

  const startDateValue = watch('startDate');
  const currentStatus = watch('status');
  const minEndDate = addMinutes(toDate(startDateValue) ?? new Date(), 30);
  const closed = isClosed(project);
  const onHold = isOnHold(project) || currentStatus === 'on_hold';
  const blocked = closed || onHold;

  const saveProject = async (
    data: FormInputs,
    phaseOverride?: ProjectPhase,
    evaluationOverride = evaluation
  ) => {
    const { files, ...rest } = data;
    const closedAt = data.status === 'closed' && !project.closedAt ? new Date().toISOString() : project.closedAt;
    const startDate = toDate(data.startDate)?.toISOString() ?? new Date().toISOString();
    const endDate = toDate(data.endDate)?.toISOString() ?? new Date().toISOString();
    const phase = phaseOverride ?? stepToPhase(activeStep);
    const milestones = data.milestones;
    await onSubmit({
      ...rest,
      startDate,
      endDate,
      phase,
      milestones,
      acceptanceCriteria: criteriaList,
      logistics,
      risks,
      incidents,
      evaluation: evaluationOverride,
      budgetItems,
      actividades,
      closedAt,
      imagesUrls: project.imagesUrls,
      files,
    });
    reset({ ...data, phase, files: [] });
  };

  const handleStatusChange = (newStatus: ProjectStatus) => {
    setValue('status', newStatus);
    handleSubmit(async (data) => {
      try {
        await saveProject({ ...data, status: newStatus });
      } catch (error) {
        setPhaseError(getErrorMessage(error));
      }
    })();
  };

  const handleFormSubmit = async (data: FormInputs) => {
    await saveProject(data);
  };

  const handleAdvance = handleSubmit(async (data) => {
    // Validar antes de avanzar de Planificación a Organización
    if (activeStep === 0) {
      const err = validatePlanningPhase(data.responsible, data.startDate, data.endDate, data.budget, actividades);
      if (err) { setPhaseError(err); return; }
    }
    // Validar antes de avanzar de Organización a Ejecución
    if (activeStep === 1) {
      const sinResponsable = actividades.find((a) => !a.responsable.trim());
      if (sinResponsable) {
        setPhaseError(`Asigna un responsable a la actividad "${sinResponsable.nombre_actividad}" antes de pasar a Ejecución.`);
        return;
      }
    }
    const nextStep = activeStep + 1;
    try {
      setPhaseError(null);
      await saveProject(data, stepToPhase(nextStep));
      setActiveStep(nextStep);
    } catch (error) {
      setPhaseError(getErrorMessage(error));
    }
  });

  const canAdvance = activeStep < 3;

  return (
    <Container maxWidth={false}>
      <Stack className="animate__animated animate__fadeIn animate__faster" spacing={3}>

        {closed && (
          <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LockIcon color="action" fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              Este proyecto está cerrado.
              {project.closedAt && ` Cerrado el ${new Date(project.closedAt).toLocaleDateString('es-PE')}.`}
            </Typography>
          </Box>
        )}

        {onHold && (
          <Box sx={{ p: 2, bgcolor: 'warning.main', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Typography variant="body2" fontWeight={600} color="warning.contrastText">
              ⏸ Proyecto en pausa — No se puede editar hasta reactivarlo.
            </Typography>
            <Button size="small" variant="contained" color="inherit" onClick={() => handleStatusChange('active')}>
              Reactivar proyecto
            </Button>
          </Box>
        )}

        {/* Encabezado */}
        <form onSubmit={handleSubmit(handleFormSubmit)} id="project-form">
          <Grid container justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Grid sx={{ flex: 1, mr: 2 }}>
              {activeStep === 0 ? (
                isNewProject(project) ? (
                  <TextField label="Nombre del proyecto" placeholder="Escribe el nombre del proyecto"
                    fullWidth autoFocus error={!!errors.title} helperText={errors.title?.message}
                    {...register('title', { required: 'El nombre es obligatorio' })} />
                ) : (
                  <Controller control={control} name="title" defaultValue={project.title}
                    render={({ field }) => <EditableTypography title={field.value} {...field} />} />
                )
              ) : (
                <Typography variant="h5" fontWeight={700}>{project.title}</Typography>
              )}
            </Grid>
            <Grid>
              <Stack direction="row" spacing={1} alignItems="center">
                {activeStep === 0 && (
                  <Controller control={control} name="status"
                    render={({ field }) => (
                      <TextField select label="Estado" size="small" sx={{ minWidth: 130 }}
                        value={field.value}
                        onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}>
                        <MenuItem value="active">Activo</MenuItem>
                        <MenuItem value="on_hold">En pausa</MenuItem>
                      </TextField>
                    )} />
                )}
                <Button type="submit" form="project-form" disabled={isPosting || blocked}
                  color="primary" variant="contained" sx={{ padding: 2 }}>
                  <SaveOutlined sx={{ fontSize: 24, mr: 1 }} />
                  {isPosting ? 'Guardando...' : 'Guardar'}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </form>

        {/* Stepper */}
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {PHASES.map((phase, index) => (
              <Step key={phase.key} completed={index < phaseToStep(project.phase)}>
                <StepLabel>{phase.label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Error de validación de fase */}
        {phaseError && (
          <Alert severity="warning" onClose={() => setPhaseError(null)}>{phaseError}</Alert>
        )}

        {/* Contenido por fase */}
        <Box>

          {/* FASE 1: PLANIFICACIÓN */}
          {activeStep === 0 && (
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={700} color="primary">Fase 1 — Planificación</Typography>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Datos generales del proyecto
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  Define lo esencial antes de planear: quién lidera, cuánto se invierte y por qué, y en qué fechas.
                </Typography>
                <Grid container spacing={2} mb={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Responsable del proyecto *" size="small" fullWidth
                      placeholder="Nombre del responsable" disabled={blocked}
                      defaultValue={project.responsible ?? ''} {...register('responsible')} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Presupuesto total asignado (S/) *" size="small" fullWidth type="number"
                      placeholder="Ej: 5,000.00" disabled={blocked} defaultValue={project.budget ?? ''}
                      slotProps={{ htmlInput: { min: 0, step: '1' } }}
                      helperText={project.budget ? `S/ ${Number(project.budget).toLocaleString('es-PE')}` : 'Tope de inversión del proyecto. Requerido para avanzar a Organización'}
                      {...register('budget', { valueAsNumber: true })} />
                  </Grid>
                </Grid>
                <TextField label="Descripción y justificación del proyecto" defaultValue={project.description}
                  sx={{ mb: 2 }} fullWidth multiline
                  placeholder="¿De qué trata el evento y por qué se hace? (objetivo, alcance y justificación del presupuesto)"
                  minRows={4} disabled={blocked} {...register('description')} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller control={control} name="startDate" defaultValue={project.startDate}
                      render={({ field, fieldState: { error } }) => (
                        <CustomDatePicker label="Fecha de inicio *" hasError={!!error} value={toDate(field.value)}
                          onChange={(newStart) => {
                            field.onChange(newStart);
                            const currentEnd = watch('endDate');
                            if (newStart && currentEnd && isBefore(new Date(currentEnd), addMinutes(toDate(newStart) ?? new Date(), 30)))
                              setValue('endDate', addMinutes(toDate(newStart) ?? new Date(), 30).toISOString());
                          }} minDate={new Date()} />
                      )} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller control={control} name="endDate" defaultValue={project.endDate}
                      rules={{ validate: (v) => !isBefore(v, minEndDate) || 'La fecha de fin debe ser posterior' }}
                      render={({ field, fieldState: { error } }) => (
                        <CustomDatePicker label="Fecha de cierre *" hasError={!!error} value={toDate(field.value)}
                          onChange={field.onChange} minDateTime={minEndDate} />
                      )} />
                  </Grid>
                </Grid>
              </Paper>

              <Divider />
              <ActivityManagementPanel
                actividades={actividades}
                onChange={setActividades}
                disabled={blocked}
                mode="planning"
                projectStartDate={watch('startDate')}
                projectEndDate={watch('endDate')}
              />
              <Divider />

              {/* Hitos */}
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Hitos del proyecto
                  <Typography component="span" variant="caption" color="text.secondary" ml={1}>(impactan 15% del score de salud)</Typography>
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                  Vincula cada hito a las actividades que lo hacen posible, para que signifique algo concreto.
                </Typography>
                {milestoneFields.length > 0 && (
                  <List dense disablePadding sx={{ mb: 2 }}>
                    {milestoneFields.map((field, index) => {
                      const ms = field as MilestoneField;
                      const linked = activityNames(ms.activityIds);
                      return (
                        <ListItem key={field.id} divider
                          secondaryAction={<IconButton size="small" color="error" disabled={blocked} onClick={() => removeMilestone(index)}><DeleteIcon fontSize="small" /></IconButton>}>
                          <ListItemText primary={ms.title}
                            secondary={<>
                              {ms.description && <span>{ms.description} · </span>}
                              <span>{new Date(ms.date).toLocaleDateString('es-PE')}</span>
                              {linked.length > 0 && <span> · 🎯 {linked.join(', ')}</span>}
                            </>} />
                        </ListItem>
                      );
                    })}
                  </List>
                )}
                {!blocked && (
                  <Grid container spacing={2} alignItems="flex-end">
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField label="Título del hito" size="small" fullWidth value={newMilestoneTitle}
                        onChange={(e) => setNewMilestoneTitle(e.target.value)} placeholder="Ej: Entrega de bocetos" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField label="Descripción (opcional)" size="small" fullWidth value={newMilestoneDesc}
                        onChange={(e) => setNewMilestoneDesc(e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <DatePicker label="Fecha del hito" value={newMilestoneDate} onChange={setNewMilestoneDate}
                        minDate={watch('startDate') ? new Date(watch('startDate')) : new Date()}
                        maxDate={watch('endDate') ? new Date(watch('endDate')) : MAX_DATE}
                        openTo="day" views={['month', 'day']}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 10 }}>
                      <TextField select size="small" fullWidth
                        label="Actividades que llevan a este hito (opcional)"
                        value={newMilestoneActivityIds}
                        onChange={(e) =>
                          setNewMilestoneActivityIds(
                            typeof e.target.value === 'string' ? e.target.value.split(',') : (e.target.value as string[])
                          )
                        }
                        disabled={actividades.length === 0}
                        helperText={actividades.length === 0 ? 'Primero agrega actividades arriba' : 'El hito se alcanza al completar estas actividades'}
                        slotProps={{ select: { multiple: true, renderValue: (selected) => activityNames(selected as string[]).join(', ') } }}>
                        {actividades.map((a) => (
                          <MenuItem key={a.id} value={a.id}>{a.nombre_actividad}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 2 }}>
                      <Button variant="outlined" fullWidth startIcon={<AddIcon />} onClick={handleAddMilestone}
                        disabled={!newMilestoneTitle.trim() || !newMilestoneDate}>Agregar</Button>
                    </Grid>
                  </Grid>
                )}
              </Box>

              <Divider />

              {/* Criterios */}
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Criterios de aceptación
                  <Typography component="span" variant="caption" color="text.secondary" ml={1}>(impactan 10% del score de salud)</Typography>
                </Typography>
                {criteriaList.length > 0 && (
                  <List dense disablePadding sx={{ mb: 2 }}>
                    {criteriaList.map((criteria, index) => (
                      <ListItem key={index} divider
                        secondaryAction={<IconButton size="small" color="error" disabled={blocked}
                          onClick={() => setCriteriaList((p) => p.filter((_, i) => i !== index))}><DeleteIcon fontSize="small" /></IconButton>}>
                        <ListItemText primary={`${index + 1}. ${criteria}`} />
                      </ListItem>
                    ))}
                  </List>
                )}
                {!blocked && (
                  <Stack direction="row" spacing={2}>
                    <TextField label="Nuevo criterio" size="small" fullWidth value={newCriteria}
                      onChange={(e) => setNewCriteria(e.target.value)}
                      placeholder="Ej: El proyecto debe incluir al menos 3 obras originales"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCriteria(); } }} />
                    <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddCriteria}
                      disabled={!newCriteria.trim()} sx={{ whiteSpace: 'nowrap' }}>Agregar</Button>
                  </Stack>
                )}
              </Box>

              <Divider />
              <RisksForm risks={risks} onChange={setRisks} />
            </Stack>
          )}

          {/* FASE 2: ORGANIZACIÓN */}
          {activeStep === 1 && (
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={700} color="primary">Fase 2 — Organización</Typography>
              <Typography variant="body2" color="text.secondary">
                Asigna quién hace cada actividad planificada, qué recursos necesita y confirma la logística del evento.
              </Typography>

              <ActivityManagementPanel
                actividades={actividades}
                onChange={setActividades}
                disabled={blocked}
                mode="organizing"
                projectStartDate={watch('startDate')}
                projectEndDate={watch('endDate')}
              />
              <Divider />
              <ResponsibleWorkloadPanel actividades={actividades} />
              <Divider />
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Recursos necesarios del evento</Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  Lista de recursos materiales con su categoría, cantidad y costo estimado (sillas, sonido, catering, etc.).
                </Typography>
                <BudgetItemsForm items={budgetItems} onChange={setBudgetItems} disabled={blocked} />
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Logística del evento</Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  Lugar, aforo, expositores y sectores del evento. Confirma el local antes de pasar a Ejecución.
                </Typography>
                <LogisticsForm value={logistics} onChange={setLogistics} disabled={blocked} />
              </Box>
              <Divider />
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>Distribución de Personal</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Asigna trabajadores a sectores del evento desde el módulo de distribución.
                    </Typography>
                  </Box>
                  <Button component={RouterLink} to="/distribution" variant="outlined" size="small" endIcon={<OpenInNewIcon />}>
                    Ir a Distribución
                  </Button>
                </Stack>
              </Paper>
            </Stack>
          )}

          {/* FASE 3: EJECUCIÓN */}
          {activeStep === 2 && (
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={700} color="primary">Fase 3 — Ejecución</Typography>

              {/* Estado */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Estado del proyecto</Typography>
                <Controller control={control} name="status"
                  render={({ field }) => (
                    <TextField select label="Estado" size="small" sx={{ minWidth: 200 }}
                      value={field.value}
                      onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}>
                      <MenuItem value="active">Activo</MenuItem>
                      <MenuItem value="on_hold">En pausa</MenuItem>
                    </TextField>
                  )} />
              </Box>

              <Divider />

              {/* Seguimiento de hitos — con botón directo para marcar */}
              <ActivityManagementPanel
                actividades={actividades}
                onChange={setActividades}
                disabled={blocked}
                mode="execution"
                projectStartDate={watch('startDate')}
                projectEndDate={watch('endDate')}
              />

              <Divider />

              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Seguimiento de hitos</Typography>
                {milestoneFields.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No hay hitos definidos. Agrégalos en la fase de Planificación.</Typography>
                ) : (
                  <List dense disablePadding>
                    {milestoneFields.map((field, index) => {
                      const ms = field as MilestoneField;
                      const isOverdue = !ms.completed && new Date(ms.date) < new Date();
                      const linkedMs = activityNames(ms.activityIds);
                      const linkedActs = (ms.activityIds ?? [])
                        .map((id) => actividades.find((a) => a.id === id))
                        .filter(Boolean) as Actividad[];
                      const allLinkedDone = linkedActs.length > 0 && linkedActs.every((a) => a.estado === 'Completado');
                      return (
                        <ListItem key={field.id} divider
                          secondaryAction={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip size="small"
                                label={ms.completed ? '✅ Completado' : isOverdue ? '⚠ Vencido' : '🏁 Pendiente'}
                                color={ms.completed ? 'success' : isOverdue ? 'error' : 'default'}
                                variant="outlined" />
                              {!blocked && (
                                <Button size="small"
                                  variant={ms.completed ? 'outlined' : 'contained'}
                                  color={ms.completed ? 'inherit' : 'success'}
                                  startIcon={ms.completed ? undefined : <CheckCircleIcon fontSize="small" />}
                                  onClick={() => toggleMilestoneCompleted(index, ms)}
                                  sx={{ whiteSpace: 'nowrap', fontSize: '0.72rem' }}>
                                  {ms.completed ? '↩ Reabrir' : 'Completar'}
                                </Button>
                              )}
                            </Stack>
                          }>
                          <ListItemText
                            primary={ms.title}
                            secondary={
                              <>
                                <span>{new Date(ms.date).toLocaleDateString('es-PE')}</span>
                                {ms.completed && ms.completedAt && (
                                  <span style={{ marginLeft: 8, color: 'green' }}>
                                    · Completado el {new Date(ms.completedAt).toLocaleDateString('es-PE')}
                                  </span>
                                )}
                                {linkedMs.length > 0 && (
                                  <span style={{ display: 'block' }}>
                                    🎯 {linkedMs.join(', ')}
                                    {!ms.completed && allLinkedDone && (
                                      <strong style={{ color: 'green' }}> — actividades completas, listo para marcar</strong>
                                    )}
                                  </span>
                                )}
                              </>
                            }
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                )}
              </Box>

              <Divider />

              {/* Riesgos en Ejecución — solo actualizar estado */}
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Gestión de riesgos
                  <Typography component="span" variant="caption" color="text.secondary" ml={1}>
                    — Actualiza el estado de los riesgos identificados
                  </Typography>
                </Typography>
                {risks.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No hay riesgos identificados. Agrégalos en la fase de Planificación.</Typography>
                ) : (
                  <List dense disablePadding>
                    {risks.map((risk) => (
                      <ListItem key={risk.id} divider
                        secondaryAction={
                          <Stack direction="row" spacing={0.5}>
                            {risk.status === 'open' && (
                              <Button size="small" color="warning"
                                onClick={() => setRisks((prev) => prev.map((r) => r.id === risk.id ? { ...r, status: 'mitigated' as RiskStatus } : r))}>
                                Mitigar
                              </Button>
                            )}
                            {risk.status === 'mitigated' && (
                              <Button size="small" color="success"
                                onClick={() => setRisks((prev) => prev.map((r) => r.id === risk.id ? { ...r, status: 'closed' as RiskStatus } : r))}>
                                Cerrar
                              </Button>
                            )}
                            {risk.status !== 'open' && (
                              <Button size="small" color="inherit" variant="outlined" sx={{ fontSize: '0.7rem' }}
                                onClick={() => setRisks((prev) => prev.map((r) => r.id === risk.id ? { ...r, status: 'open' as RiskStatus } : r))}>
                                ↩ Reabrir
                              </Button>
                            )}
                          </Stack>
                        }>
                        <ListItemText
                          primary={risk.description}
                          secondary={
                            <Stack direction="row" spacing={1} component="span">
                              <Chip label={`Impacto: ${risk.impact === 'high' ? 'Alto' : risk.impact === 'medium' ? 'Medio' : 'Bajo'}`}
                                size="small" color={risk.impact === 'high' ? 'error' : risk.impact === 'medium' ? 'warning' : 'success'} variant="outlined" />
                              <Chip label={risk.status === 'open' ? 'Abierto' : risk.status === 'mitigated' ? 'Mitigado' : 'Cerrado'}
                                size="small" color={risk.status === 'open' ? 'error' : risk.status === 'mitigated' ? 'warning' : 'success'} />
                            </Stack>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>

              <Divider />

              {/* Finanzas en tiempo real */}
              {!isNewProject(project) && (
                <ProjectBudgetPanel projectId={project.id} budget={project.budget} budgetItems={budgetItems} />
              )}

              <Divider />

              {/* Incidencias */}
              {!isNewProject(project) && <IncidentsForm incidents={incidents} onChange={setIncidents} readOnly={false} />}

              <Divider />

              {/* Imágenes — evidencia visual del evento en curso */}
              <Stack spacing={1}>
                <Typography variant="subtitle1" fontWeight={600}>Imágenes del evento</Typography>
                <Typography variant="caption" color="text.secondary">
                  Agrega fotos del evento mientras se ejecuta — montaje, inauguración, actividades.
                </Typography>
                <Controller control={control} name="files"
                  render={({ field }) => {
                    const previewImages = filesMapper.filesToUrl(field.value);
                    const allImages = [...project.imagesUrls, ...previewImages];
                    const handleDeleteImage = (index: number) => {
                      if (index < project.imagesUrls.length) {
                        onSubmit({ ...project, imagesUrls: project.imagesUrls.filter((_, i) => i !== index) });
                      } else {
                        const ni = index - project.imagesUrls.length;
                        field.onChange(field.value.filter((_: File, i: number) => i !== ni));
                      }
                    };
                    return <ImageGallery images={allImages} addNewImages={(files) => field.onChange([...field.value, ...files])} onDeleteImage={handleDeleteImage} />;
                  }} />
              </Stack>
            </Stack>
          )}

          {/* FASE 4: EVALUACIÓN */}
          {activeStep === 3 && (
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={700} color="primary">Fase 4 — Evaluación</Typography>
              {!isNewProject(project) && <ProjectBudgetPanel projectId={project.id} budget={project.budget} budgetItems={budgetItems} />}
              <Divider />
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Planificado vs real</Typography>
                <PlannedVsActualTable actividades={actividades} />
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Evidencias de actividades</Typography>
                <ActivityEvidenceSummary actividades={actividades} />
              </Box>
              <Divider />
              {!isNewProject(project) ? (
                <>
                  <ProjectEvaluationForm
                    evaluation={evaluation}
                    onChange={(ev) => setEvaluation(ev)}
                    onSaveImmediate={(ev) => {
                      setEvaluation(ev);
                      handleSubmit(async (data) => {
                        try {
                          await saveProject(data, undefined, ev);
                        } catch (error) {
                          setPhaseError(getErrorMessage(error));
                        }
                      })();
                    }}
                    readOnly={closed}
                  />
                  {!closed && evaluation && (
                    <>
                      <Divider />
                      <Box sx={{ p: 2, border: '1px solid', borderColor: 'error.main', borderRadius: 2 }}>
                        <Typography variant="subtitle2" fontWeight={600} color="error" gutterBottom>Cerrar proyecto</Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                          Al cerrar el proyecto no podrás editarlo. Asegúrate de haber completado la evaluación antes de continuar.
                        </Typography>
                        <Button variant="contained" color="error" startIcon={<LockIcon />}
                          onClick={handleSubmit(async (data) => {
                            setValue('status', 'closed');
                            try {
                              await saveProject({ ...data, status: 'closed' }, 'evaluating');
                            } catch (error) {
                              setPhaseError(getErrorMessage(error));
                            }
                          })}>
                          Cerrar proyecto definitivamente
                        </Button>
                      </Box>
                    </>
                  )}
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">Guarda el proyecto primero para poder evaluarlo.</Typography>
              )}
            </Stack>
          )}
        </Box>

        {/* Navegación */}
        <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={1} pt={1}>
          <Button type="submit" form="project-form" disabled={isPosting || blocked}
            color="primary" variant="outlined">
            <SaveOutlined sx={{ fontSize: 18, mr: 0.5 }} />
            {isPosting ? 'Guardando...' : 'Guardar'}
          </Button>
          {canAdvance && (
            <Button variant="contained" color="primary" endIcon={<NavigateNextIcon />}
              disabled={isPosting || blocked}
              onClick={handleAdvance}>
              Guardar y siguiente fase
            </Button>
          )}
        </Stack>

      </Stack>
    </Container>
  );
};
