// server/src/modules/clients/routes/index.ts

import { Router } from 'express';
import { authMiddleware, checkRole } from '../../../core/middleware/auth.middleware';
import * as clientController from '../controllers/index';

const router = Router();

// Protezione delle route con autenticazione
router.use(authMiddleware);

// Route pubbliche (per tutti gli utenti autenticati)
router.get('/', clientController.getAllClients);
router.get('/stats', checkRole(['ADMIN', 'MANAGER']), clientController.getClientStats);
router.get('/search', clientController.searchClients);

// Route per controllo disponibilità P.IVA
router.get('/check-vat/:vatNumber', clientController.checkVatNumberAvailability);

// Route per ricerca per P.IVA
router.get('/vat/:vatNumber', clientController.getClientByVatNumber);

// Route specifica per ID (deve essere dopo le route con path fissi)
router.get('/:id', clientController.getClientById);

// Route amministrative (solo per manager e admin)
router.post('/', checkRole(['ADMIN', 'MANAGER']), clientController.createClient);
router.put('/:id', checkRole(['ADMIN', 'MANAGER']), clientController.updateClient);

// Route eliminazione (solo admin)
router.delete('/:id', checkRole(['ADMIN']), clientController.deleteClient);

export const clientRoutes = router;