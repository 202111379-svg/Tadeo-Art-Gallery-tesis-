export type BudgetItemCategory =
  | 'infrastructure'  // Infraestructura (sillas, mesas, carpas)
  | 'technology'      // Tecnología (sonido, iluminación, proyectores)
  | 'marketing'       // Marketing (flyers, banners, redes)
  | 'personnel'       // Personal (seguridad, montajistas)
  | 'transport'       // Transporte y logística
  | 'catering'        // Alimentación y catering
  | 'other';          // Otros

export const BUDGET_ITEM_CATEGORY_LABELS: Record<BudgetItemCategory, string> = {
  infrastructure: 'Infraestructura',
  technology:     'Tecnología',
  marketing:      'Marketing',
  personnel:      'Personal',
  transport:      'Transporte',
  catering:       'Catering',
  other:          'Otros',
};

export interface BudgetItem {
  id: string;
  name: string;
  category: BudgetItemCategory;
  quantity: number;
  estimatedUnitCost: number;
  currency: 'PEN' | 'USD';
  notes?: string;
}
