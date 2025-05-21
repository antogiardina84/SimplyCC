// server/src/modules/pickupOrders/routes/index.ts

import { Router } from 'express';
import { getAllPickupOrders, getPickupOrderById, getPickupOrdersByBasin, getPickupOrdersByClient, 
  createPickupOrder, updatePickupOrder, deletePickupOrder } from '../controllers';
import { authMiddleware, checkRole } from '../../../core/middleware/auth.middleware';

const router = Router();

// Protezione delle route con autenticazione
router.use(authMiddleware);

// Route accessibili a tutti gli utenti autenticati
router.get('/', getAllPickupOrders);
router.get('/:id', getPickupOrderById);
router.get('/basin/:basinId', getPickupOrdersByBasin);
router.get('/client/:clientId', getPickupOrdersByClient);

// Route accessibili solo a manager e admin
router.post('/', checkRole(['ADMIN', 'MANAGER', 'OPERATOR']), createPickupOrder);
router.put('/:id', checkRole(['ADMIN', 'MANAGER', 'OPERATOR']), updatePickupOrder);
router.delete('/:id', checkRole(['ADMIN', 'MANAGER']), deletePickupOrder);

export const pickupOrderRoutes = router;