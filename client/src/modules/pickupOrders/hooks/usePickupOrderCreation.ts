// client/src/modules/pickupOrders/hooks/usePickupOrderCreation.ts

import { useState, useCallback } from 'react';
import * as creationService from '../services/pickupOrderCreationService';
import type { ExtractedPickupOrderData } from '../services/pdfTextService';
import type { CreationResult, MatchingResults } from '../services/pickupOrderCreationService';

interface UsePickupOrderCreationReturn {
  creating: boolean;
  lastResult: CreationResult | null;
  matchingResults: MatchingResults | null;
  error: string | null;
  createFromExtractedData: (
    extractedData: ExtractedPickupOrderData,
    corrections?: any,
    forceCreate?: boolean
  ) => Promise<CreationResult>;
  reset: () => void;
}

export const usePickupOrderCreation = (): UsePickupOrderCreationReturn => {
  const [creating, setCreating] = useState(false);
  const [lastResult, setLastResult] = useState<CreationResult | null>(null);
  const [matchingResults, setMatchingResults] = useState<MatchingResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createFromExtractedData = useCallback(async (
    extractedData: ExtractedPickupOrderData,
    corrections: any = {},
    forceCreate: boolean = false
  ): Promise<CreationResult> => {
    setCreating(true);
    setError(null);

    try {
      const result = await creationService.createPickupOrderFromExtractedData(
        extractedData,
        corrections,
        forceCreate
      );

      setLastResult(result);
      setMatchingResults(result.matchingResults);

      if (!result.success) {
        setError(result.message);
      }

      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Errore durante la creazione del buono di ritiro';
      setError(errorMessage);
      
      // CORRETTO: Aggiunge tutte le proprietà richieste dalle interfacce
      const failureResult: CreationResult = {
        success: false,
        matchingResults: {
          sender: { 
            name: extractedData.senderName || '', 
            similarity: 0, 
            isNew: true,
            isExactMatch: false // AGGIUNTO
          },
          recipient: { 
            name: extractedData.recipientName || '', 
            similarity: 0, 
            isNew: true,
            isExactMatch: false // AGGIUNTO
          },
          client: { 
            name: extractedData.basinDescription || '', 
            similarity: 0, 
            isNew: true 
          }, // AGGIUNTO: Proprietà client mancante
          basin: { 
            code: extractedData.basinCode || '', 
            description: extractedData.basinDescription || '', 
            similarity: 0, 
            isNew: true 
          },
          confidence: 0,
          needsReview: true,
          suggestions: { 
            alternateSenders: [], 
            alternateRecipients: [], 
            alternateTransporters: [], // AGGIUNTO: Proprietà opzionale
            alternateClients: [],      // AGGIUNTO: Proprietà mancante
            alternateBasins: [] 
          }
        },
        message: errorMessage,
        errors: [errorMessage]
      };

      setLastResult(failureResult);
      setMatchingResults(failureResult.matchingResults);
      
      return failureResult;
    } finally {
      setCreating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setCreating(false);
    setLastResult(null);
    setMatchingResults(null);
    setError(null);
  }, []);

  return {
    creating,
    lastResult,
    matchingResults,
    error,
    createFromExtractedData,
    reset
  };
};