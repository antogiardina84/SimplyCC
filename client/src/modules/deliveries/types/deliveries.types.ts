// client/src/modules/deliveries/types/deliveries.types.ts

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
  };
  authorizedMaterialTypes: string; // JSON string array
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
  parentId?: string;
}

export interface UpdateMaterialTypeData extends Partial<CreateMaterialTypeData> {
  isActive?: boolean;
}

export interface MaterialTypesFilters {
  includeInactive?: boolean;
  isParent?: boolean;
}

// ================================
// DELIVERY TYPES
// ================================
export interface Delivery {
  id: string;
  date: string; // CORREZIONE: cambiato da deliveryDate a date
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
  date: string; // CORREZIONE: cambiato da deliveryDate a date
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
export interface DayDeliveryData {
  date: string;
  hasDeliveries: boolean;
  totalWeight: number;
  totalDeliveries: number;
  materialsBreakdown: MaterialBreakdown[];
}

export interface MaterialBreakdown {
  materialTypeId: string;
  materialTypeName: string;
  totalWeight: number;
  deliveryCount: number;
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
  totalDeliveries: number;
  totalWeight: number;
  averageWeight: number;
  lastDeliveryDate: string;
  materialTypeBreakdown: MaterialBreakdown[];
  monthlyData: Array<{
    month: string;
    deliveries: number;
    weight: number;
  }>;
}

export interface MaterialTypeStatistics {
  materialTypeId: string;
  materialTypeName: string;
  totalDeliveries: number;
  totalWeight: number;
  averageWeight: number;
  contributorCount: number;
  monthlyData: Array<{
    month: string;
    deliveries: number;
    weight: number;
  }>;
}