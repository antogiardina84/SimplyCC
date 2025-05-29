// server/src/modules/pickupOrders/routes/index.ts
import { Router } from 'express';
import { authMiddleware } from '../../../core/middleware/auth.middleware';
import * as pickupOrderController from '../controllers';
import { ocrRoutes } from './ocrRoutes';

const router = Router();

// Proteggi tutte le route con autenticazione
router.use(authMiddleware);

// Routes OCR
router.use('/ocr', ocrRoutes);

// Routes standard CRUD
router.get('/', pickupOrderController.getAllPickupOrders);
router.get('/:id', pickupOrderController.getPickupOrderById);
router.get('/basin/:basinId', pickupOrderController.getPickupOrdersByBasin);
router.get('/client/:clientId', pickupOrderController.getPickupOrdersByClient);
router.post('/', pickupOrderController.createPickupOrder);
router.put('/:id', pickupOrderController.updatePickupOrder);
router.delete('/:id', pickupOrderController.deletePickupOrder);

export const pickupOrderRoutes = router;