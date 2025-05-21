// server/src/modules/clients/services/clients.service.ts

import { PrismaClient } from '@prisma/client';
import { HttpException } from '../../../core/middleware/error.middleware';

const prisma = new PrismaClient();

export const findAllClients = async () => {
  return prisma.client.findMany({
    include: {
      basins: true,
    },
  });
};

export const findClientById = async (id: string) => {
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      basins: true,
    },
  });

  if (!client) {
    throw new HttpException(404, 'Cliente non trovato');
  }

  return client;
};

export const createClient = async (clientData: {
  name: string;
  vatNumber: string;
  address?: string;
  city?: string;
  zipCode?: string;
  province?: string;
  phone?: string;
  email?: string;
  pec?: string;
  contractId?: string;
}) => {
  try {
    // Verifica se esiste già un cliente con la stessa partita IVA
    const existingClient = await prisma.client.findUnique({
      where: { vatNumber: clientData.vatNumber },
    });

    if (existingClient) {
      throw new HttpException(400, 'Partita IVA già registrata');
    }

    return prisma.client.create({
      data: clientData,
    });
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new HttpException(500, 'Errore durante la creazione del cliente');
  }
};

export const updateClient = async (
  id: string,
  clientData: {
    name?: string;
    vatNumber?: string;
    address?: string;
    city?: string;
    zipCode?: string;
    province?: string;
    phone?: string;
    email?: string;
    pec?: string;
    contractId?: string;
  }
) => {
  const client = await prisma.client.findUnique({
    where: { id },
  });

  if (!client) {
    throw new HttpException(404, 'Cliente non trovato');
  }

  // Se viene aggiornata la partita IVA, verifica che non esista già
  if (clientData.vatNumber && clientData.vatNumber !== client.vatNumber) {
    const existingClient = await prisma.client.findUnique({
      where: { vatNumber: clientData.vatNumber },
    });

    if (existingClient) {
      throw new HttpException(400, 'Partita IVA già registrata');
    }
  }

  return prisma.client.update({
    where: { id },
    data: clientData,
  });
};

export const deleteClient = async (id: string) => {
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      basins: true,
    },
  });

  if (!client) {
    throw new HttpException(404, 'Cliente non trovato');
  }

  // Verifico se il cliente ha bacini associati
  if (client.basins.length > 0) {
    throw new HttpException(400, 'Impossibile eliminare il cliente: rimuovere prima tutti i bacini associati');
  }

  return prisma.client.delete({
    where: { id },
  });
};