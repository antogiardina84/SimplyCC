// client/src/modules/deliveries/services/contributors.api.ts

import api from '../../../core/services/api';
import type { 
  Contributor, 
  CreateContributorData, 
  UpdateContributorData, 
  ContributorFilters 
} from '../types/deliveries.types';

export const contributorsApi = {
  getAll: async (filters?: ContributorFilters): Promise<Contributor[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.basinId) params.append('basinId', filters.basinId);
    if (filters?.materialTypeCode) params.append('materialTypeCode', filters.materialTypeCode);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());

    const response = await api.get(`/contributors?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<Contributor> => {
    const response = await api.get(`/contributors/${id}`);
    return response.data;
  },

  create: async (data: CreateContributorData): Promise<Contributor> => {
    const response = await api.post('/contributors', data);
    return response.data;
  },

  update: async (id: string, data: UpdateContributorData): Promise<Contributor> => {
    const response = await api.put(`/contributors/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/contributors/${id}`);
  },

  getByMaterialType: async (materialTypeCode: string): Promise<Contributor[]> => {
    const response = await api.get(`/contributors/by-material/${materialTypeCode}`);
    return response.data;
  },

  getStatistics: async (id: string, year?: number): Promise<any> => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());

    const response = await api.get(`/contributors/${id}/statistics?${params.toString()}`);
    return response.data;
  }
};