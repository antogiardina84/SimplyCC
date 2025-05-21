import { Router } from 'express';
import { login, register } from '../controllers';

const router = Router();

router.post('/login', login);
router.post('/register', register);

export const authRoutes = router;