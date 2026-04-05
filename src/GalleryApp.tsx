import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale/es';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

import { useAppDispatch, useAppSelector } from './store/reduxHooks';
import { showSnackbar } from './store/ui';
import { AppTheme } from './theme';
import { AppRouter } from './router/AppRouter';
import { SeasonProvider } from './seasons/context/SeasonContext';

export const queryClient = new QueryClient();

export const GalleryApp = () => {
  const { isSnackbarOpen, savedMessage } = useAppSelector((state) => state.ui);
  const dispatch = useAppDispatch();

  const handleClose = () => {
    dispatch(showSnackbar({ isOpen: false }));
  };

  return (
    <AppTheme>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
        <QueryClientProvider client={queryClient}>
          <SeasonProvider>
            <AppRouter />
          </SeasonProvider>
          <Snackbar
            open={isSnackbarOpen}
            onClose={handleClose}
            autoHideDuration={5000}
          >
            <Alert onClose={handleClose} severity="success" variant="filled">
              {savedMessage}
            </Alert>
          </Snackbar>
        </QueryClientProvider>
      </LocalizationProvider>
    </AppTheme>
  );
};
