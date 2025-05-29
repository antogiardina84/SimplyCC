// client/src/modules/pickupOrders/services/pickupOrderService.ts

import api from '../../../core/services/api';
import type { Client } from '../../clients/services/clientService';
import type { Basin } from '../../basins/services/basinService';

export type PickupOrderStatus = 'PENDING' | 'SCHEDULED' | 'READY' | 'COMPLETED' | 'CANCELLED';

export interface PickupOrder {
  id: string;
  orderNumber: string;
  issueDate: string;
  scheduledDate?: string;
  completionDate?: string;
  shipperId?: string;
  senderId: string;
  sender?: Client;
  recipientId: string;
  recipient?: Client;
  basinId: string;
  basin?: Basin;
  flowType: string;
  distanceKm?: number;
  status: PickupOrderStatus;
  expectedQuantity?: number;
  actualQuantity?: number;
  destinationQuantity?: number;
  notes?: string;
  documents?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePickupOrderData {
  orderNumber: string;
  issueDate: string;
  scheduledDate?: string;
  completionDate?: string;
  shipperId?: string;
  senderId: string;
  recipientId: string;
  basinId: string;
  flowType: string;
  distanceKm?: number;
  status?: PickupOrderStatus;
  expectedQuantity?: number;
  actualQuantity?: number;
  destinationQuantity?: number;
  notes?: string;
  documents?: string;
}

export interface UpdatePickupOrderData {
  orderNumber?: string;
  issueDate?: string;
  scheduledDate?: string | null;
  completionDate?: string | null;
  shipperId?: string | null;
  senderId?: string;
  recipientId?: string;
  basinId?: string;
  flowType?: string;
  distanceKm?: number | null;
  status?: PickupOrderStatus;
  expectedQuantity?: number | null;
  actualQuantity?: number | null;
  destinationQuantity?: number | null;
  notes?: string | null;
  documents?: string | null;
}

export const getPickupOrders = async (): Promise<PickupOrder[]> => {
  const response = await api.get('/pickup-orders');
  return response.data;
};

export const getPickupOrderById = async (id: string): Promise<PickupOrder> => {
  const response = await api.get(`/pickup-orders/${id}`);
  return response.data;
};

export const getPickupOrdersByBasin = async (basinId: string): Promise<PickupOrder[]> => {
  const response = await api.get(`/pickup-orders/basin/${basinId}`);
  return response.data;
};

export const getPickupOrdersByClient = async (clientId: string): Promise<PickupOrder[]> => {
  const response = await api.get(`/pickup-orders/client/${clientId}`);
  return response.data;
};

export const createPickupOrder = async (data: CreatePickupOrderData): Promise<PickupOrder> => {
  const response = await api.post('/pickup-orders', data);
  return response.data;
};

export const updatePickupOrder = async (id: string, data: UpdatePickupOrderData): Promise<PickupOrder> => {
  const response = await api.put(`/pickup-orders/${id}`, data);
  return response.data;
};

export const deletePickupOrder = async (id: string): Promise<PickupOrder> => {
  const response = await api.delete(`/pickup-orders/${id}`);
  return response.data;
};