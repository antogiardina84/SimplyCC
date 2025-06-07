// shared/src/types/entities.ts

// ================================
// TIPI BASE
// ================================

export type PickupOrderStatus = 'DA_EVADERE' | 'PROGRAMMATO' | 'IN_EVASIONE' | 'IN_CARICO' | 'CARICATO' | 'SPEDITO' | 'COMPLETO' | 'CANCELLED';

export type UserRole = 'USER' | 'OPERATOR' | 'MANAGER' | 'ADMIN';

export type FlowType = 'A' | 'B' | 'C' | 'D';

export type EntityType = 'SENDER' | 'RECIPIENT' | 'TRANSPORTER';

// ================================
// ENTITÀ LOGISTICHE
// ================================

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
  entityType: EntityType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLogisticEntityData {
  name: string;
  address?: string;
  city?: string;
  zipCode?: string;
  province?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  notes?: string;
  entityType: EntityType;
  isActive?: boolean;
}

export interface UpdateLogisticEntityData {
  name?: string;
  address?: string | null;
  city?: string | null;
  zipCode?: string | null;
  province?: string | null;
  phone?: string | null;
  email?: string | null;
  contactPerson?: string | null;
  notes?: string | null;
  entityType?: EntityType;
  isActive?: boolean;
}

// ================================
// CLIENTI (AMMINISTRATIVI)
// ================================

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
  contractId?: string;
  createdAt: string;
  updatedAt: string;
  basins?: Basin[];
}

export interface CreateClientData {
  name: string;
  vatNumber: string;
  address?: string;
  city?: string;
  zipCode?: string;
  province?: string;
  phone?: string;
  email?: string;
  pec?: string;
  contractId?: string;
}

export interface UpdateClientData {
  name?: string;
  vatNumber?: string;
  address?: string | null;
  city?: string | null;
  zipCode?: string | null;
  province?: string | null;
  phone?: string | null;
  email?: string | null;
  pec?: string | null;
  contractId?: string | null;
}

// ================================
// BACINI
// ================================

export interface Basin {
  id: string;
  code: string;
  description?: string;
  flowType: FlowType;
  clientId: string;
  client?: Client;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBasinData {
  code: string;
  description?: string;
  flowType: FlowType;
  clientId: string;
}

export interface UpdateBasinData {
  code?: string;
  description?: string | null;
  flowType?: FlowType;
  clientId?: string;
}

// ================================
// BUONI DI RITIRO
// ================================

export interface PickupOrder {
  id: string;
  orderNumber: string;
  issueDate: string;
  scheduledDate?: string;
  loadingDate?: string;
  unloadingDate?: string;
  completionDate?: string;
  
  // Entità Logistiche
  logisticSenderId?: string;
  logisticSender?: LogisticEntity;
  logisticRecipientId?: string;
  logisticRecipient?: LogisticEntity;
  logisticTransporterId?: string;
  logisticTransporter?: LogisticEntity;
  
  // Cliente Amministrativo e Bacino
  clientId?: string;
  client?: Client;
  basinId: string;
  basin?: Basin;
  
  // Dettagli Tecnici
  flowType: FlowType;
  distanceKm?: number;
  materialType?: string;
  
  // Stato e Workflow
  status: PickupOrderStatus;
  
  // Quantità e Pesi
  expectedQuantity?: number;
  actualQuantity?: number;
  destinationQuantity?: number;
  loadedPackages?: number;
  departureWeight?: number;
  arrivalWeight?: number;
  
  // Gestione Operatori
  assignedOperatorId?: string;
  
  // Documenti e Media
  notes?: string;
  documents?: string;
  loadingPhotos?: string;
  loadingVideos?: string;
  
  // Gestione Rifiuti/Respinte
  isRejected?: boolean;
  rejectionReason?: string;
  rejectionDate?: string;
  
  // Audit
  createdAt: string;
  updatedAt: string;
  
  // OCR
  confidence?: number;
}

export interface CreatePickupOrderData {
  orderNumber: string;
  issueDate: string;
  scheduledDate?: string;
  loadingDate?: string;
  unloadingDate?: string;
  completionDate?: string;
  
  logisticSenderId?: string;
  logisticRecipientId?: string;
  logisticTransporterId?: string;
  
  clientId?: string;
  basinId: string;
  flowType: FlowType;
  distanceKm?: number;
  materialType?: string;
  
  status?: PickupOrderStatus;
  
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
}

export interface UpdatePickupOrderData {
  orderNumber?: string;
  issueDate?: string;
  scheduledDate?: string | null;
  loadingDate?: string | null;
  unloadingDate?: string | null;
  completionDate?: string | null;
  
