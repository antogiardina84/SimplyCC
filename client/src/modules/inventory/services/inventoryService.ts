// client/src/modules/inventory/services/inventoryService.ts - VERSIONE INTEGRATA

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

// ================================
// INTERFACES PER NUOVE API
// ================================

export interface AutomaticMovements {
  materialTypeId: string;
  date: string;
  movements: {
    deliveries: number;
    processingInput: number;
    processingOutput: number;
    shipments: number;
  };
  summary: {
    netMovement: number;
    totalIn: number;
    totalOut: number;
  };
}

export interface StockCalculation {
  materialTypeId: string;
  date: string;
  calculatedStock: number;
}

export interface StockAvailability {
  materialTypeId: string;
  materialType: {
    id: string;
    code: string;
    name: string;
    unit: string;
  };
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  lastMovementDate: string;
}

export interface InventoryDashboard {
  stats: InventoryStats;
  stockAvailability: StockAvailability[];
  dashboard: {
    totals: {
      currentStock: number;
      availableStock: number;
      reservedStock: number;
    };
    alerts: {
      lowStockCount: number;
      outOfStockCount: number;
      lowStockMaterials: Array<{
        id: string;
        name: string;
        currentStock: number;
      }>;
      outOfStockMaterials: Array<{
        id: string;
        name: string;
        currentStock: number;
      }>;
    };
    monthlyMovements: any;
    materialBreakdown: any[];
  };
}

export interface RecalculationResult {
  materialType: string;
  processedDates: number;
  message: string;
}

export interface AutoCreateResult {
  date: string;
  summary: {
    totalMaterials: number;
    successCount: number;
    errorCount: number;
    skippedCount: number;
  };
  details: Array<{
    materialType: string;
    status: 'created' | 'already_exists' | 'no_movements' | 'error';
    movements?: AutomaticMovements['movements'];
    error?: string;
  }>;
}

// ================================
// SERVIZIO INVENTARIO INTEGRATO
// ================================

