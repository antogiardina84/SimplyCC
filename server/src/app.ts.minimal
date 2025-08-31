import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 4000;
const host = process.env.HOST || '0.0.0.0';

// CORS permissivo per sviluppo
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API status
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'OK', 
    database: 'Connected',
    message: 'Sistema di Gestione Rifiuti - Server Attivo'
  });
});

// Catch-all
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Endpoint non trovato',
    path: req.originalUrl 
  });
});

const server = app.listen(port, host, () => {
  console.log(`🚀 Server in ascolto su http://${host}:${port}`);
  console.log(`📊 Health check: http://${host}:${port}/health`);
  console.log(`🔍 API Status: http://${host}:${port}/api/status`);
});

export default app;
