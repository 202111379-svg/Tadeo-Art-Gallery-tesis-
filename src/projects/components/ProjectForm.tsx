import { addMinutes, isBefore } from 'date-fns';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useState } from 'react';

import type { Project } from '../types/project';
import type { Milestone } from '../types/milestone';
import filesMapper from '../../shared/mapers/files.mapper';
import { CustomDatePicker, EditableTypography, ImageGallery } from '../../shared/components';

interface Props {
  isPosting: boolean;
  project: Project;
  onSubmit: (projectLike: Partial<Project> & { files?: File[] }) => Promise<void>;
}

// FormInputs extiende Project pero con campos de array tipados correctamente
// para useFieldArray — react-hook-form requiere que los arrays sean de objetos
interface MilestoneField extends Milestone { id: string }
interface CriteriaField { id: string; value: string }

interface FormInputs extends Omit<Project, 'milestones' | 'acceptanceCriteria'> {
  files: File[];
  milestones: Milestone[];
  acceptanceCriteria: string[];
}

const isNewProject = (p: Project) => p.id === 'new';

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
      files: [],
    },
  });

  // ── Hitos ──────────────────────────────────────────────────────────────────
  const { fields: milestoneFields, append: appendMilestone, remove: removeMilestone } =
    useFieldArray<FormInputs, 'milestones'>({ control, name: 'milestones' });

  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState<Date | null>(null);

  const handleAddMilestone = () => {
    if (!newMilestoneTitle.trim() || !newMilestoneDate) return;
    const ms: Milestone = {
      title: newMilestoneTitle.trim(),
      description: newMilestoneDesc.trim() || undefined,
      date: newMilestoneDate.getTime(),
    };
    appendMilestone(ms);
    setNewMilestoneTitle('');
    setNewMilestoneDesc('');
    setNewMilestoneDate(null);
  };

  // ── Criterios de aceptación — estado local (array de strings primitivos)
  const [criteriaList, setCriteriaList] = useState<string[]>(
    project.acceptanceCriteria ?? []
  );
  const [newCriteria, setNewCriteria] = useState('');

  const handleAddCriteria = () => {
    if (!newCriteria.trim()) return;
    setCriteriaList((prev) => [...prev, newCriteria.trim()]);
    setNewCriteria('');
  };

  const handleRemoveCriteria = (index: number) => {
    setCriteriaList((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const minEndDate = addMinutes(watch('startDate'), 30);

  const handleFormSubmit = async (data: FormInputs) => {
    const { files, imagesUrls, ...rest } = data;
    // Incluir criterios del estado local (no están en el form de react-hook-form)
    await onSubmit({ ...rest, acceptanceCriteria: criteriaList, imagesUrls: project.imagesUrls, files });
    reset({ ...data, files: [] });
  };

  return (
    <Container maxWidth={false}>
      <Stack className="animate__animated animate__fadeIn animate__faster" spacing={3}>

        {/* ── Encabezado ── */}
        <form onSubmit={handleSubmit(handleFormSubmit)} id="project-form">
          <Grid container justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Grid sx={{ flex: 1, mr: 2 }}>
              {isNewProject(project) ? (
                <TextField
                  label="Nombre del proyecto"
                  placeholder="Escribe el nombre del proyecto"
                  fullWidth
                  autoFocus
                  error={!!errors.title}
                  helperText={errors.title?.message}
                  {...register('title', { required: 'El nombre es obligatorio' })}
                />
              ) : (
                <Controller
                  control={control}
                  name="title"
                  defaultValue={project.title}
                  render={({ field }) => (
                    <EditableTypography title={field.value} {...field} />
                  )}
                />
              )}
            </Grid>
            <Grid>
              <Button
                type="submit"
                form="project-form"
                disabled={isPosting}
                color="primary"
                variant="contained"
                sx={{ padding: 2 }}
              >
                <SaveOutlined sx={{ fontSize: 24, mr: 1 }} />
                {isPosting ? 'Guardando...' : 'Guardar'}
              </Button>
            </Grid>
          </Grid>

          {/* Descripción */}
          <TextField
            label="Descripción del proyecto"
            defaultValue={project.description}
            sx={{ mb: 2 }}
            fullWidth
            multiline
            placeholder="Describe los detalles del proyecto (mín. 100 caracteres recomendados)"
            minRows={4}
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
                rules={{
                  validate: (value) =>
                    !isBefore(value, minEndDate) ||
                    'La fecha de fin debe ser posterior a la de inicio',
                }}
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

          {/* Lista de hitos existentes */}
          {milestoneFields.length > 0 && (
            <List dense disablePadding sx={{ mb: 2 }}>
              {milestoneFields.map((field, index) => {
                const ms = field as MilestoneField;
                return (
                  <ListItem
                    key={field.id}
                    divider
                    secondaryAction={
                      <IconButton size="small" color="error" onClick={() => removeMilestone(index)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={ms.title}
                      secondary={
                        <>
                          {ms.description && <span>{ms.description} · </span>}
                          <span>{new Date(ms.date).toLocaleDateString('es-PE')}</span>
                        </>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          )}

          {/* Agregar nuevo hito */}
          <Grid container spacing={2} alignItems="flex-end">
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Título del hito"
                size="small"
                fullWidth
                value={newMilestoneTitle}
                onChange={(e) => setNewMilestoneTitle(e.target.value)}
                placeholder="Ej: Entrega de bocetos"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                label="Descripción (opcional)"
                size="small"
                fullWidth
                value={newMilestoneDesc}
                onChange={(e) => setNewMilestoneDesc(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <DatePicker
                label="Fecha del hito"
                value={newMilestoneDate}
                onChange={setNewMilestoneDate}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<AddIcon />}
                onClick={handleAddMilestone}
                disabled={!newMilestoneTitle.trim() || !newMilestoneDate}
              >
                Agregar
              </Button>
            </Grid>
          </Grid>
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

          {/* Lista de criterios existentes */}
          {criteriaList.length > 0 && (
            <List dense disablePadding sx={{ mb: 2 }}>
              {criteriaList.map((criteria, index) => (
                <ListItem
                  key={index}
                  divider
                  secondaryAction={
                    <IconButton size="small" color="error" onClick={() => handleRemoveCriteria(index)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemText primary={`${index + 1}. ${criteria}`} />
                </ListItem>
              ))}
            </List>
          )}

          {/* Agregar nuevo criterio */}
          <Stack direction="row" spacing={2}>
            <TextField
              label="Nuevo criterio"
              size="small"
              fullWidth
              value={newCriteria}
              onChange={(e) => setNewCriteria(e.target.value)}
              placeholder="Ej: El proyecto debe incluir al menos 3 obras originales"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCriteria();
                }
              }}
            />
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddCriteria}
              disabled={!newCriteria.trim()}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Agregar
            </Button>
          </Stack>
        </Box>

        <Divider />

        {/* ── Imágenes ── */}
        <Stack spacing={1}>
          <Typography variant="subtitle1" fontWeight={600}>
            Imágenes del proyecto
          </Typography>
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
                  const updatedUrls = project.imagesUrls.filter((_, i) => i !== index);
                  onSubmit({ ...project, imagesUrls: updatedUrls });
                } else {
                  const newIndex = index - project.imagesUrls.length;
                  field.onChange(field.value.filter((_: File, i: number) => i !== newIndex));
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
