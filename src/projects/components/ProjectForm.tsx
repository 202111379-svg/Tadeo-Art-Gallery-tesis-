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
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import LockIcon from '@mui/icons-material/Lock';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useState } from 'react';

import type { Project, ProjectPhase, ProjectStatus } from '../types/project';
import { PHASE_LABELS, STATUS_LABELS } from '../types/project';
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

const MAX_DATE = endOfYear(new Date());

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

export const ProjectForm = ({ isPosting, project, onSubmit }: Props) => {
  const {
    control,
    handleSubmit,
    register,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormInputs>({
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
    appendMilestone({
      title: newMilestoneTitle.trim(),
      description: newMilestoneDesc.trim() || undefined,
      date: newMilestoneDate.getTime(),
    });
    setNewMilestoneTitle('');
    setNewMilestoneDesc('');
    setNewMilestoneDate(null);
  };

  const [logistics, setLogistics] = useState<ProjectLogistics>(project.logistics ?? {});
  const [risks, setRisks] = useState<Risk[]>(project.risks ?? []);
  const [incidents, setIncidents] = useState(project.incidents ?? []);
  const [evaluation, setEvaluation] = useState(project.evaluation);

  const [criteriaList, setCriteriaList] = useState<string[]>(project.acceptanceCriteria ?? []);
  const [newCriteria, setNewCriteria] = useState('');

  const handleAddCriteria = () => {
    if (!newCriteria.trim()) return;
    setCriteriaList((prev) => [...prev, newCriteria.trim()]);
    setNewCriteria('');
  };

  const minEndDate = addMinutes(watch('startDate'), 30);
  const closed = isClosed(project);

  const handleFormSubmit = async (data: FormInputs) => {
    const { files, imagesUrls, ...rest } = data;
    const closedAt = data.status === 'closed' && !project.closedAt
      ? new Date().toISOString()
      : project.closedAt;
    await onSubmit({
      ...rest,
      acceptanceCriteria: criteriaList,
      logistics,
      risks,
      incidents,
      evaluation,
      closedAt,
      imagesUrls: project.imagesUrls,
      files,
    });
    reset({ ...data, files: [] });
  };

  return (
    <Container maxWidth={false}>
      <Stack className="animate__animated animate__fadeIn animate__faster" spacing={3}>

        {/* Banner de proyecto cerrado */}
        {closed && (
          <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LockIcon color="action" fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              Este proyecto está cerrado.
              {project.closedAt && ` Cerrado el ${new Date(project.closedAt).toLocaleDateString('es-PE')}.`}
            </Typography>
          </Box>
        )}

        {/* ── Encabezado ── */}
        <form onSubmit={handleSubmit(handleFormSubmit)} id="project-form">
          <Grid container justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Grid sx={{ flex: 1, mr: 2 }}>
              {isNewProject(project) ? (
                <TextField
                  label="Nombre del proyecto"
                  placeholder="Escribe el nombre del proyecto"
                  fullWidth autoFocus
                  error={!!errors.title}
                  helperText={errors.title?.message}
                  {...register('title', { required: 'El nombre es obligatorio' })}
                />
              ) : (
                <Controller
                  control={control}
                  name="title"
                  defaultValue={project.title}
                  render={({ field }) => <EditableTypography title={field.value} {...field} />}
                />
              )}
            </Grid>
            <Grid>
              <Button
                type="submit"
                form="project-form"
                disabled={isPosting || closed}
                color="primary"
                variant="contained"
                sx={{ padding: 2 }}
              >
                <SaveOutlined sx={{ fontSize: 24, mr: 1 }} />
                {isPosting ? 'Guardando...' : 'Guardar'}
              </Button>
            </Grid>
          </Grid>

          {/* Responsable + Fase + Estado + Presupuesto */}
          <Grid container spacing={2} mb={2}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                label="Responsable del proyecto"
                size="small"
                fullWidth
                placeholder="Nombre del responsable"
                disabled={closed}
                defaultValue={project.responsible ?? ''}
                {...register('responsible')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Controller
                control={control}
                name="phase"
                render={({ field }) => (
                  <TextField select label="Fase actual" size="small" fullWidth disabled={closed} {...field}>
                    {(Object.entries(PHASE_LABELS) as [ProjectPhase, string][]).map(([k, v]) => (
                      <MenuItem key={k} value={k}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Chip
                            label={['1','2','3','4'][['planning','organizing','executing','evaluating'].indexOf(k)]}
                            size="small"
                            color="primary"
                            sx={{ width: 24, height: 24, fontSize: '0.65rem' }}
                          />
                          <span>{v}</span>
                        </Stack>
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <TextField select label="Estado" size="small" fullWidth {...field}>
                    {(Object.entries(STATUS_LABELS) as [ProjectStatus, string][]).map(([k, v]) => (
                      <MenuItem key={k} value={k}>{v}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                label="Presupuesto asignado (S/)"
                size="small"
                fullWidth
                type="number"
                placeholder="Ej: 5,000.00"
                disabled={closed}
                defaultValue={project.budget ?? ''}
                slotProps={{ htmlInput: { min: 0, step: '1' } }}
                helperText={project.budget ? `S/ ${Number(project.budget).toLocaleString('es-PE')}` : 'Monto en soles'}
                {...register('budget', { valueAsNumber: true })}
              />
            </Grid>
          </Grid>

          {/* Descripción */}
          <TextField
            label="Descripción del proyecto"
            defaultValue={project.description}
            sx={{ mb: 2 }}
            fullWidth multiline
            placeholder="Describe los detalles del proyecto (mín. 100 caracteres recomendados)"
            minRows={4}
            disabled={closed}
            {...register('description')}
          />

          {/* Fechas */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                control={control}
                name="startDate"
                defaultValue={project.startDate}
                render={({ field, fieldState: { error } }) => (
                  <CustomDatePicker
                    label="Fecha de inicio"
                    hasError={!!error}
                    value={new Date(field.value)}
                    onChange={field.onChange}
                    minDate={new Date()}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                control={control}
                name="endDate"
                defaultValue={project.endDate}
                rules={{ validate: (v) => !isBefore(v, minEndDate) || 'La fecha de fin debe ser posterior' }}
                render={({ field, fieldState: { error } }) => (
                  <CustomDatePicker
                    label="Fecha de cierre"
                    hasError={!!error}
                    value={new Date(field.value)}
                    onChange={field.onChange}
                    minDateTime={minEndDate}
                  />
                )}
              />
            </Grid>
          </Grid>
        </form>

        <Divider />

        {/* ── Hitos ── */}
        <Box>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Hitos del proyecto
            <Typography component="span" variant="caption" color="text.secondary" ml={1}>
              (impactan 20% del score de salud)
            </Typography>
          </Typography>

          {milestoneFields.length > 0 && (
            <List dense disablePadding sx={{ mb: 2 }}>
              {milestoneFields.map((field, index) => {
                const ms = field as MilestoneField;
                return (
                  <ListItem key={field.id} divider
                    secondaryAction={
                      <IconButton size="small" color="error" disabled={closed} onClick={() => removeMilestone(index)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={ms.title}
                      secondary={<>{ms.description && <span>{ms.description} · </span>}<span>{new Date(ms.date).toLocaleDateString('es-PE')}</span></>}
                    />
                  </ListItem>
                );
              })}
            </List>
          )}

          {!closed && (
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
                <DatePicker
                  label="Fecha del hito"
                  value={newMilestoneDate}
                  onChange={setNewMilestoneDate}
                  minDate={watch('startDate') ? new Date(watch('startDate')) : new Date()}
                  maxDate={watch('endDate') ? new Date(watch('endDate')) : MAX_DATE}
                  openTo="day"
                  views={['month', 'day']}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      helperText: watch('startDate') && watch('endDate')
                        ? `Entre ${new Date(watch('startDate')).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })} y ${new Date(watch('endDate')).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}`
                        : undefined,
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 2 }}>
                <Button variant="outlined" fullWidth startIcon={<AddIcon />} onClick={handleAddMilestone}
                  disabled={!newMilestoneTitle.trim() || !newMilestoneDate}>
                  Agregar
                </Button>
              </Grid>
            </Grid>
          )}
        </Box>

        <Divider />

        {/* ── Criterios de aceptación ── */}
        <Box>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Criterios de aceptación
            <Typography component="span" variant="caption" color="text.secondary" ml={1}>
              (impactan 15% del score de salud)
            </Typography>
          </Typography>

          {criteriaList.length > 0 && (
            <List dense disablePadding sx={{ mb: 2 }}>
              {criteriaList.map((criteria, index) => (
                <ListItem key={index} divider
                  secondaryAction={
                    <IconButton size="small" color="error" disabled={closed}
                      onClick={() => setCriteriaList((p) => p.filter((_, i) => i !== index))}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemText primary={`${index + 1}. ${criteria}`} />
                </ListItem>
              ))}
            </List>
          )}

          {!closed && (
            <Stack direction="row" spacing={2}>
              <TextField label="Nuevo criterio" size="small" fullWidth value={newCriteria}
                onChange={(e) => setNewCriteria(e.target.value)}
                placeholder="Ej: El proyecto debe incluir al menos 3 obras originales"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCriteria(); } }} />
              <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddCriteria}
                disabled={!newCriteria.trim()} sx={{ whiteSpace: 'nowrap' }}>
                Agregar
              </Button>
            </Stack>
          )}
        </Box>

        <Divider />

        {/* ── Gestión de Riesgos ── */}
        <RisksForm risks={risks} onChange={setRisks} />

        <Divider />

        {/* ── Incidencias ── */}
        {!isNewProject(project) && (
          <IncidentsForm
            incidents={incidents}
            onChange={setIncidents}
            readOnly={false}
          />
        )}

        {!isNewProject(project) && <Divider />}

        {/* ── Evaluación final ── */}
        {!isNewProject(project) && (
          <ProjectEvaluationForm
            evaluation={evaluation}
            onChange={(ev) => setEvaluation(ev)}
            readOnly={false}
          />
        )}

        <Divider />

        {/* ── Logística ── */}
        <Box>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Logística del evento</Typography>
          <Typography variant="caption" color="text.secondary" display="block" mb={2}>
            Lugar, aforo, artistas y sectores del evento.
          </Typography>
          <LogisticsForm value={logistics} onChange={setLogistics} />
        </Box>

        <Divider />

        {/* ── Presupuesto y gastos del proyecto ── */}
        {!isNewProject(project) && (
          <ProjectBudgetPanel projectId={project.id} budget={project.budget} />
        )}

        <Divider />

        {/* ── Imágenes ── */}
        <Stack spacing={1}>
          <Typography variant="subtitle1" fontWeight={600}>Imágenes del proyecto</Typography>
          {isNewProject(project) && (
            <Typography variant="body2" color="text.secondary">
              Puedes agregar imágenes ahora o después de guardar el proyecto.
            </Typography>
          )}
          <Controller
            control={control}
            name="files"
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
              return (
                <ImageGallery
                  images={allImages}
                  addNewImages={(files) => field.onChange([...field.value, ...files])}
                  onDeleteImage={handleDeleteImage}
                />
              );
            }}
          />
        </Stack>

      </Stack>
    </Container>
  );
};
