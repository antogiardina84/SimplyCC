// server/src/modules/pickupOrders/controllers/index.ts - VERSIONE CORRETTA

import { Request, Response, NextFunction } from 'express';
import * as pickupOrderService from '../services/pickupOrders.service';
import type { PickupOrderStatus } from '../services/pickupOrders.service';

// Tipo per User con campi corretti
interface UserInfo {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  active: boolean;
}

// Helper function per formattare il nome dell'utente
const formatUserName = (user: UserInfo | null): string | undefined => {
  if (!user) return undefined;
  
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return fullName || user.email;
};

export const getAllPickupOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('📋 Richiesta lista buoni di ritiro');
    const pickupOrders = await pickupOrderService.findAllPickupOrders();
    
    console.log(`✅ Trovati ${pickupOrders.length} buoni di ritiro`);
    res.status(200).json(pickupOrders);
  } catch (error) {
    console.error('❌ Errore nel recupero lista buoni di ritiro:', error);
    next(error);
  }
};

export const getPickupOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    console.log(`🔍 Richiesta dettagli buono di ritiro ID: ${id}`);
    
    const pickupOrder = await pickupOrderService.findPickupOrderById(id);
    
    // DEBUG: Log dettagliato per verificare che tutte le date sono presenti
    console.log('✅ Buono di ritiro trovato:', {
      id: pickupOrder.id,
      orderNumber: pickupOrder.orderNumber,
      status: pickupOrder.status,
      dates: {
        issueDate: pickupOrder.issueDate,
        scheduledDate: pickupOrder.scheduledDate,
        loadingDate: pickupOrder.loadingDate,
        unloadingDate: pickupOrder.unloadingDate,
        completionDate: pickupOrder.completionDate
      },
      entities: {
        logisticSender: pickupOrder.logisticSender?.name,
        logisticRecipient: pickupOrder.logisticRecipient?.name,
        logisticTransporter: pickupOrder.logisticTransporter?.name,
        client: pickupOrder.client?.name,
        basin: `${pickupOrder.basin?.code} - ${pickupOrder.basin?.description}`
      },
      quantities: {
        expectedQuantity: pickupOrder.expectedQuantity,
        actualQuantity: pickupOrder.actualQuantity,
        destinationQuantity: pickupOrder.destinationQuantity,
        departureWeight: pickupOrder.departureWeight,
        arrivalWeight: pickupOrder.arrivalWeight,
        loadedPackages: pickupOrder.loadedPackages
      },
      additional: {
        materialType: pickupOrder.materialType,
        distanceKm: pickupOrder.distanceKm,
        isRejected: pickupOrder.isRejected,
        rejectionReason: pickupOrder.rejectionReason,
        rejectionDate: pickupOrder.rejectionDate,
        assignedOperator: formatUserName(pickupOrder.assignedOperator as UserInfo | null)
      }
    });
    
    res.status(200).json(pickupOrder);
  } catch (error) {
    console.error(`❌ Errore nel recupero buono di ritiro ID ${req.params.id}:`, error);
    next(error);
  }
};

export const getPickupOrdersByBasin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { basinId } = req.params;
    console.log(`🗂️ Richiesta buoni di ritiro per bacino ID: ${basinId}`);
    
    const pickupOrders = await pickupOrderService.findPickupOrdersByBasin(basinId);
    
    console.log(`✅ Trovati ${pickupOrders.length} buoni di ritiro per bacino ${basinId}`);
    res.status(200).json(pickupOrders);
  } catch (error) {
    console.error(`❌ Errore nel recupero buoni di ritiro per bacino ${req.params.basinId}:`, error);
    next(error);
  }
};

export const getPickupOrdersByClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { clientId } = req.params;
    console.log(`👤 Richiesta buoni di ritiro per cliente ID: ${clientId}`);
    
    const pickupOrders = await pickupOrderService.findPickupOrdersByClient(clientId);
    
    console.log(`✅ Trovati ${pickupOrders.length} buoni di ritiro per cliente ${clientId}`);
    res.status(200).json(pickupOrders);
  } catch (error) {
    console.error(`❌ Errore nel recupero buoni di ritiro per cliente ${req.params.clientId}:`, error);
    next(error);
  }
};

