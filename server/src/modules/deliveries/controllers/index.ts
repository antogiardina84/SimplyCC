// server/src/modules/deliveries/controllers/index.ts - VERSIONE AGGIORNATA

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../../core/middleware/auth.middleware'; // Usa la tua interfaccia
import * as deliveriesService from '../services/deliveries.service';
import * as contributorsService from '../services/contributors.service';
import * as materialTypesService from '../services/materialTypes.service';

// ================================
// CONTROLLER CONFERIMENTI
// ================================

export const getAllDeliveries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filters = {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      contributorId: req.query.contributorId as string,
      materialTypeId: req.query.materialTypeId as string,
      basinId: req.query.basinId as string,
      isValidated: req.query.isValidated ? req.query.isValidated === 'true' : undefined
    };

    const deliveries = await deliveriesService.findDeliveriesByFilters(filters);
    res.status(200).json(deliveries);
  } catch (error) {
    next(error);
  }
};

export const getDeliveryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const delivery = await deliveriesService.findDeliveryById(id);
    res.status(200).json(delivery);
  } catch (error) {
    next(error);
  }
};

export const createDelivery = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const deliveryData = {
      ...req.body,
      createdBy: req.user?.id // Usa la tua interfaccia AuthRequest
    };
    
    const delivery = await deliveriesService.createDelivery(deliveryData);
    res.status(201).json(delivery);
  } catch (error) {
    next(error);
  }
};

export const updateDelivery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const deliveryData = req.body;
    
    const delivery = await deliveriesService.updateDelivery(id, deliveryData);
    res.status(200).json(delivery);
  } catch (error) {
    next(error);
  }
};

export const deleteDelivery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    await deliveriesService.deleteDelivery(id);
    res.status(200).json({ 
      message: 'Conferimento eliminato con successo'
    });
  } catch (error) {
    next(error);
  }
};

export const validateDelivery = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    const delivery = await deliveriesService.updateDelivery(id, {
      isValidated: true,
      validatedBy: req.user?.id // Usa la tua interfaccia AuthRequest
    });
    
    res.status(200).json(delivery);
  } catch (error) {
    next(error);
  }
};

// ================================
// CONTROLLER CALENDARIO
// ================================

export const getMonthlyCalendar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);
    const materialTypeId = req.query.materialTypeId as string;
    const basinId = req.query.basinId as string;

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      res.status(400).json({ message: 'Anno e mese non validi' });
      return;
    }

    const calendarData = await deliveriesService.getMonthlyCalendarData(
      year, 
      month, 
      materialTypeId, 
      basinId
    );
    
    res.status(200).json(calendarData);
  } catch (error) {
    next(error);
  }
};

export const getDayDeliveries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { date } = req.params; // Format: YYYY-MM-DD
    const materialTypeId = req.query.materialTypeId as string;

    const deliveries = await deliveriesService.getDayDeliveries(date, materialTypeId);
    res.status(200).json(deliveries);
  } catch (error) {
    next(error);
  }
};

// ================================
// CONTROLLER CONFERITORI
// ================================

export const getAllContributors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filters = {
      search: req.query.search as string,
      basinId: req.query.basinId as string,
      materialTypeCode: req.query.materialTypeCode as string,
      isActive: req.query.isActive ? req.query.isActive === 'true' : undefined
    };

    const contributors = await contributorsService.findAllContributors(filters);
    res.status(200).json(contributors);
  } catch (error) {
    next(error);
  }
};

export const getContributorById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const contributor = await contributorsService.findContributorById(id);
    res.status(200).json(contributor);
  } catch (error) {
    next(error);
  }
};

export const createContributor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const contributorData = req.body;
    const contributor = await contributorsService.createContributor(contributorData);
    res.status(201).json(contributor);
  } catch (error) {
    next(error);
  }
};

export const updateContributor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const contributorData = req.body;
    
    const contributor = await contributorsService.updateContributor(id, contributorData);
    res.status(200).json(contributor);
  } catch (error) {
    next(error);
  }
};

export const deleteContributor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    await contributorsService.deleteContributor(id);
    res.status(200).json({ 
      message: 'Conferitore eliminato con successo'
    });
  } catch (error) {
    next(error);
  }
};

export const getContributorsByMaterialType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { materialTypeCode } = req.params;
    
    const contributors = await contributorsService.getContributorsByMaterialType(materialTypeCode);
    res.status(200).json(contributors);
  } catch (error) {
    next(error);
  }
};

export const getContributorStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    
    const statistics = await contributorsService.getContributorStatistics(id, year);
    res.status(200).json(statistics);
  } catch (error) {
    next(error);
  }
};

// ================================
// CONTROLLER TIPOLOGIE MATERIALI
// ================================

export const getAllMaterialTypes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    
    const materialTypes = await materialTypesService.findAllMaterialTypes(includeInactive);
    res.status(200).json(materialTypes);
  } catch (error) {
    next(error);
  }
};

export const getMaterialTypeById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const materialType = await materialTypesService.findMaterialTypeById(id);
    res.status(200).json(materialType);
  } catch (error) {
    next(error);
  }
};

export const getMaterialTypeByCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code } = req.params;
    const materialType = await materialTypesService.findMaterialTypeByCode(code);
    res.status(200).json(materialType);
  } catch (error) {
    next(error);
  }
};

export const createMaterialType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const materialTypeData = req.body;
    const materialType = await materialTypesService.createMaterialType(materialTypeData);
    res.status(201).json(materialType);
  } catch (error) {
    next(error);
  }
};

export const updateMaterialType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const materialTypeData = req.body;
    
    const materialType = await materialTypesService.updateMaterialType(id, materialTypeData);
    res.status(200).json(materialType);
  } catch (error) {
    next(error);
  }
};

export const deleteMaterialType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    await materialTypesService.deleteMaterialType(id);
    res.status(200).json({ 
      message: 'Tipologia materiale eliminata con successo'
    });
  } catch (error) {
    next(error);
  }
};

export const getHierarchicalMaterialTypes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const materialTypes = await materialTypesService.getHierarchicalMaterialTypes();
    res.status(200).json(materialTypes);
  } catch (error) {
    next(error);
  }
};

export const getMaterialTypeStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    
    const statistics = await materialTypesService.getMaterialTypeStatistics(id, year);
    res.status(200).json(statistics);
  } catch (error) {
    next(error);
  }
};