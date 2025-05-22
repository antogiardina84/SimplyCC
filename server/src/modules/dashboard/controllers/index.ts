// server/src/modules/dashboard/controllers/index.ts

import { Request, Response, NextFunction } from 'express';
import { HttpException } from '../../../core/middleware/error.middleware';
import * as dashboardService from '../services/dashboard.service';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await dashboardService.getDashboardStats();
    res.status(200).json(stats);
  } catch (error) {
    next(new HttpException(500, 'Errore durante il recupero delle statistiche'));
  }
};