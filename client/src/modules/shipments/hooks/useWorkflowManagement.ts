// client/src/modules/shipments/hooks/useWorkflowManagement.ts

import { useState, useCallback } from 'react';
import * as shipmentService from '../services/shipmentService';
import type { 
  StatusChangeRequest, 
  CancellationRequest, 
  WorkflowTransition 
} from '../services/shipmentService';

interface UseWorkflowManagementReturn {
  loading: boolean;
  error: string | null;
  availableTransitions: WorkflowTransition[];
  changeStatus: (request: StatusChangeRequest) => Promise<boolean>;
  cancelOrder: (request: CancellationRequest) => Promise<boolean>;
  getTransitionsForStatus: (status: string, userRole: string) => WorkflowTransition[];
  clearError: () => void;
}

export const useWorkflowManagement = (): UseWorkflowManagementReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTransitions, setAvailableTransitions] = useState<WorkflowTransition[]>([]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getTransitionsForStatus = useCallback((status: string, userRole: string): WorkflowTransition[] => {
    const transitions = shipmentService.getAvailableTransitions(status, userRole);
    setAvailableTransitions(transitions);
    return transitions;
  }, []);

  const changeStatus = useCallback(async (request: StatusChangeRequest): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await shipmentService.changeOrderStatus(request);
      return true;
    } catch (err: any) {
      setError(err.message || 'Errore durante il cambio di stato');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelOrder = useCallback(async (request: CancellationRequest): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await shipmentService.cancelOrder(request);
      return true;
    } catch (err: any) {
      setError(err.message || 'Errore durante la cancellazione');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    availableTransitions,
    changeStatus,
    cancelOrder,
    getTransitionsForStatus,
    clearError
  };
};