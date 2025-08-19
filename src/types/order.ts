import type { CartItem } from './menu';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out-for-delivery' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  items: CartItem[];
  total: number;
  originalTotal?: number; // Valor original antes do desconto
  discountAmount?: number; // Valor do desconto aplicado
  status: OrderStatus;
  deliveryAddress?: string;
  paymentMethod: 'cash' | 'card' | 'pix';
  notes?: string;
  estimatedDeliveryTime?: string;
  deliveryType?: 'today' | 'scheduled';
  deliveryDate: string; // Data de entrega (sempre preenchida)
  deliveryDateTime?: string; // Data e hora combinadas para ordenação (ISO string)
  scheduledDate?: string;
  scheduledTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderData {
  items: CartItem[];
  deliveryAddress?: string;
  paymentMethod: 'cash' | 'card' | 'pix';
  notes?: string;
  deliveryType?: 'today' | 'scheduled';
  deliveryDate: string; // Data de entrega (sempre preenchida)
  deliveryDateTime?: string; // Data e hora combinadas para ordenação
  scheduledDate?: string;
  scheduledTime?: string;
  userPhone?: string; // Telefone do usuário
  originalTotal?: number; // Valor original antes do desconto
  discountAmount?: number; // Valor do desconto aplicado
}
