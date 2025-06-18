// client/src/modules/deliveries/services/materialTypes.api.ts

import api from '../../../core/services/api';
import type { 
  MaterialType, 
  MaterialTypeHierarchy,
  CreateMaterialTypeData, 
  UpdateMaterialTypeData 
} from '../types/deliveries.types';

interface MaterialTypesFilters {
  includeInactive?: boolean;
}

export const materialTypesApi = {
  getAll: async (filters?: MaterialTypesFilters): Promise<MaterialType[]> => {
    const params = new URLSearchParams();
    if (filters?.includeInactive) params.append('includeInactive', 'true');

    const response = await api.get(`/material-types?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<MaterialType> => {
    const response = await api.get(`/material-types/${id}`);
    return response.data;
  },

  getByCode: async (code: string): Promise<MaterialType> => {
    const response = await api.get(`/material-types/code/${code}`);
    return response.data;
  },

  create: async (data: CreateMaterialTypeData): Promise<MaterialType> => {
    const response = await api.post('/material-types', data);
    return response.data;
  },

  update: async (id: string, data: UpdateMaterialTypeData): Promise<MaterialType> => {
    const response = await api.put(`/material-types/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/material-types/${id}`);
  },

  getHierarchy: async (): Promise<MaterialTypeHierarchy[]> => {
    const response = await api.get('/material-types/hierarchy');
    return response.data;
  },

  getStatistics: async (id: string, year?: number): Promise<any> => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());

    const response = await api.get(`/material-types/${id}/statistics?${params.toString()}`);
    return response.data;
  }
};