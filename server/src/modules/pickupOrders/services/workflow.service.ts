// server/src/modules/pickupOrders/services/workflow.service.ts - VERSIONE FINALE E FUNZIONALE

import { PrismaClient } from '@prisma/client';
import { HttpException } from '../../../core/middleware/error.middleware';
import { Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Enum per gli stati dei pickup order
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

// Interface per la richiesta di cambio stato
export interface ChangeStatusParams {
  pickupOrderId: string;
  newStatus: PickupOrderStatus;
  userId: string;
  userRole: string;
  reason?: string;
  notes?: string;
  additionalData?: Record<string, unknown>;
}

// Interface per i dati di attività dell'operatore
export interface OperatorActivityData {
  activityType: string;
  description?: string;
  photos?: string[];
  videos?: string[];
  packageCount?: number;
  notes?: string;
}

/**
 * Validates the status transition for a pickup order.
 * @param currentStatus The current status of the order.
 * @param newStatus The new status to transition to.
 * @returns An object indicating if the transition is valid and a message.
 */
const validateStatusTransition = (currentStatus: string, newStatus: PickupOrderStatus): { valid: boolean, message: string } => {
  console.log(`🔍 Validazione transizione: ${currentStatus} → ${newStatus}`);

  const allowedTransitions: Record<string, PickupOrderStatus[]> = {
    [PickupOrderStatus.DA_EVADERE]: [
      PickupOrderStatus.PROGRAMMATO,
      PickupOrderStatus.CANCELLED
    ],
    [PickupOrderStatus.PROGRAMMATO]: [
      PickupOrderStatus.IN_EVASIONE,
      PickupOrderStatus.DA_EVADERE,
      PickupOrderStatus.IN_CARICO,
      PickupOrderStatus.CANCELLED
    ],
    [PickupOrderStatus.IN_EVASIONE]: [
      PickupOrderStatus.IN_CARICO,
      PickupOrderStatus.PROGRAMMATO,
      PickupOrderStatus.CANCELLED
    ],
    [PickupOrderStatus.IN_CARICO]: [
      PickupOrderStatus.CARICATO,
      PickupOrderStatus.IN_EVASIONE,
      PickupOrderStatus.CANCELLED
    ],
    [PickupOrderStatus.CARICATO]: [
      PickupOrderStatus.SPEDITO,
      PickupOrderStatus.IN_CARICO,
      PickupOrderStatus.CANCELLED
    ],
    [PickupOrderStatus.SPEDITO]: [
      PickupOrderStatus.COMPLETO,
      PickupOrderStatus.CARICATO
    ],
    [PickupOrderStatus.COMPLETO]: [],
    [PickupOrderStatus.CANCELLED]: []
  };

  const allowedForCurrent = allowedTransitions[currentStatus] || [];
  const isValid = allowedForCurrent.includes(newStatus);
  
  console.log(`📋 Transizioni permesse per ${currentStatus}:`, allowedForCurrent);
  console.log(`✅ Transizione ${currentStatus} → ${newStatus} è ${isValid ? 'VALIDA' : 'NON VALIDA'}`);
  
  if (!isValid) {
    return { valid: false, message: `Transizione di stato da ${currentStatus} a ${newStatus} non valida.` };
  }
  
  return { valid: true, message: 'Transizione valida.' };
};

/**
 * Maps a status to an operator activity type.
 * @param status The PickupOrderStatus.
 * @returns The corresponding activity type string.
 */
const getActivityTypeForStatus = (status: PickupOrderStatus): string => {
  switch (status) {
    case PickupOrderStatus.PROGRAMMATO:
      return 'SCHEDULED';
    case PickupOrderStatus.IN_EVASIONE:
      return 'STARTED_EVADING';
    case PickupOrderStatus.IN_CARICO:
      return 'ASSIGNED_TO_OPERATOR';
    case PickupOrderStatus.CARICATO:
      return 'LOADING_COMPLETED';
    case PickupOrderStatus.SPEDITO:
      return 'SHIPPED';
    case PickupOrderStatus.COMPLETO:
      return 'COMPLETED';
    case PickupOrderStatus.CANCELLED:
      return 'CANCELLED';
    default:
      return 'STATUS_CHANGE';
  }
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
 * Changes the status of a pickup order with advanced debugging and robust error handling.
 */
export const changePickupOrderStatus = async (params: ChangeStatusParams): Promise<Prisma.PickupOrderGetPayload<{
    include: {
        basin: {
            include: {
                client: true;
            };
        };
        assignedOperator: true;
    };
}>> => {
  const {
    pickupOrderId,
    newStatus,
    userId,
    reason,
    notes,
    additionalData
  } = params;

  // Usa l'optional chaining con il nullish coalescing per un accesso sicuro
  const photosArray = (additionalData?.loadingPhotos as string[] | undefined) ?? [];
  const photoCount = photosArray.length;

  console.log(`🔄 Cambio stato pickup order ${pickupOrderId}:`, {
    newStatus,
    reason,
    hasPhotos: photoCount > 0,
    photoCount
  });

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get the current pickup order
      const currentOrder = await tx.pickupOrder.findUnique({
        where: { id: pickupOrderId },
        include: {
          basin: { include: { client: true } },
          assignedOperator: true
        }
      });

      if (!currentOrder) {
        throw new HttpException(404, 'Pickup order non trovato');
      }

      // Validate the status transition
      const isValidTransition = validateStatusTransition(currentOrder.status, newStatus);
      if (!isValidTransition.valid) {
        throw new HttpException(400, isValidTransition.message);
      }

      // Prepare update data
      const updateData: Prisma.PickupOrderUpdateInput = {
        status: newStatus,
      };

      // Specific handling for CARICATO status
      if (newStatus === PickupOrderStatus.CARICATO && additionalData) {
        if (additionalData.packageCount !== undefined) {
          updateData.loadedPackages = additionalData.packageCount as number;
        }
        if (additionalData.loadingPhotos) {
          updateData.loadingPhotos = photosArray.join(',');
        }
        updateData.loadingDate = new Date();
      }

      // Other status handling
      if (newStatus === PickupOrderStatus.PROGRAMMATO && additionalData) {
        if (additionalData.scheduledDate) {
          updateData.scheduledDate = new Date(additionalData.scheduledDate as string);
        }
      }

      if (newStatus === PickupOrderStatus.IN_CARICO && additionalData) {
        if (additionalData.operatorId) {
          updateData.assignedOperator = {
            connect: { id: additionalData.operatorId as string },
          };
          updateData.operatorAssignedAt = new Date();
        }
      }

      // Update the pickup order
      const updatedOrder = await tx.pickupOrder.update({
        where: { id: pickupOrderId },
        data: updateData,
        include: {
          basin: { include: { client: true } },
          assignedOperator: true
        }
      });

      // Log the status change in the history
      await tx.pickupOrderStatusHistory.create({
        data: {
          pickupOrderId,
          fromStatus: currentOrder.status,
          toStatus: newStatus,
          changedBy: userId,
          reason,
          notes,
          changedAt: new Date()
        }
      });
      
      // Record operator activity
      const videosArray = (additionalData?.videos as string[] | undefined) ?? [];
      await tx.operatorActivity.create({
        data: {
          pickupOrderId,
          operatorId: userId,
          activityType: getActivityTypeForStatus(newStatus),
          description: `${reason || 'Status change'}${
            photoCount > 0 ? ` (${photoCount} foto)` : ''
          }`,
          notes,
          packageCount: additionalData?.packageCount as number | undefined,
          photos: photosArray.length > 0 ? photosArray.join(',') : null,
          videos: videosArray.length > 0 ? videosArray.join(',') : null,
        }
      });
      
      console.log(`✅ Stato cambiato con successo: ${currentOrder.status} → ${newStatus}`, {
        orderId: pickupOrderId,
        photoCount: photoCount
      });
      
      return updatedOrder;
    });

    return result;
  } catch (error) {
    console.error(`❌ Errore cambio stato ${pickupOrderId}:`, error);
    throw error;
  }
};

