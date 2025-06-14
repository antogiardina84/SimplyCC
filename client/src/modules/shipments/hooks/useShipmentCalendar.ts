// client/src/modules/shipments/hooks/useShipmentCalendar.ts

import { useState, useEffect, useCallback } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import * as shipmentService from '../services/shipmentService';
import type { UnscheduledPickupOrder, Shipment } from '../services/shipmentService';

interface UseShipmentCalendarReturn {
  loading: boolean;
  error: string | null;
  pickupOrdersToSchedule: UnscheduledPickupOrder[];
  scheduledShipments: Shipment[];
  currentWeekStart: Date;
  datesOfWeek: Date[];
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  setCurrentWeekStart: (date: Date) => void;
  refreshData: () => Promise<void>;
  debugDatabase: () => Promise<void>;
}

export const useShipmentCalendar = (): UseShipmentCalendarReturn => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pickupOrdersToSchedule, setPickupOrdersToSchedule] = useState<UnscheduledPickupOrder[]>([]);
  const [scheduledShipments, setScheduledShipments] = useState<Shipment[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const datesOfWeek = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 === INIZIO REFRESH DATA ===');
      
      // Debug database
      await shipmentService.debugDatabaseStatus();
      
      // Carica ordini da evadere
      console.log('📦 Caricamento ordini da evadere...');
      const pickupOrdersResponse = await shipmentService.getPickupOrdersToSchedule();
      console.log('✅ Ordini DA_EVADERE caricati:', pickupOrdersResponse.length);
      setPickupOrdersToSchedule(pickupOrdersResponse);

      // Ottieni le spedizioni per la settimana corrente
      const startDate = format(currentWeekStart, 'yyyy-MM-dd');
      const endDate = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd');
      
      console.log('🚛 Caricamento spedizioni per periodo:', { startDate, endDate });
      const shipmentsResponse = await shipmentService.getShipments({
        startDate,
        endDate,
      });
      
      console.log('✅ Spedizioni caricate dal servizio:', shipmentsResponse.length);
      
      // Filtra per stati rilevanti
      const filteredShipments = shipmentsResponse.filter(shipment => {
        const includeStates = ['PROGRAMMATO', 'IN_EVASIONE', 'IN_CARICO', 'CARICATO', 'SPEDITO'];
        const shouldInclude = includeStates.includes(shipment.status);
        
        if (!shouldInclude) {
          console.log(`❌ Escluso shipment ${shipment.orderNumber} con stato: ${shipment.status}`);
        } else {
          console.log(`✅ Incluso shipment ${shipment.orderNumber} con stato: ${shipment.status}`);
        }
        
        return shouldInclude;
      });
      
      console.log('🎯 Spedizioni filtrate per calendario:', filteredShipments.length);
      setScheduledShipments(filteredShipments);
      
      console.log('🔄 === FINE REFRESH DATA ===');

    } catch (err: any) {
      console.error("❌ Errore durante il recupero dei dati del calendario:", err);
      setError("Impossibile caricare i dati. Riprova.");
    } finally {
      setLoading(false);
    }
  }, [currentWeekStart]);

  const debugDatabase = useCallback(async () => {
    try {
      await shipmentService.debugDatabaseStatus();
    } catch (error) {
      console.error('Errore nel debug database:', error);
    }
  }, []);

  const goToPreviousWeek = useCallback(() => {
    setCurrentWeekStart(prev => addDays(prev, -7));
  }, []);

  const goToNextWeek = useCallback(() => {
    setCurrentWeekStart(prev => addDays(prev, 7));
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    loading,
    error,
    pickupOrdersToSchedule,
    scheduledShipments,
    currentWeekStart,
    datesOfWeek,
    goToPreviousWeek,
    goToNextWeek,
    setCurrentWeekStart,
    refreshData,
    debugDatabase
  };
};