// server/src/modules/pickupOrders/services/pickupOrders.service.ts

import { PrismaClient, Prisma } from '@prisma/client';
import { HttpException } from '../../../core/middleware/error.middleware';
import { parse } from 'date-fns'; // Assicurati che date-fns sia installato: npm install date-fns

const prisma = new PrismaClient();

// Tipi per le funzioni
export type PickupOrderStatus = 'DA_EVADERE' | 'PROGRAMMATO' | 'IN_EVASIONE' | 'IN_CARICO' | 'CARICATO' | 'SPEDITO' | 'COMPLETO' | 'CANCELLED';

export interface CreatePickupOrderData {
  orderNumber: string;
  issueDate: Date | string;
  scheduledDate?: Date | string;
  loadingDate?: Date | string; // Aggiunto da schema.prisma
  unloadingDate?: Date | string; // Aggiunto da schema.prisma
  completionDate?: Date | string;
  
  logisticSenderId?: string; // Modificato da senderId
  logisticRecipientId?: string; // Modificato da recipientId
  logisticTransporterId?: string; // Aggiunto da schema.prisma
  
  clientId?: string; // Aggiunto da schema.prisma
  basinId: string;
  flowType: string;
  distanceKm?: number;
  materialType?: string; // Aggiunto da schema.prisma
  
  status?: PickupOrderStatus; // Usato il tipo esteso
  
  expectedQuantity?: number;
  actualQuantity?: number;
  destinationQuantity?: number;
  loadedPackages?: number; // Aggiunto da schema.prisma
  departureWeight?: number; // Aggiunto da schema.prisma
  arrivalWeight?: number; // Aggiunto da schema.prisma
  
  assignedOperatorId?: string; // Aggiunto da schema.prisma
  
  notes?: string;
  documents?: string;
  loadingPhotos?: string; // Aggiunto da schema.prisma
  loadingVideos?: string; // Aggiunto da schema.prisma
  
  isRejected?: boolean; // Aggiunto da schema.prisma
  rejectionReason?: string; // Aggiunto da schema.prisma
  rejectionDate?: Date | string; // Aggiunto da schema.prisma
}

export interface UpdatePickupOrderData {
  orderNumber?: string;
  issueDate?: Date | string;
  scheduledDate?: Date | string | null;
  loadingDate?: Date | string | null; // Aggiunto
  unloadingDate?: Date | string | null; // Aggiunto
  completionDate?: Date | string | null;
  
  logisticSenderId?: string | null; // Modificato
  logisticRecipientId?: string | null; // Modificato
  logisticTransporterId?: string | null; // Aggiunto
  
  clientId?: string | null; // Aggiunto
  basinId?: string; // BasinId non può essere null, come da schema.prisma
  flowType?: string;
  distanceKm?: number | null;
  materialType?: string | null; // Aggiunto
  
  status?: PickupOrderStatus; // Usato il tipo esteso
  
  expectedQuantity?: number | null;
  actualQuantity?: number | null;
  destinationQuantity?: number | null;
  loadedPackages?: number | null; // Aggiunto
  departureWeight?: number | null; // Aggiunto
  arrivalWeight?: number | null; // Aggiunto
  
  assignedOperatorId?: string | null; // Aggiunto
  
  notes?: string | null;
  documents?: string | null;
  loadingPhotos?: string | null; // Aggiunto
  loadingVideos?: string | null; // Aggiunto
  
  isRejected?: boolean; // Modificato: rimosso '| null' basandosi sull'errore precedente e schema (probabilmente non nullable)
  rejectionReason?: string | null; // Aggiunto
  rejectionDate?: Date | string | null; // Aggiunto
}

// Costante per includere le relazioni comuni, basata sul tuo schema.prisma
const pickupOrderInclude = {
  logisticSender: true,
  logisticRecipient: true,
  logisticTransporter: true,
  client: true, // Se vuoi includere anche il client amministrativo
  basin: true,
  assignedOperator: true, // Se vuoi includere l'operatore assegnato
  shipment: true, // Se vuoi includere la spedizione
  activities: true, // Se vuoi includere le attività operatore
  statusHistory: true, // Se vuoi includere lo storico stati
};

// Funzioni del servizio
export const findAllPickupOrders = async () => {
  return prisma.pickupOrder.findMany({
    include: pickupOrderInclude,
    orderBy: {
      issueDate: 'desc',
    },
  });
};

export const findPickupOrderById = async (id: string) => {
  const pickupOrder = await prisma.pickupOrder.findUnique({
    where: { id },
    include: pickupOrderInclude,
  });

  if (!pickupOrder) {
    throw new HttpException(404, 'Buono di ritiro non trovato');
  }

  return pickupOrder;
};

