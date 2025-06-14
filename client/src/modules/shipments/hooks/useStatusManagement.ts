// client/src/modules/shipments/hooks/useStatusManagement.ts

import { useState, useCallback } from 'react';
import * as shipmentService from '../services/shipmentService';
import type { 
  WorkflowTransition, 
  StatusChangeRequest, 
  CancellationRequest,
  AvailableOperator 
} from '../services/shipmentService';

interface UseStatusManagementReturn {
  loading: boolean;
  error: string | null;
  availableTransitions: WorkflowTransition[];
  availableOperators: AvailableOperator[];
  orderHistory: any[];
  loadTransitions: (status: string, userRole: string) => void;
  loadOperators: () => Promise<void>;
  loadHistory: (pickupOrderId: string) => Promise<void>;
  executeStatusChange: (request: StatusChangeRequest) => Promise<boolean>;
  executeCancellation: (request: CancellationRequest) => Promise<boolean>;
  validateTransition: (transition: WorkflowTransition, data: any) => { isValid: boolean; errors: string[] };
  clearError: () => void;
}

export const useStatusManagement = (): UseStatusManagementReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTransitions, setAvailableTransitions] = useState<WorkflowTransition[]>([]);
  const [availableOperators, setAvailableOperators] = useState<AvailableOperator[]>([]);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadTransitions = useCallback((status: string, userRole: string) => {
    const transitions = shipmentService.getAvailableTransitions(status, userRole);
    setAvailableTransitions(transitions);
  }, []);

  const loadOperators = useCallback(async () => {
    try {
      setLoading(true);
      const operators = await shipmentService.getAvailableOperators();
      setAvailableOperators(operators);
    } catch (err: any) {
      console.error('Errore nel caricamento operatori:', err);
      setError(err.message || 'Errore nel caricamento operatori');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async (pickupOrderId: string) => {
    try {
      setLoading(true);
      const history = await shipmentService.getOrderHistory(pickupOrderId);
      setOrderHistory(history.statusHistory || []);
    } catch (err: any) {
      console.error('Errore nel caricamento storico:', err);
      setError(err.message || 'Errore nel caricamento dello storico');
    } finally {
      setLoading(false);
    }
  }, []);

  const executeStatusChange = useCallback(async (request: StatusChangeRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await shipmentService.changeOrderStatus(request);
      return true;
    } catch (err: any) {
      console.error('Errore nel cambio stato:', err);
      setError(err.message || 'Errore durante il cambio di stato');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const executeCancellation = useCallback(async (request: CancellationRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await shipmentService.cancelOrder(request);
      return true;
    } catch (err: any) {
      console.error('Errore nella cancellazione:', err);
      setError(err.message || 'Errore durante la cancellazione');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const validateTransition = useCallback((transition: WorkflowTransition, data: any) => {
    const validation = shipmentService.validateTransitionData(transition, data);
    return {
      isValid: validation.isValid,
      errors: validation.missingFields.map(field => `Campo mancante: ${field}`)
    };
  }, []);

  return {
    loading,
    error,
    availableTransitions,
    availableOperators,
    orderHistory,
    loadTransitions,
    loadOperators,
    loadHistory,
    executeStatusChange,
    executeCancellation,
    validateTransition,
    clearError
  };
};