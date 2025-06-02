// server/src/modules/pickupOrders/routes/ocrRoutes.ts

import { Router } from 'express';
import { OCRController, uploadMiddleware } from '../controllers/ocrController';
import { authMiddleware } from '../../../core/middleware/auth.middleware';
import { ocrLogisticsRoutes } from './ocrLogistics.routes';  // <-- SOLO AGGIUNTA

const router = Router();
const ocrController = new OCRController();

// Proteggi tutte le route con autenticazione
router.use(authMiddleware);

/**
 * POST /api/pickup-orders/ocr/extract
 * Estrae i dati da un PDF e restituisce i dati estratti per la revisione
 */
router.post('/extract', uploadMiddleware, ocrController.extractFromPDF);

/**
 * POST /api/pickup-orders/ocr/create
 * Crea un buono di ritiro dai dati estratti, con possibilità di correzioni manuali
 */
router.post('/create', ocrController.createFromExtractedData);

/**
 * POST /api/pickup-orders/ocr/process
 * Processo completo: estrai dal PDF e crea automaticamente il buono di ritiro
 */
router.post('/process', uploadMiddleware, ocrController.processAndCreate);

// ================================
// NUOVE ROUTES LOGISTICS (SOLO AGGIUNTA!)
// ================================

/**
 * Routes per integrazione OCR + Logistics
 * Percorso: /pickup-orders/ocr/logistics/*
 * 
 * QUESTE SONO NUOVE ROUTES CHE NON MODIFICANO IL COMPORTAMENTO ESISTENTE
 */
router.use('/logistics', ocrLogisticsRoutes);  // <-- SOLO AGGIUNTA

export { router as ocrRoutes };