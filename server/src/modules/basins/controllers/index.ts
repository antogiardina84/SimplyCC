// server/src/modules/basins/controllers/index.ts

import { Request, Response, NextFunction } from 'express';
// Rimuoviamo l'import non utilizzato
// import { HttpException } from '../../../core/middleware/error.middleware';
import * as basinService from '../services/basins.service';

export const getAllBasins = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const basins = await basinService.findAllBasins();
    res.status(200).json(basins);
  } catch (error) {
    next(error); // Passa l'errore direttamente al middleware di gestione errori
  }
};

export const getBasinsByClientId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { clientId } = req.params;
    const basins = await basinService.findBasinsByClientId(clientId);
    res.status(200).json(basins);
  } catch (error) {
    next(error);
  }
};

export const getBasinById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const basin = await basinService.findBasinById(id);
    res.status(200).json(basin);
  } catch (error) {
    next(error);
  }
};

export const createBasin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const basinData = req.body;
    const basin = await basinService.createBasin(basinData);
    res.status(201).json(basin);
  } catch (error) {
    next(error);
  }
};

export const updateBasin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const basinData = req.body;
    const basin = await basinService.updateBasin(id, basinData);
    res.status(200).json(basin);
  } catch (error) {
    next(error);
  }
};

export const deleteBasin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const basin = await basinService.deleteBasin(id);
    res.status(200).json(basin);
  } catch (error) {
    next(error);
  }
};