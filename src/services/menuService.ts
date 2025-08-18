import type { 
  MenuItem, 
  ApiResponse
} from '../types';
import api from './api';

export const menuService = {
  async getMenuItems(category?: string): Promise<MenuItem[]> {
    const params = category ? { category } : {};
    const response = await api.get<ApiResponse<MenuItem[]>>('/menu', { params });
    return response.data.data;
  },

  async getMenuItem(id: string): Promise<MenuItem> {
    const response = await api.get<ApiResponse<MenuItem>>(`/menu/${id}`);
    return response.data.data;
  },

  async searchMenuItems(query: string): Promise<MenuItem[]> {
    const response = await api.get<ApiResponse<MenuItem[]>>('/menu/search', {
      params: { q: query }
    });
    return response.data.data;
  },

  async getCategories(): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>('/menu/categories');
    return response.data.data;
  },

  // Admin only
  async createMenuItem(data: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    const response = await api.post<ApiResponse<MenuItem>>('/menu', data);
    return response.data.data;
  },

  async updateMenuItem(id: string, data: Partial<MenuItem>): Promise<MenuItem> {
    const response = await api.put<ApiResponse<MenuItem>>(`/menu/${id}`, data);
    return response.data.data;
  },

  async deleteMenuItem(id: string): Promise<void> {
    await api.delete(`/menu/${id}`);
  },
};
