// server/src/modules/deliveries/services/deliveries.service.ts

import { PrismaClient, Prisma } from '@prisma/client';
import { HttpException } from '../../../core/middleware/error.middleware';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, format, isValid, parseISO } from 'date-fns';

const prisma = new PrismaClient();

// ================================
// INTERFACES
// ================================

export interface CreateDeliveryData {
  date: Date | string;
  contributorId?: string; // ✅ Reso opzionale
  contributorName?: string; // ✅ Aggiunto per auto-creazione
  materialTypeId: string;
  weight: number;
  unit?: string;
  documentNumber?: string;
  vehiclePlate?: string;
  driverName?: string;
  quality?: string;
  moistureLevel?: string;
  contaminationLevel?: string;
  notes?: string;
  createdBy?: string;
}

export interface UpdateDeliveryData extends Partial<CreateDeliveryData> {
  isValidated?: boolean;
  validatedBy?: string;
}

export interface DeliveryFilters {
  startDate?: Date;
  endDate?: Date;
  contributorId?: string;
  materialTypeId?: string;
  basinId?: string;
  isValidated?: boolean;
}

export interface MaterialBreakdown {
  materialTypeId: string;
  materialTypeName: string;
  totalWeight: number;
  count: number;
}

export interface DayDeliveriesSummary {
  date: string;
  totalWeight: number;
  deliveriesCount: number;
  materialsBreakdown: MaterialBreakdown[];
  hasDeliveries: boolean;
}

export interface MonthlyCalendarData {
  month: string; // YYYY-MM
  days: DayDeliveriesSummary[];
  monthlyTotals: {
    totalWeight: number;
    totalDeliveries: number;
    materialTypeBreakdown: MaterialBreakdown[];
  };
}

// ================================
// SERVIZI CONFERIMENTI
// ================================

export const findDeliveriesByFilters = async (filters: DeliveryFilters = {}) => {
  const where: Prisma.DeliveryWhereInput = {};

  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) where.date.gte = filters.startDate;
    if (filters.endDate) where.date.lte = filters.endDate;
  }

  if (filters.contributorId) where.contributorId = filters.contributorId;
  if (filters.materialTypeId) where.materialTypeId = filters.materialTypeId;
  if (filters.basinId) where.basinId = filters.basinId;
  if (filters.isValidated !== undefined) where.isValidated = filters.isValidated;

  return prisma.delivery.findMany({
    where,
    include: {
      contributor: {
        include: {
          basin: true
        }
      },
      materialType: {
        include: {
          parent: true
        }
      },
      basin: true
    },
    orderBy: [
      { date: 'desc' },
      { createdAt: 'desc' }
    ]
  });
};

export const findDeliveryById = async (id: string) => {
  const delivery = await prisma.delivery.findUnique({
    where: { id },
    include: {
      contributor: {
        include: {
          basin: true
        }
      },
      materialType: {
        include: {
          parent: true
        }
      },
      basin: true
    }
  });

  if (!delivery) {
    throw new HttpException(404, 'Conferimento non trovato');
  }

  return delivery;
};

