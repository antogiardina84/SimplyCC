// server/src/modules/deliveries/services/deliveries.service.ts

import { PrismaClient, Prisma } from '@prisma/client';
import { HttpException } from '../../../core/middleware/error.middleware';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, format } from 'date-fns';

const prisma = new PrismaClient();

// ================================
// INTERFACES
// ================================

export interface CreateDeliveryData {
  date: Date | string;
  contributorId: string;
  materialTypeId: string;
  weight: number;
  unit?: string;
  documentNumber?: string;
  vehiclePlate?: string;
  driverName?: string;
  quality?: string;
  moistureLevel?: string;
  contaminationLevel?: string;
  notes?: string;
  createdBy?: string;
}

export interface UpdateDeliveryData extends Partial<CreateDeliveryData> {
  isValidated?: boolean;
  validatedBy?: string;
}

export interface DeliveryFilters {
  startDate?: Date;
  endDate?: Date;
  contributorId?: string;
  materialTypeId?: string;
  basinId?: string;
  isValidated?: boolean;
}

export interface MaterialBreakdown {
  materialTypeId: string;
  materialTypeName: string;
  totalWeight: number;
  count: number;
}

export interface DayDeliveriesSummary {
  date: string;
  totalWeight: number;
  deliveriesCount: number;
  materialsBreakdown: MaterialBreakdown[];
  hasDeliveries: boolean;
}

export interface MonthlyCalendarData {
  month: string; // YYYY-MM
  days: DayDeliveriesSummary[];
  monthlyTotals: {
    totalWeight: number;
    totalDeliveries: number;
    materialTypeBreakdown: MaterialBreakdown[];
  };
}

// ================================
// SERVIZI CONFERIMENTI
// ================================

export const findDeliveriesByFilters = async (filters: DeliveryFilters = {}) => {
  const where: Prisma.DeliveryWhereInput = {};

  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) where.date.gte = filters.startDate;
    if (filters.endDate) where.date.lte = filters.endDate;
  }

  if (filters.contributorId) where.contributorId = filters.contributorId;
  if (filters.materialTypeId) where.materialTypeId = filters.materialTypeId;
  if (filters.basinId) where.basinId = filters.basinId;
  if (filters.isValidated !== undefined) where.isValidated = filters.isValidated;

  return prisma.delivery.findMany({
    where,
    include: {
      contributor: {
        include: {
          basin: true
        }
      },
      materialType: {
        include: {
          parent: true
        }
      },
      basin: true
    },
    orderBy: [
      { date: 'desc' },
      { createdAt: 'desc' }
    ]
  });
};

export const findDeliveryById = async (id: string) => {
  const delivery = await prisma.delivery.findUnique({
    where: { id },
    include: {
      contributor: {
        include: {
          basin: true
        }
      },
      materialType: {
        include: {
          parent: true
        }
      },
      basin: true
    }
  });

  if (!delivery) {
    throw new HttpException(404, 'Conferimento non trovato');
  }

  return delivery;
};

export const createDelivery = async (data: CreateDeliveryData) => {
  try {
    // Verifica che contributor e materialType esistano
    const [contributor, materialType] = await Promise.all([
      prisma.contributor.findUnique({
        where: { id: data.contributorId },
        include: { basin: true }
      }),
      prisma.materialType.findUnique({
        where: { id: data.materialTypeId }
      })
    ]);

    if (!contributor) {
      throw new HttpException(404, 'Conferitore non trovato');
    }

    if (!materialType) {
      throw new HttpException(404, 'Tipologia materiale non trovata');
    }

    // Verifica che il conferitore sia autorizzato per questa tipologia
    const authorizedTypes = JSON.parse(contributor.authorizedMaterialTypes || '[]');
    if (!authorizedTypes.includes(materialType.code)) {
      throw new HttpException(400, `Il conferitore non è autorizzato per la tipologia ${materialType.name}`);
    }

    // Verifica duplicati (stesso giorno, conferitore, materiale)
    const existingDelivery = await prisma.delivery.findFirst({
      where: {
        date: {
          gte: startOfDay(new Date(data.date)),
          lte: endOfDay(new Date(data.date))
        },
        contributorId: data.contributorId,
        materialTypeId: data.materialTypeId
      }
    });

    if (existingDelivery) {
      throw new HttpException(400, 'Esiste già un conferimento per questo conferitore e tipologia nella data selezionata');
    }

    // Crea il conferimento
    const delivery = await prisma.delivery.create({
      data: {
        date: new Date(data.date),
        contributorId: data.contributorId,
        materialTypeId: data.materialTypeId,
        basinId: contributor.basinId, // Eredita dal conferitore
        weight: data.weight,
        unit: data.unit || 'kg',
        documentNumber: data.documentNumber,
        vehiclePlate: data.vehiclePlate,
        driverName: data.driverName,
        quality: data.quality,
        moistureLevel: data.moistureLevel,
        contaminationLevel: data.contaminationLevel,
        notes: data.notes,
        createdBy: data.createdBy
      },
      include: {
        contributor: {
          include: {
            basin: true
          }
        },
        materialType: {
          include: {
            parent: true
          }
        },
        basin: true
      }
    });

    return delivery;
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new HttpException(500, 'Errore durante la creazione del conferimento');
  }
};

