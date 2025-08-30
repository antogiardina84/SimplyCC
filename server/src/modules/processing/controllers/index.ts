// server/src/modules/processing/controllers/index.ts

import { Request, Response } from 'express';
import processingService from '../services/processing.service';

export const getAllProcessing = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, operatorId } = req.query;

    let processing;

    if (startDate && endDate) {
      // Filtra per range di date
      processing = await processingService.findAll({
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string)
      });
    } else if (operatorId) {
      // Filtra per operatore
      processing = await processingService.findAll({ operatorId: operatorId as string });
    } else {
      // Tutti i processing
      processing = await processingService.findAll({});
    }

    res.status(200).json({
      success: true,
      data: processing,
    });
  } catch (error) {
    console.error('Error getting processing:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero delle lavorazioni',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getProcessingById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const processing = await processingService.findById(id);

    if (!processing) {
      res.status(404).json({
        success: false,
        message: 'Lavorazione non trovata',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: processing,
    });
  } catch (error) {
    console.error('Error getting processing by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero della lavorazione',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const createProcessing = async (req: Request, res: Response): Promise<void> => {
  try {
    const newProcessing = await processingService.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Lavorazione creata con successo',
      data: newProcessing,
    });
  } catch (error) {
    console.error('Error creating processing:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante la creazione della lavorazione',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const updateProcessing = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedProcessing = await processingService.update(id, updateData);

    res.status(200).json({
      success: true,
      message: 'Lavorazione aggiornata con successo',
      data: updatedProcessing,
    });
  } catch (error) {
    console.error('Error updating processing:', error);
    
    if (error instanceof Error && error.message === 'Sessione di lavorazione non trovata') {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Errore durante l\'aggiornamento della lavorazione',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const deleteProcessing = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await processingService.delete(id);

    res.status(200).json({
      success: true,
      message: 'Lavorazione eliminata con successo',
    });
  } catch (error) {
    console.error('Error deleting processing:', error);
    
    if (error instanceof Error && error.message === 'Sessione di lavorazione non trovata') {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Errore durante l\'eliminazione della lavorazione',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getProcessingStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await processingService.getDashboardStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting processing stats:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero delle statistiche di lavorazione',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};