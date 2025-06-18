// server/src/modules/deliveries/services/materialTypes.service.ts

import { PrismaClient, Prisma } from '@prisma/client';
import { HttpException } from '../../../core/middleware/error.middleware';

const prisma = new PrismaClient();

// ================================
// INTERFACES
// ================================

export interface CreateMaterialTypeData {
  code: string;
  name: string;
  description?: string;
  unit?: string;
  cerCode?: string;
  reference?: string;
  color?: string;
  sortOrder?: number;
  parentId?: string;
}

export interface UpdateMaterialTypeData extends Partial<CreateMaterialTypeData> {
  isActive?: boolean;
}

// ================================
// SERVIZI TIPOLOGIE MATERIALI
// ================================

export const findAllMaterialTypes = async (includeInactive: boolean = false) => {
  const where: Prisma.MaterialTypeWhereInput = {};
  
  if (!includeInactive) {
    where.isActive = true;
  }

  return prisma.materialType.findMany({
    where,
    include: {
      parent: true,
      children: {
        where: includeInactive ? {} : { isActive: true },
        orderBy: { sortOrder: 'asc' }
      },
      _count: {
        select: {
          deliveries: true,
          children: true
        }
      }
    },
    orderBy: [
      { sortOrder: 'asc' },
      { name: 'asc' }
    ]
  });
};

export const findMaterialTypeById = async (id: string) => {
  const materialType = await prisma.materialType.findUnique({
    where: { id },
    include: {
      parent: true,
      children: {
        orderBy: { sortOrder: 'asc' }
      },
      deliveries: {
        include: {
          contributor: true
        },
        orderBy: {
          date: 'desc'
        },
        take: 10 // Ultimi 10 conferimenti
      },
      _count: {
        select: {
          deliveries: true,
          children: true
        }
      }
    }
  });

  if (!materialType) {
    throw new HttpException(404, 'Tipologia materiale non trovata');
  }

  return materialType;
};

export const findMaterialTypeByCode = async (code: string) => {
  const materialType = await prisma.materialType.findUnique({
    where: { code },
    include: {
      parent: true,
      children: true
    }
  });

  if (!materialType) {
    throw new HttpException(404, 'Tipologia materiale non trovata');
  }

  return materialType;
};

export const createMaterialType = async (data: CreateMaterialTypeData) => {
  try {
    // Verifica unicità codice
    const existingCode = await prisma.materialType.findUnique({
      where: { code: data.code }
    });

    if (existingCode) {
      throw new HttpException(400, 'Codice tipologia già esistente');
    }

    // Verifica che il parent esista se fornito
    if (data.parentId) {
      const parent = await prisma.materialType.findUnique({
        where: { id: data.parentId }
      });
      if (!parent) {
        throw new HttpException(404, 'Tipologia padre non trovata');
      }
    }

    // Se non è specificato sortOrder, prendi il prossimo disponibile
    if (!data.sortOrder) {
      const lastMaterialType = await prisma.materialType.findFirst({
        where: { parentId: data.parentId || null },
        orderBy: { sortOrder: 'desc' }
      });
      data.sortOrder = (lastMaterialType?.sortOrder || 0) + 1;
    }

    const materialType = await prisma.materialType.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        unit: data.unit || 'kg',
        cerCode: data.cerCode,
        reference: data.reference,
        color: data.color,
        sortOrder: data.sortOrder,
        parentId: data.parentId
      },
      include: {
        parent: true,
        children: true
      }
    });

    return materialType;
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new HttpException(500, 'Errore durante la creazione della tipologia materiale');
  }
};

export const updateMaterialType = async (id: string, data: UpdateMaterialTypeData) => {
  const materialType = await prisma.materialType.findUnique({
    where: { id }
  });

  if (!materialType) {
    throw new HttpException(404, 'Tipologia materiale non trovata');
  }

  // Verifica unicità codice se modificato
  if (data.code && data.code !== materialType.code) {
    const existingCode = await prisma.materialType.findUnique({
      where: { code: data.code }
    });
    if (existingCode) {
      throw new HttpException(400, 'Codice tipologia già esistente');
    }
  }

  // Verifica che il parent non crei cicli
  if (data.parentId && data.parentId !== materialType.parentId) {
    // Non può essere padre di se stesso
    if (data.parentId === id) {
      throw new HttpException(400, 'Una tipologia non può essere padre di se stessa');
    }

    // Verifica che non sia già un figlio della tipologia che stiamo modificando
    const wouldBeParent = await prisma.materialType.findUnique({
      where: { id: data.parentId },
      include: { parent: true }
    });

    if (wouldBeParent?.parentId === id) {
      throw new HttpException(400, 'Relazione circolare non permessa');
    }
  }

  return prisma.materialType.update({
    where: { id },
    data,
    include: {
      parent: true,
      children: true
    }
  });
};

export const deleteMaterialType = async (id: string) => {
  const materialType = await prisma.materialType.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          deliveries: true,
          children: true
        }
      }
    }
  });

  if (!materialType) {
    throw new HttpException(404, 'Tipologia materiale non trovata');
  }

  // Non permettere cancellazione se ha conferimenti
  if (materialType._count.deliveries > 0) {
    throw new HttpException(400, 'Impossibile eliminare una tipologia con conferimenti registrati');
  }

  // Non permettere cancellazione se ha figli
  if (materialType._count.children > 0) {
    throw new HttpException(400, 'Impossibile eliminare una tipologia che ha sottocategorie');
  }

  return prisma.materialType.delete({
    where: { id }
  });
};

// ================================
// SERVIZI AGGREGAZIONI E STATISTICHE
// ================================

