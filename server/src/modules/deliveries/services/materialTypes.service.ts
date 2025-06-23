// server/src/modules/deliveries/services/materialTypes.service.ts - FIXED

import { PrismaClient, Prisma } from '@prisma/client';
import { HttpException } from '../../../core/middleware/error.middleware';

const prisma = new PrismaClient();

// ================================
// INTERFACES
// ================================

export interface CreateMaterialTypeData {
  code: string;
  name: string;
  description?: string;
  unit?: string;
  cerCode?: string;
  reference?: string;
  color?: string;
  sortOrder?: number;
  parentId?: string;
}

export interface UpdateMaterialTypeData extends Partial<CreateMaterialTypeData> {
  isActive?: boolean;
}

export interface MaterialTypeStatistics {
  year: number;
  totalWeight: number;
  totalDeliveries: number;
  byContributor: Record<string, { weight: number; count: number }>;
  monthlyTrend: Array<{
    month: string;
    weight: number;
    deliveries: number;
  }>;
  averageDeliveryWeight: number;
  topContributors: Array<{
    contributorName: string;
    weight: number;
    deliveries: number;
    percentage: number;
  }>;
}

// ================================
// SERVIZI TIPOLOGIE MATERIALI
// ================================

export const findAllMaterialTypes = async (includeInactive = false) => {
  try {
    const where: Prisma.MaterialTypeWhereInput = {};
    
    if (!includeInactive) {
      where.isActive = true;
    }

    const materialTypes = await prisma.materialType.findMany({
      where,
      include: {
        parent: true,
        children: {
          where: includeInactive ? {} : { isActive: true },
          orderBy: [
            { sortOrder: 'asc' },
            { name: 'asc' }
          ]
        },
        _count: {
          select: {
            deliveries: true,
            children: true
          }
        }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    return materialTypes;
  } catch (error) {
    console.error('Errore in findAllMaterialTypes:', error);
    throw new HttpException(500, 'Errore durante il recupero delle tipologie materiali');
  }
};

export const findMaterialTypeById = async (id: string) => {
  try {
    const materialType = await prisma.materialType.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: [
            { sortOrder: 'asc' },
            { name: 'asc' }
          ]
        },
        deliveries: {
          take: 10,
          orderBy: { date: 'desc' },
          include: {
            contributor: true
          }
        },
        _count: {
          select: {
            deliveries: true,
            children: true
          }
        }
      }
    });

    if (!materialType) {
      throw new HttpException(404, 'Tipologia materiale non trovata');
    }

    return materialType;
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    console.error('Errore in findMaterialTypeById:', error);
    throw new HttpException(500, 'Errore durante il recupero della tipologia materiale');
  }
};

export const findMaterialTypeByCode = async (code: string) => {
  try {
    const materialType = await prisma.materialType.findUnique({
      where: { code },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: [
            { sortOrder: 'asc' },
            { name: 'asc' }
          ]
        },
        _count: {
          select: {
            deliveries: true,
            children: true
          }
        }
      }
    });

    if (!materialType) {
      throw new HttpException(404, 'Tipologia materiale non trovata');
    }

    return materialType;
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    console.error('Errore in findMaterialTypeByCode:', error);
    throw new HttpException(500, 'Errore durante il recupero della tipologia materiale');
  }
};

