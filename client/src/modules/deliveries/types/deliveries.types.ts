// client/src/modules/deliveries/types/deliveries.types.ts

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
  basin?: Basin;
  authorizedMaterialTypes: string; // JSON string
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Basin {
  id: string;
  code: string;
  description?: string;
  flowType: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Delivery {
  id: string;
  date: string;
  contributorId: string;
  contributor: Contributor;
  materialTypeId: string;
  materialType: MaterialType;
  basinId?: string;
  basin?: Basin;
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

export interface MaterialBreakdown {
  materialTypeId: string;
  materialTypeName: string;
  totalWeight: number;
  count: number;
}

export interface DayDeliveriesSummary {
  date: string;
  totalWeight: number;
  deliveriesCount: number;
  materialsBreakdown: MaterialBreakdown[];
  hasDeliveries: boolean;
}

export interface MonthlyTotals {
  totalWeight: number;
  totalDeliveries: number;
  materialTypeBreakdown: MaterialBreakdown[];
}

export interface MonthlyCalendarData {
  month: string; // YYYY-MM
  days: DayDeliveriesSummary[];
  monthlyTotals: MonthlyTotals;
}

export interface DeliveryFilters {
  startDate?: string;
  endDate?: string;
  contributorId?: string;
  materialTypeId?: string;
  basinId?: string;
  isValidated?: boolean;
}

export interface CreateDeliveryData {
  date: string;
  contributorId: string;
  materialTypeId: string;
  weight: number;
  unit?: string;
  documentNumber?: string;
  vehiclePlate?: string;
  driverName?: string;
  quality?: string;
  moistureLevel?: string;
  contaminationLevel?: string;
  notes?: string;
}

export interface UpdateDeliveryData extends Partial<CreateDeliveryData> {
  isValidated?: boolean;
}

export interface ContributorFilters {
  search?: string;
  basinId?: string;
  materialTypeCode?: string;
  isActive?: boolean;
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
  authorizedMaterialTypes: string[];
  notes?: string;
}

export interface UpdateContributorData extends Partial<CreateContributorData> {
  isActive?: boolean;
}

export interface CreateMaterialTypeData {
  code: string;
  name: string;
  description?: string;
  unit?: string;
  cerCode?: string;
  reference?: string;
  color?: string;
  sortOrder?: number;
  parentId?: string;
}

export interface UpdateMaterialTypeData extends Partial<CreateMaterialTypeData> {
  isActive?: boolean;
}

export interface MaterialTypeHierarchy extends MaterialType {
  children: MaterialTypeHierarchy[];
}