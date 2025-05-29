import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { errorHandler } from './core/middleware/error.middleware';
import { setupRoutes } from './core/setup/routes';

// Carica le variabili d'ambiente
dotenv.config();

// Crea l'applicazione Express
const app = express();
const port = Number(process.env.PORT) || 4000; // Converti in numero
const apiPrefix = process.env.API_PREFIX || '/api';
const host = process.env.HOST || '0.0.0.0'; // Ascolta su tutte le interfacce

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
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { logNetworkInfo } = require('./core/utils/network.utils');
  
  app.listen(port, host, () => {
    logNetworkInfo(port, apiPrefix);
  });
}

export default app;