export interface StockItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: 'g' | 'kg' | 'un' | 'l' | 'ml';
  unitPrice: number;
  supplier?: string;
  lastUpdated: Date;
  notes?: string;
}

export interface StockMovement {
  id: string;
  stockItemId: string;
  type: 'entrada' | 'saida' | 'ajuste';
  quantity: number;
  reason: string;
  date: Date;
  userId: string;
  notes?: string;
}

export const stockCategories = [
  { id: 'graos', name: 'Grãos', icon: '🌾' },
  { id: 'carnes', name: 'Carnes', icon: '🥩' },
  { id: 'massas', name: 'Massas', icon: '🍝' },
  { id: 'legumes', name: 'Legumes', icon: '🥗' },
  { id: 'acompanhamentos', name: 'Acompanhamentos', icon: '🍟' },
  { id: 'bebidas', name: 'Bebidas', icon: '🥤' },
];
