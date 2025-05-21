// server/src/modules/pickupOrders/services/pickupOrders.service.ts

import { PrismaClient } from '@prisma/client';
import { HttpException } from '../../../core/middleware/error.middleware';
import { parse } from 'date-fns';

const prisma = new PrismaClient();

// Tipi per le funzioni
export type PickupOrderStatus = 'PENDING' | 'SCHEDULED' | 'READY' | 'COMPLETED' | 'CANCELLED';

export interface CreatePickupOrderData {
  orderNumber: string;
  issueDate: Date | string;
  scheduledDate?: Date | string;
  completionDate?: Date | string;
  shipperId?: string;
  senderId: string;
  recipientId: string;
  basinId: string;
  flowType: string;
  distanceKm?: number;
  status?: PickupOrderStatus;
  expectedQuantity?: number;
  actualQuantity?: number;
  destinationQuantity?: number;
  notes?: string;
  documents?: string;
}

export interface UpdatePickupOrderData {
  orderNumber?: string;
  issueDate?: Date | string;
  scheduledDate?: Date | string | null;
  completionDate?: Date | string | null;
  shipperId?: string | null;
  senderId?: string;
  recipientId?: string;
  basinId?: string;
  flowType?: string;
  distanceKm?: number | null;
  status?: PickupOrderStatus;
  expectedQuantity?: number | null;
  actualQuantity?: number | null;
  destinationQuantity?: number | null;
  notes?: string | null;
  documents?: string | null;
}

// Funzioni del servizio
export const findAllPickupOrders = async () => {
  return prisma.pickupOrder.findMany({
    include: {
      sender: true,
      recipient: true,
      basin: true,
    },
    orderBy: {
      issueDate: 'desc',
    },
  });
};

export const findPickupOrderById = async (id: string) => {
  const pickupOrder = await prisma.pickupOrder.findUnique({
    where: { id },
    include: {
      sender: true,
      recipient: true,
      basin: true,
    },
  });

  if (!pickupOrder) {
    throw new HttpException(404, 'Buono di ritiro non trovato');
  }

  return pickupOrder;
};

export const findPickupOrdersByBasin = async (basinId: string) => {
  return prisma.pickupOrder.findMany({
    where: { basinId },
    include: {
      sender: true,
      recipient: true,
    },
    orderBy: {
      issueDate: 'desc',
    },
  });
};

export const findPickupOrdersByClient = async (clientId: string) => {
  return prisma.pickupOrder.findMany({
    where: {
      OR: [
        { senderId: clientId },
        { recipientId: clientId },
      ],
    },
    include: {
      sender: true,
      recipient: true,
      basin: true,
    },
    orderBy: {
      issueDate: 'desc',
    },
  });
};

export const createPickupOrder = async (data: CreatePickupOrderData) => {
  try {
    // Verifica se esiste già un buono con lo stesso numero
    const existingOrder = await prisma.pickupOrder.findUnique({
      where: { orderNumber: data.orderNumber },
    });

    if (existingOrder) {
      throw new HttpException(400, 'Numero buono di ritiro già registrato');
    }

    // Verifica se esistono mittente, destinatario e bacino
    const [sender, recipient, basin] = await Promise.all([
      prisma.client.findUnique({ where: { id: data.senderId } }),
      prisma.client.findUnique({ where: { id: data.recipientId } }),
      prisma.basin.findUnique({ where: { id: data.basinId } }),
    ]);

    if (!sender) {
      throw new HttpException(404, 'Mittente non trovato');
    }

    if (!recipient) {
      throw new HttpException(404, 'Destinatario non trovato');
    }

    if (!basin) {
      throw new HttpException(404, 'Bacino non trovato');
    }

    // Gestione date
    const parsedData = {
      ...data,
      issueDate: parseDate(data.issueDate),
      scheduledDate: data.scheduledDate ? parseDate(data.scheduledDate) : undefined,
      completionDate: data.completionDate ? parseDate(data.completionDate) : undefined,
    };

    return prisma.pickupOrder.create({
      data: parsedData,
      include: {
        sender: true,
        recipient: true,
        basin: true,
      },
    });
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new HttpException(500, 'Errore durante la creazione del buono di ritiro');
  }
};

export const updatePickupOrder = async (id: string, data: UpdatePickupOrderData) => {
  const pickupOrder = await prisma.pickupOrder.findUnique({
    where: { id },
  });

  if (!pickupOrder) {
    throw new HttpException(404, 'Buono di ritiro non trovato');
  }

  // Se viene aggiornato il numero buono, verifica che non esista già
  if (data.orderNumber && data.orderNumber !== pickupOrder.orderNumber) {
    const existingOrder = await prisma.pickupOrder.findUnique({
      where: { orderNumber: data.orderNumber },
    });

    if (existingOrder) {
      throw new HttpException(400, 'Numero buono di ritiro già registrato');
    }
  }

  // Verifica referenze se presenti
  if (data.senderId) {
    const sender = await prisma.client.findUnique({ where: { id: data.senderId } });
    if (!sender) {
      throw new HttpException(404, 'Mittente non trovato');
    }
  }

  if (data.recipientId) {
    const recipient = await prisma.client.findUnique({ where: { id: data.recipientId } });
    if (!recipient) {
      throw new HttpException(404, 'Destinatario non trovato');
    }
  }

  if (data.basinId) {
    const basin = await prisma.basin.findUnique({ where: { id: data.basinId } });
    if (!basin) {
      throw new HttpException(404, 'Bacino non trovato');
    }
  }

  // Gestione date
  const parsedData = {
    ...data,
    issueDate: data.issueDate ? parseDate(data.issueDate) : undefined,
    scheduledDate: data.scheduledDate === null 
      ? null 
      : data.scheduledDate 
        ? parseDate(data.scheduledDate) 
        : undefined,
    completionDate: data.completionDate === null 
      ? null 
      : data.completionDate 
        ? parseDate(data.completionDate) 
        : undefined,
  };

  return prisma.pickupOrder.update({
    where: { id },
    data: parsedData,
    include: {
      sender: true,
      recipient: true,
      basin: true,
    },
  });
};

export const deletePickupOrder = async (id: string) => {
  const pickupOrder = await prisma.pickupOrder.findUnique({
    where: { id },
  });

  if (!pickupOrder) {
    throw new HttpException(404, 'Buono di ritiro non trovato');
  }

  // Verificare se è possibile eliminare il buono di ritiro
  if (pickupOrder.status === 'COMPLETED') {
    throw new HttpException(400, 'Impossibile eliminare un buono di ritiro completato');
  }

  return prisma.pickupOrder.delete({
    where: { id },
  });
};

// Funzione utility per il parsing delle date
function parseDate(date: Date | string): Date {
  if (date instanceof Date) {
    return date;
  }
  
  // Prova a parsare la data nel formato ISO
  const isoDate = new Date(date);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }
  
  // Prova a parsare la data in vari formati
  try {
    // Formato dd/MM/yyyy
    return parse(date, 'dd/MM/yyyy', new Date());
  } catch (e) {
    try {
      // Formato yyyy-MM-dd
      return parse(date, 'yyyy-MM-dd', new Date());
    } catch (e) {
      throw new HttpException(400, `Formato data non valido: ${date}`);
    }
  }
}