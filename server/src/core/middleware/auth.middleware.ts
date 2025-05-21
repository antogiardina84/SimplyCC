// server/src/core/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { HttpException } from './error.middleware';

// Estendi l'interfaccia Request per includere l'utente
export interface AuthRequest extends Request {
  user?: any;
}

// Variabili d'ambiente per JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Middleware di autenticazione
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new HttpException(401, 'Autenticazione richiesta');
    }
    
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2) {
      throw new HttpException(401, 'Formato del token non valido');
    }
    
    const [scheme, token] = parts;
    
    if (!/^Bearer$/i.test(scheme)) {
      throw new HttpException(401, 'Formato del token non valido');
    }
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        throw new HttpException(401, 'Token non valido o scaduto');
      }
      
      req.user = decoded;
      next();
    });
  } catch (error) {
    next(error);
  }
};

// Middleware di controllo ruoli
export const checkRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new HttpException(401, 'Autenticazione richiesta');
      }
      
      if (!roles.includes(req.user.role)) {
        throw new HttpException(403, 'Accesso non autorizzato');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};