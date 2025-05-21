// client/src/modules/users/services/userService.ts

import api from '../../../core/services/api';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

export interface UpdateUserData {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  active?: boolean;
}

export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await api.get('/users');
    
    // Verifica che response.data sia un array
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    // Se response.data è un oggetto che contiene un array di utenti
    if (response.data && typeof response.data === 'object' && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    // Se response.data è un oggetto che contiene un array di utenti in un'altra proprietà
    if (response.data && typeof response.data === 'object' && Array.isArray(response.data.users)) {
      return response.data.users;
    }
    
    // Se nessuna delle condizioni precedenti è vera, restituisci un array vuoto
    console.error('API non ha restituito un array per gli utenti:', response.data);
    return [];
  } catch (error) {
    console.error('Errore durante il recupero degli utenti:', error);
    return [];
  }
};

export const getUserById = async (id: string): Promise<User> => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export const createUser = async (userData: CreateUserData): Promise<User> => {
  const response = await api.post('/users', userData);
  return response.data;
};

export const updateUser = async (id: string, userData: UpdateUserData): Promise<User> => {
  const response = await api.put(`/users/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id: string): Promise<User> => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};