/**
 * Get photos associated with a pickup order.
 */
export const getPickupOrderPhotos = async (pickupOrderId: string): Promise<{
    id: string;
    url: string;
    type: string;
    uploadedAt: Date;
}[]> => {
  try {
    const order = await prisma.pickupOrder.findUnique({
      where: { id: pickupOrderId },
      select: {
        loadingPhotos: true,
      }
    });

    if (!order?.loadingPhotos) {
      return [];
    }

    const photoUrls = (order.loadingPhotos as string).split(',').filter(url => url.trim());

    return photoUrls.map((url, index) => ({
      id: `photo_${index}`,
      url: url.trim(),
      type: 'loading-photo',
      uploadedAt: new Date()
    }));
  } catch (error) {
    console.error('Errore recupero foto pickup order:', error);
    throw error;
  }
};

/**
 * Delete a photo from a pickup order.
 */
export const removePickupOrderPhoto = async (
  pickupOrderId: string,
  photoUrl: string,
  userId: string
): Promise<void> => {
  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.pickupOrder.findUnique({
        where: { id: pickupOrderId }
      });

      if (!order?.loadingPhotos) {
        throw new HttpException(404, 'Nessuna foto trovata per questo ordine');
      }

      const photoUrls = (order.loadingPhotos as string).split(',');
      const filteredUrls = photoUrls.filter(url => url.trim() !== photoUrl.trim());

      await tx.pickupOrder.update({
        where: { id: pickupOrderId },
        data: {
          loadingPhotos: filteredUrls.length > 0 ? filteredUrls.join(',') : null,
        }
      });

      await tx.operatorActivity.create({
        data: {
          pickupOrderId,
          operatorId: userId,
          activityType: 'PHOTO_REMOVED',
          description: 'Foto rimossa dall\'ordine',
        }
      });
    });
  } catch (error) {
    console.error('Errore rimozione foto:', error);
    throw error;
  }
};

