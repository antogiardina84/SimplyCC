// client/src/modules/shipments/services/shipmentService.ts

import api from '../../../core/services/api';
import * as workflowService from '../../pickupOrders/services/workflowService';

// === INTERFACES ===
export interface UnscheduledPickupOrder {
  id: string;
  orderNumber: string;
  status: string;
  issueDate: string;
  basin: {
    code: string;
    client: {
      name: string;
    };
  };
  logisticSender?: {
    name: string;
  };
  logisticRecipient?: {
    name: string;
  };
  expectedQuantity?: number;
}

export interface Shipment {
  id: string;
  pickupOrderId: string;
  scheduledDate: string;
  timeSlot: string;
  priority: string;
  estimatedDuration?: number;
  specialInstructions?: string;
  equipmentNeeded?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  pickupOrder: {
    id: string;
    orderNumber: string;
    status: string;
    issueDate: string;
    scheduledDate?: string;
    basin: {
      code: string;
      client: {
        name: string;
      };
    };
    logisticSender?: {
      name: string;
    };
    logisticRecipient?: {
      name: string;
    };
    expectedQuantity?: number;
    assignedOperator?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  orderNumber: string;
  status: string;
}

export interface AvailableOperator {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isAvailable?: boolean;
}

export interface WorkflowTransition {
  fromStatus: string;
  toStatus: string;
  label: string;
  description: string;
  requiredRole: string[];
  requiredFields?: string[];
  confirmationRequired?: boolean;
  warningMessage?: string;
}

export interface StatusChangeRequest {
  pickupOrderId: string;
  fromStatus: string;
  toStatus: string;
  reason: string;
  notes?: string;
  additionalData?: any;
}

export interface CancellationRequest {
  pickupOrderId: string;
  reason: string;
  notes?: string;
  compensationRequired?: boolean;
  alternativeOrderId?: string;
}

// === API FUNCTIONS ===

/**
 * Debug del database - verifica connessione e dati
 */
export const debugDatabaseStatus = async (): Promise<void> => {
  try {
    console.log('🔍 === DEBUG DATABASE ===');
    
    // Test connessione generale
    const healthResponse = await api.get('/health');
    console.log('✅ API Health Check:', healthResponse.status);
    
    // Verifica pickup orders
    const ordersResponse = await api.get('/pickup-orders');
    console.log('📦 Total pickup orders:', ordersResponse.data.length);
    
    // Verifica ordini per stato
    const statusCounts = ordersResponse.data.reduce((acc: any, order: any) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});
    console.log('📊 Orders by status:', statusCounts);
    
  } catch (error) {
    console.error('❌ Database debug failed:', error);
  }
};

/**
 * Ottiene pickup orders non ancora programmati (DA_EVADERE)
 */
export const getPickupOrdersToSchedule = async (): Promise<UnscheduledPickupOrder[]> => {
  try {
    const response = await api.get('/pickup-orders/unscheduled');
    return response.data;
  } catch (error) {
    console.error('Errore nel recupero ordini da programmare:', error);
    throw error;
  }
};

/**
 * Ottiene le spedizioni per un periodo specifico
 */
export const getShipments = async (params: {
  startDate?: string;
  endDate?: string;
  status?: string;
}): Promise<Shipment[]> => {
  try {
    // RIPRISTINATO: Torna alla chiamata originale che funzionava
    const response = await api.get('/pickup-orders', { params });
    
    // Trasforma i pickup orders in formato spedizione
    const shipments: Shipment[] = response.data
      .filter((order: any) => {
        // DEBUG: Log di ogni ordine
        console.log('🔍 Controllo ordine:', {
          orderNumber: order.orderNumber,
          status: order.status,
          scheduledDate: order.scheduledDate,
          hasScheduledDate: !!order.scheduledDate,
          startDate: params.startDate,
          endDate: params.endDate
        });
        
        // Include solo ordini con data programmazione
        const hasScheduledDate = order.scheduledDate;
        
        // CORREZIONE: Confronto corretto delle date
        let isInDateRange = true;
        if (params.startDate && params.endDate && order.scheduledDate) {
          const orderDate = new Date(order.scheduledDate);
          const startDate = new Date(params.startDate);
          const endDate = new Date(params.endDate);
          
          // Imposta tutti gli orari a mezzanotte per confrontare solo le date
          orderDate.setHours(0, 0, 0, 0);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          
          isInDateRange = orderDate >= startDate && orderDate <= endDate;
        }
        const matchesStatus = !params.status || order.status === params.status;
        
        console.log('🎯 Risultato filtro:', {
          hasScheduledDate,
          isInDateRange,
          matchesStatus,
          passed: hasScheduledDate && isInDateRange && matchesStatus
        });
        
        return hasScheduledDate && isInDateRange && matchesStatus;
      })
      .map((order: any) => ({
        id: order.id,
        pickupOrderId: order.id,
        scheduledDate: order.scheduledDate,
        timeSlot: order.timeSlot || 'FLESSIBILE',
        priority: order.priority || 'NORMAL',
        estimatedDuration: order.estimatedDuration,
        specialInstructions: order.notes,
        equipmentNeeded: order.equipmentNeeded,
        pickupOrder: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          issueDate: order.issueDate,
          scheduledDate: order.scheduledDate,
          basin: order.basin,
          logisticSender: order.logisticSender,
          logisticRecipient: order.logisticRecipient,
          expectedQuantity: order.expectedQuantity,
          assignedOperator: order.assignedOperator
        },
        orderNumber: order.orderNumber,
        status: order.status
      }));
    
    return shipments;
  } catch (error) {
    console.error('Errore nel recupero spedizioni:', error);
    throw error;
  }
};

