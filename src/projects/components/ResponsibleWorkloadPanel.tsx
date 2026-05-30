import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';

import type { Actividad } from '../types/activity';

interface Props {
  actividades: Actividad[];
}

interface ResponsableResumen {
  responsable: string;
  contacto?: string;
  total: number;
  completadas: number;
  enEjecucion: number;
  pendientes: number;
  costoPlanificado: number;
  actividades: string[];
}

const SIN_ASIGNAR = 'Sin asignar';

const fmtMoney = (value: number) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);

/**
 * Consolida todas las actividades del proyecto por persona responsable,
 * respondiendo a "¿quién va a hacer cada actividad?" de la fase de Organización.
 */
export const ResponsibleWorkloadPanel = ({ actividades }: Props) => {
  const resumenPorResponsable = useMemo<ResponsableResumen[]>(() => {
    const mapa = new Map<string, ResponsableResumen>();

    for (const actividad of actividades) {
      const nombre = actividad.responsable.trim() || SIN_ASIGNAR;
      const actual = mapa.get(nombre) ?? {
        responsable: nombre,
        contacto: actividad.contacto_responsable,
        total: 0,
        completadas: 0,
        enEjecucion: 0,
        pendientes: 0,
        costoPlanificado: 0,
        actividades: [],
      };

      // Actualiza el contacto si esta actividad lo tiene y el acumulador aún no
      if (!actual.contacto && actividad.contacto_responsable) {
        actual.contacto = actividad.contacto_responsable;
      }

      actual.total += 1;
      actual.costoPlanificado += actividad.costo_planificado;
      actual.actividades.push(actividad.nombre_actividad);
      if (actividad.estado === 'Completado') actual.completadas += 1;
      else if (actividad.estado === 'En Ejecución') actual.enEjecucion += 1;
      else actual.pendientes += 1;

      mapa.set(nombre, actual);
    }

    return [...mapa.values()].sort((a, b) => b.total - a.total);
  }, [actividades]);

  if (actividades.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Aún no hay actividades planificadas. Agrégalas para distribuir responsables.
      </Typography>
    );
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <GroupsIcon color="primary" fontSize="small" />
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Responsabilidades por persona
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Resumen de qué actividades tiene a cargo cada responsable y su avance.
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={2}>
        {resumenPorResponsable.map((persona) => {
          const avance = Math.round((persona.completadas / persona.total) * 100);
          const sinAsignar = persona.responsable === SIN_ASIGNAR;

          return (
            <Grid size={{ xs: 12, md: 6 }} key={persona.responsable}>
              <Paper
                variant="outlined"
                sx={{ p: 2, height: '100%', borderColor: sinAsignar ? 'warning.main' : 'divider' }}
              >
                <Stack direction="row" alignItems="center" spacing={1} mb={persona.contacto ? 0.5 : 1}>
                  <PersonIcon fontSize="small" color={sinAsignar ? 'warning' : 'action'} />
                  <Typography variant="subtitle2" fontWeight={700}>
                    {persona.responsable}
                  </Typography>
                  <Chip
                    label={`${persona.total} actividad${persona.total === 1 ? '' : 'es'}`}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
                {persona.contacto && (
                  <Stack direction="row" alignItems="center" spacing={0.5} mb={1}>
                    <PhoneIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {persona.contacto}
                    </Typography>
                  </Stack>
                )}

                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap mb={1}>
                  <Chip label={`✅ ${persona.completadas} completadas`} size="small" color="success" variant="outlined" />
                  <Chip label={`▶ ${persona.enEjecucion} en ejecución`} size="small" color="primary" variant="outlined" />
                  <Chip label={`🕓 ${persona.pendientes} pendientes`} size="small" variant="outlined" />
                </Stack>

                <Stack direction="row" justifyContent="space-between" mb={0.5}>
                  <Typography variant="caption" color="text.secondary">Avance</Typography>
                  <Typography variant="caption" fontWeight={600}>{avance}%</Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={avance}
                  color={avance === 100 ? 'success' : 'primary'}
                  sx={{ height: 8, borderRadius: 4, mb: 1.5 }}
                />

                <Typography variant="caption" color="text.secondary" display="block">
                  Costo planificado a su cargo: <strong>{fmtMoney(persona.costoPlanificado)}</strong>
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap mt={1}>
                  {persona.actividades.map((nombre, index) => (
                    <Chip key={`${nombre}-${index}`} label={nombre} size="small" />
                  ))}
                </Stack>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};