export const createPickupOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pickupOrderData = req.body;
    
    // Log dettagliato dei dati in ingresso
    console.log('🆕 Creazione nuovo buono di ritiro');
    console.log('📋 Dati ricevuti:', {
      orderNumber: pickupOrderData.orderNumber,
      dates: {
        issueDate: pickupOrderData.issueDate,
        scheduledDate: pickupOrderData.scheduledDate,
        loadingDate: pickupOrderData.loadingDate,
        unloadingDate: pickupOrderData.unloadingDate,
        completionDate: pickupOrderData.completionDate
      },
      entities: {
        logisticSenderId: pickupOrderData.logisticSenderId,
        logisticRecipientId: pickupOrderData.logisticRecipientId,
        logisticTransporterId: pickupOrderData.logisticTransporterId,
        clientId: pickupOrderData.clientId,
        basinId: pickupOrderData.basinId
      },
      flow: {
        flowType: pickupOrderData.flowType,
        materialType: pickupOrderData.materialType,
        distanceKm: pickupOrderData.distanceKm
      },
      quantities: {
        expectedQuantity: pickupOrderData.expectedQuantity,
        actualQuantity: pickupOrderData.actualQuantity,
        destinationQuantity: pickupOrderData.destinationQuantity,
        departureWeight: pickupOrderData.departureWeight,
        arrivalWeight: pickupOrderData.arrivalWeight,
        loadedPackages: pickupOrderData.loadedPackages
      },
      status: pickupOrderData.status,
      notes: pickupOrderData.notes ? 'Presenti' : 'Assenti'
    });
    
    const pickupOrder = await pickupOrderService.createPickupOrder(pickupOrderData);
    
    // Log del risultato della creazione
    console.log('✅ Buono di ritiro creato con successo:', {
      id: pickupOrder.id,
      orderNumber: pickupOrder.orderNumber,
      status: pickupOrder.status,
      createdDates: {
        issueDate: pickupOrder.issueDate,
        scheduledDate: pickupOrder.scheduledDate,
        loadingDate: pickupOrder.loadingDate,
        unloadingDate: pickupOrder.unloadingDate,
        completionDate: pickupOrder.completionDate
      },
      createdEntities: {
        logisticSender: pickupOrder.logisticSender?.name,
        logisticRecipient: pickupOrder.logisticRecipient?.name,
        logisticTransporter: pickupOrder.logisticTransporter?.name,
        client: pickupOrder.client?.name,
        basin: `${pickupOrder.basin?.code} - ${pickupOrder.basin?.description}`
      }
    });
    
    res.status(201).json(pickupOrder);
  } catch (error) {
    console.error('❌ Errore durante la creazione del buono di ritiro:', error);
    
    // Log dettagliato dell'errore per debug
    if (error instanceof Error) {
      console.error('Dettagli errore:', {
        message: error.message,
        stack: error.stack
      });
    }
    
    next(error);
  }
};

export const updatePickupOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const pickupOrderData = req.body;
    
    console.log(`📝 Aggiornamento buono di ritiro ID: ${id}`);
    console.log('📋 Dati di aggiornamento:', {
      orderNumber: pickupOrderData.orderNumber,
      updatedDates: {
        issueDate: pickupOrderData.issueDate,
        scheduledDate: pickupOrderData.scheduledDate,
        loadingDate: pickupOrderData.loadingDate,
        unloadingDate: pickupOrderData.unloadingDate,
        completionDate: pickupOrderData.completionDate
      },
      status: pickupOrderData.status,
      updatedFields: Object.keys(pickupOrderData).filter(key => 
        pickupOrderData[key] !== undefined && pickupOrderData[key] !== null
      )
    });
    
    const pickupOrder = await pickupOrderService.updatePickupOrder(id, pickupOrderData);
    
    console.log('✅ Buono di ritiro aggiornato con successo:', {
      id: pickupOrder.id,
      orderNumber: pickupOrder.orderNumber,
      updatedAt: pickupOrder.updatedAt,
      finalDates: {
        issueDate: pickupOrder.issueDate,
        scheduledDate: pickupOrder.scheduledDate,
        loadingDate: pickupOrder.loadingDate,
        unloadingDate: pickupOrder.unloadingDate,
        completionDate: pickupOrder.completionDate
      }
    });
    
    res.status(200).json(pickupOrder);
  } catch (error) {
    console.error(`❌ Errore nell'aggiornamento del buono di ritiro ID ${req.params.id}:`, error);
    next(error);
  }
};

export const deletePickupOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Eliminazione buono di ritiro ID: ${id}`);
    
    const pickupOrder = await pickupOrderService.deletePickupOrder(id);
    
    console.log('✅ Buono di ritiro eliminato con successo:', {
      id: pickupOrder.id,
      orderNumber: pickupOrder.orderNumber,
      status: pickupOrder.status
    });
    
    res.status(200).json({ 
      success: true,
      message: 'Buono di ritiro eliminato con successo',
      deletedOrder: {
        id: pickupOrder.id,
        orderNumber: pickupOrder.orderNumber,
        status: pickupOrder.status
      }
    });
  } catch (error) {
    console.error(`❌ Errore nell'eliminazione del buono di ritiro ID ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Aggiorna lo stato di un buono di ritiro
 */
