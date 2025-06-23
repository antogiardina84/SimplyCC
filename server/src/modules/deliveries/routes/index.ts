// server/src/modules/deliveries/routes/index.ts - FIXED ROUTE ORDER

import { Router } from 'express';
import { authMiddleware } from '../../../core/middleware/auth.middleware';
import * as deliveriesController from '../controllers';

const router = Router();

// Proteggi tutte le route con autenticazione
router.use(authMiddleware);

// ================================
// ROUTES CONFERIMENTI
// ================================

// Conferimenti base
router.get('/deliveries', deliveriesController.getAllDeliveries);
router.get('/deliveries/:id', deliveriesController.getDeliveryById);
router.post('/deliveries', deliveriesController.createDelivery);
router.put('/deliveries/:id', deliveriesController.updateDelivery);
router.delete('/deliveries/:id', deliveriesController.deleteDelivery);
router.patch('/deliveries/:id/validate', deliveriesController.validateDelivery);

// ================================
// ROUTES CALENDARIO - ORDINE CORRETTO!
// ================================

// IMPORTANTE: La route più specifica DEVE venire prima di quella generica
// /calendar/day/:date DEVE venire PRIMA di /calendar/:year/:month

router.get('/calendar/day/:date', deliveriesController.getDayDeliveries);
router.get('/calendar/:year/:month', deliveriesController.getMonthlyCalendar);

// ================================
// ROUTES CONFERITORI
// ================================

// Conferitori base
router.get('/contributors', deliveriesController.getAllContributors);
router.get('/contributors/:id', deliveriesController.getContributorById);
router.post('/contributors', deliveriesController.createContributor);
router.put('/contributors/:id', deliveriesController.updateContributor);
router.delete('/contributors/:id', deliveriesController.deleteContributor);

// Conferitori per tipologia materiale
router.get('/contributors/by-material/:materialTypeCode', deliveriesController.getContributorsByMaterialType);

// Statistiche conferitori
router.get('/contributors/:id/statistics', deliveriesController.getContributorStatistics);

// ================================
// ROUTES TIPOLOGIE MATERIALI
// ================================

// Tipologie materiali base
router.get('/material-types', deliveriesController.getAllMaterialTypes);
router.get('/material-types/hierarchy', deliveriesController.getHierarchicalMaterialTypes);
router.get('/material-types/:id', deliveriesController.getMaterialTypeById);
router.get('/material-types/code/:code', deliveriesController.getMaterialTypeByCode);
router.post('/material-types', deliveriesController.createMaterialType);
router.put('/material-types/:id', deliveriesController.updateMaterialType);
router.delete('/material-types/:id', deliveriesController.deleteMaterialType);

// Statistiche tipologie materiali
router.get('/material-types/:id/statistics', deliveriesController.getMaterialTypeStatistics);

export const deliveriesRoutes = router;