import { Express } from 'express';
import { authRoutes } from '../../modules/auth/routes';
import { userRoutes } from '../../modules/users/routes';

export const setupRoutes = (app: Express, apiPrefix: string): void => {
  // Health check
  app.get(`${apiPrefix}/health`, (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date() });
  });

  // API Routes
  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/users`, userRoutes);
  
  // 404 - Route not found
  app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });
};