export const updatePickupOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes }: { status: PickupOrderStatus; notes?: string } = req.body;
    
    console.log(`🔄 Aggiornamento stato buono di ritiro ID: ${id} → ${status}`);
    
    const updateData = {
      status,
      ...(notes && { notes: notes }),
      ...(status === 'COMPLETO' && { completionDate: new Date().toISOString() })
    };
    
    const pickupOrder = await pickupOrderService.updatePickupOrder(id, updateData);
    
    console.log('✅ Stato aggiornato con successo:', {
      id: pickupOrder.id,
      newStatus: pickupOrder.status,
      completionDate: pickupOrder.completionDate
    });
    
    res.status(200).json(pickupOrder);
  } catch (error) {
    console.error(`❌ Errore nell'aggiornamento stato buono di ritiro ID ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Assegna un operatore a un buono di ritiro
 */
export const assignOperator = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { operatorId }: { operatorId: string } = req.body;
    
    console.log(`👤 Assegnazione operatore ${operatorId} al buono di ritiro ID: ${id}`);
    
    const pickupOrder = await pickupOrderService.updatePickupOrder(id, {
      assignedOperatorId: operatorId
    });
    
    console.log('✅ Operatore assegnato con successo:', {
      pickupOrderId: pickupOrder.id,
      assignedOperator: formatUserName(pickupOrder.assignedOperator as UserInfo | null)
    });
    
    res.status(200).json(pickupOrder);
  } catch (error) {
    console.error(`❌ Errore nell'assegnazione operatore al buono di ritiro ID ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Rifiuta un buono di ritiro
 */
export const rejectPickupOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { rejectionReason }: { rejectionReason: string } = req.body;
    
    console.log(`❌ Rifiuto buono di ritiro ID: ${id}, motivo: ${rejectionReason}`);
    
    const pickupOrder = await pickupOrderService.updatePickupOrder(id, {
      isRejected: true,
      rejectionReason: rejectionReason,
      rejectionDate: new Date().toISOString(),
      status: 'CANCELLED'
    });
    
    console.log('✅ Buono di ritiro rifiutato con successo:', {
      id: pickupOrder.id,
      rejectionReason: pickupOrder.rejectionReason,
      rejectionDate: pickupOrder.rejectionDate
    });
    
    res.status(200).json(pickupOrder);
  } catch (error) {
    console.error(`❌ Errore nel rifiuto del buono di ritiro ID ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Aggiorna le quantità e i pesi
 */
export const updateQuantities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const quantityData: Record<string, number> = req.body;
    
    console.log(`⚖️ Aggiornamento quantità buono di ritiro ID: ${id}`, quantityData);
    
    const allowedFields = [
      'expectedQuantity', 'actualQuantity', 'destinationQuantity',
      'departureWeight', 'arrivalWeight', 'loadedPackages'
    ];
    
    const updateData: Record<string, number> = {};
    for (const field of allowedFields) {
      if (quantityData[field] !== undefined) {
        updateData[field] = quantityData[field];
      }
    }
    
    const pickupOrder = await pickupOrderService.updatePickupOrder(id, updateData);
    
    console.log('✅ Quantità aggiornate con successo:', {
      id: pickupOrder.id,
      quantities: {
        expectedQuantity: pickupOrder.expectedQuantity,
        actualQuantity: pickupOrder.actualQuantity,
        destinationQuantity: pickupOrder.destinationQuantity,
        departureWeight: pickupOrder.departureWeight,
        arrivalWeight: pickupOrder.arrivalWeight,
        loadedPackages: pickupOrder.loadedPackages
      }
    });
    
    res.status(200).json(pickupOrder);
  } catch (error) {
    console.error(`❌ Errore nell'aggiornamento quantità buono di ritiro ID ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Ottieni statistiche sui buoni di ritiro
 */
export const getPickupOrderStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('📊 Richiesta statistiche buoni di ritiro');
    
    const allOrders = await pickupOrderService.findAllPickupOrders();
    
    const stats = {
      total: allOrders.length,
      byStatus: {} as Record<string, number>,
      byMonth: {} as Record<string, number>,
      totalQuantity: 0,
      totalDistance: 0,
      recentOrders: allOrders.slice(0, 5).map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        issueDate: order.issueDate,
        logisticSender: order.logisticSender?.name,
        logisticRecipient: order.logisticRecipient?.name
      }))
    };
    
    // Calcola statistiche
    for (const order of allOrders) {
      // Conteggio per stato
      stats.byStatus[order.status] = (stats.byStatus[order.status] || 0) + 1;
      
      // Conteggio per mese
      const month = new Date(order.issueDate).toISOString().slice(0, 7);
      stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
      
      // Somma quantità e distanze
      if (order.actualQuantity) stats.totalQuantity += order.actualQuantity;
      else if (order.expectedQuantity) stats.totalQuantity += order.expectedQuantity;
      
      if (order.distanceKm) stats.totalDistance += order.distanceKm;
    }
    
    console.log('✅ Statistiche calcolate:', {
      totalOrders: stats.total,
      statusDistribution: stats.byStatus,
      totalQuantity: stats.totalQuantity,
      totalDistance: stats.totalDistance
    });
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('❌ Errore nel calcolo statistiche buoni di ritiro:', error);
    next(error);
  }
};