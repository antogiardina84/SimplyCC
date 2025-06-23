// client/src/modules/deliveries/services/materialTypes.api.ts

import api from '../../../core/services/api';
import type { 
  MaterialType, 
  MaterialTypeHierarchy,
  CreateMaterialTypeData, 
  UpdateMaterialTypeData, 
  MaterialTypesFilters,
  MaterialTypeStatistics 
} from '../types/deliveries.types';

export const materialTypesApi = {
  // Ottieni tutte le tipologie materiali
  getAll: (filters?: MaterialTypesFilters): Promise<MaterialType[]> => {
    const params = new URLSearchParams();
    if (filters?.includeInactive !== undefined) params.append('includeInactive', filters.includeInactive.toString());
    if (filters?.isParent !== undefined) params.append('isParent', filters.isParent.toString());

    return api.get(`/material-types?${params.toString()}`).then(res => res.data);
  },

  // Ottieni tipologia per ID
  getById: (id: string): Promise<MaterialType> => {
    return api.get(`/material-types/${id}`).then(res => res.data);
  },

  // Ottieni tipologia per codice
  getByCode: (code: string): Promise<MaterialType> => {
    return api.get(`/material-types/code/${code}`).then(res => res.data);
  },

  // Ottieni struttura gerarchica
  getHierarchy: (): Promise<MaterialTypeHierarchy[]> => {
    return api.get('/material-types/hierarchy').then(res => res.data);
  },

  // Crea nuova tipologia
  create: (data: CreateMaterialTypeData): Promise<MaterialType> => {
    return api.post('/material-types', data).then(res => res.data);
  },

  // Aggiorna tipologia
  update: (id: string, data: UpdateMaterialTypeData): Promise<MaterialType> => {
    return api.put(`/material-types/${id}`, data).then(res => res.data);
  },

  // Elimina tipologia
  delete: (id: string): Promise<void> => {
    return api.delete(`/material-types/${id}`).then(res => res.data);
  },

  // Ottieni statistiche tipologia
  getStatistics: (id: string, year?: number): Promise<MaterialTypeStatistics> => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    
    return api.get(`/material-types/${id}/statistics?${params.toString()}`).then(res => res.data);
  }
};