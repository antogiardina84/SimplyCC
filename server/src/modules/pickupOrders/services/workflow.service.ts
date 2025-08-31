// server/src/modules/pickupOrders/services/workflow.service.ts - VERSIONE CON DEBUG AVANZATO

import { PrismaClient } from '@prisma/client';
import { HttpException } from '../../../core/middleware/error.middleware';

const prisma = new PrismaClient();

export enum PickupOrderStatus {
  DA_EVADERE = 'DA_EVADERE',
  PROGRAMMATO = 'PROGRAMMATO',
  IN_EVASIONE = 'IN_EVASIONE',
  IN_CARICO = 'IN_CARICO',
  CARICATO = 'CARICATO',
  SPEDITO = 'SPEDITO',
  COMPLETO = 'COMPLETO',
  CANCELLED = 'CANCELLED'
}

export interface ChangeStatusRequest {
  pickupOrderId: string;
  newStatus: PickupOrderStatus;
  userId: string;
  userRole: string;
  reason?: string;
  notes?: string;
  additionalData?: Record<string, unknown>;
}

export interface OperatorActivityData {
  activityType: string;
  description?: string;
  photos?: string[];
  videos?: string[];
  packageCount?: number;
  notes?: string;
}

// Transizioni reversibili complete
const validateStatusTransition = (currentStatus: string, newStatus: PickupOrderStatus): boolean => {
  console.log(`🔍 Validazione transizione: ${currentStatus} → ${newStatus}`);
  
  const allowedTransitions: Record<string, PickupOrderStatus[]> = {
    [PickupOrderStatus.DA_EVADERE]: [
      PickupOrderStatus.PROGRAMMATO, 
      PickupOrderStatus.CANCELLED
    ],
    [PickupOrderStatus.PROGRAMMATO]: [
      PickupOrderStatus.IN_EVASIONE, 
      PickupOrderStatus.DA_EVADERE,  // ← REVERSIBILE
      PickupOrderStatus.IN_CARICO,
      PickupOrderStatus.CANCELLED
    ],
    [PickupOrderStatus.IN_EVASIONE]: [
      PickupOrderStatus.IN_CARICO, 
      PickupOrderStatus.PROGRAMMATO, // ← REVERSIBILE
      PickupOrderStatus.CANCELLED
    ],
    [PickupOrderStatus.IN_CARICO]: [
      PickupOrderStatus.CARICATO, 
      PickupOrderStatus.IN_EVASIONE, // ← REVERSIBILE
      PickupOrderStatus.CANCELLED
    ],
    [PickupOrderStatus.CARICATO]: [
      PickupOrderStatus.SPEDITO, 
      PickupOrderStatus.IN_CARICO,   // ← REVERSIBILE
      PickupOrderStatus.CANCELLED
    ],
    [PickupOrderStatus.SPEDITO]: [
      PickupOrderStatus.COMPLETO, 
      PickupOrderStatus.CARICATO     // ← REVERSIBILE
    ],
    [PickupOrderStatus.COMPLETO]: [
      // Stato finale - nessuna transizione permessa
    ],
    [PickupOrderStatus.CANCELLED]: [
      // Stato finale - nessuna transizione permessa
    ]
  };

  const allowedForCurrent = allowedTransitions[currentStatus] || [];
  const isValid = allowedForCurrent.includes(newStatus);
  
  console.log(`📋 Transizioni permesse per ${currentStatus}:`, allowedForCurrent);
  console.log(`✅ Transizione ${currentStatus} → ${newStatus} è ${isValid ? 'VALIDA' : 'NON VALIDA'}`);
  
  return isValid;
};

export const checkPermission = (userRole: string, operation: string): boolean => {
  const permissions: Record<string, string[]> = {
    'ADMIN': ['*'],
    'MANAGER': ['schedule', 'start_evading', 'assign_operator', 'finalize_shipment', 'complete_order', 'rollback'],
    'OPERATOR': ['assign_operator', 'complete_loading', 'record_activity'],
    'USER': ['view']
  };

  const userPermissions = permissions[userRole] || [];
  return userPermissions.includes('*') || userPermissions.includes(operation);
};

