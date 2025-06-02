// client/src/modules/pickupOrders/services/enhancedCreationService.ts

import api from '../../../core/services/api';
import type { ExtractedPickupOrderData } from './pdfTextService';
import {
  createPickupOrderFromExtractedData,
  type CreationResult,
  type MatchingResults
} from './pickupOrderCreationService';

// ================================
// NUOVI TIPI PER LOGISTICA
// ================================

export interface LogisticEntitySuggestion {
  id: string;
  name: string;
  city?: string;
  similarity: number;
  isExactMatch: boolean;
}

export interface LogisticMatchingResponse {
  senderSuggestions: LogisticEntitySuggestion[];
  recipientSuggestions: LogisticEntitySuggestion[];
  transporterSuggestions: LogisticEntitySuggestion[];
  shipperSuggestions?: LogisticEntitySuggestion[]; // AGGIUNTO: Aggiungi shipperSuggestions qui
  confidence: number;
  needsReview: boolean;
}

export interface EnhancedMatchingResults extends MatchingResults {
  // Manteniamo tutto quello esistente
  logisticSuggestions?: LogisticMatchingResponse;
}

export interface EnhancedCreationResult extends CreationResult {
  // Manteniamo tutto quello esistente
  matchingResults: EnhancedMatchingResults;
}

// ================================
// NUOVE FUNZIONI (SENZA TOCCARE ESISTENTI!)
// ================================

/**
 * Ottiene suggerimenti di entità logistiche dai dati OCR
 * QUESTA È UNA FUNZIONE COMPLETAMENTE NUOVA
 */
export const getLogisticSuggestionsFromOCR = async (
  extractedData: ExtractedPickupOrderData
): Promise<LogisticMatchingResponse> => {
  try {
    const response = await api.post('/pickup-orders/ocr/logistics/suggestions', {
      senderName: extractedData.senderName,
      recipientName: extractedData.recipientName,
      transporterName: (extractedData as any).transporter, // Assumendo che transporter sia in extractedData
      shipperName: (extractedData as any).shipperName, // Assumendo che shipperName sia in extractedData
    });

    return response.data;
  } catch (error) {
    console.error('Errore nel recupero suggerimenti logistici:', error);

    // Fallback: restituisce struttura vuota
    return {
      senderSuggestions: [],
      recipientSuggestions: [],
      transporterSuggestions: [],
      shipperSuggestions: [], // Includi shipperSuggestions anche nel fallback
      confidence: 0,
      needsReview: true,
    };
  }
};

/**
 * Crea automaticamente entità logistiche se non esistono
 * QUESTA È UNA FUNZIONE COMPLETAMENTE NUOVA
 */
export const autoCreateLogisticEntities = async (
  extractedData: ExtractedPickupOrderData
): Promise<{ sender?: any; recipient?: any; transporter?: any; shipper?: any; }> => { // Esteso il tipo di ritorno
  try {
    const response = await api.post('/pickup-orders/ocr/logistics/auto-create', {
      senderName: extractedData.senderName,
      senderAddress: extractedData.senderAddress,
      senderCity: extractedData.senderCity,
      senderEmail: extractedData.senderEmail,
      senderPhone: (extractedData as any).senderPhone,
      recipientName: extractedData.recipientName,
      recipientAddress: extractedData.recipientAddress,
      recipientCity: extractedData.recipientCity,
      recipientEmail: extractedData.recipientEmail,
      recipientPhone: (extractedData as any).recipientPhone,
      transporterName: (extractedData as any).transporter, // Passa il nome del trasportatore
      shipperName: (extractedData as any).shipperName, // Passa il nome dello shipper
    });

    return response.data.createdEntities;
  } catch (error) {
    console.error('Errore nella creazione automatica entità logistiche:', error);
    return {};
  }
};

/**
 * Versione ENHANCED del createPickupOrderFromExtractedData che include logistica
 * QUESTA MANTIENE IL COMPORTAMENTO ESISTENTE E AGGIUNGE SOLO LE NOVITÀ
 */
export const createPickupOrderWithLogistics = async (
  extractedData: ExtractedPickupOrderData,
  corrections: any = {},
  forceCreate: boolean = false,
  useLogisticSuggestions: boolean = true
): Promise<EnhancedCreationResult> => {
  try {
    // FASE 1: Chiama la funzione ESISTENTE (non la tocchiamo!)
    const originalResult = await createPickupOrderFromExtractedData(
      extractedData,
      corrections,
      forceCreate
    );

    // FASE 2: Se richiesto, aggiungi suggerimenti logistici
    let logisticSuggestions: LogisticMatchingResponse | undefined;

    if (useLogisticSuggestions) {
      logisticSuggestions = await getLogisticSuggestionsFromOCR(extractedData);
    }

    // FASE 3: Crea il risultato enhanced mantenendo tutto l'esistente
    const enhancedResult: EnhancedCreationResult = {
      ...originalResult, // Manteniamo tutto quello che c'era prima
      matchingResults: {
        ...originalResult.matchingResults, // Manteniamo tutti i matching esistenti
        logisticSuggestions, // Aggiungiamo solo i suggerimenti logistici
      },
    };

    return enhancedResult;
  } catch (error: any) {
    console.error('Errore nella creazione enhanced del buono di ritiro:', error);

    // Fallback: restituiamo il risultato della funzione originale
    const fallbackResult = await createPickupOrderFromExtractedData(
      extractedData,
      corrections,
      forceCreate
    );

    return {
      ...fallbackResult,
      matchingResults: {
        ...fallbackResult.matchingResults,
        logisticSuggestions: undefined, // Nessun suggerimento in caso di errore
      },
    };
  }
};

/**
 * Funzione di compatibilità per mantenere il comportamento esistente
 * QUESTA GARANTISCE CHE IL CODICE ESISTENTE CONTINUI A FUNZIONARE
 */
export const createPickupOrderFromExtractedDataSafe = createPickupOrderFromExtractedData;

// ================================
// EXPORT PER RETROCOMPATIBILITÀ
// ================================

// Esportiamo tutto quello che c'era prima
export {
  createPickupOrderFromExtractedData,
  type CreationResult,
  type MatchingResults,
} from './pickupOrderCreationService';