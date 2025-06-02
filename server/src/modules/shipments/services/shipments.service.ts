// server/src/modules/shipments/services/shipments.service.ts

import { PrismaClient } from '@prisma/client';
import { HttpException } from '../../../core/middleware/error.middleware';
import { startOfDay, endOfDay } from 'date-fns';

const prisma = new PrismaClient();

export interface CreateShipmentData {
  pickupOrderId: string;
  scheduledDate: Date;
  timeSlot?: string;
  priority?: string;
  estimatedDuration?: number;
  specialInstructions?: string;
  equipmentNeeded?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
}

export interface UpdateShipmentData {
  scheduledDate?: Date;
  timeSlot?: string;
  priority?: string;
  estimatedDuration?: number;
  specialInstructions?: string;
  equipmentNeeded?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
}

export interface ShipmentFilters {
  date?: Date;
  status?: string;
  priority?: string;
}

export interface LoadingData {
  packageCount?: number;
  photos?: string;
  videos?: string;
  notes?: string;
}

export interface ArrivalData {
  arrivalWeight?: number;
  isRejected: boolean;
  rejectionReason?: string;
}

interface WhereClause {
  scheduledDate?: {
    gte: Date;
    lte: Date;
  };
  priority?: string;
  pickupOrder?: {
    status: string;
  };
}

/**
 * Trova tutte le spedizioni con filtri opzionali
 */
