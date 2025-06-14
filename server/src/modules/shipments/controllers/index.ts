// server/src/modules/shipments/controllers/index.ts

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { HttpException } from '../../../core/middleware/error.middleware';
import { AuthRequest } from '../../../core/middleware/auth.middleware';
import * as shipmentService from '../services/shipments.service';
import { logger } from '../../../core/config/logger';

// Interfacce per i tipi Prisma
interface PrismaPickupOrder {
  id: string;
  orderNumber: string;
  status: string;
  scheduledDate: Date | null;
  loadingDate: Date | null;
  expectedQuantity: number | null;
  loadedPackages: number | null;
  basin: {
    code: string;
    description: string | null;
    client: {
      name: string;
    };
  } | null;
  logisticSender: {
    name: string;
  } | null;
  logisticRecipient: {
    name: string;
  } | null;
  assignedOperator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  shipment: {
    timeSlot: string | null;
    priority: string;
    specialInstructions: string | null;
  } | null;
}

interface ShipmentFilters {
  date?: string;
  status?: string;
  priority?: string;
}

interface ScheduleShipmentRequest {
  pickupOrderId: string;
  scheduledDate: string;
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

interface UpdateShipmentRequest {
  scheduledDate?: string;
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

interface AssignOperatorRequest {
  operatorId: string;
}

interface CompleteLoadingRequest {
  packageCount?: number;
  photos?: string;
  videos?: string;
  notes?: string;
}

interface FinalizeShipmentRequest {
  departureWeight: number;
  notes?: string;
}

interface ConfirmArrivalRequest {
  arrivalWeight?: number;
  isRejected?: boolean;
  rejectionReason?: string;
}

interface CancelShipmentRequest {
  reason: string;
}

/**
 * Ottiene tutte le spedizioni con filtri opzionali
 */
export const getAllShipments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { date, status, priority } = req.query as ShipmentFilters;
    
    const filters = {
      date: date ? new Date(date) : undefined,
      status,
      priority,
    };
    
    const shipments = await shipmentService.findAllShipments(filters);
    res.status(200).json(shipments);
  } catch (error) {
    next(error);
  }
};

/**
 * Ottiene le spedizioni per una data specifica (calendario)
 */
export const getShipmentsByDate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { date } = req.params;
    
    if (!date) {
      throw new HttpException(400, 'Data richiesta');
    }
    
    const shipments = await shipmentService.findShipmentsByDate(new Date(date));
    res.status(200).json(shipments);
  } catch (error) {
    next(error);
  }
};

/**
 * Ottiene le spedizioni per un range di date (vista calendario settimanale/mensile)
 */
export const getShipmentsByDateRange = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      throw new HttpException(400, 'Date di inizio e fine richieste');
    }
    
    const shipments = await shipmentService.findShipmentsByDateRange(
      new Date(startDate as string),
      new Date(endDate as string)
    );
    
    res.status(200).json(shipments);
  } catch (error) {
    next(error);
  }
};

/**
 * Ottiene una spedizione specifica per ID
 */
export const getShipmentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const shipment = await shipmentService.findShipmentById(id);
    res.status(200).json(shipment);
  } catch (error) {
    next(error);
  }
};

/**
 * Dashboard operatore - Ottiene gli ordini per la dashboard operatore
 * Restituisce ordini suddivisi per stato per la visualizzazione dashboard
 */
