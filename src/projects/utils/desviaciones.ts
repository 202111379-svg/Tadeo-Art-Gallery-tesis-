import type { Actividad } from '../types/activity';
import type { Desviacion } from '../types/incident';

const MS_POR_DIA = 1000 * 60 * 60 * 24;

/**
 * Genera las desviaciones automáticas a partir del estado actual de las
 * actividades. Reusa id/lección/fecha de las ya guardadas (stored) para que
 * las lecciones escritas por el usuario no se pierdan al recalcular.
 *
 * - Actividad imprevista → desviación 'no_planificada'
 * - Completado después del fin planificado → 'retraso' (no aplica a imprevistas,
 *   que no tienen un plan real)
 * - costo_real > costo_planificado → 'sobrecosto'
 */
export const computeAutoDesviaciones = (
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
        causa:       prev?.causa,
        riesgoId:    prev?.riesgoId,
        leccion:     prev?.leccion,
        auto:        true,
        createdAt:   prev?.createdAt ?? act.fecha_planificada,
      });
    }

    if (act.estado === 'Completado' && act.fecha_real) {
      const finPlan = act.fecha_fin_planificada ?? act.fecha_planificada;
      const diasDesv = Math.round(
        (new Date(act.fecha_real).getTime() - new Date(finPlan).getTime()) / MS_POR_DIA,
      );

      // Retraso: solo para actividades planificadas (las imprevistas no tienen plan real)
      if (!act.no_planificada && diasDesv > 0) {
        const prev = stored.find(
          (d) => d.auto && d.tipo === 'retraso' && d.actividadId === act.id,
        );
        auto.push({
          id:          prev?.id ?? `auto-ret-${act.id}`,
          tipo:        'retraso',
          actividadId: act.id,
          descripcion: `"${act.nombre_actividad}" terminó ${diasDesv} día${diasDesv === 1 ? '' : 's'} después de lo planificado`,
          impacto:     diasDesv > 5 ? 'high' : diasDesv > 2 ? 'medium' : 'low',
          causa:       prev?.causa,
          riesgoId:    prev?.riesgoId,
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
          causa:       prev?.causa,
          riesgoId:    prev?.riesgoId,
          leccion:     prev?.leccion,
          auto:        true,
          createdAt:   prev?.createdAt ?? act.fecha_real,
        });
      }
    }
  }

  return auto;
};
