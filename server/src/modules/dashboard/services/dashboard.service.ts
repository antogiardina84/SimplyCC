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
  try {
    // Controlla se le tabelle esistono prima di fare le query
    const [
      totalUsers,
      totalClients,
      totalBasins,
      totalPickupOrders,
      pendingOrders
    ] = await Promise.all([
      prisma.user.count(),
      prisma.client.count(),
      prisma.basin.count(),
      // Gestisci il caso in cui PickupOrder non esista ancora
      prisma.pickupOrder?.count().catch(() => 0) || Promise.resolve(0),
      prisma.pickupOrder?.count({
        where: {
          status: 'PENDING'
        }
      }).catch(() => 0) || Promise.resolve(0)
    ]);

    return {
      totalUsers,
      totalClients,
      totalBasins,
      totalPickupOrders,
      pendingOrders
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Ritorna valori di default in caso di errore
    return {
      totalUsers: 0,
      totalClients: 0,
      totalBasins: 0,
      totalPickupOrders: 0,
      pendingOrders: 0
    };
  }
};