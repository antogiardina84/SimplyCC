import { Router } from 'express';
import { getCurrentUser, login, register } from '../controllers';
import { authMiddleware } from '../../../core/middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authMiddleware, getCurrentUser);

export const authRoutes = router;