// server/src/modules/clients/routes/index.ts

import { Router } from 'express';
import { getAllClients, getClientById, createClient, updateClient, deleteClient } from '../controllers';
import { authMiddleware, checkRole } from '../../../core/middleware/auth.middleware';

const router = Router();

// Protezione delle route con autenticazione
router.use(authMiddleware);

// Route accessibili a tutti gli utenti autenticati
router.get('/', getAllClients);
router.get('/:id', getClientById);

// Route accessibili solo a manager e admin
router.post('/', checkRole(['ADMIN', 'MANAGER']), createClient);
router.put('/:id', checkRole(['ADMIN', 'MANAGER']), updateClient);
router.delete('/:id', checkRole(['ADMIN']), deleteClient);

export const clientRoutes = router;