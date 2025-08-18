import type { CartItem } from './menu';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  deliveryAddress?: string;
  paymentMethod: 'cash' | 'card' | 'pix';
  notes?: string;
  estimatedDeliveryTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderData {
  items: CartItem[];
  deliveryAddress?: string;
  paymentMethod: 'cash' | 'card' | 'pix';
  notes?: string;
}