/**
 * Record operator activity with robust error handling.
 */
export const recordOperatorActivity = async (
  pickupOrderId: string,
  operatorId: string,
  activityData: OperatorActivityData
): Promise<Prisma.OperatorActivityGetPayload<{
    include: {
        operator: {
            select: {
                firstName: true;
                lastName: true;
            };
        };
    };
}>> => {
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

    const activity = await prisma.operatorActivity.create({
      data: {
        pickupOrderId,
        operatorId,
        activityType: activityData.activityType,
        description: activityData.description,
        timestamp: new Date(),
        packageCount: activityData.packageCount,
        notes: activityData.notes,
        photos: activityData.photos ? activityData.photos.join(',') : null,
        videos: activityData.videos ? activityData.videos.join(',') : null
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
 * Get available operators.
 */
export const getAvailableOperators = async (): Promise<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: string;
}[]> => {
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
 * Get full history of a pickup order.
 */
export const getPickupOrderHistory = async (pickupOrderId: string): Promise<{ statusHistory: unknown[]; operatorActivities: unknown[]; }> => {
  let statusHistory: unknown[] = [];
  try {
    statusHistory = await prisma.pickupOrderStatusHistory.findMany({
      where: { pickupOrderId },
      orderBy: { changedAt: 'desc' }
    });
  } catch (error) {
    console.warn('⚠️ PickupOrderStatusHistory table not found, returning empty history');
  }

  let operatorActivities: unknown[] = [];
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
 * Get workflow statistics.
 */
export const getWorkflowStats = async (
  dateFrom?: Date,
  dateTo?: Date
): Promise<Record<string, unknown>> => {
  const whereClause: Prisma.PickupOrderWhereInput = {};

  if (dateFrom || dateTo) {
    whereClause.createdAt = {};
    if (dateFrom) whereClause.createdAt.gte = dateFrom;
    if (dateTo) whereClause.createdAt.lte = dateTo;
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
    statusDistribution: statusDistribution.reduce((acc: Record<string, number>, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {}),
    totalOrders,
    averageTimesPerStatus
  };
};