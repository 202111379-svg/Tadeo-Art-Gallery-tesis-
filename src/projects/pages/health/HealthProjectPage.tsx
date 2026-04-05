import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { SelectChangeEvent } from '@mui/material/Select';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import { useAppDispatch } from '../../../store/reduxHooks';
import type { Project } from '../../types/project';
import { setActiveProject } from '../../store';
import {
  computeProjectHealthFull,
  healthLabel,
  healthColor,
  healthBgColor,
} from '../../../helpers/project-health';
import type { HealthState, ProjectHealthResult } from '../../../helpers/project-health';
import { useProjects } from '../../hooks/useProjects';
import { FullScreenMessage } from '../../../shared/components/FullScreenMessage';

import './HealthProjectPage.css';

type ProjectWithHealth = { project: Project; result: ProjectHealthResult };

export const HealthProjectPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: projects = [], isLoading } = useProjects();

  const [statusFilter, setStatusFilter] = useState<'all' | HealthState>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  const projectsWithHealth: ProjectWithHealth[] = useMemo(
    () => projects.map((p) => ({ project: p, result: computeProjectHealthFull(p) })),
    [projects]
  );

  const filtered = useMemo(() => {
    let list = projectsWithHealth.slice();

    if (statusFilter !== 'all')
      list = list.filter((x) => x.result.state === statusFilter);

    if (fromDate) {
      const from = new Date(fromDate).getTime();
      list = list.filter(
        (x) => !!x.project.startDate && new Date(x.project.startDate).getTime() >= from
      );
    }

    if (toDate) {
      const to = new Date(toDate).getTime();
      list = list.filter(
        (x) => !!x.project.startDate && new Date(x.project.startDate).getTime() <= to
      );
    }

    if (searchFilter.trim().length > 0) {
      const term = searchFilter.toLowerCase();
      list = list.filter(
        (x) =>
          (x.project.title ?? '').toLowerCase().includes(term) ||
          (x.project.description ?? '').toLowerCase().includes(term)
      );
    }

    // Ordenar: críticos primero
    list.sort((a, b) => a.result.score - b.result.score);

    return list;
  }, [projectsWithHealth, statusFilter, fromDate, toDate, searchFilter]);

  const counts = useMemo(
    () => ({
      green: projectsWithHealth.filter((x) => x.result.state === 'green').length,
      amber: projectsWithHealth.filter((x) => x.result.state === 'amber').length,
      red: projectsWithHealth.filter((x) => x.result.state === 'red').length,
    }),
    [projectsWithHealth]
  );

  const onClickProject = (p: Project) => {
    dispatch(setActiveProject(p));
    navigate(`/projects/${p.id}`);
  };

  if (isLoading) return <FullScreenMessage message="Cargando proyectos..." />;
  if (projects.length === 0) return <FullScreenMessage message="No hay proyectos para mostrar" />;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Tablero de Salud del Portafolio
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Score calculado sobre 6 dimensiones: documentación, evidencia visual,
        planificación, hitos, criterios de aceptación y avance.
      </Typography>

      {/* Resumen global */}
      <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
        <Chip
          icon={<CheckCircleIcon />}
          label={`Saludable (${counts.green})`}
          sx={{ bgcolor: healthBgColor.green, color: healthColor.green, fontWeight: 600 }}
        />
        <Chip
          label={`En atención (${counts.amber})`}
          sx={{ bgcolor: healthBgColor.amber, color: healthColor.amber, fontWeight: 600 }}
        />
        <Chip
          icon={<CancelIcon />}
          label={`Crítico (${counts.red})`}
          sx={{ bgcolor: healthBgColor.red, color: healthColor.red, fontWeight: 600 }}
        />
      </Stack>

      {/* Filtros */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={4} flexWrap="wrap">
        <Select
          size="small"
          value={statusFilter}
          onChange={(e: SelectChangeEvent<'all' | HealthState>) =>
            setStatusFilter(e.target.value as 'all' | HealthState)
          }
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="all">Todos los estados</MenuItem>
          <MenuItem value="green">Saludable</MenuItem>
          <MenuItem value="amber">En atención</MenuItem>
          <MenuItem value="red">Crítico</MenuItem>
        </Select>

        <TextField
          size="small"
          type="date"
          label="Desde"
          InputLabelProps={{ shrink: true }}
          value={fromDate}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromDate(e.target.value)}
        />
        <TextField
          size="small"
          type="date"
          label="Hasta"
          InputLabelProps={{ shrink: true }}
          value={toDate}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToDate(e.target.value)}
        />
        <TextField
          size="small"
          label="Buscar"
          placeholder="Título o descripción"
          value={searchFilter}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchFilter(e.target.value)}
        />
        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            setFromDate('');
            setToDate('');
            setSearchFilter('');
            setStatusFilter('all');
          }}
        >
          Limpiar
        </Button>
      </Stack>

      {/* Tarjetas */}
      <Grid container spacing={3}>
        {filtered.map(({ project: p, result }) => {
          const color = healthColor[result.state];
          const bg = healthBgColor[result.state];

          return (
            <Grid key={p.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Card
                variant="outlined"
                sx={{
                  borderLeft: `5px solid ${color}`,
                  height: '100%',
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: 4 },
                }}
              >
                <CardActionArea onClick={() => onClickProject(p)} sx={{ height: '100%' }}>
                  <CardContent>
                    {/* Cabecera */}
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Typography variant="h6" fontWeight={600} sx={{ flex: 1, mr: 1 }}>
                        {p.title ?? 'Sin título'}
                      </Typography>
                      <Chip
                        label={`${result.score}/100`}
                        size="small"
                        sx={{ bgcolor: bg, color, fontWeight: 700, minWidth: 64 }}
                      />
                    </Stack>

                    {/* Estado */}
                    <Chip
                      label={healthLabel[result.state]}
                      size="small"
                      sx={{ bgcolor: bg, color, mb: 1.5, fontWeight: 600 }}
                    />

                    {/* Barra de score */}
                    <Tooltip title={`Score: ${result.score}/100`}>
                      <LinearProgress
                        variant="determinate"
                        value={result.score}
                        sx={{
                          mb: 2,
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'action.hover',
                          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 },
                        }}
                      />
                    </Tooltip>

                    {/* Dimensiones */}
                    <Stack spacing={0.8} mb={2}>
                      {result.dimensions.map((d) => (
                        <Tooltip key={d.key} title={d.detail} placement="top">
                          <Stack direction="row" alignItems="center" spacing={1}>
                            {d.passed ? (
                              <CheckCircleIcon sx={{ fontSize: 14, color: healthColor.green }} />
                            ) : (
                              <CancelIcon sx={{ fontSize: 14, color: healthColor.red }} />
                            )}
                            <Typography variant="caption" sx={{ flex: 1 }}>
                              {d.label}
                            </Typography>
                            <Typography variant="caption" fontWeight={600} color={d.passed ? 'success.main' : 'error.main'}>
                              {d.score}%
                            </Typography>
                          </Stack>
                        </Tooltip>
                      ))}
                    </Stack>

                    {/* Factores de riesgo */}
                    {result.riskFactors.length > 0 && (
                      <>
                        <Divider sx={{ mb: 1 }} />
                        <Typography variant="caption" color="error" fontWeight={600}>
                          ⚠ Riesgos:
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.5}>
                          {result.riskFactors.map((r, i) => (
                            <Chip
                              key={i}
                              label={r}
                              size="small"
                              color="error"
                              variant="outlined"
                              sx={{ fontSize: '0.65rem' }}
                            />
                          ))}
                        </Stack>
                      </>
                    )}

                    {/* Fecha */}
                    <Typography variant="caption" color="text.secondary" display="block" mt={1.5}>
                      {p.startDate ? `Inicio: ${new Date(p.startDate).toLocaleDateString('es-PE')}` : ''}
                      {p.endDate ? ` · Fin: ${new Date(p.endDate).toLocaleDateString('es-PE')}` : ''}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};
