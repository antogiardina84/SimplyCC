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
  clientId: string;
  createdAt: string;
  updatedAt: string;
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

export const getClients = async (): Promise<Client[]> => {
  const response = await api.get('/clients');
  return response.data;
};

export const getClientById = async (id: string): Promise<Client> => {
  const response = await api.get(`/clients/${id}`);
  return response.data;
};

export const createClient = async (clientData: CreateClientData): Promise<Client> => {
  const response = await api.post('/clients', clientData);
  return response.data;
};

export const updateClient = async (id: string, clientData: UpdateClientData): Promise<Client> => {
  const response = await api.put(`/clients/${id}`, clientData);
  return response.data;
};

export const deleteClient = async (id: string): Promise<Client> => {
  const response = await api.delete(`/clients/${id}`);
  return response.data;
};