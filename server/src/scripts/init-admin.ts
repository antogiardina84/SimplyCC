// server/src/scripts/init-admin.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@sistema-rifiuti.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

  try {
    // Controlla se l'admin esiste già
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Crea l'utente admin
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        firstName: 'Amministratore',
        lastName: 'Sistema',
        role: 'ADMIN',
      },
    });

    console.log('Admin user created successfully:', admin.email);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();