export const createMaterialType = async (data: CreateMaterialTypeData) => {
  try {
    // Verifica che il codice non esista già
    const existingCode = await prisma.materialType.findUnique({
      where: { code: data.code }
    });

    if (existingCode) {
      throw new HttpException(400, 'Codice tipologia materiale già esistente');
    }

    // Verifica che il parent esista (se fornito)
    if (data.parentId) {
      const parent = await prisma.materialType.findUnique({
        where: { id: data.parentId }
      });

      if (!parent) {
        throw new HttpException(404, 'Tipologia materiale padre non trovata');
      }

      // Verifica che non sia un figlio che cerca di diventare padre di se stesso
      if (parent.parentId) {
        throw new HttpException(400, 'Impossibile creare più di due livelli di gerarchia');
      }
    }

    // Determina il sortOrder se non fornito
    let sortOrder = data.sortOrder;
    if (sortOrder === undefined) {
      const maxSort = await prisma.materialType.aggregate({
        _max: { sortOrder: true },
        where: { parentId: data.parentId || null }
      });
      sortOrder = (maxSort._max.sortOrder || 0) + 10;
    }

    // Crea la tipologia materiale
    const materialType = await prisma.materialType.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        unit: data.unit || 'kg',
        cerCode: data.cerCode,
        reference: data.reference,
        color: data.color || generateRandomColor(),
        sortOrder: sortOrder,
        parentId: data.parentId,
        isActive: true
      },
      include: {
        parent: true,
        children: true
      }
    });

    return materialType;
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    console.error('Errore in createMaterialType:', error);
    throw new HttpException(500, 'Errore durante la creazione della tipologia materiale');
  }
};

export const updateMaterialType = async (id: string, data: UpdateMaterialTypeData) => {
  try {
    // Verifica che la tipologia materiale esista
    const existingMaterialType = await prisma.materialType.findUnique({
      where: { id },
      include: { children: true }
    });

    if (!existingMaterialType) {
      throw new HttpException(404, 'Tipologia materiale non trovata');
    }

    // Verifica unicità del codice (se viene modificato)
    if (data.code && data.code !== existingMaterialType.code) {
      const codeExists = await prisma.materialType.findUnique({
        where: { code: data.code }
      });

      if (codeExists) {
        throw new HttpException(400, 'Codice tipologia materiale già esistente');
      }
    }

    // Verifica che il parent esista e non crei loop (se viene modificato)
    if (data.parentId && data.parentId !== existingMaterialType.parentId) {
      const parent = await prisma.materialType.findUnique({
        where: { id: data.parentId }
      });

      if (!parent) {
        throw new HttpException(404, 'Tipologia materiale padre non trovata');
      }

      // Verifica che non crei un loop (parent che diventa figlio del figlio)
      if (parent.parentId === id) {
        throw new HttpException(400, 'Impossibile creare una relazione circolare');
      }

      // Verifica che il parent non sia un figlio
      if (parent.parentId) {
        throw new HttpException(400, 'Impossibile creare più di due livelli di gerarchia');
      }
    }

    // Se ha figli e si sta tentando di assegnare un parent, blocca
    if (data.parentId && existingMaterialType.children.length > 0) {
      throw new HttpException(400, 'Impossibile assegnare un parent a una tipologia che ha già dei figli');
    }

    // Aggiorna la tipologia materiale
    const materialType = await prisma.materialType.update({
      where: { id },
      data,
      include: {
        parent: true,
        children: true
      }
    });

    return materialType;
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    console.error('Errore in updateMaterialType:', error);
    throw new HttpException(500, 'Errore durante l\'aggiornamento della tipologia materiale');
  }
};

export const deleteMaterialType = async (id: string) => {
  try {
    const materialType = await prisma.materialType.findUnique({
      where: { id },
      include: {
        children: true,
        _count: {
          select: {
            deliveries: true
          }
        }
      }
    });

    if (!materialType) {
      throw new HttpException(404, 'Tipologia materiale non trovata');
    }

    // Verifica che non abbia figli attivi
    const activeChildren = materialType.children.filter(child => child.isActive);
    if (activeChildren.length > 0) {
      throw new HttpException(400, 'Impossibile eliminare: esistono sotto-tipologie attive associate');
    }

    // Se ha conferimenti associati, disattiva invece di eliminare
    if (materialType._count.deliveries > 0) {
      return prisma.materialType.update({
        where: { id },
        data: { 
          isActive: false,
          description: (materialType.description || '') + ` [DISATTIVATO il ${new Date().toLocaleDateString('it-IT')}]`
        }
      });
    } else {
      // Se non ha conferimenti, elimina fisicamente
      return prisma.materialType.delete({
        where: { id }
      });
    }
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    console.error('Errore in deleteMaterialType:', error);
    throw new HttpException(500, 'Errore durante l\'eliminazione della tipologia materiale');
  }
};