export const findAllShipments = async (filters: ShipmentFilters = {}) => {
  const where: WhereClause = {};

  if (filters.date) {
    where.scheduledDate = {
      gte: startOfDay(filters.date),
      lte: endOfDay(filters.date),
    };
  }

  if (filters.priority) {
    where.priority = filters.priority;
  }

  if (filters.status) {
    where.pickupOrder = {
      status: filters.status,
    };
  }

  return prisma.shipment.findMany({
    where,
    include: {
      pickupOrder: {
        include: {
          basin: {
            include: {
              client: true,
            },
          },
          logisticSender: true,
          logisticRecipient: true,
          assignedOperator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: [
      { scheduledDate: 'asc' },
      { priority: 'desc' },
    ],
  });
};

/**
 * Trova spedizioni per una data specifica
 */
export const findShipmentsByDate = async (date: Date) => {
  return prisma.shipment.findMany({
    where: {
      scheduledDate: {
        gte: startOfDay(date),
        lte: endOfDay(date),
      },
    },
    include: {
      pickupOrder: {
        include: {
          basin: {
            include: {
              client: true,
            },
          },
          logisticSender: true,
          logisticRecipient: true,
          assignedOperator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: [
      { timeSlot: 'asc' },
      { priority: 'desc' },
    ],
  });
};

/**
 * Trova spedizioni per un range di date
 */
export const findShipmentsByDateRange = async (startDate: Date, endDate: Date) => {
  return prisma.shipment.findMany({
    where: {
      scheduledDate: {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate),
      },
    },
    include: {
      pickupOrder: {
        include: {
          basin: {
            include: {
              client: true,
            },
          },
          logisticSender: true,
          logisticRecipient: true,
          assignedOperator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: [
      { scheduledDate: 'asc' },
      { timeSlot: 'asc' },
    ],
  });
};

/**
 * Trova una spedizione per ID
 */
export const findShipmentById = async (id: string) => {
  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: {
      pickupOrder: {
        include: {
          basin: {
            include: {
              client: true,
            },
          },
          logisticSender: true,
          logisticRecipient: true,
          logisticTransporter: true,
          assignedOperator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          activities: {
            include: {
              operator: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: {
              timestamp: 'desc',
            },
          },
          statusHistory: {
            orderBy: {
              changedAt: 'desc',
            },
          },
        },
      },
    },
  });

  if (!shipment) {
    throw new HttpException(404, 'Spedizione non trovata');
  }

  return shipment;
};

/**
 * Programma una nuova spedizione (DA_EVADERE → PROGRAMMATO)
 */
export const scheduleShipment = async (data: CreateShipmentData, userId: string) => {
  try {
    // Verifica che il buono di ritiro esista e sia nello stato corretto
    const pickupOrder = await prisma.pickupOrder.findUnique({
      where: { id: data.pickupOrderId },
    });

    if (!pickupOrder) {
      throw new HttpException(404, 'Buono di ritiro non trovato');
    }

    if (pickupOrder.status !== 'DA_EVADERE') {
      throw new HttpException(400, `Impossibile programmare: stato attuale "${pickupOrder.status}"`);
    }

    // Verifica che non ci sia già una spedizione per questo buono
    const existingShipment = await prisma.shipment.findUnique({
      where: { pickupOrderId: data.pickupOrderId },
    });

    if (existingShipment) {
      throw new HttpException(400, 'Spedizione già programmata per questo buono di ritiro');
    }

    // Transaction per creare la spedizione e aggiornare lo stato
    const result = await prisma.$transaction(async (tx) => {
      // Crea la spedizione
      const shipment = await tx.shipment.create({
        data: {
          pickupOrderId: data.pickupOrderId,
          scheduledDate: data.scheduledDate,
          timeSlot: data.timeSlot,
          priority: data.priority || 'NORMAL',
          estimatedDuration: data.estimatedDuration,
          specialInstructions: data.specialInstructions,
          equipmentNeeded: data.equipmentNeeded,
          pickupLatitude: data.pickupLatitude,
          pickupLongitude: data.pickupLongitude,
          deliveryLatitude: data.deliveryLatitude,
          deliveryLongitude: data.deliveryLongitude,
        },
      });

      // Aggiorna lo stato del buono di ritiro
      await tx.pickupOrder.update({
        where: { id: data.pickupOrderId },
        data: {
          status: 'PROGRAMMATO',
          scheduledDate: data.scheduledDate,
        },
      });

      // Registra il cambio di stato
      await tx.pickupOrderStatusHistory.create({
        data: {
          pickupOrderId: data.pickupOrderId,
          fromStatus: 'DA_EVADERE',
          toStatus: 'PROGRAMMATO',
          changedBy: userId,
          reason: 'Spedizione programmata',
        },
      });

      return shipment;
    });

    // Ricarica con tutte le relazioni
    return findShipmentById(result.id);
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new HttpException(500, 'Errore durante la programmazione della spedizione');
  }
};

/**
 * Aggiorna una spedizione esistente
 */
export const updateShipment = async (id: string, data: UpdateShipmentData, _userId: string) => {
  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: { pickupOrder: true },
  });

  if (!shipment) {
    throw new HttpException(404, 'Spedizione non trovata');
  }

  // Verifica che la spedizione sia modificabile
  if (!['PROGRAMMATO', 'IN_EVASIONE'].includes(shipment.pickupOrder.status)) {
    throw new HttpException(400, 'Impossibile modificare: spedizione già avviata');
  }

  const updatedShipment = await prisma.shipment.update({
    where: { id },
    data,
  });

  // Se cambia la data programmata, aggiorna anche il buono di ritiro
  if (data.scheduledDate && data.scheduledDate !== shipment.scheduledDate) {
    await prisma.pickupOrder.update({
      where: { id: shipment.pickupOrderId },
      data: { scheduledDate: data.scheduledDate },
    });
  }

  return findShipmentById(updatedShipment.id);
};

/**
 * Avvia una spedizione (PROGRAMMATO → IN_EVASIONE)
 */
export const startShipment = async (id: string, userId: string) => {
  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: { pickupOrder: true },
  });

  if (!shipment) {
    throw new HttpException(404, 'Spedizione non trovata');
  }

  if (shipment.pickupOrder.status !== 'PROGRAMMATO') {
    throw new HttpException(400, `Impossibile avviare: stato attuale "${shipment.pickupOrder.status}"`);
  }

  await prisma.$transaction(async (tx) => {
    // Aggiorna lo stato del buono di ritiro
    await tx.pickupOrder.update({
      where: { id: shipment.pickupOrderId },
      data: { status: 'IN_EVASIONE' },
    });

    // Registra il cambio di stato
    await tx.pickupOrderStatusHistory.create({
      data: {
        pickupOrderId: shipment.pickupOrderId,
        fromStatus: 'PROGRAMMATO',
        toStatus: 'IN_EVASIONE',
        changedBy: userId,
        reason: 'Spedizione avviata - Vettore presente',
      },
    });

    // Registra l'attività
    await tx.operatorActivity.create({
      data: {
        pickupOrderId: shipment.pickupOrderId,
        operatorId: userId,
        activityType: 'SHIPMENT_STARTED',
        description: 'Spedizione avviata - Vettore presente per il carico',
      },
    });
  });

  return findShipmentById(id);
};

/**
 * Assegna un operatore (IN_EVASIONE → IN_CARICO)
 */
export const assignOperator = async (shipmentId: string, operatorId: string, assignedBy: string) => {
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { pickupOrder: true },
  });

  if (!shipment) {
    throw new HttpException(404, 'Spedizione non trovata');
  }

  if (shipment.pickupOrder.status !== 'IN_EVASIONE') {
    throw new HttpException(400, `Impossibile assegnare: stato attuale "${shipment.pickupOrder.status}"`);
  }

  // Verifica che l'operatore esista e abbia il ruolo corretto
  const operator = await prisma.user.findUnique({
    where: { id: operatorId },
  });

  if (!operator) {
    throw new HttpException(404, 'Operatore non trovato');
  }

  if (!['OPERATOR', 'MANAGER', 'ADMIN'].includes(operator.role)) {
    throw new HttpException(400, 'Utente non autorizzato come operatore');
  }

  await prisma.$transaction(async (tx) => {
    // Aggiorna il buono di ritiro
    await tx.pickupOrder.update({
      where: { id: shipment.pickupOrderId },
      data: {
        status: 'IN_CARICO',
        assignedOperatorId: operatorId,
        operatorAssignedAt: new Date(),
      },
    });

    // Registra il cambio di stato
    await tx.pickupOrderStatusHistory.create({
      data: {
        pickupOrderId: shipment.pickupOrderId,
        fromStatus: 'IN_EVASIONE',
        toStatus: 'IN_CARICO',
        changedBy: assignedBy,
        reason: `Operatore assegnato: ${operator.firstName} ${operator.lastName}`,
      },
    });

    // Registra l'attività
    await tx.operatorActivity.create({
      data: {
        pickupOrderId: shipment.pickupOrderId,
        operatorId: operatorId,
        activityType: 'ASSIGNED',
        description: `Operatore ${operator.firstName} ${operator.lastName} preso in carico`,
      },
    });
  });

  return findShipmentById(shipmentId);
};

/**
 * Completa il carico (IN_CARICO → CARICATO)
 */
export const completeLoading = async (shipmentId: string, loadingData: LoadingData, operatorId: string) => {
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { pickupOrder: true },
  });

  if (!shipment) {
    throw new HttpException(404, 'Spedizione non trovata');
  }

  if (shipment.pickupOrder.status !== 'IN_CARICO') {
    throw new HttpException(400, `Impossibile completare carico: stato attuale "${shipment.pickupOrder.status}"`);
  }

  // Verifica che l'operatore sia quello assegnato
  if (shipment.pickupOrder.assignedOperatorId !== operatorId) {
    throw new HttpException(403, 'Solo l\'operatore assegnato può completare il carico');
  }

  await prisma.$transaction(async (tx) => {
    // Aggiorna il buono di ritiro
    await tx.pickupOrder.update({
      where: { id: shipment.pickupOrderId },
      data: {
        status: 'CARICATO',
        loadedPackages: loadingData.packageCount,
        loadingPhotos: loadingData.photos,
        loadingVideos: loadingData.videos,
      },
    });

    // Registra il cambio di stato
    await tx.pickupOrderStatusHistory.create({
      data: {
        pickupOrderId: shipment.pickupOrderId,
        fromStatus: 'IN_CARICO',
        toStatus: 'CARICATO',
        changedBy: operatorId,
        reason: 'Carico completato dall\'operatore',
      },
    });

    // Registra l'attività
    await tx.operatorActivity.create({
      data: {
        pickupOrderId: shipment.pickupOrderId,
        operatorId: operatorId,
        activityType: 'LOADING_COMPLETED',
        description: 'Carico completato',
        packageCount: loadingData.packageCount,
        photos: loadingData.photos,
        videos: loadingData.videos,
        notes: loadingData.notes,
      },
    });
  });

  return findShipmentById(shipmentId);
};

