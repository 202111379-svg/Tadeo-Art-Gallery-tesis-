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
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import LockIcon from '@mui/icons-material/Lock';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useState, useMemo, memo } from 'react';
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
import { DesviacionesPanel } from './DesviacionesPanel';
import { ProjectEvaluationForm } from './ProjectEvaluationForm';
import { BudgetItemsForm } from './BudgetItemsForm';
import { ActivityManagementPanel } from './ActivityManagementPanel';
import { ResponsibleWorkloadPanel } from './ResponsibleWorkloadPanel';
import { PlannedVsActualTable } from './PlannedVsActualTable';
import { ActivityEvidenceSummary } from './ActivityEvidenceSummary';
import { toDate } from '../../helpers';
import { useProjects } from '../hooks/useProjects';
import { useProjectFinances } from '../hooks/useProjectFinances';
import { computeAutoDesviaciones } from '../utils/desviaciones';
import { useAppSelector } from '../../store/reduxHooks';
import { addExpenseRawAction, deleteExpenseAction, getExpensesByProjectAction } from '../../finances/actions/expenses.action';
import { queryClient } from '../../queryClient';

const MAX_DATE = endOfYear(new Date());

// ── Detección de nombres duplicados ─────────────────────────────────────────
/** Normaliza un nombre de proyecto: sin acentos, minúsculas, espacios simples */
const normalizarNombreProyecto = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');

/**
 * Compara el nombre escrito contra los proyectos existentes.
 * - 'exacto'  → mismo nombre tras normalizar (ej. "Prueba" y "prueba")
 * - 'similar' → uno contiene al otro, o comparten ≥70% de palabras significativas
 * - null      → no hay coincidencia
 */
const detectarNombreDuplicado = (
  nombre: string,
  proyectos: { id: string; title: string }[],
  idActual: string
): 'exacto' | 'similar' | null => {
  const n = normalizarNombreProyecto(nombre);
  if (n.length < 3) return null;
  for (const p of proyectos) {
    if (p.id === idActual) continue;
    const np = normalizarNombreProyecto(p.title ?? '');
    if (!np) continue;
    if (n === np) return 'exacto';
    if (n.includes(np) || np.includes(n)) return 'similar';
    // Comparar palabras significativas (longitud > 2)
    const wA = new Set(n.split(' ').filter((w) => w.length > 2));
    const wB = new Set(np.split(' ').filter((w) => w.length > 2));
    if (wA.size > 0 && wB.size > 0) {
      const shared = [...wA].filter((w) => wB.has(w)).length;
      if (shared / Math.max(wA.size, wB.size) >= 0.7) return 'similar';
    }
  }
  return null;
};

// Paneles memoizados: ProjectForm se re-renderiza en cada tecla (por los watch),
// pero estos reciben props estables (estado + setState), así que con memo NO se
// re-renderizan salvo que sus datos cambien. Evita el lag al escribir, ya que
// estos paneles tienen muchos DatePickers/campos costosos.
const MemoActivityManagementPanel = memo(ActivityManagementPanel);
const MemoDesviacionesPanel       = memo(DesviacionesPanel);
const MemoProjectBudgetPanel      = memo(ProjectBudgetPanel);
const MemoRisksForm               = memo(RisksForm);
const MemoLogisticsForm           = memo(LogisticsForm);
const MemoBudgetItemsForm         = memo(BudgetItemsForm);
const MemoResponsibleWorkloadPanel = memo(ResponsibleWorkloadPanel);

const fmtPEN = (n: number) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n);

/**
 * Sincroniza los gastos reales de materiales en Finanzas según el estado
 * de cada actividad. Solo actúa sobre gastos autogenerados por este sync
 * (autoGenerated o descripción legacy "Materiales: ..."), nunca sobre gastos
 * manuales del usuario ni sueldos de personal.
 *
 * - Completado + costo_real > 0 → crea el gasto si no existe, lo recrea si cambió el monto
 * - Cualquier otro estado → elimina el gasto existente (actividad re-abierta o sin costo)
 * - Actividades eliminadas del proyecto → limpia gastos huérfanos
 *
 * Lee los gastos directo de Firestore (no de la caché de React Query) para
 * evitar duplicados si se guarda dos veces antes de que la caché se refresque.
 */
