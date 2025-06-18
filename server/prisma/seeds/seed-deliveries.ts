// server/prisma/seed-deliveries.ts - Script per seed data minimo

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDeliveries() {
  try {
    console.log('🌱 Seeding basic data for deliveries module...');

    // 1. Crea tipologie materiali base se non esistono
    const materialTypes = [
      {
        code: 'MONO',
        name: 'Monomateriale Plastica',
        description: 'Imballaggi in plastica monomateriale',
        unit: 'kg',
        color: '#4CAF50',
        reference: 'COREPLA',
        sortOrder: 1
      },
      {
        code: 'MULTI',
        name: 'Multimateriale',
        description: 'Imballaggi multimateriale',
        unit: 'kg',
        color: '#FF9800',
        reference: 'COREPLA',
        sortOrder: 2
      },
      {
        code: 'OLIO',
        name: 'Oli Esausti',
        description: 'Oli vegetali e minerali esausti',
        unit: 'kg',
        color: '#795548',
        reference: 'COOU',
        sortOrder: 3
      },
      {
        code: 'PLASTICA',
        name: 'Materiali Plastici',
        description: 'Materiali plastici vari',
        unit: 'kg',
        color: '#2196F3',
        reference: 'COREPLA',
        sortOrder: 4
      },
      {
        code: 'PET',
        name: 'Bottiglie PET',
        description: 'Bottiglie in PET',
        unit: 'kg',
        color: '#00BCD4',
        reference: 'CORIPET',
        sortOrder: 5,
        parentId: null // Sarà collegato a PLASTICA dopo
      }
    ];

    for (const materialType of materialTypes) {
      await prisma.materialType.upsert({
        where: { code: materialType.code },
        update: {},
        create: materialType
      });
      console.log(`✅ Material type: ${materialType.code} - ${materialType.name}`);
    }

    // 2. Collega PET come figlio di PLASTICA
    const plasticaType = await prisma.materialType.findUnique({ where: { code: 'PLASTICA' } });
    const petType = await prisma.materialType.findUnique({ where: { code: 'PET' } });
    
    if (plasticaType && petType) {
      await prisma.materialType.update({
        where: { id: petType.id },
        data: { parentId: plasticaType.id }
      });
      console.log('✅ Connected PET as child of PLASTICA');
    }

    // 3. Crea un cliente di test se non esiste
    let testClient = await prisma.client.findFirst({
      where: { name: { contains: 'Test' } }
    });

    if (!testClient) {
      testClient = await prisma.client.create({
        data: {
          name: 'Cliente Test',
          vatNumber: 'IT12345678901',
          address: 'Via Test 123',
          city: 'Città Test',
          province: 'TS',
          zipCode: '12345',
          email: 'test@test.com'
        }
      });
      console.log(`✅ Test client created: ${testClient.name}`);
    }

    // 4. Crea un bacino di test se non esiste
    let testBasin = await prisma.basin.findFirst({
      where: { code: { contains: 'TEST' } }
    });

    if (!testBasin) {
      testBasin = await prisma.basin.create({
        data: {
          code: 'TEST001',
          description: 'Bacino Test',
          flowType: 'A',
          clientId: testClient.id
        }
      });
      console.log(`✅ Test basin created: ${testBasin.code}`);
    }

    // 5. Crea un conferitore di test se non esiste
    let testContributor = await prisma.contributor.findFirst({
      where: { name: { contains: 'Test' } }
    });

    if (!testContributor) {
      testContributor = await prisma.contributor.create({
        data: {
          name: 'Conferitore Test',
          vatNumber: 'IT98765432109',
          address: 'Via Conferitore 456',
          city: 'Città Test',
          province: 'TS',
          zipCode: '12345',
          phone: '+39 123 456 7890',
          email: 'conferitore@test.com',
          basinId: testBasin.id,
          authorizedMaterialTypes: JSON.stringify(['MONO', 'MULTI', 'PLASTICA']),
          isActive: true,
          notes: 'Conferitore di test creato automaticamente'
        }
      });
      console.log(`✅ Test contributor created: ${testContributor.name}`);
    }

    // 6. Crea alcuni conferimenti di esempio
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const monoType = await prisma.materialType.findUnique({ where: { code: 'MONO' } });
    const multiType = await prisma.materialType.findUnique({ where: { code: 'MULTI' } });

    if (monoType && testContributor) {
      // Conferimento di ieri
      await prisma.delivery.upsert({
        where: {
          date_contributorId_materialTypeId: {
            date: yesterday,
            contributorId: testContributor.id,
            materialTypeId: monoType.id
          }
        },
        update: {},
        create: {
          date: yesterday,
          contributorId: testContributor.id,
          materialTypeId: monoType.id,
          basinId: testBasin.id,
          weight: 150.5,
          unit: 'kg',
          quality: 'BUONA',
          notes: 'Conferimento di test automatico',
          isValidated: true
        }
      });
      console.log('✅ Test delivery created for yesterday (MONO)');
    }

    if (multiType && testContributor) {
      // Conferimento di oggi
      await prisma.delivery.upsert({
        where: {
          date_contributorId_materialTypeId: {
            date: today,
            contributorId: testContributor.id,
            materialTypeId: multiType.id
          }
        },
        update: {},
        create: {
          date: today,
          contributorId: testContributor.id,
          materialTypeId: multiType.id,
          basinId: testBasin.id,
          weight: 89.3,
          unit: 'kg',
          quality: 'OTTIMA',
          notes: 'Conferimento di test automatico - oggi',
          isValidated: false
        }
      });
      console.log('✅ Test delivery created for today (MULTI)');
    }

    console.log('🎉 Seed completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui solo se chiamato direttamente
if (require.main === module) {
  seedDeliveries()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

export { seedDeliveries };