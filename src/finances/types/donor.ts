export type DonorType = 'individual' | 'organization';
export type Currency = 'PEN' | 'USD';

interface DonorBase {
  id: string;
  seasonId?: string;       // Temporada a la que pertenece
  type: DonorType;
  amount: number;
  currency: Currency;
  ruc: string;
  date: string;
}

export interface IndividualDonor extends DonorBase {
  type: 'individual';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface OrganizationDonor extends DonorBase {
  type: 'organization';
  organizationName: string;
  location: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
}

export type Donor = IndividualDonor | OrganizationDonor;
