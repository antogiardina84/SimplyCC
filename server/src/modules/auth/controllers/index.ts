// server/src/modules/auth/controllers/index.ts

import { Request, Response, NextFunction } from 'express';
import { HttpException } from '../../../core/middleware/error.middleware';
import { AuthRequest } from '../../../core/middleware/auth.middleware';
import * as authService from '../services/auth.service';
import * as userService from '../../users/services/users.service';
import { logger } from '../../../core/config/logger';

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new HttpException(400, 'Email e password sono richiesti');
    }

    const result = await authService.login(email, password);
    
    logger.info(`Utente loggato: ${email}`);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      throw new HttpException(400, 'Email e password sono richiesti');
    }

    const result = await authService.register(email, password, firstName, lastName);
    
    logger.info(`Nuovo utente registrato: ${email}`);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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