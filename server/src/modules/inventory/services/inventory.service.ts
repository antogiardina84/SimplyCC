// server/src/modules/inventory/services/inventory.service.ts - VERSIONE INTEGRATA

import { PrismaClient } from '@prisma/client';
import { HttpException } from '../../../core/middleware/error.middleware';
import { startOfDay, endOfDay, format } from 'date-fns';

const prisma = new PrismaClient();

// ================================
// INTERFACES AGGIORNATE
// ================================

export interface CreateInventoryData {
  date: Date | string;
  materialTypeId: string; // OBBLIGATORIO: usa sempre MaterialType centralizzato
  initialStock: number;
  deliveries?: number; // Opzionale: calcolato automaticamente se non fornito
  processing?: number; // Opzionale: calcolato automaticamente se non fornito  
  shipments?: number; // Opzionale: calcolato automaticamente se non fornito
  adjustments?: number; // Solo correzioni manuali
  finalStock?: number; // Calcolato automaticamente
  notes?: string;
  isAutoCalculated?: boolean; // Flag per distinguere calcoli automatici
}

export interface UpdateInventoryData extends Partial<CreateInventoryData> {}

export interface InventoryMovementSummary {
  materialTypeId: string;
  materialType: {
    id: string;
    code: string;
    name: string;
    unit: string;
    color?: string;
  };
  date: string;
  deliveries: number;
  processingInput: number;
  processingOutput: number;
  shipments: number;
  adjustments: number;
  calculatedStock: number;
}

export interface StockAvailability {
  materialTypeId: string;
  materialType: {
    id: string;
    code: string;
    name: string;
    unit: string;
  };
  currentStock: number;
  reservedStock: number; // Per ordini in preparazione
  availableStock: number;
  lastMovementDate: Date;
}

// ================================
// INCLUDE STANDARD CON MATERIALTYPE
// ================================

const inventoryInclude = {
  materialTypeRel: {
    select: {
      id: true,
      code: true,
      name: true,
      unit: true,
      color: true,
      reference: true,
    },
  },
};

// ================================
// FUNZIONI DI CALCOLO AUTOMATICO
// ================================

/**
 * Calcola i movimenti automatici per una data e tipologia materiale
 */
export const calculateAutomaticMovements = async (
  materialTypeId: string, 
  date: Date
): Promise<{
  deliveries: number;
  processingInput: number;
  processingOutput: number;
  shipments: number;
}> => {
  try {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    // Calcola conferimenti del giorno
    const deliveriesSum = await prisma.delivery.aggregate({
      where: {
        materialTypeId,
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
        isValidated: true, // Solo conferimenti validati
      },
      _sum: {
        weight: true,
      },
    });

    // Calcola input nelle lavorazioni (materiale utilizzato)
    const processingInputSum = await prisma.processingInput.aggregate({
      where: {
        materialTypeId,
        processingSession: {
          date: {
            gte: dayStart,
            lte: dayEnd,
          },
          status: 'COMPLETED',
        },
      },
      _sum: {
        quantityUsed: true,
      },
    });

    // Calcola output dalle lavorazioni (materiale prodotto)
    const processingOutputSum = await prisma.processingOutput.aggregate({
      where: {
        materialTypeId,
        processingSession: {
          date: {
            gte: dayStart,
            lte: dayEnd,
          },
          status: 'COMPLETED',
        },
      },
      _sum: {
        quantityProduced: true,
      },
    });

    // Calcola spedizioni (ordini completati)
    const shipmentsSum = await prisma.pickupOrder.aggregate({
      where: {
        materialType: {
          contains: materialTypeId, // Assumendo che sia salvato come riferimento
        },
        status: 'COMPLETO',
        completionDate: {
          gte: dayStart,
          lte: dayEnd,
        },
        isRejected: false,
      },
      _sum: {
        actualQuantity: true,
      },
    });

    return {
      deliveries: deliveriesSum._sum.weight || 0,
      processingInput: processingInputSum._sum.quantityUsed || 0,
      processingOutput: processingOutputSum._sum.quantityProduced || 0,
      shipments: shipmentsSum._sum.actualQuantity || 0,
    };
  } catch (error) {
    console.error('Errore nel calcolo automatico movimenti:', error);
    throw new HttpException(500, 'Errore durante il calcolo automatico dei movimenti');
  }
};

/**
 * Calcola la giacenza di un materiale alla data specificata
 */
