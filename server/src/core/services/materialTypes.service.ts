// server/src/core/services/materialTypes.service.ts - SERVIZIO CENTRALIZZATO

import { PrismaClient, Prisma } from '@prisma/client';
import { HttpException } from '../middleware/error.middleware';

const prisma = new PrismaClient();

// ================================
// INTERFACES CENTRALIZZATE
// ================================

export interface MaterialTypeCore {
  id: string;
  code: string;
  name: string;
  description?: string;
  unit: string;
  cerCode?: string;
  reference?: string;
  color?: string;
  sortOrder: number;
  parentId?: string;
  isActive: boolean;
  usageContext?: string; // JSON array dei contesti di utilizzo
}

export interface MaterialTypeWithRelations extends MaterialTypeCore {
  parent?: MaterialTypeCore;
  children?: MaterialTypeCore[];
  _count?: {
    deliveries: number;
    children: number;
    inventories: number;
    processingInputs: number;
    processingOutputs: number;
  };
}

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
  usageContext?: string[];
}

export interface UpdateMaterialTypeData extends Partial<CreateMaterialTypeData> {
  isActive?: boolean;
}

export interface MaterialTypeFilters {
  includeInactive?: boolean;
  isParent?: boolean;
  usageContext?: string; // CONFERIMENTI, LAVORAZIONI_INPUT, LAVORAZIONI_OUTPUT, USCITE
  parentId?: string;
}

// ================================
// CONTESTI DI UTILIZZO
// ================================

export const USAGE_CONTEXTS = {
  CONFERIMENTI: 'CONFERIMENTI',
  LAVORAZIONI_INPUT: 'LAVORAZIONI_INPUT', 
  LAVORAZIONI_OUTPUT: 'LAVORAZIONI_OUTPUT',
  USCITE: 'USCITE',
  INVENTARIO: 'INVENTARIO',
} as const;

export type UsageContext = typeof USAGE_CONTEXTS[keyof typeof USAGE_CONTEXTS];

// ================================
// INCLUDE STANDARD
// ================================

const materialTypeInclude = {
  parent: true,
  children: {
    where: { isActive: true },
    orderBy: [
      { sortOrder: 'asc' as const },
      { name: 'asc' as const }
    ]
  },
  _count: {
    select: {
      deliveries: true,
      children: true,
      inventories: true,
      processingInputs: true,
      processingOutputs: true,
    }
  }
};

// ================================
// OPERAZIONI CRUD CENTRALIZZATE
// ================================

/**
 * Trova tutte le tipologie materiali con filtri
 */
