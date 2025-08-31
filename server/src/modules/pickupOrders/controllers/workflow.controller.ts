// server/src/modules/pickupOrders/controllers/workflow.controller.ts - VERSIONE CORRETTA

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../core/middleware/auth.middleware'; // ← CORREZIONE CRITICA
import { PrismaClient } from '@prisma/client';
import * as workflowService from '../services/workflow.service';
import { HttpException } from '../../../core/middleware/error.middleware';

const prisma = new PrismaClient();

/**
 * Cambia lo stato di un buono di ritiro
 */
export const changeStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { newStatus, reason, notes, additionalData } = req.body;

    if (!req.user) {
      throw new HttpException(401, 'Utente non autenticato');
    }

    console.log(`🔄 Cambio stato ordine ${id}: ${newStatus}`);

    const result = await workflowService.changePickupOrderStatus({
      pickupOrderId: id,
      newStatus,
      userId: req.user.id,
      userRole: req.user.role,
      reason,
      notes,
      additionalData
    });

    res.status(200).json({
      success: true,
      message: `Stato cambiato a ${newStatus}`,
      data: result
    });
  } catch (error) {
    console.error('❌ Errore nel cambio stato:', error);
    next(error);
  }
};

/**
 * Programma un buono di ritiro (DA_EVADERE -> PROGRAMMATO)
 */
export const schedulePickupOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { scheduledDate, notes } = req.body;

    if (!req.user) {
      throw new HttpException(401, 'Utente non autenticato');
    }

    if (!scheduledDate) {
      throw new HttpException(400, 'Data programmazione obbligatoria');
    }

    const result = await workflowService.changePickupOrderStatus({
      pickupOrderId: id,
      newStatus: workflowService.PickupOrderStatus.PROGRAMMATO,
      userId: req.user.id,
      userRole: req.user.role,
      reason: 'Programmazione buono di ritiro',
      notes,
      additionalData: {
        scheduledDate: new Date(scheduledDate)
      }
    });

    res.status(200).json({
      success: true,
      message: 'Buono di ritiro programmato con successo',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Avvia evasione (PROGRAMMATO -> IN_EVASIONE)
 */
export const startEvading = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    if (!req.user) {
      throw new HttpException(401, 'Utente non autenticato');
    }

    console.log(`🚚 Avvio evasione ordine ${id}`);

    const result = await workflowService.changePickupOrderStatus({
      pickupOrderId: id,
      newStatus: workflowService.PickupOrderStatus.IN_EVASIONE,
      userId: req.user.id,
      userRole: req.user.role,
      reason: 'Vettore presente, inizio evasione',
      notes
    });

    res.status(200).json({
      success: true,
      message: 'Evasione avviata con successo',
      data: result
    });
  } catch (error) {
    console.error('❌ Errore nell\'avvio evasione:', error);
    next(error);
  }
};

/**
 * Assegna operatore e prende in carico (IN_EVASIONE -> IN_CARICO)
 */
export const assignOperator = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { operatorId, notes } = req.body;

    if (!req.user) {
      throw new HttpException(401, 'Utente non autenticato');
    }

    const finalOperatorId = operatorId || req.user.id;

    console.log('🔧 DEBUG assign-operator:', {
      orderId: id,
      requestUserId: req.user.id,
      requestUserRole: req.user.role,
      finalOperatorId,
      notes
    });

    // AGGIUNTO: Verifica che l'operatore esista
    console.log('👤 Verifica esistenza operatore...');
    const operator = await prisma.user.findUnique({
      where: { id: finalOperatorId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true
      }
    });

    if (!operator) {
      console.error(`❌ Operatore non trovato: ${finalOperatorId}`);
      throw new HttpException(404, 'Operatore non trovato');
    }

    if (!operator.active) {
      console.error(`❌ Operatore non attivo: ${finalOperatorId}`);
      throw new HttpException(400, 'Operatore non attivo');
    }

    if (!['OPERATOR', 'MANAGER', 'ADMIN'].includes(operator.role)) {
      console.error(`❌ Ruolo operatore non valido: ${operator.role}`);
      throw new HttpException(400, 'Utente non autorizzato come operatore');
    }

    console.log(`✅ Operatore validato:`, {
      id: operator.id,
      name: `${operator.firstName} ${operator.lastName}`,
      role: operator.role,
      active: operator.active
    });

    const result = await workflowService.changePickupOrderStatus({
      pickupOrderId: id,
      newStatus: workflowService.PickupOrderStatus.IN_CARICO,
      userId: req.user.id,
      userRole: req.user.role,
      reason: operatorId ? 'Operatore assegnato dal manager' : 'Operatore auto-assegnato',
      notes,
      additionalData: {
        operatorId: finalOperatorId
      }
    });

    res.status(200).json({
      success: true,
      message: 'Operatore assegnato con successo',
      data: result
    });
  } catch (error) {
    console.error('❌ Errore in assignOperator:', error);
    next(error);
  }
};
/**
 * Completa carico (IN_CARICO -> CARICATO)
 */