/**
 * Programma una spedizione
 */
export const scheduleShipment = async (data: {
  pickupOrderId: string;
  scheduledDate: string;
  timeSlot: string;
  priority: string;
  notes?: string;
}): Promise<any> => {
  try {
    // Prima aggiorna il pickup order con la programmazione
    const updateResponse = await api.put(`/pickup-orders/${data.pickupOrderId}`, {
      scheduledDate: data.scheduledDate,
      status: 'PROGRAMMATO',
      timeSlot: data.timeSlot,
      priority: data.priority,
      notes: data.notes
    });
    
    return updateResponse.data;
  } catch (error) {
    console.error('Errore nella programmazione spedizione:', error);
    throw error;
  }
};

/**
 * Aggiorna una spedizione
 */
export const updateShipment = async (shipmentId: string, data: {
  scheduledDate: string;
  timeSlot: string;
  priority: string;
}): Promise<any> => {
  try {
    const response = await api.put(`/pickup-orders/${shipmentId}`, {
      scheduledDate: data.scheduledDate,
      timeSlot: data.timeSlot,
      priority: data.priority
    });
    
    return response.data;
  } catch (error) {
    console.error('Errore nell\'aggiornamento spedizione:', error);
    throw error;
  }
};

/**
 * CORREZIONE: Cambia stato ordine usando il workflow service
 */
export const changeOrderStatus = async (request: StatusChangeRequest): Promise<any> => {
  try {
    // Usa il servizio workflow per il cambio stato
    return await workflowService.changePickupOrderStatus(
      request.pickupOrderId,
      {
        newStatus: request.toStatus,
        reason: request.reason,
        notes: request.notes,
        additionalData: request.additionalData
      }
    );
  } catch (error) {
    console.error('Errore nel cambio stato:', error);
    throw error;
  }
};

/**
 * Annulla un ordine
 */
export const cancelOrder = async (request: CancellationRequest): Promise<any> => {
  try {
    const response = await api.put(`/pickup-orders/${request.pickupOrderId}`, {
      status: 'CANCELLED',
      isRejected: true,
      rejectionReason: request.reason,
      rejectionDate: new Date().toISOString(),
      notes: request.notes
    });
    
    return response.data;
  } catch (error) {
    console.error('Errore nella cancellazione ordine:', error);
    throw error;
  }
};

/**
 * CORREZIONE: Prende in carico un ordine (Operatore)
 */
export const takeChargeOfOrder = async (orderId: string, notes?: string): Promise<any> => {
  try {
    // Usa il workflow service per l'assegnazione operatore
    return await workflowService.assignOperator(orderId, { notes });
  } catch (error) {
    console.error('Errore nella presa in carico:', error);
    throw error;
  }
};

/**
 * CORREZIONE: Completa il carico (Operatore)
 */
export const completeLoading = async (orderId: string, data: {
  loadedPackages?: number;
  notes?: string;
}): Promise<any> => {
  try {
    // Usa il workflow service per il completamento carico
    return await workflowService.completeLoading(orderId, {
      packageCount: data.loadedPackages,
      notes: data.notes
    });
  } catch (error) {
    console.error('Errore nel completamento carico:', error);
    throw error;
  }
};

/**
 * Ottiene operatori disponibili
 */
