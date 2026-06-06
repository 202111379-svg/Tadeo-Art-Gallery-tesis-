// ─── Desviaciones (nuevo sistema unificado) ──────────────────────────────────

/** Tipos de desviación: 'retraso' y 'sobrecosto' se detectan automáticamente. */
export type DesviacionTipo = 'retraso' | 'sobrecosto' | 'no_planificada' | 'problema';
export type DesviacionImpacto = 'low' | 'medium' | 'high';

export const DESVIACION_TIPO_LABELS: Record<DesviacionTipo, string> = {
  retraso:         'Retraso',
  sobrecosto:      'Sobrecosto',
  no_planificada:  'Actividad imprevista',
  problema:        'Problema',
};

export const DESVIACION_IMPACTO_LABELS: Record<DesviacionImpacto, string> = {
  low:    'Bajo',
  medium: 'Medio',
  high:   'Alto',
};

export interface Desviacion {
  id: string;
  tipo: DesviacionTipo;
  /** Actividad que originó esta desviación (solo en auto-detectadas). */
  actividadId?: string;
  descripcion: string;
  impacto: DesviacionImpacto;
  leccion?: string;
  /** true = generada automáticamente por el sistema; false = registrada manualmente. */
  auto: boolean;
  createdAt: string;
}

// ─── Incidencias (legacy, mantenido para compatibilidad) ─────────────────────

export type IncidentCategory =
  | 'local'        // Problema con el lugar del evento
  | 'artist'       // Artista no llegó, canceló, etc.
  | 'staff'        // Problema con personal / trabajadores
  | 'financial'    // Problema de pago, presupuesto, etc.
  | 'logistics'    // Problema logístico general
  | 'schedule'     // Retraso, cambio de fechas
  | 'other';       // Otro

export type IncidentImpact = 'low' | 'medium' | 'high';

export const INCIDENT_CATEGORY_LABELS: Record<IncidentCategory, string> = {
  local:      'Lugar / Local',
  artist:     'Artista',
  staff:      'Personal',
  financial:  'Financiero / Pagos',
  logistics:  'Logística',
  schedule:   'Cronograma / Retrasos',
  other:      'Otro',
};

export const INCIDENT_IMPACT_LABELS: Record<IncidentImpact, string> = {
  low:    'Bajo',
  medium: 'Medio',
  high:   'Alto',
};

export interface Incident {
  id: string;
  category: IncidentCategory;
  description: string;         // Qué pasó
  impact: IncidentImpact;
  lesson: string;              // Qué hacer diferente la próxima vez
  createdAt: string;           // ISO string
}

export interface ProjectEvaluation {
  goalAchieved: boolean;       // ¿Se cumplió el objetivo?
  rating: 1 | 2 | 3 | 4 | 5;  // Calificación general
  notes: string;               // Notas de cierre
  evaluatedAt: string;         // ISO string
}
