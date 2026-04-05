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
  addedAt: string; // ISO string
}

export interface Sector {
  id: string;
  name: string;
  description?: string;
  workers: Worker[];
}

export interface DistributionState {
  sectors: Sector[];
  selectedSectorId: string | null;
}
