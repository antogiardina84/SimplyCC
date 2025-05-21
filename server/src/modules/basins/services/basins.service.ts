// server/src/modules/basins/services/basins.service.ts

import { PrismaClient } from '@prisma/client';
import { HttpException } from '../../../core/middleware/error.middleware';

const prisma = new PrismaClient();

export const findAllBasins = async () => {
  return prisma.basin.findMany({
    include: {
      client: true,
    },
  });
};

export const findBasinsByClientId = async (clientId: string) => {
  return prisma.basin.findMany({
    where: { clientId },
  });
};

export const findBasinById = async (id: string) => {
  const basin = await prisma.basin.findUnique({
    where: { id },
    include: {
      client: true,
    },
  });

  if (!basin) {
    throw new HttpException(404, 'Bacino non trovato');
  }

  return basin;
};

export const createBasin = async (basinData: {
  code: string;
  description?: string;
  flowType: string;
  clientId: string;
}) => {
  try {
    // Verifica se esiste già un bacino con lo stesso codice
    const existingBasin = await prisma.basin.findUnique({
      where: { code: basinData.code },
    });

    if (existingBasin) {
      throw new HttpException(400, 'Codice bacino già registrato');
    }

    // Verifica se il cliente esiste
    const client = await prisma.client.findUnique({
      where: { id: basinData.clientId },
    });

    if (!client) {
      throw new HttpException(404, 'Cliente non trovato');
    }

    return prisma.basin.create({
      data: basinData,
      include: {
        client: true,
      },
    });
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new HttpException(500, 'Errore durante la creazione del bacino');
  }
};

export const updateBasin = async (
  id: string,
  basinData: {
    code?: string;
    description?: string;
    flowType?: string;
    clientId?: string;
  }
) => {
  const basin = await prisma.basin.findUnique({
    where: { id },
  });

  if (!basin) {
    throw new HttpException(404, 'Bacino non trovato');
  }

  // Se viene aggiornato il codice, verifica che non esista già
  if (basinData.code && basinData.code !== basin.code) {
    const existingBasin = await prisma.basin.findUnique({
      where: { code: basinData.code },
    });

    if (existingBasin) {
      throw new HttpException(400, 'Codice bacino già registrato');
    }
  }

  // Se viene aggiornato il cliente, verifica che esista
  if (basinData.clientId && basinData.clientId !== basin.clientId) {
    const client = await prisma.client.findUnique({
      where: { id: basinData.clientId },
    });

    if (!client) {
      throw new HttpException(404, 'Cliente non trovato');
    }
  }

  return prisma.basin.update({
    where: { id },
    data: basinData,
    include: {
      client: true,
    },
  });
};

export const deleteBasin = async (id: string) => {
  const basin = await prisma.basin.findUnique({
    where: { id },
  });

  if (!basin) {
    throw new HttpException(404, 'Bacino non trovato');
  }

  return prisma.basin.delete({
    where: { id },
  });
};