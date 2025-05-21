// server/src/modules/basins/routes/index.ts

import { Router } from 'express';
import { getAllBasins, getBasinsByClientId, getBasinById, createBasin, updateBasin, deleteBasin } from '../controllers';
import { authMiddleware, checkRole } from '../../../core/middleware/auth.middleware';

const router = Router();

// Protezione delle route con autenticazione
router.use(authMiddleware);

// Route accessibili a tutti gli utenti autenticati
router.get('/', getAllBasins);
router.get('/client/:clientId', getBasinsByClientId);
router.get('/:id', getBasinById);

// Route accessibili solo a manager e admin
router.post('/', checkRole(['ADMIN', 'MANAGER']), createBasin);
router.put('/:id', checkRole(['ADMIN', 'MANAGER']), updateBasin);
router.delete('/:id', checkRole(['ADMIN', 'MANAGER']), deleteBasin);

export const basinRoutes = router;