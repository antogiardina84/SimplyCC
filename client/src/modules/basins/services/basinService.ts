// client/src/modules/basins/services/basinService.ts

import api from '../../../core/services/api';

export interface Basin {
  id: string;
  code: string;
  description?: string;
  flowType: string;
  clientId: string;
  client?: {
    id: string;
    name: string;
    vatNumber: string;
  };
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

/**
 * Ottiene tutti i bacini
 */
export const getBasins = async (): Promise<Basin[]> => {
  const response = await api.get('/basins');
  return response.data;
};

/**
 * Ottiene un bacino per ID
 */
export const getBasinById = async (id: string): Promise<Basin> => {
  const response = await api.get(`/basins/${id}`);
  return response.data;
};

/**
 * Ottiene i bacini di un cliente
 */
export const getBasinsByClient = async (clientId: string): Promise<Basin[]> => {
  const response = await api.get(`/basins/client/${clientId}`);
  return response.data;
};

/**
 * Crea un nuovo bacino
 */
export const createBasin = async (data: CreateBasinData): Promise<Basin> => {
  const response = await api.post('/basins', data);
  return response.data;
};

/**
 * Aggiorna un bacino esistente
 */
export const updateBasin = async (id: string, data: UpdateBasinData): Promise<Basin> => {
  const response = await api.put(`/basins/${id}`, data);
  return response.data;
};

/**
 * Elimina un bacino
 */
export const deleteBasin = async (id: string): Promise<void> => {
  await api.delete(`/basins/${id}`);
};

/**
 * Cerca bacini per codice (fuzzy search)
 */
export const searchBasinsByCode = async (code: string): Promise<Basin[]> => {
  const response = await api.get(`/basins/search?code=${encodeURIComponent(code)}`);
  return response.data;
};

/**
 * Verifica se un codice bacino è disponibile
 */
export const checkBasinCodeAvailability = async (code: string, excludeId?: string): Promise<boolean> => {
  const params = new URLSearchParams({ code });
  if (excludeId) {
    params.append('excludeId', excludeId);
  }
  
  const response = await api.get(`/basins/check-code?${params}`);
  return response.data.available;
};