/**
 * Finalizza la spedizione (CARICATO → SPEDITO)
 */
export const finalizeShipment = async (shipmentId: string, departureWeight: number, notes: string, managerId: string) => {
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { pickupOrder: true },
  });

  if (!shipment) {
    throw new HttpException(404, 'Spedizione non trovata');
  }

  if (shipment.pickupOrder.status !== 'CARICATO') {
    throw new HttpException(400, `Impossibile finalizzare: stato attuale "${shipment.pickupOrder.status}"`);
  }

  // Verifica che l'utente sia manager o admin
  const user = await prisma.user.findUnique({
    where: { id: managerId },
  });

  if (!user || !['MANAGER', 'ADMIN'].includes(user.role)) {
    throw new HttpException(403, 'Solo i manager possono finalizzare le spedizioni');
  }

  await prisma.$transaction(async (tx) => {
    // Aggiorna il buono di ritiro
    await tx.pickupOrder.update({
      where: { id: shipment.pickupOrderId },
      data: {
        status: 'SPEDITO',
        departureWeight: departureWeight,
        actualQuantity: departureWeight, // Il peso effettivo è quello di partenza
      },
    });

    // Registra il cambio di stato
    await tx.pickupOrderStatusHistory.create({
      data: {
        pickupOrderId: shipment.pickupOrderId,
        fromStatus: 'CARICATO',
        toStatus: 'SPEDITO',
        changedBy: managerId,
        reason: 'Spedizione finalizzata dal manager',
        notes: notes,
      },
    });

    // Registra l'attività
    await tx.operatorActivity.create({
      data: {
        pickupOrderId: shipment.pickupOrderId,
        operatorId: managerId,
        activityType: 'SHIPMENT_FINALIZED',
        description: `Spedizione finalizzata - Peso partenza: ${departureWeight} t`,
        notes: notes,
      },
    });
  });

  return findShipmentById(shipmentId);
};

