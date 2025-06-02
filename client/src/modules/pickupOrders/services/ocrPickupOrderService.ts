// client/src/modules/pickupOrders/services/ocrPickupOrderService.ts

import api from '../../../core/services/api';
// Non importare più Client e Basin se non sono usati come oggetti annidati
// import type { Client } from '../../clients/services/clientService';
// import type { Basin } from '../../basins/services/basinService';

export type PickupOrderStatus = 'PENDING' | 'SCHEDULED' | 'READY' | 'COMPLETED' | 'CANCELLED';

export interface PickupOrder {
  id: string;
  orderNumber: string;
  issueDate: string; // Mantieni string se il tuo backend restituisce stringhe per le date
  scheduledDate?: string;
  completionDate?: string;
  shipperId?: string; // Questo campo potrebbe non essere rilevato dall'OCR, ma può essere un ID a un trasportatore
  
  // NUOVE PROPRIETÀ ESTRATTE DALL'OCR (stringhe dirette)
  senderName: string; // Aggiungi questa proprietà
  senderAddress?: string;
  senderCity?: string;
  senderEmail?: string;
  recipientName: string; // Aggiungi questa proprietà
  recipientAddress?: string;
  recipientCity?: string;
  recipientEmail?: string;
  basinCode: string; // Aggiungi questa proprietà
  basinDescription?: string; // Aggiungi questa proprietà
  
  // Vecchie proprietà che potrebbero non essere più necessarie o da gestire diversamente
  // senderId: string; // Se il mittente viene gestito solo per nome dall'OCR, l'ID potrebbe essere obsoleto o opzionale
  // sender?: Client;   // Rimuovi o rendi opzionale se non ricevi più l'oggetto Client completo
  // recipientId: string; // Come per senderId
  // recipient?: Client; // Come per sender
  // basinId: string;     // Come per senderId
  // basin?: Basin;       // Come per sender

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
  confidence?: number; // Aggiungi se vuoi mostrare la confidenza dell'OCR
}

// Le interfacce CreatePickupOrderData e UpdatePickupOrderData dovranno essere aggiornate
// per riflettere le stesse modifiche (es. senderName, recipientName, basinCode)
// Se il backend si aspetta ancora senderId, recipientId, basinId per la creazione/aggiornamento,
// allora queste interfacce devono mantenere sia gli ID che i nomi se necessario.
export interface CreatePickupOrderData {
  orderNumber: string;
  issueDate: string;
  scheduledDate?: string;
  completionDate?: string;
  shipperId?: string;
  
  // Aggiungi questi se il backend li accetta per la creazione
  senderName: string;
  recipientName: string;
  basinCode: string;
  basinDescription?: string;

  // Mantenere ID se il backend li richiede ancora per collegamenti a entità esistenti
  senderId?: string; // Potrebbe essere opzionale o non necessario se si usa solo il nome
  recipientId?: string; // Potrebbe essere opzionale o non necessario
  basinId?: string; // Potrebbe essere opzionale o non necessario
  
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

  // Aggiungi questi se il backend li accetta per l'aggiornamento
  senderName?: string;
  recipientName?: string;
  basinCode?: string;
  basinDescription?: string;

  // Mantenere ID se il backend li richiede ancora
  senderId?: string | null;
  recipientId?: string | null;
  basinId?: string | null;
  
  flowType?: string;
  distanceKm?: number | null;
  status?: PickupOrderStatus;
  expectedQuantity?: number | null;
  actualQuantity?: number | null;
  destinationQuantity?: number | null;
  notes?: string | null;
  documents?: string | null;
}


// Le funzioni di servizio API rimangono invariate nel loro funzionamento,
// ma si aspetteranno i tipi di dati aggiornati.
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