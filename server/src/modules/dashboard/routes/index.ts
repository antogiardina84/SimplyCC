// server/src/modules/dashboard/routes/index.ts

import { Router } from 'express';
import { getDashboardStats } from '../controllers';
import { authMiddleware } from '../../../core/middleware/auth.middleware';

const router = Router();

// Proteggi la route con autenticazione
router.get('/stats', authMiddleware, getDashboardStats);

export const dashboardRoutes = router;