/**
 * Conferma arrivo (SPEDITO → COMPLETO)
 */
export const confirmArrival = async (shipmentId: string, arrivalData: ArrivalData, userId: string) => {
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { pickupOrder: true },
  });

  if (!shipment) {
    throw new HttpException(404, 'Spedizione non trovata');
  }

  if (shipment.pickupOrder.status !== 'SPEDITO') {
    throw new HttpException(400, `Impossibile confermare arrivo: stato attuale "${shipment.pickupOrder.status}"`);
  }

  await prisma.$transaction(async (tx) => {
    // Aggiorna il buono di ritiro
    await tx.pickupOrder.update({
      where: { id: shipment.pickupOrderId },
      data: {
        status: 'COMPLETO',
        arrivalWeight: arrivalData.arrivalWeight,
        isRejected: arrivalData.isRejected,
        rejectionReason: arrivalData.rejectionReason,
        rejectionDate: arrivalData.isRejected ? new Date() : null,
        completionDate: new Date(),
        destinationQuantity: arrivalData.isRejected ? 0 : arrivalData.arrivalWeight,
      },
    });

    // Registra il cambio di stato
    await tx.pickupOrderStatusHistory.create({
      data: {
        pickupOrderId: shipment.pickupOrderId,
        fromStatus: 'SPEDITO',
        toStatus: 'COMPLETO',
        changedBy: userId,
        reason: arrivalData.isRejected ? 'Carico respinto' : 'Arrivo confermato',
        notes: arrivalData.rejectionReason,
      },
    });

    // Registra l'attività
    await tx.operatorActivity.create({
      data: {
        pickupOrderId: shipment.pickupOrderId,
        operatorId: userId,
        activityType: arrivalData.isRejected ? 'ARRIVAL_REJECTED' : 'ARRIVAL_CONFIRMED',
        description: arrivalData.isRejected 
          ? `Carico respinto: ${arrivalData.rejectionReason}`
          : `Arrivo confermato - Peso: ${arrivalData.arrivalWeight} t`,
        notes: arrivalData.rejectionReason,
      },
    });
  });

  return findShipmentById(shipmentId);
};

/**
 * Cancella una spedizione
 */
export const cancelShipment = async (shipmentId: string, reason: string, userId: string) => {
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { pickupOrder: true },
  });

  if (!shipment) {
    throw new HttpException(404, 'Spedizione non trovata');
  }

  // Solo le spedizioni programmate o in evasione possono essere cancellate
  if (!['PROGRAMMATO', 'IN_EVASIONE'].includes(shipment.pickupOrder.status)) {
    throw new HttpException(400, 'Impossibile cancellare: spedizione già avviata');
  }

  await prisma.$transaction(async (tx) => {
    // Riporta il buono di ritiro a DA_EVADERE
    await tx.pickupOrder.update({
      where: { id: shipment.pickupOrderId },
      data: {
        status: 'DA_EVADERE',
        scheduledDate: null,
        assignedOperatorId: null,
        operatorAssignedAt: null,
      },
    });

    // Elimina la spedizione
    await tx.shipment.delete({
      where: { id: shipmentId },
    });

    // Registra il cambio di stato
    await tx.pickupOrderStatusHistory.create({
      data: {
        pickupOrderId: shipment.pickupOrderId,
        fromStatus: shipment.pickupOrder.status,
        toStatus: 'DA_EVADERE',
        changedBy: userId,
        reason: `Spedizione cancellata: ${reason}`,
      },
    });
  });

  return { message: 'Spedizione cancellata con successo' };
};

