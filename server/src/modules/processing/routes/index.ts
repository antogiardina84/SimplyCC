// server/src/modules/processing/routes/index.ts

import { Router } from 'express';
import { authMiddleware } from '../../../core/middleware/auth.middleware';
import * as processingController from '../controllers';

const router = Router();

// Applica il middleware di autenticazione a tutte le rotte
router.use(authMiddleware);

// GET /api/processing - Ottieni tutte le lavorazioni (con filtri opzionali)
router.get('/', processingController.getAllProcessing);

// GET /api/processing/stats - Ottieni statistiche delle lavorazioni
router.get('/stats', processingController.getProcessingStats);

// GET /api/processing/:id - Ottieni una lavorazione specifica
router.get('/:id', processingController.getProcessingById);

// POST /api/processing - Crea una nuova lavorazione
router.post('/', processingController.createProcessing);

// PUT /api/processing/:id - Aggiorna una lavorazione
router.put('/:id', processingController.updateProcessing);

// DELETE /api/processing/:id - Elimina una lavorazione
router.delete('/:id', processingController.deleteProcessing);

export default router;