export const getOperatorDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      throw new HttpException(401, 'Utente non autenticato');
    }

    // Usa import invece di require
    const prisma = new PrismaClient();

    try {
      // Query per tutti gli ordini rilevanti per la dashboard operatore
      const orders = await prisma.pickupOrder.findMany({
        where: {
          OR: [
            // Ordini assegnati all'operatore corrente
            { assignedOperatorId: userId },
            // Ordini in stati che possono interessare tutti gli operatori
            { 
              status: { 
                in: ['PROGRAMMATO', 'IN_EVASIONE', 'IN_CARICO', 'CARICATO'] 
              }
            }
          ]
        },
        include: {
          basin: {
            include: {
              client: true
            }
          },
          logisticSender: true,
          logisticRecipient: true,
          assignedOperator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          shipment: {
            select: {
              timeSlot: true,
              priority: true,
              specialInstructions: true
            }
          }
        },
        orderBy: [
          { scheduledDate: 'asc' },
          { status: 'asc' }
        ]
      }) as PrismaPickupOrder[];

      // Trasforma i dati per il frontend con tipizzazione corretta
      const transformedOrders = orders.map((order: PrismaPickupOrder) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        scheduledDate: order.scheduledDate,
        loadingDate: order.loadingDate,
        expectedQuantity: order.expectedQuantity,
        loadedPackages: order.loadedPackages,
        basin: {
          code: order.basin?.code || '',
          description: order.basin?.description || '',
          client: {
            name: order.basin?.client?.name || ''
          }
        },
        logisticSender: order.logisticSender ? {
          name: order.logisticSender.name
        } : undefined,
        logisticRecipient: order.logisticRecipient ? {
          name: order.logisticRecipient.name
        } : undefined,
        assignedOperator: order.assignedOperator ? {
          firstName: order.assignedOperator.firstName,
          lastName: order.assignedOperator.lastName
        } : undefined,
        specialInstructions: order.shipment?.specialInstructions
      }));

      logger.info(`Dashboard operatore richiesta da utente: ${userId}`, {
        totalOrders: transformedOrders.length
      });

      res.status(200).json(transformedOrders);
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    logger.error('Errore nel recupero dashboard operatore:', error);
    next(error);
  }
};

/**
 * Avvia carico con auto-assegnazione operatore (CORRETTO)
 * Accetta ID del PickupOrder invece che della Shipment
 */
export const startLoadingWithAutoAssign = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params; // Questo è l'ID del PickupOrder
    const userId = req.user?.userId;
    
    if (!userId) {
      throw new HttpException(401, 'Utente non autenticato');
    }

    // Usa PrismaClient direttamente per trovare il PickupOrder e aggiornarlo
    const prisma = new PrismaClient();

    try {
      // Trova il PickupOrder e verifica che sia nello stato corretto
      const pickupOrder = await prisma.pickupOrder.findUnique({
        where: { id },
        include: {
          assignedOperator: true,
          shipment: true
        }
      });

      if (!pickupOrder) {
        throw new HttpException(404, 'Buono di ritiro non trovato');
      }

      if (pickupOrder.status !== 'IN_EVASIONE') {
        throw new HttpException(400, `Impossibile assegnare: stato attuale "${pickupOrder.status}"`);
      }

      // Verifica che l'utente esista e abbia il ruolo corretto
      const operator = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!operator) {
        throw new HttpException(404, 'Operatore non trovato');
      }

      if (!['OPERATOR', 'MANAGER', 'ADMIN'].includes(operator.role)) {
        throw new HttpException(400, 'Utente non autorizzato come operatore');
      }

      // Transaction per aggiornare stato e assegnare operatore
      await prisma.$transaction(async (tx) => {
        // Aggiorna il buono di ritiro
        await tx.pickupOrder.update({
          where: { id },
          data: {
            status: 'IN_CARICO',
            assignedOperatorId: userId,
            operatorAssignedAt: new Date(),
          },
        });

        // Registra il cambio di stato
        await tx.pickupOrderStatusHistory.create({
          data: {
            pickupOrderId: id,
            fromStatus: 'IN_EVASIONE',
            toStatus: 'IN_CARICO',
            changedBy: userId,
            reason: `Operatore auto-assegnato: ${operator.firstName} ${operator.lastName}`,
          },
        });

        // Registra l'attività
        await tx.operatorActivity.create({
          data: {
            pickupOrderId: id,
            operatorId: userId,
            activityType: 'ASSIGNED',
            description: `Operatore ${operator.firstName} ${operator.lastName} preso in carico automaticamente`,
          },
        });
      });

      // Ricarica i dati completi per la risposta
      const updatedPickupOrder = await prisma.pickupOrder.findUnique({
        where: { id },
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
          shipment: true,
        },
      });

      logger.info(`Operatore auto-assegnato al buono di ritiro: ${id}`, { 
        operatorId: userId, 
        assignedBy: userId 
      });

      res.status(200).json(updatedPickupOrder);

    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    logger.error('Errore nell\'auto-assegnazione operatore:', error);
    next(error);
  }
};

