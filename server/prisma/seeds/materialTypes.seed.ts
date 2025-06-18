// server/prisma/seeds/materialTypes.seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const seedMaterialTypes = async () => {
  console.log('🌱 Seeding Material Types...');

  try {
    // Elimina tutte le tipologie esistenti per ricominciare da capo
    await prisma.materialType.deleteMany({});

    // Tipologie principali
    const materialTypes = [
      {
        code: 'MONO',
        name: 'Monomateriale',
        description: 'Raccolta monomateriale plastica',
        unit: 'kg',
        cerCode: '150106',
        reference: 'COREPLA',
        color: '#4CAF50',
        sortOrder: 1
      },
      {
        code: 'MULTI',
        name: 'Multimateriale',
        description: 'Raccolta multimateriale (plastica + metalli)',
        unit: 'kg',
        cerCode: '150106',
        reference: 'COREPLA',
        color: '#2196F3',
        sortOrder: 2
      },
      {
        code: 'OLIO',
        name: 'Oli Esausti',
        description: 'Oli vegetali e minerali esausti',
        unit: 'kg',
        cerCode: '200125',
        reference: 'CONOE',
        color: '#FF9800',
        sortOrder: 3
      },
      {
        code: 'PLASTICA',
        name: 'Plastica',
        description: 'Materiali plastici vari',
        unit: 'kg',
        cerCode: '150102',
        reference: 'COREPLA',
        color: '#9C27B0',
        sortOrder: 4
      },
      {
        code: 'METALLI',
        name: 'Metalli',
        description: 'Materiali metallici',
        unit: 'kg',
        cerCode: '150104',
        reference: 'CIAL',
        color: '#607D8B',
        sortOrder: 5
      },
      {
        code: 'VETRO_SARCO',
        name: 'Vetro/Sarco',
        description: 'Vetro e materiali assimilati',
        unit: 'kg',
        cerCode: '150107',
        reference: 'COREVE',
        color: '#00BCD4',
        sortOrder: 6
      }
    ];

    // Crea le tipologie principali
    const createdTypes = await Promise.all(
      materialTypes.map(type => 
        prisma.materialType.create({
          data: type
        })
      )
    );

    // Trova la tipologia PLASTICA per creare sottocategorie
    const plasticaType = createdTypes.find(type => type.code === 'PLASTICA');

    if (plasticaType) {
      // Sottocategorie per PLASTICA
      const plasticSubtypes = [
        {
          code: 'COREPET',
          name: 'COREPET',
          description: 'Bottiglie in PET',
          unit: 'kg',
          cerCode: '150102',
          reference: 'COREPET',
          color: '#E91E63',
          sortOrder: 1,
          parentId: plasticaType.id
        },
        {
          code: 'PET_COLORATE',
          name: 'PET Colorate',
          description: 'Bottiglie PET colorate',
          unit: 'kg',
          cerCode: '150102',
          reference: 'COREPET',
          color: '#F44336',
          sortOrder: 2,
          parentId: plasticaType.id
        },
        {
          code: 'FILM_PLASTICO',
          name: 'Film Plastico',
          description: 'Film e sacchetti plastici',
          unit: 'kg',
          cerCode: '150102',
          reference: 'COREPLA',
          color: '#673AB7',
          sortOrder: 3,
          parentId: plasticaType.id
        }
      ];

      await Promise.all(
        plasticSubtypes.map(subtype => 
          prisma.materialType.create({
            data: subtype
          })
        )
      );
    }

    // Trova la tipologia OLIO per creare sottocategorie
    const olioType = createdTypes.find(type => type.code === 'OLIO');

    if (olioType) {
      // Sottocategorie per OLIO
      const olioSubtypes = [
        {
          code: 'OLIO_VEGETALE',
          name: 'Olio Vegetale',
          description: 'Oli vegetali esausti da cottura',
          unit: 'kg',
          cerCode: '200125',
          reference: 'CONOE',
          color: '#FFC107',
          sortOrder: 1,
          parentId: olioType.id
        },
        {
          code: 'OLIO_MINERALE',
          name: 'Olio Minerale',
          description: 'Oli minerali e lubrificanti esausti',
          unit: 'kg',
          cerCode: '130205',
          reference: 'CONOE',
          color: '#795548',
          sortOrder: 2,
          parentId: olioType.id
        }
      ];

      await Promise.all(
        olioSubtypes.map(subtype => 
          prisma.materialType.create({
            data: subtype
          })
        )
      );
    }

    console.log('✅ Material Types seeding completed');

    // Mostra un riassunto delle tipologie create
    const allTypes = await prisma.materialType.findMany({
      include: {
        children: true,
        parent: true
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    console.log('\n📊 Tipologie create:');
    allTypes.forEach(type => {
      const indent = type.parentId ? '  └─ ' : '';
      const childrenCount = type.children.length > 0 ? ` (${type.children.length} sottocategorie)` : '';
      console.log(`${indent}${type.code} - ${type.name}${childrenCount}`);
    });

    return allTypes;

  } catch (error) {
    console.error('❌ Error seeding material types:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

// Esecuzione diretta per testing
export default seedMaterialTypes;