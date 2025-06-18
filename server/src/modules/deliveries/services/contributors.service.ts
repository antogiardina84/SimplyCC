// server/src/modules/deliveries/services/contributors.service.ts

import { PrismaClient, Prisma } from '@prisma/client';
import { HttpException } from '../../../core/middleware/error.middleware';

const prisma = new PrismaClient();

// ================================
// INTERFACES
// ================================

export interface CreateContributorData {
  name: string;
  vatNumber?: string;
  fiscalCode?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  province?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  basinId?: string;
  authorizedMaterialTypes: string[]; // Array di codici tipologia (es: ["MONO", "MULTI"])
  notes?: string;
}

export interface UpdateContributorData extends Partial<CreateContributorData> {
  isActive?: boolean;
}

export interface ContributorFilters {
  search?: string; // Ricerca per nome
  basinId?: string;
  materialTypeCode?: string; // Filtra per tipologia autorizzata
  isActive?: boolean;
}

// ================================
// SERVIZI CONFERITORI
// ================================

export const findAllContributors = async (filters: ContributorFilters = {}) => {
  const where: Prisma.ContributorWhereInput = {};

  // Ricerca testuale
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { vatNumber: { contains: filters.search, mode: 'insensitive' } },
      { fiscalCode: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  // Filtro per bacino
  if (filters.basinId) {
    where.basinId = filters.basinId;
  }

  // Filtro per stato attivo
  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  const contributors = await prisma.contributor.findMany({
    where,
    include: {
      basin: true,
      _count: {
        select: {
          deliveries: true
        }
      }
    },
    orderBy: [
      { name: 'asc' }
    ]
  });

  // Filtro per tipologia materiale autorizzata (post-query perché è JSON)
  if (filters.materialTypeCode) {
    return contributors.filter(contributor => {
      const authorizedTypes = JSON.parse(contributor.authorizedMaterialTypes || '[]');
      return authorizedTypes.includes(filters.materialTypeCode);
    });
  }

  return contributors;
};

export const findContributorById = async (id: string) => {
  const contributor = await prisma.contributor.findUnique({
    where: { id },
    include: {
      basin: true,
      deliveries: {
        include: {
          materialType: true
        },
        orderBy: {
          date: 'desc'
        },
        take: 10 // Ultimi 10 conferimenti
      },
      _count: {
        select: {
          deliveries: true
        }
      }
    }
  });

  if (!contributor) {
    throw new HttpException(404, 'Conferitore non trovato');
  }

  return contributor;
};

export const createContributor = async (data: CreateContributorData) => {
  try {
    // Verifica unicità partita IVA se fornita
    if (data.vatNumber) {
      const existingVat = await prisma.contributor.findFirst({
        where: { vatNumber: data.vatNumber }
      });
      if (existingVat) {
        throw new HttpException(400, 'Partita IVA già registrata');
      }
    }

    // Verifica unicità codice fiscale se fornito
    if (data.fiscalCode) {
      const existingFiscal = await prisma.contributor.findFirst({
        where: { fiscalCode: data.fiscalCode }
      });
      if (existingFiscal) {
        throw new HttpException(400, 'Codice fiscale già registrato');
      }
    }

    // Verifica che il bacino esista se fornito
    if (data.basinId) {
      const basin = await prisma.basin.findUnique({
        where: { id: data.basinId }
      });
      if (!basin) {
        throw new HttpException(404, 'Bacino non trovato');
      }
    }

    // Verifica che le tipologie materiali esistano
    if (data.authorizedMaterialTypes.length > 0) {
      const materialTypes = await prisma.materialType.findMany({
        where: {
          code: {
            in: data.authorizedMaterialTypes
          }
        }
      });

      if (materialTypes.length !== data.authorizedMaterialTypes.length) {
        const foundCodes = materialTypes.map(mt => mt.code);
        const missingCodes = data.authorizedMaterialTypes.filter(code => !foundCodes.includes(code));
        throw new HttpException(400, `Tipologie materiali non trovate: ${missingCodes.join(', ')}`);
      }
    }

    // Prepara i dati per la creazione usando la sintassi Prisma corretta
    const createData: Prisma.ContributorCreateInput = {
      name: data.name,
      vatNumber: data.vatNumber,
      fiscalCode: data.fiscalCode,
      address: data.address,
      city: data.city,
      zipCode: data.zipCode,
      province: data.province,
      phone: data.phone,
      email: data.email,
      contactPerson: data.contactPerson,
      notes: data.notes,
      authorizedMaterialTypes: JSON.stringify(data.authorizedMaterialTypes)
    };

    // Gestione relazione bacino
    if (data.basinId) {
      createData.basin = { connect: { id: data.basinId } };
    }

    const contributor = await prisma.contributor.create({
      data: createData,
      include: {
        basin: true
      }
    });

    return contributor;
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new HttpException(500, 'Errore durante la creazione del conferitore');
  }
};

export const updateContributor = async (id: string, data: UpdateContributorData) => {
  const contributor = await prisma.contributor.findUnique({
    where: { id }
  });

  if (!contributor) {
    throw new HttpException(404, 'Conferitore non trovato');
  }

  // Verifica unicità partita IVA se modificata
  if (data.vatNumber && data.vatNumber !== contributor.vatNumber) {
    const existingVat = await prisma.contributor.findFirst({
      where: { 
        vatNumber: data.vatNumber,
        id: { not: id }
      }
    });
    if (existingVat) {
      throw new HttpException(400, 'Partita IVA già registrata');
    }
  }

  // Verifica unicità codice fiscale se modificato
  if (data.fiscalCode && data.fiscalCode !== contributor.fiscalCode) {
    const existingFiscal = await prisma.contributor.findFirst({
      where: { 
        fiscalCode: data.fiscalCode,
        id: { not: id }
      }
    });
    if (existingFiscal) {
      throw new HttpException(400, 'Codice fiscale già registrato');
    }
  }

  // Verifica bacino se modificato
  if (data.basinId && data.basinId !== contributor.basinId) {
    const basin = await prisma.basin.findUnique({
      where: { id: data.basinId }
    });
    if (!basin) {
      throw new HttpException(404, 'Bacino non trovato');
    }
  }

  // Verifica tipologie materiali se modificate
  if (data.authorizedMaterialTypes && data.authorizedMaterialTypes.length > 0) {
    const materialTypes = await prisma.materialType.findMany({
      where: {
        code: {
          in: data.authorizedMaterialTypes
        }
      }
    });

    if (materialTypes.length !== data.authorizedMaterialTypes.length) {
      const foundCodes = materialTypes.map(mt => mt.code);
      const missingCodes = data.authorizedMaterialTypes.filter(code => !foundCodes.includes(code));
      throw new HttpException(400, `Tipologie materiali non trovate: ${missingCodes.join(', ')}`);
    }
  }

  // Prepara i dati base per l'aggiornamento
  const updateData: Prisma.ContributorUpdateInput = {};

  // Aggiungi solo i campi che sono stati forniti
  if (data.name !== undefined) updateData.name = data.name;
  if (data.vatNumber !== undefined) updateData.vatNumber = data.vatNumber;
  if (data.fiscalCode !== undefined) updateData.fiscalCode = data.fiscalCode;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.zipCode !== undefined) updateData.zipCode = data.zipCode;
  if (data.province !== undefined) updateData.province = data.province;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.contactPerson !== undefined) updateData.contactPerson = data.contactPerson;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  // Gestione relazione bacino usando la sintassi Prisma corretta
  if (data.basinId !== undefined) {
    if (data.basinId === null || data.basinId === '') {
      // Disconnetti il bacino
      updateData.basin = { disconnect: true };
    } else {
      // Connetti al nuovo bacino
      updateData.basin = { connect: { id: data.basinId } };
    }
  }
  
  // Gestione tipologie materiali autorizzate
  if (data.authorizedMaterialTypes) {
    updateData.authorizedMaterialTypes = JSON.stringify(data.authorizedMaterialTypes);
  }

  return prisma.contributor.update({
    where: { id },
    data: updateData,
    include: {
      basin: true
    }
  });
};

