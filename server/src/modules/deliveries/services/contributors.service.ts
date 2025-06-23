// server/src/modules/deliveries/services/contributors.service.ts - FIXED

import { PrismaClient, Prisma } from '@prisma/client';
import { HttpException } from '../../../core/middleware/error.middleware';

const prisma = new PrismaClient();

// ================================
// INTERFACES
// ================================

export interface CreateContributorData {
  name: string;
  vatNumber?: string;
  fiscalCode?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  province?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  basinId?: string;
  authorizedMaterialTypes: string[]; // Array di codici materiali
  notes?: string;
}

export interface UpdateContributorData extends Partial<CreateContributorData> {
  isActive?: boolean;
}

export interface ContributorFilters {
  search?: string;
  basinId?: string;
  materialTypeCode?: string;
  isActive?: boolean;
}

export interface ContributorStatistics {
  year: number;
  totalWeight: number;
  totalDeliveries: number;
  byMaterial: Record<string, { weight: number; count: number }>;
  monthlyTrend: Array<{
    month: string;
    weight: number;
    deliveries: number;
  }>;
  averageDeliveryWeight: number;
}

// ================================
// SERVIZI CONFERITORI
// ================================

export const findAllContributors = async (filters: ContributorFilters = {}) => {
  try {
    const where: Prisma.ContributorWhereInput = {};

    // Filtro per ricerca testuale
    if (filters.search && filters.search.trim() !== '') {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { contactPerson: { contains: filters.search, mode: 'insensitive' } },
        { city: { contains: filters.search, mode: 'insensitive' } },
        { vatNumber: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    // Filtro per bacino
    if (filters.basinId) {
      where.basinId = filters.basinId;
    }

    // Filtro per stato attivo/inattivo
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    // Filtro per tipologia materiale autorizzata
    if (filters.materialTypeCode) {
      where.authorizedMaterialTypes = {
        contains: filters.materialTypeCode
      };
    }

    const contributors = await prisma.contributor.findMany({
      where,
      include: {
        basin: {
          include: {
            client: true
          }
        },
        _count: {
          select: {
            deliveries: true
          }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { name: 'asc' }
      ]
    });

    return contributors;
  } catch (error) {
    console.error('Errore in findAllContributors:', error);
    throw new HttpException(500, 'Errore durante il recupero dei conferitori');
  }
};

export const findContributorById = async (id: string) => {
  try {
    const contributor = await prisma.contributor.findUnique({
      where: { id },
      include: {
        basin: {
          include: {
            client: true
          }
        },
        deliveries: {
          take: 10,
          orderBy: { date: 'desc' },
          include: {
            materialType: true
          }
        },
        _count: {
          select: {
            deliveries: true
          }
        }
      }
    });

    if (!contributor) {
      throw new HttpException(404, 'Conferitore non trovato');
    }

    return contributor;
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    console.error('Errore in findContributorById:', error);
    throw new HttpException(500, 'Errore durante il recupero del conferitore');
  }
};

export const createContributor = async (data: CreateContributorData) => {
  try {
    // Verifica che il nome non esista già
    const existingContributor = await prisma.contributor.findFirst({
      where: {
        name: data.name,
        isActive: true
      }
    });

    if (existingContributor) {
      throw new HttpException(400, 'Esiste già un conferitore attivo con questo nome');
    }

    // Verifica che la P.IVA non esista già (se fornita)
    if (data.vatNumber) {
      const existingVat = await prisma.contributor.findFirst({
        where: {
          vatNumber: data.vatNumber,
          isActive: true
        }
      });

      if (existingVat) {
        throw new HttpException(400, 'Esiste già un conferitore attivo con questa Partita IVA');
      }
    }

    // Verifica che il bacino esista (se fornito)
    if (data.basinId) {
      const basin = await prisma.basin.findUnique({
        where: { id: data.basinId }
      });

      if (!basin) {
        throw new HttpException(404, 'Bacino non trovato');
      }
    }

    // Crea il conferitore
    const contributor = await prisma.contributor.create({
      data: {
        name: data.name,
        vatNumber: data.vatNumber,
        fiscalCode: data.fiscalCode,
        address: data.address,
        city: data.city,
        zipCode: data.zipCode,
        province: data.province,
        phone: data.phone,
        email: data.email,
        contactPerson: data.contactPerson,
        basinId: data.basinId,
        authorizedMaterialTypes: JSON.stringify(data.authorizedMaterialTypes || []),
        notes: data.notes,
        isActive: true
      },
      include: {
        basin: {
          include: {
            client: true
          }
        }
      }
    });

    return contributor;
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    console.error('Errore in createContributor:', error);
    throw new HttpException(500, 'Errore durante la creazione del conferitore');
  }
};

export const updateContributor = async (id: string, data: UpdateContributorData) => {
  try {
    // Verifica che il conferitore esista
    const existingContributor = await prisma.contributor.findUnique({
      where: { id }
    });

    if (!existingContributor) {
      throw new HttpException(404, 'Conferitore non trovato');
    }

    // Verifica unicità del nome (se viene modificato)
    if (data.name && data.name !== existingContributor.name) {
      const nameExists = await prisma.contributor.findFirst({
        where: {
          name: data.name,
          isActive: true,
          id: { not: id }
        }
      });

      if (nameExists) {
        throw new HttpException(400, 'Esiste già un conferitore attivo con questo nome');
      }
    }

    // Verifica unicità della P.IVA (se viene modificata)
    if (data.vatNumber && data.vatNumber !== existingContributor.vatNumber) {
      const vatExists = await prisma.contributor.findFirst({
        where: {
          vatNumber: data.vatNumber,
          isActive: true,
          id: { not: id }
        }
      });

      if (vatExists) {
        throw new HttpException(400, 'Esiste già un conferitore attivo con questa Partita IVA');
      }
    }

    // Verifica che il bacino esista (se viene modificato)
    if (data.basinId && data.basinId !== existingContributor.basinId) {
      const basin = await prisma.basin.findUnique({
        where: { id: data.basinId }
      });

      if (!basin) {
        throw new HttpException(404, 'Bacino non trovato');
      }
    }

    // CORREZIONE: Prepara i dati per l'aggiornamento con gestione corretta delle relazioni
    const updateData: Prisma.ContributorUpdateInput = {};
    
    // Copia tutti i campi semplici
    if (data.name !== undefined) updateData.name = data.name;
    if (data.vatNumber !== undefined) updateData.vatNumber = data.vatNumber;
    if (data.fiscalCode !== undefined) updateData.fiscalCode = data.fiscalCode;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.zipCode !== undefined) updateData.zipCode = data.zipCode;
    if (data.province !== undefined) updateData.province = data.province;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.contactPerson !== undefined) updateData.contactPerson = data.contactPerson;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    
    // CORREZIONE: Gestione corretta della relazione con Basin
    if (data.basinId !== undefined) {
      if (data.basinId === null || data.basinId === '') {
        // Disconnetti il bacino
        updateData.basin = { disconnect: true };
      } else {
        // Connetti al nuovo bacino
        updateData.basin = { connect: { id: data.basinId } };
      }
    }
    
    // Gestione speciale per authorizedMaterialTypes
    if (data.authorizedMaterialTypes !== undefined) {
      updateData.authorizedMaterialTypes = JSON.stringify(data.authorizedMaterialTypes);
    }

    // Aggiorna il conferitore
    const contributor = await prisma.contributor.update({
      where: { id },
      data: updateData,
      include: {
        basin: {
          include: {
            client: true
          }
        }
      }
    });

    return contributor;
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    console.error('Errore in updateContributor:', error);
    throw new HttpException(500, 'Errore durante l\'aggiornamento del conferitore');
  }
};

export const deleteContributor = async (id: string) => {
  try {
    const contributor = await prisma.contributor.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            deliveries: true
          }
        }
      }
    });

    if (!contributor) {
      throw new HttpException(404, 'Conferitore non trovato');
    }

    // Se ha conferimenti associati, disattiva invece di eliminare
    if (contributor._count.deliveries > 0) {
      return prisma.contributor.update({
        where: { id },
        data: { 
          isActive: false,
          notes: (contributor.notes || '') + `\n[DISATTIVATO il ${new Date().toLocaleDateString('it-IT')}]`
        }
      });
    } else {
      // Se non ha conferimenti, elimina fisicamente
      return prisma.contributor.delete({
        where: { id }
      });
    }
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    console.error('Errore in deleteContributor:', error);
    throw new HttpException(500, 'Errore durante l\'eliminazione del conferitore');
  }
};

