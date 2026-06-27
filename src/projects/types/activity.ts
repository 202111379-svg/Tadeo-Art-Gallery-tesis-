export type ActividadEstado = 'Pendiente' | 'En Ejecución' | 'Completado';

export const ACTIVIDAD_ESTADO_LABELS: Record<ActividadEstado, string> = {
  Pendiente: 'Pendiente',
  'En Ejecución': 'En Ejecución',
  Completado: 'Completado',
};

export interface ActividadRecurso {
  id: string;
  nombre_recurso: string;
  obtenido: boolean;
  evidencias?: string[];
  fecha_obtenido?: string;
}

export interface Actividad {
  id: string;
  nombre_actividad: string;
  responsable: string;
  /** Teléfono o email del responsable, por si no puede asistir y hay que contactarlo. */
  contacto_responsable?: string;
  /** Orden/secuencia dentro del proyecto: la secuencia marca los tiempos. */
  orden?: number;
  /** true cuando la actividad surgió durante la ejecución (imprevista, no planificada). */
  no_planificada?: boolean;
  /** Inicio planificado de la actividad. */
  fecha_planificada: string;
  /** Fin planificado: junto al inicio define la duración estimada. */
  fecha_fin_planificada?: string;
  /** Inicio real registrado durante la ejecución. */
  fecha_inicio_real?: string;
  /** Fin real: junto al inicio real define la duración real. */
  fecha_real?: string;
  recursos_requeridos: ActividadRecurso[];
  estado: ActividadEstado;
  evidencias: string[];
  costo_planificado: number;
  costo_real: number;
  /** Entregable concreto que debe producir la actividad, definido en planificación. */
  entregable_esperado?: string;
  /** Confirmación (al completar) de que lo entregado cumple el entregable esperado. */
  entregable_verificado?: boolean;
}

export interface FlujoCajaReal {
  id: string;
  actividadId: string;
  descripcion: string;
  monto: number;
  moneda: 'PEN' | 'USD';
  fecha: string;
  notas?: string;
}
