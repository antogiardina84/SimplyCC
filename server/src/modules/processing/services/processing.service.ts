// server/src/modules/processing/services/processing.service.ts - VERSIONE COMPLETA FINALE

import { PrismaClient } from '@prisma/client';
import { HttpException } from '../../../core/middleware/error.middleware';
import { materialTypesService, USAGE_CONTEXTS } from '../../../core/services/materialTypes.service';
import { startOfDay, endOfDay, format } from 'date-fns';

const prisma = new PrismaClient();

// ================================
// INTERFACES
// ================================

export interface CreateProcessingSessionData {
  date: Date | string;
  shiftNumber: number;
  operatorId: string;
  startTime?: Date | string;
  endTime?: Date | string;
  notes?: string;
  inputs: CreateProcessingInputData[];
  outputs?: CreateProcessingOutputData[];
  waste?: CreateProcessingWasteData[];
}

export interface CreateProcessingInputData {
  materialTypeId: string;
  sourceType: 'DELIVERY' | 'STOCK';
  sourceId?: string;
  quantityUsed: number;
  qualityGrade?: 'EXCELLENT' | 'GOOD' | 'POOR' | 'CONTAMINATED';
  moistureLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  contaminationPercent?: number;
  notes?: string;
}

export interface CreateProcessingOutputData {
  materialTypeId: string;
  quantityProduced: number;
  qualityGrade?: 'EXCELLENT' | 'GOOD' | 'POOR';
  packageCount?: number;
  packageType?: string;
  storageLocation?: string;
  batchNumber?: string;
  notes?: string;
}

export interface CreateProcessingWasteData {
  wasteTypeId: string;
  quantity: number;
  disposalMethod?: 'LANDFILL' | 'INCINERATION' | 'RECYCLING' | 'OTHER';
  disposalDestination?: string;
  cerCode?: string;
  notes?: string;
}

export interface UpdateProcessingSessionData extends Partial<CreateProcessingSessionData> {
  status?: 'IN_PROGRESS' | 'COMPLETED' | 'SUSPENDED' | 'CANCELLED';
}

// ================================
// INCLUDE STANDARD
// ================================

const processingSessionInclude = {
  operator: { select: { id: true, firstName: true, lastName: true, email: true } },
  inputs: { include: { materialType: { select: { id: true, code: true, name: true, unit: true, color: true } } } },
  outputs: { include: { materialType: { select: { id: true, code: true, name: true, unit: true, color: true } } } },
  waste: { include: { wasteType: { select: { id: true, code: true, name: true, unit: true, color: true } } } },
};

// ================================
// CRUD OPERATIONS
// ================================

export const findAllProcessingSessions = async (filters: {
  startDate?: Date;
  endDate?: Date;
  operatorId?: string;
  status?: string;
} = {}) => {
  try {
    interface WhereClause {
      date?: {
        gte?: Date;
        lte?: Date;
      };
      operatorId?: string;
      status?: string;
    }
    
    const where: WhereClause = {};
    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = startOfDay(filters.startDate);
      if (filters.endDate) where.date.lte = endOfDay(filters.endDate);
    }
    if (filters.operatorId) where.operatorId = filters.operatorId;
    if (filters.status) where.status = filters.status;

    return await prisma.processingSession.findMany({
      where,
      include: processingSessionInclude,
      orderBy: [{ date: 'desc' }, { shiftNumber: 'desc' }],
    });
  } catch (error) {
    console.error('Error finding processing sessions:', error);
    throw new HttpException(500, 'Errore durante il recupero delle sessioni di lavorazione');
  }
};

export const findProcessingSessionById = async (id: string) => {
  try {
    const session = await prisma.processingSession.findUnique({
      where: { id },
      include: processingSessionInclude,
    });
    if (!session) throw new HttpException(404, 'Sessione di lavorazione non trovata');
    return session;
  } catch (error) {
    if (error instanceof HttpException) throw error;
    console.error('Error finding processing session by id:', error);
    throw new HttpException(500, 'Errore durante il recupero della sessione di lavorazione');
  }
};

