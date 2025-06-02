// server/src/modules/shipments/routes/logistics.routes.ts

import { Router } from 'express';
import { authMiddleware } from '../../../core/middleware/auth.middleware';
import * as logisticsController from '../controllers/logistics.controller';

const router = Router();

// Proteggi tutte le route con autenticazione
router.use(authMiddleware);

// ================================
// ROUTES PUBBLICHE (Lettura)
// ================================

// Lista completa con filtri
router.get('/', logisticsController.getAllLogisticEntities);

// Entità per tipo specifico (per dropdown, etc.)
router.get('/type/:type', logisticsController.getLogisticEntitiesByType);

// Statistiche (per dashboard)
router.get('/stats', logisticsController.getLogisticEntityStats);

// Suggerimenti per autocomplete
router.get('/suggestions', logisticsController.getLogisticEntitySuggestions);

// Ricerca per OCR matching
router.get('/search-ocr', logisticsController.searchLogisticEntitiesForOCR);

// Dettaglio entità specifica
router.get('/:id', logisticsController.getLogisticEntityById);

// ================================
// ROUTES OPERATIVE (Scrittura)
// ================================

// Crea nuova entità
router.post('/', logisticsController.createLogisticEntity);

// Aggiorna entità esistente
router.put('/:id', logisticsController.updateLogisticEntity);

// Disattiva entità (soft delete)
router.delete('/:id', logisticsController.deleteLogisticEntity);

// Riattiva entità disattivata
router.patch('/:id/reactivate', logisticsController.reactivateLogisticEntity);

export const logisticsRoutes = router;