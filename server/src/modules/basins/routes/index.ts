// server/src/modules/basins/routes/index.ts

import { Router } from 'express';
import { authMiddleware, checkRole } from '../../../core/middleware/auth.middleware';
import * as basinController from '../controllers/index';

const router = Router();

// Proteggi tutte le route con autenticazione
router.use(authMiddleware);

// Route pubbliche (per tutti gli utenti autenticati)
router.get('/', basinController.getAllBasins);
router.get('/stats', checkRole(['ADMIN', 'MANAGER']), basinController.getBasinStats);
router.get('/search', basinController.searchBasinsByCode);

// Route per controllo disponibilità codice
router.get('/check-code/:code', basinController.checkBasinCodeAvailability);

// Route per ottenere bacini per cliente - QUESTA ERA MANCANTE!
router.get('/client/:clientId', basinController.getBasinsByClient);

// Route specifica per ID (deve essere dopo le route con path fissi)
router.get('/:id', basinController.getBasinById);

// Route amministrative (solo per manager e admin)
router.post('/', checkRole(['ADMIN', 'MANAGER']), basinController.createBasin);
router.put('/:id', checkRole(['ADMIN', 'MANAGER']), basinController.updateBasin);

// Route eliminazione (solo admin)
router.delete('/:id', checkRole(['ADMIN']), basinController.deleteBasin);

export { router as basinRoutes };