export const findAllMaterialTypes = async (filters: MaterialTypeFilters = {}): Promise<MaterialTypeWithRelations[]> => {
  try {
    const where: Prisma.MaterialTypeWhereInput = {};
    
    // Filtro per stato attivo
    if (!filters.includeInactive) {
      where.isActive = true;
    }

    // Filtro per tipologie parent
    if (filters.isParent !== undefined) {
      where.parentId = filters.isParent ? null : { not: null };
    }

    // Filtro per parent specifico
    if (filters.parentId) {
      where.parentId = filters.parentId;
    }

    // Filtro per contesto di utilizzo
    if (filters.usageContext) {
      where.usageContext = {
        contains: filters.usageContext,
      };
    }

    const materialTypes = await prisma.materialType.findMany({
      where,
      include: materialTypeInclude,
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    return materialTypes as MaterialTypeWithRelations[];
  } catch (error) {
    console.error('Errore in findAllMaterialTypes:', error);
    throw new HttpException(500, 'Errore durante il recupero delle tipologie materiali');
  }
};

/**
 * Trova tipologie per contesto specifico
 */
export const findMaterialTypesByContext = async (context: UsageContext): Promise<MaterialTypeWithRelations[]> => {
  return findAllMaterialTypes({
    usageContext: context,
    includeInactive: false,
  });
};

/**
 * Trova tipologia per ID
 */
export const findMaterialTypeById = async (id: string): Promise<MaterialTypeWithRelations> => {
  try {
    const materialType = await prisma.materialType.findUnique({
      where: { id },
      include: materialTypeInclude,
    });

    if (!materialType) {
      throw new HttpException(404, 'Tipologia materiale non trovata');
    }

    return materialType as MaterialTypeWithRelations;
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    console.error('Errore in findMaterialTypeById:', error);
    throw new HttpException(500, 'Errore durante il recupero della tipologia materiale');
  }
};

/**
 * Trova tipologia per codice
 */
export const findMaterialTypeByCode = async (code: string): Promise<MaterialTypeWithRelations> => {
  try {
    const materialType = await prisma.materialType.findUnique({
      where: { code: code.toUpperCase() },
      include: materialTypeInclude,
    });

    if (!materialType) {
      throw new HttpException(404, `Tipologia materiale con codice "${code}" non trovata`);
    }

    return materialType as MaterialTypeWithRelations;
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    console.error('Errore in findMaterialTypeByCode:', error);
    throw new HttpException(500, 'Errore durante il recupero della tipologia materiale');
  }
};

/**
 * Crea nuova tipologia materiale
 */
export const createMaterialType = async (data: CreateMaterialTypeData): Promise<MaterialTypeWithRelations> => {
  try {
    // Validazione dati obbligatori
    if (!data.code || !data.name) {
      throw new HttpException(400, 'Codice e nome sono obbligatori');
    }

    // Verifica unicità codice
    const existingCode = await prisma.materialType.findUnique({
      where: { code: data.code.toUpperCase() }
    });

    if (existingCode) {
      throw new HttpException(400, 'Codice tipologia materiale già esistente');
    }

    // Verifica parent se fornito
    if (data.parentId) {
      const parent = await prisma.materialType.findUnique({
        where: { id: data.parentId }
      });

      if (!parent) {
        throw new HttpException(404, 'Tipologia materiale padre non trovata');
      }

      if (parent.parentId) {
        throw new HttpException(400, 'Impossibile creare più di due livelli di gerarchia');
      }
    }

    // Determina sortOrder se non fornito
    let sortOrder = data.sortOrder;
    if (sortOrder === undefined) {
      const maxSort = await prisma.materialType.aggregate({
        _max: { sortOrder: true },
        where: { parentId: data.parentId || null }
      });
      sortOrder = (maxSort._max.sortOrder || 0) + 10;
    }

    // Prepara contesti di utilizzo
    const usageContext = data.usageContext 
      ? JSON.stringify(data.usageContext)
      : JSON.stringify([USAGE_CONTEXTS.CONFERIMENTI, USAGE_CONTEXTS.INVENTARIO]);

    // Crea la tipologia
    const materialType = await prisma.materialType.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name.trim(),
        description: data.description?.trim(),
        unit: data.unit || 'kg',
        cerCode: data.cerCode?.trim(),
        reference: data.reference?.trim(),
        color: data.color || generateRandomColor(),
        sortOrder: sortOrder,
        parentId: data.parentId,
        usageContext: usageContext,
        isActive: true
      },
      include: materialTypeInclude,
    });

    console.log(`✅ Tipologia materiale creata: ${materialType.code} - ${materialType.name}`);
    return materialType as MaterialTypeWithRelations;
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    console.error('Errore in createMaterialType:', error);
    throw new HttpException(500, 'Errore durante la creazione della tipologia materiale');
  }
};

/**
 * Aggiorna tipologia materiale
 */
export const updateMaterialType = async (id: string, data: UpdateMaterialTypeData): Promise<MaterialTypeWithRelations> => {
  try {
    // Verifica esistenza
    const existing = await prisma.materialType.findUnique({
      where: { id },
      include: { children: true }
    });

    if (!existing) {
      throw new HttpException(404, 'Tipologia materiale non trovata');
    }

    // Verifica unicità codice se cambiato
    if (data.code && data.code.toUpperCase() !== existing.code) {
      const codeExists = await prisma.materialType.findUnique({
        where: { code: data.code.toUpperCase() }
      });

      if (codeExists) {
        throw new HttpException(400, 'Codice tipologia materiale già esistente');
      }
    }

    // Verifica parent se cambiato
    if (data.parentId && data.parentId !== existing.parentId) {
      const parent = await prisma.materialType.findUnique({
        where: { id: data.parentId }
      });

      if (!parent) {
        throw new HttpException(404, 'Tipologia materiale padre non trovata');
      }

      // Verifica loop
      if (parent.parentId === id) {
        throw new HttpException(400, 'Impossibile creare una relazione circolare');
      }

      if (parent.parentId) {
        throw new HttpException(400, 'Impossibile creare più di due livelli di gerarchia');
      }
    }

    // Se ha figli e si vuole assegnare un parent, blocca
    if (data.parentId && existing.children.length > 0) {
      throw new HttpException(400, 'Impossibile assegnare un parent a una tipologia che ha già dei figli');
    }

    // Prepara dati per l'update - usa any per evitare conflitti di tipo
    const updateData: any = { ...data };
    
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }
    
    // Converti usageContext array a JSON string per il database
    if (updateData.usageContext && Array.isArray(updateData.usageContext)) {
      updateData.usageContext = JSON.stringify(updateData.usageContext);
    }

    const materialType = await prisma.materialType.update({
      where: { id },
      data: updateData,
      include: materialTypeInclude,
    });

    console.log(`✅ Tipologia materiale aggiornata: ${materialType.code} - ${materialType.name}`);
    return materialType as MaterialTypeWithRelations;
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    console.error('Errore in updateMaterialType:', error);
    throw new HttpException(500, 'Errore durante l\'aggiornamento della tipologia materiale');
  }
};