export const getAvailableOperators = async (): Promise<AvailableOperator[]> => {
  try {
    return await workflowService.getAvailableOperators();
  } catch (error) {
    console.error('Errore nel recupero operatori:', error);
    throw error;
  }
};

/**
 * Ottiene storico di un ordine
 */
export const getOrderHistory = async (pickupOrderId: string): Promise<any> => {
  try {
    return await workflowService.getPickupOrderHistory(pickupOrderId);
  } catch (error) {
    console.error('Errore nel recupero storico:', error);
    throw error;
  }
};

// === WORKFLOW MANAGEMENT ===

/**
 * Ottiene le transizioni disponibili per uno stato
 */
export const getAvailableTransitions = (status: string, userRole: string): WorkflowTransition[] => {
  const transitions: WorkflowTransition[] = [
    {
      fromStatus: 'DA_EVADERE',
      toStatus: 'PROGRAMMATO',
      label: 'Programma',
      description: 'Programma il ritiro per una data specifica',
      requiredRole: ['MANAGER', 'ADMIN'],
      requiredFields: ['scheduledDate'],
    },
    {
      fromStatus: 'PROGRAMMATO',
      toStatus: 'IN_EVASIONE',
      label: 'Avvia Evasione',
      description: 'Il mezzo è arrivato, avvia l\'evasione',
      requiredRole: ['MANAGER', 'ADMIN'],
      warningMessage: 'Assicurati che il trasportatore sia presente',
    },
    {
      fromStatus: 'IN_EVASIONE',
      toStatus: 'IN_CARICO',
      label: 'Prendi in Carico',
      description: 'Assegna operatore e prendi in carico',
      requiredRole: ['OPERATOR', 'MANAGER', 'ADMIN'],
    },
    {
      fromStatus: 'IN_CARICO',
      toStatus: 'CARICATO',
      label: 'Completa Carico',
      description: 'Segna il carico come completato',
      requiredRole: ['OPERATOR', 'MANAGER', 'ADMIN'],
      requiredFields: ['packageCount'],
    },
    {
      fromStatus: 'CARICATO',
      toStatus: 'SPEDITO',
      label: 'Finalizza Spedizione',
      description: 'Conferma la partenza della spedizione',
      requiredRole: ['MANAGER', 'ADMIN'],
      requiredFields: ['departureWeight'],
    },
    {
      fromStatus: 'SPEDITO',
      toStatus: 'COMPLETO',
      label: 'Completa Ordine',
      description: 'Conferma l\'arrivo a destinazione',
      requiredRole: ['MANAGER', 'ADMIN'],
      requiredFields: ['arrivalWeight'],
    },
  ];

  return transitions.filter(t => 
    t.fromStatus === status && 
    t.requiredRole.includes(userRole)
  );
};

/**
 * Valida i dati di una transizione
 */
export const validateTransitionData = (transition: WorkflowTransition, data: any): {
  isValid: boolean;
  missingFields: string[];
} => {
  const missingFields: string[] = [];
  
  if (transition.requiredFields) {
    for (const field of transition.requiredFields) {
      if (!data[field] || data[field] === '') {
        missingFields.push(field);
      }
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

// === STATUS UTILITIES ===

/**
 * Formatta lo stato per la visualizzazione
 */
export const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'DA_EVADERE': 'Da Evadere',
    'PROGRAMMATO': 'Programmato',
    'IN_EVASIONE': 'In Evasione',
    'IN_CARICO': 'In Carico',
    'CARICATO': 'Caricato',
    'SPEDITO': 'Spedito',
    'COMPLETO': 'Completo',
    'CANCELLED': 'Annullato'
  };
  return statusMap[status] || status;
};

/**
 * Ottiene il colore per lo stato
 */
export const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  const colorMap: Record<string, any> = {
    'DA_EVADERE': 'warning',
    'PROGRAMMATO': 'info',
    'IN_EVASIONE': 'warning',
    'IN_CARICO': 'primary',
   'CARICATO': 'success',
   'SPEDITO': 'success',
   'COMPLETO': 'success',
   'CANCELLED': 'error'
 };
 return colorMap[status] || 'default';
};

/**
* Ottiene l'icona per lo stato
*/
export const getStatusIcon = (status: string): string => {
 const iconMap: Record<string, string> = {
   'DA_EVADERE': '📋',
   'PROGRAMMATO': '📅',
   'IN_EVASIONE': '🚚',
   'IN_CARICO': '👷',
   'CARICATO': '📦',
   'SPEDITO': '🚛',
   'COMPLETO': '✅',
   'CANCELLED': '❌'
 };
 return iconMap[status] || '📄';
};