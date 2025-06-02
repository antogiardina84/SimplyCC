// server/src/modules/shipments/services/logistics.service.ts

import { PrismaClient } from '@prisma/client';
import { HttpException } from '../../../core/middleware/error.middleware';

const prisma = new PrismaClient();

// Estendi questo tipo per includere 'SHIPPER'
export type LogisticEntityType = 'SENDER' | 'RECIPIENT' | 'TRANSPORTER' | 'SHIPPER';

export interface CreateLogisticEntityData {
  name: string;
  address?: string;
  city?: string;
  zipCode?: string;
  province?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  notes?: string;
  entityType: LogisticEntityType; // Usa il tipo esteso
}

export interface UpdateLogisticEntityData {
  name?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  province?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  notes?: string;
  entityType?: LogisticEntityType; // Usa il tipo esteso
  isActive?: boolean;
}

export interface LogisticEntityFilters {
  entityType?: LogisticEntityType; // Usa il tipo esteso
  isActive?: boolean;
  search?: string;
}

/**
 * Trova tutte le entità logistiche con filtri opzionali
 */
interface WhereClause {
  entityType?: LogisticEntityType; // Usa il tipo esteso
  isActive?: boolean;
  OR?: Array<{
    name?: { contains: string; mode: 'insensitive' };
    city?: { contains: string; mode: 'insensitive' };
    contactPerson?: { contains: string; mode: 'insensitive' };
  }>;
}