/**
 * Completa il carico (passa da IN_CARICO a CARICATO) - CORRETTO per PickupOrder ID
 */
export const completeLoading = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params; // ID del PickupOrder
    const loadingData = req.body as CompleteLoadingRequest;
    const userId = req.user?.userId;
    
    if (!userId) {
      throw new HttpException(401, 'Utente non autenticato');
    }

    const prisma = new PrismaClient();

    try {
      // Trova il PickupOrder
      const pickupOrder = await prisma.pickupOrder.findUnique({
        where: { id },
        include: { assignedOperator: true }
      });

      if (!pickupOrder) {
        throw new HttpException(404, 'Buono di ritiro non trovato');
      }

      if (pickupOrder.status !== 'IN_CARICO') {
        throw new HttpException(400, `Impossibile completare carico: stato attuale "${pickupOrder.status}"`);
      }

      // Verifica che l'operatore sia quello assegnato
      if (pickupOrder.assignedOperatorId !== userId) {
        throw new HttpException(403, 'Solo l\'operatore assegnato può completare il carico');
      }

      await prisma.$transaction(async (tx) => {
        // Aggiorna il buono di ritiro
        await tx.pickupOrder.update({
          where: { id },
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
            pickupOrderId: id,
            fromStatus: 'IN_CARICO',
            toStatus: 'CARICATO',
            changedBy: userId,
            reason: 'Carico completato dall\'operatore',
          },
        });

        // Registra l'attività
        await tx.operatorActivity.create({
          data: {
            pickupOrderId: id,
            operatorId: userId,
            activityType: 'LOADING_COMPLETED',
            description: 'Carico completato',
            packageCount: loadingData.packageCount,
            photos: loadingData.photos,
            videos: loadingData.videos,
            notes: loadingData.notes,
          },
        });
      });

      // Ricarica i dati completi
      const updatedPickupOrder = await prisma.pickupOrder.findUnique({
        where: { id },
        include: {
          basin: {
            include: { client: true },
          },
          logisticSender: true,
          logisticRecipient: true,
          assignedOperator: true,
          shipment: true,
        },
      });

      logger.info(`Carico completato per buono di ritiro: ${id}`, { 
        packageCount: loadingData.packageCount,
        operatorId: userId 
      });

      res.status(200).json(updatedPickupOrder);

    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    logger.error('Errore nel completamento carico:', error);
    next(error);
  }
};

/**
 * Programma una nuova spedizione (passa buono da DA_EVADERE a PROGRAMMATO)
 */
export const scheduleShipment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const shipmentData = req.body as ScheduleShipmentRequest;
    const userId = req.user?.userId;
    
    if (!userId) {
      throw new HttpException(401, 'Utente non autenticato');
    }
    
    // Converti la data da stringa a Date
    const createData = {
      ...shipmentData,
      scheduledDate: new Date(shipmentData.scheduledDate),
    };
    
    const shipment = await shipmentService.scheduleShipment(createData, userId);
    
    logger.info(`Spedizione programmata: ${shipment.id}`, {
      pickupOrderId: shipment.pickupOrderId,
      scheduledDate: shipment.scheduledDate,
      userId
    });
    
    res.status(201).json(shipment);
  } catch (error) {
    next(error);
  }
};

/**
 * Aggiorna una spedizione esistente
 */
export const updateShipment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body as UpdateShipmentRequest;
    const userId = req.user?.userId;
    
    if (!userId) {
      throw new HttpException(401, 'Utente non autenticato');
    }
    
    // Converti la data se presente
    const processedData = {
      ...updateData,
      scheduledDate: updateData.scheduledDate ? new Date(updateData.scheduledDate) : undefined,
    };
    
    const shipment = await shipmentService.updateShipment(id, processedData, userId);
    
    logger.info(`Spedizione aggiornata: ${id}`, { userId });
    
    res.status(200).json(shipment);
  } catch (error) {
    next(error);
  }
};

/**
 * Avvia una spedizione (passa da PROGRAMMATO a IN_EVASIONE)
 */
