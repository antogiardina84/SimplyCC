// server/src/modules/shipments/routes/index.ts

import { Router } from 'express';
import { authMiddleware, checkRole } from '../../../core/middleware/auth.middleware';
import * as shipmentController from '../controllers/index';

const router = Router();

// Protezione di tutte le routes con autenticazione
router.use(authMiddleware);

// ================================
// ROUTES LETTURA (Tutti gli utenti autenticati)
// ================================

/**
 * GET /shipments - Ottiene tutte le spedizioni con filtri
 * Query params: ?date=2025-06-01&status=PROGRAMMATO&priority=HIGH
 */
router.get('/', shipmentController.getAllShipments);

/**
 * GET /shipments/stats - Statistiche spedizioni
 * Query params: ?startDate=2025-06-01&endDate=2025-06-30
 */
router.get('/stats', checkRole(['MANAGER', 'ADMIN']), shipmentController.getShipmentStats);

/**
 * GET /shipments/operators - Operatori disponibili
 * Query params: ?date=2025-06-01
 */
router.get('/operators', shipmentController.getAvailableOperators);

/**
 * GET /shipments/operator-dashboard - Dashboard operatore
 * Restituisce ordini per la dashboard operatore divisi per stato
 * Accessibile a: OPERATOR, MANAGER, ADMIN
 */
router.get('/operator-dashboard', checkRole(['OPERATOR', 'MANAGER', 'ADMIN']), shipmentController.getOperatorDashboard);

/**
 * GET /shipments/date/:date - Spedizioni per data specifica
 * Params: date (YYYY-MM-DD)
 */
router.get('/date/:date', shipmentController.getShipmentsByDate);

/**
 * GET /shipments/date-range - Spedizioni per range di date
 * Query params: ?startDate=2025-06-01&endDate=2025-06-07
 */
router.get('/date-range', shipmentController.getShipmentsByDateRange);

/**
 * GET /shipments/planning/:date - Planning giornaliero
 * Params: date (YYYY-MM-DD)
 */
router.get('/planning/:date', shipmentController.getDailyPlanning);

/**
 * GET /shipments/:id - Dettaglio spedizione specifica
 * Params: id (UUID spedizione)
 */
router.get('/:id', shipmentController.getShipmentById);

// ================================
// ROUTES SCRITTURA - Programmazione (Manager/Admin)
// ================================

/**
 * POST /shipments - Programma nuova spedizione
 * Body: CreateShipmentData
 * DA_EVADERE → PROGRAMMATO
 */
router.post('/', checkRole(['MANAGER', 'ADMIN']), shipmentController.scheduleShipment);

/**
 * PUT /shipments/:id - Aggiorna spedizione programmata
 * Params: id (UUID spedizione)
 * Body: UpdateShipmentData
 */
router.put('/:id', checkRole(['MANAGER', 'ADMIN']), shipmentController.updateShipment);

/**
 * DELETE /shipments/:id - Cancella spedizione
 * Params: id (UUID spedizione)
 * Body: { reason: string }
 */
router.delete('/:id', checkRole(['MANAGER', 'ADMIN']), shipmentController.cancelShipment);

// ================================
// ROUTES WORKFLOW - Gestione Stati
// ================================

/**
 * POST /shipments/:id/start - Avvia spedizione
 * PROGRAMMATO → IN_EVASIONE
 * Accessibile a: MANAGER, ADMIN
 */
router.post('/:id/start', checkRole(['MANAGER', 'ADMIN']), shipmentController.startShipment);

/**
 * POST /shipments/:id/assign - Assegna operatore
 * IN_EVASIONE → IN_CARICO
 * Body: { operatorId: string }
 * Accessibile a: MANAGER, ADMIN
 */
router.post('/:id/assign', checkRole(['MANAGER', 'ADMIN']), shipmentController.assignOperator);

/**
 * POST /shipments/:id/start-loading - Alias per auto-assegnazione operatore
 * IN_EVASIONE → IN_CARICO (con auto-assegnazione dell'operatore corrente)
 * Accessibile a: OPERATOR, MANAGER, ADMIN
 */
router.post('/:id/start-loading', checkRole(['OPERATOR', 'MANAGER', 'ADMIN']), shipmentController.startLoadingWithAutoAssign);

/**
 * POST /shipments/:id/complete-loading - Completa carico
 * IN_CARICO → CARICATO
 * Body: { packageCount?: number, photos?: string, videos?: string, notes?: string }
 * Accessibile a: OPERATOR, MANAGER, ADMIN (solo operatore assegnato)
 */
router.post('/:id/complete-loading', checkRole(['OPERATOR', 'MANAGER', 'ADMIN']), shipmentController.completeLoading);

/**
 * POST /shipments/:id/finalize - Finalizza spedizione
 * CARICATO → SPEDITO
 * Body: { departureWeight: number, notes?: string }
 * Accessibile a: MANAGER, ADMIN
 */
router.post('/:id/finalize', checkRole(['MANAGER', 'ADMIN']), shipmentController.finalizeShipment);

/**
 * POST /shipments/:id/confirm-arrival - Conferma arrivo
 * SPEDITO → COMPLETO
 * Body: { arrivalWeight?: number, isRejected?: boolean, rejectionReason?: string }
 * Accessibile a: MANAGER, ADMIN
 */
router.post('/:id/confirm-arrival', checkRole(['MANAGER', 'ADMIN']), shipmentController.confirmArrival);

export const shipmentRoutes = router;