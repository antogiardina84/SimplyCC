// server/src/modules/pickupOrders/controllers/ocrLogistics.controller.ts

import { Request, Response, NextFunction } from 'express';
import * as logisticsService from '../../shipments/services/logistics.service';

export interface LogisticMatchingRequest {
  senderName?: string;
  recipientName?: string;
  transporterName?: string;
}

export interface LogisticMatchingResponse {
  senderSuggestions: Array<{
    id: string;
    name: string;
    city?: string;
    similarity: number;
    isExactMatch: boolean;
  }>;
  recipientSuggestions: Array<{
    id: string;
    name: string;
    city?: string;
    similarity: number;
    isExactMatch: boolean;
  }>;
  transporterSuggestions: Array<{
    id: string;
    name: string;
    city?: string;
    similarity: number;
    isExactMatch: boolean;
  }>;
  confidence: number;
  needsReview: boolean;
}

/**
 * Calcola la similarità tra due stringhe usando Levenshtein distance
 */
const calculateSimilarity = (str1: string, str2: string): number => {
  if (!str1 || !str2) return 0;
  
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
 * Trova suggerimenti per un'entità logistica specifica
 */
const findLogisticSuggestions = async (searchTerm: string, entityType: 'SENDER' | 'RECIPIENT' | 'TRANSPORTER') => {
  if (!searchTerm || searchTerm.length < 3) {
    return [];
  }

  // Ottieni tutte le entità del tipo richiesto
  const entities = await logisticsService.findLogisticEntitiesByType(entityType);
  
  // Calcola similarità per ciascuna entità
  const suggestions = entities.map(entity => {
    const nameSimilarity = calculateSimilarity(searchTerm, entity.name);
    const citySimilarity = entity.city ? calculateSimilarity(searchTerm, entity.city) : 0;
    const contactSimilarity = entity.contactPerson ? calculateSimilarity(searchTerm, entity.contactPerson) : 0;
    
    // Prendi la similarità migliore
    const similarity = Math.max(nameSimilarity, citySimilarity, contactSimilarity);
    
    return {
      id: entity.id,
      name: entity.name,
      city: entity.city || undefined, // Converti null in undefined
      similarity,
      isExactMatch: nameSimilarity >= 0.95, // Considerato match esatto se > 95%
    };
  });

  // Ordina per similarità e prendi i primi 5
  return suggestions
    .filter(s => s.similarity > 0.3) // Solo sopra 30% di similarità
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);
};

/**
 * Endpoint per ottenere suggerimenti di entità logistiche basati sui dati OCR
 */
export const getLogisticSuggestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { senderName, recipientName, transporterName } = req.body as LogisticMatchingRequest;
    
    // Cerca suggerimenti per ciascun tipo di entità
    const [senderSuggestions, recipientSuggestions, transporterSuggestions] = await Promise.all([
      senderName ? findLogisticSuggestions(senderName, 'SENDER') : [],
      recipientName ? findLogisticSuggestions(recipientName, 'RECIPIENT') : [],
      transporterName ? findLogisticSuggestions(transporterName, 'TRANSPORTER') : [],
    ]);

    // Calcola confidenza complessiva
    const allSuggestions = [...senderSuggestions, ...recipientSuggestions, ...transporterSuggestions];
    const avgSimilarity = allSuggestions.length > 0 
      ? allSuggestions.reduce((sum, s) => sum + s.similarity, 0) / allSuggestions.length 
      : 0;

    const confidence = Math.round(avgSimilarity * 100);
    const needsReview = confidence < 80 || allSuggestions.some(s => !s.isExactMatch);

    const response: LogisticMatchingResponse = {
      senderSuggestions,
      recipientSuggestions,
      transporterSuggestions,
      confidence,
      needsReview,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Endpoint per creare automaticamente entità logistiche dai dati OCR
 */
interface CreatedEntity {
  id: string;
  name: string;
  entityType: string;
  address?: string | null;
  city?: string | null;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const createLogisticEntitiesFromOCR = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      senderName,
      senderAddress,
      senderCity,
      senderEmail,
      senderPhone,
      recipientName,
      recipientAddress,
      recipientCity,
      recipientEmail,
      recipientPhone,
    } = req.body;

    const createdEntities: { 
      sender?: CreatedEntity; 
      recipient?: CreatedEntity; 
    } = {};

    // Crea mittente se non esiste
    if (senderName) {
      try {
        const newSender = await logisticsService.createLogisticEntity({
          name: senderName,
          address: senderAddress,
          city: senderCity,
          email: senderEmail,
          phone: senderPhone,
          entityType: 'SENDER',
          notes: 'Creato automaticamente da OCR',
        });
        createdEntities.sender = newSender;
      } catch (error) {
        // Se esiste già, cerca quello esistente
        const existing = await logisticsService.searchLogisticEntitiesForOCR(senderName, 'SENDER');
        if (existing.length > 0) {
          createdEntities.sender = existing[0];
        }
      }
    }

    // Crea destinatario se non esiste
    if (recipientName) {
      try {
        const newRecipient = await logisticsService.createLogisticEntity({
          name: recipientName,
          address: recipientAddress,
          city: recipientCity,
          email: recipientEmail,
          phone: recipientPhone,
          entityType: 'RECIPIENT',
          notes: 'Creato automaticamente da OCR',
        });
        createdEntities.recipient = newRecipient;
      } catch (error) {
        // Se esiste già, cerca quello esistente
        const existing = await logisticsService.searchLogisticEntitiesForOCR(recipientName, 'RECIPIENT');
        if (existing.length > 0) {
          createdEntities.recipient = existing[0];
        }
      }
    }

    res.status(201).json({
      success: true,
      createdEntities,
      message: 'Entità logistiche create/trovate con successo',
    });
  } catch (error) {
    next(error);
  }
};