/**
 * CORREZIONE: Cambia lo stato con debug avanzato e gestione errori robusta
 */
export const changePickupOrderStatus = async (request: ChangeStatusRequest): Promise<Record<string, unknown>> => {
  const { pickupOrderId, newStatus, userId, reason, notes, additionalData } = request;

  console.log(`🔄 === INIZIO CAMBIO STATO ===`);
  console.log(`📋 Ordine: ${pickupOrderId}`);
  console.log(`👤 Utente: ${userId}`);
  console.log(`🎯 Nuovo stato: ${newStatus}`);
  console.log(`💾 Dati aggiuntivi:`, additionalData);

  try {
    // Trova il buono di ritiro
    console.log(`🔍 Ricerca buono di ritiro...`);
    const pickupOrder = await prisma.pickupOrder.findUnique({
      where: { id: pickupOrderId },
      include: {
        assignedOperator: true,
        basin: true,
        logisticSender: true,
        logisticRecipient: true
      }
    });

    if (!pickupOrder) {
      console.error(`❌ Buono di ritiro non trovato: ${pickupOrderId}`);
      throw new HttpException(404, 'Buono di ritiro non trovato');
    }

    console.log(`📋 Buono trovato - Stato attuale: ${pickupOrder.status}`);

    // Valida la transizione di stato
    if (!validateStatusTransition(pickupOrder.status, newStatus)) {
      console.error(`❌ Transizione non valida: ${pickupOrder.status} → ${newStatus}`);
      throw new HttpException(400, `Transizione non valida da ${pickupOrder.status} a ${newStatus}`);
    }

    // Prepara i dati di aggiornamento
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updatedAt: new Date()
    };

    console.log(`🔧 Preparazione dati aggiornamento per stato: ${newStatus}`);

    // Gestione dati specifici per stato e rollback
    if (additionalData) {
      console.log(`💾 Processamento dati aggiuntivi...`);
      
      switch (newStatus) {
        case PickupOrderStatus.PROGRAMMATO: {
          const scheduledDate = additionalData.scheduledDate as Date;
          const loadingDate = additionalData.loadingDate as Date;
          if (scheduledDate) updateData.scheduledDate = scheduledDate;
          if (loadingDate) updateData.loadingDate = loadingDate;
          
          // ROLLBACK: Reset campi successivi se torniamo indietro
          if (pickupOrder.status !== 'DA_EVADERE') {
            updateData.assignedOperatorId = null;
            updateData.loadedPackages = null;
            updateData.departureWeight = null;
            updateData.arrivalWeight = null;
            updateData.unloadingDate = null;
            updateData.completionDate = null;
          }
          break;
        }

        case PickupOrderStatus.IN_EVASIONE: {
          // ROLLBACK: Reset operatore e dati successivi se torniamo indietro
          if (pickupOrder.status !== 'PROGRAMMATO') {
            updateData.assignedOperatorId = null;
            updateData.loadedPackages = null;
            updateData.departureWeight = null;
            updateData.arrivalWeight = null;
            updateData.unloadingDate = null;
            updateData.completionDate = null;
          }
          break;
        }

        case PickupOrderStatus.IN_CARICO: {
          const operatorData = additionalData.operatorId as string;
          console.log(`👤 Operatore da assegnare:`, operatorData);
          
          if (operatorData) {
            updateData.assignedOperatorId = operatorData;
            console.log(`✅ Operatore assegnato: ${operatorData}`);
          } else if (additionalData.operatorId === null) {
            // ROLLBACK: Rimuovi operatore
            updateData.assignedOperatorId = null;
            console.log(`🔄 Operatore rimosso (rollback)`);
          }
          
          // ROLLBACK: Reset dati successivi se torniamo indietro
          if (pickupOrder.status !== 'IN_EVASIONE') {
            updateData.loadedPackages = null;
            updateData.departureWeight = null;
            updateData.arrivalWeight = null;
            updateData.unloadingDate = null;
            updateData.completionDate = null;
          }
          break;
        }

        case PickupOrderStatus.CARICATO: {
          const packagesData = additionalData.packageCount as number;
          if (packagesData !== undefined) {
            updateData.loadedPackages = packagesData;
            console.log(`📦 Colli caricati: ${packagesData}`);
          } else if (additionalData.packageCount === null) {
            // ROLLBACK: Reset numero colli
            updateData.loadedPackages = null;
            console.log(`🔄 Colli resettati (rollback)`);
          }
          
          // ROLLBACK: Reset dati successivi se torniamo indietro
          if (pickupOrder.status !== 'IN_CARICO') {
            updateData.departureWeight = null;
            updateData.arrivalWeight = null;
            updateData.unloadingDate = null;
            updateData.completionDate = null;
          }
          break;
        }

        case PickupOrderStatus.SPEDITO: {
          const weightData = additionalData.departureWeight as number;
          if (weightData) {
            updateData.departureWeight = weightData;
            updateData.unloadingDate = new Date();
          } else if (additionalData.departureWeight === null) {
            // ROLLBACK: Reset peso e data
            updateData.departureWeight = null;
            updateData.unloadingDate = null;
          }
          
          // ROLLBACK: Reset dati successivi se torniamo indietro
          if (pickupOrder.status !== 'CARICATO') {
            updateData.arrivalWeight = null;
            updateData.completionDate = null;
            updateData.isRejected = false;
            updateData.rejectionReason = null;
            updateData.rejectionDate = null;
          }
          break;
        }

        case PickupOrderStatus.COMPLETO: {
          const arrivalWeightData = additionalData.arrivalWeight as number;
          const isRejectedData = additionalData.isRejected as boolean;
          const rejectionReasonData = additionalData.rejectionReason as string;

          if (arrivalWeightData !== undefined) {
            updateData.arrivalWeight = arrivalWeightData;
          }
          updateData.isRejected = isRejectedData || false;
          if (rejectionReasonData) {
            updateData.rejectionReason = rejectionReasonData;
            updateData.rejectionDate = new Date();
          }
          updateData.completionDate = new Date();
          break;
        }

        case PickupOrderStatus.CANCELLED: {
          updateData.isRejected = true;
          updateData.rejectionReason = reason || 'Ordine cancellato';
          updateData.rejectionDate = new Date();
          break;
        }
      }
    }

    console.log('📝 Dati aggiornamento finali:', updateData);

    // Aggiorna il buono di ritiro
    console.log(`💾 Aggiornamento buono di ritiro...`);
    const updatedOrder = await prisma.pickupOrder.update({
      where: { id: pickupOrderId },
      data: updateData,
      include: {
        assignedOperator: true,
        basin: true,
        logisticSender: true,
        logisticRecipient: true
      }
    });

    console.log(`✅ Buono di ritiro aggiornato con successo`);

    // Registra il cambio di stato nello storico (con try-catch separato)
    try {
      console.log(`📚 Tentativo registrazione storico...`);
      await prisma.pickupOrderStatusHistory.create({
        data: {
          pickupOrderId,
          fromStatus: pickupOrder.status,
          toStatus: newStatus,
          changedAt: new Date(),
          changedBy: userId,
          reason: reason || `Cambio stato da ${pickupOrder.status} a ${newStatus}`,
          notes
        }
      });
      console.log(`✅ Storico registrato con successo`);
    } catch (historyError) {
      console.warn('⚠️ StatusHistory table not found or error, skipping history record:', historyError);
    }

    console.log(`✅ === CAMBIO STATO COMPLETATO ===`);
    console.log(`📋 Stato finale: ${pickupOrder.status} → ${newStatus}`);

    return updatedOrder;

  } catch (error) {
    console.error(`❌ === ERRORE DURANTE CAMBIO STATO ===`);
    console.error(`📋 Ordine: ${pickupOrderId}`);
    console.error(`🎯 Stato desiderato: ${newStatus}`);
    console.error(`❌ Errore:`, error);
    
    if (error instanceof HttpException) {
      throw error;
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto durante il cambio stato';
    throw new HttpException(500, `Errore interno durante il cambio stato: ${errorMessage}`);
  }
};

