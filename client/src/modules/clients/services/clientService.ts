// client/src/modules/clients/services/clientService.ts

import api from '../../../core/services/api';

export interface Client {
  id: string;
  name: string;
  vatNumber: string;
  address?: string;
  city?: string;
  zipCode?: string;
  province?: string;
  phone?: string;
  email?: string;
  pec?: string;
  contractId?: string;
  basins?: Basin[];
  createdAt: string;
  updatedAt: string;
}

export interface Basin {
  id: string;
  code: string;
  description?: string;
  flowType: string;
}

export interface CreateClientData {
  name: string;
  vatNumber: string;
  address?: string;
  city?: string;
  zipCode?: string;
  province?: string;
  phone?: string;
  email?: string;
  pec?: string;
  contractId?: string;
}

export interface UpdateClientData {
  name?: string;
  vatNumber?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  province?: string;
  phone?: string;
  email?: string;
  pec?: string;
  contractId?: string;
}

/**
 * Ottiene tutti i clienti
 */
export const getClients = async (): Promise<Client[]> => {
  const response = await api.get('/clients');
  return response.data;
};

/**
 * Ottiene un cliente per ID
 */
export const getClientById = async (id: string): Promise<Client> => {
  const response = await api.get(`/clients/${id}`);
  return response.data;
};

/**
 * Crea un nuovo cliente
 */
export const createClient = async (data: CreateClientData): Promise<Client> => {
  const response = await api.post('/clients', data);
  return response.data;
};

/**
 * Aggiorna un cliente esistente
 */
export const updateClient = async (id: string, data: UpdateClientData): Promise<Client> => {
  const response = await api.put(`/clients/${id}`, data);
  return response.data;
};

/**
 * Elimina un cliente
 */
export const deleteClient = async (id: string): Promise<void> => {
  await api.delete(`/clients/${id}`);
};

/**
 * Cerca clienti per nome o partita IVA
 */
export const searchClients = async (query: string): Promise<Client[]> => {
  const response = await api.get(`/clients/search?q=${encodeURIComponent(query)}`);
  return response.data;
};

/**
 * Verifica se una partita IVA è disponibile
 */
export const checkVatNumberAvailability = async (vatNumber: string, excludeId?: string): Promise<boolean> => {
  const params = new URLSearchParams({ vatNumber });
  if (excludeId) {
    params.append('excludeId', excludeId);
  }
  
  const response = await api.get(`/clients/check-vat?${params}`);
  return response.data.available;
};