/**
 * Completa carico (IN_CARICO -> CARICATO) con supporto foto
 */
export const completeLoading = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { packageCount, notes, photos, photoCount } = req.body;

    if (!req.user) {
      throw new HttpException(401, 'Utente non autenticato');
    }

    // Validazione dati
    if (packageCount !== undefined && (isNaN(packageCount) || packageCount < 0)) {
      throw new HttpException(400, 'Numero colli non valido');
    }

    console.log(`📦 Completamento carico ordine ${id}:`, {
      packageCount,
      photoCount: photoCount || 0,
      photosProvided: !!photos,
      operatorId: req.user.id
    });

    const result = await workflowService.changePickupOrderStatus({
      pickupOrderId: id,
      newStatus: workflowService.PickupOrderStatus.CARICATO,
      userId: req.user.id,
      userRole: req.user.role,
      reason: 'Carico completato dall\'operatore',
      notes,
      additionalData: {
        packageCount: packageCount ? parseInt(packageCount) : undefined,
        loadingPhotos: photos,
        photoCount: photoCount ? parseInt(photoCount) : 0,
        completedAt: new Date().toISOString()
      }
    });

    res.status(200).json({
      success: true,
      message: `Carico completato con successo${photoCount ? ` (${photoCount} foto allegate)` : ''}`,
      data: result
    });
  } catch (error) {
    console.error('❌ Errore in completeLoading:', error);
    next(error);
  }
};

/**
 * Finalizza spedizione (CARICATO -> SPEDITO)
 */
