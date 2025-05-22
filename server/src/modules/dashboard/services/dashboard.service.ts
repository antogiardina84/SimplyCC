// server/src/modules/dashboard/services/dashboard.service.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface DashboardStats {
  totalUsers: number;
  totalClients: number;
  totalBasins: number;
  totalPickupOrders: number;
  pendingOrders: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const stats: DashboardStats = {
    totalUsers: 0,
    totalClients: 0,
    totalBasins: 0,
    totalPickupOrders: 0,
    pendingOrders: 0
  };

  try {
    // Users
    try {
      stats.totalUsers = await prisma.user.count();
    } catch (error) {
      console.warn('Could not count users:', error);
    }

    // Clients
    try {
      stats.totalClients = await prisma.client.count();
    } catch (error) {
      console.warn('Could not count clients:', error);
    }

    // Basins
    try {
      stats.totalBasins = await prisma.basin.count();
    } catch (error) {
      console.warn('Could not count basins:', error);
    }

    // PickupOrders - Solo se la tabella esiste
    try {
      // Verifica se il modello esiste
      if (prisma.pickupOrder) {
        stats.totalPickupOrders = await prisma.pickupOrder.count();
        stats.pendingOrders = await prisma.pickupOrder.count({
          where: {
            status: 'PENDING'
          }
        });
      }
    } catch (error) {
      console.warn('Could not count pickup orders (table might not exist yet):', error);
    }

    return stats;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return stats;
  }
};