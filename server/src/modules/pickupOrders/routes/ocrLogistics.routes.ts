// server/src/modules/pickupOrders/routes/ocrLogistics.routes.ts

import { Router } from 'express';
import { authMiddleware } from '../../../core/middleware/auth.middleware';
import * as ocrLogisticsController from '../controllers/ocrLogistics.controller';

const router = Router();

// Proteggi tutte le route con autenticazione
router.use(authMiddleware);

// ================================
// NUOVE ROUTES PER INTEGRAZIONE OCR + LOGISTICS
// ================================

/**
 * POST /pickup-orders/ocr/logistics/suggestions
 * 
 * Ottiene suggerimenti di entità logistiche basati sui dati estratti dall'OCR
 * 
 * Body: {
 *   senderName?: string,
 *   recipientName?: string,
 *   transporterName?: string
 * }
 * 
 * Response: LogisticMatchingResponse con suggerimenti e livello di confidenza
 */
router.post('/suggestions', ocrLogisticsController.getLogisticSuggestions);

/**
 * POST /pickup-orders/ocr/logistics/auto-create
 * 
 * Crea automaticamente entità logistiche dai dati OCR se non esistono
 * 
 * Body: {
 *   senderName: string,
 *   senderAddress?: string,
 *   senderCity?: string,
 *   senderEmail?: string,
 *   senderPhone?: string,
 *   recipientName: string,
 *   recipientAddress?: string,
 *   recipientCity?: string,
 *   recipientEmail?: string,
 *   recipientPhone?: string
 * }
 * 
 * Response: { success: boolean, createdEntities: {...}, message: string }
 */
router.post('/auto-create', ocrLogisticsController.createLogisticEntitiesFromOCR);

export const ocrLogisticsRoutes = router;