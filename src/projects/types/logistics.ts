export interface EventVenue {
  name: string;
  address?: string;
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
  mapsUrl?: string;  // Link directo a Google Maps
}

export interface EventArtist {
  name: string;
  discipline?: string;  // Pintura, escultura, fotografía, etc.
  contact?: string;
  sector?: string;      // Sector del evento donde expone
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