export const finalizeShipment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { departureWeight, notes } = req.body;

    if (!req.user) {
      throw new HttpException(401, 'Utente non autenticato');
    }

    if (!departureWeight || departureWeight <= 0) {
      throw new HttpException(400, 'Peso di partenza obbligatorio e deve essere maggiore di zero');
    }

    const result = await workflowService.changePickupOrderStatus({
      pickupOrderId: id,
      newStatus: workflowService.PickupOrderStatus.SPEDITO,
      userId: req.user.id,
      userRole: req.user.role,
      reason: 'Spedizione finalizzata dal manager',
      notes,
      additionalData: {
        departureWeight: parseFloat(departureWeight)
      }
    });

    res.status(200).json({
      success: true,
      message: 'Spedizione finalizzata con successo',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Completa ordine con riscontro destinatario (SPEDITO -> COMPLETO)
 */
export const completeOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { arrivalWeight, isRejected, rejectionReason, notes } = req.body;

    if (!req.user) {
      throw new HttpException(401, 'Utente non autenticato');
    }

    if (!isRejected && (!arrivalWeight || arrivalWeight < 0)) {
      throw new HttpException(400, 'Peso di arrivo obbligatorio se il carico non è stato respinto');
    }

    if (isRejected && !rejectionReason) {
      throw new HttpException(400, 'Motivo di rifiuto obbligatorio se il carico è stato respinto');
    }

    const result = await workflowService.changePickupOrderStatus({
      pickupOrderId: id,
      newStatus: workflowService.PickupOrderStatus.COMPLETO,
      userId: req.user.id,
      userRole: req.user.role,
      reason: isRejected ? 'Carico respinto dal destinatario' : 'Carico consegnato e confermato',
      notes,
      additionalData: {
        arrivalWeight: arrivalWeight ? parseFloat(arrivalWeight) : undefined,
        isRejected: Boolean(isRejected),
        rejectionReason
      }
    });

    res.status(200).json({
      success: true,
      message: isRejected ? 'Ordine completato - carico respinto' : 'Ordine completato con successo',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// === NUOVE FUNZIONI PER ROLLBACK ===

/**
 * Rollback a PROGRAMMATO (da IN_EVASIONE)
 */
export const rollbackToProgrammed = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason, notes } = req.body;

    if (!req.user) {
      throw new HttpException(401, 'Utente non autenticato');
    }

    const result = await workflowService.changePickupOrderStatus({
      pickupOrderId: id,
      newStatus: workflowService.PickupOrderStatus.PROGRAMMATO,
      userId: req.user.id,
      userRole: req.user.role,
      reason: reason || 'Rollback a programmato',
      notes
    });

    res.status(200).json({
      success: true,
      message: 'Ordine riportato allo stato PROGRAMMATO',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rollback a IN_EVASIONE (da IN_CARICO)
 */
export const rollbackToEvading = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason, notes } = req.body;

    if (!req.user) {
      throw new HttpException(401, 'Utente non autenticato');
    }

    const result = await workflowService.changePickupOrderStatus({
      pickupOrderId: id,
      newStatus: workflowService.PickupOrderStatus.IN_EVASIONE,
      userId: req.user.id,
      userRole: req.user.role,
      reason: reason || 'Rollback a in evasione',
      notes,
      additionalData: {
        operatorId: null // Rimuovi operatore assegnato
      }
    });

    res.status(200).json({
      success: true,
      message: 'Ordine riportato allo stato IN_EVASIONE',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rollback a IN_CARICO (da CARICATO)
 */
export const rollbackToLoading = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason, notes } = req.body;

    if (!req.user) {
      throw new HttpException(401, 'Utente non autenticato');
    }

    const result = await workflowService.changePickupOrderStatus({
      pickupOrderId: id,
      newStatus: workflowService.PickupOrderStatus.IN_CARICO,
      userId: req.user.id,
      userRole: req.user.role,
      reason: reason || 'Rollback a in carico',
      notes,
      additionalData: {
        packageCount: null // Reset numero colli
      }
    });

    res.status(200).json({
      success: true,
      message: 'Ordine riportato allo stato IN_CARICO',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rollback a CARICATO (da SPEDITO)
 */
export const rollbackToLoaded = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason, notes } = req.body;

    if (!req.user) {
      throw new HttpException(401, 'Utente non autenticato');
    }

    const result = await workflowService.changePickupOrderStatus({
      pickupOrderId: id,
      newStatus: workflowService.PickupOrderStatus.CARICATO,
      userId: req.user.id,
      userRole: req.user.role,
      reason: reason || 'Rollback a caricato',
      notes,
      additionalData: {
        departureWeight: null, // Reset peso partenza
        unloadingDate: null // Reset data scarico
      }
    });

    res.status(200).json({
      success: true,
      message: 'Ordine riportato allo stato CARICATO',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Registra attività operatore
 */
export const recordActivity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { activityType, description, photos, videos, packageCount, notes } = req.body;

    if (!req.user) {
      throw new HttpException(401, 'Utente non autenticato');
    }

    const result = await workflowService.recordOperatorActivity(id, req.user.id, {
      activityType,
      description,
      photos,
      videos,
      packageCount: packageCount ? parseInt(packageCount) : undefined,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Attività registrata con successo',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Ottiene operatori disponibili
 */
export const getAvailableOperators = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const operators = await workflowService.getAvailableOperators();

    res.status(200).json({
      success: true,
      data: operators
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Ottiene storico completo di un buono di ritiro
 */
export const getOrderHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const history = await workflowService.getPickupOrderHistory(id);

    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Ottiene i miei ordini (per operatori)
 */
export const getMyOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpException(401, 'Utente non autenticato');
    }

    const orders = await prisma.pickupOrder.findMany({
      where: {
        assignedOperatorId: req.user.id,
        status: { in: ['IN_CARICO', 'CARICATO'] }
      },
      include: {
        basin: {
          include: {
            client: true
          }
        },
        logisticSender: true,
        logisticRecipient: true,
        activities: {
          orderBy: { timestamp: 'desc' },
          take: 5
        }
      },
      orderBy: { scheduledDate: 'asc' }
    });

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Ottiene ordini programmati per oggi
 */
export const getTodayScheduled = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orders = await prisma.pickupOrder.findMany({
      where: {
        scheduledDate: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        basin: {
          include: {
            client: true
          }
        },
        logisticSender: true,
        assignedOperator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { scheduledDate: 'asc' }
    });

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Ottiene statistiche del workflow
 */
export const getWorkflowStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { dateFrom, dateTo } = req.query;

    const stats = await workflowService.getWorkflowStats(
      dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo ? new Date(dateTo as string) : undefined
    );

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};