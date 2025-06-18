// client/src/modules/deliveries/services/deliveries.api.ts

import api from '../../../core/services/api';
import type { 
  Delivery, 
  CreateDeliveryData, 
  UpdateDeliveryData, 
  DeliveryFilters, 
  MonthlyCalendarData 
} from '../types/deliveries.types';

export const deliveriesApi = {
  getAll: async (filters?: DeliveryFilters): Promise<Delivery[]> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.contributorId) params.append('contributorId', filters.contributorId);
    if (filters?.materialTypeId) params.append('materialTypeId', filters.materialTypeId);
    if (filters?.basinId) params.append('basinId', filters.basinId);
    if (filters?.isValidated !== undefined) params.append('isValidated', filters.isValidated.toString());

    const response = await api.get(`/deliveries?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<Delivery> => {
    const response = await api.get(`/deliveries/${id}`);
    return response.data;
  },

  create: async (data: CreateDeliveryData): Promise<Delivery> => {
    const response = await api.post('/deliveries', data);
    return response.data;
  },

  update: async (id: string, data: UpdateDeliveryData): Promise<Delivery> => {
    const response = await api.put(`/deliveries/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/deliveries/${id}`);
  },

  validate: async (id: string): Promise<Delivery> => {
    const response = await api.patch(`/deliveries/${id}/validate`);
    return response.data;
  },

  getMonthlyCalendar: async (
    year: number, 
    month: number, 
    materialTypeId?: string,
    basinId?: string
  ): Promise<MonthlyCalendarData> => {
    const params = new URLSearchParams();
    if (materialTypeId) params.append('materialTypeId', materialTypeId);
    if (basinId) params.append('basinId', basinId);

    const response = await api.get(`/calendar/${year}/${month}?${params.toString()}`);
    return response.data;
  },

  getDayDeliveries: async (date: string, materialTypeId?: string): Promise<Delivery[]> => {
    const params = new URLSearchParams();
    if (materialTypeId) params.append('materialTypeId', materialTypeId);

    const response = await api.get(`/calendar/day/${date}?${params.toString()}`);
    return response.data;
  }
};