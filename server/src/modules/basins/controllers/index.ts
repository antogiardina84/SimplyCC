// server/src/modules/basins/controllers/index.ts

import { Request, Response, NextFunction } from 'express';
import * as basinService from '../services/basins.service';
import { HttpException } from '../../../core/middleware/error.middleware';

export const getAllBasins = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const basins = await basinService.findAllBasins();
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

export const getBasinsByClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { clientId } = req.params;
    const basins = await basinService.findBasinsByClient(clientId);
    res.status(200).json(basins);
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

// Funzioni aggiuntive che erano mancanti

export const getBasinStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Implementazione base delle statistiche del bacino
    const basin = await basinService.findBasinById(id);
    
    // Qui potresti aggiungere logica per calcolare statistiche reali
    // come numero di buoni di ritiro, quantità totali, ecc.
    const stats = {
      basinId: id,
      basinCode: basin.code,
      totalPickupOrders: 0, // Da implementare con query reale
      totalQuantity: 0,     // Da implementare con query reale
      avgQuantityPerOrder: 0, // Da implementare con calcolo reale
      lastActivity: null,   // Da implementare con query reale
    };
    
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};

export const searchBasinsByCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code } = req.query;
    
    if (!code || typeof code !== 'string') {
      throw new HttpException(400, 'Parametro code richiesto');
    }
    
    const allBasins = await basinService.findAllBasins();
    
    // Filtra bacini per codice (ricerca parziale case-insensitive)
    const filteredBasins = allBasins.filter(basin => 
      basin.code.toLowerCase().includes(code.toLowerCase())
    );
    
    res.status(200).json(filteredBasins);
  } catch (error) {
    next(error);
  }
};

export const checkBasinCodeAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code } = req.params;
    
    if (!code) {
      throw new HttpException(400, 'Codice bacino richiesto');
    }
    
    try {
      // Cerca se esiste già un bacino con questo codice
      const allBasins = await basinService.findAllBasins();
      const existingBasin = allBasins.find(basin => basin.code === code);
      
      res.status(200).json({
        code,
        available: !existingBasin,
        message: existingBasin 
          ? `Codice ${code} già in uso` 
          : `Codice ${code} disponibile`
      });
    } catch (error) {
      // Se non trova nessun bacino, il codice è disponibile
      res.status(200).json({
        code,
        available: true,
        message: `Codice ${code} disponibile`
      });
    }
  } catch (error) {
    next(error);
  }
};