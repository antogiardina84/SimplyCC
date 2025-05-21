// client/src/modules/basins/services/basinService.ts

import api from '../../../core/services/api';
import type { Client } from '../../clients/services/clientService';

export interface Basin {
  id: string;
  code: string;
  description?: string;
  flowType: string;
  clientId: string;
  client?: Client;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBasinData {
  code: string;
  description?: string;
  flowType: string;
  clientId: string;
}

export interface UpdateBasinData {
  code?: string;
  description?: string;
  flowType?: string;
  clientId?: string;
}

export const getBasins = async (): Promise<Basin[]> => {
  const response = await api.get('/basins');
  return response.data;
};

export const getBasinsByClientId = async (clientId: string): Promise<Basin[]> => {
  const response = await api.get(`/basins/client/${clientId}`);
  return response.data;
};

export const getBasinById = async (id: string): Promise<Basin> => {
  const response = await api.get(`/basins/${id}`);
  return response.data;
};

export const createBasin = async (basinData: CreateBasinData): Promise<Basin> => {
  const response = await api.post('/basins', basinData);
  return response.data;
};

export const updateBasin = async (id: string, basinData: UpdateBasinData): Promise<Basin> => {
  const response = await api.put(`/basins/${id}`, basinData);
  return response.data;
};

export const deleteBasin = async (id: string): Promise<Basin> => {
  const response = await api.delete(`/basins/${id}`);
  return response.data;
};