/**
 * Registra attività operatore - CON GESTIONE ERRORI ROBUSTA
 */
export const recordOperatorActivity = async (
  pickupOrderId: string,
  operatorId: string,
  activityData: OperatorActivityData
): Promise<Record<string, unknown>> => {
  try {
    console.log(`🎬 === REGISTRAZIONE ATTIVITÀ OPERATORE ===`);
    console.log(`📋 Ordine: ${pickupOrderId}`);
    console.log(`👤 Operatore: ${operatorId}`);
    console.log(`🎯 Tipo attività: ${activityData.activityType}`);

    const pickupOrder = await prisma.pickupOrder.findUnique({
      where: { id: pickupOrderId }
    });

    if (!pickupOrder) {
      throw new HttpException(404, 'Buono di ritiro non trovato');
    }

    // Crea l'attività
    const activity = await prisma.operatorActivity.create({
      data: {
        pickupOrderId,
        operatorId,
        activityType: activityData.activityType,
        description: activityData.description,
        timestamp: new Date(),
        packageCount: activityData.packageCount,
        notes: activityData.notes,
        photos: activityData.photos ? JSON.stringify(activityData.photos) : undefined,
        videos: activityData.videos ? JSON.stringify(activityData.videos) : undefined
      },
      include: {
        operator: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    console.log(`✅ Attività registrata con successo`);
    return activity;
    
  } catch (error) {
    console.error(`❌ Errore durante registrazione attività:`, error);
    throw error;
  }
};

/**
 * Ottiene operatori disponibili
 */
export const getAvailableOperators = async (): Promise<Record<string, unknown>[]> => {
  try {
    const operators = await prisma.user.findMany({
      where: {
        role: { in: ['OPERATOR', 'MANAGER'] },
        active: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });

    return operators;
  } catch (error) {
    console.error(`❌ Errore nel recupero operatori:`, error);
    throw new HttpException(500, 'Errore nel recupero operatori disponibili');
  }
};

/**
 * Ottiene storico completo di un buono di ritiro
 */
export const getPickupOrderHistory = async (pickupOrderId: string): Promise<Record<string, unknown>> => {
  let statusHistory: Record<string, unknown>[] = [];
  try {
    statusHistory = await prisma.pickupOrderStatusHistory.findMany({
      where: { pickupOrderId },
      orderBy: { changedAt: 'desc' }
    });
  } catch (error) {
    console.warn('⚠️ PickupOrderStatusHistory table not found, returning empty history');
  }

  let operatorActivities: Record<string, unknown>[] = [];
  try {
    operatorActivities = await prisma.operatorActivity.findMany({
      where: { pickupOrderId },
      include: {
        operator: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { timestamp: 'desc' }
    });
  } catch (error) {
    console.warn('⚠️ OperatorActivity table not found, returning empty activities');
  }

  return {
    statusHistory,
    operatorActivities
  };
};

/**
 * Ottiene statistiche del workflow
 */
export const getWorkflowStats = async (
  dateFrom?: Date,
  dateTo?: Date
): Promise<Record<string, unknown>> => {
  const whereClause: Record<string, unknown> = {};

  if (dateFrom || dateTo) {
    whereClause.createdAt = {};
    if (dateFrom) (whereClause.createdAt as Record<string, unknown>).gte = dateFrom;
    if (dateTo) (whereClause.createdAt as Record<string, unknown>).lte = dateTo;
  }

  const statusDistribution = await prisma.pickupOrder.groupBy({
    by: ['status'],
    where: whereClause,
    _count: {
      id: true
    }
  });

  const totalOrders = await prisma.pickupOrder.count({
    where: whereClause
  });

  const averageTimesPerStatus: Record<string, number> = {};

  return {
    statusDistribution: statusDistribution.reduce((acc: Record<string, number>, item: Record<string, unknown>) => {
      acc[item.status as string] = (item._count as Record<string, number>).id;
      return acc;
    }, {}),
    totalOrders,
    averageTimesPerStatus
  };
};
