// server/src/modules/deliveries/controllers/index.ts - DEBUG VERSION

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../../core/middleware/auth.middleware';
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
      createdBy: req.user?.id
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
      validatedBy: req.user?.id
    });
    
    res.status(200).json(delivery);
  } catch (error) {
    next(error);
  }
};

// ================================
// CONTROLLER CALENDARIO - DEBUG VERSION
// ================================

export const getMonthlyCalendar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('🗓️ getMonthlyCalendar chiamata');
    console.log('📋 Parametri ricevuti:', req.params);
    console.log('📋 Query ricevuti:', req.query);

    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);
    const materialTypeId = req.query.materialTypeId as string;
    const basinId = req.query.basinId as string;

    console.log('📋 Parametri parsati:', { year, month, materialTypeId, basinId });

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      console.log('❌ Parametri non validi:', { year, month });
      res.status(400).json({ 
        message: 'Anno e mese non validi',
        received: { year, month },
        expected: 'year: number, month: 1-12'
      });
      return;
    }

    console.log('✅ Parametri validi, chiamata al service...');
    const calendarData = await deliveriesService.getMonthlyCalendarData(
      year, 
      month, 
      materialTypeId, 
      basinId
    );
    
    console.log('✅ Dati calendario ottenuti:', {
      month: calendarData.month,
      giorni: calendarData.days.length,
      totaleConferimenti: calendarData.monthlyTotals.totalDeliveries
    });
    
    res.status(200).json(calendarData);
  } catch (error) {
    console.error('❌ Errore in getMonthlyCalendar:', error);
    next(error);
  }
};

export const getDayDeliveries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('📅 getDayDeliveries chiamata');
    console.log('📋 URL completa:', req.originalUrl);
    console.log('📋 Parametri ricevuti:', req.params);
    console.log('📋 Query ricevuti:', req.query);
    console.log('📋 Headers ricevuti:', req.headers);

    const { date } = req.params; // Format: YYYY-MM-DD
    const materialTypeId = req.query.materialTypeId as string;

    console.log('📋 Parametri estratti:', { date, materialTypeId });

    // VALIDAZIONE MIGLIORATA
    if (!date) {
      console.log('❌ Parametro date mancante');
      res.status(400).json({ 
        message: 'Parametro date mancante',
        received: { date },
        expected: 'YYYY-MM-DD format'
      });
      return;
    }

    // Verifica formato data
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      console.log('❌ Formato data non valido:', date);
      res.status(400).json({ 
        message: 'Formato data non valido',
        received: date,
        expected: 'YYYY-MM-DD format',
        example: '2025-06-19'
      });
      return;
    }

    // Verifica che la data sia valida
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      console.log('❌ Data non valida:', date);
      res.status(400).json({ 
        message: 'Data non valida',
        received: date,
        parsed: parsedDate
      });
      return;
    }

    console.log('✅ Parametri validi, chiamata al service...');
    const deliveries = await deliveriesService.getDayDeliveries(date, materialTypeId);
    
    console.log('✅ Conferimenti ottenuti:', {
      data: date,
      count: deliveries.length,
      tipologie: deliveries.map(d => d.materialType?.name).filter(Boolean)
    });
    
    res.status(200).json(deliveries);
  } catch (error) {
    console.error('❌ Errore in getDayDeliveries:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack');
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