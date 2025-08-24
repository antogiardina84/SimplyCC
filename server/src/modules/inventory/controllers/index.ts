// server/src/modules/inventory/controllers/index.ts - VERSIONE INTEGRATA

// Aggiungi import di prisma all'inizio del file
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ================================
// OPERAZIONI CRUD STANDARD
// ================================

export const getAllInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, materialTypeId } = req.query;

    let inventory;

    if (startDate && endDate) {
      // Filtra per range di date - implementazione semplificata
      inventory = await inventoryService.findAllInventory();
      // TODO: Implementare filtro per date range
    } else if (materialTypeId) {
      // Filtra per tipo materiale
      inventory = await inventoryService.findInventoryByMaterialType(materialTypeId as string);
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

// ================================
// NUOVE API PER CALCOLO AUTOMATICO
// ================================

/**
 * Calcola movimenti automatici per una data e materiale
 */
export const calculateAutomaticMovements = async (req: Request, res: Response): Promise<void> => {
  try {
    const { materialTypeId, date } = req.params;

    if (!materialTypeId || !date) {
      res.status(400).json({
        success: false,
        message: 'MaterialTypeId e data sono obbligatori',
      });
      return;
    }

    const movements = await inventoryService.calculateAutomaticMovements(
      materialTypeId,
      new Date(date)
    );

    res.status(200).json({
      success: true,
      data: {
        materialTypeId,
        date,
        movements,
        summary: {
          netMovement: movements.deliveries + movements.processingOutput - movements.processingInput - movements.shipments,
          totalIn: movements.deliveries + movements.processingOutput,
          totalOut: movements.processingInput + movements.shipments,
        },
      },
    });
  } catch (error) {
    console.error('Error calculating automatic movements:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il calcolo dei movimenti automatici',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Calcola giacenza di un materiale a una data specifica
 */
export const calculateStockAtDate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { materialTypeId, date } = req.params;

    if (!materialTypeId || !date) {
      res.status(400).json({
        success: false,
        message: 'MaterialTypeId e data sono obbligatori',
      });
      return;
    }

    const stock = await inventoryService.calculateStockAtDate(
      materialTypeId,
      new Date(date)
    );

    res.status(200).json({
      success: true,
      data: {
        materialTypeId,
        date,
        calculatedStock: stock,
      },
    });
  } catch (error) {
    console.error('Error calculating stock at date:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il calcolo della giacenza',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Ricalcola tutte le giacenze per un materiale
 */
export const recalculateInventoryForMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { materialTypeId } = req.params;

    if (!materialTypeId) {
      res.status(400).json({
        success: false,
        message: 'MaterialTypeId è obbligatorio',
      });
      return;
    }

    const result = await inventoryService.recalculateInventoryForMaterial(materialTypeId);

    res.status(200).json({
      success: true,
      message: 'Ricalcolo giacenze completato',
      data: result,
    });
  } catch (error) {
    console.error('Error recalculating inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il ricalcolo delle giacenze',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Ottieni disponibilità stock corrente per tutti i materiali
 */
export const getCurrentStockAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const stockAvailability = await inventoryService.getCurrentStockAvailability();

    res.status(200).json({
      success: true,
      data: stockAvailability,
      summary: {
        totalMaterials: stockAvailability.length,
        materialsInStock: stockAvailability.filter(s => s.currentStock > 0).length,
        materialsWithLowStock: stockAvailability.filter(s => s.currentStock < 100).length,
        materialsOutOfStock: stockAvailability.filter(s => s.currentStock <= 0).length,
      },
    });
  } catch (error) {
    console.error('Error getting stock availability:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero della disponibilità stock',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Ottieni ultima giacenza per materiale
 */
export const getLatestStockByMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { materialTypeId } = req.params;
    
    if (!materialTypeId) {
      res.status(400).json({
        success: false,
        message: 'MaterialTypeId è obbligatorio',
      });
      return;
    }

    const latestStock = await inventoryService.findLatestInventoryByMaterialType(materialTypeId);

    if (!latestStock) {
      res.status(404).json({
        success: false,
        message: 'Nessun movimento trovato per questo materiale',
      });
      return;
    }

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

/**
 * Crea automaticamente movimenti di inventario per tutti i materiali di una data
 */
export const autoCreateInventoryForDate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date } = req.params;

    if (!date) {
      res.status(400).json({
        success: false,
        message: 'Data è obbligatoria',
      });
      return;
    }

    const targetDate = new Date(date);

    // Ottieni tutti i materiali attivi
    const materialTypes = await prisma.materialType.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
    });

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const materialType of materialTypes) {
      try {
        // Verifica se ha movimenti in quella data
        const movements = await inventoryService.calculateAutomaticMovements(
          materialType.id,
          targetDate
        );

        const hasMovements = movements.deliveries > 0 || 
                           movements.processingInput > 0 || 
                           movements.processingOutput > 0 || 
                           movements.shipments > 0;

        if (hasMovements) {
          // Verifica se esiste già
          const existing = await prisma.inventory.findFirst({
            where: {
              materialTypeId: materialType.id,
              date: targetDate,
            },
          });

          if (!existing) {
            await inventoryService.createInventory({
              date: targetDate,
              materialTypeId: materialType.id,
              initialStock: 0, // Sarà calcolato automaticamente
            });

            results.push({
              materialType: materialType.name,
              status: 'created',
              movements,
            });
            successCount++;
          } else {
            results.push({
              materialType: materialType.name,
              status: 'already_exists',
              movements,
            });
          }
        } else {
          results.push({
            materialType: materialType.name,
            status: 'no_movements',
            movements,
          });
        }
      } catch (error) {
        results.push({
          materialType: materialType.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        errorCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Processo completato: ${successCount} creati, ${errorCount} errori`,
      data: {
        date,
        summary: {
          totalMaterials: materialTypes.length,
          successCount,
          errorCount,
          skippedCount: materialTypes.length - successCount - errorCount,
        },
        details: results,
      },
    });
  } catch (error) {
    console.error('Error auto-creating inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante la creazione automatica inventario',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ================================
// API STATISTICHE E REPORT
// ================================

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
    const { startDate, endDate, materialTypeId } = req.query;

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
      materialTypeId as string
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

/**
 * API per dashboard con dati integrati
 */
export const getInventoryDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const [stats, stockAvailability] = await Promise.all([
      inventoryService.getInventoryStats(),
      inventoryService.getCurrentStockAvailability(),
    ]);

    // Calcola metriche aggiuntive
    const totalCurrentStock = stockAvailability.reduce((sum, item) => sum + item.currentStock, 0);
    const totalAvailableStock = stockAvailability.reduce((sum, item) => sum + item.availableStock, 0);
    const totalReservedStock = stockAvailability.reduce((sum, item) => sum + item.reservedStock, 0);

    const lowStockMaterials = stockAvailability.filter(item => item.currentStock < 100);
    const outOfStockMaterials = stockAvailability.filter(item => item.currentStock <= 0);

    res.status(200).json({
      success: true,
      data: {
        stats,
        stockAvailability,
        dashboard: {
          totals: {
            currentStock: totalCurrentStock,
            availableStock: totalAvailableStock,
            reservedStock: totalReservedStock,
          },
          alerts: {
            lowStockCount: lowStockMaterials.length,
            outOfStockCount: outOfStockMaterials.length,
            lowStockMaterials: lowStockMaterials.map(item => ({
              id: item.materialTypeId,
              name: item.materialType.name,
              currentStock: item.currentStock,
            })),
            outOfStockMaterials: outOfStockMaterials.map(item => ({
              id: item.materialTypeId,
              name: item.materialType.name,
              currentStock: item.currentStock,
            })),
          },
          monthlyMovements: stats.monthlyMovements,
          materialBreakdown: stats.materialBreakdown,
        },
      },
    });
  } catch (error) {
    console.error('Error getting inventory dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il recupero della dashboard giacenze',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};