export const getHierarchicalMaterialTypes = async () => {
  try {
    const materialTypes = await prisma.materialType.findMany({
      where: { 
        isActive: true,
        parentId: null // Solo i parent di primo livello
      },
      include: {
        children: {
          where: { isActive: true },
          orderBy: [
            { sortOrder: 'asc' },
            { name: 'asc' }
          ],
          include: {
            _count: {
              select: {
                deliveries: true
              }
            }
          }
        },
        _count: {
          select: {
            deliveries: true
          }
        }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    return materialTypes;
  } catch (error) {
    console.error('Errore in getHierarchicalMaterialTypes:', error);
    throw new HttpException(500, 'Errore durante il recupero della struttura gerarchica');
  }
};

export const getMaterialTypeStatistics = async (id: string, year?: number): Promise<MaterialTypeStatistics> => {
  try {
    const currentYear = year || new Date().getFullYear();
    
    // Verifica che la tipologia materiale esista
    const materialType = await prisma.materialType.findUnique({
      where: { id }
    });

    if (!materialType) {
      throw new HttpException(404, 'Tipologia materiale non trovata');
    }

    // Recupera i conferimenti dell'anno
    const deliveries = await prisma.delivery.findMany({
      where: {
        materialTypeId: id,
        date: {
          gte: new Date(currentYear, 0, 1),
          lte: new Date(currentYear, 11, 31, 23, 59, 59)
        }
      },
      include: {
        contributor: true
      },
      orderBy: { date: 'asc' }
    });

    // Calcola statistiche generali
    const totalWeight = deliveries.reduce((sum, d) => sum + d.weight, 0);
    const totalDeliveries = deliveries.length;
    const averageDeliveryWeight = totalDeliveries > 0 ? totalWeight / totalDeliveries : 0;

    // Raggruppa per conferitore
    const byContributor = deliveries.reduce((acc, d) => {
      const key = d.contributor.name;
      if (!acc[key]) {
        acc[key] = { weight: 0, count: 0 };
      }
      acc[key].weight += d.weight;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { weight: number; count: number }>);

    // Top conferitori
    const topContributors = Object.entries(byContributor)
      .map(([name, data]) => ({
        contributorName: name,
        weight: data.weight,
        deliveries: data.count,
        percentage: totalWeight > 0 ? (data.weight / totalWeight) * 100 : 0
      }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10);

    // Raggruppa per mese
    const monthlyData = deliveries.reduce((acc, d) => {
      const monthKey = d.date.toISOString().substring(0, 7); // YYYY-MM
      if (!acc[monthKey]) {
        acc[monthKey] = { weight: 0, deliveries: 0 };
      }
      acc[monthKey].weight += d.weight;
      acc[monthKey].deliveries += 1;
      return acc;
    }, {} as Record<string, { weight: number; deliveries: number }>);

    // Crea trend mensile completo (tutti i 12 mesi)
    const monthlyTrend = [];
    for (let month = 0; month < 12; month++) {
      const monthKey = `${currentYear}-${(month + 1).toString().padStart(2, '0')}`;
      const monthData = monthlyData[monthKey] || { weight: 0, deliveries: 0 };
      
      monthlyTrend.push({
        month: monthKey,
        weight: monthData.weight,
        deliveries: monthData.deliveries
      });
    }

    return {
      year: currentYear,
      totalWeight,
      totalDeliveries,
      byContributor,
      monthlyTrend,
      averageDeliveryWeight,
      topContributors
    };
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    console.error('Errore in getMaterialTypeStatistics:', error);
    throw new HttpException(500, 'Errore durante il calcolo delle statistiche della tipologia materiale');
  }
};

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Genera un colore casuale in formato hex
 */
function generateRandomColor(): string {
  const colors = [
    '#2196F3', // Blue
    '#4CAF50', // Green
    '#FF9800', // Orange
    '#9C27B0', // Purple
    '#F44336', // Red
    '#00BCD4', // Cyan
    '#FFEB3B', // Yellow
    '#795548', // Brown
    '#607D8B', // Blue Grey
    '#E91E63', // Pink
    '#3F51B5', // Indigo
    '#009688'  // Teal
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}