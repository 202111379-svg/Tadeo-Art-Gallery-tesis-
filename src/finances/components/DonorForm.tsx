import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';

import type { Currency, Donor, DonorType } from '../types/donor';

interface Props {
  onAdd: (donor: Omit<Donor, 'id'>) => void;
  isLoading: boolean;
}

interface IndividualForm {
  firstName: string;
  lastName: string;
  amount: number;
  currency: Currency;
  ruc: string;
  email: string;
  phone: string;
}

interface OrgForm {
  organizationName: string;
  amount: number;
  currency: Currency;
  ruc: string;
  location: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
}

export const DonorForm = ({ onAdd, isLoading }: Props) => {
  const [donorType, setDonorType] = useState<DonorType>('individual');

  const individualForm = useForm<IndividualForm>({
    defaultValues: { currency: 'PEN' },
  });
  const orgForm = useForm<OrgForm>({ defaultValues: { currency: 'PEN' } });

  const handleIndividualSubmit = (data: IndividualForm) => {
    onAdd({
      type: 'individual',
      ...data,
      amount: Number(data.amount),
      date: new Date().toISOString(),
    });
    individualForm.reset({ currency: 'PEN' });
  };

  const handleOrgSubmit = (data: OrgForm) => {
    onAdd({
      type: 'organization',
      ...data,
      amount: Number(data.amount),
      date: new Date().toISOString(),
    });
    orgForm.reset({ currency: 'PEN' });
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
        <Typography variant="subtitle1" fontWeight={600}>
          Tipo de donante
        </Typography>
        <ToggleButtonGroup
          value={donorType}
          exclusive
          size="small"
          onChange={(_, v) => v && setDonorType(v)}
        >
          <ToggleButton value="individual">
            <PersonIcon sx={{ mr: 0.5 }} fontSize="small" />
            Persona
          </ToggleButton>
          <ToggleButton value="organization">
            <BusinessIcon sx={{ mr: 0.5 }} fontSize="small" />
            Empresa / Institución
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {donorType === 'individual' ? (
        <form onSubmit={individualForm.handleSubmit(handleIndividualSubmit)}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Nombre"
                fullWidth
                required
                {...individualForm.register('firstName', { required: true })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Apellido"
                fullWidth
                required
                {...individualForm.register('lastName', { required: true })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Cantidad"
                type="number"
                fullWidth
                required
                inputProps={{ min: 0, step: '0.01' }}
                {...individualForm.register('amount', {
                  required: true,
                  min: 0,
                })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                label="Moneda"
                fullWidth
                defaultValue="PEN"
                {...individualForm.register('currency')}
              >
                <MenuItem value="PEN">Soles (PEN)</MenuItem>
                <MenuItem value="USD">Dólares (USD)</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="RUC / DNI"
                fullWidth
                {...individualForm.register('ruc')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Correo electrónico"
                type="email"
                fullWidth
                {...individualForm.register('email')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Celular"
                fullWidth
                {...individualForm.register('phone')}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading}
                fullWidth
              >
                {isLoading ? 'Registrando...' : 'Registrar donante'}
              </Button>
            </Grid>
          </Grid>
        </form>
      ) : (
        <form onSubmit={orgForm.handleSubmit(handleOrgSubmit)}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Nombre de la empresa / institución"
                fullWidth
                required
                {...orgForm.register('organizationName', { required: true })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Cantidad"
                type="number"
                fullWidth
                required
                inputProps={{ min: 0, step: '0.01' }}
                {...orgForm.register('amount', { required: true, min: 0 })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                label="Moneda"
                fullWidth
                defaultValue="PEN"
                {...orgForm.register('currency')}
              >
                <MenuItem value="PEN">Soles (PEN)</MenuItem>
                <MenuItem value="USD">Dólares (USD)</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="RUC"
                fullWidth
                {...orgForm.register('ruc')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Locación / Dirección"
                fullWidth
                {...orgForm.register('location')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Sitio web"
                fullWidth
                {...orgForm.register('website')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Correo de contacto"
                type="email"
                fullWidth
                {...orgForm.register('contactEmail')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Teléfono de contacto"
                fullWidth
                {...orgForm.register('contactPhone')}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading}
                fullWidth
              >
                {isLoading ? 'Registrando...' : 'Registrar donante'}
              </Button>
            </Grid>
          </Grid>
        </form>
      )}
    </Box>
  );
};
