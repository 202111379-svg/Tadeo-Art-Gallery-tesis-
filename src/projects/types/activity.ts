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
  fecha_planificada: string;
  fecha_real?: string;
  recursos_requeridos: ActividadRecurso[];
  estado: ActividadEstado;
  evidencias: string[];
  costo_planificado: number;
  costo_real: number;
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
