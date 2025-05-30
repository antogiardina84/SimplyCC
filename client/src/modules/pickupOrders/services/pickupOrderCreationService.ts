// client/src/modules/pickupOrders/services/pickupOrderCreationService.ts

import api from '../../../core/services/api';
import type { ExtractedPickupOrderData } from './pdfTextService';

// Definiamo i tipi localmente invece di importarli
export interface CreatePickupOrderData {
  orderNumber: string;
  issueDate: string;
  scheduledDate?: string;
  completionDate?: string;
  shipperId?: string;
  senderId: string;
  recipientId: string;
  basinId: string;
  flowType: string;
  distanceKm?: number;
  status?: string;
  expectedQuantity?: number;
  actualQuantity?: number;
  destinationQuantity?: number;
  notes?: string;
  documents?: string;
}

export interface ClientMatchResult {
  id?: string;
  name: string;
  similarity: number;
  isNew: boolean;
}

export interface BasinMatchResult {
  id?: string;
  code: string;
  description: string;
  similarity: number;
  isNew: boolean;
}

export interface MatchingResults {
  sender: ClientMatchResult;
  recipient: ClientMatchResult;
  basin: BasinMatchResult;
  confidence: number;
  needsReview: boolean;
  suggestions: {
    alternateSenders: ClientMatchResult[];
    alternateRecipients: ClientMatchResult[];
    alternateBasins: BasinMatchResult[];
  };
}

export interface CreationResult {
  success: boolean;
  pickupOrder?: any;
  matchingResults: MatchingResults;
  message: string;
  errors?: string[];
}

/**
 * Calcola la similarità tra due stringhe usando Levenshtein distance
 */
const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - distance) / longer.length;
};

/**
 * Calcola la distanza di Levenshtein tra due stringhe
 */
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

/**
 * Trova il miglior match per un cliente (mittente o destinatario)
 */
const findBestClientMatch = async (extractedName: string, clients: any[]): Promise<ClientMatchResult> => {
  if (!extractedName || !clients || clients.length === 0) {
    return {
      name: extractedName,
      similarity: 0,
      isNew: true
    };
  }

  let bestMatch: ClientMatchResult = {
    name: extractedName,
    similarity: 0,
    isNew: true
  };

  for (const client of clients) {
    const similarity = calculateSimilarity(extractedName, client.name);
    
    if (similarity > bestMatch.similarity) {
      bestMatch = {
        id: client.id,
        name: client.name,
        similarity: similarity,
        isNew: false
      };
    }
  }

  // Se la similarità è troppo bassa, considera come nuovo cliente
  if (bestMatch.similarity < 0.6) {
    bestMatch = {
      name: extractedName,
      similarity: 0,
      isNew: true
    };
  }

  return bestMatch;
};

/**
 * Trova il miglior match per un bacino
 */
const findBestBasinMatch = async (extractedCode: string, extractedDescription: string, basins: any[]): Promise<BasinMatchResult> => {
  if (!extractedCode || !basins || basins.length === 0) {
    return {
      code: extractedCode || '',
      description: extractedDescription || '',
      similarity: 0,
      isNew: true
    };
  }

  let bestMatch: BasinMatchResult = {
    code: extractedCode || '',
    description: extractedDescription || '',
    similarity: 0,
    isNew: true
  };

  for (const basin of basins) {
    let similarity = 0;
    
    // Match esatto per codice bacino
    if (basin.code === extractedCode) {
      similarity = 1.0;
    } else if (extractedDescription && basin.description) {
      // Match per descrizione se il codice non matcha
      similarity = calculateSimilarity(extractedDescription, basin.description);
    }
    
    if (similarity > bestMatch.similarity) {
      bestMatch = {
        id: basin.id,
        code: basin.code || '',
        description: basin.description || '',
        similarity: similarity,
        isNew: false
      };
    }
  }

  // Se la similarità è troppo bassa, considera come nuovo bacino
  if (bestMatch.similarity < 0.8) {
    bestMatch = {
      code: extractedCode || '',
      description: extractedDescription || '',
      similarity: 0,
      isNew: true
    };
  }

  return bestMatch;
};

/**
 * Esegue il matching di tutti i dati estratti con quelli esistenti nel database
 */
