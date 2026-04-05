export type RiskProbability = 'low' | 'medium' | 'high';
export type RiskImpact = 'low' | 'medium' | 'high';
export type RiskStatus = 'open' | 'mitigated' | 'closed';

export interface Risk {
  id: string;
  description: string;
  probability: RiskProbability;
  impact: RiskImpact;
  status: RiskStatus;
  responsePlan?: string;   // CUS06 — Plan de respuesta
  createdAt: string;
}