export const startShipment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      throw new HttpException(401, 'Utente non autenticato');
    }
    
    const shipment = await shipmentService.startShipment(id, userId);
    
    logger.info(`Spedizione avviata: ${id}`, { userId });
    
    res.status(200).json(shipment);
  } catch (error) {
    next(error);
  }
};

/**
 * Assegna un operatore a una spedizione (passa da IN_EVASIONE a IN_CARICO)
 */
export const assignOperator = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { operatorId } = req.body as AssignOperatorRequest;
    const userId = req.user?.userId;
    
    if (!userId) {
      throw new HttpException(401, 'Utente non autenticato');
    }
    
    if (!operatorId) {
      throw new HttpException(400, 'ID operatore richiesto');
    }
    
    const shipment = await shipmentService.assignOperator(id, operatorId, userId);
    
    logger.info(`Operatore assegnato alla spedizione: ${id}`, { 
      operatorId, 
      assignedBy: userId 
    });
    
    res.status(200).json(shipment);
  } catch (error) {
    next(error);
  }
};

/**
 * Finalizza la spedizione (passa da CARICATO a SPEDITO) - CORRETTO per PickupOrder ID
 */
export const finalizeShipment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params; // ID del PickupOrder
    const { departureWeight, notes } = req.body as FinalizeShipmentRequest;
    const userId = req.user?.userId;
    
    if (!userId) {
      throw new HttpException(401, 'Utente non autenticato');
    }
    
    if (!departureWeight) {
      throw new HttpException(400, 'Peso di partenza richiesto');
    }

    const prisma = new PrismaClient();

    try {
      // Trova il PickupOrder
      const pickupOrder = await prisma.pickupOrder.findUnique({
        where: { id },
      });

      if (!pickupOrder) {
        throw new HttpException(404, 'Buono di ritiro non trovato');
      }

      if (pickupOrder.status !== 'CARICATO') {
        throw new HttpException(400, `Impossibile finalizzare: stato attuale "${pickupOrder.status}"`);
      }

      // Verifica che l'utente sia manager o admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !['MANAGER', 'ADMIN'].includes(user.role)) {
        throw new HttpException(403, 'Solo i manager possono finalizzare le spedizioni');
      }

      await prisma.$transaction(async (tx) => {
        // Aggiorna il buono di ritiro
        await tx.pickupOrder.update({
          where: { id },
          data: {
            status: 'SPEDITO',
            departureWeight: departureWeight,
            actualQuantity: departureWeight, // Il peso effettivo è quello di partenza
          },
        });

        // Registra il cambio di stato
        await tx.pickupOrderStatusHistory.create({
          data: {
            pickupOrderId: id,
            fromStatus: 'CARICATO',
            toStatus: 'SPEDITO',
            changedBy: userId,
            reason: 'Spedizione finalizzata dal manager',
            notes: notes,
          },
        });

        // Registra l'attività
        await tx.operatorActivity.create({
          data: {
            pickupOrderId: id,
            operatorId: userId,
            activityType: 'SHIPMENT_FINALIZED',
            description: `Spedizione finalizzata - Peso partenza: ${departureWeight} t`,
            notes: notes,
          },
        });
      });

      // Ricarica i dati completi
      const updatedPickupOrder = await prisma.pickupOrder.findUnique({
        where: { id },
        include: {
          basin: { include: { client: true } },
          logisticSender: true,
          logisticRecipient: true,
          assignedOperator: true,
          shipment: true,
        },
      });

      logger.info(`Spedizione finalizzata: ${id}`, { 
        departureWeight,
        finalizedBy: userId 
      });

      res.status(200).json(updatedPickupOrder);

    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    logger.error('Errore nella finalizzazione spedizione:', error);
    next(error);
  }
};

/**
 * Conferma arrivo (passa da SPEDITO a COMPLETO) - CORRETTO per PickupOrder ID
 */
