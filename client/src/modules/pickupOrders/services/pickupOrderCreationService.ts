// client/src/modules/pickupOrders/services/pickupOrderCreationService.ts

import api from '../../../core/services/api';
import type { ExtractedPickupOrderData } from './pdfTextService';
import type { LogisticEntitySuggestion, LogisticMatchingResponse } from './enhancedCreationService';

// Interfaccia completa aggiornata con tutti i nuovi campi dello schema Prisma
export interface CreatePickupOrderData {
  orderNumber: string;
  issueDate: string;
  scheduledDate?: string;
  loadingDate?: string;      // Data carico
  unloadingDate?: string;    // Data scarico
  completionDate?: string;
  
  logisticSenderId?: string;    // Entità logistiche
  logisticRecipientId?: string; 
  logisticTransporterId?: string; 
  
  clientId?: string;         // Cliente convenzionato
  basinId?: string;          // Bacino (reso opzionale per sicurezza TypeScript)
  flowType: string;
  distanceKm?: number;
  materialType?: string;     // Tipo materiale
  
  status?: string;
  
  expectedQuantity?: number;
  actualQuantity?: number;
  destinationQuantity?: number;
  loadedPackages?: number;   // Numero colli
  departureWeight?: number;  // Peso partenza
  arrivalWeight?: number;    // Peso arrivo
  
  assignedOperatorId?: string; // Operatore assegnato
  
  notes?: string;
  documents?: string;
  loadingPhotos?: string;    // Foto carico
  loadingVideos?: string;    // Video carico
  
  isRejected?: boolean;      // Se rifiutato
  rejectionReason?: string;  // Motivo rifiuto
  rejectionDate?: string;    // Data rifiuto
}

