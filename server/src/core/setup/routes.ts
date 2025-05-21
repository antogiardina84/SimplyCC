// server/src/core/setup/routes.ts

import { Express } from 'express';
import { authRoutes } from '../../modules/auth/routes';
import { userRoutes } from '../../modules/users/routes';
import { clientRoutes } from '../../modules/clients/routes';
import { basinRoutes } from '../../modules/basins/routes';
import { pickupOrderRoutes } from '../../modules/pickupOrders/routes';

export const setupRoutes = (app: Express, apiPrefix: string): void => {
  // Health check
  app.get(`${apiPrefix}/health`, (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date() });
  });

  // API Routes
  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/users`, userRoutes);
  app.use(`${apiPrefix}/clients`, clientRoutes);
  app.use(`${apiPrefix}/basins`, basinRoutes);
  app.use(`${apiPrefix}/pickup-orders`, pickupOrderRoutes);
  
  // 404 - Route not found
  app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });
};