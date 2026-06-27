import { describe, expect, it } from 'vitest';
import type { Actividad } from '../types/activity';
import type { Desviacion } from '../types/incident';
import { computeAutoDesviaciones } from './desviaciones';

const baseActividad: Actividad = {
  id: 'act-1',
  nombre_actividad: 'Montaje de sala',
  responsable: 'Curador',
  fecha_planificada: '2026-05-01T00:00:00.000Z',
  fecha_fin_planificada: '2026-05-10T00:00:00.000Z',
  recursos_requeridos: [],
  estado: 'Pendiente',
  evidencias: [],
  costo_planificado: 100,
  costo_real: 0,
};

describe('computeAutoDesviaciones', () => {
  it('no genera desviaciones para una actividad pendiente o en ejecución', () => {
    expect(computeAutoDesviaciones([baseActividad], [])).toEqual([]);
    expect(
      computeAutoDesviaciones([{ ...baseActividad, estado: 'En Ejecución' }], [])
    ).toEqual([]);
  });

  it('no genera desviaciones para una actividad completada a tiempo y en presupuesto', () => {
    const actividad: Actividad = {
      ...baseActividad,
      estado: 'Completado',
      fecha_inicio_real: '2026-05-01T00:00:00.000Z',
      fecha_real: '2026-05-10T00:00:00.000Z', // mismo día que el fin planificado
      costo_real: 100, // igual al planificado
    };
    expect(computeAutoDesviaciones([actividad], [])).toEqual([]);
  });

  it('detecta retraso cuando la fecha real supera el fin planificado', () => {
    const actividad: Actividad = {
      ...baseActividad,
      estado: 'Completado',
      fecha_real: '2026-05-13T00:00:00.000Z', // 3 días después
    };
    const [dev] = computeAutoDesviaciones([actividad], []);
    expect(dev.tipo).toBe('retraso');
    expect(dev.auto).toBe(true);
    expect(dev.actividadId).toBe('act-1');
    expect(dev.descripcion).toContain('3 días');
  });

  it('clasifica el impacto del retraso por días (low/medium/high)', () => {
    const mk = (fecha_real: string) =>
      computeAutoDesviaciones(
        [{ ...baseActividad, estado: 'Completado', fecha_real }],
        []
      ).find((d) => d.tipo === 'retraso');

    expect(mk('2026-05-11T00:00:00.000Z')?.impacto).toBe('low');    // 1 día
    expect(mk('2026-05-14T00:00:00.000Z')?.impacto).toBe('medium'); // 4 días
    expect(mk('2026-05-20T00:00:00.000Z')?.impacto).toBe('high');   // 10 días
  });

  it('NO genera retraso para actividades no planificadas (no tienen plan real)', () => {
    const actividad: Actividad = {
      ...baseActividad,
      no_planificada: true,
      estado: 'Completado',
      fecha_real: '2026-05-20T00:00:00.000Z',
      costo_planificado: 0,
    };
    const tipos = computeAutoDesviaciones([actividad], []).map((d) => d.tipo);
    expect(tipos).not.toContain('retraso');
    expect(tipos).toContain('no_planificada');
  });

  it('detecta sobrecosto cuando el costo real supera el planificado', () => {
    const actividad: Actividad = {
      ...baseActividad,
      estado: 'Completado',
      fecha_real: '2026-05-10T00:00:00.000Z',
      costo_real: 250, // 150 sobre 100
    };
    const dev = computeAutoDesviaciones([actividad], []).find((d) => d.tipo === 'sobrecosto');
    expect(dev).toBeDefined();
    expect(dev?.impacto).toBe('medium'); // exceso 150 → medium
  });

  it('clasifica el impacto del sobrecosto por exceso (low/medium/high)', () => {
    const mk = (costo_real: number) =>
      computeAutoDesviaciones(
        [{ ...baseActividad, estado: 'Completado', fecha_real: '2026-05-10T00:00:00.000Z', costo_real }],
        []
      ).find((d) => d.tipo === 'sobrecosto');

    expect(mk(150)?.impacto).toBe('low');    // exceso 50
    expect(mk(300)?.impacto).toBe('medium'); // exceso 200
    expect(mk(700)?.impacto).toBe('high');   // exceso 600
  });

  it('no genera sobrecosto si el costo planificado es 0', () => {
    const actividad: Actividad = {
      ...baseActividad,
      estado: 'Completado',
      fecha_real: '2026-05-10T00:00:00.000Z',
      costo_planificado: 0,
      costo_real: 500,
    };
    const tipos = computeAutoDesviaciones([actividad], []).map((d) => d.tipo);
    expect(tipos).not.toContain('sobrecosto');
  });

  it('genera retraso y sobrecosto a la vez cuando ambos ocurren', () => {
    const actividad: Actividad = {
      ...baseActividad,
      estado: 'Completado',
      fecha_real: '2026-05-15T00:00:00.000Z', // 5 días tarde
      costo_real: 400, // 300 de exceso
    };
    const tipos = computeAutoDesviaciones([actividad], []).map((d) => d.tipo).sort();
    expect(tipos).toEqual(['retraso', 'sobrecosto']);
  });

  it('genera una desviación "no_planificada" para actividades imprevistas', () => {
    const actividad: Actividad = {
      ...baseActividad,
      no_planificada: true,
      estado: 'Pendiente',
    };
    const [dev] = computeAutoDesviaciones([actividad], []);
    expect(dev.tipo).toBe('no_planificada');
    expect(dev.descripcion).toContain('Montaje de sala');
  });

  it('preserva id, lección, causa y riesgo de las desviaciones ya guardadas', () => {
    const actividad: Actividad = {
      ...baseActividad,
      estado: 'Completado',
      fecha_real: '2026-05-13T00:00:00.000Z',
    };
    const stored: Desviacion[] = [
      {
        id: 'auto-ret-act-1',
        tipo: 'retraso',
        actividadId: 'act-1',
        descripcion: 'texto viejo',
        impacto: 'low',
        causa: 'proveedor',
        riesgoId: 'riesgo-7',
        leccion: 'Pedir materiales con más anticipación',
        auto: true,
        createdAt: '2026-05-13T00:00:00.000Z',
      },
    ];
    const [dev] = computeAutoDesviaciones([actividad], stored);
    expect(dev.id).toBe('auto-ret-act-1');
    expect(dev.causa).toBe('proveedor');
    expect(dev.riesgoId).toBe('riesgo-7');
    expect(dev.leccion).toBe('Pedir materiales con más anticipación');
    // La descripción sí se recalcula con los datos actuales
    expect(dev.descripcion).toContain('3 días');
  });
});
