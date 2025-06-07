// client/src/modules/pickupOrders/services/ocrPickupOrderService.ts

import api from '../../../core/services/api';

export type PickupOrderStatus = 'DA_EVADERE' | 'PROGRAMMATO' | 'IN_EVASIONE' | 'IN_CARICO' | 'CARICATO' | 'SPEDITO' | 'COMPLETO' | 'CANCELLED';

// Interfacce per le entità logistiche
export interface LogisticEntity {
  id: string;
  name: string;
  address?: string;
  city?: string;
  zipCode?: string;
  province?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  notes?: string;
  entityType: string;
  isActive: boolean;
}

// Interfaccia Client (amministrativo)
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
}

// Interfaccia Basin
export interface Basin {
  id: string;
  code: string;
  description?: string;
  flowType: string;
  clientId: string;
  client?: Client;
}

// Interfaccia PickupOrder aggiornata secondo schema Prisma
export interface PickupOrder {
  id: string;
  orderNumber: string;
  issueDate: string;
  scheduledDate?: string;
  loadingDate?: string;      // AGGIUNTO: Data carico programmata
  unloadingDate?: string;    // AGGIUNTO: Data scarico programmata
  completionDate?: string;
  
  // Entità logistiche (MODIFICATO)
  logisticSenderId?: string;
  logisticSender?: LogisticEntity;
  logisticRecipientId?: string;
  logisticRecipient?: LogisticEntity;
  logisticTransporterId?: string;
  logisticTransporter?: LogisticEntity;
  
  // Cliente amministrativo e bacino
  clientId?: string;
  client?: Client;
  basinId: string;
  basin?: Basin;
  
  flowType: string;
  distanceKm?: number;
  materialType?: string;
  status: PickupOrderStatus;
  
  expectedQuantity?: number;
  actualQuantity?: number;
  destinationQuantity?: number;
  loadedPackages?: number;
  departureWeight?: number;
  arrivalWeight?: number;
  
  assignedOperatorId?: string;
  
  notes?: string;
  documents?: string;
  loadingPhotos?: string;
  loadingVideos?: string;
  
  isRejected?: boolean;
  rejectionReason?: string;
  rejectionDate?: string;
  
  createdAt: string;
  updatedAt: string;
  confidence?: number; // Per OCR
}

export interface CreatePickupOrderData {
  orderNumber: string;
  issueDate: string;
  scheduledDate?: string;
  loadingDate?: string;      // AGGIUNTO
  unloadingDate?: string;    // AGGIUNTO
  completionDate?: string;
  
  logisticSenderId?: string;    // MODIFICATO
  logisticRecipientId?: string; // MODIFICATO
  logisticTransporterId?: string; // AGGIUNTO
  
  clientId?: string;         // AGGIUNTO
  basinId: string;
  flowType: string;
  distanceKm?: number;
  materialType?: string;     // AGGIUNTO
  
  status?: PickupOrderStatus;
  
  expectedQuantity?: number;
  actualQuantity?: number;
  destinationQuantity?: number;
  loadedPackages?: number;   // AGGIUNTO
  departureWeight?: number;  // AGGIUNTO
  arrivalWeight?: number;    // AGGIUNTO
  
  assignedOperatorId?: string; // AGGIUNTO
  
  notes?: string;
  documents?: string;
  loadingPhotos?: string;    // AGGIUNTO
  loadingVideos?: string;    // AGGIUNTO
  
  isRejected?: boolean;      // AGGIUNTO
  rejectionReason?: string;  // AGGIUNTO
  rejectionDate?: string;    // AGGIUNTO
}

export interface UpdatePickupOrderData {
  orderNumber?: string;
  issueDate?: string;
  scheduledDate?: string | null;
  loadingDate?: string | null;      // AGGIUNTO
  unloadingDate?: string | null;    // AGGIUNTO
  completionDate?: string | null;
  
  logisticSenderId?: string | null;    // MODIFICATO
  logisticRecipientId?: string | null; // MODIFICATO
  logisticTransporterId?: string | null; // AGGIUNTO
  
  clientId?: string | null;         // AGGIUNTO
  basinId?: string;
  flowType?: string;
  distanceKm?: number | null;
  materialType?: string | null;     // AGGIUNTO
  
  status?: PickupOrderStatus;
  
  expectedQuantity?: number | null;
  actualQuantity?: number | null;
  destinationQuantity?: number | null;
  loadedPackages?: number | null;   // AGGIUNTO
  departureWeight?: number | null;  // AGGIUNTO
  arrivalWeight?: number | null;    // AGGIUNTO
  
  assignedOperatorId?: string | null; // AGGIUNTO
  
  notes?: string | null;
  documents?: string | null;
  loadingPhotos?: string | null;    // AGGIUNTO
  loadingVideos?: string | null;    // AGGIUNTO
  
  isRejected?: boolean;             // AGGIUNTO
  rejectionReason?: string | null;  // AGGIUNTO
  rejectionDate?: string | null;    // AGGIUNTO
}

// Funzioni API
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