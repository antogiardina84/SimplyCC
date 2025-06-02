// client/src/modules/pickupOrders/services/pickupOrderCreationService.ts

import api from '../../../core/services/api';
import type { ExtractedPickupOrderData } from './pdfTextService';
import type { LogisticEntitySuggestion, LogisticMatchingResponse } from './enhancedCreationService';

// Definiamo i tipi localmente invece di importarli o li allineiamo con il backend
export interface CreatePickupOrderData {
  orderNumber: string;
  issueDate: string;
  scheduledDate?: string;
  completionDate?: string;
  logisticShipperId?: string;
  logisticSenderId: string;
  logisticRecipientId: string;
  logisticTransporterId?: string; // Nuova aggiunta per il trasportatore logistico (opzionale)
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

export interface LogisticEntityMatchResult {
  id?: string;
  name: string;
  city?: string;
  similarity: number;
  isNew: boolean;
  isExactMatch: boolean;
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
  transporter?: LogisticEntityMatchResult; // Aggiunto il trasportatore (opzionale)
  shipper?: LogisticEntityMatchResult; // Aggiunto lo shipper (opzionale)
  basin: BasinMatchResult;
  confidence: number;
  needsReview: boolean;
  suggestions: {
    alternateSenders: LogisticEntityMatchResult[];
    alternateRecipients: LogisticEntityMatchResult[];
    alternateTransporters?: LogisticEntityMatchResult[]; // Aggiunto (opzionale)
    alternateShippers?: LogisticEntityMatchResult[]; // Aggiunto (opzionale)
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
 * Trova il miglior match per un'entità logistica (mittente, destinatario, trasportatore, shipper)
 * basandosi sulle LogisticEntitySuggestion restituite dal backend.
 * Restituisce 'undefined' se il nome estratto è vuoto o non definito.
 */
const findBestLogisticEntityMatch = (extractedName: string | undefined, suggestions: LogisticEntitySuggestion[]): LogisticEntityMatchResult | undefined => {
  const trimmedName = extractedName?.trim(); // Trimma il nome estratto

  // Se il nome estratto è vuoto o non definito, non cerchiamo match e non lo consideriamo "nuovo" in questo contesto.
  if (!trimmedName) {
    return undefined;
  }

  if (!suggestions || suggestions.length === 0) {
    // Se non ci sono suggerimenti, consideralo una nuova entità
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
    // Considera la similarità se non c'è un match esatto perfetto
    if (suggestion.similarity > bestMatch.similarity) {
      bestMatch = {
        id: suggestion.id,
        name: suggestion.name,
        city: suggestion.city,
        similarity: suggestion.similarity,
        isNew: false, // Se c'è un suggerimento, non è "nuovo" nel senso di completamente sconosciuto
        isExactMatch: false
      };
    }
  }

  // Se la migliore similarità è troppo bassa, consideralo nuovo
  if (bestMatch.similarity < 0.6) { // Soglia di confidenza bassa per considerarlo nuovo
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
 * Esegui il matching di tutti i dati estratti con quelli esistenti nel database (Entità Logistiche e Bacini)
 */
export const matchExtractedData = async (extractedData: ExtractedPickupOrderData): Promise<MatchingResults> => {
  try {
    // 1. Ottieni suggerimenti per le entità logistiche (mittente, destinatario, trasportatore, shipper)
    const logisticSuggestionsResponse: LogisticMatchingResponse = await api.post('/pickup-orders/ocr/logistics/suggestions', {
      senderName: extractedData.senderName,
      recipientName: extractedData.recipientName,
      // Invia transporterName e shipperName solo se presenti in extractedData
      transporterName: (extractedData as any).transporter || undefined,
      shipperName: (extractedData as any).shipperName || undefined,
    }).then(res => res.data);

    // Trova i migliori match per le entità logistiche
    const senderMatch = findBestLogisticEntityMatch(extractedData.senderName, logisticSuggestionsResponse.senderSuggestions);
    const recipientMatch = findBestLogisticEntityMatch(extractedData.recipientName, logisticSuggestionsResponse.recipientSuggestions);

    // Gestione del trasportatore e dello shipper: findBestLogisticEntityMatch può ora restituire undefined
    const transporterMatch = (extractedData as any).transporter
      ? findBestLogisticEntityMatch((extractedData as any).transporter, logisticSuggestionsResponse.transporterSuggestions || [])
      : undefined;

    const shipperMatch = (extractedData as any).shipperName
      ? findBestLogisticEntityMatch((extractedData as any).shipperName, logisticSuggestionsResponse.shipperSuggestions || [])
      : undefined;

    // 2. Carica i bacini dal database
    const basinsResponse = await api.get('/basins');
    const basins = basinsResponse.data;
    const basinMatch = await findBestBasinMatch(extractedData.basinCode, extractedData.basinDescription || '', basins);

    // Calcola la confidenza complessiva
    // Includiamo tutti i match rilevanti per il calcolo della confidenza
    let totalSimilarity = (senderMatch?.similarity || 0) + (recipientMatch?.similarity || 0) + (basinMatch.similarity || 0);
    let count = 3; // Inizialmente per sender, recipient, basin

    if (transporterMatch) {
      totalSimilarity += transporterMatch.similarity;
      count++;
    }
    if (shipperMatch) {
      totalSimilarity += shipperMatch.similarity;
      count++;
    }

    const confidence = totalSimilarity / count;

    // Determina se necessita revisione
    const needsReview = confidence < 0.8 || (senderMatch?.isNew || false) || (recipientMatch?.isNew || false) || basinMatch.isNew || (transporterMatch?.isNew || false) || (shipperMatch?.isNew || false);

    return {
      sender: senderMatch!, // Assumiamo che mittente sia sempre presente e mappato se non è undefined
      recipient: recipientMatch!, // Assumiamo che destinatario sia sempre presente e mappato
      transporter: transporterMatch, // Sarà undefined se non estratto
      shipper: shipperMatch, // Sarà undefined se non estratto
      basin: basinMatch,
      confidence,
      needsReview,
      suggestions: {
        alternateSenders: logisticSuggestionsResponse.senderSuggestions.filter((s: LogisticEntitySuggestion) => !s.isExactMatch && s.id !== senderMatch?.id).map((s: LogisticEntitySuggestion) => ({ ...s, isNew: false })),
        alternateRecipients: logisticSuggestionsResponse.recipientSuggestions.filter((s: LogisticEntitySuggestion) => !s.isExactMatch && s.id !== recipientMatch?.id).map((s: LogisticEntitySuggestion) => ({ ...s, isNew: false })),
        // Includi alternateTransporters solo se transporterMatch è definito e ci sono suggerimenti
        alternateTransporters: transporterMatch ? logisticSuggestionsResponse.transporterSuggestions?.filter((s: LogisticEntitySuggestion) => !s.isExactMatch && s.id !== transporterMatch?.id).map((s: LogisticEntitySuggestion) => ({ ...s, isNew: false })) : [],
        // Includi alternateShippers solo se shipperMatch è definito e ci sono suggerimenti
        alternateShippers: shipperMatch ? logisticSuggestionsResponse.shipperSuggestions?.filter((s: LogisticEntitySuggestion) => !s.isExactMatch && s.id !== shipperMatch?.id).map((s: LogisticEntitySuggestion) => ({ ...s, isNew: false })) : [],
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
    console.error('Errore durante il matching delle entità logistiche/bacini:', error);

    // Fallback: tutti nuovi e necessitano revisione
    return {
      sender: { name: extractedData.senderName || '', similarity: 0, isNew: true, isExactMatch: false },
      recipient: { name: extractedData.recipientName || '', similarity: 0, isNew: true, isExactMatch: false },
      transporter: (extractedData as any).transporter ? { name: (extractedData as any).transporter, similarity: 0, isNew: true, isExactMatch: false } : undefined,
      shipper: (extractedData as any).shipperName ? { name: (extractedData as any).shipperName, similarity: 0, isNew: true, isExactMatch: false } : undefined,
      basin: { code: extractedData.basinCode || '', description: extractedData.basinDescription || '', similarity: 0, isNew: true },
      confidence: 0,
      needsReview: true,
      suggestions: {
        alternateSenders: [],
        alternateRecipients: [],
        alternateTransporters: [],
        alternateShippers: [],
        alternateBasins: []
      }
    };
  }
};

/**
 * Crea nuove entità logistiche se necessario
 * Restituisce l'ID dell'entità creata o undefined se non è stata creata (es. nome vuoto)
 */
const createLogisticEntityIfNeeded = async (
  entityMatch: LogisticEntityMatchResult | undefined, // Può essere undefined
  originalExtractedData: ExtractedPickupOrderData,
  entityType: 'sender' | 'recipient' | 'transporter' | 'shipper'
): Promise<string | undefined> => { // Il tipo di ritorno può essere stringa o undefined
  if (!entityMatch) {
    return undefined; // Nessun match entity, quindi nessun ID
  }

  if (!entityMatch.isNew && entityMatch.id) {
    return entityMatch.id; // Entità già esistente e con ID
  }

  // Evita di tentare di creare un'entità con un nome vuoto se è nuova
  if (entityMatch.isNew && (!entityMatch.name || entityMatch.name.trim() === '')) {
    console.warn(`Tentativo di creare un'entità ${entityType} con nome vuoto. Operazione saltata.`);
    return undefined;
  }

  try {
    const response = await api.post('/pickup-orders/ocr/logistics/auto-create', {
      [entityType + 'Name']: entityMatch.name, // Invia il nome al server
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
      type: entityType
    });

    const createdEntity = response.data.createdEntities[entityType.toUpperCase()];
    if (createdEntity && createdEntity.id) {
      return createdEntity.id;
    }
    throw new Error(`Impossibile ottenere l'ID dell'entità logistica ${entityType} appena creata.`);

  } catch (error) {
    console.error(`Errore durante la creazione automatica dell'entità logistica ${entityType}:`, error);
    // Se la creazione fallisce, restituisci undefined per evitare di bloccare il flusso principale
    // Questo permette di procedere senza un ID per il trasportatore/shipper se non è critico in questa fase.
    return undefined;
  }
};


/**
 * Crea nuovo bacino se necessario
 */
const createBasinIfNeeded = async (basinMatch: BasinMatchResult, associatedEntityId: string): Promise<string> => {
  if (!basinMatch.isNew && basinMatch.id) {
    return basinMatch.id;
  }

  // Crea nuovo bacino
  const newBasin = {
    code: basinMatch.code || '',
    description: basinMatch.description || '',
    flowType: 'A', // Default, può essere cambiato
    logisticClientId: associatedEntityId // Associa al mittente logistico per default
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

    // Validazione dati obbligatori (mittente, destinatario, numero ordine)
    if (!finalData.orderNumber || !finalData.senderName || !finalData.recipientName) {
      const errors: string[] = [];
      if (!finalData.orderNumber) errors.push('Il numero del buono di ritiro è obbligatorio.');
      if (!finalData.senderName) errors.push('Il mittente è obbligatorio.');
      if (!finalData.recipientName) errors.push('Il destinatario è obbligatorio.');

      // Creare un matchingResults di fallback per visualizzare gli errori
      const fallbackMatchingResults: MatchingResults = {
        sender: { name: finalData.senderName || '', similarity: 0, isNew: true, isExactMatch: false },
        recipient: { name: finalData.recipientName || '', similarity: 0, isNew: true, isExactMatch: false },
        transporter: (finalData as any).transporter ? { name: (finalData as any).transporter, similarity: 0, isNew: true, isExactMatch: false } : undefined,
        shipper: (finalData as any).shipperName ? { name: (finalData as any).shipperName, similarity: 0, isNew: true, isExactMatch: false } : undefined,
        basin: { code: finalData.basinCode || '', description: finalData.basinDescription || '', similarity: 0, isNew: true },
        confidence: 0,
        needsReview: true,
        suggestions: { alternateSenders: [], alternateRecipients: [], alternateTransporters: [], alternateShippers: [], alternateBasins: [] }
      };

      return {
        success: false,
        matchingResults: fallbackMatchingResults,
        message: 'Dati obbligatori mancanti per la creazione del buono di ritiro',
        errors: errors
      };
    }

    // Esegui il matching per tutte le entità (logistiche e bacino)
    const matchingResults = await matchExtractedData(finalData);

    // Se necessita revisione e non è forzata la creazione, restituisci i risultati del matching
    if (matchingResults.needsReview && !forceCreate) {
      return {
        success: false,
        matchingResults,
        message: 'I dati necessitano di revisione prima della creazione automatica'
      };
    }

    // Crea entità logistiche e bacini se necessario.
    // createLogisticEntityIfNeeded ora restituisce undefined se il nome è vuoto.
    const senderLogisticId = await createLogisticEntityIfNeeded(matchingResults.sender, finalData, 'sender');
    const recipientLogisticId = await createLogisticEntityIfNeeded(matchingResults.recipient, finalData, 'recipient');
    const transporterLogisticId = await createLogisticEntityIfNeeded(matchingResults.transporter, finalData, 'transporter');
    const shipperLogisticId = await createLogisticEntityIfNeeded(matchingResults.shipper, finalData, 'shipper');

    // Assicurati che mittente e destinatario abbiano ID validi prima di proseguire
    if (!senderLogisticId || !recipientLogisticId) {
      return {
        success: false,
        matchingResults,
        message: 'Impossibile determinare gli ID per mittente o destinatario, impossibile creare il buono di ritiro.',
        errors: ['ID mittente o destinatario non disponibili.']
      };
    }

    // Il bacino viene associato al mittente logistico
    const basinId = await createBasinIfNeeded(matchingResults.basin, senderLogisticId);


    // Prepara i dati per la creazione del buono di ritiro
    const pickupOrderData: CreatePickupOrderData = {
      orderNumber: finalData.orderNumber,
      issueDate: finalData.issueDate instanceof Date
        ? finalData.issueDate.toISOString().split('T')[0]
        : (finalData.issueDate?.toString() || new Date().toISOString().split('T')[0]),
      scheduledDate: finalData.loadingDate instanceof Date
        ? finalData.loadingDate.toISOString().split('T')[0]
        : undefined,
      logisticSenderId: senderLogisticId,
      logisticRecipientId: recipientLogisticId,
      logisticTransporterId: transporterLogisticId, // Sarà undefined se non estratto/creato
      logisticShipperId: shipperLogisticId,         // Sarà undefined se non estratto/creato
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

    // Gestione degli errori, assicurandosi che i campi opzionali siano undefined
    return {
      success: false,
      matchingResults: {
        sender: { name: extractedData.senderName || '', similarity: 0, isNew: true, isExactMatch: false },
        recipient: { name: extractedData.recipientName || '', similarity: 0, isNew: true, isExactMatch: false },
        transporter: (extractedData as any).transporter ? { name: (extractedData as any).transporter, similarity: 0, isNew: true, isExactMatch: false } : undefined,
        shipper: (extractedData as any).shipperName ? { name: (extractedData as any).shipperName, similarity: 0, isNew: true, isExactMatch: false } : undefined,
        basin: { code: extractedData.basinCode || '', description: extractedData.basinDescription, similarity: 0, isNew: true },
        confidence: 0,
        needsReview: true,
        suggestions: { alternateSenders: [], alternateRecipients: [], alternateTransporters: [], alternateShippers: [], alternateBasins: [] }
      },
      message: 'Errore durante la creazione del buono di ritiro',
      errors: [error.response?.data?.message || error.message || 'Errore sconosciuto']
    };
  }
};