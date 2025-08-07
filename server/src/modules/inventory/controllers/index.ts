// server/src/modules/inventory/controllers/index.ts

import { Request, Response } from 'express';
import * as inventoryService from '../services/inventory.service';

export const getAllInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, materialType, reference } = req.query;

    let inventory;

    if (startDate && endDate) {
      // Filtra per range di date
      inventory = await inventoryService.findInventoryByDateRange(
        new Date(startDate as string),
        new Date(endDate as string)
      );
    } else if (materialType) {
      // Filtra per tipo materiale
      inventory = await inventoryService.findInventoryByMaterial(
        materialType as string,
        reference as string
      );
    } else {
      // Tutti i movimenti
      inventory = await inventoryService.findAllInventory();
    }

    res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    console.error('Error getting inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero dei movimenti di giacenza',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getInventoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const inventory = await inventoryService.findInventoryById(id);

    res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    console.error('Error getting inventory by id:', error);
    
    if (error instanceof Error && error.message === 'Movimento di giacenza non trovato') {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero del movimento di giacenza',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const createInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    const inventory = await inventoryService.createInventory(req.body);

    res.status(201).json({
      success: true,
      message: 'Movimento di giacenza creato con successo',
      data: inventory,
    });
  } catch (error) {
    console.error('Error creating inventory:', error);
    
    if (error instanceof Error && (
      error.message === 'Tipo materiale non trovato' ||
      error.message === 'Esiste già un movimento per questa data e materiale'
    )) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Errore durante la creazione del movimento di giacenza',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const updateInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const inventory = await inventoryService.updateInventory(id, req.body);

    res.status(200).json({
      success: true,
      message: 'Movimento di giacenza aggiornato con successo',
      data: inventory,
    });
  } catch (error) {
    console.error('Error updating inventory:', error);
    
    if (error instanceof Error && (
      error.message === 'Movimento di giacenza non trovato' ||
      error.message === 'Tipo materiale non trovato'
    )) {
      res.status(error.message === 'Movimento di giacenza non trovato' ? 404 : 400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Errore durante l\'aggiornamento del movimento di giacenza',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const deleteInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await inventoryService.deleteInventory(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Error deleting inventory:', error);
    
    if (error instanceof Error && error.message === 'Movimento di giacenza non trovato') {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Errore durante l\'eliminazione del movimento di giacenza',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getInventoryStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await inventoryService.getInventoryStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting inventory stats:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero delle statistiche giacenze',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getInventoryReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, materialType } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        message: 'Date di inizio e fine sono obbligatorie per il report',
      });
      return;
    }

    const report = await inventoryService.getInventoryReport(
      new Date(startDate as string),
      new Date(endDate as string),
      materialType as string
    );

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error generating inventory report:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante la generazione del report giacenze',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getLatestStockByMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { materialType, reference } = req.params;
    
    const latestStock = await inventoryService.findLatestInventoryByMaterial(
      materialType,
      reference
    );

    res.status(200).json({
      success: true,
      data: latestStock,
    });
  } catch (error) {
    console.error('Error getting latest stock:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero dell\'ultima giacenza',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};