export const inventoryService = {
  // ================================
  // OPERAZIONI CRUD STANDARD
  // ================================

  /**
   * Ottieni tutti i movimenti di giacenza con filtri opzionali
   */
  async getAll(filters?: InventoryFilters): Promise<Inventory[]> {
    const params = new URLSearchParams();
    
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.materialType) params.append('materialTypeId', filters.materialType); // Aggiornato per usare materialTypeId
    if (filters?.reference) params.append('reference', filters.reference);
    
    const queryString = params.toString();
    const url = `${API_BASE}${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data.data;
  },

  /**
   * Ottieni un movimento specifico
   */
  async getById(id: string): Promise<Inventory> {
    const response = await api.get(`${API_BASE}/${id}`);
    return response.data.data;
  },

  /**
   * Crea un nuovo movimento di giacenza con calcolo automatico
   */
  async create(data: CreateInventoryData): Promise<Inventory> {
    console.log('🚀 Creating inventory with data:', data);
    const response = await api.post(API_BASE, data);
    console.log('✅ Inventory created successfully:', response.data.data);
    return response.data.data;
  },

  /**
   * Aggiorna un movimento di giacenza
   */
  async update(id: string, data: UpdateInventoryData): Promise<Inventory> {
    const response = await api.put(`${API_BASE}/${id}`, data);
    return response.data.data;
  },

  /**
   * Elimina un movimento di giacenza
   */
  async delete(id: string): Promise<void> {
    await api.delete(`${API_BASE}/${id}`);
  },

  // ================================
  // NUOVE API PER CALCOLO AUTOMATICO
  // ================================

  /**
   * Calcola movimenti automatici per una data e materiale
   */
  async calculateAutomaticMovements(materialTypeId: string, date: string): Promise<AutomaticMovements> {
    const response = await api.get(`${API_BASE}/calculate/movements/${materialTypeId}/${date}`);
    return response.data.data;
  },

  /**
   * Calcola giacenza di un materiale a una data specifica
   */
  async calculateStockAtDate(materialTypeId: string, date: string): Promise<StockCalculation> {
    const response = await api.get(`${API_BASE}/calculate/stock/${materialTypeId}/${date}`);
    return response.data.data;
  },

  /**
   * Ricalcola tutte le giacenze per un materiale
   */
  async recalculateForMaterial(materialTypeId: string): Promise<RecalculationResult> {
    const response = await api.post(`${API_BASE}/recalculate/${materialTypeId}`);
    return response.data.data;
  },

  /**
   * Crea automaticamente movimenti per tutti i materiali di una data
   */
  async autoCreateForDate(date: string): Promise<AutoCreateResult> {
    const response = await api.post(`${API_BASE}/auto-create/${date}`);
    return response.data.data;
  },

  // ================================
  // API PER DISPONIBILITÀ STOCK
  // ================================

  /**
   * Ottieni disponibilità stock corrente per tutti i materiali
   */
  async getStockAvailability(): Promise<StockAvailability[]> {
    const response = await api.get(`${API_BASE}/stock/availability`);
    return response.data.data;
  },

  /**
   * Ottieni ultima giacenza per materiale
   */
  async getLatestByMaterialType(materialTypeId: string): Promise<Inventory | null> {
    try {
      const response = await api.get(`${API_BASE}/stock/latest/${materialTypeId}`);
      return response.data.data;
    } catch (error: any) {
      // Se non trova nessun record, ritorna null invece di errore
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // ================================
  // API STATISTICHE E REPORT
  // ================================

  /**
   * Ottieni statistiche delle giacenze
   */
  async getStats(): Promise<InventoryStats> {
    const response = await api.get(`${API_BASE}/stats`);
    return response.data.data;
  },

  /**
   * Genera report giacenze
   */
  async getReport(startDate: string, endDate: string, materialTypeId?: string): Promise<InventoryReport> {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });
    
    if (materialTypeId) {
      params.append('materialTypeId', materialTypeId);
    }
    
    const response = await api.get(`${API_BASE}/report?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Ottieni dati completi per dashboard
   */
  async getDashboard(): Promise<InventoryDashboard> {
    const response = await api.get(`${API_BASE}/dashboard`);
    return response.data.data;
  },

  // ================================
  // API LEGACY (COMPATIBILITÀ)
  // ================================

  /**
   * @deprecated Usa getLatestByMaterialType invece
   */
  async getLatestByMaterial(materialType: string, reference: string): Promise<Inventory | null> {
    try {
      const response = await api.get(`${API_BASE}/latest/${materialType}/${reference}`);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * @deprecated Usa getAll con filtri invece
   */
  async getByMaterial(materialType: string, reference?: string): Promise<Inventory[]> {
    const params = new URLSearchParams({ materialType });
    if (reference) params.append('reference', reference);
    
    const response = await api.get(`${API_BASE}?${params.toString()}`);
    return response.data.data;
  },

  /**
   * @deprecated Usa getAll con filtri invece
   */
  async getByDateRange(startDate: string, endDate: string): Promise<Inventory[]> {
    const response = await api.get(`${API_BASE}?startDate=${startDate}&endDate=${endDate}`);
    return response.data.data;
  },

  // ================================
  // FUNZIONI DI UTILITÀ
  // ================================

  /**
   * Verifica se un materiale ha giacenza sufficiente
   */
  async checkAvailability(materialTypeId: string, requiredQuantity: number): Promise<{
    available: boolean;
    currentStock: number;
    requiredQuantity: number;
    shortage?: number;
  }> {
    try {
      const stockData = await this.calculateStockAtDate(materialTypeId, new Date().toISOString().split('T')[0]);
      const currentStock = stockData.calculatedStock;
      const available = currentStock >= requiredQuantity;
      
      return {
        available,
        currentStock,
        requiredQuantity,
        shortage: available ? undefined : requiredQuantity - currentStock,
      };
    } catch (error) {
      console.error('Error checking availability:', error);
      return {
        available: false,
        currentStock: 0,
        requiredQuantity,
        shortage: requiredQuantity,
      };
    }
  },

  /**
   * Ottieni movimenti suggeriti per una data
   */
  async getSuggestedMovements(materialTypeId: string, date: string): Promise<{
    suggested: CreateInventoryData;
    automatic: AutomaticMovements;
  }> {
    try {
      const automaticMovements = await this.calculateAutomaticMovements(materialTypeId, date);
      const lastStock = await this.getLatestByMaterialType(materialTypeId);
      
      const initialStock = lastStock?.finalStock || 0;
      const deliveries = automaticMovements.movements.deliveries;
      const processing = automaticMovements.movements.processingInput - automaticMovements.movements.processingOutput;
      const shipments = automaticMovements.movements.shipments;
      const finalStock = initialStock + deliveries - processing - shipments;

      const suggested: CreateInventoryData = {
        date,
        materialType: '', // Sarà impostato dal componente
        reference: '', // Sarà impostato dal componente
        materialTypeId,
        initialStock,
        deliveries,
        processing,
        shipments,
        adjustments: 0,
        finalStock,
        notes: 'Movimento suggerito basato su calcolo automatico',
      };

      return {
        suggested,
        automatic: automaticMovements,
      };
    } catch (error) {
      console.error('Error getting suggested movements:', error);
      throw error;
    }
  },

  /**
   * Valida dati prima della creazione
   */
  validateInventoryData(data: CreateInventoryData): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validazioni obbligatorie
    if (!data.materialTypeId) {
      errors.push('Tipo materiale è obbligatorio');
    }

    if (!data.date) {
      errors.push('Data è obbligatoria');
    }

    if (data.initialStock < 0) {
      errors.push('Giacenza iniziale non può essere negativa');
    }

    if ((data.deliveries || 0) < 0) {
      errors.push('Conferimenti non possono essere negativi');
    }

    if ((data.processing || 0) < 0) {
      errors.push('Lavorazioni non possono essere negative');
    }

    if ((data.shipments || 0) < 0) {
      errors.push('Spedizioni non possono essere negative');
    }

    // Validazioni logiche
    const finalStock = data.initialStock + 
                      (data.deliveries || 0) - 
                      (data.processing || 0) - 
                      (data.shipments || 0) + 
                      (data.adjustments || 0);

    if (finalStock < 0) {
      warnings.push('La giacenza finale risulta negativa');
    }

    if (finalStock > 100000) {
      warnings.push('La giacenza finale sembra molto alta');
    }

    const totalMovements = (data.deliveries || 0) + (data.processing || 0) + (data.shipments || 0) + Math.abs(data.adjustments || 0);
    if (totalMovements === 0) {
      warnings.push('Nessun movimento registrato per questa data');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  },

  /**
   * Formatta numeri per visualizzazione
   */
  formatQuantity(quantity: number, unit: string = 'kg'): string {
    return new Intl.NumberFormat('it-IT', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(quantity) + ' ' + unit;
  },

  /**
   * Ottieni colore per stato giacenza
   */
  getStockStatusColor(stock: number): 'success' | 'warning' | 'error' {
    if (stock < 0) return 'error';
    if (stock < 100) return 'warning';
    return 'success';
  },

  /**
   * Ottieni etichetta per stato giacenza
   */
  getStockStatusLabel(stock: number): string {
    if (stock < 0) return 'Negativa';
    if (stock === 0) return 'Esaurita';
    if (stock < 100) return 'Bassa';
    if (stock < 1000) return 'Normale';
    return 'Alta';
  },
};