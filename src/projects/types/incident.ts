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
