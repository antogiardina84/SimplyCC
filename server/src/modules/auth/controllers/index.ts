import { Request, Response, NextFunction } from 'express';
import { HttpException } from '../../../core/middleware/error.middleware';

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Implementare la logica di login
    res.status(200).json({ message: 'Login API - Da implementare' });
  } catch (error) {
    next(new HttpException(500, 'Errore durante il login'));
  }
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Implementare la logica di registrazione
    res.status(201).json({ message: 'Register API - Da implementare' });
  } catch (error) {
    next(new HttpException(500, 'Errore durante la registrazione'));
  }
};