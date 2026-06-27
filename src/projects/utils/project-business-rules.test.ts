import { describe, expect, it } from 'vitest';
import type { Actividad } from '../types/activity';
import type { Project } from '../types/project';
import {
  calcularDesviacionDias,
  calcularDuracionDias,
  contarEvidenciasActividad,
  contarRecursosObtenidos,
  validarActividadAntesDeGuardar,
  validarActividadesOrganizadas,
  validarCambioEstadoActividad,
  validarFlujoCajaRealAntesDeGuardar,
  validarProyectoPuedeCerrar,
  validarTransicionDeFase,
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

  it('bloquea completar una actividad sin fecha de inicio real', () => {
    expect(() =>
      validarCambioEstadoActividad(
        {
          ...baseActivity,
          fecha_real: '2026-05-11T00:00:00.000Z',
          evidencias: ['https://docs.example/evidencia.pdf'],
          recursos_requeridos: baseActivity.recursos_requeridos.map((recurso) => ({
            ...recurso,
            obtenido: true,
          })),
        },
        'Completado'
      )
    ).toThrow(/inicio real/);
  });

  it('bloquea completar si solo hay evidencia por recurso (la general es obligatoria)', () => {
    expect(() =>
      validarCambioEstadoActividad(
        {
          ...baseActivity,
          fecha_inicio_real: '2026-05-10T00:00:00.000Z',
          fecha_real: '2026-05-11T00:00:00.000Z',
          recursos_requeridos: baseActivity.recursos_requeridos.map((recurso) => ({
            ...recurso,
            obtenido: true,
            evidencias: [`https://docs.example/${recurso.id}.pdf`],
          })),
        },
        'Completado'
      )
    ).toThrow(/evidencia general/);
  });

  it('permite completar una actividad con evidencia general', () => {
    expect(() =>
      validarCambioEstadoActividad(
        {
          ...baseActivity,
          fecha_inicio_real: '2026-05-10T00:00:00.000Z',
          fecha_real: '2026-05-11T00:00:00.000Z',
          evidencias: ['https://docs.example/evidencia-final.pdf'],
          recursos_requeridos: baseActivity.recursos_requeridos.map((recurso) => ({
            ...recurso,
            obtenido: true,
          })),
        },
        'Completado'
      )
    ).not.toThrow();
  });

  it('no re-valida reglas de estado al guardar si la actividad no cambió de estado (datos legacy)', () => {
    const legacy: Actividad = {
      ...baseActivity,
      estado: 'Completado',
      fecha_inicio_real: '2026-05-10T00:00:00.000Z',
      fecha_real: '2026-05-11T00:00:00.000Z',
      evidencias: [], // guardada con la regla anterior (solo evidencia por recurso)
      recursos_requeridos: baseActivity.recursos_requeridos.map((recurso) => ({
        ...recurso,
        obtenido: true,
        evidencias: [`https://docs.example/${recurso.id}.pdf`],
      })),
    };

    // Mismo estado que la versión anterior → no aplica reglas de transición
    expect(() => validarActividadAntesDeGuardar(legacy, legacy)).not.toThrow();
    // Sin versión anterior (validación completa) → sí falla
    expect(() => validarActividadAntesDeGuardar(legacy)).toThrow(/evidencia general/);
  });

  it('bloquea completar si el entregable esperado no fue verificado', () => {
    expect(() =>
      validarCambioEstadoActividad(
        {
          ...baseActivity,
          fecha_inicio_real: '2026-05-10T00:00:00.000Z',
          fecha_real: '2026-05-11T00:00:00.000Z',
          evidencias: ['https://docs.example/evidencia.pdf'],
          entregable_esperado: 'Sala montada con 12 obras colgadas',
          recursos_requeridos: baseActivity.recursos_requeridos.map((recurso) => ({
            ...recurso,
            obtenido: true,
          })),
        },
        'Completado'
      )
    ).toThrow(/entregable/);
  });

  it('permite completar cuando el entregable esperado fue verificado', () => {
    expect(() =>
      validarCambioEstadoActividad(
        {
          ...baseActivity,
          fecha_inicio_real: '2026-05-10T00:00:00.000Z',
          fecha_real: '2026-05-11T00:00:00.000Z',
          evidencias: ['https://docs.example/evidencia.pdf'],
          entregable_esperado: 'Sala montada con 12 obras colgadas',
          entregable_verificado: true,
          recursos_requeridos: baseActivity.recursos_requeridos.map((recurso) => ({
            ...recurso,
            obtenido: true,
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
          actividades: [],
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

  it('bloquea pasar a organizacion sin actividades planificadas', () => {
    expect(() =>
      validarTransicionDeFase(
        {
          phase: 'organizing',
          actividades: [],
          logistics: {},
        },
        'planning'
      )
    ).toThrow(/actividad/);
  });

  it('no fuerza regresar si el proyecto ya estaba en ejecucion', () => {
    expect(() =>
      validarTransicionAEjecucion(
        {
          phase: 'evaluating',
          actividades: [],
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

  it('calcula la duración en días contando ambos extremos', () => {
    expect(
      calcularDuracionDias('2026-05-10T00:00:00.000Z', '2026-05-14T00:00:00.000Z')
    ).toBe(5);
    expect(
      calcularDuracionDias('2026-05-10T00:00:00.000Z', '2026-05-10T00:00:00.000Z')
    ).toBe(1);
  });

  it('devuelve null cuando faltan fechas o el rango es inválido', () => {
    expect(calcularDuracionDias(undefined, '2026-05-14T00:00:00.000Z')).toBeNull();
    expect(
      calcularDuracionDias('2026-05-14T00:00:00.000Z', '2026-05-10T00:00:00.000Z')
    ).toBeNull();
  });

  it('calcula la desviación: positiva por retraso, negativa por adelanto', () => {
    expect(
      calcularDesviacionDias('2026-05-10T00:00:00.000Z', '2026-05-13T00:00:00.000Z')
    ).toBe(3);
    expect(
      calcularDesviacionDias('2026-05-10T00:00:00.000Z', '2026-05-08T00:00:00.000Z')
    ).toBe(-2);
    expect(
      calcularDesviacionDias('2026-05-10T00:00:00.000Z', '2026-05-10T00:00:00.000Z')
    ).toBe(0);
  });

  it('permite planificar una actividad sin responsable (se asigna en Organización)', () => {
    expect(() =>
      validarActividadAntesDeGuardar({ ...baseActivity, responsable: '' })
    ).not.toThrow();
  });

  it('bloquea pasar a Ejecución si una actividad no tiene responsable asignado', () => {
    expect(() =>
      validarActividadesOrganizadas({
        actividades: [{ ...baseActivity, responsable: '' }],
      })
    ).toThrow(/responsable/);
  });

  it('permite pasar a Ejecución cuando todas las actividades tienen responsable', () => {
    expect(() =>
      validarActividadesOrganizadas({ actividades: [baseActivity] })
    ).not.toThrow();
  });

  it('bloquea guardar una actividad con fin planificado anterior al inicio', () => {
    expect(() =>
      validarActividadAntesDeGuardar({
        ...baseActivity,
        fecha_planificada: '2026-05-10T00:00:00.000Z',
        fecha_fin_planificada: '2026-05-08T00:00:00.000Z',
      })
    ).toThrow(/fin planificada/);
  });

  it('bloquea gasto real si el proyecto no tiene actividades', () => {
    const project = {
      id: 'project-1',
      title: 'Expo',
      startDate: '',
      endDate: '',
      acceptanceCriteria: [],
      milestones: [],
      imagesUrls: [],
      actividades: [],
    } satisfies Project;

    expect(() =>
      validarFlujoCajaRealAntesDeGuardar(project, {
        projectId: 'project-1',
      })
    ).toThrow(/actividad/);
  });
});