export const deleteContributor = async (id: string) => {
  const contributor = await prisma.contributor.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          deliveries: true
        }
      }
    }
  });

  if (!contributor) {
    throw new HttpException(404, 'Conferitore non trovato');
  }

  // Non permettere cancellazione se ha conferimenti
  if (contributor._count.deliveries > 0) {
    throw new HttpException(400, 'Impossibile eliminare un conferitore con conferimenti registrati. Disattivarlo invece.');
  }

  return prisma.contributor.delete({
    where: { id }
  });
};

// ================================
// SERVIZI AGGREGAZIONI E STATISTICHE
// ================================

export const getContributorsByMaterialType = async (materialTypeCode: string) => {
  const contributors = await prisma.contributor.findMany({
    where: {
      isActive: true
    },
    include: {
      basin: true
    },
    orderBy: {
      name: 'asc'
    }
  });

  // Filtra per tipologia autorizzata
  return contributors.filter(contributor => {
    const authorizedTypes = JSON.parse(contributor.authorizedMaterialTypes || '[]');
    return authorizedTypes.includes(materialTypeCode);
  });
};

interface ContributorStatistics {
  contributor: {
    id: string;
    name: string;
    isActive: boolean;
  };
  year: number;
  totals: {
    totalWeight: number;
    totalDeliveries: number;
    uniqueMaterialTypes: number;
  };
  materialTypeBreakdown: Array<{
    materialTypeId: string;
    materialTypeName: string;
    totalWeight: number;
    deliveriesCount: number;
    averageWeight: number;
    lastDeliveryDate: Date | null;
  }>;
  monthlyTrend: Array<{
    month: number;
    totalWeight: number;
    deliveriesCount: number;
  }>;
  firstDeliveryDate: Date | null;
  lastDeliveryDate: Date | null;
}