export const getContributorsByMaterialType = async (materialTypeCode: string) => {
  try {
    const contributors = await prisma.contributor.findMany({
      where: {
        authorizedMaterialTypes: {
          contains: materialTypeCode
        },
        isActive: true
      },
      include: {
        basin: {
          include: {
            client: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return contributors;
  } catch (error) {
    console.error('Errore in getContributorsByMaterialType:', error);
    throw new HttpException(500, 'Errore durante il recupero dei conferitori per tipologia');
  }
};

export const getContributorStatistics = async (id: string, year?: number): Promise<ContributorStatistics> => {
  try {
    const currentYear = year || new Date().getFullYear();
    
    // Verifica che il conferitore esista
    const contributor = await prisma.contributor.findUnique({
      where: { id }
    });

    if (!contributor) {
      throw new HttpException(404, 'Conferitore non trovato');
    }

    // Recupera i conferimenti dell'anno
    const deliveries = await prisma.delivery.findMany({
      where: {
        contributorId: id,
        date: {
          gte: new Date(currentYear, 0, 1),
          lte: new Date(currentYear, 11, 31, 23, 59, 59)
        }
      },
      include: {
        materialType: true
      },
      orderBy: { date: 'asc' }
    });

    // Calcola statistiche generali
    const totalWeight = deliveries.reduce((sum, d) => sum + d.weight, 0);
    const totalDeliveries = deliveries.length;
    const averageDeliveryWeight = totalDeliveries > 0 ? totalWeight / totalDeliveries : 0;

    // Raggruppa per tipologia materiale
    const byMaterial = deliveries.reduce((acc, d) => {
      const key = d.materialType.name;
      if (!acc[key]) {
        acc[key] = { weight: 0, count: 0 };
      }
      acc[key].weight += d.weight;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { weight: number; count: number }>);

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
      byMaterial,
      monthlyTrend,
      averageDeliveryWeight
    };
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    console.error('Errore in getContributorStatistics:', error);
    throw new HttpException(500, 'Errore durante il calcolo delle statistiche del conferitore');
  }
};