/**
 * Elimina/Disattiva tipologia materiale
 */
export const deleteMaterialType = async (id: string) => {
  try {
    const materialType = await prisma.materialType.findUnique({
      where: { id },
      include: {
        children: true,
        _count: {
          select: {
            deliveries: true,
            inventories: true,
            processingInputs: true,
            processingOutputs: true,
          }
        }
      }
    });

    if (!materialType) {
      throw new HttpException(404, 'Tipologia materiale non trovata');
    }

    // Verifica figli attivi
    const activeChildren = materialType.children.filter(child => child.isActive);
    if (activeChildren.length > 0) {
      throw new HttpException(400, 'Impossibile eliminare: esistono sotto-tipologie attive associate');
    }

    // Se ha dati associati, disattiva invece di eliminare
    const hasAssociatedData = materialType._count.deliveries > 0 || 
                             materialType._count.inventories > 0 ||
                             materialType._count.processingInputs > 0 ||
                             materialType._count.processingOutputs > 0;

    if (hasAssociatedData) {
      const updated = await prisma.materialType.update({
        where: { id },
        data: { 
          isActive: false,
          description: (materialType.description || '') + ` [DISATTIVATO il ${new Date().toLocaleDateString('it-IT')}]`
        }
      });

      console.log(`🔒 Tipologia materiale disattivata: ${updated.code} - ${updated.name}`);
      return updated;
    } else {
      await prisma.materialType.delete({
        where: { id }
      });

      console.log(`🗑️ Tipologia materiale eliminata: ${materialType.code} - ${materialType.name}`);
      return { message: 'Tipologia materiale eliminata con successo' };
    }
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    console.error('Errore in deleteMaterialType:', error);
    throw new HttpException(500, 'Errore durante l\'eliminazione della tipologia materiale');
  }
};

// ================================
// FUNZIONI DI UTILITÀ
// ================================

/**
 * Ottieni struttura gerarchica completa
 */
export const getHierarchicalMaterialTypes = async (): Promise<MaterialTypeWithRelations[]> => {
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
                deliveries: true,
                inventories: true,
                processingInputs: true,
                processingOutputs: true,
              }
            }
          }
        },
        _count: {
          select: {
            deliveries: true,
            inventories: true,
            processingInputs: true,
            processingOutputs: true,
            children: true,
          }
        }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    return materialTypes as MaterialTypeWithRelations[];
  } catch (error) {
    console.error('Errore in getHierarchicalMaterialTypes:', error);
    throw new HttpException(500, 'Errore durante il recupero della struttura gerarchica');
  }
};

/**
 * Ottieni tipologie per dropdown/select
 */
export const getMaterialTypesForSelect = async (context?: UsageContext): Promise<Array<{
  id: string;
  code: string;
  name: string;
  unit: string;
  color?: string;
  parentName?: string;
}>> => {
  try {
    const filters: MaterialTypeFilters = { includeInactive: false };
    if (context) {
      filters.usageContext = context;
    }

    const materialTypes = await findAllMaterialTypes(filters);

    return materialTypes.map(mt => ({
      id: mt.id,
      code: mt.code,
      name: mt.name,
      unit: mt.unit,
      color: mt.color,
      parentName: mt.parent?.name,
    }));
  } catch (error) {
    console.error('Errore in getMaterialTypesForSelect:', error);
    throw new HttpException(500, 'Errore durante il recupero delle tipologie per select');
  }
};

/**
 * Sincronizza tipologie legacy con nuove tipologie
 */
