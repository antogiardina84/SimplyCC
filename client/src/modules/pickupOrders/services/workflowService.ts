// client/src/modules/pickupOrders/services/workflowService.ts - VERSIONE COMPLETA CORRETTA

import api from '../../../core/services/api';

export interface WorkflowStats {
  statusDistribution: Record<string, number>;
  totalOrders: number;
  averageTimesPerStatus: Record<string, number>;
}

export interface AvailableOperator {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface OrderActivity {
  id: string;
  activityType: string;
  description?: string;
  timestamp: string;
  packageCount?: number;
  notes?: string;
  photos?: string;
  videos?: string;
  operator: {
    firstName: string;
    lastName: string;
  };
}

export interface OrderHistory {
  statusHistory: Array<{
    id: string;
    fromStatus?: string;
    toStatus: string;
    changedAt: string;
    changedBy?: string;
    reason?: string;
    notes?: string;
  }>;
  operatorActivities: OrderActivity[];
}

export interface MyOrder {
  id: string;
  orderNumber: string;
  status: string;
  scheduledDate?: string;
  loadingDate?: string;
  expectedQuantity?: number;
  loadedPackages?: number;
  basin: {
    code: string;
    description: string;
    client: {
      name: string;
    };
  };
  logisticSender?: {
    name: string;
    city?: string;
  };
  logisticRecipient?: {
    name: string;
    city?: string;
  };
  shipment?: {
    timeSlot?: string;
    priority: string;
  };
  activities: OrderActivity[];
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

// === API CALLS ===

/**
 * Ottiene statistiche del workflow
 */
export const getWorkflowStats = async (dateFrom?: string, dateTo?: string): Promise<WorkflowStats> => {
  const params: any = {};
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo) params.dateTo = dateTo;
  
