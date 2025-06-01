// server/src/modules/clients/controllers/index.ts

import { Request, Response, NextFunction } from 'express';
import * as clientService from '../services/clients.service';
import { HttpException } from '../../../core/middleware/error.middleware';

export const getAllClients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search } = req.query;
    
    let clients;
    if (search && typeof search === 'string') {
      clients = await clientService.searchClients(search);
    } else {
      clients = await clientService.findAllClients();
    }
    
    res.status(200).json(clients);
  } catch (error) {
    next(error);
  }
};

export const getClientById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const client = await clientService.findClientById(id);
    res.status(200).json(client);
  } catch (error) {
    next(error);
  }
};

export const getClientByVatNumber = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { vatNumber } = req.params;
    const client = await clientService.findClientByVatNumber(vatNumber);
    
    if (!client) {
      throw new HttpException(404, 'Cliente non trovato');
    }
    
    res.status(200).json(client);
  } catch (error) {
    next(error);
  }
};

export const searchClients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      throw new HttpException(400, 'Parametro di ricerca richiesto');
    }
    
    const clients = await clientService.searchClients(q);
    res.status(200).json(clients);
  } catch (error) {
    next(error);
  }
};

export const createClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clientData = req.body;
    
    // Validazione base
    if (!clientData.name || !clientData.vatNumber) {
      throw new HttpException(400, 'Nome e Partita IVA sono obbligatori');
    }
    
    const client = await clientService.createClient(clientData);
    res.status(201).json(client);
  } catch (error) {
    next(error);
  }
};

export const updateClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const clientData = req.body;
    const client = await clientService.updateClient(id, clientData);
    res.status(200).json(client);
  } catch (error) {
    next(error);
  }
};

export const deleteClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const client = await clientService.deleteClient(id);
    res.status(200).json(client);
  } catch (error) {
    next(error);
  }
};

export const getClientStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await clientService.getClientStats();
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};

export const checkVatNumberAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { vatNumber } = req.params;
    const { excludeId } = req.query;
    
    if (!vatNumber) {
      throw new HttpException(400, 'Partita IVA richiesta');
    }
    
    const result = await clientService.checkVatNumberAvailability(
      vatNumber, 
      excludeId as string | undefined
    );
    
    res.status(200).json({
      vatNumber,
      available: result.available,
      message: result.available 
        ? `Partita IVA ${vatNumber} disponibile` 
        : `Partita IVA ${vatNumber} già in uso`
    });
  } catch (error) {
    next(error);
  }
};