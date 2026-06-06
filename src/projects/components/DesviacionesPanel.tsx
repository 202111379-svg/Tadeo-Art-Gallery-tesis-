import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DeleteIcon from '@mui/icons-material/Delete';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

import type { Actividad } from '../types/activity';
import type { Desviacion, DesviacionImpacto, DesviacionTipo } from '../types/incident';
import { DESVIACION_IMPACTO_LABELS, DESVIACION_TIPO_LABELS } from '../types/incident';

interface Props {
  actividades: Actividad[];
  /** Lista persistida: auto-desviaciones con leccion + manuales. */
  desviaciones: Desviacion[];
  onChange: (desviaciones: Desviacion[]) => void;
  readOnly?: boolean;
}

const TIPO_COLOR: Record<DesviacionTipo, 'error' | 'warning' | 'info' | 'default'> = {
  retraso:        'error',
  sobrecosto:     'warning',
  no_planificada: 'info',
  problema:       'default',
};

const IMPACTO_COLOR: Record<DesviacionImpacto, 'error' | 'warning' | 'success'> = {
  high:   'error',
  medium: 'warning',
  low:    'success',
};

/** Genera desviaciones automáticas a partir del estado actual de las actividades. */
const computeAutoDesviaciones = (
  actividades: Actividad[],
  stored: Desviacion[],
): Desviacion[] => {
  const auto: Desviacion[] = [];

  for (const act of actividades) {
    // Actividad no planificada
    if (act.no_planificada) {
      const prev = stored.find(
        (d) => d.auto && d.tipo === 'no_planificada' && d.actividadId === act.id,
      );
      auto.push({
        id:          prev?.id ?? `auto-nop-${act.id}`,
        tipo:        'no_planificada',
        actividadId: act.id,
        descripcion: `Actividad no planificada ejecutada: "${act.nombre_actividad}"`,
        impacto:     'medium',
        leccion:     prev?.leccion,
        auto:        true,
        createdAt:   prev?.createdAt ?? act.fecha_planificada,
      });
    }

    if (act.estado === 'Completado' && act.fecha_real) {
      const finPlan = act.fecha_fin_planificada ?? act.fecha_planificada;
      const diasDesv = Math.round(
        (new Date(act.fecha_real).getTime() - new Date(finPlan).getTime()) / (1000 * 60 * 60 * 24),
      );

      // Retraso
      if (diasDesv > 0) {
        const prev = stored.find(
          (d) => d.auto && d.tipo === 'retraso' && d.actividadId === act.id,
        );
        auto.push({
          id:          prev?.id ?? `auto-ret-${act.id}`,
          tipo:        'retraso',
          actividadId: act.id,
          descripcion: `"${act.nombre_actividad}" terminó ${diasDesv} día${diasDesv === 1 ? '' : 's'} después de lo planificado`,
          impacto:     diasDesv > 5 ? 'high' : diasDesv > 2 ? 'medium' : 'low',
          leccion:     prev?.leccion,
          auto:        true,
          createdAt:   prev?.createdAt ?? act.fecha_real,
        });
      }

      // Sobrecosto
      if (act.costo_planificado > 0 && act.costo_real > act.costo_planificado) {
        const exceso = act.costo_real - act.costo_planificado;
        const prev = stored.find(
          (d) => d.auto && d.tipo === 'sobrecosto' && d.actividadId === act.id,
        );
        auto.push({
          id:          prev?.id ?? `auto-sob-${act.id}`,
          tipo:        'sobrecosto',
          actividadId: act.id,
          descripcion: `"${act.nombre_actividad}" tuvo un sobrecosto de S/ ${exceso.toLocaleString('es-PE')} (plan: S/ ${act.costo_planificado.toLocaleString('es-PE')}, real: S/ ${act.costo_real.toLocaleString('es-PE')})`,
          impacto:     exceso > 500 ? 'high' : exceso > 100 ? 'medium' : 'low',
          leccion:     prev?.leccion,
          auto:        true,
          createdAt:   prev?.createdAt ?? act.fecha_real,
        });
      }
    }
  }

  return auto;
};

