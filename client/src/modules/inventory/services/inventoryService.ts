// client/src/modules/inventory/services/inventoryService.ts

import { api } from '../../../core/services/api';
import type {
  Inventory,
  CreateInventoryData,
  UpdateInventoryData,
  InventoryStats,
  InventoryReport,
  InventoryFilters,
} from '../types/inventory.types';

const API_BASE = '/inventory';

export const inventoryService = {
  // Ottieni tutti i movimenti di giacenza con filtri opzionali
  async getAll(filters?: InventoryFilters): Promise<Inventory[]> {
    const params = new URLSearchParams();
    
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.materialType) params.append('materialType', filters.materialType);
    if (filters?.reference) params.append('reference', filters.reference);
    
    const queryString = params.toString();
    const url = `${API_BASE}${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data.data;
  },

  // Ottieni un movimento specifico
  async getById(id: string): Promise<Inventory> {
    const response = await api.get(`${API_BASE}/${id}`);
    return response.data.data;
  },

  // Crea un nuovo movimento di giacenza
  async create(data: CreateInventoryData): Promise<Inventory> {
    const response = await api.post(API_BASE, data);
    return response.data.data;
  },

  // Aggiorna un movimento di giacenza
  async update(id: string, data: UpdateInventoryData): Promise<Inventory> {
    const response = await api.put(`${API_BASE}/${id}`, data);
    return response.data.data;
  },

  // Elimina un movimento di giacenza
  async delete(id: string): Promise<void> {
    await api.delete(`${API_BASE}/${id}`);
  },

  // Ottieni statistiche delle giacenze
  async getStats(): Promise<InventoryStats> {
    const response = await api.get(`${API_BASE}/stats`);
    return response.data.data;
  },

  // Genera report giacenze
  async getReport(startDate: string, endDate: string, materialType?: string): Promise<InventoryReport> {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });
    
    if (materialType) {
      params.append('materialType', materialType);
    }
    
    const response = await api.get(`${API_BASE}/report?${params.toString()}`);
    return response.data.data;
  },

  // Ottieni ultima giacenza per materiale
  async getLatestByMaterial(materialType: string, reference: string): Promise<Inventory | null> {
    try {
      const response = await api.get(`${API_BASE}/latest/${materialType}/${reference}`);
      return response.data.data;
    } catch (error) {
      // Se non trova nessun record, ritorna null invece di errore
      return null;
    }
  },

  // Ottieni movimenti per materiale
  async getByMaterial(materialType: string, reference?: string): Promise<Inventory[]> {
    const params = new URLSearchParams({ materialType });
    if (reference) params.append('reference', reference);
    
    const response = await api.get(`${API_BASE}?${params.toString()}`);
    return response.data.data;
  },

  // Ottieni movimenti per range di date
  async getByDateRange(startDate: string, endDate: string): Promise<Inventory[]> {
    const response = await api.get(`${API_BASE}?startDate=${startDate}&endDate=${endDate}`);
    return response.data.data;
  },
};