export const findAllLogisticEntities = async (filters: LogisticEntityFilters = {}) => {
  const where: WhereClause = {};

  if (filters.entityType) {
    where.entityType = filters.entityType;
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { city: { contains: filters.search, mode: 'insensitive' } },
      { contactPerson: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return prisma.logisticEntity.findMany({
    where,
    orderBy: [
      { entityType: 'asc' },
      { name: 'asc' },
    ],
  });
};

/**
 * Trova entità logistiche per tipo specifico
 */
export const findLogisticEntitiesByType = async (entityType: LogisticEntityType) => { // Esteso a LogisticEntityType
  return prisma.logisticEntity.findMany({
    where: {
      entityType,
      isActive: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
};

/**
 * Trova una entità logistica per ID
 */
export const findLogisticEntityById = async (id: string) => {
  const entity = await prisma.logisticEntity.findUnique({
    where: { id },
    include: {
      sentOrders: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          scheduledDate: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      },
      receivedOrders: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          scheduledDate: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      },
      transportedOrders: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          scheduledDate: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      },
      // Assicurati che il modello Prisma contenga `shippedOrders` se vuoi includerlo
      // shippedOrders: {
      //   select: {
      //     id: true,
      //     orderNumber: true,
      //     status: true,
      //     scheduledDate: true,
      //   },
      //   orderBy: {
      //     createdAt: 'desc',
      //   },
      //   take: 10,
      // },
    },
  });

  if (!entity) {
    throw new HttpException(404, 'Entità logistica non trovata');
  }

  return entity;
};

/**
 * Crea una nuova entità logistica
 */
export const createLogisticEntity = async (data: CreateLogisticEntityData) => {
  try {
    // Verifica se esiste già un'entità con lo stesso nome e tipo
    const existingEntity = await prisma.logisticEntity.findFirst({
      where: {
        name: {
          equals: data.name,
          mode: 'insensitive',
        },
        entityType: data.entityType,
      },
    });

    if (existingEntity) {
      throw new HttpException(400, `Entità ${data.entityType.toLowerCase()} con nome "${data.name}" già esistente`);
    }

    return prisma.logisticEntity.create({
      data,
    });
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new HttpException(500, 'Errore durante la creazione dell\'entità logistica');
  }
};

/**
 * Aggiorna una entità logistica
 */
export const updateLogisticEntity = async (id: string, data: UpdateLogisticEntityData) => {
  const entity = await prisma.logisticEntity.findUnique({
    where: { id },
  });

  if (!entity) {
    throw new HttpException(404, 'Entità logistica non trovata');
  }

  // Se viene cambiato il nome, verifica che non esista già
  if (data.name && data.name !== entity.name) {
    const existingEntity = await prisma.logisticEntity.findFirst({
      where: {
        name: {
          equals: data.name,
          mode: 'insensitive',
        },
        entityType: data.entityType || entity.entityType,
        id: {
          not: id,
        },
      },
    });

    if (existingEntity) {
      throw new HttpException(400, `Entità con nome "${data.name}" già esistente per questo tipo`);
    }
  }

  return prisma.logisticEntity.update({
    where: { id },
    data,
  });
};

/**
 * Elimina una entità logistica (soft delete)
 */
export const deleteLogisticEntity = async (id: string) => {
  const entity = await prisma.logisticEntity.findUnique({
    where: { id },
    include: {
      sentOrders: { where: { status: { not: 'COMPLETO' } } },
      receivedOrders: { where: { status: { not: 'COMPLETO' } } },
      transportedOrders: { where: { status: { not: 'COMPLETO' } } },
      // shippedOrders: { where: { status: { not: 'COMPLETO' } } }, // Aggiungi se pertinente
    },
  });

  if (!entity) {
    throw new HttpException(404, 'Entità logistica non trovata');
  }

  // Verifica se ci sono ordini attivi collegati
  const activeOrders = [
    ...entity.sentOrders,
    ...entity.receivedOrders,
    ...entity.transportedOrders,
    // ...(entity.shippedOrders || []), // Aggiungi se pertinente
  ];

  if (activeOrders.length > 0) {
    throw new HttpException(400, 'Impossibile eliminare: entità collegata a ordini attivi');
  }

  // Soft delete - disattiva invece di eliminare
  return prisma.logisticEntity.update({
    where: { id },
    data: {
      isActive: false,
    },
  });
};

/**
 * Riattiva una entità logistica
 */
export const reactivateLogisticEntity = async (id: string) => {
  const entity = await prisma.logisticEntity.findUnique({
    where: { id },
  });

  if (!entity) {
    throw new HttpException(404, 'Entità logistica non trovata');
  }

  return prisma.logisticEntity.update({
    where: { id },
    data: {
      isActive: true,
    },
  });
};

/**
 * Cerca entità logistiche per matching OCR
 */
export const searchLogisticEntitiesForOCR = async (searchTerm: string, entityType: LogisticEntityType) => { // Esteso a LogisticEntityType
  if (!searchTerm || searchTerm.length < 2) {
    return [];
  }

  return prisma.logisticEntity.findMany({
    where: {
      entityType,
      isActive: true,
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { contactPerson: { contains: searchTerm, mode: 'insensitive' } },
        { city: { contains: searchTerm, mode: 'insensitive' } },
      ],
    },
    orderBy: {
      name: 'asc',
    },
    take: 10, // Limita i risultati per performance
  });
};

/**
 * Ottieni statistiche per le entità logistiche
 */
export const getLogisticEntityStats = async () => {
  const [
    totalEntities,
    entitiesByType,
    activeEntities,
    recentlyCreated,
  ] = await Promise.all([
    // Totale entità
    prisma.logisticEntity.count(),

    // Entità per tipo
    prisma.logisticEntity.groupBy({
      by: ['entityType'],
      _count: { id: true },
      where: { isActive: true },
    }),

    // Entità attive
    prisma.logisticEntity.count({
      where: { isActive: true },
    }),

    // Create negli ultimi 30 giorni
    prisma.logisticEntity.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  return {
    totalEntities,
    activeEntities,
    inactiveEntities: totalEntities - activeEntities,
    recentlyCreated,
    byType: entitiesByType.reduce((acc, item) => {
      acc[item.entityType] = item._count.id;
      return acc;
    }, {} as Record<string, number>),
  };
};