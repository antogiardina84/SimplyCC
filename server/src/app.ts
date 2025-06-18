// server/src/app.ts - VERSIONE CORRETTA COMPLETA

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
const port = Number(process.env.PORT) || 4000;
const apiPrefix = process.env.API_PREFIX || '/api';
const host = process.env.HOST || '0.0.0.0';

// Configurazione CORS più specifica per produzione
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'http://localhost:3000'
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware di sicurezza
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors(corsOptions));

// Parsing del body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging delle richieste
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Trust proxy se dietro a reverse proxy (nginx, etc.)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Endpoint per verificare la connessione al database
app.get('/api/status', async (req, res) => {
  try {
    // Importa Prisma solo quando necessario per evitare errori di inizializzazione
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Test della connessione al database
    await prisma.$connect();
    await prisma.$disconnect();
    
    res.status(200).json({
      status: 'OK',
      database: 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {  // ✅ FIX: Tipo esplicito per error
    console.error('Database connection error:', error);
    
    // ✅ FIX: Gestione sicura del tipo di errore
    const errorMessage = error instanceof Error ? error.message : 'Database connection failed';
    
    res.status(503).json({
      status: 'Error',
      database: 'Disconnected',
      error: process.env.NODE_ENV === 'development' ? errorMessage : 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Setup delle routes
setupRoutes(app, apiPrefix);

// Gestione 404 per routes non trovate
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Endpoint non trovato',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Middleware di gestione errori (deve essere l'ultimo)
app.use(errorHandler);

// Gestione graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM ricevuto, chiusura graceful del server...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT ricevuto, chiusura graceful del server...');
  process.exit(0);
});

// Gestione errori non catturati
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Avvia il server
if (process.env.NODE_ENV !== 'test') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { logNetworkInfo } = require('./core/utils/network.utils');
  
  const server = app.listen(port, host, () => {
    logNetworkInfo(port, apiPrefix);
  });

  // Timeout per le richieste (30 secondi)
  server.timeout = 30000;

  // Gestione errori del server
  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

    switch (error.code) {
      case 'EACCES':
        console.error(`❌ ${bind} richiede privilegi elevati`);
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(`❌ ${bind} è già in uso`);
        process.exit(1);
        break;
      default:
        throw error;
    }
  });
}

export default app;