// 🔧 CORREZIONE PRINCIPALE: createDelivery con gestione automatica conferitori
export const createDelivery = async (data: CreateDeliveryData) => {
  console.log('📦 Creazione conferimento con data:', data);
  
  try {
    let contributorId = data.contributorId;
    
    // ✅ GESTIONE AUTOMATICA CONFERITORE
    // Se viene passato contributorName invece di contributorId, crea o trova il conferitore
    if (!contributorId && data.contributorName) {
      console.log('🔍 Ricerca conferitore per nome:', data.contributorName);
      
      // Cerca se esiste già un conferitore con questo nome (case-insensitive)
      let existingContributor = await prisma.contributor.findFirst({
        where: {
          name: {
            equals: data.contributorName.trim(),
            mode: 'insensitive'
          }
        }
      });
      
      // Se non esiste, crealo automaticamente
      if (!existingContributor) {
        console.log('➕ Creazione nuovo conferitore:', data.contributorName);
        
        existingContributor = await prisma.contributor.create({
          data: {
            name: data.contributorName.trim(),
            isActive: true,
            authorizedMaterialTypes: JSON.stringify([]), // Array vuoto per ora - sarà autorizzato per tutti
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        console.log('✅ Conferitore creato con ID:', existingContributor.id);
      } else {
        console.log('✅ Conferitore esistente trovato con ID:', existingContributor.id);
      }
      
      contributorId = existingContributor.id;
    }
    
    // Verifica che il conferitore esista
    if (!contributorId) {
      throw new HttpException(400, 'contributorId o contributorName sono richiesti');
    }
    
    const contributor = await prisma.contributor.findUnique({
      where: { id: contributorId },
      include: { basin: true }
    });
    
    if (!contributor) {
      throw new HttpException(404, 'Conferitore non trovato');
    }
    
    // Verifica che il tipo di materiale esista
    const materialType = await prisma.materialType.findUnique({
      where: { id: data.materialTypeId }
    });
    
    if (!materialType) {
      throw new HttpException(404, 'Tipo di materiale non trovato');
    }
    
    // ✅ SEMPLIFICAZIONE: Per i conferitori auto-creati, saltiamo la verifica autorizzazioni
    // (In futuro si potrà aggiungere una gestione più sofisticata)
    const authorizedTypes = JSON.parse(contributor.authorizedMaterialTypes || '[]');
    if (authorizedTypes.length > 0 && !authorizedTypes.includes(materialType.code)) {
      console.log('⚠️ Conferitore non autorizzato, ma procediamo comunque per auto-creati');
      // throw new HttpException(400, `Il conferitore non è autorizzato per la tipologia ${materialType.name}`);
    }
    
    // ✅ SEMPLIFICAZIONE: Per ora permettiamo duplicati (si può gestire dopo)
    // Verifica duplicati (stesso giorno, conferitore, materiale)
    const existingDelivery = await prisma.delivery.findFirst({
      where: {
        date: {
          gte: startOfDay(new Date(data.date)),
          lte: endOfDay(new Date(data.date))
        },
        contributorId: contributorId,
        materialTypeId: data.materialTypeId
      }
    });

    if (existingDelivery) {
      console.log('⚠️ Conferimento duplicato trovato, ma procediamo comunque');
      // throw new HttpException(400, 'Esiste già un conferimento per questo conferitore e tipologia nella data selezionata');
    }

    // Crea il conferimento
    const delivery = await prisma.delivery.create({
      data: {
        date: new Date(data.date),
        contributorId: contributorId,
        materialTypeId: data.materialTypeId,
        basinId: contributor.basinId || undefined, // Eredita dal conferitore se disponibile
        weight: data.weight,
        unit: data.unit || materialType.unit,
        documentNumber: data.documentNumber,
        vehiclePlate: data.vehiclePlate,
        driverName: data.driverName,
        quality: data.quality,
        moistureLevel: data.moistureLevel,
        contaminationLevel: data.contaminationLevel,
        notes: data.notes,
        isValidated: false,
        createdBy: data.createdBy,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        contributor: {
          include: {
            basin: true
          }
        },
        materialType: {
          include: {
            parent: true
          }
        },
        basin: true
      }
    });

    console.log('✅ Conferimento creato con successo:', delivery.id);
    return delivery;
    
  } catch (error: any) {
    console.error('❌ Errore nella creazione del conferimento:', error);
    
    if (error instanceof HttpException) {
      throw error;
    }
    
    // Log più dettagliato per debug
    console.error('Dettagli errore createDelivery:', {
      message: error.message,
      stack: error.stack,
      inputData: data
    });
    
    throw new HttpException(500, `Errore durante la creazione del conferimento: ${error.message}`);
  }
};

export const updateDelivery = async (id: string, data: UpdateDeliveryData) => {
  const delivery = await prisma.delivery.findUnique({
    where: { id },
    include: { contributor: true, materialType: true }
  });

  if (!delivery) {
    throw new HttpException(404, 'Conferimento non trovato');
  }

  // Se viene aggiornato contributor o materialType, verifica autorizzazioni
  if (data.contributorId || data.materialTypeId) {
    const contributorId = data.contributorId || delivery.contributorId;
    const materialTypeId = data.materialTypeId || delivery.materialTypeId;

    const [contributor, materialType] = await Promise.all([
      prisma.contributor.findUnique({ where: { id: contributorId } }),
      prisma.materialType.findUnique({ where: { id: materialTypeId } })
    ]);

    if (contributor && materialType) {
      const authorizedTypes = JSON.parse(contributor.authorizedMaterialTypes || '[]');
      if (authorizedTypes.length > 0 && !authorizedTypes.includes(materialType.code)) {
        throw new HttpException(400, `Il conferitore non è autorizzato per la tipologia ${materialType.name}`);
      }
    }
  }

  // Aggiorna validazione se richiesta
  const updateData: Prisma.DeliveryUpdateInput = { ...data };
  if (data.isValidated && !delivery.isValidated) {
    updateData.validatedAt = new Date();
  }

  return prisma.delivery.update({
    where: { id },
    data: updateData,
    include: {
      contributor: {
        include: {
          basin: true
        }
      },
      materialType: {
        include: {
          parent: true
        }
      },
      basin: true
    }
  });
};

export const deleteDelivery = async (id: string) => {
  const delivery = await prisma.delivery.findUnique({
    where: { id }
  });

  if (!delivery) {
    throw new HttpException(404, 'Conferimento non trovato');
  }

  // Non permettere cancellazione se validato
  if (delivery.isValidated) {
    throw new HttpException(400, 'Impossibile eliminare un conferimento già validato');
  }

  return prisma.delivery.delete({
    where: { id }
  });
};

// ================================
// SERVIZI CALENDARIO E AGGREGAZIONI
// ================================

interface DeliveryWithMaterial {
  date: Date;
  weight: number;
  materialTypeId: string;
  materialType: {
    name: string;
  };
  contributor: unknown;
}

export const getMonthlyCalendarData = async (
  year: number, 
  month: number, // 1-12
  materialTypeId?: string,
  basinId?: string
): Promise<MonthlyCalendarData> => {
  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(new Date(year, month - 1));

  const where: Prisma.DeliveryWhereInput = {
    date: {
      gte: startDate,
      lte: endDate
    }
  };

  if (materialTypeId) where.materialTypeId = materialTypeId;
  if (basinId) where.basinId = basinId;

  const deliveries = await prisma.delivery.findMany({
    where,
    include: {
      materialType: true,
      contributor: true
    },
    orderBy: { date: 'asc' }
  });

  // Raggruppa per giorno
  const dayGroups = new Map<string, DeliveryWithMaterial[]>();
  
  deliveries.forEach(delivery => {
    const dayKey = format(delivery.date, 'yyyy-MM-dd');
    if (!dayGroups.has(dayKey)) {
      dayGroups.set(dayKey, []);
    }
    dayGroups.get(dayKey)!.push(delivery);
  });

  // Crea i dati per ogni giorno del mese
  const days: DayDeliveriesSummary[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayKey = format(currentDate, 'yyyy-MM-dd');
    const dayDeliveries = dayGroups.get(dayKey) || [];
    
    // Calcola breakdown per tipologia
    const materialsMap = new Map<string, { name: string; weight: number; count: number }>();
    
    dayDeliveries.forEach(delivery => {
      const key = delivery.materialTypeId;
      if (!materialsMap.has(key)) {
        materialsMap.set(key, {
          name: delivery.materialType.name,
          weight: 0,
          count: 0
        });
      }
      const material = materialsMap.get(key)!;
      material.weight += delivery.weight;
      material.count += 1;
    });

    const materialsBreakdown = Array.from(materialsMap.entries()).map(([id, data]) => ({
      materialTypeId: id,
      materialTypeName: data.name,
      totalWeight: data.weight,
      count: data.count
    }));

    days.push({
      date: dayKey,
      totalWeight: dayDeliveries.reduce((sum, d) => sum + d.weight, 0),
      deliveriesCount: dayDeliveries.length,
      materialsBreakdown,
      hasDeliveries: dayDeliveries.length > 0
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Calcola totali mensili
  const monthlyMaterialsMap = new Map<string, { name: string; weight: number; count: number }>();
  
  deliveries.forEach(delivery => {
    const key = delivery.materialTypeId;
    if (!monthlyMaterialsMap.has(key)) {
      monthlyMaterialsMap.set(key, {
        name: delivery.materialType.name,
        weight: 0,
        count: 0
      });
    }
    const material = monthlyMaterialsMap.get(key)!;
    material.weight += delivery.weight;
    material.count += 1;
  });

  const materialTypeBreakdown = Array.from(monthlyMaterialsMap.entries()).map(([id, data]) => ({
    materialTypeId: id,
    materialTypeName: data.name,
    totalWeight: data.weight,
    count: data.count
  }));

  return {
    month: format(startDate, 'yyyy-MM'),
    days,
    monthlyTotals: {
      totalWeight: deliveries.reduce((sum, d) => sum + d.weight, 0),
      totalDeliveries: deliveries.length,
      materialTypeBreakdown
    }
  };
};

// CORRETTO: Fix della funzione getDayDeliveries
export const getDayDeliveries = async (date: string, materialTypeId?: string) => {
  try {
    console.log('getDayDeliveries chiamata con:', { date, materialTypeId });
    
    // CORRETTO: Validazione e parsing della data
    if (!date || typeof date !== 'string') {
      throw new HttpException(400, 'Data non valida: parametro date mancante o formato errato');
    }

    // Verifica formato data ISO (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new HttpException(400, 'Formato data non valido. Utilizzare il formato YYYY-MM-DD');
    }

    // Parse della data e validazione
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) {
      throw new HttpException(400, 'Data non valida: impossibile parsare la data fornita');
    }

    const startDate = startOfDay(parsedDate);
    const endDate = endOfDay(parsedDate);

    console.log('Range date calcolato:', { startDate, endDate });

    // Costruisci la query
    const where: Prisma.DeliveryWhereInput = {
      date: {
        gte: startDate,
        lte: endDate
      }
    };

    // Aggiungi filtro per tipologia materiale se fornito
    if (materialTypeId && materialTypeId.trim() !== '') {
      // Verifica che la tipologia materiale esista
      const materialType = await prisma.materialType.findUnique({
        where: { id: materialTypeId }
      });
      
      if (!materialType) {
        throw new HttpException(404, 'Tipologia materiale non trovata');
      }
      
      where.materialTypeId = materialTypeId;
    }

    console.log('Query where costruita:', JSON.stringify(where, null, 2));

    // Esegui la query
    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        contributor: {
          include: {
            basin: true
          }
        },
        materialType: {
          include: {
            parent: true
          }
        }
      },
      orderBy: [
        { materialType: { sortOrder: 'asc' } },
        { contributor: { name: 'asc' } },
        { createdAt: 'desc' }
      ]
    });

    console.log(`Trovati ${deliveries.length} conferimenti per la data ${date}`);

    return deliveries;

  } catch (error) {
    console.error('Errore in getDayDeliveries:', error);
    
    if (error instanceof HttpException) {
      throw error;
    }
    
    // Log dettagliato per debug
    console.error('Dettagli errore:', {
      message: error instanceof Error ? error.message : 'Errore sconosciuto',
      stack: error instanceof Error ? error.stack : undefined,
      inputDate: date,
      inputMaterialTypeId: materialTypeId
    });
    
    throw new HttpException(500, 'Errore interno durante il recupero dei conferimenti del giorno');
  }
};