export const getContributorStatistics = async (contributorId: string, year?: number): Promise<ContributorStatistics> => {
  const contributor = await prisma.contributor.findUnique({
    where: { id: contributorId }
  });

  if (!contributor) {
    throw new HttpException(404, 'Conferitore non trovato');
  }

  const currentYear = year || new Date().getFullYear();
  const startDate = new Date(currentYear, 0, 1); // 1 gennaio
  const endDate = new Date(currentYear, 11, 31, 23, 59, 59); // 31 dicembre

  const deliveries = await prisma.delivery.findMany({
    where: {
      contributorId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      materialType: true
    },
    orderBy: {
      date: 'asc'
    }
  });

  // Calcola statistiche per tipologia
  const materialTypeStats = new Map<string, {
    materialTypeId: string;
    materialTypeName: string;
    totalWeight: number;
    deliveriesCount: number;
    averageWeight: number;
    lastDeliveryDate: Date | null;
  }>();

  deliveries.forEach(delivery => {
    const key = delivery.materialTypeId;
    if (!materialTypeStats.has(key)) {
      materialTypeStats.set(key, {
        materialTypeId: key,
        materialTypeName: delivery.materialType.name,
        totalWeight: 0,
        deliveriesCount: 0,
        averageWeight: 0,
        lastDeliveryDate: null
      });
    }

    const stats = materialTypeStats.get(key)!;
    stats.totalWeight += delivery.weight;
    stats.deliveriesCount += 1;
    stats.lastDeliveryDate = delivery.date;
  });

  // Calcola medie
  const materialStats = Array.from(materialTypeStats.values()).map(stats => ({
    ...stats,
    averageWeight: stats.totalWeight / stats.deliveriesCount
  }));

  return {
    contributor: {
      id: contributor.id,
      name: contributor.name,
      isActive: contributor.isActive
    },
    year: currentYear,
    totals: {
      totalWeight: deliveries.reduce((sum, d) => sum + d.weight, 0),
      totalDeliveries: deliveries.length,
      uniqueMaterialTypes: materialTypeStats.size
    },
    materialTypeBreakdown: materialStats,
    monthlyTrend: getMonthlyTrend(deliveries),
    firstDeliveryDate: deliveries.length > 0 ? deliveries[0].date : null,
    lastDeliveryDate: deliveries.length > 0 ? deliveries[deliveries.length - 1].date : null
  };
};

// Funzione helper per calcolare trend mensile
interface DeliveryWithDate {
  date: Date;
  weight: number;
}

function getMonthlyTrend(deliveries: DeliveryWithDate[]) {
  const monthlyData = new Map<number, {
    month: number;
    totalWeight: number;
    deliveriesCount: number;
  }>();

  // Inizializza tutti i mesi
  for (let month = 0; month < 12; month++) {
    const monthKey = month + 1; // 1-12
    monthlyData.set(monthKey, {
      month: monthKey,
      totalWeight: 0,
      deliveriesCount: 0
    });
  }

  // Aggrega i dati
  deliveries.forEach(delivery => {
    const month = delivery.date.getMonth() + 1;
    const data = monthlyData.get(month)!;
    data.totalWeight += delivery.weight;
    data.deliveriesCount += 1;
  });

  return Array.from(monthlyData.values());
}