const syncMaterialExpenses = async (
  uid: string,
  projectId: string,
  seasonId: string | undefined,
  actividades: Actividad[]
): Promise<void> => {
  const existingExpenses = await getExpensesByProjectAction(uid, projectId);
  const materialExpenses = existingExpenses.filter(
    (e) =>
      !e.workerId &&
      !!e.actividadId &&
      e.category === 'materiales' &&
      (e.autoGenerated || e.description.startsWith('Materiales: '))
  );

  await Promise.allSettled(
    actividades.map(async (actividad) => {
      const existing = materialExpenses.find((e) => e.actividadId === actividad.id);

      if (actividad.estado === 'Completado' && actividad.costo_real > 0 && actividad.fecha_real) {
        const expenseBase = {
          description:   `Materiales: ${actividad.nombre_actividad}`,
          amount:        actividad.costo_real,
          currency:      'PEN' as const,
          category:      'materiales' as const,
          date:          actividad.fecha_real,
          actividadId:   actividad.id,
          projectId,
          autoGenerated: true,
          ...(seasonId && { seasonId }),
        };
        if (!existing) {
          // Crear gasto nuevo (raw: sin re-validar el proyecto en Firestore)
          await addExpenseRawAction(uid, expenseBase);
        } else if (existing.amount !== actividad.costo_real) {
          // El monto cambió: reemplazar
          await deleteExpenseAction(uid, existing.id);
          await addExpenseRawAction(uid, expenseBase);
        }
      } else if (existing) {
        // Actividad re-abierta, sin costo real o sin fecha real → eliminar gasto
        await deleteExpenseAction(uid, existing.id);
      }
    })
  );

  // Limpiar gastos huérfanos (actividades que ya no existen en el proyecto)
  const actividadIds = new Set(actividades.map((a) => a.id));
  await Promise.allSettled(
    materialExpenses
      .filter((e) => !actividadIds.has(e.actividadId!))
      .map((e) => deleteExpenseAction(uid, e.id))
  );

  queryClient.invalidateQueries({ queryKey: ['project-expenses', uid, projectId] });
  queryClient.invalidateQueries({ queryKey: ['expenses'] });
};

const PHASES: { key: ProjectPhase; label: string; step: number }[] = [
  { key: 'planning',   label: 'Planificación', step: 0 },
  { key: 'organizing', label: 'Organización',  step: 1 },
  { key: 'executing',  label: 'Ejecución',     step: 2 },
  { key: 'evaluating', label: 'Evaluación',    step: 3 },
];

interface Props {
  isPosting: boolean;
  project: Project;
  onSubmit: (projectLike: Partial<Project> & { files?: File[] }) => Promise<Project>;
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
  const [desviaciones, setDesviaciones] = useState(project.desviaciones ?? []);
  const [evaluation, setEvaluation] = useState(project.evaluation);
  const [budgetItems, setBudgetItems] = useState(project.budgetItems ?? []);
  const [actividades, setActividades] = useState<Actividad[]>(project.actividades ?? []);
  const [criteriaList, setCriteriaList] = useState<string[]>(project.acceptanceCriteria ?? []);
  const [newCriteria, setNewCriteria] = useState('');
  const [activeStep, setActiveStep] = useState(phaseToStep(project.phase));
  // displayStep: la fase que se está MOSTRANDO (puede ser una anterior en modo revisión)
  const [displayStep, setDisplayStep] = useState(phaseToStep(project.phase));
  const [phaseError, setPhaseError] = useState<string | null>(null);

  // En modo revisión el usuario ve una fase anterior sin poder editar nada
  const isReviewing = displayStep < activeStep;

  const handleAddCriteria = () => {
    if (!newCriteria.trim()) return;
    setCriteriaList((prev) => [...prev, newCriteria.trim()]);
    setNewCriteria('');
  };