/**
 * Ottiene statistiche delle spedizioni
 */
export const getShipmentStats = async (startDate?: Date, endDate?: Date) => {
  const dateFilter = startDate && endDate ? {
    scheduledDate: {
      gte: startOfDay(startDate),
      lte: endOfDay(endDate),
    },
  } : {};

  const [
    totalShipments,
    shipmentsByStatus,
    shipmentsByPriority,
    averageLoadingTime,
    totalWeight
  ] = await Promise.all([
    // Totale spedizioni
    prisma.shipment.count({ where: dateFilter }),
    
    // Spedizioni per stato
    prisma.pickupOrder.groupBy({
      by: ['status'],
      _count: { id: true },
      where: {
        shipment: dateFilter,
      },
    }),
    
    // Spedizioni per priorità
    prisma.shipment.groupBy({
      by: ['priority'],
      _count: { id: true },
      where: dateFilter,
    }),
    
    // Tempo medio di carico (stimato)
    prisma.shipment.aggregate({
      _avg: { estimatedDuration: true },
      where: dateFilter,
    }),
    
    // Peso totale trasportato
    prisma.pickupOrder.aggregate({
      _sum: { actualQuantity: true },
      where: {
        status: 'COMPLETO',
        shipment: dateFilter,
      },
    }),
  ]);

  return {
    totalShipments,
    shipmentsByStatus,
    shipmentsByPriority,
    averageLoadingTime: averageLoadingTime._avg.estimatedDuration,
    totalWeight: totalWeight._sum.actualQuantity || 0,
  };
};

/**
 * Ottiene operatori disponibili per una data
 */
export const getAvailableOperators = async (date: Date) => {
  // Operatori con ruolo OPERATOR, MANAGER o ADMIN
  const allOperators = await prisma.user.findMany({
    where: {
      role: { in: ['OPERATOR', 'MANAGER', 'ADMIN'] },
      active: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    },
  });

  // Operatori già assegnati per quella data
  const assignedOperators = await prisma.pickupOrder.findMany({
    where: {
      scheduledDate: {
        gte: startOfDay(date),
        lte: endOfDay(date),
      },
      assignedOperatorId: { not: null },
      status: { in: ['IN_CARICO', 'CARICATO'] },
    },
    select: {
      assignedOperatorId: true,
    },
  });

  const assignedIds = assignedOperators
    .map(order => order.assignedOperatorId)
    .filter(Boolean);

  // Filtra operatori disponibili
  return allOperators.map(operator => ({
    ...operator,
    isAvailable: !assignedIds.includes(operator.id),
  }));
};

/**
 * Ottiene il planning giornaliero
 */
export const getDailyPlanning = async (date: Date) => {
  const shipments = await findShipmentsByDate(date);
  
  const summary = {
    totalShipments: shipments.length,
    byStatus: {} as Record<string, number>,
    byPriority: {} as Record<string, number>,
    byTimeSlot: {} as Record<string, number>,
    totalWeight: 0,
    assignedOperators: new Set<string>(),
  };

  shipments.forEach(shipment => {
    const status = shipment.pickupOrder.status;
    const priority = shipment.priority;
    const timeSlot = shipment.timeSlot || 'Non specificato';
    
    summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;
    summary.byPriority[priority] = (summary.byPriority[priority] || 0) + 1;
    summary.byTimeSlot[timeSlot] = (summary.byTimeSlot[timeSlot] || 0) + 1;
    
    if (shipment.pickupOrder.expectedQuantity) {
      summary.totalWeight += shipment.pickupOrder.expectedQuantity;
    }
    
    if (shipment.pickupOrder.assignedOperator) {
      summary.assignedOperators.add(
        `${shipment.pickupOrder.assignedOperator.firstName} ${shipment.pickupOrder.assignedOperator.lastName}`
      );
    }
  });

  return {
    date,
    shipments,
    summary: {
      ...summary,
      assignedOperators: Array.from(summary.assignedOperators),
    },
  };
};