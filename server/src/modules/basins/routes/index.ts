// server/src/modules/basins/routes/index.ts

import { Router } from 'express';
import { authMiddleware } from '../../../core/middleware/auth.middleware';
import * as basinController from '../controllers/index';

const router = Router();

// Proteggi tutte le route con autenticazione
router.use(authMiddleware);

// Routes CRUD principali
router.get('/', basinController.getAllBasins);
router.get('/stats', basinController.getBasinStats);
router.get('/search', basinController.searchBasinsByCode);
router.get('/check-code', basinController.checkBasinCodeAvailability);
router.get('/client/:clientId', basinController.getBasinsByClient);
router.get('/:id', basinController.getBasinById);
router.post('/', basinController.createBasin);
router.put('/:id', basinController.updateBasin);
router.delete('/:id', basinController.deleteBasin);

export { router as basinRoutes };