  const { uid } = useAppSelector((s) => s.auth);
  const { data: allProjects = [] } = useProjects();
  const { isUnderfunded, fundingGapPEN, budgetPEN, workerExpenses, totalPersonalPEN } = useProjectFinances(project.id, watch('budget'));

  const startDateValue = watch('startDate');
  const currentStatus = watch('status');
  const watchedTitle   = watch('title');
  const minEndDate = addMinutes(toDate(startDateValue) ?? new Date(), 30);
  const closed = isClosed(project);

  const duplicadoTipo = useMemo(
    () => detectarNombreDuplicado(watchedTitle ?? '', allProjects, project.id),
    [watchedTitle, allProjects, project.id]
  );
  const onHold = isOnHold(project) || currentStatus === 'on_hold';
  const blocked = closed || onHold;

  const saveProject = async (
    data: FormInputs,
    phaseOverride?: ProjectPhase,
    evaluationOverride = evaluation,
    imagesOverride?: string[]
  ) => {
    const { files, ...rest } = data;
    const closedAt = data.status === 'closed' && !project.closedAt ? new Date().toISOString() : project.closedAt;
    const startDate = toDate(data.startDate)?.toISOString() ?? new Date().toISOString();
    const endDate = toDate(data.endDate)?.toISOString() ?? new Date().toISOString();
    const phase = phaseOverride ?? stepToPhase(activeStep);
    const milestones = data.milestones;

    // Descartar desviaciones auto guardadas cuya condición ya no existe
    // (p. ej. se corrigió el costo real y el sobrecosto desapareció)
    const autoIds = new Set(computeAutoDesviaciones(actividades, desviaciones).map((d) => d.id));
    const desviacionesLimpias = desviaciones.filter((d) => !d.auto || autoIds.has(d.id));

    const saved = await onSubmit({
      ...rest,
      startDate,
      endDate,
      phase,
      milestones,
      acceptanceCriteria: criteriaList,
      logistics,
      risks,
      desviaciones: desviacionesLimpias,
      evaluation: evaluationOverride,
      budgetItems,
      actividades,
      closedAt,
      imagesUrls: imagesOverride ?? project.imagesUrls,
      files,
    });
    // Fijar el id (y seasonId) real devuelto por Firestore. Si no, un proyecto
    // recién creado conservaría id='new' y cada guardado clonaría el proyecto.
    reset({ ...data, id: saved.id, seasonId: saved.seasonId, phase, files: [] });

    // Sincronizar gastos reales de materiales en Finanzas
    if (uid && saved.id && saved.id !== 'new') {
      try {
        await syncMaterialExpenses(uid, saved.id, saved.seasonId, actividades);
      } catch (err) {
        console.error('Error al sincronizar gastos de materiales:', err);
      }
    }
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
    try {
      setPhaseError(null);
      await saveProject(data);
    } catch (error) {
      // Sin esto, un error de guardado (validación, Firestore) no daba ningún
      // feedback: el botón volvía a "Guardar" sin mensaje y parecía que se colgaba.
      setPhaseError(getErrorMessage(error));
    }
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

  const canAdvance = activeStep < 3 && !isReviewing;

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

        {/* Warning: nombre duplicado o muy parecido */}
        {displayStep === 0 && !isReviewing && duplicadoTipo && (
          <Alert severity="warning" sx={{ mt: -1 }}>
            {duplicadoTipo === 'exacto'
              ? '⚠️ Ya existe un proyecto con ese nombre exacto. Considera añadir un año o subtítulo para distinguirlo (ej. "Exposición Parque 2025").'
              : '⚠️ Hay un proyecto con un nombre muy parecido. Verifica que sean proyectos distintos antes de guardar.'}
          </Alert>
        )}

        {/* Stepper — los pasos completados son clickeables para revisarlos */}
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Stepper activeStep={displayStep} alternativeLabel>
            {PHASES.map((phase, index) => {
              const isCompleted = index < phaseToStep(project.phase);
              const isClickable = index <= activeStep && index !== displayStep;
              return (
                <Step key={phase.key} completed={isCompleted}>
                  <StepLabel
                    onClick={isClickable ? () => setDisplayStep(index) : undefined}
                    sx={isClickable ? { cursor: 'pointer', '& .MuiStepLabel-label': { textDecoration: 'underline dotted' } } : undefined}
                  >
                    {phase.label}
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </Paper>

        {/* Banner de revisión: avisa que está en modo lectura */}
        {isReviewing && (
          <Alert
            severity="info"
            action={
              <Button size="small" color="inherit" onClick={() => setDisplayStep(activeStep)}>
                Volver a Fase {activeStep + 1}
              </Button>
            }
          >
            <strong>Modo revisión — Fase {displayStep + 1}: {PHASES[displayStep].label}.</strong>{' '}
            Solo lectura. Haz clic en "Volver" o en la fase actual del stepper para continuar editando.
          </Alert>
        )}

        {/* Error de validación de fase */}
        {!isReviewing && phaseError && (
          <Alert severity="warning" onClose={() => setPhaseError(null)}>{phaseError}</Alert>
        )}

        {/* Contenido por fase */}
        <Box>

          {/* FASE 1: PLANIFICACIÓN */}
          {displayStep === 0 && (
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
                      placeholder="Nombre del responsable" disabled={blocked || isReviewing}
                      defaultValue={project.responsible ?? ''} {...register('responsible')} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Presupuesto total asignado (S/) *" size="small" fullWidth type="number"
                      placeholder="Ej: 5,000.00" disabled={blocked || isReviewing} defaultValue={project.budget ?? ''}
                      slotProps={{ htmlInput: { min: 0, step: '1' } }}
                      helperText={project.budget ? `S/ ${Number(project.budget).toLocaleString('es-PE')}` : 'Tope de inversión del proyecto. Requerido para avanzar a Organización'}
                      {...register('budget', { valueAsNumber: true })} />
                  </Grid>
                </Grid>
                <TextField label="Descripción y justificación del proyecto" defaultValue={project.description}
                  sx={{ mb: 2 }} fullWidth multiline
                  placeholder="¿De qué trata el evento y por qué se hace? (objetivo, alcance y justificación del presupuesto)"
                  minRows={4} disabled={blocked || isReviewing} {...register('description')} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller control={control} name="startDate" defaultValue={project.startDate}
                      render={({ field, fieldState: { error } }) => (
                        <CustomDatePicker label="Fecha de inicio *" hasError={!!error} value={toDate(field.value)}
                          disabled={blocked || isReviewing}
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
                          disabled={blocked || isReviewing}
                          onChange={field.onChange} minDateTime={minEndDate} />
                      )} />
                  </Grid>
                </Grid>
              </Paper>

              <Divider />
              <MemoActivityManagementPanel
                actividades={actividades}
                onChange={setActividades}
                disabled={blocked || isReviewing}
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
                          secondaryAction={<IconButton size="small" color="error" disabled={blocked || isReviewing} onClick={() => removeMilestone(index)}><DeleteIcon fontSize="small" /></IconButton>}>
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
                {!blocked && !isReviewing && (
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
                        secondaryAction={<IconButton size="small" color="error" disabled={blocked || isReviewing}
                          onClick={() => setCriteriaList((p) => p.filter((_, i) => i !== index))}><DeleteIcon fontSize="small" /></IconButton>}>
                        <ListItemText primary={`${index + 1}. ${criteria}`} />
                      </ListItem>
                    ))}
                  </List>
                )}
                {!blocked && !isReviewing && (
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
              <MemoRisksForm risks={risks} onChange={setRisks} disabled={blocked || isReviewing} />
            </Stack>
          )}

          {/* FASE 2: ORGANIZACIÓN */}
          {displayStep === 1 && (
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={700} color="primary">Fase 2 — Organización</Typography>
              <Typography variant="body2" color="text.secondary">
                Asigna quién hace cada actividad planificada, qué recursos necesita y confirma la logística del evento.
              </Typography>

              <MemoActivityManagementPanel
                actividades={actividades}
                onChange={setActividades}
                disabled={blocked || isReviewing}
                mode="organizing"
                projectStartDate={watch('startDate')}
                projectEndDate={watch('endDate')}
              />

              {/* ── Resumen: costos asignados en actividades vs presupuesto total ── */}
              {(() => {
                const budgetVal   = watch('budget') ?? 0;
                if (budgetVal <= 0) return null;
                const totalActs   = actividades.reduce((s, a) => s + (a.costo_planificado ?? 0), 0);
                const totalItems  = budgetItems.reduce(
                  (s, i) => s + i.estimatedUnitCost * i.quantity, 0
                );
                const totalAsig   = totalActs + totalItems + totalPersonalPEN;
                const pct         = Math.min(100, (totalAsig / budgetVal) * 100);
                const excedido    = totalAsig > budgetVal;
                const barColor    = excedido ? 'error' : pct >= 90 ? 'warning' : 'success';
                const labelPartes = [
                  'actividades',
                  totalItems > 0 && 'recursos',
                  totalPersonalPEN > 0 && 'personal',
                ].filter(Boolean).join(' + ');
                return (
                  <Paper
                    variant="outlined"
                    sx={{ p: 2, borderRadius: 2, borderColor: excedido ? 'error.main' : 'divider' }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                      <AccountBalanceWalletIcon color={excedido ? 'error' : 'primary'} fontSize="small" />
                      <Typography variant="subtitle2" fontWeight={600}>
                        Costos comprometidos vs presupuesto
                      </Typography>
                    </Stack>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
                      <Box sx={{ flex: 1, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Presupuesto total
                        </Typography>
                        <Typography variant="h6" fontWeight={700}>{fmtPEN(budgetVal)}</Typography>
                      </Box>
                      <Box sx={{ flex: 1, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Actividades
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>{fmtPEN(totalActs)}</Typography>
                      </Box>
                      {totalItems > 0 && (
                        <Box sx={{ flex: 1, textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Recursos materiales
                          </Typography>
                          <Typography variant="h6" fontWeight={600}>{fmtPEN(totalItems)}</Typography>
                        </Box>
                      )}
                      {totalPersonalPEN > 0 && (
                        <Box sx={{ flex: 1, textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Personal contratado
                          </Typography>
                          <Typography variant="h6" fontWeight={600}>{fmtPEN(totalPersonalPEN)}</Typography>
                        </Box>
                      )}
                      <Box sx={{ flex: 1, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {excedido ? 'Excedido en' : 'Disponible'}
                        </Typography>
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          color={excedido ? 'error.main' : 'success.main'}
                        >
                          {fmtPEN(Math.abs(budgetVal - totalAsig))}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        Presupuesto comprometido ({labelPartes})
                      </Typography>
                      <Typography variant="caption" fontWeight={600}>{pct.toFixed(1)}%</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      color={barColor}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                    {excedido ? (
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        Los costos asignados superan el presupuesto en{' '}
                        <strong>{fmtPEN(totalAsig - budgetVal)}</strong>.
                        Ajusta los montos antes de pasar a Ejecución.
                      </Alert>
                    ) : pct >= 90 ? (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        Ya comprometiste el {pct.toFixed(0)}% del presupuesto.
                        Quedan {fmtPEN(budgetVal - totalAsig)} disponibles.
                      </Alert>
                    ) : null}
                  </Paper>
                );
              })()}

              <Divider />
              <MemoResponsibleWorkloadPanel actividades={actividades} mode="organizing" />

              {/* ── Personal contratado desde Distribución de Personal ── */}
              {workerExpenses.length > 0 && (
                <>
                  <Divider />
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                      <Typography variant="subtitle1" fontWeight={600}>Personal contratado</Typography>
                      <Chip
                        label={`${workerExpenses.length} persona${workerExpenses.length === 1 ? '' : 's'}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                      Trabajadores registrados en Distribución de Personal vinculados a este proyecto.
                      Sus sueldos están incluidos en el presupuesto comprometido de arriba.
                    </Typography>
                    <Stack spacing={1}>
                      {workerExpenses.map((exp) => {
                        const match = exp.description.match(
                          /^Sueldo:\s*(.+?)\s*\((.+?)\)\s*—\s*Sector:\s*(.*)$/
                        );
                        const nombre  = match?.[1] ?? '—';
                        const rol     = match?.[2] ?? '—';
                        const sector  = match?.[3] ?? '—';
                        const actNombre = exp.actividadId
                          ? (actividades.find((a) => a.id === exp.actividadId)?.nombre_actividad ?? null)
                          : null;
                        return (
                          <Paper key={exp.id} variant="outlined" sx={{ p: 1.5 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Box>
                                <Typography variant="body2" fontWeight={600}>{nombre}</Typography>
                                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap mt={0.5}>
                                  <Chip label={rol} size="small" variant="outlined" />
                                  <Chip label={`Sector: ${sector}`} size="small" variant="outlined" />
                                  {actNombre && (
                                    <Chip label={`📋 ${actNombre}`} size="small" color="primary" variant="outlined" />
                                  )}
                                </Stack>
                              </Box>
                              <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ ml: 2, whiteSpace: 'nowrap' }}>
                                {fmtPEN(exp.amount)}
                              </Typography>
                            </Stack>
                          </Paper>
                        );
                      })}
                    </Stack>
                  </Box>
                </>
              )}

              <Divider />
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Recursos necesarios del evento</Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  Lista de recursos materiales con su categoría, cantidad y costo estimado (sillas, sonido, catering, etc.).
                </Typography>
                <MemoBudgetItemsForm items={budgetItems} onChange={setBudgetItems} disabled={blocked || isReviewing} />
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Logística del evento</Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  Lugar, aforo, expositores y sectores del evento. Confirma el local antes de pasar a Ejecución.
                </Typography>
                <MemoLogisticsForm value={logistics} onChange={setLogistics} disabled={blocked || isReviewing} />
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

              {/* ── Advertencia de financiamiento antes de pasar a Ejecución ── */}
              {isUnderfunded && budgetPEN > 0 && fundingGapPEN !== null && (
                <Alert severity="info">
                  <strong>¿Tienes el financiamiento listo?</strong> El presupuesto del proyecto es{' '}
                  {fmtPEN(budgetPEN)}, pero los ingresos confirmados aún no lo cubren — faltan{' '}
                  <strong>{fmtPEN(fundingGapPEN)}</strong>.
                  Puedes avanzar a Ejecución, pero asegúrate de conseguir ese dinero antes de gastar.
                  Registra donaciones e ingresos en el módulo de Finanzas.
                </Alert>
              )}
            </Stack>
          )}

          {/* FASE 3: EJECUCIÓN */}
          {displayStep === 2 && (
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
              <MemoActivityManagementPanel
                actividades={actividades}
                onChange={setActividades}
                disabled={blocked || isReviewing}
                mode="execution"
                projectStartDate={watch('startDate')}
                projectEndDate={watch('endDate')}
              />

              {/* Avance por persona — se actualiza en tiempo real con el estado de las actividades */}
              <MemoResponsibleWorkloadPanel actividades={actividades} mode="execution" />

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
                              {!blocked && !isReviewing && (
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
                <MemoProjectBudgetPanel projectId={project.id} budget={project.budget} budgetItems={budgetItems} />
              )}

              <Divider />

              {/* Desviaciones */}
              {!isNewProject(project) && (
                <MemoDesviacionesPanel
                  actividades={actividades}
                  desviaciones={desviaciones}
                  risks={risks}
                  onChange={setDesviaciones}
                  readOnly={blocked || isReviewing}
                />
              )}

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
                        // Guardar con los datos actuales del formulario, no con el prop
                        // (evita pisar actividades/desviaciones editadas sin guardar)
                        const remaining = project.imagesUrls.filter((_, i) => i !== index);
                        handleSubmit(async (data) => {
                          try {
                            await saveProject(data, undefined, undefined, remaining);
                          } catch (error) {
                            setPhaseError(getErrorMessage(error));
                          }
                        })();
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
          {displayStep === 3 && (
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={700} color="primary">Fase 4 — Evaluación</Typography>
              {!isNewProject(project) && <MemoProjectBudgetPanel projectId={project.id} budget={project.budget} budgetItems={budgetItems} />}
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