export const DesviacionesPanel = ({
  actividades,
  desviaciones,
  onChange,
  readOnly = false,
}: Props) => {
  const [desc, setDesc]             = useState('');
  const [tipo, setTipo]             = useState<DesviacionTipo>('problema');
  const [impacto, setImpacto]       = useState<DesviacionImpacto>('medium');
  const [leccionNew, setLeccionNew] = useState('');

  const autoDesviaciones = computeAutoDesviaciones(actividades, desviaciones);
  const manuales         = desviaciones.filter((d) => !d.auto);
  const efectivas        = [...autoDesviaciones, ...manuales];

  /** Guarda la lección editada en el listado persistido. */
  const updateLeccion = (id: string, leccion: string) => {
    const isAuto = autoDesviaciones.find((d) => d.id === id);
    if (isAuto) {
      // Si ya existe en stored, actualiza; si no, agrega (solo para guardar la lección)
      const alreadyStored = desviaciones.find((d) => d.id === id);
      if (alreadyStored) {
        onChange(desviaciones.map((d) => (d.id === id ? { ...d, leccion } : d)));
      } else {
        onChange([...desviaciones, { ...isAuto, leccion }]);
      }
    } else {
      onChange(desviaciones.map((d) => (d.id === id ? { ...d, leccion } : d)));
    }
  };

  const addManual = () => {
    if (!desc.trim()) return;
    const nueva: Desviacion = {
      id:          Date.now().toString(),
      tipo,
      descripcion: desc.trim(),
      impacto,
      leccion:     leccionNew.trim() || undefined,
      auto:        false,
      createdAt:   new Date().toISOString(),
    };
    onChange([...desviaciones, nueva]);
    setDesc('');
    setLeccionNew('');
    setTipo('problema');
    setImpacto('medium');
  };

  const removeManual = (id: string) =>
    onChange(desviaciones.filter((d) => d.id !== id));

  return (
    <Box>
      {/* Encabezado */}
      <Stack direction="row" alignItems="center" spacing={1} mb={2} flexWrap="wrap">
        <TrendingDownIcon color="warning" fontSize="small" />
        <Typography variant="subtitle2" fontWeight={600}>
          Desviaciones del proyecto
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Diferencias entre lo planificado y lo ejecutado
        </Typography>
        {autoDesviaciones.length > 0 && (
          <Chip
            label={`${autoDesviaciones.length} detectada${autoDesviaciones.length === 1 ? '' : 's'} automáticamente`}
            size="small"
            color="warning"
            variant="outlined"
            icon={<AutoAwesomeIcon />}
          />
        )}
      </Stack>

      {/* Sin desviaciones */}
      {efectivas.length === 0 && (
        <Typography variant="body2" color="text.secondary" fontStyle="italic" mb={2}>
          Sin desviaciones. Los retrasos y sobrecostos se detectan automáticamente al completar actividades.
        </Typography>
      )}

      {/* Lista */}
      {efectivas.length > 0 && (
        <Stack spacing={1.5} mb={3}>
          {efectivas.map((dev) => (
            <Paper
              key={dev.id}
              variant="outlined"
              sx={{
                p:           1.5,
                borderColor: dev.auto ? 'warning.main' : undefined,
                borderStyle: dev.auto ? 'dashed' : 'solid',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box sx={{ flex: 1, mr: 1 }}>
                  {/* Chips de tipo e impacto */}
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" mb={0.75} alignItems="center">
                    {dev.auto && (
                      <Chip
                        label="Auto"
                        size="small"
                        color="warning"
                        variant="filled"
                        icon={<AutoAwesomeIcon />}
                        sx={{ fontSize: '0.65rem' }}
                      />
                    )}
                    <Chip
                      label={DESVIACION_TIPO_LABELS[dev.tipo]}
                      size="small"
                      color={TIPO_COLOR[dev.tipo]}
                      variant="outlined"
                    />
                    <Chip
                      label={`Impacto: ${DESVIACION_IMPACTO_LABELS[dev.impacto]}`}
                      size="small"
                      color={IMPACTO_COLOR[dev.impacto]}
                      variant="outlined"
                    />
                  </Stack>

                  {/* Descripción */}
                  <Typography variant="body2" mb={0.75}>{dev.descripcion}</Typography>

                  {/* Lección aprendida */}
                  {readOnly ? (
                    dev.leccion ? (
                      <Stack direction="row" alignItems="flex-start" spacing={0.5}>
                        <LightbulbIcon sx={{ fontSize: 14, color: 'warning.main', mt: 0.2 }} />
                        <Typography variant="caption" color="text.secondary" fontStyle="italic">
                          Lección: {dev.leccion}
                        </Typography>
                      </Stack>
                    ) : null
                  ) : (
                    <TextField
                      size="small"
                      fullWidth
                      label="Lección aprendida (opcional)"
                      placeholder="¿Qué harías diferente la próxima vez?"
                      value={dev.leccion ?? ''}
                      onChange={(e) => updateLeccion(dev.id, e.target.value)}
                      sx={{ mt: 0.5 }}
                    />
                  )}
                </Box>

                {/* Eliminar solo en manuales */}
                {!readOnly && !dev.auto && (
                  <IconButton size="small" color="error" onClick={() => removeManual(dev.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {/* Formulario para agregar desviación manual */}
      {!readOnly && (
        <>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
            Registrar problema no detectado automáticamente
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select label="Tipo" size="small" fullWidth
                value={tipo}
                onChange={(e) => setTipo(e.target.value as DesviacionTipo)}
              >
                <MenuItem value="problema">Problema</MenuItem>
                <MenuItem value="no_planificada">Actividad imprevista</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select label="Impacto" size="small" fullWidth
                value={impacto}
                onChange={(e) => setImpacto(e.target.value as DesviacionImpacto)}
              >
                {Object.entries(DESVIACION_IMPACTO_LABELS).map(([k, v]) => (
                  <MenuItem key={k} value={k}>{v}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="¿Qué pasó?" size="small" fullWidth multiline rows={2}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Ej: El artista principal canceló 2 días antes sin previo aviso"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Lección aprendida (opcional)" size="small" fullWidth multiline rows={2}
                value={leccionNew}
                onChange={(e) => setLeccionNew(e.target.value)}
                placeholder="Ej: Firmar contrato con cláusula de penalización y tener artista de respaldo confirmado"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Button
                variant="outlined"
                color="warning"
                startIcon={<AddIcon />}
                onClick={addManual}
                disabled={!desc.trim()}
              >
                Registrar desviación
              </Button>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};
