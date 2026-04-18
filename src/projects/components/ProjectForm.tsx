import { addMinutes, isBefore, endOfYear } from 'date-fns';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
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
import DeleteIcon from '@mui/icons-material/Delete';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import LockIcon from '@mui/icons-material/Lock';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router';

import type { Project, ProjectPhase, ProjectStatus } from '../types/project';
import { STATUS_LABELS } from '../types/project';
import type { Milestone } from '../types/milestone';
import type { ProjectLogistics } from '../types/logistics';
import type { Risk } from '../types/risk';
import filesMapper from '../../shared/mapers/files.mapper';
import { CustomDatePicker, EditableTypography, ImageGallery } from '../../shared/components';
import { LogisticsForm } from './LogisticsForm';
import { RisksForm } from './RisksForm';
import { ProjectBudgetPanel } from './ProjectBudgetPanel';
import { IncidentsForm } from './IncidentsForm';
import { ProjectEvaluationForm } from './ProjectEvaluationForm';
import { BudgetItemsForm } from './BudgetItemsForm';
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

  const { fields: milestoneFields, append: appendMilestone, remove: removeMilestone } =
    useFieldArray<FormInputs, 'milestones'>({ control, name: 'milestones' });

  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState<Date | null>(null);

  const handleAddMilestone = () => {
    if (!newMilestoneTitle.trim() || !newMilestoneDate) return;
    appendMilestone({ title: newMilestoneTitle.trim(), description: newMilestoneDesc.trim() || undefined, date: newMilestoneDate.getTime() });
    setNewMilestoneTitle(''); setNewMilestoneDesc(''); setNewMilestoneDate(null);
  };

  const [logistics, setLogistics] = useState<ProjectLogistics>(project.logistics ?? {});
  const [risks, setRisks] = useState<Risk[]>(project.risks ?? []);
  const [incidents, setIncidents] = useState(project.incidents ?? []);
  const [evaluation, setEvaluation] = useState(project.evaluation);
  const [budgetItems, setBudgetItems] = useState(project.budgetItems ?? []);
  const [criteriaList, setCriteriaList] = useState<string[]>(project.acceptanceCriteria ?? []);
  const [newCriteria, setNewCriteria] = useState('');
  const [activeStep, setActiveStep] = useState(phaseToStep(project.phase));

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

  // Guardar automáticamente cuando cambia el estado
  const handleStatusChange = async (newStatus: ProjectStatus) => {
    setValue('status', newStatus);
    await onSubmit({ ...project, status: newStatus });
  };

  const handleFormSubmit = async (data: FormInputs) => {
    const { files, imagesUrls, ...rest } = data;
    const closedAt = data.status === 'closed' && !project.closedAt ? new Date().toISOString() : project.closedAt;
    const startDate = data.startDate instanceof Date ? data.startDate.toISOString()
      : typeof data.startDate === 'string' ? data.startDate : new Date(data.startDate as any).toISOString();
    const endDate = data.endDate instanceof Date ? data.endDate.toISOString()
      : typeof data.endDate === 'string' ? data.endDate : new Date(data.endDate as any).toISOString();
    const phase = stepToPhase(activeStep);
    await onSubmit({ ...rest, startDate, endDate, phase, acceptanceCriteria: criteriaList, logistics, risks, incidents, evaluation, budgetItems, closedAt, imagesUrls: project.imagesUrls, files });
    reset({ ...data, files: [] });
  };

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
            <Button size="small" variant="contained" color="inherit"
              onClick={() => handleStatusChange('active')}>
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

        {/* Contenido por fase */}
        <Box>

          {/* FASE 1: PLANIFICACIÓN */}
          {activeStep === 0 && (
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={700} color="primary">Fase 1 — Planificación</Typography>

              <form onSubmit={handleSubmit(handleFormSubmit)} id="project-form">
                <Grid container spacing={2} mb={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Responsable del proyecto" size="small" fullWidth
                      placeholder="Nombre del responsable" disabled={blocked}
                      defaultValue={project.responsible ?? ''} {...register('responsible')} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Presupuesto asignado (S/)" size="small" fullWidth type="number"
                      placeholder="Ej: 5,000.00" disabled={blocked} defaultValue={project.budget ?? ''}
                      slotProps={{ htmlInput: { min: 0, step: '1' } }}
                      helperText={project.budget ? `S/ ${Number(project.budget).toLocaleString('es-PE')}` : 'Monto total disponible'}
                      {...register('budget', { valueAsNumber: true })} />
                  </Grid>
                </Grid>
                <TextField label="Descripción del proyecto" defaultValue={project.description}
                  sx={{ mb: 2 }} fullWidth multiline
                  placeholder="Describe los detalles del proyecto (mín. 100 caracteres recomendados)"
                  minRows={4} disabled={blocked} {...register('description')} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller control={control} name="startDate" defaultValue={project.startDate}
                      render={({ field, fieldState: { error } }) => (
                        <CustomDatePicker label="Fecha de inicio" hasError={!!error} value={toDate(field.value)}
                          onChange={(newStart) => {
                            field.onChange(newStart);
                            const currentEnd = watch('endDate');
                            if (currentEnd && isBefore(new Date(currentEnd), addMinutes(new Date(newStart), 30)))
                              setValue('endDate', addMinutes(new Date(newStart), 30).toISOString());
                          }} minDate={new Date()} />
                      )} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller control={control} name="endDate" defaultValue={project.endDate}
                      rules={{ validate: (v) => !isBefore(v, minEndDate) || 'La fecha de fin debe ser posterior' }}
                      render={({ field, fieldState: { error } }) => (
                        <CustomDatePicker label="Fecha de cierre" hasError={!!error} value={toDate(field.value)}
                          onChange={field.onChange} minDateTime={minEndDate} />
                      )} />
                  </Grid>
                </Grid>
              </form>

              <Divider />
              <BudgetItemsForm items={budgetItems} onChange={setBudgetItems} disabled={blocked} />
              <Divider />

              {/* Hitos */}
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Hitos del proyecto
                  <Typography component="span" variant="caption" color="text.secondary" ml={1}>(impactan 20% del score de salud)</Typography>
                </Typography>
                {milestoneFields.length > 0 && (
                  <List dense disablePadding sx={{ mb: 2 }}>
                    {milestoneFields.map((field, index) => {
                      const ms = field as MilestoneField;
                      return (
                        <ListItem key={field.id} divider
                          secondaryAction={<IconButton size="small" color="error" disabled={blocked} onClick={() => removeMilestone(index)}><DeleteIcon fontSize="small" /></IconButton>}>
                          <ListItemText primary={ms.title}
                            secondary={<>{ms.description && <span>{ms.description} · </span>}<span>{new Date(ms.date).toLocaleDateString('es-PE')}</span></>} />
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
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField label="Descripción (opcional)" size="small" fullWidth value={newMilestoneDesc}
                        onChange={(e) => setNewMilestoneDesc(e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <DatePicker label="Fecha del hito" value={newMilestoneDate} onChange={setNewMilestoneDate}
                        minDate={watch('startDate') ? new Date(watch('startDate')) : new Date()}
                        maxDate={watch('endDate') ? new Date(watch('endDate')) : MAX_DATE}
                        openTo="day" views={['month', 'day']}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }} />
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
                  <Typography component="span" variant="caption" color="text.secondary" ml={1}>(impactan 15% del score de salud)</Typography>
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
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Logística del evento</Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  Lugar, aforo, expositores y sectores del evento.
                </Typography>
                <LogisticsForm value={logistics} onChange={setLogistics} />
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
              <Divider />
              <Stack spacing={1}>
                <Typography variant="subtitle1" fontWeight={600}>Imágenes del proyecto</Typography>
                {isNewProject(project) && (
                  <Typography variant="body2" color="text.secondary">Puedes agregar imágenes después de guardar el proyecto.</Typography>
                )}
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

          {/* FASE 3: EJECUCIÓN */}
          {activeStep === 2 && (
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={700} color="primary">Fase 3 — Ejecución</Typography>
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
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Seguimiento de hitos</Typography>
                {milestoneFields.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No hay hitos definidos. Agrégalos en la fase de Planificación.</Typography>
                ) : (
                  <List dense disablePadding>
                    {milestoneFields.map((field) => {
                      const ms = field as MilestoneField;
                      const isOverdue = !ms.completed && new Date(ms.date) < new Date();
                      return (
                        <ListItem key={field.id} divider
                          secondaryAction={
                            <Chip size="small"
                              label={ms.completed ? '✅ Completado' : isOverdue ? '⚠ Vencido' : '🏁 Pendiente'}
                              color={ms.completed ? 'success' : isOverdue ? 'error' : 'default'}
                              variant="outlined" />
                          }>
                          <ListItemText primary={ms.title} secondary={new Date(ms.date).toLocaleDateString('es-PE')} />
                        </ListItem>
                      );
                    })}
                  </List>
                )}
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  Para marcar hitos como completados, usa el calendario del proyecto.
                </Typography>
              </Box>
              <Divider />
              {!isNewProject(project) && (
                <ProjectBudgetPanel projectId={project.id} budget={project.budget} budgetItems={budgetItems} />
              )}
              <Divider />
              {!isNewProject(project) && <IncidentsForm incidents={incidents} onChange={setIncidents} readOnly={false} />}
            </Stack>
          )}

          {/* FASE 4: EVALUACIÓN */}
          {activeStep === 3 && (
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={700} color="primary">Fase 4 — Evaluación</Typography>
              {!isNewProject(project) && <ProjectBudgetPanel projectId={project.id} budget={project.budget} budgetItems={budgetItems} />}
              <Divider />
              {!isNewProject(project) ? (
                <>
                  <ProjectEvaluationForm evaluation={evaluation} onChange={(ev) => setEvaluation(ev)} readOnly={closed} />
                  {!closed && evaluation && (
                    <>
                      <Divider />
                      <Box sx={{ p: 2, border: '1px solid', borderColor: 'error.main', borderRadius: 2 }}>
                        <Typography variant="subtitle2" fontWeight={600} color="error" gutterBottom>Cerrar proyecto</Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                          Al cerrar el proyecto no podrás editarlo. Asegúrate de haber completado la evaluación antes de continuar.
                        </Typography>
                        <Button variant="contained" color="error" startIcon={<LockIcon />}
                          onClick={() => onSubmit({ ...project, status: 'closed', evaluation, closedAt: new Date().toISOString() })}>
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
        <Stack direction="row" justifyContent="space-between" alignItems="center" pt={1}>
          <Box />
          <Button type="submit" form="project-form" disabled={isPosting || blocked} color="primary" variant="contained">
            <SaveOutlined sx={{ fontSize: 20, mr: 1 }} />
            {isPosting ? 'Guardando...' : 'Guardar'}
          </Button>
          <Button variant="outlined" endIcon={<NavigateNextIcon />} disabled={!canAdvance}
            onClick={() => setActiveStep((s) => s + 1)}>
            Siguiente fase
          </Button>
        </Stack>

      </Stack>
    </Container>
  );
};
