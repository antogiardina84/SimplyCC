// server/src/modules/inventory/services/inventory.service.ts

import { PrismaClient } from '@prisma/client';
import { HttpException } from '../../../core/middleware/error.middleware';

const prisma = new PrismaClient();

export interface CreateInventoryData {
  date: Date | string;
  materialType: string;
  reference: string; // COREPLA, CORIPET, etc.
  materialTypeId?: string;
  initialStock: number;
  deliveries: number;
  processing: number;
  shipments: number;
  adjustments: number;
  finalStock: number;
  notes?: string;
}

export interface UpdateInventoryData {
  date?: Date | string;
  materialType?: string;
  reference?: string;
  materialTypeId?: string | null;
  initialStock?: number;
  deliveries?: number;
  processing?: number;
  shipments?: number;
  adjustments?: number;
  finalStock?: number;
  notes?: string | null;
}

export interface InventoryMovement {
  type: 'DELIVERY' | 'PROCESSING' | 'SHIPMENT' | 'ADJUSTMENT';
  quantity: number;
  description?: string;
}

const inventoryInclude = {
  materialTypeRel: {
    select: {
      id: true,
      code: true,
      name: true,
      unit: true,
      color: true,
    },
  },
};

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

export const findInventoryByDateRange = async (startDate: Date, endDate: Date) => {
  return prisma.inventory.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: inventoryInclude,
    orderBy: {
      date: 'desc',
    },
  });
};

export const findInventoryByMaterial = async (materialType: string, reference?: string) => {
  const where: any = { materialType };
  
  if (reference) {
    where.reference = reference;
  }

  return prisma.inventory.findMany({
    where,
    include: inventoryInclude,
    orderBy: {
      date: 'desc',
    },
  });
};

export const findLatestInventoryByMaterial = async (materialType: string, reference: string) => {
  return prisma.inventory.findFirst({
    where: {
      materialType,
      reference,
    },
    include: inventoryInclude,
    orderBy: {
      date: 'desc',
    },
  });
};

export const createInventory = async (data: CreateInventoryData) => {
  try {
    // Verifica che il MaterialType esista se specificato
    if (data.materialTypeId) {
      const materialType = await prisma.materialType.findUnique({
        where: { id: data.materialTypeId },
      });
      if (!materialType) {
        throw new HttpException(400, 'Tipo materiale non trovato');
      }
    }

    // Controlla se esiste già un record per la stessa data/materiale/riferimento
    const existing = await prisma.inventory.findFirst({
      where: {
        date: new Date(data.date),
        materialType: data.materialType,
        reference: data.reference,
        materialTypeId: data.materialTypeId,
      },
    });

    if (existing) {
      throw new HttpException(400, 'Esiste già un movimento per questa data e materiale');
    }

    return await prisma.inventory.create({
      data: {
        ...data,
        date: new Date(data.date),
        deliveries: data.deliveries,
        processing: data.processing,
        shipments: data.shipments,
        adjustments: data.adjustments,
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

export const updateInventory = async (id: string, data: UpdateInventoryData) => {
  try {
    // Verifica che il movimento esista
    const existingInventory = await prisma.inventory.findUnique({
      where: { id },
    });

    if (!existingInventory) {
      throw new HttpException(404, 'Movimento di giacenza non trovato');
    }

    // Verifica che il MaterialType esista se specificato
    if (data.materialTypeId) {
      const materialType = await prisma.materialType.findUnique({
        where: { id: data.materialTypeId },
      });
      if (!materialType) {
        throw new HttpException(400, 'Tipo materiale non trovato');
      }
    }

    return await prisma.inventory.update({
      where: { id },
      data: {
        ...data,
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

export const deleteInventory = async (id: string) => {
  try {
    // Verifica che il movimento esista
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

export const calculateMovement = async (data: InventoryMovement[], currentStock: number) => {
  let newStock = currentStock;
  
  for (const movement of data) {
    switch (movement.type) {
      case 'DELIVERY':
        newStock += movement.quantity;
        break;
      case 'PROCESSING':
      case 'SHIPMENT':
        newStock -= movement.quantity;
        break;
      case 'ADJUSTMENT':
        newStock += movement.quantity; // Può essere negativo
        break;
    }
  }
  
  return newStock;
};

export const getInventoryStats = async () => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [currentStocks, monthlyMovements, materialBreakdown] = await Promise.all([
      // Giacenze correnti per materiale
      prisma.inventory.groupBy({
        by: ['materialType', 'reference'],
        _sum: {
          finalStock: true,
        },
        orderBy: {
          materialType: 'asc',
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
        by: ['materialType'],
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

export const getInventoryReport = async (startDate: Date, endDate: Date, materialType?: string) => {
  try {
    const where: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (materialType) {
      where.materialType = materialType;
    }

    const movements = await prisma.inventory.findMany({
      where,
      include: inventoryInclude,
      orderBy: [
        { materialType: 'asc' },
        { reference: 'asc' },
        { date: 'asc' },
      ],
    });

    // Raggruppa per materiale e calcola i totali
    const summary = movements.reduce((acc, movement) => {
      const key = `${movement.materialType}-${movement.reference}`;
      
      if (!acc[key]) {
        acc[key] = {
          materialType: movement.materialType,
          reference: movement.reference,
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