import type { 
  Order, 
  CreateOrderData, 
  OrderStatus,
  ApiResponse,
  PaginatedResponse 
} from '../types';
import api from './api';

export const orderService = {
  async createOrder(data: CreateOrderData): Promise<Order> {
    const response = await api.post<ApiResponse<Order>>('/orders', data);
    return response.data.data;
  },

  async getMyOrders(): Promise<Order[]> {
    const response = await api.get<ApiResponse<Order[]>>('/orders/my-orders');
    return response.data.data;
  },

  async getOrder(id: string): Promise<Order> {
    const response = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    return response.data.data;
  },

  async cancelOrder(id: string): Promise<Order> {
    const response = await api.patch<ApiResponse<Order>>(`/orders/${id}/cancel`);
    return response.data.data;
  },

  // Admin only
  async getAllOrders(page = 1, status?: OrderStatus): Promise<{ orders: Order[]; meta: any }> {
    const params: any = { page };
    if (status) params.status = status;
    
    const response = await api.get<PaginatedResponse<Order>>('/orders', { params });
    return {
      orders: response.data.data,
      meta: response.data.meta
    };
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const response = await api.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status });
    return response.data.data;
  },

  async getOrderStats(): Promise<{
    today: number;
    pending: number;
    preparing: number;
    ready: number;
  }> {
    const response = await api.get<ApiResponse<{
      today: number;
      pending: number;
      preparing: number;
      ready: number;
    }>>('/orders/stats');
    return response.data.data;
  },
};
