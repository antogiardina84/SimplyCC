// server/src/modules/shipments/controllers/index.ts

import { Request, Response, NextFunction } from 'express';
import { HttpException } from '../../../core/middleware/error.middleware';
import { AuthRequest } from '../../../core/middleware/auth.middleware';
import * as shipmentService from '../services/shipments.service';
import { logger } from '../../../core/config/logger';

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
 * Completa il carico (passa da IN_CARICO a CARICATO)
 */
export const completeLoading = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const loadingData = req.body as CompleteLoadingRequest;
    const userId = req.user?.userId;
    
    if (!userId) {
      throw new HttpException(401, 'Utente non autenticato');
    }
    
    const shipment = await shipmentService.completeLoading(id, loadingData, userId);
    
    logger.info(`Carico completato per spedizione: ${id}`, { 
      packageCount: loadingData.packageCount,
      operatorId: userId 
    });
    
    res.status(200).json(shipment);
  } catch (error) {
    next(error);
  }
};

/**
 * Finalizza la spedizione (passa da CARICATO a SPEDITO)
 */
export const finalizeShipment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { departureWeight, notes } = req.body as FinalizeShipmentRequest;
    const userId = req.user?.userId;
    
    if (!userId) {
      throw new HttpException(401, 'Utente non autenticato');
    }
    
    if (!departureWeight) {
      throw new HttpException(400, 'Peso di partenza richiesto');
    }
    
    const shipment = await shipmentService.finalizeShipment(id, departureWeight, notes || '', userId);
    
    logger.info(`Spedizione finalizzata: ${id}`, { 
      departureWeight,
      finalizedBy: userId 
    });
    
    res.status(200).json(shipment);
  } catch (error) {
    next(error);
  }
};

/**
 * Conferma arrivo (passa da SPEDITO a COMPLETO)
 */
export const confirmArrival = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const arrivalRequest = req.body as ConfirmArrivalRequest;
    const userId = req.user?.userId;
    
    if (!userId) {
      throw new HttpException(401, 'Utente non autenticato');
    }
    
    const arrivalData = {
      arrivalWeight: arrivalRequest.arrivalWeight,
      isRejected: arrivalRequest.isRejected || false,
      rejectionReason: arrivalRequest.rejectionReason,
    };
    
    const shipment = await shipmentService.confirmArrival(id, arrivalData, userId);
    
    logger.info(`Arrivo confermato per spedizione: ${id}`, { 
      arrivalWeight: arrivalData.arrivalWeight,
      isRejected: arrivalData.isRejected,
      confirmedBy: userId 
    });
    
    res.status(200).json(shipment);
  } catch (error) {
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