export interface CustomItem {
  id: string;
  title: string;
  subtitle?: string;
  onClick?: () => void;
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  salary: number;
  currency: 'PEN' | 'USD';
  addedAt: string;
  projectId?: string;    // Proyecto al que está asignado
  projectTitle?: string; // Nombre del proyecto (para mostrar sin consulta extra)
}

export interface Sector {
  id: string;
  seasonId?: string;
  name: string;
  description?: string;
  workers: Worker[];
}

export interface DistributionState {
  sectors: Sector[];
  selectedSectorId: string | null;
}
