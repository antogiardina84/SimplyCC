// server/src/modules/inventory/routes/index.ts

import { Router } from 'express';
import { authMiddleware } from '../../../core/middleware/auth.middleware';
import * as inventoryController from '../controllers';

const router = Router();

// Applica il middleware di autenticazione a tutte le rotte
router.use(authMiddleware);

// GET /api/inventory - Ottieni tutti i movimenti di giacenza (con filtri opzionali)
router.get('/', inventoryController.getAllInventory);

// GET /api/inventory/stats - Ottieni statistiche delle giacenze
router.get('/stats', inventoryController.getInventoryStats);

// GET /api/inventory/report - Genera report giacenze
router.get('/report', inventoryController.getInventoryReport);

// GET /api/inventory/latest/:materialType/:reference - Ottieni ultima giacenza per materiale
router.get('/latest/:materialType/:reference', inventoryController.getLatestStockByMaterial);

// GET /api/inventory/:id - Ottieni un movimento specifico
router.get('/:id', inventoryController.getInventoryById);

// POST /api/inventory - Crea un nuovo movimento di giacenza
router.post('/', inventoryController.createInventory);

// PUT /api/inventory/:id - Aggiorna un movimento di giacenza
router.put('/:id', inventoryController.updateInventory);

// DELETE /api/inventory/:id - Elimina un movimento di giacenza
router.delete('/:id', inventoryController.deleteInventory);

export default router;