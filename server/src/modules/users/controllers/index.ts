// server/src/modules/users/controllers/index.ts

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { HttpException } from '../../../core/middleware/error.middleware';
import { AuthRequest } from '../../../core/middleware/auth.middleware';
import * as userService from '../services/users.service';

const prisma = new PrismaClient();

export const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await userService.findAllUsers();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await userService.findUserById(id);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userData = req.body;
    const user = await userService.createUser(userData);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userData = req.body;
    const user = await userService.updateUser(id, userData);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await userService.deleteUser(id);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const currentUserId = req.user?.userId;
    const currentUserRole = req.user?.role;
    const { id } = req.params;
    const { role } = req.body;

    // Solo gli admin possono modificare i ruoli
    if (currentUserRole !== 'ADMIN') {
      throw new HttpException(403, 'Solo gli amministratori possono modificare i ruoli');
    }

    // Non permettere agli admin di modificare il proprio ruolo
    if (currentUserId === id) {
      throw new HttpException(400, 'Non puoi modificare il tuo stesso ruolo');
    }

    // Valida il ruolo
    const validRoles = ['ADMIN', 'MANAGER', 'OPERATOR', 'USER'];
    if (!validRoles.includes(role)) {
      throw new HttpException(400, 'Ruolo non valido');
    }

    const user = await userService.updateUser(id, { role });
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// Funzioni per il profilo utente
export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new HttpException(401, 'Utente non autenticato');
    }

    const user = await userService.findUserById(userId);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new HttpException(401, 'Utente non autenticato');
    }

    const { email, firstName, lastName } = req.body;
    const user = await userService.updateUser(userId, { email, firstName, lastName });
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new HttpException(401, 'Utente non autenticato');
    }

    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      throw new HttpException(400, 'Password corrente e nuova password sono richieste');
    }
    
    // Verifica la password corrente
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new HttpException(404, 'Utente non trovato');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new HttpException(400, 'Password corrente non valida');
    }

    // Aggiorna la password
    await userService.updateUser(userId, { password: newPassword });
    res.status(200).json({ message: 'Password cambiata con successo' });
  } catch (error) {
    next(error);
  }
};