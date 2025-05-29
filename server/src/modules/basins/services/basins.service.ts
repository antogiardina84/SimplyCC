// server/src/modules/basins/services/basins.service.ts

import { PrismaClient } from '@prisma/client';
import { HttpException } from '../../../core/middleware/error.middleware';

const prisma = new PrismaClient();

export interface CreateBasinData {
  code: string;
  description?: string;
  flowType: string;
  clientId: string;
}

export interface UpdateBasinData {
  code?: string;
  description?: string;
  flowType?: string;
  clientId?: string;
}

/**
 * Ottiene tutti i bacini con le informazioni del cliente
 */
export const findAllBasins = async () => {
  return prisma.basin.findMany({
    include: {
      client: {
        select: {
          id: true,
          name: true,
          vatNumber: true,
        },
      },
    },
    orderBy: {
      code: 'asc',
    },
  });
};

/**
 * Trova un bacino per ID
 */
export const findBasinById = async (id: string) => {
  const basin = await prisma.basin.findUnique({
    where: { id },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          vatNumber: true,
          email: true,
          address: true,
          city: true,
        },
      },
      pickupOrders: {
        select: {
          id: true,
          orderNumber: true,
          issueDate: true,
          status: true,
        },
        orderBy: {
          issueDate: 'desc',
        },
        take: 10, // Solo gli ultimi 10 ordini
      },
    },
  });

  if (!basin) {
    throw new HttpException(404, 'Bacino non trovato');
  }

  return basin;
};

/**
 * Trova i bacini di un cliente
 */
export const findBasinsByClient = async (clientId: string) => {
  return prisma.basin.findMany({
    where: { clientId },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          vatNumber: true,
        },
      },
    },
    orderBy: {
      code: 'asc',
    },
  });
};

/**
 * Cerca bacini per codice (fuzzy search)
 */
export const searchBasinsByCode = async (code: string) => {
  return prisma.basin.findMany({
    where: {
      code: {
        contains: code,
        mode: 'insensitive',
      },
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          vatNumber: true,
        },
      },
    },
    orderBy: {
      code: 'asc',
    },
    take: 10, // Limita i risultati
  });
};

/**
 * Crea un nuovo bacino
 */
export const createBasin = async (data: CreateBasinData) => {
  try {
    // Verifica se esiste già un bacino con lo stesso codice
    const existingBasin = await prisma.basin.findUnique({
      where: { code: data.code },
    });

    if (existingBasin) {
      throw new HttpException(400, 'Codice bacino già registrato');
    }

    // Verifica se il cliente esiste
    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
    });

    if (!client) {
      throw new HttpException(404, 'Cliente non trovato');
    }

    return prisma.basin.create({
      data,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            vatNumber: true,
          },
        },
      },
    });
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new HttpException(500, 'Errore durante la creazione del bacino');
  }
};

/**
 * Aggiorna un bacino esistente
 */
export const updateBasin = async (id: string, data: UpdateBasinData) => {
  const basin = await prisma.basin.findUnique({
    where: { id },
  });

  if (!basin) {
    throw new HttpException(404, 'Bacino non trovato');
  }

  // Se viene aggiornato il codice, verifica che non esista già
  if (data.code && data.code !== basin.code) {
    const existingBasin = await prisma.basin.findUnique({
      where: { code: data.code },
    });

    if (existingBasin) {
      throw new HttpException(400, 'Codice bacino già registrato');
    }
  }

  // Se viene aggiornato il cliente, verifica che esista
  if (data.clientId && data.clientId !== basin.clientId) {
    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
    });

    if (!client) {
      throw new HttpException(404, 'Cliente non trovato');
    }
  }

  return prisma.basin.update({
    where: { id },
    data,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          vatNumber: true,
        },
      },
    },
  });
};

/**
 * Elimina un bacino
 */
export const deleteBasin = async (id: string) => {
  const basin = await prisma.basin.findUnique({
    where: { id },
    include: {
      pickupOrders: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!basin) {
    throw new HttpException(404, 'Bacino non trovato');
  }

  // Verifica se il bacino ha ordini associati
  if (basin.pickupOrders.length > 0) {
    throw new HttpException(400, 'Impossibile eliminare un bacino con ordini associati');
  }

  return prisma.basin.delete({
    where: { id },
  });
};

/**
 * Verifica se un codice bacino è disponibile
 */
export const checkBasinCodeAvailability = async (code: string, excludeId?: string) => {
  const existingBasin = await prisma.basin.findUnique({
    where: { code },
  });

  // Se non esiste nessun bacino con questo codice, è disponibile
  if (!existingBasin) {
    return { available: true };
  }

  // Se esiste ma è lo stesso bacino che stiamo aggiornando, è disponibile
  if (excludeId && existingBasin.id === excludeId) {
    return { available: true };
  }

  // Altrimenti non è disponibile
  return { available: false };
};

/**
 * Ottiene statistiche sui bacini
 */
export const getBasinStats = async () => {
  const [
    totalBasins,
    basinsByFlowType,
    basinsWithOrders,
    recentBasins
  ] = await Promise.all([
    // Totale bacini
    prisma.basin.count(),
    
    // Bacini per tipo di flusso
    prisma.basin.groupBy({
      by: ['flowType'],
      _count: {
        id: true,
      },
    }),
    
    // Bacini con ordini nell'ultimo mese
    prisma.basin.findMany({
      where: {
        pickupOrders: {
          some: {
            issueDate: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Ultimi 30 giorni
            },
          },
        },
      },
      select: {
        id: true,
        code: true,
        _count: {
          select: {
            pickupOrders: true,
          },
        },
      },
    }),
    
    // Bacini creati di recente
    prisma.basin.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Ultimi 7 giorni
        },
      },
      include: {
        client: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
  ]);

  return {
    total: totalBasins,
    byFlowType: basinsByFlowType,
    withRecentOrders: basinsWithOrders.length,
    recentlyCreated: recentBasins,
  };
};