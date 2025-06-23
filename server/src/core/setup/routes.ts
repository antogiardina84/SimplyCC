// server/src/core/setup/routes.ts - VERSIONE CORRETTA

import { Express } from 'express';

// Import delle routes esistenti
import { authRoutes } from '../../modules/auth/routes';
import { userRoutes } from '../../modules/users/routes';
import { clientRoutes } from '../../modules/clients/routes';
import { basinRoutes } from '../../modules/basins/routes';
import { pickupOrderRoutes } from '../../modules/pickupOrders/routes';
import { shipmentRoutes } from '../../modules/shipments/routes';
import { logisticsRoutes } from '../../modules/shipments/routes/logistics.routes';
import { dashboardRoutes } from '../../modules/dashboard/routes';

// CORRETTO: Import delle routes per conferimenti
import { deliveriesRoutes } from '../../modules/deliveries/routes';

export const setupRoutes = (app: Express, apiPrefix: string): void => {
  console.log('🚀 Setting up routes with prefix:', apiPrefix);

  // Health check
  app.get(`${apiPrefix}/health`, (req, res) => {
    res.status(200).json({ 
      status: 'UP', 
      timestamp: new Date(),
      version: '1.0.0',
      modules: [
        'auth', 'users', 'clients', 'basins',
        'pickup-orders', 'shipments', 'logistics',
        'dashboard', 'deliveries'
      ]
    });
  });

  // ================================
  // CORE ROUTES
  // ================================
  
  console.log('📝 Setting up auth routes...');
  app.use(`${apiPrefix}/auth`, authRoutes);
  
  console.log('👥 Setting up user routes...');
  app.use(`${apiPrefix}/users`, userRoutes);
  
  // ================================
  // BUSINESS ROUTES
  // ================================
  
  console.log('🏢 Setting up client routes...');
  app.use(`${apiPrefix}/clients`, clientRoutes);
  
  console.log('🗂️ Setting up basin routes...');
  app.use(`${apiPrefix}/basins`, basinRoutes);
  
  console.log('📋 Setting up pickup order routes...');
  app.use(`${apiPrefix}/pickup-orders`, pickupOrderRoutes);
  
  console.log('🚚 Setting up shipment routes...');
  app.use(`${apiPrefix}/shipments`, shipmentRoutes);
  
  console.log('🏭 Setting up logistics routes...');
  app.use(`${apiPrefix}/logistics`, logisticsRoutes);
  
  console.log('📊 Setting up dashboard routes...');
  app.use(`${apiPrefix}/dashboard`, dashboardRoutes);
  
  // ================================
  // DELIVERIES ROUTES - CORRETTO
  // ================================
  
  console.log('📦 Setting up deliveries routes...');
  // IMPORTANTE: Questo monta tutte le routes dei conferimenti con il prefisso API
  // Le routes in deliveriesRoutes sono già definite con i loro path specifici
  app.use(`${apiPrefix}`, deliveriesRoutes);
  
  // Questo significa che:
  // - /api/deliveries -> deliveriesController.getAllDeliveries
  // - /api/contributors -> deliveriesController.getAllContributors  
  // - /api/material-types -> deliveriesController.getAllMaterialTypes
  // - /api/calendar/:year/:month -> deliveriesController.getMonthlyCalendar
  // - /api/calendar/day/:date -> deliveriesController.getDayDeliveries
  
  // ================================
  // API INFO ENDPOINT
  // ================================
  
  app.get(`${apiPrefix}/info`, (req, res) => {
    res.status(200).json({
      title: 'Sistema Gestione Rifiuti API',
      version: '1.0.0',
      description: 'API per la gestione automatizzata dei processi di raccolta e smaltimento rifiuti secondo allegato tecnico ANCI-COREPLA',
      endpoints: {
        // Core endpoints
        auth: {
          base: `${apiPrefix}/auth`,
          description: 'Autenticazione e autorizzazione',
          routes: ['POST /login', 'POST /refresh', 'POST /logout']
        },
        users: {
          base: `${apiPrefix}/users`,
          description: 'Gestione utenti del sistema',
          routes: ['GET /', 'GET /:id', 'POST /', 'PUT /:id', 'DELETE /:id']
        },
        clients: {
          base: `${apiPrefix}/clients`,
          description: 'Gestione clienti e fornitori',
          routes: ['GET /', 'GET /:id', 'POST /', 'PUT /:id', 'DELETE /:id']
        },
        basins: {
          base: `${apiPrefix}/basins`,
          description: 'Gestione bacini di raccolta',
          routes: ['GET /', 'GET /:id', 'POST /', 'PUT /:id', 'DELETE /:id']
        },
        pickupOrders: {
          base: `${apiPrefix}/pickup-orders`,
          description: 'Gestione buoni di ritiro e workflow',
          routes: ['GET /', 'GET /:id', 'POST /', 'PUT /:id', 'DELETE /:id']
        },
        shipments: {
          base: `${apiPrefix}/shipments`,
          description: 'Gestione spedizioni e calendario operativo',
          routes: ['GET /', 'GET /:id', 'POST /', 'PUT /:id', 'DELETE /:id']
        },
        logistics: {
          base: `${apiPrefix}/logistics`,
          description: 'Gestione entità logistiche (mittenti, destinatari, trasportatori)',
          routes: [
            'GET / - Lista entità con filtri',
            'GET /type/:type - Entità per tipo (SENDER/RECIPIENT/TRANSPORTER)',
            'GET /stats - Statistiche entità',
            'GET /suggestions?q=term&type=SENDER - Suggerimenti autocomplete',
            'GET /search-ocr?search=term&type=SENDER - Ricerca per OCR',
            'GET /:id - Dettaglio entità',
            'POST / - Crea entità',
            'PUT /:id - Aggiorna entità',
            'DELETE /:id - Disattiva entità',
            'PATCH /:id/reactivate - Riattiva entità'
          ]
        },
        dashboard: {
          base: `${apiPrefix}/dashboard`,
          description: 'Dashboard e KPI principali',
          routes: ['GET /stats', 'GET /kpi', 'GET /charts']
        },
        
        // ================================
        // DELIVERIES ENDPOINTS - CORRETTI
        // ================================
        
        deliveries: {
          base: `${apiPrefix}/deliveries`,
          description: 'Gestione conferimenti giornalieri',
          routes: [
            'GET / - Lista conferimenti con filtri',
            'GET /:id - Dettaglio conferimento',
            'POST / - Crea nuovo conferimento',
            'PUT /:id - Modifica conferimento',
            'DELETE /:id - Elimina conferimento',
            'PATCH /:id/validate - Valida conferimento'
          ]
        },
        contributors: {
          base: `${apiPrefix}/contributors`,
          description: 'Gestione conferitori/fornitori',
          routes: [
            'GET / - Lista conferitori con filtri',
            'GET /:id - Dettaglio conferitore',
            'GET /by-material/:code - Conferitori per tipologia',
            'GET /:id/statistics - Statistiche conferitore',
            'POST / - Crea nuovo conferitore',
            'PUT /:id - Modifica conferitore',
            'DELETE /:id - Elimina conferitore'
          ]
        },
        materialTypes: {
          base: `${apiPrefix}/material-types`,
          description: 'Gestione tipologie materiali',
          routes: [
            'GET / - Lista tipologie',
            'GET /hierarchy - Struttura gerarchica',
            'GET /:id - Dettaglio tipologia',
            'GET /code/:code - Tipologia per codice',
            'GET /:id/statistics - Statistiche tipologia',
            'POST / - Crea tipologia',
            'PUT /:id - Modifica tipologia',
            'DELETE /:id - Elimina tipologia'
          ]
        },
        calendar: {
          base: `${apiPrefix}/calendar`,
          description: 'Calendario conferimenti',
          routes: [
            'GET /:year/:month - Dati calendario mensile',
            'GET /day/:date - Conferimenti del giorno (YYYY-MM-DD)'
          ]
        }
      },
      
      // ================================
      // WORKFLOW DOCUMENTATION
      // ================================
      
      workflow: {
        pickupOrderStates: [
          'DA_EVADERE - Ordine inserito, in attesa di programmazione',
          'PROGRAMMATO - Trasportatore assegnato, data ritiro confermata',
          'IN_EVASIONE - In corso di evasione',
          'IN_CARICO - Materiale in fase di carico',
          'CARICATO - Materiale caricato, documentazione completata',
          'SPEDITO - In viaggio verso destinazione',
          'COMPLETO - Peso a destino confermato, pronto per fatturazione'
        ],
        logisticEntityTypes: [
          'SENDER - Mittenti/Fornitori logistici',
          'RECIPIENT - Destinatari/Clienti logistici',
          'TRANSPORTER - Trasportatori/Vettori'
        ],
        materialTypes: [
          'MONO - Monomateriale plastica',
          'MULTI - Multimateriale leggero',
          'OLIO - Oli esausti',
          'PLASTICA - Materiali plastici vari',
          'METALLI - Materiali metallici',
          'VETRO_SARCO - Vetro e assimilati',
          'CARTA - Carta e cartone',
          'ORGANICO - Frazione organica'
        ],
        deliveryQualities: [
          'OTTIMA - Materiale di alta qualità',
          'BUONA - Materiale di buona qualità',
          'SCARSA - Materiale di qualità inferiore',
          'CONTAMINATO - Materiale contaminato'
        ]
      },
      
      // ================================
      // ROLES AND PERMISSIONS
      // ================================
      
      roles: {
        USER: 'Utente base - Solo lettura',
        OPERATOR: 'Operatore - Gestione carico e documentazione',
        MANAGER: 'Manager - Gestione completa workflow',
        ADMIN: 'Amministratore - Accesso completo sistema'
      },
      
      // ================================
      // TECHNICAL INFO
      // ================================
      
      technical: {
        apiVersion: '1.0.0',
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
        database: 'PostgreSQL with Prisma ORM',
        authentication: 'JWT Bearer tokens',
        fileUploads: 'Multipart form data',
        rateLimit: '100 requests per minute per IP',
        cors: 'Enabled for frontend domains'
      }
    });
  });
  
  // ================================
  // ERROR HANDLING
  // ================================
  
  // 404 - Route not found
  app.use('*', (req, res) => {
    res.status(404).json({ 
      message: 'Endpoint non trovato',
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
      availableEndpoints: [
        `${apiPrefix}/health`,
        `${apiPrefix}/info`,
        `${apiPrefix}/auth`,
        `${apiPrefix}/users`,
        `${apiPrefix}/clients`,
        `${apiPrefix}/basins`,
        `${apiPrefix}/pickup-orders`,
        `${apiPrefix}/shipments`,
        `${apiPrefix}/logistics`,
        `${apiPrefix}/dashboard`,
        `${apiPrefix}/deliveries`,
        `${apiPrefix}/contributors`,
        `${apiPrefix}/material-types`,
        `${apiPrefix}/calendar`
      ],
      suggestion: `Controllare la documentazione API all'endpoint ${apiPrefix}/info`
    });
  });
  
  console.log('✅ All routes configured successfully!');
};