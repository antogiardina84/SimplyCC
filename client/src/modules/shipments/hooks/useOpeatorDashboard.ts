// client/src/modules/shipments/hooks/useOperatorDashboard.ts

import { useState, useEffect, useCallback } from 'react';
import * as workflowService from '../../pickupOrders/services/workflowService';
import type { MyOrder } from '../../pickupOrders/services/workflowService';

interface UseOperatorDashboardReturn {
  loading: boolean;
  error: string | null;
  myOrders: MyOrder[];
  todayOrders: any[];
  notifications: number;
  refreshData: () => Promise<void>;
  takeCharge: (orderId: string, notes?: string) => Promise<boolean>;
  completeLoading: (orderId: string, data: { packageCount?: number; notes?: string }) => Promise<boolean>;
}

export const useOperatorDashboard = (): UseOperatorDashboardReturn => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myOrders, setMyOrders] = useState<MyOrder[]>([]);
  const [todayOrders, setTodayOrders] = useState<any[]>([]);
  const [notifications, setNotifications] = useState(0);

  const refreshData = useCallback(async () => {
    try {
      setError(null);

      const [myOrdersResponse, todayResponse] = await Promise.all([
        workflowService.getMyOrders(),
        workflowService.getTodayScheduled()
      ]);

      setMyOrders(myOrdersResponse || []);
      setTodayOrders(todayResponse || []);
      
      // Calcola notifiche (ordini IN_EVASIONE disponibili per presa in carico)
      const availableOrders = todayResponse?.filter((order: any) => 
        order.status === 'IN_EVASIONE' && !order.assignedOperator
      ) || [];
      setNotifications(availableOrders.length);
      
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(error.response?.data?.message || 'Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  }, []);

  const takeCharge = useCallback(async (orderId: string, notes?: string): Promise<boolean> => {
    try {
      await workflowService.assignOperator(orderId, { notes });
      await refreshData();
      return true;
    } catch (error: any) {
      console.error('Error assigning operator:', error);
      setError(error.response?.data?.message || 'Errore durante la presa in carico');
      return false;
    }
  }, [refreshData]);

  const completeLoading = useCallback(async (
    orderId: string, 
    data: { packageCount?: number; notes?: string }
  ): Promise<boolean> => {
    try {
      await workflowService.completeLoading(orderId, data);
      await refreshData();
      return true;
    } catch (error: any) {
      console.error('Error completing loading:', error);
      setError(error.response?.data?.message || 'Errore durante il completamento del carico');
      return false;
    }
  }, [refreshData]);

  useEffect(() => {
    refreshData();
    
    // Setup auto-refresh ogni 30 secondi
    const interval = setInterval(refreshData, 30000);
    
    return () => clearInterval(interval);
  }, [refreshData]);

  return {
    loading,
    error,
    myOrders,
    todayOrders,
    notifications,
    refreshData,
    takeCharge,
    completeLoading
  };
};