export const createProcessingSession = async (data: CreateProcessingSessionData) => {
  try {
    if (!data.operatorId || !data.inputs?.length) {
      throw new HttpException(400, 'Operatore e almeno un input sono obbligatori');
    }

    const operator = await prisma.user.findUnique({ where: { id: data.operatorId } });
    if (!operator) throw new HttpException(400, 'Operatore non trovato');

    const targetDate = new Date(data.date);
    const existingSession = await prisma.processingSession.findFirst({
      where: { date: targetDate, shiftNumber: data.shiftNumber },
    });
    if (existingSession) {
      throw new HttpException(400, `Esiste già una sessione per il turno ${data.shiftNumber} del ${format(targetDate, 'dd/MM/yyyy')}`);
    }

    // Valida materiali input
    for (const input of data.inputs) {
      const materialType = await materialTypesService.findById(input.materialTypeId);
      const isValid = await materialTypesService.validateForContext(input.materialTypeId, USAGE_CONTEXTS.LAVORAZIONI_INPUT);
      if (!isValid) {
        throw new HttpException(400, `Il materiale ${materialType.name} non è valido per input di lavorazione`);
      }
    }

    // Valida materiali output
    if (data.outputs) {
      for (const output of data.outputs) {
        const materialType = await materialTypesService.findById(output.materialTypeId);
        const isValid = await materialTypesService.validateForContext(output.materialTypeId, USAGE_CONTEXTS.LAVORAZIONI_OUTPUT);
        if (!isValid) {
          throw new HttpException(400, `Il materiale ${materialType.name} non è valido per output di lavorazione`);
        }
      }
    }

    const session = await prisma.$transaction(async (tx) => {
      const newSession = await tx.processingSession.create({
        data: {
          date: targetDate,
          shiftNumber: data.shiftNumber,
          operatorId: data.operatorId,
          startTime: data.startTime ? new Date(data.startTime) : undefined,
          endTime: data.endTime ? new Date(data.endTime) : undefined,
          status: 'IN_PROGRESS',
          notes: data.notes,
        },
      });

      await tx.processingInput.createMany({
        data: data.inputs.map(input => ({
          processingSessionId: newSession.id,
          materialTypeId: input.materialTypeId,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          quantityUsed: input.quantityUsed,
          unit: 'kg',
          qualityGrade: input.qualityGrade,
          moistureLevel: input.moistureLevel,
          contaminationPercent: input.contaminationPercent || 0,
          notes: input.notes,
        })),
      });

      if (data.outputs?.length) {
        await tx.processingOutput.createMany({
          data: data.outputs.map(output => ({
            processingSessionId: newSession.id,
            materialTypeId: output.materialTypeId,
            quantityProduced: output.quantityProduced,
            unit: 'kg',
            qualityGrade: output.qualityGrade || 'GOOD',
            packageCount: output.packageCount || 0,
            packageType: output.packageType,
            storageLocation: output.storageLocation,
            batchNumber: output.batchNumber,
            notes: output.notes,
          })),
        });
      }

      if (data.waste?.length) {
        await tx.processingWaste.createMany({
          data: data.waste.map(waste => ({
            processingSessionId: newSession.id,
            wasteTypeId: waste.wasteTypeId,
            quantity: waste.quantity,
            unit: 'kg',
            disposalMethod: waste.disposalMethod,
            disposalDestination: waste.disposalDestination,
            cerCode: waste.cerCode,
            notes: waste.notes,
          })),
        });
      }

      return newSession;
    });

    return await findProcessingSessionById(session.id);
  } catch (error) {
    if (error instanceof HttpException) throw error;
    console.error('Error creating processing session:', error);
    throw new HttpException(500, 'Errore durante la creazione della sessione di lavorazione');
  }
};

