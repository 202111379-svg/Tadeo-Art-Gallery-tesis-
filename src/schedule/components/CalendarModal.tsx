import { useEffect } from 'react';
import { useParams } from 'react-router';
import { Controller, useForm } from 'react-hook-form';
import { addHours, differenceInSeconds, endOfYear } from 'date-fns';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

import type { ModalFormInputs } from '../types';
import { useAppDispatch, useAppSelector } from '../../store/reduxHooks';
import { closeDateModal, showSnackbar } from '../../store/ui';
import { setActiveEvent, startSavingEvent } from '../../store/schedule';

const MAX_DATE = endOfYear(new Date());

export const CalendarModal = () => {
  const { scheduleProjectId } = useParams();
  const { uid } = useAppSelector((state) => state.auth);
  const { isDateModalOpen } = useAppSelector((state) => state.ui);
  const { activeEvent } = useAppSelector((state) => state.schedule);
  const dispatch = useAppDispatch();

  const isEditing = !!activeEvent?.id;

  const {
    watch,
    reset,
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ModalFormInputs>({
    defaultValues: {
      title: '',
      notes: '',
      start: new Date(),
      end: addHours(new Date(), 2),
    },
  });

  useEffect(() => {
    if (activeEvent) {
      reset({
        title: activeEvent.title ?? '',
        notes: activeEvent.notes ?? '',
        start: new Date(activeEvent.start),
        end: new Date(activeEvent.end),
      });
    }
  }, [activeEvent, reset]);

  const startValue = watch('start');

  const onCloseModal = () => {
    dispatch(closeDateModal());
    dispatch(setActiveEvent(null));
  };

  const onSave = async ({ start, end, title, notes }: ModalFormInputs) => {
    const diff = differenceInSeconds(end, start);
    if (isNaN(diff) || diff <= 0) {
      dispatch(showSnackbar({ isOpen: true, message: 'La hora de fin debe ser posterior a la de inicio' }));
      return;
    }

    await dispatch(
      startSavingEvent({
        id: activeEvent?.id,
        title,
        notes,
        start: start.toISOString(),
        end: end.toISOString(),
        userId: uid!,
        projectId: scheduleProjectId!,
      })
    );

    dispatch(closeDateModal());
  };

  return (
    <Dialog
      open={isDateModalOpen}
      onClose={onCloseModal}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight={700}>
            {isEditing ? 'Editar actividad' : 'Nueva actividad'}
          </Typography>
          <IconButton onClick={onCloseModal} size="small" aria-label="Cerrar">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <form onSubmit={handleSubmit(onSave)}>
        <DialogContent>
          <Stack spacing={3}>

            {/* Nombre de la actividad */}
            <TextField
              label="¿Qué actividad es?"
              placeholder="Ej: Inauguración, Ensayo, Reunión con artistas..."
              fullWidth
              autoFocus
              error={!!errors.title}
              helperText={errors.title?.message ?? 'Escribe un nombre corto y claro'}
              {...register('title', { required: 'El nombre de la actividad es obligatorio' })}
            />

            {/* Fecha y hora de inicio */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <CalendarMonthIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight={600}>
                  ¿Cuándo empieza?
                </Typography>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Controller
                  name="start"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label="Fecha de inicio"
                      value={field.value}
                      maxDate={MAX_DATE}
                      openTo="day"
                      views={['month', 'day']}
                      onChange={(date) => {
                        if (!date) return;
                        const current = field.value ?? new Date();
                        date.setHours(current.getHours(), current.getMinutes());
                        field.onChange(date);
                      }}
                      slotProps={{
                        textField: { fullWidth: true, helperText: 'Día, mes y año' },
                      }}
                    />
                  )}
                />
                <Controller
                  name="start"
                  control={control}
                  render={({ field }) => (
                    <TimePicker
                      label="Hora de inicio"
                      value={field.value}
                      onChange={field.onChange}
                      ampm
                      slotProps={{
                        textField: { fullWidth: true, helperText: 'Hora y minutos' },
                      }}
                    />
                  )}
                />
              </Stack>
            </Box>

            {/* Fecha y hora de fin */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <AccessTimeIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight={600}>
                  ¿Cuándo termina?
                </Typography>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Controller
                  name="end"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label="Fecha de fin"
                      value={field.value}
                      minDate={startValue}
                      maxDate={MAX_DATE}
                      openTo="day"
                      views={['month', 'day']}
                      onChange={(date) => {
                        if (!date) return;
                        const current = field.value ?? new Date();
                        date.setHours(current.getHours(), current.getMinutes());
                        field.onChange(date);
                      }}
                      slotProps={{
                        textField: { fullWidth: true, helperText: 'Día, mes y año' },
                      }}
                    />
                  )}
                />
                <Controller
                  name="end"
                  control={control}
                  render={({ field }) => (
                    <TimePicker
                      label="Hora de fin"
                      value={field.value}
                      onChange={field.onChange}
                      ampm
                      slotProps={{
                        textField: { fullWidth: true, helperText: 'Hora y minutos' },
                      }}
                    />
                  )}
                />
              </Stack>
            </Box>

            {/* Notas */}
            <TextField
              label="Notas adicionales (opcional)"
              placeholder="Cualquier detalle importante sobre esta actividad..."
              fullWidth
              multiline
              rows={3}
              {...register('notes')}
            />

          </Stack>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={onCloseModal} color="inherit" variant="outlined" fullWidth>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={isSubmitting}
            fullWidth
          >
            {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear actividad'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
