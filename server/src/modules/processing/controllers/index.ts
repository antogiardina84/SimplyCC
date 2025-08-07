// server/src/modules/processing/controllers/index.ts

import { Request, Response } from 'express';
import * as processingService from '../services/processing.service';

export const getAllProcessing = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, operatorId } = req.query;

    let processing;

    if (startDate && endDate) {
      // Filtra per range di date
      processing = await processingService.findProcessingByDateRange(
        new Date(startDate as string),
        new Date(endDate as string)
      );
    } else if (operatorId) {
      // Filtra per operatore
      processing = await processingService.findProcessingByOperator(operatorId as string);
    } else {
      // Tutti i processing
      processing = await processingService.findAllProcessing();
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
    const processing = await processingService.findProcessingById(id);

    res.status(200).json({
      success: true,
      data: processing,
    });
  } catch (error) {
    console.error('Error getting processing by id:', error);
    
    if (error instanceof Error && error.message === 'Lavorazione non trovata') {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero della lavorazione',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const createProcessing = async (req: Request, res: Response): Promise<void> => {
  try {
    const processing = await processingService.createProcessing(req.body);

    res.status(201).json({
      success: true,
      message: 'Lavorazione creata con successo',
      data: processing,
    });
  } catch (error) {
    console.error('Error creating processing:', error);
    
    if (error instanceof Error && (
      error.message === 'Operatore non trovato'
    )) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

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
    const processing = await processingService.updateProcessing(id, req.body);

    res.status(200).json({
      success: true,
      message: 'Lavorazione aggiornata con successo',
      data: processing,
    });
  } catch (error) {
    console.error('Error updating processing:', error);
    
    if (error instanceof Error && (
      error.message === 'Lavorazione non trovata' ||
      error.message === 'Operatore non trovato'
    )) {
      res.status(error.message === 'Lavorazione non trovata' ? 404 : 400).json({
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
    const result = await processingService.deleteProcessing(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Error deleting processing:', error);
    
    if (error instanceof Error && error.message === 'Lavorazione non trovata') {
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
    const stats = await processingService.getProcessingStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting processing stats:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero delle statistiche',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};