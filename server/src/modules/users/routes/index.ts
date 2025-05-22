// server/src/modules/users/routes/index.ts

import { Router } from 'express';
import { getAllUsers, getUserById, createUser, updateUser, deleteUser, 
  getProfile, updateProfile, changePassword, updateUserRole } from '../controllers';
import { authMiddleware, checkRole } from '../../../core/middleware/auth.middleware';

const router = Router();

// Route per il profilo (accessibili a tutti gli utenti autenticati)
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.put('/change-password', authMiddleware, changePassword);

// Route per la gestione utenti (solo admin)
router.get('/', authMiddleware, checkRole(['ADMIN']), getAllUsers);
router.get('/:id', authMiddleware, checkRole(['ADMIN']), getUserById);
router.post('/', authMiddleware, checkRole(['ADMIN']), createUser);
router.put('/:id', authMiddleware, checkRole(['ADMIN']), updateUser);
router.put('/:id/role', authMiddleware, checkRole(['ADMIN']), updateUserRole); // Nuova route
router.delete('/:id', authMiddleware, checkRole(['ADMIN']), deleteUser);

export const userRoutes = router;