// server/src/modules/processing/services/processing.service.ts

import { PrismaClient } from '@prisma/client';
import { HttpException } from '../../../core/middleware/error.middleware';

const prisma = new PrismaClient();

export interface CreateProcessingData {
  date: Date | string;
  shift: string; // MORNING, AFTERNOON, NIGHT
  operatorId?: string;
  inputMaterialType: string;
  inputWeight: number;
  inputReference: string; // COREPLA, CORIPET, etc.
  efficiency?: number;
  wasteWeight?: number;
  notes?: string;
  outputs?: CreateProcessingOutputData[];
}

export interface CreateProcessingOutputData {
  outputMaterialType: string;
  outputWeight: number;
  outputReference: string;
  quality?: string;
}

export interface UpdateProcessingData {
  date?: Date | string;
  shift?: string;
  operatorId?: string | null;
  inputMaterialType?: string;
  inputWeight?: number;
  inputReference?: string;
  efficiency?: number | null;
  wasteWeight?: number | null;
  notes?: string | null;
  outputs?: CreateProcessingOutputData[];
}

const processingInclude = {
  outputs: true,
};

export const findAllProcessing = async () => {
  return prisma.processing.findMany({
    include: processingInclude,
    orderBy: {
      date: 'desc',
    },
  });
};

export const findProcessingById = async (id: string) => {
  const processing = await prisma.processing.findUnique({
    where: { id },
    include: processingInclude,
  });

  if (!processing) {
    throw new HttpException(404, 'Lavorazione non trovata');
  }

  return processing;
};

export const findProcessingByDateRange = async (startDate: Date, endDate: Date) => {
  return prisma.processing.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: processingInclude,
    orderBy: {
      date: 'desc',
    },
  });
};

export const findProcessingByOperator = async (operatorId: string) => {
  return prisma.processing.findMany({
    where: { operatorId },
    include: processingInclude,
    orderBy: {
      date: 'desc',
    },
  });
};

export const createProcessing = async (data: CreateProcessingData) => {
  try {
    // Verifica che l'operatore esista se specificato
    if (data.operatorId) {
      const operator = await prisma.user.findUnique({
        where: { id: data.operatorId },
      });
      if (!operator) {
        throw new HttpException(400, 'Operatore non trovato');
      }
    }

    const { outputs, ...processingData } = data;

    return await prisma.processing.create({
      data: {
        ...processingData,
        date: new Date(processingData.date),
        outputs: outputs ? {
          create: outputs.map(output => ({
            outputMaterialType: output.outputMaterialType,
            outputWeight: output.outputWeight,
            outputReference: output.outputReference,
            quality: output.quality,
          })),
        } : undefined,
      },
      include: processingInclude,
    });
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    console.error('Error creating processing:', error);
    throw new HttpException(500, 'Errore durante la creazione della lavorazione');
  }
};

export const updateProcessing = async (id: string, data: UpdateProcessingData) => {
  try {
    // Verifica che la lavorazione esista
    const existingProcessing = await prisma.processing.findUnique({
      where: { id },
    });

    if (!existingProcessing) {
      throw new HttpException(404, 'Lavorazione non trovata');
    }

    // Verifica che l'operatore esista se specificato
    if (data.operatorId) {
      const operator = await prisma.user.findUnique({
        where: { id: data.operatorId },
      });
      if (!operator) {
        throw new HttpException(400, 'Operatore non trovato');
      }
    }

    const { outputs, ...processingData } = data;

    // Se ci sono output da aggiornare, elimina quelli esistenti e crea i nuovi
    if (outputs) {
      await prisma.processingOutput_Old.deleteMany({
        where: { processingId: id },
      });
    }

    return await prisma.processing.update({
      where: { id },
      data: {
        ...processingData,
        date: processingData.date ? new Date(processingData.date) : undefined,
        outputs: outputs ? {
          create: outputs.map(output => ({
            outputMaterialType: output.outputMaterialType,
            outputWeight: output.outputWeight,
            outputReference: output.outputReference,
            quality: output.quality,
          })),
        } : undefined,
      },
      include: processingInclude,
    });
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    console.error('Error updating processing:', error);
    throw new HttpException(500, 'Errore durante l\'aggiornamento della lavorazione');
  }
};

export const deleteProcessing = async (id: string) => {
  try {
    // Verifica che la lavorazione esista
    const existingProcessing = await prisma.processing.findUnique({
      where: { id },
    });

    if (!existingProcessing) {
      throw new HttpException(404, 'Lavorazione non trovata');
    }

    // Elimina prima gli output associati
    await prisma.processingOutput_Old.deleteMany({
      where: { processingId: id },
    });

    // Elimina la lavorazione
    await prisma.processing.delete({
      where: { id },
    });

    return { message: 'Lavorazione eliminata con successo' };
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    console.error('Error deleting processing:', error);
    throw new HttpException(500, 'Errore durante l\'eliminazione della lavorazione');
  }
};

export const getProcessingStats = async () => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalThisMonth, avgEfficiency, materialTypes] = await Promise.all([
      // Totale lavorazioni del mese
      prisma.processing.count({
        where: {
          date: {
            gte: startOfMonth,
          },
        },
      }),

      // Efficienza media del mese
      prisma.processing.aggregate({
        where: {
          date: {
            gte: startOfMonth,
          },
          efficiency: {
            not: null,
          },
        },
        _avg: {
          efficiency: true,
        },
      }),

      // Tipi di materiali lavorati
      prisma.processing.groupBy({
        by: ['inputMaterialType'],
        _sum: {
          inputWeight: true,
        },
        where: {
          date: {
            gte: startOfMonth,
          },
        },
      }),
    ]);

    return {
      totalProcessingThisMonth: totalThisMonth,
      averageEfficiency: avgEfficiency._avg.efficiency || 0,
      materialTypesProcessed: materialTypes,
    };
  } catch (error) {
    console.error('Error getting processing stats:', error);
    throw new HttpException(500, 'Errore durante il recupero delle statistiche');
  }
};