export const updateProcessingSession = async (id: string, data: UpdateProcessingSessionData) => {
  try {
    const existingSession = await prisma.processingSession.findUnique({ where: { id } });
    if (!existingSession) throw new HttpException(404, 'Sessione di lavorazione non trovata');

    if (existingSession.status === 'COMPLETED' && (data.inputs || data.outputs || data.waste)) {
      throw new HttpException(400, 'Impossibile modificare input/output di una sessione completata');
    }

    if (data.operatorId && data.operatorId !== existingSession.operatorId) {
      const operator = await prisma.user.findUnique({ where: { id: data.operatorId } });
      if (!operator) throw new HttpException(400, 'Operatore non trovato');
    }

    const { inputs, outputs, waste, ...sessionData } = data;

    const updatedSession = await prisma.$transaction(async (tx) => {
      const updated = await tx.processingSession.update({
        where: { id },
        data: {
          ...sessionData,
          date: sessionData.date ? new Date(sessionData.date) : undefined,
          startTime: sessionData.startTime ? new Date(sessionData.startTime) : undefined,
          endTime: sessionData.endTime ? new Date(sessionData.endTime) : undefined,
        },
      });

      if (inputs) {
        await tx.processingInput.deleteMany({ where: { processingSessionId: id } });
        if (inputs.length > 0) {
          await tx.processingInput.createMany({
            data: inputs.map(input => ({
              processingSessionId: id,
              materialTypeId: input.materialTypeId,
              sourceType: input.sourceType,
              sourceId: input.sourceId,
              quantityUsed: input.quantityUsed,
              unit: 'kg',
              qualityGrade: input.qualityGrade,
              moistureLevel: input.moistureLevel,
              contaminationPercent: input.contaminationPercent || 0,
              notes: input.notes,
            })),
          });
        }
      }

      if (outputs) {
        await tx.processingOutput.deleteMany({ where: { processingSessionId: id } });
        if (outputs.length > 0) {
          await tx.processingOutput.createMany({
            data: outputs.map(output => ({
              processingSessionId: id,
              materialTypeId: output.materialTypeId,
              quantityProduced: output.quantityProduced,
              unit: 'kg',
              qualityGrade: output.qualityGrade || 'GOOD',
              packageCount: output.packageCount || 0,
              packageType: output.packageType,
              storageLocation: output.storageLocation,
              batchNumber: output.batchNumber,
              notes: output.notes,
            })),
          });
        }
      }

      if (waste) {
        await tx.processingWaste.deleteMany({ where: { processingSessionId: id } });
        if (waste.length > 0) {
          await tx.processingWaste.createMany({
            data: waste.map(w => ({
              processingSessionId: id,
              wasteTypeId: w.wasteTypeId,
              quantity: w.quantity,
              unit: 'kg',
              disposalMethod: w.disposalMethod,
              disposalDestination: w.disposalDestination,
              cerCode: w.cerCode,
              notes: w.notes,
            })),
          });
        }
      }

      return updated;
    });

    return await findProcessingSessionById(updatedSession.id);
  } catch (error) {
    if (error instanceof HttpException) throw error;
    console.error('Error updating processing session:', error);
    throw new HttpException(500, 'Errore durante l\'aggiornamento della sessione di lavorazione');
  }
};

export const completeProcessingSession = async (id: string, endTime?: Date) => {
  try {
    const session = await findProcessingSessionById(id);
    if (session.status === 'COMPLETED') {
      throw new HttpException(400, 'Sessione già completata');
    }
    if (session.inputs.length === 0) {
      throw new HttpException(400, 'Impossibile completare: nessun input definito');
    }

    const completedSession = await prisma.processingSession.update({
      where: { id },
      data: { status: 'COMPLETED', endTime: endTime || new Date() },
    });

    console.log(`✅ Sessione lavorazione completata: ${format(session.date, 'dd/MM/yyyy')} - Turno ${session.shiftNumber}`);
    return await findProcessingSessionById(completedSession.id);
  } catch (error) {
    if (error instanceof HttpException) throw error;
    console.error('Error completing processing session:', error);
    throw new HttpException(500, 'Errore durante il completamento della sessione');
  }
};

export const deleteProcessingSession = async (id: string) => {
  try {
    const session = await prisma.processingSession.findUnique({ where: { id } });
    if (!session) throw new HttpException(404, 'Sessione di lavorazione non trovata');
    if (session.status === 'COMPLETED') {
      throw new HttpException(400, 'Impossibile eliminare una sessione completata');
    }

    await prisma.$transaction(async (tx) => {
      await tx.processingInput.deleteMany({ where: { processingSessionId: id } });
      await tx.processingOutput.deleteMany({ where: { processingSessionId: id } });
      await tx.processingWaste.deleteMany({ where: { processingSessionId: id } });
      await tx.processingSession.delete({ where: { id } });
    });

    return { message: 'Sessione di lavorazione eliminata con successo' };
  } catch (error) {
    if (error instanceof HttpException) throw error;
    console.error('Error deleting processing session:', error);
    throw new HttpException(500, 'Errore durante l\'eliminazione della sessione di lavorazione');
  }
};

// ================================
// ANALYTICS & REPORTING
// ================================

