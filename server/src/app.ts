import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { errorHandler } from './core/middleware/error.middleware';
import { logger } from './core/config/logger';
import { setupRoutes } from './core/setup/routes';

// Carica le variabili d'ambiente
dotenv.config();

// Crea l'applicazione Express
const app = express();
const port = process.env.PORT || 4000;
const apiPrefix = process.env.API_PREFIX || '/api';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Setup delle routes
setupRoutes(app, apiPrefix);

// Middleware di gestione errori
app.use(errorHandler);

// Avvia il server
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    logger.info(`Server in esecuzione su http://localhost:${port}${apiPrefix}`);
  });
}

export default app;