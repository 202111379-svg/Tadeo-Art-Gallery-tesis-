import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router';
import { Controller, useForm } from 'react-hook-form';
import { addHours, differenceInSeconds } from 'date-fns';
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
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import type { ModalFormInputs } from '../types';
import { useAppDispatch, useAppSelector } from '../../store/reduxHooks';
import { closeDateModal, showSnackbar } from '../../store/ui';
import { setActiveEvent, startSavingEvent } from '../../store/schedule';

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
      dispatch(showSnackbar({ isOpen: true, message: 'La fecha de fin debe ser posterior a la de inicio' }));
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
          {isEditing ? '✏️ Editar evento' : '📅 Nuevo evento'}
          <IconButton onClick={onCloseModal} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <form onSubmit={handleSubmit(onSave)}>
        <DialogContent>
          <Stack spacing={3}>
            {/* Título */}
            <TextField
              label="Título del evento"
              placeholder="Ej: Reunión de equipo"
              fullWidth
              autoFocus
              error={!!errors.title}
              helperText={errors.title?.message}
              {...register('title', { required: 'El título es obligatorio' })}
            />

            {/* Fechas */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="start"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <DateTimePicker
                    label="Inicio"
                    value={field.value}
                    onChange={field.onChange}
                    ampm
                    sx={{ flex: 1 }}
                    slotProps={{
                      textField: { fullWidth: true },
                    }}
                  />
                )}
              />
              <Controller
                name="end"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <DateTimePicker
                    label="Fin"
                    value={field.value}
                    onChange={field.onChange}
                    minDateTime={startValue}
                    ampm
                    sx={{ flex: 1 }}
                    slotProps={{
                      textField: { fullWidth: true },
                    }}
                  />
                )}
              />
            </Stack>

            {/* Notas */}
            <TextField
              label="Notas (opcional)"
              placeholder="Información adicional sobre el evento"
              fullWidth
              multiline
              rows={3}
              {...register('notes')}
            />
          </Stack>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onCloseModal} color="inherit">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear evento'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