  logisticSenderId?: string | null;
  logisticRecipientId?: string | null;
  logisticTransporterId?: string | null;
  
  clientId?: string | null;
  basinId?: string;
  flowType?: FlowType;
  distanceKm?: number | null;
  materialType?: string | null;
  
  status?: PickupOrderStatus;
  
  expectedQuantity?: number | null;
  actualQuantity?: number | null;
  destinationQuantity?: number | null;
  loadedPackages?: number | null;
  departureWeight?: number | null;
  arrivalWeight?: number | null;
  
  assignedOperatorId?: string | null;
  
  notes?: string | null;
  documents?: string | null;
  loadingPhotos?: string | null;
  loadingVideos?: string | null;
  
  isRejected?: boolean;
  rejectionReason?: string | null;
  rejectionDate?: string | null;
}

// ================================
// CONFERIMENTI
// ================================

export interface Delivery {
  id: string;
  date: string;
  clientId?: string;
  client?: Client;
  basinId?: string;
  basin?: Basin;
  materialType: string;
  materialDescription?: string;
  reference: string;
  weight: number;
  documentNumber?: string;
  documents?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeliveryData {
  date: string;
  clientId?: string;
  basinId?: string;
  materialType: string;
  materialDescription?: string;
  reference: string;
  weight: number;
  documentNumber?: string;
  documents?: string;
  notes?: string;
}

export interface UpdateDeliveryData {
  date?: string;
  clientId?: string | null;
  basinId?: string | null;
  materialType?: string;
  materialDescription?: string | null;
  reference?: string;
  weight?: number;
  documentNumber?: string | null;
  documents?: string | null;
  notes?: string | null;
}

// ================================
// LAVORAZIONI
// ================================

export interface Processing {
  id: string;
  date: string;
  shift: string;
  operatorId?: string;
  inputMaterialType: string;
  inputWeight: number;
  inputReference: string;
  efficiency?: number;
  wasteWeight?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  outputs?: ProcessingOutput[];
}

export interface ProcessingOutput {
  id: string;
  processingId: string;
  outputMaterialType: string;
  outputWeight: number;
  outputReference: string;
  quality?: string;
  createdAt: string;
}

export interface CreateProcessingData {
  date: string;
  shift: string;
  operatorId?: string;
  inputMaterialType: string;
  inputWeight: number;
  inputReference: string;
  efficiency?: number;
  wasteWeight?: number;
  notes?: string;
  outputs?: CreateProcessingOutputData[];
}

export interface CreateProcessingOutputData {
  outputMaterialType: string;
  outputWeight: number;
  outputReference: string;
  quality?: string;
}

// ================================
// GIACENZE
// ================================

export interface Inventory {
  id: string;
  date: string;
  materialType: string;
  reference: string;
  initialStock: number;
  deliveries: number;
  processing: number;
  shipments: number;
  adjustments: number;
  finalStock: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryData {
  date: string;
  materialType: string;
  reference: string;
  initialStock: number;
  deliveries?: number;
  processing?: number;
  shipments?: number;
  adjustments?: number;
  finalStock: number;
  notes?: string;
}

// ================================
// ANALISI MERCEOLOGICHE
// ================================

export interface MerceologicalAnalysis {
  id: string;
  date: string;
  basinId: string;
  basin?: Basin;
  flowType: FlowType;
  foreignFractionPercentage: number;
  plasticPackagingPercentage: number;
  cplPetPercentage: number;
  otherCplPercentage: number;
  trackersPercentage: number;
  variousPackagingPercentage: number;
  sampleWeight?: number;
  analysisMethod?: string;
  operator?: string;
  isValid: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMerceologicalAnalysisData {
  date: string;
  basinId: string;
  flowType: FlowType;
  foreignFractionPercentage: number;
  plasticPackagingPercentage: number;
  cplPetPercentage: number;
  otherCplPercentage: number;
  trackersPercentage: number;
  variousPackagingPercentage: number;
  sampleWeight?: number;
  analysisMethod?: string;
  operator?: string;
  isValid?: boolean;
  notes?: string;
}

// ================================
// UTENTI
// ================================

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  active?: boolean;
}

export interface UpdateUserData {
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: UserRole;
  active?: boolean;
}

// ================================
// RISPOSTE API
// ================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ================================
// FILTRI E QUERY
// ================================

export interface PickupOrderFilters {
  status?: PickupOrderStatus[];
  basinId?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface DeliveryFilters {
  dateFrom?: string;
  dateTo?: string;
  clientId?: string;
  basinId?: string;
  materialType?: string;
  reference?: string;
}

export interface InventoryFilters {
  date?: string;
  materialType?: string;
  reference?: string;
}