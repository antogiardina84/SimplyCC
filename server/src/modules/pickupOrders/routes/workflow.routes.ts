// server/src/modules/pickupOrders/routes/workflow.routes.ts - VERSIONE CORRETTA

import { Router } from 'express';
import { authMiddleware, checkRole } from '../../../core/middleware/auth.middleware';
import * as workflowController from '../controllers/workflow.controller';

const router = Router({ mergeParams: true }); // IMPORTANTE: mergeParams per accedere a :id

// Proteggi tutte le route con autenticazione
router.use(authMiddleware);

// === ROUTES GENERALI (senza ID) ===

/**
 * GET /api/pickup-orders/workflow/stats
 * Ottiene statistiche del workflow
 */
router.get('/stats', workflowController.getWorkflowStats);

/**
 * GET /api/pickup-orders/workflow/operators/available
 * Ottiene lista operatori disponibili
 */
router.get('/operators/available', workflowController.getAvailableOperators);

/**
 * GET /api/pickup-orders/workflow/today
 * Ottiene ordini programmati per oggi
 */
router.get('/today', workflowController.getTodayScheduled);

/**
 * GET /api/pickup-orders/workflow/my-orders
 * Ottiene ordini assegnati all'operatore corrente
 */
router.get('/my-orders', checkRole(['OPERATOR', 'MANAGER', 'ADMIN']), workflowController.getMyOrders);

// === ROUTES SPECIFICHE PER ORDINE (con ID da mergeParams) ===

/**
 * GET /api/pickup-orders/:id/workflow/history
 * Ottiene storico completo di un buono di ritiro
 */
router.get('/history', workflowController.getOrderHistory);

/**
 * POST /api/pickup-orders/:id/workflow/change-status
 * Cambia lo stato generico di un buono di ritiro
 */
router.post('/change-status', checkRole(['MANAGER', 'ADMIN']), workflowController.changeStatus);

// === TRANSIZIONI SPECIFICHE ===

/**
 * POST /api/pickup-orders/:id/workflow/schedule
 * Programma un buono di ritiro (DA_EVADERE → PROGRAMMATO)
 */
router.post('/schedule', checkRole(['MANAGER', 'ADMIN']), workflowController.schedulePickupOrder);

/**
 * POST /api/pickup-orders/:id/workflow/start-evading
 * Avvia evasione (PROGRAMMATO → IN_EVASIONE)
 */
router.post('/start-evading', checkRole(['MANAGER', 'ADMIN']), workflowController.startEvading);

/**
 * POST /api/pickup-orders/:id/workflow/assign-operator
 * Assegna operatore (IN_EVASIONE → IN_CARICO)
 */
router.post('/assign-operator', checkRole(['OPERATOR', 'MANAGER', 'ADMIN']), workflowController.assignOperator);

/**
 * POST /api/pickup-orders/:id/workflow/complete-loading
 * Completa carico (IN_CARICO → CARICATO)
 */
router.post('/complete-loading', checkRole(['OPERATOR', 'MANAGER', 'ADMIN']), workflowController.completeLoading);

/**
 * POST /api/pickup-orders/:id/workflow/finalize-shipment
 * Finalizza spedizione (CARICATO → SPEDITO)
 */
router.post('/finalize-shipment', checkRole(['MANAGER', 'ADMIN']), workflowController.finalizeShipment);

/**
 * POST /api/pickup-orders/:id/workflow/complete-order
 * Completa ordine (SPEDITO → COMPLETO)
 */
router.post('/complete-order', checkRole(['MANAGER', 'ADMIN']), workflowController.completeOrder);

// === TRANSIZIONI INVERSE (NUOVE!) ===

/**
 * POST /api/pickup-orders/:id/workflow/rollback-to-programmed
 * Rollback a PROGRAMMATO (da IN_EVASIONE)
 */
router.post('/rollback-to-programmed', checkRole(['MANAGER', 'ADMIN']), workflowController.rollbackToProgrammed);

/**
 * POST /api/pickup-orders/:id/workflow/rollback-to-evading
 * Rollback a IN_EVASIONE (da IN_CARICO)
 */
router.post('/rollback-to-evading', checkRole(['MANAGER', 'ADMIN']), workflowController.rollbackToEvading);

/**
 * POST /api/pickup-orders/:id/workflow/rollback-to-loading
 * Rollback a IN_CARICO (da CARICATO)
 */
router.post('/rollback-to-loading', checkRole(['MANAGER', 'ADMIN']), workflowController.rollbackToLoading);

/**
 * POST /api/pickup-orders/:id/workflow/rollback-to-loaded
 * Rollback a CARICATO (da SPEDITO)
 */
router.post('/rollback-to-loaded', checkRole(['MANAGER', 'ADMIN']), workflowController.rollbackToLoaded);

// === ATTIVITÀ OPERATORI ===

/**
 * POST /api/pickup-orders/:id/workflow/activity
 * Registra attività operatore
 */
router.post('/activity', checkRole(['OPERATOR', 'MANAGER', 'ADMIN']), workflowController.recordActivity);

export { router as workflowRoutes };