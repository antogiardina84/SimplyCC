// server/src/modules/clients/controllers/index.ts

import { Request, Response, NextFunction } from 'express';
import * as clientService from '../services/clients.service';

export const getAllClients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clients = await clientService.findAllClients();
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

export const createClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clientData = req.body;
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