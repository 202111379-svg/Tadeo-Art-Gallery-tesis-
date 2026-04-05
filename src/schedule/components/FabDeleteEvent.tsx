import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import Fab from '@mui/material/Fab';
import Tooltip from '@mui/material/Tooltip';
import { useAppDispatch, useAppSelector } from '../../store/reduxHooks';
import { startDeletingEvent } from '../../store/schedule';

export const FabDeleteEvent = () => {
  const dispatch = useAppDispatch();
  const { activeEvent } = useAppSelector((state) => state.schedule);
  const hasEventSelected = !!activeEvent?.id;

  if (!hasEventSelected) return null;

  return (
    <Tooltip title="Eliminar evento seleccionado" placement="left">
      <Fab
        color="primary"
        onClick={() => dispatch(startDeletingEvent())}
        sx={{ boxShadow: 3 }}
      >
        <DeleteRoundedIcon />
      </Fab>
    </Tooltip>
  );
};
