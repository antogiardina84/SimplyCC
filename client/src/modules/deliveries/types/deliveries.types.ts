// client/src/modules/deliveries/types/deliveries.types.ts - VERSIONE CORRETTA COMPLETA

// ================================
// CONTRIBUTOR TYPES
// ================================
export interface Contributor {
  id: string;
  name: string;
  vatNumber?: string;
  fiscalCode?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  province?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  basinId?: string;
  basin?: {
    id: string;
    code: string;
    description?: string;
    client?: {
      id: string;
      name: string;
    };
  };
  authorizedMaterialTypes: string; // JSON string array dal backend
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContributorData {
  name: string;
  vatNumber?: string;
  fiscalCode?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  province?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  basinId?: string;
  authorizedMaterialTypes: string[]; // Array per il form
  notes?: string;
}

export interface UpdateContributorData extends Partial<CreateContributorData> {
  isActive?: boolean;
}

export interface ContributorFilters {
  search?: string;
  basinId?: string;
  materialTypeCode?: string;
  isActive?: boolean;
}

// ================================
// MATERIAL TYPE TYPES
// ================================
export interface MaterialType {
  id: string;
  code: string;
  name: string;
  description?: string;
  unit: string;
  cerCode?: string;
  reference?: string;
  color?: string;
  isActive: boolean;
  sortOrder: number;
  parentId?: string;
  parent?: MaterialType;
  children?: MaterialType[];
  createdAt: string;
  updatedAt: string;
}

export interface MaterialTypeHierarchy extends MaterialType {
  children?: MaterialTypeHierarchy[];
}

export interface CreateMaterialTypeData {
  code: string;
  name: string;
  description?: string;
  unit: string;
  cerCode?: string;
  reference?: string;
  color?: string;
  sortOrder?: number;
  parentId?: string | null; // Corretto per accettare null
}

export interface UpdateMaterialTypeData extends Partial<CreateMaterialTypeData> {
  isActive?: boolean;
}

export interface MaterialTypesFilters {
  includeInactive?: boolean;
  isParent?: boolean;
}

export interface MaterialTypeStatistics {
  year: number;
  totalWeight: number;
  totalDeliveries: number;
  byContributor: Record<string, { weight: number; count: number }>;
  monthlyTrend: Array<{
    month: string;
    weight: number;
    deliveries: number;
  }>;
  averageDeliveryWeight: number;
  topContributors: Array<{
    contributorName: string;
    weight: number;
    deliveries: number;
    percentage: number;
  }>;
}

// ================================
// DELIVERY TYPES
// ================================
export interface Delivery {
  id: string;
  date: string; // Data conferimento
  contributorId: string;
  contributor: Contributor;
  materialTypeId: string;
  materialType: MaterialType;
  basinId?: string;
  basin?: {
    id: string;
    code: string;
    description?: string;
  };
  clientId?: string;
  client?: {
    id: string;
    name: string;
  };
  weight: number;
  unit: string;
  documentNumber?: string;
  vehiclePlate?: string;
  driverName?: string;
  quality?: string;
  moistureLevel?: string;
  contaminationLevel?: string;
  documents?: string;
  photos?: string;
  notes?: string;
  isValidated: boolean;
  validatedBy?: string;
  validatedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface CreateDeliveryData {
  date: string; // Data conferimento
  contributorId: string;
  materialTypeId: string;
  basinId?: string;
  clientId?: string;
  weight: number;
  unit?: string;
  documentNumber?: string;
  vehiclePlate?: string;
  driverName?: string;
  quality?: string;
  moistureLevel?: string;
  contaminationLevel?: string;
  documents?: string;
  photos?: string;
  notes?: string;
}

export interface UpdateDeliveryData extends Partial<CreateDeliveryData> {
  isValidated?: boolean;
  validatedBy?: string;
  validatedAt?: string;
}

export interface DeliveryFilters {
  startDate?: Date;
  endDate?: Date;
  contributorId?: string;
  materialTypeId?: string;
  basinId?: string;
  isValidated?: boolean;
}

// ================================
// CALENDAR TYPES
// ================================
export interface MaterialBreakdown {
  materialTypeId: string;
  materialTypeName: string;
  totalWeight: number;
  count: number; // Alias per deliveryCount per compatibilità
  deliveryCount?: number; // Mantieni per retrocompatibilità
}

export interface DayDeliveryData {
  date: string;
  hasDeliveries: boolean;
  totalWeight: number;
  totalDeliveries: number;
  deliveriesCount?: number; // Alias per totalDeliveries
  materialsBreakdown: MaterialBreakdown[];
}

export interface MonthlyTotals {
  totalDeliveries: number;
  totalWeight: number;
  materialTypeBreakdown: MaterialBreakdown[];
  averageDailyWeight: number;
}

export interface MonthlyCalendarData {
  year: number;
  month: number;
  days: DayDeliveryData[];
  monthlyTotals: MonthlyTotals;
}

// ================================
// STATISTICS TYPES
// ================================
export interface ContributorStatistics {
  contributorId: string;
  contributorName: string;
  year: number;
  totalDeliveries: number;
  totalWeight: number;
  averageWeight: number;
  lastDeliveryDate?: string;
  materialTypeBreakdown: MaterialBreakdown[];
  monthlyData: Array<{
    month: string;
    deliveries: number;
    weight: number;
  }>;
  byMaterial: Record<string, { weight: number; count: number }>;
  monthlyTrend: Array<{
    month: string;
    weight: number;
    deliveries: number;
  }>;
  averageDeliveryWeight: number;
}

// ================================
// FORM TYPES (per React Hook Form)
// ================================
export interface MaterialTypeFormData {
  code: string;
  name: string;
  description?: string;
  unit: string;
  cerCode?: string;
  reference?: string;
  color?: string;
  sortOrder?: number;
  parentId?: string;
  isActive?: boolean;
}

export interface ContributorFormData {
  name: string;
  vatNumber?: string;
  fiscalCode?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  province?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  basinId?: string;
  authorizedMaterialTypes: string[];
  notes?: string;
  isActive?: boolean;
}

export interface DeliveryFormData {
  date: string;
  contributorId: string;
  materialTypeId: string;
  weight: number;
  unit?: string;
  documentNumber?: string;
  vehiclePlate?: string;
  driverName?: string;
  quality?: string;
  notes?: string;
}

// ================================
// API RESPONSE TYPES
// ================================
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ================================
// ERROR TYPES
// ================================
export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// ================================
// UTILITY TYPES
// ================================
export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  order: SortOrder;
}

export interface FilterConfig {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
  value: any;
}

// ================================
// CONSTANTS TYPES
// ================================
export type MaterialUnit = 'kg' | 'ton' | 'mc' | 'lt' | 'pz';

export type MaterialReference = 'COREPLA' | 'CORIPET' | 'COMIECO' | 'CIAL' | 'COREVE' | 'RICREA';

export type DeliveryQuality = 'OTTIMA' | 'BUONA' | 'MEDIA' | 'SCARSA';

export type MoistureLevel = 'BASSO' | 'MEDIO' | 'ALTO';

export type ContaminationLevel = 'BASSO' | 'MEDIO' | 'ALTO';

// ================================
// EXPORT TUTTO PER CONVENIENZA
// ================================
// Rimuovi export di moduli non esistenti per evitare errori TypeScript
// export * from './calendar.types';  // Da creare se necessario
// export * from './filters.types';   // Da creare se necessario