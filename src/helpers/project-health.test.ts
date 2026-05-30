import { describe, expect, it } from 'vitest';
import { computeProjectHealthFull } from './project-health';
import type { Project } from '../projects/types/project';
import type { Actividad } from '../projects/types/activity';

const actividadDetallada = (i: number): Actividad => ({
  id: `act-${i}`,
  nombre_actividad: `Actividad ${i}`,
  responsable: 'Curador',
  orden: i,
  fecha_planificada: '2099-01-10T00:00:00.000Z',
  fecha_fin_planificada: '2099-01-15T00:00:00.000Z',
  recursos_requeridos: [{ id: `r-${i}`, nombre_recurso: 'Sillas', obtenido: false }],
  estado: 'Pendiente',
  evidencias: [],
  costo_planificado: 500,
  costo_real: 0,
});

const baseProject = (overrides: Partial<Project>): Project => ({
  id: 'p1',
  title: 'Exposición de prueba',
  startDate: '2099-01-01T00:00:00.000Z',
  endDate: '2099-12-31T00:00:00.000Z',
  acceptanceCriteria: [],
  milestones: [],
  imagesUrls: [],
  ...overrides,
});

const activitiesScore = (p: Project) =>
  computeProjectHealthFull(p).dimensions.find((d) => d.key === 'activities')!.score;

describe('project health — detalle de actividades', () => {
  it('expone una dimensión de actividades con peso significativo', () => {
    const dim = computeProjectHealthFull(baseProject({})).dimensions.find((d) => d.key === 'activities');
    expect(dim).toBeDefined();
    expect(dim!.weight).toBeGreaterThanOrEqual(0.2);
  });

  it('da score 0 de actividades cuando no hay ninguna planificada', () => {
    expect(activitiesScore(baseProject({ actividades: [] }))).toBe(0);
  });

  it('premia el detalle: 5 actividades completas obtienen score máximo', () => {
    const actividades = Array.from({ length: 5 }, (_, i) => actividadDetallada(i));
    expect(activitiesScore(baseProject({ actividades }))).toBe(100);
  });

  it('una descripción larga no sustituye al detalle de actividades', () => {
    const conTexto = baseProject({ description: 'x'.repeat(500), actividades: [] });
    const conActividades = baseProject({ actividades: [actividadDetallada(0), actividadDetallada(1), actividadDetallada(2)] });
    expect(activitiesScore(conActividades)).toBeGreaterThan(activitiesScore(conTexto));
  });
});
