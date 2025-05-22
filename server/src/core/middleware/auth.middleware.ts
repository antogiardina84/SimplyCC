// server/src/core/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { HttpException } from './error.middleware';
import { verifyToken, TokenPayload } from '../../modules/auth/services/auth.service';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
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
    
    const decoded = verifyToken(token);
    req.user = decoded;
    
    next();
  } catch (error) {
    next(error);
  }
};

export const checkRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
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