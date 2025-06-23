// client/src/modules/deliveries/services/contributors.api.ts

import api from '../../../core/services/api';
import type { 
  Contributor, 
  CreateContributorData, 
  UpdateContributorData, 
  ContributorFilters,
  ContributorStatistics 
} from '../types/deliveries.types';

export const contributorsApi = {
  // Ottieni tutti i conferitori con filtri
  getAll: (filters?: ContributorFilters): Promise<Contributor[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.basinId) params.append('basinId', filters.basinId);
    if (filters?.materialTypeCode) params.append('materialTypeCode', filters.materialTypeCode);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());

    return api.get(`/contributors?${params.toString()}`).then(res => res.data);
  },

  // Ottieni conferitore per ID
  getById: (id: string): Promise<Contributor> => {
    return api.get(`/contributors/${id}`).then(res => res.data);
  },

  // Crea nuovo conferitore
  create: (data: CreateContributorData): Promise<Contributor> => {
    return api.post('/contributors', data).then(res => res.data);
  },

  // Aggiorna conferitore
  update: (id: string, data: UpdateContributorData): Promise<Contributor> => {
    return api.put(`/contributors/${id}`, data).then(res => res.data);
  },

  // Elimina conferitore
  delete: (id: string): Promise<void> => {
    return api.delete(`/contributors/${id}`).then(res => res.data);
  },

  // Ottieni conferitori per tipologia materiale
  getByMaterialType: (materialTypeCode: string): Promise<Contributor[]> => {
    return api.get(`/contributors/by-material/${materialTypeCode}`).then(res => res.data);
  },

  // Ottieni statistiche conferitore
  getStatistics: (id: string, year?: number): Promise<ContributorStatistics> => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    
    return api.get(`/contributors/${id}/statistics?${params.toString()}`).then(res => res.data);
  }
};