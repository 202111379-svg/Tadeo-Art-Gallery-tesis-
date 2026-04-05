import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import Box from '@mui/material/Box';

interface Props {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = 'Eliminar',
  onConfirm,
  onCancel,
}: Props) => (
  <Dialog
    open={open}
    onClose={onCancel}
    maxWidth="xs"
    fullWidth
    PaperProps={{ sx: { borderRadius: 3 } }}
  >
    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
      <Box
        sx={{
          bgcolor: 'error.main',
          borderRadius: '50%',
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <WarningAmberRoundedIcon sx={{ color: 'white', fontSize: 20 }} />
      </Box>
      {title}
    </DialogTitle>

    <DialogContent>
      <DialogContentText>{description}</DialogContentText>
    </DialogContent>

    <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
      <Button onClick={onCancel} variant="outlined" color="inherit" fullWidth>
        Cancelar
      </Button>
      <Button onClick={onConfirm} variant="contained" color="error" fullWidth>
        {confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
);