  const response = await api.get('/pickup-orders/workflow/stats', { params });
  return response.data.data;
};

/**
 * Ottiene operatori disponibili
 */
export const getAvailableOperators = async (): Promise<AvailableOperator[]> => {
  const response = await api.get('/pickup-orders/workflow/operators/available');
  return response.data.data;
};

/**
 * Ottiene ordini programmati per oggi
 */
export const getTodayScheduled = async (): Promise<any[]> => {
  const response = await api.get('/pickup-orders/workflow/today');
  return response.data.data;
};

/**
 * Ottiene i miei ordini (per operatori)
 */
export const getMyOrders = async (): Promise<MyOrder[]> => {
  const response = await api.get('/pickup-orders/workflow/my-orders');
  return response.data.data;
};

/**
 * Ottiene storico di un buono di ritiro
 */
export const getPickupOrderHistory = async (pickupOrderId: string): Promise<OrderHistory> => {
  const response = await api.get(`/pickup-orders/${pickupOrderId}/workflow/history`);
  return response.data.data;
};

// === TRANSIZIONI DI STATO ===

/**
 * CORREZIONE: Cambia lo stato generico di un buono di ritiro
 */
export const changePickupOrderStatus = async (
  pickupOrderId: string,
  data: {
    newStatus: string;
    reason?: string;
    notes?: string;
    additionalData?: any;
  }
): Promise<any> => {
  // CORREZIONE: URL corretto per il workflow
  const response = await api.post(`/pickup-orders/${pickupOrderId}/workflow/change-status`, data);
  return response.data.data;
};

/**
 * Programma un buono di ritiro (DA_EVADERE → PROGRAMMATO)
 */
export const schedulePickupOrder = async (
  pickupOrderId: string,
  data: {
    scheduledDate: string;
    notes?: string;
  }
): Promise<any> => {
  const response = await api.post(`/pickup-orders/${pickupOrderId}/workflow/schedule`, data);
  return response.data.data;
};

/**
 * CORREZIONE: Avvia evasione (PROGRAMMATO → IN_EVASIONE)
 */
export const startEvading = async (
  pickupOrderId: string,
  notes?: string
): Promise<any> => {
  // CORREZIONE: URL corretto per il workflow
  const response = await api.post(`/pickup-orders/${pickupOrderId}/workflow/start-evading`, {
    notes
  });
  return response.data.data;
};

/**
 * CORREZIONE: Assegna operatore (IN_EVASIONE → IN_CARICO)
 */
export const assignOperator = async (
  pickupOrderId: string,
  data: {
    operatorId?: string;
    notes?: string;
  }
): Promise<any> => {
  // CORREZIONE: URL corretto per il workflow
  const response = await api.post(`/pickup-orders/${pickupOrderId}/workflow/assign-operator`, data);
  return response.data.data;
};

/**
 * CORREZIONE: Completa carico (IN_CARICO → CARICATO)
 */
export const completeLoading = async (
  pickupOrderId: string,
  data: {
    packageCount?: number;
    notes?: string;
  }
): Promise<any> => {
  // CORREZIONE: URL corretto per il workflow
  const response = await api.post(`/pickup-orders/${pickupOrderId}/workflow/complete-loading`, data);
  return response.data.data;
};

/**
 * Finalizza spedizione (CARICATO → SPEDITO)
 */
export const finalizeShipment = async (
  pickupOrderId: string,
  data: {
    departureWeight: number;
    notes?: string;
  }
): Promise<any> => {
  const response = await api.post(`/pickup-orders/${pickupOrderId}/workflow/finalize-shipment`, data);
  return response.data.data;
};

/**
 * Completa ordine (SPEDITO → COMPLETO)
 */
export const completeOrder = async (
  pickupOrderId: string,
  data: {
    arrivalWeight?: number;
    isRejected: boolean;
    rejectionReason?: string;
    notes?: string;
  }
): Promise<any> => {
  const response = await api.post(`/pickup-orders/${pickupOrderId}/workflow/complete-order`, data);
  return response.data.data;
};

// === NUOVE FUNZIONI PER ROLLBACK ===

/**
 * Rollback a PROGRAMMATO (da IN_EVASIONE)
 */
export const rollbackToProgrammed = async (
  pickupOrderId: string,
  data: {
    reason?: string;
    notes?: string;
  }
): Promise<any> => {
  const response = await api.post(`/pickup-orders/${pickupOrderId}/workflow/rollback-to-programmed`, data);
  return response.data.data;
};

/**
 * Rollback a IN_EVASIONE (da IN_CARICO)
 */
export const rollbackToEvading = async (
  pickupOrderId: string,
  data: {
    reason?: string;
    notes?: string;
  }
): Promise<any> => {
  const response = await api.post(`/pickup-orders/${pickupOrderId}/workflow/rollback-to-evading`, data);
  return response.data.data;
};

/**
 * Rollback a IN_CARICO (da CARICATO)
 */
export const rollbackToLoading = async (
  pickupOrderId: string,
  data: {
    reason?: string;
    notes?: string;
  }
): Promise<any> => {
  const response = await api.post(`/pickup-orders/${pickupOrderId}/workflow/rollback-to-loading`, data);
  return response.data.data;
};

/**
 * Rollback a CARICATO (da SPEDITO)
 */
export const rollbackToLoaded = async (
  pickupOrderId: string,
  data: {
    reason?: string;
    notes?: string;
  }
): Promise<any> => {
  const response = await api.post(`/pickup-orders/${pickupOrderId}/workflow/rollback-to-loaded`, data);
  return response.data.data;
};

/**
 * Registra attività operatore
 */
export const recordOperatorActivity = async (
  pickupOrderId: string,
  data: {
    activityType: string;
    description?: string;
    photos?: string[];
    videos?: string[];
    packageCount?: number;
    notes?: string;
  }
): Promise<OrderActivity> => {
  const response = await api.post(`/pickup-orders/${pickupOrderId}/workflow/activity`, data);
  return response.data.data;
};

// === UTILITIES ===

/**
 * CORREZIONE: Ottiene le transizioni disponibili per uno stato con supporto per rollback
 */
export const getAvailableTransitions = (status: string, userRole: string): WorkflowTransition[] => {
  const transitions: WorkflowTransition[] = [
    // === TRANSIZIONI IN AVANTI ===
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

    // === TRANSIZIONI DI ROLLBACK ===
    {
      fromStatus: 'PROGRAMMATO',
      toStatus: 'DA_EVADERE',
      label: '🔄 Torna a Da Evadere',
      description: 'Rimuovi la programmazione',
      requiredRole: ['MANAGER', 'ADMIN'],
      warningMessage: 'La data di programmazione verrà rimossa',
    },
    {
      fromStatus: 'IN_EVASIONE',
      toStatus: 'PROGRAMMATO',
      label: '🔄 Torna a Programmato',
      description: 'Riporta l\'ordine allo stato programmato',
      requiredRole: ['MANAGER', 'ADMIN'],
      warningMessage: 'Questa azione annullerà le operazioni in corso',
    },
    {
      fromStatus: 'IN_CARICO',
      toStatus: 'IN_EVASIONE',
      label: '🔄 Torna a In Evasione',
      description: 'Rimuovi l\'assegnazione operatore',
      requiredRole: ['MANAGER', 'ADMIN'],
      warningMessage: 'L\'operatore verrà rimosso dall\'ordine',
    },
    {
      fromStatus: 'CARICATO',
      toStatus: 'IN_CARICO',
      label: '🔄 Torna a In Carico',
      description: 'Annulla il completamento del carico',
      requiredRole: ['MANAGER', 'ADMIN'],
      warningMessage: 'I dati del carico verranno resettati',
    },
    {
      fromStatus: 'SPEDITO',
      toStatus: 'CARICATO',
      label: '🔄 Torna a Caricato',
      description: 'Annulla la spedizione',
      requiredRole: ['MANAGER', 'ADMIN'],
      warningMessage: 'I dati di spedizione verranno resettati',
    },

    // === CANCELLAZIONI (sempre disponibili tranne per stati finali) ===
    {
      fromStatus: 'DA_EVADERE',
      toStatus: 'CANCELLED',
      label: '❌ Cancella',
      description: 'Cancella definitivamente l\'ordine',
      requiredRole: ['MANAGER', 'ADMIN'],
      confirmationRequired: true,
      warningMessage: 'Questa azione è irreversibile',
    },
    {
      fromStatus: 'PROGRAMMATO',
      toStatus: 'CANCELLED',
      label: '❌ Cancella',
      description: 'Cancella definitivamente l\'ordine',
      requiredRole: ['MANAGER', 'ADMIN'],
      confirmationRequired: true,
      warningMessage: 'Questa azione è irreversibile',
    },
    {
      fromStatus: 'IN_EVASIONE',
      toStatus: 'CANCELLED',
      label: '❌ Cancella',
      description: 'Cancella definitivamente l\'ordine',
      requiredRole: ['MANAGER', 'ADMIN'],
      confirmationRequired: true,
      warningMessage: 'Questa azione è irreversibile',
    },
    {
      fromStatus: 'IN_CARICO',
      toStatus: 'CANCELLED',
      label: '❌ Cancella',
      description: 'Cancella definitivamente l\'ordine',
      requiredRole: ['MANAGER', 'ADMIN'],
      confirmationRequired: true,
      warningMessage: 'Questa azione è irreversibile',
    },
    {
      fromStatus: 'CARICATO',
      toStatus: 'CANCELLED',
      label: '❌ Cancella',
      description: 'Cancella definitivamente l\'ordine',
      requiredRole: ['MANAGER', 'ADMIN'],
      confirmationRequired: true,
      warningMessage: 'Questa azione è irreversibile',
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

/**
 * Verifica se una transizione è un rollback
 */
export const isRollbackTransition = (fromStatus: string, toStatus: string): boolean => {
  const statusOrder = ['DA_EVADERE', 'PROGRAMMATO', 'IN_EVASIONE', 'IN_CARICO', 'CARICATO', 'SPEDITO', 'COMPLETO'];
  const fromIndex = statusOrder.indexOf(fromStatus);
  const toIndex = statusOrder.indexOf(toStatus);
  
  return fromIndex > toIndex && fromIndex !== -1 && toIndex !== -1;
};

/**
 * Ottiene il messaggio di conferma per una transizione
 */
export const getTransitionConfirmationMessage = (transition: WorkflowTransition): string => {
  if (transition.confirmationRequired) {
    return `Sei sicuro di voler ${transition.label.toLowerCase()}? ${transition.warningMessage || ''}`;
  }
  
  if (transition.warningMessage) {
    return `${transition.description}. ${transition.warningMessage}`;
  }
  
  return `Confermi di voler ${transition.label.toLowerCase()}?`;
};

/**
 * Esegue una transizione di stato
 */
export const executeTransition = async (
  pickupOrderId: string,
  transition: WorkflowTransition,
  additionalData?: any
): Promise<any> => {
  const data = {
    newStatus: transition.toStatus,
    reason: `${transition.label}: ${transition.description}`,
    notes: additionalData?.notes,
    additionalData: additionalData
  };

  // Usa la funzione specifica per il tipo di transizione se disponibile
  switch (transition.toStatus) {
    case 'PROGRAMMATO':
      if (transition.fromStatus === 'DA_EVADERE') {
        return await schedulePickupOrder(pickupOrderId, {
          scheduledDate: additionalData?.scheduledDate,
          notes: additionalData?.notes
        });
      } else {
        return await rollbackToProgrammed(pickupOrderId, {
          reason: data.reason,
          notes: additionalData?.notes
        });
      }
      
    case 'IN_EVASIONE':
      if (transition.fromStatus === 'PROGRAMMATO') {
        return await startEvading(pickupOrderId, additionalData?.notes);
      } else {
        return await rollbackToEvading(pickupOrderId, {
          reason: data.reason,
          notes: additionalData?.notes
        });
      }
      
    case 'IN_CARICO':
      if (transition.fromStatus === 'IN_EVASIONE') {
        return await assignOperator(pickupOrderId, {
          operatorId: additionalData?.operatorId,
          notes: additionalData?.notes
        });
      } else {
        return await rollbackToLoading(pickupOrderId, {
          reason: data.reason,
          notes: additionalData?.notes
        });
      }
      
    case 'CARICATO':
      if (transition.fromStatus === 'IN_CARICO') {
        return await completeLoading(pickupOrderId, {
          packageCount: additionalData?.packageCount,
          notes: additionalData?.notes
        });
      } else {
        return await rollbackToLoaded(pickupOrderId, {
          reason: data.reason,
          notes: additionalData?.notes
        });
      }
      
    case 'SPEDITO':
      return await finalizeShipment(pickupOrderId, {
        departureWeight: additionalData?.departureWeight,
        notes: additionalData?.notes
      });
      
    case 'COMPLETO':
      return await completeOrder(pickupOrderId, {
        arrivalWeight: additionalData?.arrivalWeight,
        isRejected: additionalData?.isRejected || false,
        rejectionReason: additionalData?.rejectionReason,
        notes: additionalData?.notes
      });
      
    default:
      // Usa la funzione generica per altri casi
      return await changePickupOrderStatus(pickupOrderId, data);
  }
};