export const matchExtractedData = async (extractedData: ExtractedPickupOrderData): Promise<MatchingResults> => {
  try {
    // Carica tutti i dati necessari dal database
    const [clientsResponse, basinsResponse] = await Promise.all([
      api.get('/clients'),
      api.get('/basins')
    ]);

    const clients = clientsResponse.data;
    const basins = basinsResponse.data;

    // Trova i migliori match
    const [senderMatch, recipientMatch, basinMatch] = await Promise.all([
      findBestClientMatch(extractedData.senderName, clients),
      findBestClientMatch(extractedData.recipientName, clients),
      findBestBasinMatch(extractedData.basinCode, extractedData.basinDescription || '', basins)
    ]);

    // Calcola la confidenza complessiva
    const confidence = (senderMatch.similarity + recipientMatch.similarity + basinMatch.similarity) / 3;
    
    // Determina se necessita revisione
    const needsReview = confidence < 0.8 || senderMatch.isNew || recipientMatch.isNew || basinMatch.isNew;

    // Trova alternative per i suggerimenti
    const alternateSenders = clients
      .map((client: any) => ({
        id: client.id,
        name: client.name,
        similarity: calculateSimilarity(extractedData.senderName, client.name),
        isNew: false
      }))
      .filter((match: ClientMatchResult) => match.similarity > 0.3 && match.id !== senderMatch.id)
      .sort((a: ClientMatchResult, b: ClientMatchResult) => b.similarity - a.similarity)
      .slice(0, 5);

    const alternateRecipients = clients
      .map((client: any) => ({
        id: client.id,
        name: client.name,
        similarity: calculateSimilarity(extractedData.recipientName, client.name),
        isNew: false
      }))
      .filter((match: ClientMatchResult) => match.similarity > 0.3 && match.id !== recipientMatch.id)
      .sort((a: ClientMatchResult, b: ClientMatchResult) => b.similarity - a.similarity)
      .slice(0, 5);

    const alternateBasins = basins
      .map((basin: any) => ({
        id: basin.id,
        code: basin.code || '',
        description: basin.description || '',
        similarity: Math.max(
          basin.code === extractedData.basinCode ? 1.0 : 0,
          extractedData.basinDescription ? calculateSimilarity(extractedData.basinDescription, basin.description || '') : 0
        ),
        isNew: false
      }))
      .filter((match: BasinMatchResult) => match.similarity > 0.3 && match.id !== basinMatch.id)
      .sort((a: BasinMatchResult, b: BasinMatchResult) => b.similarity - a.similarity)
      .slice(0, 5);

    return {
      sender: senderMatch,
      recipient: recipientMatch,
      basin: basinMatch,
      confidence,
      needsReview,
      suggestions: {
        alternateSenders,
        alternateRecipients,
        alternateBasins
      }
    };

  } catch (error) {
    console.error('Errore durante il matching:', error);
    
    // Fallback: tutti nuovi
    return {
      sender: { name: extractedData.senderName || '', similarity: 0, isNew: true },
      recipient: { name: extractedData.recipientName || '', similarity: 0, isNew: true },
      basin: { code: extractedData.basinCode || '', description: extractedData.basinDescription || '', similarity: 0, isNew: true },
      confidence: 0,
      needsReview: true,
      suggestions: {
        alternateSenders: [],
        alternateRecipients: [],
        alternateBasins: []
      }
    };
  }
};

/**
 * Crea nuovi clienti se necessario
 */
const createClientIfNeeded = async (clientMatch: ClientMatchResult): Promise<string> => {
  if (!clientMatch.isNew && clientMatch.id) {
    return clientMatch.id;
  }

  // Crea nuovo cliente
  const newClient = {
    name: clientMatch.name,
    vatNumber: 'TEMP_' + Date.now(), // Temporaneo, da compilare manualmente
    // Altri campi verranno compilati manualmente dall'utente
  };

  const response = await api.post('/clients', newClient);
  return response.data.id;
};

/**
 * Crea nuovo bacino se necessario
 */
const createBasinIfNeeded = async (basinMatch: BasinMatchResult, clientId: string): Promise<string> => {
  if (!basinMatch.isNew && basinMatch.id) {
    return basinMatch.id;
  }

  // Crea nuovo bacino
  const newBasin = {
    code: basinMatch.code || '',
    description: basinMatch.description || '',
    flowType: 'A', // Default, può essere cambiato
    clientId: clientId // Associa al mittente per default
  };

  const response = await api.post('/basins', newBasin);
  return response.data.id;
};

