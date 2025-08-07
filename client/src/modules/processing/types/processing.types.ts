// client/src/modules/processing/types/processing.types.ts

export interface Processing {
  id: string;
  date: string;
  shift: 'MORNING' | 'AFTERNOON' | 'NIGHT';
  operatorId?: string;
  inputMaterialType: string;
  inputWeight: number;
  inputReference: string;
  efficiency?: number;
  wasteWeight?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relazione con output (usando il modello deprecato)
  outputs: ProcessingOutput[];
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

export interface UpdateProcessingData {
  date?: string;
  shift?: string;
  operatorId?: string | null;
  inputMaterialType?: string;
  inputWeight?: number;
  inputReference?: string;
  efficiency?: number | null;
  wasteWeight?: number | null;
  notes?: string | null;
  outputs?: CreateProcessingOutputData[];
}

export interface ProcessingStats {
  totalProcessingThisMonth: number;
  averageEfficiency: number;
  materialTypesProcessed: {
    inputMaterialType: string;
    _sum: {
      inputWeight: number | null;
    };
  }[];
}

export interface ProcessingFilters {
  startDate?: string;
  endDate?: string;
  operatorId?: string;
  shift?: string;
  materialType?: string;
}

export const SHIFTS = {
  MORNING: 'Mattino',
  AFTERNOON: 'Pomeriggio', 
  NIGHT: 'Notte',
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