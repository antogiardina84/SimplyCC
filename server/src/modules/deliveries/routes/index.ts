// server/src/modules/deliveries/routes/index.ts - VERSIONE CORRETTA CON AUTH

import { Router } from 'express';
import { authMiddleware } from '../../../core/middleware/auth.middleware';
import * as deliveriesController from '../controllers';

const router = Router();

// ✅ AUTENTICAZIONE RIABILITATA
router.use(authMiddleware);

console.log('🔧 Initializing deliveries routes...');

// ================================
// 🔧 ENDPOINT DI TEST E DEBUG (SOLO SE NECESSARIO)
// ================================

router.get('/test', (req, res) => {
  console.log('🧪 Test endpoint raggiunto!');
  res.json({
    message: '✅ Deliveries routes funzionanti!',
    timestamp: new Date().toISOString(),
    requestUrl: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /api/test',
      'GET /api/material-types',
      'GET /api/contributors',
      'GET /api/calendar/:year/:month',
      'GET /api/deliveries/by-date'
    ]
  });
});

// ================================
// ROUTES TIPOLOGIE MATERIALI - PRIORITÀ MASSIMA
// ================================

console.log('🗂️ Setting up material types routes...');

// ⚠️ ORDINE CRITICO: routes specifiche PRIMA di quelle con parametri
router.get('/material-types/hierarchy', (req, res, next) => {
  console.log('📍 Route: GET /material-types/hierarchy');
  deliveriesController.getHierarchicalMaterialTypes(req, res, next);
});

router.get('/material-types/code/:code', (req, res, next) => {
  console.log('📍 Route: GET /material-types/code/:code with code:', req.params.code);
  deliveriesController.getMaterialTypeByCode(req, res, next);
});

router.get('/material-types/:id/statistics', (req, res, next) => {
  console.log('📍 Route: GET /material-types/:id/statistics with id:', req.params.id);
  deliveriesController.getMaterialTypeStatistics(req, res, next);
});

router.get('/material-types/:id', (req, res, next) => {
  console.log('📍 Route: GET /material-types/:id with id:', req.params.id);
  deliveriesController.getMaterialTypeById(req, res, next);
});

// 🚨 ROUTE CRITICA: /material-types (con logging dettagliato)
router.get('/material-types', (req, res, next) => {
  console.log('📍 Route: GET /material-types');
  console.log('📍 Query params:', req.query);
  console.log('📍 Full URL:', req.originalUrl);
  
  try {
    deliveriesController.getAllMaterialTypes(req, res, next);
  } catch (error) {
    console.error('❌ Error in getAllMaterialTypes route:', error);
    next(error);
  }
});

router.post('/material-types', (req, res, next) => {
  console.log('📍 Route: POST /material-types');
  deliveriesController.createMaterialType(req, res, next);
});

router.put('/material-types/:id', (req, res, next) => {
  console.log('📍 Route: PUT /material-types/:id with id:', req.params.id);
  deliveriesController.updateMaterialType(req, res, next);
});

router.delete('/material-types/:id', (req, res, next) => {
  console.log('📍 Route: DELETE /material-types/:id with id:', req.params.id);
  deliveriesController.deleteMaterialType(req, res, next);
});

// ================================
// ROUTES CONFERITORI (CONTRIBUTORS)
// ================================

console.log('👥 Setting up contributors routes...');

router.get('/contributors/by-material/:materialTypeCode', (req, res, next) => {
  console.log('📍 Route: GET /contributors/by-material/:materialTypeCode');
  deliveriesController.getContributorsByMaterialType(req, res, next);
});

router.get('/contributors/:id/statistics', (req, res, next) => {
  console.log('📍 Route: GET /contributors/:id/statistics');
  deliveriesController.getContributorStatistics(req, res, next);
});

router.get('/contributors/:id', (req, res, next) => {
  console.log('📍 Route: GET /contributors/:id');
  deliveriesController.getContributorById(req, res, next);
});

router.get('/contributors', (req, res, next) => {
  console.log('📍 Route: GET /contributors');
  deliveriesController.getAllContributors(req, res, next);
});

router.post('/contributors', (req, res, next) => {
  console.log('📍 Route: POST /contributors');
  deliveriesController.createContributor(req, res, next);
});

router.put('/contributors/:id', (req, res, next) => {
  console.log('📍 Route: PUT /contributors/:id');
  deliveriesController.updateContributor(req, res, next);
});

router.delete('/contributors/:id', (req, res, next) => {
  console.log('📍 Route: DELETE /contributors/:id');
  deliveriesController.deleteContributor(req, res, next);
});

// ================================
// ROUTES CALENDARIO
// ================================

console.log('📅 Setting up calendar routes...');

// ⚠️ ORDINE CRITICO: route specifica PRIMA di quella generica
router.get('/calendar/:year/:month', (req, res, next) => {
  console.log('📍 Route: GET /calendar/:year/:month');
  console.log('📍 Params:', req.params);
  deliveriesController.getMonthlyCalendar(req, res, next);
});

// ================================
// ROUTES CONFERIMENTI - ORDINE CORRETTO
// ================================

console.log('📦 Setting up deliveries routes...');

// Routes specifiche PRIMA di quelle generiche
router.get('/deliveries/by-date', (req, res, next) => {
  console.log('📍 Route: GET /deliveries/by-date');
  console.log('📍 Query params:', req.query);
  deliveriesController.getDayDeliveries(req, res, next);
});

router.post('/deliveries/batch', (req, res, next) => {
  console.log('📍 Route: POST /deliveries/batch');
  deliveriesController.createDeliveriesBatch(req, res, next);
});

router.patch('/deliveries/:id/validate', (req, res, next) => {
  console.log('📍 Route: PATCH /deliveries/:id/validate');
  deliveriesController.validateDelivery(req, res, next);
});

// Routes con ID parametrici
router.get('/deliveries/:id', (req, res, next) => {
  console.log('📍 Route: GET /deliveries/:id with id:', req.params.id);
  deliveriesController.getDeliveryById(req, res, next);
});

router.put('/deliveries/:id', (req, res, next) => {
  console.log('📍 Route: PUT /deliveries/:id');
  deliveriesController.updateDelivery(req, res, next);
});

router.delete('/deliveries/:id', (req, res, next) => {
  console.log('📍 Route: DELETE /deliveries/:id');
  deliveriesController.deleteDelivery(req, res, next);
});

// 🚨 ROUTE PRINCIPALE: POST e GET /deliveries
router.post('/deliveries', (req, res, next) => {
  console.log('📍 Route: POST /deliveries');
  console.log('📍 Body received:', req.body);
  console.log('📍 User:', (req as any).user ? (req as any).user.id : 'No user');
  
  try {
    deliveriesController.createDelivery(req, res, next);
  } catch (error) {
    console.error('❌ Error in createDelivery route:', error);
    next(error);
  }
});

router.get('/deliveries', (req, res, next) => {
  console.log('📍 Route: GET /deliveries');
  console.log('📍 Query params:', req.query);
  deliveriesController.getAllDeliveries(req, res, next);
});

console.log('✅ Deliveries routes setup completed');

export const deliveriesRoutes = router;