export const updateDelivery = async (id: string, data: UpdateDeliveryData) => {
  const delivery = await prisma.delivery.findUnique({
    where: { id },
    include: { contributor: true, materialType: true }
  });

  if (!delivery) {
    throw new HttpException(404, 'Conferimento non trovato');
  }

  // Se viene aggiornato contributor o materialType, verifica autorizzazioni
  if (data.contributorId || data.materialTypeId) {
    const contributorId = data.contributorId || delivery.contributorId;
    const materialTypeId = data.materialTypeId || delivery.materialTypeId;

    const [contributor, materialType] = await Promise.all([
      prisma.contributor.findUnique({ where: { id: contributorId } }),
      prisma.materialType.findUnique({ where: { id: materialTypeId } })
    ]);

    if (contributor && materialType) {
      const authorizedTypes = JSON.parse(contributor.authorizedMaterialTypes || '[]');
      if (!authorizedTypes.includes(materialType.code)) {
        throw new HttpException(400, `Il conferitore non è autorizzato per la tipologia ${materialType.name}`);
      }
    }
  }

  // Aggiorna validazione se richiesta
  const updateData: Prisma.DeliveryUpdateInput = { ...data };
  if (data.isValidated && !delivery.isValidated) {
    updateData.validatedAt = new Date();
  }

  return prisma.delivery.update({
    where: { id },
    data: updateData,
    include: {
      contributor: {
        include: {
          basin: true
        }
      },
      materialType: {
        include: {
          parent: true
        }
      },
      basin: true
    }
  });
};

export const deleteDelivery = async (id: string) => {
  const delivery = await prisma.delivery.findUnique({
    where: { id }
  });

  if (!delivery) {
    throw new HttpException(404, 'Conferimento non trovato');
  }

  // Non permettere cancellazione se validato
  if (delivery.isValidated) {
    throw new HttpException(400, 'Impossibile eliminare un conferimento già validato');
  }

  return prisma.delivery.delete({
    where: { id }
  });
};

// ================================
// SERVIZI CALENDARIO E AGGREGAZIONI
// ================================

interface DeliveryWithMaterial {
  date: Date;
  weight: number;
  materialTypeId: string;
  materialType: {
    name: string;
  };
  contributor: unknown;
}

export const getMonthlyCalendarData = async (
  year: number, 
  month: number, // 1-12
  materialTypeId?: string,
  basinId?: string
): Promise<MonthlyCalendarData> => {
  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(new Date(year, month - 1));

  const where: Prisma.DeliveryWhereInput = {
    date: {
      gte: startDate,
      lte: endDate
    }
  };

  if (materialTypeId) where.materialTypeId = materialTypeId;
  if (basinId) where.basinId = basinId;

  const deliveries = await prisma.delivery.findMany({
    where,
    include: {
      materialType: true,
      contributor: true
    },
    orderBy: { date: 'asc' }
  });

  // Raggruppa per giorno
  const dayGroups = new Map<string, DeliveryWithMaterial[]>();
  
  deliveries.forEach(delivery => {
    const dayKey = format(delivery.date, 'yyyy-MM-dd');
    if (!dayGroups.has(dayKey)) {
      dayGroups.set(dayKey, []);
    }
    dayGroups.get(dayKey)!.push(delivery);
  });

  // Crea i dati per ogni giorno del mese
  const days: DayDeliveriesSummary[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayKey = format(currentDate, 'yyyy-MM-dd');
    const dayDeliveries = dayGroups.get(dayKey) || [];
    
    // Calcola breakdown per tipologia
    const materialsMap = new Map<string, { name: string; weight: number; count: number }>();
    
    dayDeliveries.forEach(delivery => {
      const key = delivery.materialTypeId;
      if (!materialsMap.has(key)) {
        materialsMap.set(key, {
          name: delivery.materialType.name,
          weight: 0,
          count: 0
        });
      }
      const material = materialsMap.get(key)!;
      material.weight += delivery.weight;
      material.count += 1;
    });

    const materialsBreakdown = Array.from(materialsMap.entries()).map(([id, data]) => ({
      materialTypeId: id,
      materialTypeName: data.name,
      totalWeight: data.weight,
      count: data.count
    }));

    days.push({
      date: dayKey,
      totalWeight: dayDeliveries.reduce((sum, d) => sum + d.weight, 0),
      deliveriesCount: dayDeliveries.length,
      materialsBreakdown,
      hasDeliveries: dayDeliveries.length > 0
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Calcola totali mensili
  const monthlyMaterialsMap = new Map<string, { name: string; weight: number; count: number }>();
  
  deliveries.forEach(delivery => {
    const key = delivery.materialTypeId;
    if (!monthlyMaterialsMap.has(key)) {
      monthlyMaterialsMap.set(key, {
        name: delivery.materialType.name,
        weight: 0,
        count: 0
      });
    }
    const material = monthlyMaterialsMap.get(key)!;
    material.weight += delivery.weight;
    material.count += 1;
  });

  const materialTypeBreakdown = Array.from(monthlyMaterialsMap.entries()).map(([id, data]) => ({
    materialTypeId: id,
    materialTypeName: data.name,
    totalWeight: data.weight,
    count: data.count
  }));

  return {
    month: format(startDate, 'yyyy-MM'),
    days,
    monthlyTotals: {
      totalWeight: deliveries.reduce((sum, d) => sum + d.weight, 0),
      totalDeliveries: deliveries.length,
      materialTypeBreakdown
    }
  };
};

export const getDayDeliveries = async (date: string, materialTypeId?: string) => {
  const startDate = startOfDay(new Date(date));
  const endDate = endOfDay(new Date(date));

  const where: Prisma.DeliveryWhereInput = {
    date: {
      gte: startDate,
      lte: endDate
    }
  };

  if (materialTypeId) where.materialTypeId = materialTypeId;

  return prisma.delivery.findMany({
    where,
    include: {
      contributor: {
        include: {
          basin: true
        }
      },
      materialType: {
        include: {
          parent: true
        }
      }
    },
    orderBy: [
      { materialType: { sortOrder: 'asc' } },
      { contributor: { name: 'asc' } },
      { createdAt: 'desc' }
    ]
  });
};