// client/src/modules/processing/services/processingService.ts

import { api } from '../../../core/services/api';
import type {
  Processing,
  CreateProcessingData,
  UpdateProcessingData,
  ProcessingStats,
  ProcessingFilters,
} from '../types/processing.types';

const API_BASE = '/processing';

export const processingService = {
  // Ottieni tutte le lavorazioni con filtri opzionali
  async getAll(filters?: ProcessingFilters): Promise<Processing[]> {
    const params = new URLSearchParams();
    
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.operatorId) params.append('operatorId', filters.operatorId);
    
    const queryString = params.toString();
    const url = `${API_BASE}${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data.data;
  },

  // Ottieni una lavorazione specifica
  async getById(id: string): Promise<Processing> {
    const response = await api.get(`${API_BASE}/${id}`);
    return response.data.data;
  },

  // Crea una nuova lavorazione
  async create(data: CreateProcessingData): Promise<Processing> {
    const response = await api.post(API_BASE, data);
    return response.data.data;
  },

  // Aggiorna una lavorazione
  async update(id: string, data: UpdateProcessingData): Promise<Processing> {
    const response = await api.put(`${API_BASE}/${id}`, data);
    return response.data.data;
  },

  // Elimina una lavorazione
  async delete(id: string): Promise<void> {
    await api.delete(`${API_BASE}/${id}`);
  },

  // Ottieni statistiche delle lavorazioni
  async getStats(): Promise<ProcessingStats> {
    const response = await api.get(`${API_BASE}/stats`);
    return response.data.data;
  },

  // Ottieni lavorazioni per operatore
  async getByOperator(operatorId: string): Promise<Processing[]> {
    const response = await api.get(`${API_BASE}?operatorId=${operatorId}`);
    return response.data.data;
  },

  // Ottieni lavorazioni per range di date
  async getByDateRange(startDate: string, endDate: string): Promise<Processing[]> {
    const response = await api.get(`${API_BASE}?startDate=${startDate}&endDate=${endDate}`);
    return response.data.data;
  },
};