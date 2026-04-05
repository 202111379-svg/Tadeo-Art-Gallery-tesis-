import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink } from 'react-router';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoginIcon from '@mui/icons-material/Login';

import type { LoginFormInputs } from '../types';
import { authErrors } from '../errors/auth-errors';
import { useAppDispatch, useAppSelector } from '../../store/reduxHooks';
import { startLoginWithEmailAndPassword } from '../../store/auth';
import { PasswordField } from '../../shared/components/PasswordField';

export const LoginPage = () => {
  const dispatch = useAppDispatch();
  const { status, errorMessage } = useAppSelector((state) => state.auth);
  const isAuthenticating = useMemo(() => status === 'checking', [status]);

  const { formState: { errors }, handleSubmit, register } = useForm<LoginFormInputs>();

  const handleLogin = (data: LoginFormInputs) => {
    dispatch(startLoginWithEmailAndPassword(data));
  };

  return (
    <Stack spacing={1}>
      <Typography variant="h4" fontWeight={800}>
        Bienvenido
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Ingresa tus credenciales para acceder al sistema
      </Typography>

      <Divider sx={{ my: 2 }} />

      <form onSubmit={handleSubmit(handleLogin)}>
        <Stack spacing={2.5}>
          <TextField
            label="Correo electrónico"
            type="email"
            placeholder="correo@ejemplo.com"
            autoComplete="email"
            fullWidth
            error={!!errors.email}
            helperText={errors.email?.message}
            {...register('email', { required: authErrors.email.required })}
          />

          <PasswordField
            label="Contraseña"
            placeholder="Tu contraseña"
            fullWidth
            error={!!errors.password}
            helperText={errors.password?.message}
            {...register('password', { required: authErrors.password.required })}
          />

          {errorMessage && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {errorMessage}
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={isAuthenticating}
            startIcon={<LoginIcon />}
            sx={{ py: 1.5, fontSize: '1rem', fontWeight: 700, borderRadius: 2 }}
          >
            {isAuthenticating ? 'Ingresando...' : 'Iniciar sesión'}
          </Button>
        </Stack>
      </form>

      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          ¿No tienes cuenta?{' '}
          <Link
            component={RouterLink}
            to="/auth/register"
            fontWeight={600}
            color="primary"
          >
            Crear cuenta
          </Link>
        </Typography>
      </Box>
    </Stack>
  );
};