export const confirmArrival = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params; // ID del PickupOrder
    const arrivalRequest = req.body as ConfirmArrivalRequest;
    const userId = req.user?.userId;
    
    if (!userId) {
      throw new HttpException(401, 'Utente non autenticato');
    }

    const prisma = new PrismaClient();

    try {
      // Trova il PickupOrder
      const pickupOrder = await prisma.pickupOrder.findUnique({
        where: { id },
      });

      if (!pickupOrder) {
        throw new HttpException(404, 'Buono di ritiro non trovato');
      }

      if (pickupOrder.status !== 'SPEDITO') {
        throw new HttpException(400, `Impossibile confermare arrivo: stato attuale "${pickupOrder.status}"`);
      }

      await prisma.$transaction(async (tx) => {
        // Aggiorna il buono di ritiro
        await tx.pickupOrder.update({
          where: { id },
          data: {
            status: 'COMPLETO',
            arrivalWeight: arrivalRequest.arrivalWeight,
            isRejected: arrivalRequest.isRejected || false,
            rejectionReason: arrivalRequest.rejectionReason,
            rejectionDate: arrivalRequest.isRejected ? new Date() : null,
            completionDate: new Date(),
            destinationQuantity: arrivalRequest.isRejected ? 0 : arrivalRequest.arrivalWeight,
          },
        });

        // Registra il cambio di stato
        await tx.pickupOrderStatusHistory.create({
          data: {
            pickupOrderId: id,
            fromStatus: 'SPEDITO',
            toStatus: 'COMPLETO',
            changedBy: userId,
            reason: arrivalRequest.isRejected ? 'Carico respinto' : 'Arrivo confermato',
            notes: arrivalRequest.rejectionReason,
          },
        });

        // Registra l'attività
        await tx.operatorActivity.create({
          data: {
            pickupOrderId: id,
            operatorId: userId,
            activityType: arrivalRequest.isRejected ? 'ARRIVAL_REJECTED' : 'ARRIVAL_CONFIRMED',
            description: arrivalRequest.isRejected 
              ? `Carico respinto: ${arrivalRequest.rejectionReason}`
              : `Arrivo confermato - Peso: ${arrivalRequest.arrivalWeight} t`,
            notes: arrivalRequest.rejectionReason,
          },
        });
      });

      // Ricarica i dati completi
      const updatedPickupOrder = await prisma.pickupOrder.findUnique({
        where: { id },
        include: {
          basin: { include: { client: true } },
          logisticSender: true,
          logisticRecipient: true,
          assignedOperator: true,
          shipment: true,
        },
      });

      logger.info(`Arrivo confermato per buono di ritiro: ${id}`, { 
        arrivalWeight: arrivalRequest.arrivalWeight,
        isRejected: arrivalRequest.isRejected,
        confirmedBy: userId 
      });

      res.status(200).json(updatedPickupOrder);

    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    logger.error('Errore nella conferma arrivo:', error);
    next(error);
  }
};

/**
 * Ottiene le statistiche delle spedizioni
 */
export const getShipmentStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    const stats = await shipmentService.getShipmentStats(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};

/**
 * Ottiene gli operatori disponibili per assegnazione
 */
export const getAvailableOperators = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { date } = req.query;
    
    const operators = await shipmentService.getAvailableOperators(
      date ? new Date(date as string) : new Date()
    );
    
    res.status(200).json(operators);
  } catch (error) {
    next(error);
  }
};

/**
 * Ottiene il planning giornaliero per una data specifica
 */
export const getDailyPlanning = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { date } = req.params;
    
    if (!date) {
      throw new HttpException(400, 'Data richiesta');
    }
    
    const planning = await shipmentService.getDailyPlanning(new Date(date));
    
    res.status(200).json(planning);
  } catch (error) {
    next(error);
  }
};

/**
 * Cancella una spedizione (solo se non ancora avviata)
 */
export const cancelShipment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body as CancelShipmentRequest;
    const userId = req.user?.userId;
    
    if (!userId) {
      throw new HttpException(401, 'Utente non autenticato');
    }
    
    const shipment = await shipmentService.cancelShipment(id, reason, userId);
    
    logger.info(`Spedizione cancellata: ${id}`, { 
      reason,
      cancelledBy: userId 
    });
    
    res.status(200).json(shipment);
  } catch (error) {
    next(error);
  }
};