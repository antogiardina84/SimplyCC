// server/src/modules/inventory/routes/index.ts - VERSIONE INTEGRATA
import { Router } from 'express';
import * as inventoryController from '../controllers';
import * as inventoryService from '../services/inventory.service';
import { authMiddleware } from '../../../core/middleware/auth.middleware';

const router = Router();

// Middleware di autenticazione per tutte le routes
router.use(authMiddleware);

// ================================
// ROUTES CRUD STANDARD
// ================================

/**
 * @route GET /inventory
 * @desc Ottieni tutti i movimenti di giacenza con filtri opzionali
 * @query startDate, endDate, materialTypeId
 */
router.get('/', inventoryController.getAllInventory);

/**
 * @route GET /inventory/:id
 * @desc Ottieni movimento di giacenza per ID
 */
router.get('/:id', inventoryController.getInventoryById);

/**
 * @route POST /inventory
 * @desc Crea nuovo movimento di giacenza (con calcolo automatico)
 */
router.post('/', inventoryController.createInventory);

/**
 * @route PUT /inventory/:id
 * @desc Aggiorna movimento di giacenza
 */
router.put('/:id', inventoryController.updateInventory);

/**
 * @route DELETE /inventory/:id
 * @desc Elimina movimento di giacenza
 */
router.delete('/:id', inventoryController.deleteInventory);

// ================================
// ROUTES PER CALCOLO AUTOMATICO
// ================================

/**
 * @route GET /inventory/calculate/movements/:materialTypeId/:date
 * @desc Calcola movimenti automatici per materiale e data
 * @params materialTypeId - ID del tipo materiale
 * @params date - Data in formato YYYY-MM-DD
 */
router.get('/calculate/movements/:materialTypeId/:date', inventoryController.calculateAutomaticMovements);

/**
 * @route GET /inventory/calculate/stock/:materialTypeId/:date
 * @desc Calcola giacenza di un materiale a una data specifica
 * @params materialTypeId - ID del tipo materiale
 * @params date - Data in formato YYYY-MM-DD
 */
router.get('/calculate/stock/:materialTypeId/:date', inventoryController.calculateStockAtDate);

/**
 * @route POST /inventory/recalculate/:materialTypeId
 * @desc Ricalcola tutte le giacenze per un materiale
 * @params materialTypeId - ID del tipo materiale
 */
router.post('/recalculate/:materialTypeId', inventoryController.recalculateInventoryForMaterial);

/**
 * @route POST /inventory/auto-create/:date
 * @desc Crea automaticamente movimenti per tutti i materiali di una data
 * @params date - Data in formato YYYY-MM-DD
 */
router.post('/auto-create/:date', inventoryController.autoCreateInventoryForDate);

// ================================
// ROUTES PER DISPONIBILITÀ STOCK
// ================================

/**
 * @route GET /inventory/stock/availability
 * @desc Ottieni disponibilità stock corrente per tutti i materiali
 */
router.get('/stock/availability', inventoryController.getCurrentStockAvailability);

/**
 * @route GET /inventory/stock/latest/:materialTypeId
 * @desc Ottieni ultima giacenza per materiale
 * @params materialTypeId - ID del tipo materiale
 */
router.get('/stock/latest/:materialTypeId', inventoryController.getLatestStockByMaterial);

// ================================
// ROUTES PER STATISTICHE E REPORT
// ================================

/**
 * @route GET /inventory/stats
 * @desc Ottieni statistiche giacenze
 */
router.get('/stats', inventoryController.getInventoryStats);

/**
 * @route GET /inventory/report
 * @desc Genera report giacenze
 * @query startDate, endDate, materialTypeId
 */
router.get('/report', inventoryController.getInventoryReport);

/**
 * @route GET /inventory/dashboard
 * @desc Ottieni dati per dashboard giacenze
 */
router.get('/dashboard', inventoryController.getInventoryDashboard);

// ================================
// ROUTES LEGACY (COMPATIBILITÀ)
// ================================

/**
 * @route GET /inventory/latest/:materialType/:reference
 * @desc [DEPRECATED] Ottieni ultima giacenza per materiale (legacy)
 */
router.get('/latest/:materialType/:reference', async (req, res) => {
  try {
    const { materialType, reference } = req.params;
    
    // Trova materialTypeId dal codice legacy
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const materialTypeRecord = await prisma.materialType.findFirst({
      where: {
        OR: [
          { code: materialType },
          { reference: reference },
        ],
      },
    });

    if (!materialTypeRecord) {
      res.status(404).json({
        success: false,
        message: 'Tipo materiale non trovato',
      });
      return;
    }

    // Chiama direttamente il service invece del controller
    const latestStock = await inventoryService.findLatestInventoryByMaterialType(materialTypeRecord.id);
    
    res.status(200).json({
      success: true,
      data: latestStock,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nella compatibilità legacy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
