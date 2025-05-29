// client/src/modules/pickupOrders/services/ocrService.ts

import api from '../../../core/services/api';

export interface ExtractedPickupOrderData {
  orderNumber: string;
  issueDate: Date;
  shippingRequestDate?: Date;
  availabilityDate?: Date;
  loadingDate?: Date;
  unloadingDate?: Date;
  senderName: string;
  senderAddress?: string;
  senderCity?: string;
  senderPhone?: string;
  senderEmail?: string;
  recipientName: string;
  recipientAddress?: string;
  recipientCity?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  distanceKm?: number;
  basinCode: string;
  basinDescription?: string;
  flowType: string;
  transportType?: string;
  confidence: number;
  rawText: string;
}

export interface MatchedEntities {
  sender: any;
  recipient: any;
  basin: any;
  suggestions: {
    senders: any[];
    recipients: any[];
    basins: any[];
  };
}

export interface OCRExtractionResponse {
  success: boolean;
  extractedData: ExtractedPickupOrderData;
  matchedEntities: MatchedEntities;
  suggestions: {
    needsReview: string[];
    confidence: number;
    qualityScore: number;
  };
}

export interface OCRCreationResponse {
  success: boolean;
  message: string;
  pickupOrder?: any;
  preparedData?: any;
  extractedData: ExtractedPickupOrderData;
}

export interface OCRProcessResponse {
  success: boolean;
  message: string;
  pickupOrder: any;
  extractedData: ExtractedPickupOrderData;
  confidence: number;
}

/**
 * Estrae i dati da un PDF e restituisce i dati estratti per la revisione
 */
export const extractFromPDF = async (file: File): Promise<OCRExtractionResponse> => {
  const formData = new FormData();
  formData.append('pdfFile', file);

  const response = await api.post('/pickup-orders/ocr/extract', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Crea un buono di ritiro dai dati estratti, con possibilità di correzioni manuali
 */
export const createFromExtractedData = async (
  extractedData: ExtractedPickupOrderData,
  corrections?: any,
  autoCreate: boolean = false
): Promise<OCRCreationResponse> => {
  const response = await api.post('/pickup-orders/ocr/create', {
    extractedData,
    corrections,
    autoCreate,
  });

  return response.data;
};

/**
 * Processo completo: estrai dal PDF e crea automaticamente il buono di ritiro
 */
export const processAndCreate = async (file: File): Promise<OCRProcessResponse> => {
  const formData = new FormData();
  formData.append('pdfFile', file);

  const response = await api.post('/pickup-orders/ocr/process', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Valida un file PDF prima dell'upload
 */
export const validatePDFFile = (file: File): { isValid: boolean; error?: string } => {
  // Controlla il tipo di file
  if (file.type !== 'application/pdf') {
    return {
      isValid: false,
      error: 'Il file deve essere in formato PDF'
    };
  }

  // Controlla la dimensione del file (massimo 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'Il file non può superare i 10MB'
    };
  }

  // Controlla il nome del file
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return {
      isValid: false,
      error: 'Il file deve avere estensione .pdf'
    };
  }

  return { isValid: true };
};

/**
 * Formatta i dati estratti per la visualizzazione
 */
export const formatExtractedDataForDisplay = (data: ExtractedPickupOrderData) => {
  return {
    'Numero Buono': data.orderNumber || 'Non rilevato',
    'Data Emissione': data.issueDate ? new Date(data.issueDate).toLocaleDateString('it-IT') : 'Non rilevata',
    'Mittente': data.senderName || 'Non rilevato',
    'Destinatario': data.recipientName || 'Non rilevato',
    'Bacino': data.basinCode ? `${data.basinCode} - ${data.basinDescription || ''}` : 'Non rilevato',
    'Tipo Flusso': `Flusso ${data.flowType || 'A'}`,
    'Distanza': data.distanceKm ? `${data.distanceKm} km` : 'Non rilevata',
    'Confidenza OCR': `${data.confidence}%`,
  };
};

/**
 * Genera suggerimenti per migliorare la qualità dell'estrazione
 */
export const generateQualityImprovementTips = (data: ExtractedPickupOrderData): string[] => {
  const tips: string[] = [];

  if (data.confidence < 70) {
    tips.push('La qualità del PDF potrebbe essere migliorata. Prova con una scansione a risoluzione più alta.');
  }

  if (!data.orderNumber) {
    tips.push('Assicurati che il numero del buono sia chiaramente visibile nel PDF.');
  }

  if (!data.senderName || !data.recipientName) {
    tips.push('Verifica che i nomi di mittente e destinatario siano leggibili nel documento.');
  }

  if (!data.basinCode) {
    tips.push('Il codice bacino potrebbe non essere riconosciuto. Controlla che sia presente nella sezione "Lista bacini".');
  }

  if (data.confidence > 90 && tips.length === 0) {
    tips.push('Ottima qualità di estrazione! Tutti i dati principali sono stati rilevati correttamente.');
  }

  return tips;
};

/**
 * Calcola una stima dell'accuratezza dei dati estratti
 */
export const calculateDataAccuracy = (data: ExtractedPickupOrderData): {
  score: number;
  level: 'excellent' | 'good' | 'fair' | 'poor';
  description: string;
} => {
  let score = 0;
  let maxScore = 0;

  // Campi essenziali (peso 3)
  const essentialFields = ['orderNumber', 'senderName', 'recipientName', 'basinCode'];
  essentialFields.forEach(field => {
    maxScore += 3;
    if (data[field as keyof ExtractedPickupOrderData] && 
        String(data[field as keyof ExtractedPickupOrderData]).trim()) {
      score += 3;
    }
  });

  // Campi importanti (peso 2)
  const importantFields = ['issueDate', 'flowType'];
  importantFields.forEach(field => {
    maxScore += 2;
    if (data[field as keyof ExtractedPickupOrderData]) {
      score += 2;
    }
  });

  // Campi opzionali (peso 1)
  const optionalFields = ['distanceKm', 'senderAddress', 'recipientAddress', 'availabilityDate'];
  optionalFields.forEach(field => {
    maxScore += 1;
    if (data[field as keyof ExtractedPickupOrderData]) {
      score += 1;
    }
  });

  // Bonus per alta confidenza OCR
  maxScore += 2;
  if (data.confidence > 90) {
    score += 2;
  } else if (data.confidence > 70) {
    score += 1;
  }

  const percentage = Math.round((score / maxScore) * 100);

  let level: 'excellent' | 'good' | 'fair' | 'poor';
  let description: string;

  if (percentage >= 90) {
    level = 'excellent';
    description = 'Eccellente: tutti i dati sono stati estratti correttamente';
  } else if (percentage >= 75) {
    level = 'good';
    description = 'Buono: la maggior parte dei dati è stata estratta correttamente';
  } else if (percentage >= 50) {
    level = 'fair';
    description = 'Discreto: alcuni dati potrebbero richiedere correzioni';
  } else {
    level = 'poor';
    description = 'Scarso: molti dati richiedono correzioni manuali';
  }

  return {
    score: percentage,
    level,
    description
  };
};