interface MaterialTypeStatistics {
  materialType: {
    id: string;
    code: string;
    name: string;
    isParent: boolean;
  };
  year: number;
  totals: {
    totalWeight: number;
    totalDeliveries: number;
    uniqueContributors: number;
  };
  contributorBreakdown: Array<{
    contributorId: string;
    contributorName: string;
    basinName: string;
    totalWeight: number;
    deliveriesCount: number;
    lastDeliveryDate: Date | null;
  }>;
  subtypeBreakdown: Array<{
    materialTypeId: string;
    materialTypeName: string;
    totalWeight: number;
    deliveriesCount: number;
  }>;
  monthlyTrend: Array<{
    month: number;
    totalWeight: number;
    deliveriesCount: number;
    uniqueContributors: number;
  }>;
  firstDeliveryDate: Date | null;
  lastDeliveryDate: Date | null;
}

export const getMaterialTypeStatistics = async (materialTypeId: string, year?: number): Promise<MaterialTypeStatistics> => {
  const materialType = await prisma.materialType.findUnique({
    where: { id: materialTypeId },
    include: {
      parent: true,
      children: true
    }
  });

  if (!materialType) {
    throw new HttpException(404, 'Tipologia materiale non trovata');
  }

  const currentYear = year || new Date().getFullYear();
  const startDate = new Date(currentYear, 0, 1);
  const endDate = new Date(currentYear, 11, 31, 23, 59, 59);

  // Include anche i figli se è una categoria padre
  const materialTypeIds = [materialTypeId, ...materialType.children.map(child => child.id)];

  const deliveries = await prisma.delivery.findMany({
    where: {
      materialTypeId: {
        in: materialTypeIds
      },
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      contributor: {
        include: {
          basin: true
        }
      },
      materialType: true
    },
    orderBy: {
      date: 'asc'
    }
  });

  // Statistiche per contributore
  const contributorStats = new Map<string, {
    contributorId: string;
    contributorName: string;
    basinName: string;
    totalWeight: number;
    deliveriesCount: number;
    lastDeliveryDate: Date | null;
  }>();
  
  deliveries.forEach(delivery => {
    const key = delivery.contributorId;
    if (!contributorStats.has(key)) {
      contributorStats.set(key, {
        contributorId: key,
        contributorName: delivery.contributor.name,
        basinName: delivery.contributor.basin?.description || 'N/A',
        totalWeight: 0,
        deliveriesCount: 0,
        lastDeliveryDate: null
      });
    }

    const stats = contributorStats.get(key)!;
    stats.totalWeight += delivery.weight;
    stats.deliveriesCount += 1;
    stats.lastDeliveryDate = delivery.date;
  });

  // Statistiche per sottotipologia (se applicabile)
  const subtypeStats = new Map<string, {
    materialTypeId: string;
    materialTypeName: string;
    totalWeight: number;
    deliveriesCount: number;
  }>();
  
  deliveries.forEach(delivery => {
    if (delivery.materialTypeId !== materialTypeId) { // È una sottotipologia
      const key = delivery.materialTypeId;
      if (!subtypeStats.has(key)) {
        subtypeStats.set(key, {
          materialTypeId: key,
          materialTypeName: delivery.materialType.name,
          totalWeight: 0,
          deliveriesCount: 0
        });
      }

      const stats = subtypeStats.get(key)!;
      stats.totalWeight += delivery.weight;
      stats.deliveriesCount += 1;
    }
  });

  return {
    materialType: {
      id: materialType.id,
      code: materialType.code,
      name: materialType.name,
      isParent: materialType.children.length > 0
    },
    year: currentYear,
    totals: {
      totalWeight: deliveries.reduce((sum, d) => sum + d.weight, 0),
      totalDeliveries: deliveries.length,
      uniqueContributors: contributorStats.size
    },
    contributorBreakdown: Array.from(contributorStats.values()),
    subtypeBreakdown: Array.from(subtypeStats.values()),
    monthlyTrend: getMonthlyTrendForMaterial(deliveries),
    firstDeliveryDate: deliveries.length > 0 ? deliveries[0].date : null,
    lastDeliveryDate: deliveries.length > 0 ? deliveries[deliveries.length - 1].date : null
  };
};

export const getHierarchicalMaterialTypes = async () => {
  const parentTypes = await prisma.materialType.findMany({
    where: {
      parentId: null,
      isActive: true
    },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
      }
    },
    orderBy: { sortOrder: 'asc' }
  });

  return parentTypes;
};

// Funzione helper per trend mensile
interface DeliveryWithDate {
  date: Date;
  weight: number;
  contributorId: string;
}

function getMonthlyTrendForMaterial(deliveries: DeliveryWithDate[]) {
  const monthlyData = new Map<number, {
    month: number;
    totalWeight: number;
    deliveriesCount: number;
    uniqueContributors: Set<string>;
  }>();

  // Inizializza tutti i mesi
  for (let month = 0; month < 12; month++) {
    const monthKey = month + 1;
    monthlyData.set(monthKey, {
      month: monthKey,
      totalWeight: 0,
      deliveriesCount: 0,
      uniqueContributors: new Set()
    });
  }

  // Aggrega i dati
  deliveries.forEach(delivery => {
    const month = delivery.date.getMonth() + 1;
    const data = monthlyData.get(month)!;
    data.totalWeight += delivery.weight;
    data.deliveriesCount += 1;
    data.uniqueContributors.add(delivery.contributorId);
  });

  // Converte Set in count
  return Array.from(monthlyData.values()).map(data => ({
    month: data.month,
    totalWeight: data.totalWeight,
    deliveriesCount: data.deliveriesCount,
    uniqueContributors: data.uniqueContributors.size
  }));
}