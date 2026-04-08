import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import Box from '@mui/material/Box';
import Assignment from '@mui/icons-material/Assignment';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Flag from '@mui/icons-material/Flag';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TrendingUp from '@mui/icons-material/TrendingUp';
import Typography from '@mui/material/Typography';
import Warning from '@mui/icons-material/Warning';

import { StatCard } from '../components/StatCard';
import { useProjects } from '../../projects/hooks/useProjects';
import { isProjectHealthy, computeProjectHealthFull } from '../../helpers/project-health';

const COLORS = ['#2e7d32', '#d32f2f'];

export const DashboardView = () => {
  const { data: projects = [] } = useProjects();

  const kpiData = useMemo(() => {
    let healthyCount = 0;
    let criticalCount = 0;
    let totalMilestones = 0;
    const milestonesPerMonth: Record<string, number> = {};
    const projectCompositionData: { name: string; score: number; hitos: number; criterios: number }[] = [];

    projects.forEach((p) => {
      const result = computeProjectHealthFull(p);
      const isHealthy = isProjectHealthy(p);

      if (isHealthy) healthyCount++;
      else criticalCount++;

      // Contar hitos
      totalMilestones += p.milestones.length;

      // Agrupar hitos por mes (para gráfica de línea)
      p.milestones.forEach((m) => {
        const date = new Date(m.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        milestonesPerMonth[key] = (milestonesPerMonth[key] || 0) + 1;
      });

      // Score para gráfica de barras
      projectCompositionData.push({
        name: p.title.length > 12 ? p.title.substring(0, 12) + '…' : p.title,
        score: result.score,
        hitos: p.milestones.length,
        criterios: p.acceptanceCriteria.length,
      });
    });

    const healthData = [
      { name: 'Saludables', value: healthyCount },
      { name: 'Críticos', value: criticalCount },
    ];

    // projectCompositionData ya se construyó en el forEach

    const milestoneTrendData = Object.entries(milestonesPerMonth)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, hitos: count }));

    return {
      totalProjects: projects.length,
      healthyCount,
      criticalCount,
      totalMilestones,
      healthData,
      projectCompositionData,
      milestoneTrendData,
    };
  }, [projects]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Dashboard de Proyectos
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Visión general del estado, riesgos y progreso de la cartera.
        </Typography>
        <Divider sx={{ mt: 2 }} />
      </Box>

      {/* SECCIÓN 1: TARJETAS DE KPIs */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Proyectos"
            value={kpiData.totalProjects}
            icon={<Assignment />}
            avatarSx={{ bgcolor: 'primary.light', color: 'primary.main' }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Proyectos Saludables"
            value={kpiData.healthyCount}
            icon={<CheckCircle />}
            avatarSx={{ bgcolor: 'success.light', color: 'success.main' }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="En Riesgo / Críticos"
            value={kpiData.criticalCount}
            icon={<Warning />}
            avatarSx={{ bgcolor: 'error.light', color: 'error.main' }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Hitos Totales"
            value={kpiData.totalMilestones}
            icon={<Flag />}
            avatarSx={{ bgcolor: 'warning.light', color: 'warning.main' }}
          />
        </Grid>
      </Grid>

      {/* SECCIÓN 2: GRÁFICAS */}
      <Grid container spacing={3}>
        {/* Gráfica Circular: Salud del Proyecto */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            sx={{ p: 3, height: 400, display: 'flex', flexDirection: 'column' }}
          >
            <Typography variant="h6" gutterBottom>
              Salud de la Cartera
            </Typography>
            <Box sx={{ flexGrow: 1, width: '100%', minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={kpiData.healthData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {kpiData.healthData.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} Proyectos`, 'Cantidad']}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Gráfica de Barras: Hitos por Proyecto */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, height: 400, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Score de Salud por Proyecto
            </Typography>
            <Box sx={{ flexGrow: 1, width: '100%', minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={kpiData.projectCompositionData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} unit="%" />
                  <Tooltip formatter={(v) => [`${v}/100`, 'Score']} />
                  <Legend />
                  <Bar name="Score de salud" dataKey="score" fill="#1976d2" barSize={40} radius={[4, 4, 0, 0]} />
                  <Bar name="Hitos" dataKey="hitos" fill="#8884d8" barSize={40} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Gráfica de Línea: Tendencia de Hitos (Timeline) */}
        <Grid size={{ xs: 12 }}>
          <Paper
            sx={{ p: 3, height: 350, display: 'flex', flexDirection: 'column' }}
          >
            <Stack direction="row" alignItems="center" gap={1} mb={2}>
              <TrendingUp color="primary" />
              <Typography variant="h6">
                Cronograma de Entregas (Hitos por Mes)
              </Typography>
            </Stack>

            <Box sx={{ flexGrow: 1, width: '100%', minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={kpiData.milestoneTrendData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip labelFormatter={(label) => `Mes: ${label}`} />
                  <Legend />
                  <Line
                    type="monotone"
                    name="Hitos a Entregar"
                    dataKey="hitos"
                    stroke="#ed6c02"
                    strokeWidth={3}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};
