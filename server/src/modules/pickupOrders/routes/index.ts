// server/src/modules/pickupOrders/routes/index.ts - VERSIONE CORRETTA

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../../core/middleware/auth.middleware';
import * as pickupOrderController from '../controllers';
import { ocrRoutes } from './ocrRoutes';
import { workflowRoutes } from './workflow.routes';

const router = Router();

// Proteggi tutte le route con autenticazione
router.use(authMiddleware);

// ================================
// ROUTES SPECIALI
// ================================

/**
 * GET /pickup-orders/unscheduled - Ordini non ancora programmati
 * Restituisce tutti i buoni di ritiro con stato DA_EVADERE
 */
router.get('/unscheduled', async (req, res, next) => {
  try {
    const prisma = new PrismaClient();

    try {
      const unscheduledOrders = await prisma.pickupOrder.findMany({
        where: {
          status: 'DA_EVADERE'
        },
        include: {
          basin: {
            include: {
              client: true
            }
          },
          logisticSender: true,
          logisticRecipient: true
        },
        orderBy: {
          issueDate: 'desc'
        }
      });

      // Trasforma per il frontend con tipizzazione corretta
      const transformedOrders = unscheduledOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        issueDate: order.issueDate,
        basin: {
          code: order.basin?.code || '',
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
        expectedQuantity: order.expectedQuantity
      }));

      res.status(200).json(transformedOrders);
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    next(error);
  }
});

// === ROUTES OCR ===
router.use('/ocr', ocrRoutes);

// ================================
// ROUTES WORKFLOW - DEVONO ESSERE PRIMA DEI PARAMETRICI!
// ================================
router.use('/:id/workflow', workflowRoutes);

// ================================
// ROUTES STANDARD CRUD
// ================================

/**
 * GET /pickup-orders - Lista tutti i buoni di ritiro
 */
router.get('/', pickupOrderController.getAllPickupOrders);

/**
 * GET /pickup-orders/:id - Dettaglio buono di ritiro
 */
router.get('/:id', pickupOrderController.getPickupOrderById);

/**
 * GET /pickup-orders/basin/:basinId - Buoni per bacino
 */
router.get('/basin/:basinId', pickupOrderController.getPickupOrdersByBasin);

/**
 * GET /pickup-orders/client/:clientId - Buoni per cliente
 */
router.get('/client/:clientId', pickupOrderController.getPickupOrdersByClient);

/**
 * POST /pickup-orders - Crea nuovo buono di ritiro
 */
router.post('/', pickupOrderController.createPickupOrder);

/**
 * PUT /pickup-orders/:id - Aggiorna buono di ritiro
 */
router.put('/:id', pickupOrderController.updatePickupOrder);

/**
 * DELETE /pickup-orders/:id - Elimina buono di ritiro
 */
router.delete('/:id', pickupOrderController.deletePickupOrder);

export const pickupOrderRoutes = router;