export const calculateStockAtDate = async (
  materialTypeId: string,
  date: Date
): Promise<number> => {
  try {
    // Trova l'ultimo movimento di inventario precedente o uguale alla data
    const lastInventory = await prisma.inventory.findFirst({
      where: {
        materialTypeId,
        date: {
          lte: date,
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Se non c'è inventario precedente, inizia da 0
    let currentStock = lastInventory?.finalStock || 0;

    // Se l'ultimo inventario è proprio della data richiesta, restituisci quello
    if (lastInventory && format(lastInventory.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')) {
      return currentStock;
    }

    // Altrimenti calcola i movimenti dal giorno successivo all'ultimo inventario
    const previousDate = lastInventory 
      ? new Date(lastInventory.date.getTime() + 24 * 60 * 60 * 1000) // Giorno dopo
      : new Date('2024-01-01'); // Data di inizio sistema

    // Calcola tutti i movimenti dal previousDate alla data richiesta
    const movements = await calculateAutomaticMovements(materialTypeId, date);
    
    // Applica i movimenti
    currentStock += movements.deliveries; // Conferimenti = +
    currentStock += movements.processingOutput; // Output lavorazioni = +
    currentStock -= movements.processingInput; // Input lavorazioni = -
    currentStock -= movements.shipments; // Spedizioni = -

    return currentStock;
  } catch (error) {
    console.error('Errore nel calcolo giacenza:', error);
    throw new HttpException(500, 'Errore durante il calcolo della giacenza');
  }
};

// ================================
// OPERAZIONI CRUD AGGIORNATE
// ================================

export const findAllInventory = async () => {
  return prisma.inventory.findMany({
    include: inventoryInclude,
    orderBy: {
      date: 'desc',
    },
  });
};

export const findInventoryById = async (id: string) => {
  const inventory = await prisma.inventory.findUnique({
    where: { id },
    include: inventoryInclude,
  });

  if (!inventory) {
    throw new HttpException(404, 'Movimento di giacenza non trovato');
  }

  return inventory;
};

export const findInventoryByMaterialType = async (materialTypeId: string) => {
  return prisma.inventory.findMany({
    where: { materialTypeId },
    include: inventoryInclude,
    orderBy: {
      date: 'desc',
    },
  });
};

export const findLatestInventoryByMaterialType = async (materialTypeId: string) => {
  return prisma.inventory.findFirst({
    where: { materialTypeId },
    include: inventoryInclude,
    orderBy: {
      date: 'desc',
    },
  });
};

/**
 * Crea un movimento di inventario con calcolo automatico
 */
export const createInventory = async (data: CreateInventoryData) => {
  try {
    // Verifica che il MaterialType esista
    const materialType = await prisma.materialType.findUnique({
      where: { id: data.materialTypeId },
    });
    if (!materialType) {
      throw new HttpException(400, 'Tipo materiale non trovato');
    }

    const targetDate = new Date(data.date);

    // Controlla se esiste già un record per la stessa data/materiale
    const existing = await prisma.inventory.findFirst({
      where: {
        date: targetDate,
        materialTypeId: data.materialTypeId,
      },
    });

    if (existing) {
      throw new HttpException(400, 'Esiste già un movimento per questa data e materiale');
    }

    // Calcola movimenti automatici se non forniti
    const automaticMovements = await calculateAutomaticMovements(data.materialTypeId, targetDate);

    // Calcola giacenza iniziale (giacenza finale del giorno precedente)
    const previousDate = new Date(targetDate.getTime() - 24 * 60 * 60 * 1000);
    const initialStock = data.initialStock ?? await calculateStockAtDate(data.materialTypeId, previousDate);

    // Usa movimenti forniti o quelli calcolati automaticamente
    const deliveries = data.deliveries ?? automaticMovements.deliveries;
    const processingInput = automaticMovements.processingInput;
    const processingOutput = automaticMovements.processingOutput;
    const processing = (data.processing ?? processingInput) - processingOutput; // Netto
    const shipments = data.shipments ?? automaticMovements.shipments;
    const adjustments = data.adjustments ?? 0;

    // Calcola giacenza finale
    const finalStock = initialStock + deliveries - processing - shipments + adjustments;

    return await prisma.inventory.create({
      data: {
        date: targetDate,
        materialTypeId: data.materialTypeId,
        materialType: materialType.code, // Mantieni per retrocompatibilità
        reference: materialType.reference || 'AUTO',
        initialStock,
        deliveries,
        processing,
        shipments,
        adjustments,
        finalStock,
        notes: data.notes,
      },
      include: inventoryInclude,
    });
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    console.error('Error creating inventory:', error);
    throw new HttpException(500, 'Errore durante la creazione del movimento di giacenza');
  }
};

/**
 * Aggiorna un movimento di inventario mantenendo l'integrazione
 */
export const updateInventory = async (id: string, data: UpdateInventoryData) => {
  try {
    const existingInventory = await prisma.inventory.findUnique({
      where: { id },
    });

    if (!existingInventory) {
      throw new HttpException(404, 'Movimento di giacenza non trovato');
    }

    // Se cambia il materialTypeId, verifica che esista
    if (data.materialTypeId && data.materialTypeId !== existingInventory.materialTypeId) {
      const materialType = await prisma.materialType.findUnique({
        where: { id: data.materialTypeId },
      });
      if (!materialType) {
        throw new HttpException(400, 'Tipo materiale non trovato');
      }
    }

    // Ricalcola giacenza finale se cambiano i movimenti
    let finalStock = existingInventory.finalStock;
    if (data.initialStock !== undefined || data.deliveries !== undefined || 
        data.processing !== undefined || data.shipments !== undefined || 
        data.adjustments !== undefined) {
      
      const initialStock = data.initialStock ?? existingInventory.initialStock;
      const deliveries = data.deliveries ?? existingInventory.deliveries;
      const processing = data.processing ?? existingInventory.processing;
      const shipments = data.shipments ?? existingInventory.shipments;
      const adjustments = data.adjustments ?? existingInventory.adjustments;
      
      finalStock = initialStock + deliveries - processing - shipments + adjustments;
    }

    return await prisma.inventory.update({
      where: { id },
      data: {
        ...data,
        finalStock,
        date: data.date ? new Date(data.date) : undefined,
      },
      include: inventoryInclude,
    });
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    console.error('Error updating inventory:', error);
    throw new HttpException(500, 'Errore durante l\'aggiornamento del movimento di giacenza');
  }
};

/**
 * Ricalcola automaticamente tutte le giacenze per un materiale
 */
export const recalculateInventoryForMaterial = async (materialTypeId: string) => {
  try {
    const materialType = await prisma.materialType.findUnique({
      where: { id: materialTypeId },
    });
    if (!materialType) {
      throw new HttpException(400, 'Tipo materiale non trovato');
    }

    // Trova tutti i giorni con movimenti per questo materiale
    const deliveryDates = await prisma.delivery.findMany({
      where: { materialTypeId },
      select: { date: true },
      distinct: ['date'],
    });

    const processingSessions = await prisma.processingSession.findMany({
      where: {
        OR: [
          { inputs: { some: { materialTypeId } } },
          { outputs: { some: { materialTypeId } } }
        ]
      },
      select: { date: true },
      distinct: ['date'],
    });

    // Combina e ordina le date
    const allDates = [...new Set([
      ...deliveryDates.map(d => d.date.toISOString().split('T')[0]),
      ...processingSessions.map(s => s.date.toISOString().split('T')[0])
    ])].sort();

    console.log(`🔄 Ricalcolo giacenze per ${materialType.name}: ${allDates.length} giorni`);

    let processedCount = 0;
    for (const dateStr of allDates) {
      try {
        const date = new Date(dateStr);
        // Verifica se esiste già un record per questa data
        const existing = await prisma.inventory.findFirst({
          where: {
            materialTypeId,
            date: startOfDay(date),
          },
        });

        if (!existing) {
          // Crea automaticamente il movimento
          await createInventory({
            date,
            materialTypeId,
            initialStock: 0, // Sarà ricalcolato automaticamente
          });
          processedCount++;
        }
      } catch (error) {
        console.error(`Errore nel processare la data ${dateStr}:`, error);
      }
    }

    return {
      materialType: materialType.name,
      processedDates: processedCount,
      message: `Ricalcolate ${processedCount} giacenze per ${materialType.name}`,
    };
  } catch (error) {
    console.error('Errore nel ricalcolo giacenze:', error);
    throw new HttpException(500, 'Errore durante il ricalcolo delle giacenze');
  }
};

/**
 * Ottieni disponibilità di stock per tutti i materiali
 */
export const getCurrentStockAvailability = async (): Promise<StockAvailability[]> => {
  try {
    const materialTypes = await prisma.materialType.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        unit: true,
      },
    });

    const stockAvailability = await Promise.all(
      materialTypes.map(async (materialType) => {
        const currentStock = await calculateStockAtDate(materialType.id, new Date());
        
        // Calcola stock riservato (ordini in preparazione)
        const reservedStock = await prisma.pickupOrder.aggregate({
          where: {
            materialType: {
              contains: materialType.id,
            },
            status: {
              in: ['PROGRAMMATO', 'IN_EVASIONE', 'IN_CARICO'],
            },
          },
          _sum: {
            expectedQuantity: true,
          },
        });

        const reserved = reservedStock._sum.expectedQuantity || 0;
        const available = Math.max(currentStock - reserved, 0);

        // Trova data ultimo movimento
        const lastMovement = await prisma.inventory.findFirst({
          where: { materialTypeId: materialType.id },
          orderBy: { date: 'desc' },
          select: { date: true },
        });

        return {
          materialTypeId: materialType.id,
          materialType,
          currentStock,
          reservedStock: reserved,
          availableStock: available,
          lastMovementDate: lastMovement?.date || new Date('2024-01-01'),
        };
      })
    );

    return stockAvailability;
  } catch (error) {
    console.error('Errore nel calcolo disponibilità stock:', error);
    throw new HttpException(500, 'Errore durante il calcolo della disponibilità stock');
  }
};

// ================================
// FUNZIONI ESISTENTI MANTENUTE
// ================================

export const deleteInventory = async (id: string) => {
  try {
    const existingInventory = await prisma.inventory.findUnique({
      where: { id },
    });

    if (!existingInventory) {
      throw new HttpException(404, 'Movimento di giacenza non trovato');
    }

    await prisma.inventory.delete({
      where: { id },
    });

    return { message: 'Movimento di giacenza eliminato con successo' };
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    console.error('Error deleting inventory:', error);
    throw new HttpException(500, 'Errore durante l\'eliminazione del movimento di giacenza');
  }
};

export const getInventoryStats = async () => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [currentStocks, monthlyMovements, materialBreakdown] = await Promise.all([
      // Giacenze correnti per materiale (aggiornato per usare materialTypeId)
      prisma.inventory.groupBy({
        by: ['materialTypeId'],
        _sum: {
          finalStock: true,
        },
        orderBy: {
          materialTypeId: 'asc',
        },
      }),

      // Movimenti del mese
      prisma.inventory.aggregate({
        where: {
          date: {
            gte: startOfMonth,
          },
        },
        _sum: {
          deliveries: true,
          processing: true,
          shipments: true,
          adjustments: true,
        },
      }),

      // Dettaglio per tipo materiale
      prisma.inventory.groupBy({
        by: ['materialTypeId'],
        _sum: {
          finalStock: true,
          deliveries: true,
          shipments: true,
        },
        where: {
          date: {
            gte: startOfMonth,
          },
        },
      }),
    ]);

    return {
      currentStocks,
      monthlyMovements,
      materialBreakdown,
    };
  } catch (error) {
    console.error('Error getting inventory stats:', error);
    throw new HttpException(500, 'Errore durante il recupero delle statistiche giacenze');
  }
};

