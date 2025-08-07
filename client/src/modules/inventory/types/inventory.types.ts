// client/src/modules/inventory/types/inventory.types.ts

export interface Inventory {
  id: string;
  date: string;
  materialType: string;
  reference: string;
  materialTypeId?: string;
  initialStock: number;
  deliveries: number;
  processing: number;
  shipments: number;
  adjustments: number;
  finalStock: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relazioni
  materialTypeRel?: {
    id: string;
    code: string;
    name: string;
    unit: string;
    color?: string;
  };
}

export interface CreateInventoryData {
  date: string;
  materialType: string;
  reference: string;
  materialTypeId?: string;
  initialStock: number;
  deliveries: number;
  processing: number;
  shipments: number;
  adjustments: number;
  finalStock: number;
  notes?: string;
}

export interface UpdateInventoryData {
  date?: string;
  materialType?: string;
  reference?: string;
  materialTypeId?: string | null;
  initialStock?: number;
  deliveries?: number;
  processing?: number;
  shipments?: number;
  adjustments?: number;
  finalStock?: number;
  notes?: string | null;
}

export interface InventoryMovement {
  type: 'DELIVERY' | 'PROCESSING' | 'SHIPMENT' | 'ADJUSTMENT';
  quantity: number;
  description?: string;
}

export interface InventoryStats {
  currentStocks: {
    materialType: string;
    reference: string;
    _sum: {
      finalStock: number | null;
    };
  }[];
  monthlyMovements: {
    _sum: {
      deliveries: number | null;
      processing: number | null;
      shipments: number | null;
      adjustments: number | null;
    };
  };
  materialBreakdown: {
    materialType: string;
    _sum: {
      finalStock: number | null;
      deliveries: number | null;
      shipments: number | null;
    };
  }[];
}

export interface InventoryReport {
  movements: Inventory[];
  summary: {
    materialType: string;
    reference: string;
    totalDeliveries: number;
    totalProcessing: number;
    totalShipments: number;
    totalAdjustments: number;
    finalStock: number;
  }[];
}

export interface InventoryFilters {
  startDate?: string;
  endDate?: string;
  materialType?: string;
  reference?: string;
}

export const MOVEMENT_TYPES = {
  DELIVERY: 'Conferimenti',
  PROCESSING: 'Lavorazioni',
  SHIPMENT: 'Spedizioni',
  ADJUSTMENT: 'Correzioni',
} as const;

export const MATERIAL_TYPES = [
  'MONO',
  'MULTI',
  'OLIO', 
  'PLASTICA',
  'METALLI',
  'VETRO_SARCO',
] as const;

export const REFERENCES = [
  'COREPLA',
  'CORIPET',
  'COMIECO',
  'RICREA', 
  'RILEGNO',
  'COREVE',
] as const;