export const findPickupOrdersByBasin = async (basinId: string) => {
  return prisma.pickupOrder.findMany({
    where: { basinId },
    include: pickupOrderInclude, // Includi tutte le relazioni comuni
    orderBy: {
      issueDate: 'desc',
    },
  });
};

export const findPickupOrdersByClient = async (clientId: string) => {
  return prisma.pickupOrder.findMany({
    where: {
      OR: [
        { clientId: clientId }, // Ricerca per client amministrativo
        { logisticSenderId: clientId }, // Ricerca per mittente logistico
        { logisticRecipientId: clientId }, // Ricerca per destinatario logistico
      ],
    },
    include: pickupOrderInclude,
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

    // Verifica se esistono mittente, destinatario (logistici) e bacino, e client amministrativo
    const [logisticSender, logisticRecipient, logisticTransporter, client, basin] = await Promise.all([
      data.logisticSenderId ? prisma.logisticEntity.findUnique({ where: { id: data.logisticSenderId } }) : Promise.resolve(null),
      data.logisticRecipientId ? prisma.logisticEntity.findUnique({ where: { id: data.logisticRecipientId } }) : Promise.resolve(null),
      data.logisticTransporterId ? prisma.logisticEntity.findUnique({ where: { id: data.logisticTransporterId } }) : Promise.resolve(null),
      data.clientId ? prisma.client.findUnique({ where: { id: data.clientId } }) : Promise.resolve(null),
      prisma.basin.findUnique({ where: { id: data.basinId } }), // Basin è obbligatorio nello schema
    ]);

    if (data.logisticSenderId && !logisticSender) {
      throw new HttpException(404, 'Mittente logistico non trovato');
    }

    if (data.logisticRecipientId && !logisticRecipient) {
      throw new HttpException(404, 'Destinatario logistico non trovato');
    }

    if (data.logisticTransporterId && !logisticTransporter) {
      throw new HttpException(404, 'Trasportatore logistico non trovato');
    }

    if (data.clientId && !client) {
      throw new HttpException(404, 'Cliente amministrativo non trovato');
    }

    if (!basin) {
      throw new HttpException(404, 'Bacino non trovato');
    }

    // Gestione date e altri campi specifici
    const parsedData: Prisma.PickupOrderCreateInput = { // Usa Prisma.PickupOrderCreateInput
      orderNumber: data.orderNumber,
      issueDate: parseDate(data.issueDate),
      flowType: data.flowType,
      basin: { connect: { id: data.basinId } }, // Connetti il bacino
      
      // Campi opzionali
      ...(data.scheduledDate !== undefined && { scheduledDate: parseDate(data.scheduledDate) }),
      ...(data.loadingDate !== undefined && { loadingDate: parseDate(data.loadingDate) }),
      ...(data.unloadingDate !== undefined && { unloadingDate: parseDate(data.unloadingDate) }),
      ...(data.completionDate !== undefined && { completionDate: parseDate(data.completionDate) }),
      ...(data.distanceKm !== undefined && { distanceKm: data.distanceKm }),
      ...(data.materialType !== undefined && { materialType: data.materialType }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.expectedQuantity !== undefined && { expectedQuantity: data.expectedQuantity }),
      ...(data.actualQuantity !== undefined && { actualQuantity: data.actualQuantity }),
      ...(data.destinationQuantity !== undefined && { destinationQuantity: data.destinationQuantity }),
      ...(data.loadedPackages !== undefined && { loadedPackages: data.loadedPackages }),
      ...(data.departureWeight !== undefined && { departureWeight: data.departureWeight }),
      ...(data.arrivalWeight !== undefined && { arrivalWeight: data.arrivalWeight }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.documents !== undefined && { documents: data.documents }),
      ...(data.loadingPhotos !== undefined && { loadingPhotos: data.loadingPhotos }),
      ...(data.loadingVideos !== undefined && { loadingVideos: data.loadingVideos }),
      ...(data.isRejected !== undefined && { isRejected: data.isRejected }),
      ...(data.rejectionReason !== undefined && { rejectionReason: data.rejectionReason }),
      ...(data.rejectionDate !== undefined && { rejectionDate: parseDate(data.rejectionDate) }),

      // Connessioni per entità logistiche e client
      ...(data.logisticSenderId && { logisticSender: { connect: { id: data.logisticSenderId } } }),
      ...(data.logisticRecipientId && { logisticRecipient: { connect: { id: data.logisticRecipientId } } }),
      ...(data.logisticTransporterId && { logisticTransporter: { connect: { id: data.logisticTransporterId } } }),
      ...(data.assignedOperatorId && { assignedOperator: { connect: { id: data.assignedOperatorId } } }),
      ...(data.clientId && { client: { connect: { id: data.clientId } } }),
    };


    return prisma.pickupOrder.create({
      data: parsedData,
      include: pickupOrderInclude,
    });
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new HttpException(500, `Errore durante la creazione del buono di ritiro: ${(error as Error).message}`);
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

  // Costruisci l'oggetto data per l'update in modo esplicito
  const updateData: Prisma.PickupOrderUpdateInput = {};

  if (data.orderNumber !== undefined) updateData.orderNumber = data.orderNumber;
  if (data.issueDate !== undefined) updateData.issueDate = parseDate(data.issueDate);
  
  if (data.scheduledDate !== undefined) {
    updateData.scheduledDate = data.scheduledDate === null ? null : parseDate(data.scheduledDate);
  }
  if (data.loadingDate !== undefined) {
    updateData.loadingDate = data.loadingDate === null ? null : parseDate(data.loadingDate);
  }
  if (data.unloadingDate !== undefined) {
    updateData.unloadingDate = data.unloadingDate === null ? null : parseDate(data.unloadingDate);
  }
  if (data.completionDate !== undefined) {
    updateData.completionDate = data.completionDate === null ? null : parseDate(data.completionDate);
  }

  // Gestione campi annullabili e relazioni
  if (data.logisticSenderId !== undefined) {
    if (data.logisticSenderId === null) {
      updateData.logisticSender = { disconnect: true }; // Disconnetti se è null
    } else {
      const logisticSender = await prisma.logisticEntity.findUnique({ where: { id: data.logisticSenderId } });
      if (!logisticSender) throw new HttpException(404, 'Mittente logistico non trovato');
      updateData.logisticSender = { connect: { id: data.logisticSenderId } };
    }
  }

  if (data.logisticRecipientId !== undefined) {
    if (data.logisticRecipientId === null) {
      updateData.logisticRecipient = { disconnect: true };
    } else {
      const logisticRecipient = await prisma.logisticEntity.findUnique({ where: { id: data.logisticRecipientId } });
      if (!logisticRecipient) throw new HttpException(404, 'Destinatario logistico non trovato');
      updateData.logisticRecipient = { connect: { id: data.logisticRecipientId } };
    }
  }

  if (data.logisticTransporterId !== undefined) {
    if (data.logisticTransporterId === null) {
      updateData.logisticTransporter = { disconnect: true };
    } else {
      const logisticTransporter = await prisma.logisticEntity.findUnique({ where: { id: data.logisticTransporterId } });
      if (!logisticTransporter) throw new HttpException(404, 'Trasportatore logistico non trovato');
      updateData.logisticTransporter = { connect: { id: data.logisticTransporterId } };
    }
  }

  if (data.clientId !== undefined) {
    if (data.clientId === null) {
      updateData.client = { disconnect: true };
    } else {
      const client = await prisma.client.findUnique({ where: { id: data.clientId } });
      if (!client) throw new HttpException(404, 'Cliente amministrativo non trovato');
      updateData.client = { connect: { id: data.clientId } };
    }
  }

  if (data.assignedOperatorId !== undefined) {
    if (data.assignedOperatorId === null) {
      updateData.assignedOperator = { disconnect: true };
    } else {
      // Corrected: Assuming 'user' is the Prisma model name for 'Operator'
      const assignedOperator = await prisma.user.findUnique({ where: { id: data.assignedOperatorId } }); 
      if (!assignedOperator) throw new HttpException(404, 'Operatore assegnato non trovato');
      updateData.assignedOperator = { connect: { id: data.assignedOperatorId } };
    }
  }

  // BasinId non può essere null
  if (data.basinId !== undefined) {
    const basin = await prisma.basin.findUnique({ where: { id: data.basinId } });
    if (!basin) throw new HttpException(404, 'Bacino non trovato');
    updateData.basin = { connect: { id: data.basinId } };
  }
  
  // Altri campi non-relazionali
  if (data.flowType !== undefined) updateData.flowType = data.flowType;
  if (data.distanceKm !== undefined) updateData.distanceKm = data.distanceKm;
  if (data.materialType !== undefined) updateData.materialType = data.materialType;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.expectedQuantity !== undefined) updateData.expectedQuantity = data.expectedQuantity;
  if (data.actualQuantity !== undefined) updateData.actualQuantity = data.actualQuantity;
  if (data.destinationQuantity !== undefined) updateData.destinationQuantity = data.destinationQuantity;
  if (data.loadedPackages !== undefined) updateData.loadedPackages = data.loadedPackages;
  if (data.departureWeight !== undefined) updateData.departureWeight = data.departureWeight;
  if (data.arrivalWeight !== undefined) updateData.arrivalWeight = data.arrivalWeight;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.documents !== undefined) updateData.documents = data.documents;
  if (data.loadingPhotos !== undefined) updateData.loadingPhotos = data.loadingPhotos;
  if (data.loadingVideos !== undefined) updateData.loadingVideos = data.loadingVideos;
  if (data.isRejected !== undefined) {
    // Corrected: Direct assignment as 'isRejected' is assumed non-nullable in schema based on error
    updateData.isRejected = data.isRejected; 
  }
  if (data.rejectionReason !== undefined) updateData.rejectionReason = data.rejectionReason;
  if (data.rejectionDate !== undefined) {
    updateData.rejectionDate = data.rejectionDate === null ? null : parseDate(data.rejectionDate);
  }

  return prisma.pickupOrder.update({
    where: { id },
    data: updateData,
    include: pickupOrderInclude,
  });
};