export const getInventoryReport = async (startDate: Date, endDate: Date, materialTypeId?: string) => {
  try {
    const where: { date: { gte: Date; lte: Date }; materialTypeId?: string } = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (materialTypeId) {
      where.materialTypeId = materialTypeId;
    }

    const movements = await prisma.inventory.findMany({
      where,
      include: inventoryInclude,
      orderBy: [
        { materialTypeId: 'asc' },
        { date: 'asc' },
      ],
    });

    // Raggruppa per materiale e calcola i totali
    const summary = movements.reduce((acc, movement) => {
      const key = movement.materialTypeId || 'unknown';
      
      if (!acc[key]) {
        acc[key] = {
          materialTypeId: movement.materialTypeId,
          materialType: movement.materialTypeRel?.name || movement.materialType,
          totalDeliveries: 0,
          totalProcessing: 0,
          totalShipments: 0,
          totalAdjustments: 0,
          finalStock: 0,
        };
      }

      acc[key].totalDeliveries += movement.deliveries;
      acc[key].totalProcessing += movement.processing;
      acc[key].totalShipments += movement.shipments;
      acc[key].totalAdjustments += movement.adjustments;
      acc[key].finalStock = movement.finalStock; // L'ultimo valore
      
      return acc;
    }, {} as Record<string, any>);

    return {
      movements,
      summary: Object.values(summary),
    };
  } catch (error) {
    console.error('Error generating inventory report:', error);
    throw new HttpException(500, 'Errore durante la generazione del report giacenze');
  }
};