/**
 * Crea un buono di ritiro dai dati estratti dal PDF
 */
export const createPickupOrderFromExtractedData = async (
  extractedData: ExtractedPickupOrderData,
  corrections: any = {},
  forceCreate: boolean = false
): Promise<CreationResult> => {
  try {
    // Applica le correzioni manuali
    const finalData = { ...extractedData, ...corrections };

    // Validazione dati obbligatori
    if (!finalData.orderNumber) {
      return {
        success: false,
        matchingResults: {
          sender: { name: finalData.senderName || '', similarity: 0, isNew: true },
          recipient: { name: finalData.recipientName || '', similarity: 0, isNew: true },
          basin: { code: finalData.basinCode || '', description: finalData.basinDescription || '', similarity: 0, isNew: true },
          confidence: 0,
          needsReview: true,
          suggestions: { alternateSenders: [], alternateRecipients: [], alternateBasins: [] }
        },
        message: 'Numero buono di ritiro mancante',
        errors: ['Il numero del buono di ritiro è obbligatorio']
      };
    }

    if (!finalData.senderName || !finalData.recipientName) {
      return {
        success: false,
        matchingResults: {
          sender: { name: finalData.senderName || '', similarity: 0, isNew: true },
          recipient: { name: finalData.recipientName || '', similarity: 0, isNew: true },
          basin: { code: finalData.basinCode || '', description: finalData.basinDescription || '', similarity: 0, isNew: true },
          confidence: 0,
          needsReview: true,
          suggestions: { alternateSenders: [], alternateRecipients: [], alternateBasins: [] }
        },
        message: 'Mittente o destinatario mancanti',
        errors: ['Mittente e destinatario sono obbligatori']
      };
    }

    // Esegui il matching
    const matchingResults = await matchExtractedData(finalData);

    // Se necessita revisione e non è forzata la creazione, restituisci i risultati del matching
    if (matchingResults.needsReview && !forceCreate) {
      return {
        success: false,
        matchingResults,
        message: 'I dati necessitano di revisione prima della creazione automatica'
      };
    }

    // Crea clienti e bacini se necessario
    const senderId = await createClientIfNeeded(matchingResults.sender);
    const recipientId = await createClientIfNeeded(matchingResults.recipient);
    const basinId = await createBasinIfNeeded(matchingResults.basin, senderId);

    // Prepara i dati per la creazione del buono di ritiro
    const pickupOrderData: CreatePickupOrderData = {
      orderNumber: finalData.orderNumber || '',
      issueDate: finalData.issueDate instanceof Date 
        ? finalData.issueDate.toISOString().split('T')[0] 
        : (finalData.issueDate?.toString() || new Date().toISOString().split('T')[0]),
      scheduledDate: finalData.loadingDate instanceof Date 
        ? finalData.loadingDate.toISOString().split('T')[0] 
        : undefined,
      senderId,
      recipientId,
      basinId,
      flowType: finalData.flowType || 'A',
      distanceKm: finalData.distanceKm,
      status: 'PENDING',
      notes: `Creato automaticamente da PDF. Confidenza: ${Math.round(matchingResults.confidence * 100)}%`
    };

    // Crea il buono di ritiro
    const response = await api.post('/pickup-orders', pickupOrderData);

    return {
      success: true,
      pickupOrder: response.data,
      matchingResults,
      message: `Buono di ritiro ${finalData.orderNumber} creato con successo`
    };

  } catch (error: any) {
    console.error('Errore nella creazione del buono di ritiro:', error);
    
    return {
      success: false,
      matchingResults: {
        sender: { name: extractedData.senderName || '', similarity: 0, isNew: true },
        recipient: { name: extractedData.recipientName || '', similarity: 0, isNew: true },
        basin: { code: extractedData.basinCode || '', description: extractedData.basinDescription, similarity: 0, isNew: true },
        confidence: 0,
        needsReview: true,
        suggestions: { alternateSenders: [], alternateRecipients: [], alternateBasins: [] }
      },
      message: 'Errore durante la creazione del buono di ritiro',
      errors: [error.response?.data?.message || error.message]
    };
  }
};