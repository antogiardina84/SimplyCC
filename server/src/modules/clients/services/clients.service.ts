// server/src/modules/clients/services/clients.service.ts

import { PrismaClient } from '@prisma/client';
import { HttpException } from '../../../core/middleware/error.middleware';

const prisma = new PrismaClient();

export interface CreateClientData {
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
}

export interface UpdateClientData {
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

export const findAllClients = async () => {
  return prisma.client.findMany({
    include: {
      basins: {
        select: {
          id: true,
          code: true,
          flowType: true,
        },
      },
      _count: {
        select: {
          basins: true,
          sentOrders: true,
          receivedOrders: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });
};

export const findClientById = async (id: string) => {
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      basins: {
        include: {
          _count: {
            select: {
              pickupOrders: true,
            },
          },
        },
        orderBy: {
          code: 'asc',
        },
      },
      sentOrders: {
        select: {
          id: true,
          orderNumber: true,
          issueDate: true,
          status: true,
          expectedQuantity: true,
          basin: {
            select: {
              code: true,
            },
          },
        },
        orderBy: {
          issueDate: 'desc',
        },
        take: 10, // Solo gli ultimi 10 ordini
      },
      receivedOrders: {
        select: {
          id: true,
          orderNumber: true,
          issueDate: true,
          status: true,
          expectedQuantity: true,
          basin: {
            select: {
              code: true,
            },
          },
        },
        orderBy: {
          issueDate: 'desc',
        },
        take: 10, // Solo gli ultimi 10 ordini
      },
      _count: {
        select: {
          basins: true,
          sentOrders: true,
          receivedOrders: true,
        },
      },
    },
  });

  if (!client) {
    throw new HttpException(404, 'Cliente non trovato');
  }

  return client;
};

export const findClientByVatNumber = async (vatNumber: string) => {
  return prisma.client.findUnique({
    where: { vatNumber },
    include: {
      basins: {
        select: {
          id: true,
          code: true,
          flowType: true,
        },
      },
    },
  });
};

export const searchClients = async (searchTerm: string) => {
  return prisma.client.findMany({
    where: {
      OR: [
        {
          name: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        {
          vatNumber: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        {
          city: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
      ],
    },
    include: {
      basins: {
        select: {
          id: true,
          code: true,
          flowType: true,
        },
      },
      _count: {
        select: {
          basins: true,
          sentOrders: true,
          receivedOrders: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
    take: 20, // Limita i risultati
  });
};

export const createClient = async (clientData: CreateClientData) => {
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
      include: {
        basins: {
          select: {
            id: true,
            code: true,
            flowType: true,
          },
        },
        _count: {
          select: {
            basins: true,
            sentOrders: true,
            receivedOrders: true,
          },
        },
      },
    });
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new HttpException(500, 'Errore durante la creazione del cliente');
  }
};

export const updateClient = async (id: string, clientData: UpdateClientData) => {
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
    include: {
      basins: {
        select: {
          id: true,
          code: true,
          flowType: true,
        },
      },
      _count: {
        select: {
          basins: true,
          sentOrders: true,
          receivedOrders: true,
        },
      },
    },
  });
};

export const deleteClient = async (id: string) => {
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      basins: true,
      sentOrders: true,
      receivedOrders: true,
    },
  });

  if (!client) {
    throw new HttpException(404, 'Cliente non trovato');
  }

  // Verifico se il cliente ha bacini associati
  if (client.basins.length > 0) {
    throw new HttpException(400, 'Impossibile eliminare il cliente: rimuovere prima tutti i bacini associati');
  }

  // Verifico se il cliente ha ordini associati
  if (client.sentOrders.length > 0 || client.receivedOrders.length > 0) {
    throw new HttpException(400, 'Impossibile eliminare il cliente: ha ordini associati');
  }

  return prisma.client.delete({
    where: { id },
  });
};

export const getClientStats = async () => {
  const [
    totalClients,
    clientsWithBasins,
    clientsWithOrders,
    recentClients,
    topClientsByBasins,
    topClientsByOrders
  ] = await Promise.all([
    // Totale clienti
    prisma.client.count(),
    
    // Clienti con bacini
    prisma.client.count({
      where: {
        basins: {
          some: {},
        },
      },
    }),
    
    // Clienti con ordini nell'ultimo mese
    prisma.client.count({
      where: {
        OR: [
          {
            sentOrders: {
              some: {
                issueDate: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                },
              },
            },
          },
          {
            receivedOrders: {
              some: {
                issueDate: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                },
              },
            },
          },
        ],
      },
    }),
    
    // Clienti creati di recente
    prisma.client.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        id: true,
        name: true,
        vatNumber: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    }),
    
    // Top clienti per numero di bacini
    prisma.client.findMany({
      select: {
        id: true,
        name: true,
        vatNumber: true,
        _count: {
          select: {
            basins: true,
          },
        },
      },
      orderBy: {
        basins: {
          _count: 'desc',
        },
      },
      take: 5,
    }),
    
    // Top clienti per numero di ordini
    prisma.client.findMany({
      select: {
        id: true,
        name: true,
        vatNumber: true,
        _count: {
          select: {
            sentOrders: true,
            receivedOrders: true,
          },
        },
      },
      orderBy: [
        {
          sentOrders: {
            _count: 'desc',
          },
        },
        {
          receivedOrders: {
            _count: 'desc',
          },
        },
      ],
      take: 5,
    }),
  ]);

  return {
    total: totalClients,
    withBasins: clientsWithBasins,
    withRecentOrders: clientsWithOrders,
    recentlyCreated: recentClients,
    topByBasins: topClientsByBasins,
    topByOrders: topClientsByOrders,
  };
};

export const checkVatNumberAvailability = async (vatNumber: string, excludeId?: string) => {
  const existingClient = await prisma.client.findUnique({
    where: { vatNumber },
  });

  // Se non esiste nessun cliente con questa P.IVA, è disponibile
  if (!existingClient) {
    return { available: true };
  }

  // Se esiste ma è lo stesso cliente che stiamo aggiornando, è disponibile
  if (excludeId && existingClient.id === excludeId) {
    return { available: true };
  }

  // Altrimenti non è disponibile
  return { available: false };
};