export interface EventVenue {
  name: string;         // Nombre del lugar
  address?: string;     // Dirección completa
  city?: string;
  country?: string;
  lat?: number;         // Coordenadas (si se usa Google Maps en el futuro)
  lng?: number;
}

export interface EventArtist {
  name: string;
  discipline?: string;  // Pintura, escultura, fotografía, etc.
  contact?: string;
}

export interface ProjectLogistics {
  venue?: EventVenue;
  capacity?: number;          // Aforo máximo del lugar
  expectedAttendees?: number; // Asistentes esperados
  artists?: EventArtist[];    // Artistas participantes
  sectors?: string[];         // Sectores del evento (entrada, sala principal, etc.)
  technicalRequirements?: string; // Requerimientos técnicos (iluminación, sonido, etc.)
  notes?: string;             // Notas adicionales de logística
}