// server/src/modules/pickupOrders/services/pickupOrders.service.ts - FIX ESLint Error

// CORREZIONE: Sostituisci la funzione deletePickupOrder alla linea 440 circa

export const deletePickupOrder = async (id: string) => {
  console.log(`🗑️ Tentativo eliminazione buono di ritiro ID: ${id}`);

  const pickupOrder = await prisma.pickupOrder.findUnique({
    where: { id },
    include: {
      activities: true,
      statusHistory: true,
      shipment: true
    }
  });

  if (!pickupOrder) {
    throw new HttpException(404, 'Buono di ritiro non trovato');
  }

  console.log(`📋 Buono trovato: ${pickupOrder.orderNumber}, stato: ${pickupOrder.status}`);

  // CORREZIONE: Rimuovi la restrizione sullo stato COMPLETO
  // Ora si può eliminare un buono in qualsiasi stato tranne se ha dipendenze critiche

  try {
    console.log('🔄 Inizio transazione eliminazione...');

    // Usa una transazione per eliminare tutto in modo sicuro
    const result = await prisma.$transaction(async (tx) => {
      // 1. Elimina le attività operatore (se esistono)
      if (pickupOrder.activities && pickupOrder.activities.length > 0) {
        console.log(`📝 Eliminazione ${pickupOrder.activities.length} attività...`);
        await tx.operatorActivity.deleteMany({
          where: { pickupOrderId: id }
        });
      }

      // 2. Elimina lo storico stati (se esiste)
      try {
        const historyCount = await tx.pickupOrderStatusHistory.count({
          where: { pickupOrderId: id }
        });
        if (historyCount > 0) {
          console.log(`📜 Eliminazione ${historyCount} record storico...`);
          await tx.pickupOrderStatusHistory.deleteMany({
            where: { pickupOrderId: id }
          });
        }
      } catch (error) {
        console.log('⚠️ Tabella statusHistory non trovata, skip...');
      }

      // 3. Elimina la spedizione (se esiste)
      if (pickupOrder.shipment) {
        console.log('🚛 Eliminazione spedizione associata...');
        await tx.shipment.delete({
          where: { pickupOrderId: id }
        });
      }

      // 4. Infine elimina il buono di ritiro
      console.log('📋 Eliminazione buono di ritiro...');
      const deletedOrder = await tx.pickupOrder.delete({
        where: { id }
      });

      return deletedOrder;
    });

    console.log(`✅ Buono di ritiro ${result.orderNumber} eliminato con successo`);
    return result;

  } catch (error: unknown) { // ✅ FIX: Cambiato da 'any' a 'unknown'
    console.error('❌ Errore durante l\'eliminazione:', error);
    
    // ✅ FIX: Type guard per verificare se è un errore Prisma
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; message: string };
      
      // Gestione errori specifici Prisma
      if (prismaError.code === 'P2003') {
        throw new HttpException(400, 'Impossibile eliminare il buono di ritiro: esistono riferimenti in altre tabelle che devono essere eliminati prima.');
      }
      
      if (prismaError.code === 'P2025') {
        throw new HttpException(404, 'Buono di ritiro non trovato durante l\'eliminazione.');
      }
    }

    // ✅ FIX: Type guard per Error standard
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    throw new HttpException(500, `Errore durante l'eliminazione del buono di ritiro: ${errorMessage}`);
  }
};

// Funzione utility per il parsing delle date
function parseDate(date: Date | string): Date {
  if (date instanceof Date) {
    return date;
  }
  
  // Prova a parsare la data nel formato ISO (es. "2023-11-20T10:00:00Z")
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
      // Formato的基础上-MM-dd
      return parse(date, 'yyyy-MM-dd', new Date());
    } catch (e) {
      throw new HttpException(400, `Formato data non valido: ${date}. Formati accettati: ISO (es. 2023-11-20T10:00:00Z), dd/MM/yyyy, attraverso-MM-dd.`);
    }
  }
}