import { useMemo } from 'react';
import { Link as RouterLink } from 'react-router';
import { useForm } from 'react-hook-form';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

import type { RegisterFormInputs } from '../types/register-form-inputs';
import { authErrors } from '../errors/auth-errors';
import { startCreatingUserWithEmailAndPassword } from '../../store/auth';
import { useAppDispatch, useAppSelector } from '../../store/reduxHooks';
import { PasswordField } from '../../shared/components/PasswordField';

export const RegisterPage = () => {
  const dispatch = useAppDispatch();
  const { status, errorMessage } = useAppSelector((state) => state.auth);
  const isAuthenticating = useMemo(() => status === 'checking', [status]);

  const { formState: { errors }, handleSubmit, register } = useForm<RegisterFormInputs>();

  const handleRegister = (data: RegisterFormInputs) => {
    dispatch(startCreatingUserWithEmailAndPassword(data));
  };

  return (
    <Stack spacing={1}>
      <Typography variant="h4" fontWeight={800}>
        Crear cuenta
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Completa los datos para registrarte en el sistema
      </Typography>

      <Divider sx={{ my: 2 }} />

      <form onSubmit={handleSubmit(handleRegister)}>
        <Stack spacing={2.5}>
          <TextField
            label="Nombre completo"
            type="text"
            placeholder="Tu nombre y apellido"
            autoComplete="name"
            fullWidth
            error={!!errors.fullName}
            helperText={errors.fullName?.message}
            {...register('fullName', { required: authErrors.fullName.required })}
          />

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
            placeholder="Mínimo 6 caracteres"
            fullWidth
            error={!!errors.password}
            helperText={errors.password?.message}
            {...register('password', {
              required: authErrors.password.required,
              minLength: { value: 6, message: 'Mínimo 6 caracteres' },
            })}
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
            startIcon={<PersonAddIcon />}
            sx={{ py: 1.5, fontSize: '1rem', fontWeight: 700, borderRadius: 2 }}
          >
            {isAuthenticating ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>
        </Stack>
      </form>

      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          ¿Ya tienes cuenta?{' '}
          <Link
            component={RouterLink}
            to="/auth/login"
            fontWeight={600}
            color="primary"
          >
            Iniciar sesión
          </Link>
        </Typography>
      </Box>
    </Stack>
  );
};
