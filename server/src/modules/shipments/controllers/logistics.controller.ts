// server/src/modules/shipments/controllers/logistics.controller.ts

import { Request, Response, NextFunction } from 'express';
import { HttpException } from '../../../core/middleware/error.middleware';
import { AuthRequest } from '../../../core/middleware/auth.middleware';
import * as logisticsService from '../services/logistics.service';
import { logger } from '../../../core/config/logger';

interface LogisticEntityFilters {
  entityType?: 'SENDER' | 'RECIPIENT' | 'TRANSPORTER';
  isActive?: string;
  search?: string;
}

interface CreateLogisticEntityRequest {
  name: string;
  address?: string;
  city?: string;
  zipCode?: string;
  province?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  notes?: string;
  entityType: 'SENDER' | 'RECIPIENT' | 'TRANSPORTER';
}

interface UpdateLogisticEntityRequest {
  name?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  province?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  notes?: string;
  entityType?: 'SENDER' | 'RECIPIENT' | 'TRANSPORTER';
  isActive?: boolean;
}

/**
 * Ottiene tutte le entità logistiche con filtri opzionali
 */
export const getAllLogisticEntities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { entityType, isActive, search } = req.query as LogisticEntityFilters;
    
    const filters = {
      entityType,
      isActive: isActive ? isActive === 'true' : undefined,
      search,
    };
    
    const entities = await logisticsService.findAllLogisticEntities(filters);
    res.status(200).json(entities);
  } catch (error) {
    next(error);
  }
};

/**
 * Ottiene entità logistiche per tipo specifico
 */
export const getLogisticEntitiesByType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type } = req.params;
    
    if (!['SENDER', 'RECIPIENT', 'TRANSPORTER'].includes(type)) {
      throw new HttpException(400, 'Tipo entità non valido');
    }
    
    const entities = await logisticsService.findLogisticEntitiesByType(type as 'SENDER' | 'RECIPIENT' | 'TRANSPORTER');
    res.status(200).json(entities);
  } catch (error) {
    next(error);
  }
};

/**
 * Ottiene una entità logistica specifica per ID
 */
export const getLogisticEntityById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const entity = await logisticsService.findLogisticEntityById(id);
    res.status(200).json(entity);
  } catch (error) {
    next(error);
  }
};

/**
 * Crea una nuova entità logistica
 */
export const createLogisticEntity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const entityData = req.body as CreateLogisticEntityRequest;
    const userId = req.user?.userId;
    
    if (!userId) {
      throw new HttpException(401, 'Utente non autenticato');
    }
    
    // Validazione dati obbligatori
    if (!entityData.name || !entityData.entityType) {
      throw new HttpException(400, 'Nome e tipo entità sono obbligatori');
    }
    
    if (!['SENDER', 'RECIPIENT', 'TRANSPORTER'].includes(entityData.entityType)) {
      throw new HttpException(400, 'Tipo entità non valido');
    }
    
    const entity = await logisticsService.createLogisticEntity(entityData);
    
    logger.info(`Entità logistica creata: ${entity.id}`, {
      name: entity.name,
      type: entity.entityType,
      createdBy: userId
    });
    
    res.status(201).json(entity);
  } catch (error) {
    next(error);
  }
};

/**
 * Aggiorna una entità logistica esistente
 */
export const updateLogisticEntity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body as UpdateLogisticEntityRequest;
    const userId = req.user?.userId;
    
    if (!userId) {
      throw new HttpException(401, 'Utente non autenticato');
    }
    
    // Validazione tipo entità se presente
    if (updateData.entityType && !['SENDER', 'RECIPIENT', 'TRANSPORTER'].includes(updateData.entityType)) {
      throw new HttpException(400, 'Tipo entità non valido');
    }
    
    const entity = await logisticsService.updateLogisticEntity(id, updateData);
    
    logger.info(`Entità logistica aggiornata: ${id}`, {
      name: entity.name,
      updatedBy: userId
    });
    
    res.status(200).json(entity);
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina (disattiva) una entità logistica
 */
export const deleteLogisticEntity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      throw new HttpException(401, 'Utente non autenticato');
    }
    
    const entity = await logisticsService.deleteLogisticEntity(id);
    
    logger.info(`Entità logistica disattivata: ${id}`, {
      name: entity.name,
      deletedBy: userId
    });
    
    res.status(200).json(entity);
  } catch (error) {
    next(error);
  }
};

/**
 * Riattiva una entità logistica
 */
export const reactivateLogisticEntity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      throw new HttpException(401, 'Utente non autenticato');
    }
    
    const entity = await logisticsService.reactivateLogisticEntity(id);
    
    logger.info(`Entità logistica riattivata: ${id}`, {
      name: entity.name,
      reactivatedBy: userId
    });
    
    res.status(200).json(entity);
  } catch (error) {
    next(error);
  }
};

/**
 * Cerca entità logistiche per OCR matching
 */
export const searchLogisticEntitiesForOCR = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, type } = req.query;
    
    if (!search || typeof search !== 'string') {
      throw new HttpException(400, 'Parametro di ricerca richiesto');
    }
    
    if (!type || !['SENDER', 'RECIPIENT'].includes(type as string)) {
      throw new HttpException(400, 'Tipo entità non valido per la ricerca');
    }
    
    const entities = await logisticsService.searchLogisticEntitiesForOCR(
      search,
      type as 'SENDER' | 'RECIPIENT'
    );
    
    res.status(200).json(entities);
  } catch (error) {
    next(error);
  }
};

/**
 * Ottiene statistiche delle entità logistiche
 */
export const getLogisticEntityStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await logisticsService.getLogisticEntityStats();
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};

/**
 * Endpoint per suggerimenti durante digitazione (autocomplete)
 */
export const getLogisticEntitySuggestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q, type } = req.query;
    
    if (!q || typeof q !== 'string' || q.length < 2) {
      res.status(200).json([]);
      return;
    }
    
    const entityType = type as 'SENDER' | 'RECIPIENT' | 'TRANSPORTER';
    if (!entityType || !['SENDER', 'RECIPIENT', 'TRANSPORTER'].includes(entityType)) {
      throw new HttpException(400, 'Tipo entità richiesto');
    }
    
    const suggestions = await logisticsService.findAllLogisticEntities({
      search: q,
      entityType,
      isActive: true,
    });
    
    // Restituisce solo i campi necessari per l'autocomplete
    const simplifiedSuggestions = suggestions.slice(0, 10).map(entity => ({
      id: entity.id,
      name: entity.name,
      city: entity.city,
      contactPerson: entity.contactPerson,
    }));
    
    res.status(200).json(simplifiedSuggestions);
  } catch (error) {
    next(error);
  }
};