import { describe, expect, it } from 'vitest';
import type { Actividad } from '../types/activity';
import type { Project } from '../types/project';
import {
  contarEvidenciasActividad,
  contarRecursosObtenidos,
  validarCambioEstadoActividad,
  validarFlujoCajaRealAntesDeGuardar,
  validarProyectoPuedeCerrar,
  validarTransicionAEjecucion,
} from './project-business-rules';

const baseActivity: Actividad = {
  id: 'act-1',
  nombre_actividad: 'Montaje de sala',
  responsable: 'Curador',
  fecha_planificada: '2026-05-10T00:00:00.000Z',
  recursos_requeridos: [
    { id: 'res-1', nombre_recurso: 'Permiso Municipal', obtenido: true },
    { id: 'res-2', nombre_recurso: 'Documento UML', obtenido: false },
  ],
  estado: 'Pendiente',
  evidencias: [],
  costo_planificado: 100,
  costo_real: 0,
};

const confirmedVenue = {
  logistics: {
    venue: {
      name: 'Galeria Central',
      confirmed: true,
      evidenceUrls: ['https://docs.example/permiso-local.pdf'],
    },
  },
};

describe('project business rules', () => {
  it('cuenta recursos obtenidos de una actividad', () => {
    expect(contarRecursosObtenidos(baseActivity)).toEqual({
      obtenidos: 1,
      total: 2,
      etiqueta: '1 de 2 recursos obtenidos',
    });
  });

  it('cuenta evidencias generales y evidencias por recurso', () => {
    expect(contarEvidenciasActividad({
      ...baseActivity,
      evidencias: ['https://docs.example/evidencia-general.pdf'],
      recursos_requeridos: [
        {
          id: 'res-1',
          nombre_recurso: 'Permiso Municipal',
          obtenido: true,
          evidencias: ['https://docs.example/permiso.pdf'],
        },
      ],
    })).toBe(2);
  });

  it('bloquea iniciar una actividad si faltan recursos', () => {
    expect(() => validarCambioEstadoActividad(baseActivity, 'En Ejecución')).toThrow(
      /recursos requeridos/
    );
  });

  it('bloquea completar una actividad sin evidencia', () => {
    expect(() =>
      validarCambioEstadoActividad(
        {
          ...baseActivity,
          fecha_real: '2026-05-11T00:00:00.000Z',
          recursos_requeridos: baseActivity.recursos_requeridos.map((recurso) => ({
            ...recurso,
            obtenido: true,
          })),
        },
        'Completado'
      )
    ).toThrow(/evidencia documental/);
  });

  it('permite completar una actividad con evidencia por recurso', () => {
    expect(() =>
      validarCambioEstadoActividad(
        {
          ...baseActivity,
          fecha_real: '2026-05-11T00:00:00.000Z',
          recursos_requeridos: baseActivity.recursos_requeridos.map((recurso) => ({
            ...recurso,
            obtenido: true,
            evidencias: [`https://docs.example/${recurso.id}.pdf`],
          })),
        },
        'Completado'
      )
    ).not.toThrow();
  });

  it('bloquea cerrar proyecto con actividades pendientes', () => {
    expect(() => validarProyectoPuedeCerrar({ actividades: [baseActivity], ...confirmedVenue })).toThrow(
      /no está completada/
    );
  });

  it('bloquea pasar a ejecucion si el local no tiene evidencia', () => {
    expect(() =>
      validarTransicionAEjecucion(
        {
          phase: 'executing',
          logistics: {
            venue: {
              name: 'Galeria Central',
              confirmed: true,
              evidenceUrls: [],
            },
          },
        },
        'organizing'
      )
    ).toThrow(/evidencia del local/);
  });

  it('no fuerza regresar si el proyecto ya estaba en ejecucion', () => {
    expect(() =>
      validarTransicionAEjecucion(
        {
          phase: 'evaluating',
          logistics: {
            venue: {
              name: 'Galeria Central',
              confirmed: false,
              evidenceUrls: [],
            },
          },
        },
        'executing'
      )
    ).not.toThrow();
  });

  it('bloquea gasto real si la actividad no tiene fecha real', () => {
    const project = {
      id: 'project-1',
      title: 'Expo',
      startDate: '',
      endDate: '',
      acceptanceCriteria: [],
      milestones: [],
      imagesUrls: [],
      actividades: [baseActivity],
    } satisfies Project;

    expect(() =>
      validarFlujoCajaRealAntesDeGuardar(project, {
        projectId: 'project-1',
        actividadId: 'act-1',
      })
    ).toThrow(/fecha real/);
  });
});
