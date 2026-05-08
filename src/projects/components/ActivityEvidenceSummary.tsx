import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { Actividad } from '../types/activity';
import { contarEvidenciasActividad, contarRecursosObtenidos } from '../utils/project-business-rules';

interface Props {
  actividades: Actividad[];
}

export const ActivityEvidenceSummary = ({ actividades }: Props) => {
  if (actividades.length === 0) return null;

  return (
    <Stack spacing={1.5}>
      {actividades.map((actividad) => {
        const recursos = contarRecursosObtenidos(actividad);
        const evidencias = contarEvidenciasActividad(actividad);
        const percent = recursos.total > 0
          ? Math.round((recursos.obtenidos / recursos.total) * 100)
          : 0;

        return (
          <Paper key={actividad.id} variant="outlined" sx={{ p: 1.5 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={700}>
                  {actividad.nombre_actividad}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {recursos.etiqueta} - {percent}% de avance - {evidencias} evidencia(s)
                </Typography>
              </Box>
              <Chip label={actividad.estado} size="small" variant="outlined" />
            </Stack>

            {actividad.recursos_requeridos.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                {actividad.recursos_requeridos.map((recurso) => (
                  <Chip
                    key={recurso.id}
                    label={`${recurso.nombre_recurso} (${recurso.evidencias?.length ?? 0} doc.)`}
                    size="small"
                    color={recurso.obtenido ? 'success' : 'default'}
                    variant={recurso.obtenido ? 'filled' : 'outlined'}
                  />
                ))}
              </Stack>
            )}
          </Paper>
        );
      })}
    </Stack>
  );
};