export const syncLegacyMaterialTypes = async (): Promise<{
  created: number;
  updated: number;
  errors: string[];
}> => {
  const results = {
    created: 0,
    updated: 0,
    errors: [] as string[],
  };

  // Definizione tipologie standard per il sistema
  const standardMaterialTypes = [
    {
      code: 'MONO',
      name: 'Monomateriale Plastica',
      description: 'Imballaggi in plastica monomateriale',
      unit: 'kg',
      reference: 'COREPLA',
      color: '#2196F3',
      sortOrder: 10,
      usageContext: [USAGE_CONTEXTS.CONFERIMENTI, USAGE_CONTEXTS.LAVORAZIONI_INPUT, USAGE_CONTEXTS.INVENTARIO],
    },
    {
      code: 'MULTI',
      name: 'Multimateriale Plastica',
      description: 'Imballaggi in plastica multimateriale',
      unit: 'kg',
      reference: 'COREPLA',
      color: '#4CAF50',
      sortOrder: 20,
      usageContext: [USAGE_CONTEXTS.CONFERIMENTI, USAGE_CONTEXTS.LAVORAZIONI_INPUT, USAGE_CONTEXTS.INVENTARIO],
    },
    {
      code: 'OLIO',
      name: 'Contenitori Olio',
      description: 'Contenitori per olio alimentare',
      unit: 'kg',
      reference: 'COREPLA',
      color: '#FF9800',
      sortOrder: 30,
      usageContext: [USAGE_CONTEXTS.CONFERIMENTI, USAGE_CONTEXTS.LAVORAZIONI_INPUT, USAGE_CONTEXTS.INVENTARIO],
    },
    {
      code: 'PLASTICA',
      name: 'Plastica Generica',
      description: 'Materiali plastici generici',
      unit: 'kg',
      reference: 'COREPLA',
      color: '#9C27B0',
      sortOrder: 40,
      usageContext: [USAGE_CONTEXTS.CONFERIMENTI, USAGE_CONTEXTS.LAVORAZIONI_INPUT, USAGE_CONTEXTS.INVENTARIO],
      children: [
        {
          code: 'COREPET',
          name: 'PET - Coripet',
          description: 'Bottiglie PET per bevande',
          unit: 'kg',
          reference: 'CORIPET',
          color: '#00BCD4',
          sortOrder: 10,
        },
        {
          code: 'COREPLA_PET',
          name: 'PET - Corepla',
          description: 'Altri imballaggi PET',
          unit: 'kg',
          reference: 'COREPLA',
          color: '#009688',
          sortOrder: 20,
        }
      ]
    },
    {
      code: 'METALLI',
      name: 'Metalli',
      description: 'Imballaggi metallici',
      unit: 'kg',
      reference: 'RICREA',
      color: '#795548',
      sortOrder: 50,
      usageContext: [USAGE_CONTEXTS.CONFERIMENTI, USAGE_CONTEXTS.INVENTARIO],
    },
    {
      code: 'VETRO_SARCO',
      name: 'Vetro Sarcofago',
      description: 'Vetro da sarcofago rifiuti',
      unit: 'kg',
      reference: 'COREVE',
      color: '#607D8B',
      sortOrder: 60,
      usageContext: [USAGE_CONTEXTS.CONFERIMENTI, USAGE_CONTEXTS.INVENTARIO],
    },
    // Tipologie per output lavorazioni
    {
      code: 'BALLE_MONO',
      name: 'Balle Monomateriale',
      description: 'Balle prodotte da lavorazione monomateriale',
      unit: 'kg',
      reference: 'COREPLA',
      color: '#3F51B5',
      sortOrder: 100,
      usageContext: [USAGE_CONTEXTS.LAVORAZIONI_OUTPUT, USAGE_CONTEXTS.USCITE, USAGE_CONTEXTS.INVENTARIO],
    },
    {
      code: 'BALLE_MULTI',
      name: 'Balle Multimateriale',
      description: 'Balle prodotte da lavorazione multimateriale',
      unit: 'kg',
      reference: 'COREPLA',
      color: '#E91E63',
      sortOrder: 110,
      usageContext: [USAGE_CONTEXTS.LAVORAZIONI_OUTPUT, USAGE_CONTEXTS.USCITE, USAGE_CONTEXTS.INVENTARIO],
    },
    {
      code: 'SCARTI',
      name: 'Scarti di Lavorazione',
      description: 'Materiali di scarto dalla lavorazione',
      unit: 'kg',
      reference: 'SCARTO',
      color: '#F44336',
      sortOrder: 200,
      usageContext: [USAGE_CONTEXTS.LAVORAZIONI_OUTPUT],
    }
  ];

  try {
    console.log('🔄 Inizio sincronizzazione tipologie materiali standard...');

    for (const materialTypeData of standardMaterialTypes) {
      try {
        // Verifica se esiste già
        const existing = await prisma.materialType.findUnique({
          where: { code: materialTypeData.code }
        });

        if (existing) {
          // Aggiorna se necessario
          const needsUpdate = 
            existing.name !== materialTypeData.name ||
            existing.description !== materialTypeData.description ||
            existing.usageContext !== JSON.stringify(materialTypeData.usageContext);

          if (needsUpdate) {
            await updateMaterialType(existing.id, {
              name: materialTypeData.name,
              description: materialTypeData.description,
              unit: materialTypeData.unit,
              reference: materialTypeData.reference,
              color: materialTypeData.color,
              sortOrder: materialTypeData.sortOrder,
              usageContext: materialTypeData.usageContext,
            });
            results.updated++;
            console.log(`✅ Aggiornato: ${materialTypeData.code}`);
          }
        } else {
          // Crea nuovo
          await createMaterialType({
            code: materialTypeData.code,
            name: materialTypeData.name,
            description: materialTypeData.description,
            unit: materialTypeData.unit || 'kg',
            reference: materialTypeData.reference,
            color: materialTypeData.color,
            sortOrder: materialTypeData.sortOrder,
            usageContext: materialTypeData.usageContext,
          });
          results.created++;
          console.log(`🆕 Creato: ${materialTypeData.code}`);
        }

        // Gestisci figli se presenti
        if (materialTypeData.children) {
          const parent = await findMaterialTypeByCode(materialTypeData.code);
          
          for (const childData of materialTypeData.children) {
            try {
              const existingChild = await prisma.materialType.findUnique({
                where: { code: childData.code }
              });

              if (!existingChild) {
                await createMaterialType({
                  ...childData,
                  parentId: parent.id,
                  usageContext: materialTypeData.usageContext, // Eredita dal parent
                });
                results.created++;
                console.log(`🆕 Creato figlio: ${childData.code}`);
              }
            } catch (error) {
              const errorMsg = `Errore creazione figlio ${childData.code}: ${error instanceof Error ? error.message : 'Unknown'}`;
              results.errors.push(errorMsg);
              console.error(`❌ ${errorMsg}`);
            }
          }
        }

      } catch (error) {
        const errorMsg = `Errore sincronizzazione ${materialTypeData.code}: ${error instanceof Error ? error.message : 'Unknown'}`;
        results.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log(`✅ Sincronizzazione completata: ${results.created} creati, ${results.updated} aggiornati, ${results.errors.length} errori`);
    return results;

  } catch (error) {
    console.error('Errore in syncLegacyMaterialTypes:', error);
    throw new HttpException(500, 'Errore durante la sincronizzazione delle tipologie materiali');
  }
};

/**
 * Valida compatibilità di un materiale per un contesto
 */
export const validateMaterialTypeForContext = async (
  materialTypeId: string, 
  context: UsageContext
): Promise<boolean> => {
  try {
    const materialType = await findMaterialTypeById(materialTypeId);
    
    if (!materialType.usageContext) {
      return true; // Se non specificato, assume compatibile
    }

    const contexts = JSON.parse(materialType.usageContext) as string[];
    return contexts.includes(context);
  } catch (error) {
    console.error('Errore in validateMaterialTypeForContext:', error);
    return false;
  }
};

/**
 * Genera colore casuale per nuove tipologie
 */
function generateRandomColor(): string {
  const colors = [
    '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336',
    '#00BCD4', '#FFEB3B', '#795548', '#607D8B', '#E91E63',
    '#3F51B5', '#009688', '#FF5722', '#8BC34A', '#FFC107'
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

// ================================
// EXPORT DELLE FUNZIONI PRINCIPALI
// ================================

export const materialTypesService = {
  // Operazioni CRUD
  findAll: findAllMaterialTypes,
  findById: findMaterialTypeById,
  findByCode: findMaterialTypeByCode,
  create: createMaterialType,
  update: updateMaterialType,
  delete: deleteMaterialType,
  
  // Funzioni specializzate
  findByContext: findMaterialTypesByContext,
  getHierarchy: getHierarchicalMaterialTypes,
  getForSelect: getMaterialTypesForSelect,
  
  // Utilità
  syncLegacy: syncLegacyMaterialTypes,
  validateForContext: validateMaterialTypeForContext,
  
  // Costanti
  USAGE_CONTEXTS,
};