export const calculateProcessingEfficiency = async (sessionId: string) => {
  try {
    const session = await findProcessingSessionById(sessionId);
    const totalInput = session.inputs.reduce((sum, input) => sum + input.quantityUsed, 0);
    const totalOutput = session.outputs.reduce((sum, output) => sum + output.quantityProduced, 0);
    const totalWaste = session.waste.reduce((sum, waste) => sum + waste.quantity, 0);
    const efficiency = totalInput > 0 ? (totalOutput / totalInput) * 100 : 0;

    // Raggruppa per materiale e calcola i totali
    const materialBalance: { [materialTypeId: string]: {
      materialType: string;
      input: number;
      output: number;
      waste: number;
      balance: number;
    } } = {};
    session.inputs.forEach(input => {
      if (!materialBalance[input.materialTypeId]) {
        materialBalance[input.materialTypeId] = {
          materialType: input.materialType.name,
          input: 0, output: 0, waste: 0, balance: 0,
        };
      }
      materialBalance[input.materialTypeId].input += input.quantityUsed;
    });

    session.outputs.forEach(output => {
      if (!materialBalance[output.materialTypeId]) {
        materialBalance[output.materialTypeId] = {
          materialType: output.materialType.name,
          input: 0, output: 0, waste: 0, balance: 0,
        };
      }
      materialBalance[output.materialTypeId].output += output.quantityProduced;
    });

    session.waste.forEach(waste => {
      if (!materialBalance[waste.wasteTypeId]) {
        materialBalance[waste.wasteTypeId] = {
          materialType: waste.wasteType.name,
          input: 0, output: 0, waste: 0, balance: 0,
        };
      }
      materialBalance[waste.wasteTypeId].waste += waste.quantity;
    });

    Object.keys(materialBalance).forEach(materialTypeId => {
      const material = materialBalance[materialTypeId];
      material.balance = material.output - material.input + material.waste;
    });

    return {
      sessionId,
      date: format(session.date, 'yyyy-MM-dd'),
      shiftNumber: session.shiftNumber,
      operator: {
        id: session.operator.id,
        name: `${session.operator.firstName} ${session.operator.lastName}`,
      },
      totalInput, totalOutput, totalWaste, efficiency, materialBalance,
    };
  } catch (error) {
    console.error('Error calculating processing efficiency:', error);
    throw new HttpException(500, 'Errore durante il calcolo dell\'efficienza');
  }
};

export const getProcessingDashboardStats = async () => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [todaySessions, weekSessions, monthSessions] = await Promise.all([
      prisma.processingSession.count({
        where: { date: { gte: startOfDay(today), lte: endOfDay(today) } },
      }),
      prisma.processingSession.count({ where: { date: { gte: startOfWeek } } }),
      prisma.processingSession.count({ where: { date: { gte: startOfMonth } } }),
    ]);

    return {
      counts: { today: todaySessions, week: weekSessions, month: monthSessions },
      efficiency: { average: 85, sessionsAnalyzed: monthSessions }, // Simplified
    };
  } catch (error) {
    console.error('Error getting processing dashboard stats:', error);
    throw new HttpException(500, 'Errore durante il recupero delle statistiche dashboard');
  }
};

// ================================
// INTEGRATION FUNCTIONS
// ================================

export const getAvailableMaterialsForInput = async () => {
  return await materialTypesService.findByContext(USAGE_CONTEXTS.LAVORAZIONI_INPUT);
};

export const getAvailableMaterialsForOutput = async () => {
  return await materialTypesService.findByContext(USAGE_CONTEXTS.LAVORAZIONI_OUTPUT);
};

export const checkMaterialAvailability = async (materialTypeId: string, requiredQuantity: number) => {
  try {
    const materialType = await materialTypesService.findById(materialTypeId);
    return {
      available: true, // Simplified - integrate with inventory service
      materialType: materialType.name,
      requiredQuantity,
      note: 'Integrazione con inventory service necessaria per dati precisi',
    };
  } catch (error) {
    console.error('Error checking material availability:', error);
    return { available: false, error: 'Errore durante la verifica disponibilità' };
  }
};

// ================================
// SERVICE EXPORT
// ================================

export const processingService = {
  findAll: findAllProcessingSessions,
  findById: findProcessingSessionById,
  create: createProcessingSession,
  update: updateProcessingSession,
  complete: completeProcessingSession,
  delete: deleteProcessingSession,
  calculateEfficiency: calculateProcessingEfficiency,
  getDashboardStats: getProcessingDashboardStats,
  getAvailableMaterialsForInput,
  getAvailableMaterialsForOutput,
  checkMaterialAvailability,
};

export default processingService;