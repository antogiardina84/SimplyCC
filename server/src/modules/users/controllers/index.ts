// server/src/modules/users/controllers/index.ts

import { Request, Response, NextFunction } from 'express';
// Rimuoviamo l'import non utilizzato
// import { HttpException } from '../../../core/middleware/error.middleware';

export const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Implementare la logica di recupero utenti
    res.status(200).json({ message: 'Get All Users API - Da implementare' });
  } catch (error) {
    next(error); // Passa l'errore direttamente al middleware di gestione errori
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    // Implementare la logica di recupero utente per ID
    res.status(200).json({ message: `Get User ${id} API - Da implementare` });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Implementare la logica di creazione utente
    res.status(201).json({ message: 'Create User API - Da implementare' });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    // Implementare la logica di aggiornamento utente
    res.status(200).json({ message: `Update User ${id} API - Da implementare` });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    // Implementare la logica di eliminazione utente
    res.status(200).json({ message: `Delete User ${id} API - Da implementare` });
  } catch (error) {
    next(error);
  }
};