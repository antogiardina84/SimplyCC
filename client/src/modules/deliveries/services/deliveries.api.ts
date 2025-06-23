// client/src/modules/deliveries/services/deliveries.api.ts

import api from '../../../core/services/api';
import type { 
  Delivery, 
  CreateDeliveryData, 
  UpdateDeliveryData, 
  DeliveryFilters,
  MonthlyCalendarData 
} from '../types/deliveries.types';

export const deliveriesApi = {
  // Ottieni tutti i conferimenti con filtri
  getAll: (filters?: DeliveryFilters): Promise<Delivery[]> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());
    if (filters?.contributorId) params.append('contributorId', filters.contributorId);
    if (filters?.materialTypeId) params.append('materialTypeId', filters.materialTypeId);
    if (filters?.basinId) params.append('basinId', filters.basinId);
    if (filters?.isValidated !== undefined) params.append('isValidated', filters.isValidated.toString());

    return api.get(`/deliveries?${params.toString()}`).then(res => res.data);
  },

  // Ottieni conferimento per ID
  getById: (id: string): Promise<Delivery> => {
    return api.get(`/deliveries/${id}`).then(res => res.data);
  },

  // Crea nuovo conferimento
  create: (data: CreateDeliveryData): Promise<Delivery> => {
    return api.post('/deliveries', data).then(res => res.data);
  },

  // AGGIUNTO: Crea multipli conferimenti (per inserimento rapido)
  createBatch: (deliveries: CreateDeliveryData[]): Promise<Delivery[]> => {
    return api.post('/deliveries/batch', { deliveries }).then(res => res.data);
  },

  // Aggiorna conferimento
  update: (id: string, data: UpdateDeliveryData): Promise<Delivery> => {
    return api.put(`/deliveries/${id}`, data).then(res => res.data);
  },

  // Elimina conferimento
  delete: (id: string): Promise<void> => {
    return api.delete(`/deliveries/${id}`).then(res => res.data);
  },

  // Valida conferimento
  validate: (id: string): Promise<Delivery> => {
    return api.patch(`/deliveries/${id}/validate`).then(res => res.data);
  },

  // AGGIUNTO: Ottieni conferimenti per data specifica
  getByDate: (date: string, materialTypeId?: string): Promise<Delivery[]> => {
    const params = new URLSearchParams();
    params.append('date', date);
    if (materialTypeId) params.append('materialTypeId', materialTypeId);
    
    return api.get(`/deliveries/by-date?${params.toString()}`).then(res => res.data);
  },

  // Ottieni dati calendario mensile
  getMonthlyCalendar: (year: number, month: number, materialTypeId?: string): Promise<MonthlyCalendarData> => {
    const params = new URLSearchParams();
    if (materialTypeId) params.append('materialTypeId', materialTypeId);
    
    return api.get(`/calendar/${year}/${month}?${params.toString()}`).then(res => res.data);
  },

  // CORREZIONE: getDayDeliveries ora usa getByDate
  getDayDeliveries: (date: string, materialTypeId?: string): Promise<Delivery[]> => {
    return deliveriesApi.getByDate(date, materialTypeId);
  }
};