export interface LogisticEntityMatchResult {
  id?: string;
  name: string;
  city?: string;
  similarity: number;
  isNew: boolean;
  isExactMatch: boolean;
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
  sender: LogisticEntityMatchResult;
  recipient: LogisticEntityMatchResult;
  transporter?: LogisticEntityMatchResult;
  client: ClientMatchResult;
  basin: BasinMatchResult;
  confidence: number;
  needsReview: boolean;
  suggestions: {
    alternateSenders: LogisticEntityMatchResult[];
    alternateRecipients: LogisticEntityMatchResult[];
    alternateTransporters?: LogisticEntityMatchResult[];
    alternateClients: ClientMatchResult[];
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
 * Trova il miglior match per un'entità logistica
 */
const findBestLogisticEntityMatch = (extractedName: string | undefined, suggestions: LogisticEntitySuggestion[]): LogisticEntityMatchResult | undefined => {
  const trimmedName = extractedName?.trim();

  if (!trimmedName) {
    return undefined;
  }

  if (!suggestions || suggestions.length === 0) {
    return {
      name: trimmedName,
      city: undefined,
      similarity: 0,
      isNew: true,
      isExactMatch: false
    };
  }

  let bestMatch: LogisticEntityMatchResult = {
    name: trimmedName,
    city: undefined,
    similarity: 0,
    isNew: true,
    isExactMatch: false
  };

  for (const suggestion of suggestions) {
    if (suggestion.isExactMatch) {
      return {
        id: suggestion.id,
        name: suggestion.name,
        city: suggestion.city,
        similarity: 1.0,
        isNew: false,
        isExactMatch: true
      };
    }
    
    if (suggestion.similarity > bestMatch.similarity) {
      bestMatch = {
        id: suggestion.id,
        name: suggestion.name,
        city: suggestion.city,
        similarity: suggestion.similarity,
        isNew: false,
        isExactMatch: false
      };
    }
  }

  if (bestMatch.similarity < 0.6) {
    bestMatch = {
      name: trimmedName,
      city: undefined,
      similarity: 0,
      isNew: true,
      isExactMatch: false
    };
  }

  return bestMatch;
};

/**
 * Trova il miglior match per un cliente convenzionato
 */
const findBestClientMatch = async (extractedDescription: string, clients: any[]): Promise<ClientMatchResult> => {
  if (!extractedDescription || !clients || clients.length === 0) {
    return {
      name: extractedDescription || '',
      similarity: 0,
      isNew: true
    };
  }

  let bestMatch: ClientMatchResult = {
    name: extractedDescription,
    similarity: 0,
    isNew: true
  };

  for (const client of clients) {
    const similarity = calculateSimilarity(extractedDescription, client.name);
    
    if (similarity > bestMatch.similarity) {
      bestMatch = {
        id: client.id,
        name: client.name,
        similarity: similarity,
        isNew: false
      };
    }
  }

  if (bestMatch.similarity < 0.6) {
    bestMatch = {
      name: extractedDescription,
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

    if (basin.code === extractedCode) {
      similarity = 1.0;
    } else if (extractedDescription && basin.description) {
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
 * Esegui il matching di tutti i dati estratti
 */
export const matchExtractedData = async (extractedData: ExtractedPickupOrderData): Promise<MatchingResults> => {
  try {
    // 1. Ottieni suggerimenti per le entità logistiche
    const logisticSuggestionsResponse: LogisticMatchingResponse = await api.post('/pickup-orders/ocr/logistics/suggestions', {
      senderName: extractedData.senderName,
      recipientName: extractedData.recipientName,
      transporterName: (extractedData as any).transporter || undefined,
    }).then(res => res.data);

    // 2. Carica clienti e bacini dal database
    const [clientsResponse, basinsResponse] = await Promise.all([
      api.get('/clients'),
      api.get('/basins')
    ]);

    const clients = clientsResponse.data;
    const basins = basinsResponse.data;

    // 3. Trova i migliori match
    const senderMatch = findBestLogisticEntityMatch(extractedData.senderName, logisticSuggestionsResponse.senderSuggestions);
    const recipientMatch = findBestLogisticEntityMatch(extractedData.recipientName, logisticSuggestionsResponse.recipientSuggestions);
    const transporterMatch = (extractedData as any).transporter
      ? findBestLogisticEntityMatch((extractedData as any).transporter, logisticSuggestionsResponse.transporterSuggestions || [])
      : undefined;

    const clientMatch = await findBestClientMatch(extractedData.basinDescription || '', clients);
    const basinMatch = await findBestBasinMatch(extractedData.basinCode, extractedData.basinDescription || '', basins);

    // Calcola la confidenza complessiva
    let totalSimilarity = (senderMatch?.similarity || 0) + (recipientMatch?.similarity || 0) + (clientMatch.similarity || 0) + (basinMatch.similarity || 0);
    let count = 4;

    if (transporterMatch) {
      totalSimilarity += transporterMatch.similarity;
      count++;
    }

    const confidence = totalSimilarity / count;

    const needsReview = confidence < 0.8 || 
      (senderMatch?.isNew || false) || 
      (recipientMatch?.isNew || false) || 
      clientMatch.isNew || 
      basinMatch.isNew || 
      (transporterMatch?.isNew || false);

    return {
      sender: senderMatch!,
      recipient: recipientMatch!,
      transporter: transporterMatch,
      client: clientMatch,
      basin: basinMatch,
      confidence,
      needsReview,
      suggestions: {
        alternateSenders: logisticSuggestionsResponse.senderSuggestions.filter((s: LogisticEntitySuggestion) => !s.isExactMatch && s.id !== senderMatch?.id).map((s: LogisticEntitySuggestion) => ({ ...s, isNew: false })),
        alternateRecipients: logisticSuggestionsResponse.recipientSuggestions.filter((s: LogisticEntitySuggestion) => !s.isExactMatch && s.id !== recipientMatch?.id).map((s: LogisticEntitySuggestion) => ({ ...s, isNew: false })),
        alternateTransporters: transporterMatch ? logisticSuggestionsResponse.transporterSuggestions?.filter((s: LogisticEntitySuggestion) => !s.isExactMatch && s.id !== transporterMatch?.id).map((s: LogisticEntitySuggestion) => ({ ...s, isNew: false })) : [],
        alternateClients: clients
          .map((client: any) => ({
            id: client.id,
            name: client.name,
            similarity: calculateSimilarity(extractedData.basinDescription || '', client.name),
            isNew: false
          }))
          .filter((match: ClientMatchResult) => match.similarity > 0.3 && match.id !== clientMatch.id)
          .sort((a: ClientMatchResult, b: ClientMatchResult) => b.similarity - a.similarity)
          .slice(0, 5),
        alternateBasins: basins
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
          .slice(0, 5),
      }
    };

  } catch (error) {
    console.error('Errore durante il matching:', error);
    
    return {
      sender: { name: extractedData.senderName || '', similarity: 0, isNew: true, isExactMatch: false },
      recipient: { name: extractedData.recipientName || '', similarity: 0, isNew: true, isExactMatch: false },
      transporter: (extractedData as any).transporter ? { name: (extractedData as any).transporter, similarity: 0, isNew: true, isExactMatch: false } : undefined,
      client: { name: extractedData.basinDescription || '', similarity: 0, isNew: true },
      basin: { code: extractedData.basinCode || '', description: extractedData.basinDescription || '', similarity: 0, isNew: true },
      confidence: 0,
      needsReview: true,
      suggestions: {
        alternateSenders: [],
        alternateRecipients: [],
        alternateTransporters: [],
        alternateClients: [],
        alternateBasins: []
      }
    };
  }
};

/**
 * Crea entità logistica se necessario
 */
const createLogisticEntityIfNeeded = async (
  entityMatch: LogisticEntityMatchResult | undefined,
  originalExtractedData: ExtractedPickupOrderData,
  entityType: 'sender' | 'recipient' | 'transporter'
): Promise<string | undefined> => {
  if (!entityMatch) {
    return undefined;
  }

  if (!entityMatch.isNew && entityMatch.id) {
    return entityMatch.id;
  }

  if (entityMatch.isNew && (!entityMatch.name || entityMatch.name.trim() === '')) {
    console.warn(`Tentativo di creare un'entità ${entityType} con nome vuoto. Operazione saltata.`);
    return undefined;
  }

  try {
    const response = await api.post('/pickup-orders/ocr/logistics/auto-create', {
      [entityType + 'Name']: entityMatch.name,
      ...(entityType === 'sender' && {
        senderAddress: originalExtractedData.senderAddress,
        senderCity: originalExtractedData.senderCity,
        senderEmail: originalExtractedData.senderEmail,
        senderPhone: (originalExtractedData as any).senderPhone,
      }),
      ...(entityType === 'recipient' && {
        recipientAddress: originalExtractedData.recipientAddress,
        recipientCity: originalExtractedData.recipientCity,
        recipientEmail: originalExtractedData.recipientEmail,
        recipientPhone: (originalExtractedData as any).recipientPhone,
      }),
    });

    const createdEntity = response.data.createdEntities[entityType];
    if (createdEntity && createdEntity.id) {
      return createdEntity.id;
    }
    throw new Error(`Impossibile ottenere l'ID dell'entità logistica ${entityType} appena creata.`);

  } catch (error) {
    console.error(`Errore durante la creazione automatica dell'entità logistica ${entityType}:`, error);
    return undefined;
  }
};

/**
 * Converte una data in stringa formato ISO (YYYY-MM-DD)
 */
const convertToISODate = (date: Date | string | undefined): string | undefined => {
  if (!date) return undefined;
  
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  
  if (typeof date === 'string') {
    try {
      return new Date(date).toISOString().split('T')[0];
    } catch (e) {
      console.warn('Errore nella conversione della data:', e);
      return undefined;
    }
  }
  
  return undefined;
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
    if (!finalData.orderNumber || !finalData.senderName || !finalData.recipientName) {
      const errors: string[] = [];
      if (!finalData.orderNumber) errors.push('Il numero del buono di ritiro è obbligatorio.');
      if (!finalData.senderName) errors.push('Il mittente è obbligatorio.');
      if (!finalData.recipientName) errors.push('Il destinatario è obbligatorio.');

      const fallbackMatchingResults: MatchingResults = {
        sender: { name: finalData.senderName || '', similarity: 0, isNew: true, isExactMatch: false },
        recipient: { name: finalData.recipientName || '', similarity: 0, isNew: true, isExactMatch: false },
        transporter: (finalData as any).transporter ? { name: (finalData as any).transporter, similarity: 0, isNew: true, isExactMatch: false } : undefined,
        client: { name: finalData.basinDescription || '', similarity: 0, isNew: true },
        basin: { code: finalData.basinCode || '', description: finalData.basinDescription || '', similarity: 0, isNew: true },
        confidence: 0,
        needsReview: true,
        suggestions: { alternateSenders: [], alternateRecipients: [], alternateTransporters: [], alternateClients: [], alternateBasins: [] }
      };

      return {
        success: false,
        matchingResults: fallbackMatchingResults,
        message: 'Dati obbligatori mancanti per la creazione del buono di ritiro',
        errors: errors
      };
    }

    // Esegui il matching
    const matchingResults = await matchExtractedData(finalData);

    // Se necessita revisione e non è forzata la creazione
    if (matchingResults.needsReview && !forceCreate) {
      return {
        success: false,
        matchingResults,
        message: 'I dati necessitano di revisione prima della creazione automatica'
      };
    }

    // PRIMO: Trova cliente e bacino esistenti
    let finalClientId: string | undefined;
    let basinId: string | undefined;

    try {
      const basinsResponse = await api.get('/basins');
      const basins = basinsResponse.data;

      const foundBasin = basins.find((basin: any) => 
        basin.code === finalData.basinCode
      );

      if (foundBasin) {
        basinId = foundBasin.id;
        finalClientId = foundBasin.clientId;
        console.log(`✅ Bacino trovato: ${foundBasin.code} (Cliente: ${finalClientId})`);
      } else {
        if (basins.length > 0) {
          basinId = basins[0].id;
          finalClientId = basins[0].clientId;
          console.warn(`⚠️ Bacino ${finalData.basinCode} non trovato, usando fallback: ${basins[0].code}`);
        } else {
          return {
            success: false,
            matchingResults,
            message: 'Nessun bacino disponibile nel sistema.',
            errors: ['Configurare almeno un bacino nel sistema prima di procedere.']
          };
        }
      }

    } catch (error) {
      console.error('❌ Errore nel recupero bacini:', error);
      return {
        success: false,
        matchingResults,
        message: 'Errore nel recupero dei bacini dal sistema.',
        errors: ['Impossibile accedere ai bacini esistenti.']
      };
    }

    // SECONDO: Crea entità logistiche se necessario
    const logisticSenderId = await createLogisticEntityIfNeeded(matchingResults.sender, finalData, 'sender');
    const logisticRecipientId = await createLogisticEntityIfNeeded(matchingResults.recipient, finalData, 'recipient');
    const logisticTransporterId = await createLogisticEntityIfNeeded(matchingResults.transporter, finalData, 'transporter');

    // Controllo finale ID
    if (!basinId) {
      return {
        success: false,
        matchingResults,
        message: 'Impossibile determinare il bacino per il buono di ritiro.',
        errors: ['ID bacino non disponibile.']
      };
    }

    if (!logisticSenderId || !logisticRecipientId) {
      return {
        success: false,
        matchingResults,
        message: 'Impossibile creare le entità logistiche (mittente/destinatario).',
        errors: ['Verificare la configurazione delle entità logistiche.']
      };
    }

    // TERZO: Prepara i dati per la creazione del buono di ritiro
    const pickupOrderData: CreatePickupOrderData = {
      orderNumber: finalData.orderNumber,
      issueDate: convertToISODate(finalData.issueDate) || new Date().toISOString().split('T')[0],
      
      // Date opzionali - gestione completa
      scheduledDate: convertToISODate(finalData.scheduledDate),
      loadingDate: convertToISODate(finalData.loadingDate),
      unloadingDate: convertToISODate(finalData.unloadingDate), // QUESTO ERA MANCANTE!
      
      // Entità logistiche
      logisticSenderId: logisticSenderId,
      logisticRecipientId: logisticRecipientId,
      logisticTransporterId: logisticTransporterId,
      
      // Cliente e bacino
      clientId: finalClientId,
      basinId: basinId,
      
      // Altri dati
      flowType: finalData.flowType || 'A',
      distanceKm: finalData.distanceKm,
      materialType: (finalData as any).materialType,
      
      status: 'DA_EVADERE',
      
      // Quantità
      expectedQuantity: finalData.expectedQuantity,
      
      notes: `Creato automaticamente da PDF. Confidenza: ${Math.round(matchingResults.confidence * 100)}%`
    };

    console.log('Dati buono di ritiro completi da creare:', pickupOrderData);

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
        sender: { name: extractedData.senderName || '', similarity: 0, isNew: true, isExactMatch: false },
        recipient: { name: extractedData.recipientName || '', similarity: 0, isNew: true, isExactMatch: false },
        transporter: (extractedData as any).transporter ? { name: (extractedData as any).transporter, similarity: 0, isNew: true, isExactMatch: false } : undefined,
        client: { name: extractedData.basinDescription || '', similarity: 0, isNew: true },
        basin: { code: extractedData.basinCode || '', description: extractedData.basinDescription || '', similarity: 0, isNew: true },
        confidence: 0,
        needsReview: true,
        suggestions: { alternateSenders: [], alternateRecipients: [], alternateTransporters: [], alternateClients: [], alternateBasins: [] }
      },
      message: 'Errore durante la creazione del buono di ritiro',
      errors: [error.response?.data?.message || error.message || 'Errore sconosciuto']
    };
  }
};