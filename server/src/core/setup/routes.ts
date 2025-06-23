// server/src/core/setup/routes.ts - VERSIONE COMPLETA E CORRETTA

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

// AGGIUNTO: Import delle routes per conferimenti
import { deliveriesRoutes } from '../../modules/deliveries/routes';

export const setupRoutes = (app: Express, apiPrefix: string): void => {
  console.log('🚀 Setting up routes with prefix:', apiPrefix);

  // ================================
  // HEALTH CHECK
  // ================================
  
  app.get(`${apiPrefix}/health`, (req, res) => {
    res.status(200).json({ 
      status: 'UP', 
      timestamp: new Date(),
      version: '1.0.0',
      modules: [
        'auth', 'users', 'clients', 'basins',
        'pickup-orders', 'shipments', 'logistics',
        'dashboard', 'deliveries', 'contributors',
        'material-types', 'calendar'
      ]
    });
  });

  // ================================
  // CORE AUTHENTICATION ROUTES
  // ================================
  
  console.log('📝 Setting up auth routes...');
  app.use(`${apiPrefix}/auth`, authRoutes);
  
  console.log('👥 Setting up user routes...');
  app.use(`${apiPrefix}/users`, userRoutes);
  
  // ================================
  // BUSINESS ENTITY ROUTES
  // ================================
  
  console.log('🏢 Setting up client routes...');
  app.use(`${apiPrefix}/clients`, clientRoutes);
  
  console.log('🗂️ Setting up basin routes...');
  app.use(`${apiPrefix}/basins`, basinRoutes);
  
  // ================================
  // OPERATIONAL WORKFLOW ROUTES
  // ================================
  
  console.log('📋 Setting up pickup order routes...');
  app.use(`${apiPrefix}/pickup-orders`, pickupOrderRoutes);
  
  console.log('🚚 Setting up shipment routes...');
  app.use(`${apiPrefix}/shipments`, shipmentRoutes);
  
  console.log('🏭 Setting up logistics routes...');
  app.use(`${apiPrefix}/logistics`, logisticsRoutes);
  
  // ================================
  // DELIVERIES MANAGEMENT ROUTES
  // ================================
  
  console.log('📦 Setting up deliveries routes...');
  // IMPORTANTE: Questo monta tutte le routes dei conferimenti
  // Le routes sono definite nel deliveriesRoutes con i loro path specifici:
  // - /deliveries -> deliveriesController.getAllDeliveries
  // - /contributors -> deliveriesController.getAllContributors  
  // - /material-types -> deliveriesController.getAllMaterialTypes
  // - /calendar/:year/:month -> deliveriesController.getMonthlyCalendar
  // - /calendar/day/:date -> deliveriesController.getDayDeliveries
  app.use(`${apiPrefix}`, deliveriesRoutes);
  
  // ================================
  // DASHBOARD AND REPORTING ROUTES
  // ================================
  
  console.log('📊 Setting up dashboard routes...');
  app.use(`${apiPrefix}/dashboard`, dashboardRoutes);
  
  // ================================
  // API DOCUMENTATION ENDPOINT
  // ================================
  
  app.get(`${apiPrefix}/info`, (req, res) => {
    res.status(200).json({
      title: 'Sistema Gestione Rifiuti API',
      version: '1.0.0',
      description: 'API per la gestione automatizzata dei processi di raccolta e smaltimento rifiuti secondo allegato tecnico ANCI-COREPLA',
      
      // ================================
      // ENDPOINTS DOCUMENTATION
      // ================================
      
      endpoints: {
        // Core System Endpoints
        system: {
          health: {
            path: `${apiPrefix}/health`,
            method: 'GET',
            description: 'Status e salute del sistema',
            authentication: false
          },
          info: {
            path: `${apiPrefix}/info`,
            method: 'GET',
            description: 'Documentazione API completa',
            authentication: false
          }
        },
        
        // Authentication & Users
        auth: {
          base: `${apiPrefix}/auth`,
          description: 'Autenticazione e autorizzazione',
          routes: [
            'POST /login - Login utente',
            'POST /refresh - Rinnova token',
            'POST /logout - Logout utente',
            'POST /register - Registrazione nuovo utente (solo admin)',
            'GET /me - Profilo utente corrente'
          ]
        },
        users: {
          base: `${apiPrefix}/users`,
          description: 'Gestione utenti del sistema',
          authentication: 'JWT Bearer token required',
          routes: [
            'GET / - Lista utenti (con filtri)',
            'GET /:id - Dettaglio utente',
            'POST / - Crea nuovo utente',
            'PUT /:id - Modifica utente',
            'DELETE /:id - Disattiva utente',
            'PATCH /:id/activate - Riattiva utente',
            'PATCH /:id/change-password - Cambia password'
          ]
        },
        
        // Business Entities
        clients: {
          base: `${apiPrefix}/clients`,
          description: 'Gestione clienti e fornitori amministrativi',
          authentication: 'JWT Bearer token required',
          routes: [
            'GET / - Lista clienti (con filtri)',
            'GET /:id - Dettaglio cliente',
            'POST / - Crea nuovo cliente',
            'PUT /:id - Modifica cliente',
            'DELETE /:id - Elimina cliente',
            'GET /:id/basins - Bacini del cliente',
            'GET /:id/statistics - Statistiche cliente'
          ]
        },
        basins: {
          base: `${apiPrefix}/basins`,
          description: 'Gestione bacini di raccolta',
          authentication: 'JWT Bearer token required',
          routes: [
            'GET / - Lista bacini (con filtri)',
            'GET /:id - Dettaglio bacino',
            'POST / - Crea nuovo bacino',
            'PUT /:id - Modifica bacino',
            'DELETE /:id - Elimina bacino',
            'GET /:id/analysis - Analisi merceologiche bacino',
            'GET /:id/deliveries - Conferimenti del bacino'
          ]
        },
        
        // Operational Workflow
        pickupOrders: {
          base: `${apiPrefix}/pickup-orders`,
          description: 'Gestione buoni di ritiro e workflow operativo',
          authentication: 'JWT Bearer token required',
          routes: [
            'GET / - Lista buoni di ritiro (con filtri)',
            'GET /:id - Dettaglio buono di ritiro',
            'POST / - Crea nuovo buono di ritiro',
            'PUT /:id - Modifica buono di ritiro',
            'DELETE /:id - Elimina buono di ritiro',
            'GET /basin/:basinId - Buoni per bacino',
            'GET /client/:clientId - Buoni per cliente',
            'PATCH /:id/status - Cambia stato buono',
            'POST /:id/upload-documents - Carica documenti',
            'POST /ocr/extract - Estrazione OCR da PDF',
            'POST /ocr/logistics/suggestions - Suggerimenti entità logistiche',
            'POST /ocr/logistics/auto-create - Creazione automatica entità'
          ]
        },
        shipments: {
          base: `${apiPrefix}/shipments`,
          description: 'Gestione spedizioni e calendario operativo',
          authentication: 'JWT Bearer token required',
          routes: [
            'GET / - Lista spedizioni (con filtri)',
            'GET /:id - Dettaglio spedizione',
            'POST / - Crea nuova spedizione',
            'PUT /:id - Modifica spedizione',
            'DELETE /:id - Elimina spedizione',
            'GET /calendar/:year/:month - Calendario spedizioni',
            'GET /schedule - Programmazione giornaliera',
            'PATCH /:id/reschedule - Riprogramma spedizione'
          ]
        },
        logistics: {
          base: `${apiPrefix}/logistics`,
          description: 'Gestione entità logistiche (mittenti, destinatari, trasportatori)',
          authentication: 'JWT Bearer token required',
          routes: [
            'GET / - Lista entità logistiche (con filtri)',
            'GET /type/:type - Entità per tipo (SENDER/RECIPIENT/TRANSPORTER)',
            'GET /stats - Statistiche entità logistiche',
            'GET /suggestions - Suggerimenti autocomplete per OCR',
            'GET /search-ocr - Ricerca per sistema OCR',
            'GET /:id - Dettaglio entità logistica',
            'POST / - Crea nuova entità logistica',
            'PUT /:id - Modifica entità logistica',
            'DELETE /:id - Disattiva entità logistica',
            'PATCH /:id/reactivate - Riattiva entità logistica'
          ]
        },
        
        // Deliveries Management (NUOVO)
        deliveries: {
          base: `${apiPrefix}/deliveries`,
          description: 'Gestione conferimenti giornalieri',
          authentication: 'JWT Bearer token required',
          routes: [
            'GET / - Lista conferimenti (con filtri data, conferitore, tipologia)',
            'GET /:id - Dettaglio conferimento',
            'POST / - Registra nuovo conferimento',
            'PUT /:id - Modifica conferimento',
            'DELETE /:id - Elimina conferimento',
            'PATCH /:id/validate - Valida conferimento',
            'GET /daily/:date - Conferimenti del giorno',
            'GET /monthly/:year/:month - Report mensile',
            'POST /bulk - Inserimento multiplo conferimenti'
          ]
        },
        contributors: {
          base: `${apiPrefix}/contributors`,
          description: 'Gestione conferitori e fornitori di materiali',
          authentication: 'JWT Bearer token required',
          routes: [
            'GET / - Lista conferitori (con filtri)',
            'GET /:id - Dettaglio conferitore',
            'GET /by-material/:code - Conferitori per tipologia materiale',
            'GET /:id/statistics - Statistiche conferitore (volumi, frequenza)',
            'GET /:id/deliveries - Storico conferimenti',
            'POST / - Registra nuovo conferitore',
            'PUT /:id - Modifica conferitore',
            'DELETE /:id - Disattiva conferitore',
            'PATCH /:id/authorize-materials - Autorizza tipologie materiali'
          ]
        },
        materialTypes: {
          base: `${apiPrefix}/material-types`,
          description: 'Gestione tipologie materiali e classificazione',
          authentication: 'JWT Bearer token required',
          routes: [
            'GET / - Lista tipologie materiali',
            'GET /hierarchy - Struttura gerarchica completa',
            'GET /:id - Dettaglio tipologia',
            'GET /code/:code - Tipologia per codice (MONO, MULTI, etc.)',
            'GET /:id/statistics - Statistiche tipologia (volumi, trend)',
            'GET /active - Solo tipologie attive',
            'POST / - Crea nuova tipologia',
            'PUT /:id - Modifica tipologia',
            'DELETE /:id - Disattiva tipologia',
            'PATCH /:id/reactivate - Riattiva tipologia'
          ]
        },
        calendar: {
          base: `${apiPrefix}/calendar`,
          description: 'Calendario conferimenti e pianificazione',
          authentication: 'JWT Bearer token required',
          routes: [
            'GET /:year/:month - Dati calendario mensile con aggregazioni',
            'GET /day/:date - Dettaglio conferimenti del giorno (YYYY-MM-DD)',
            'GET /week/:date - Vista settimanale',
            'GET /range/:startDate/:endDate - Dati per range personalizzato',
            'POST /events - Aggiungi evento al calendario',
            'GET /holidays - Giorni festivi configurati'
          ]
        },
        
        // Dashboard & Reporting
        dashboard: {
          base: `${apiPrefix}/dashboard`,
          description: 'Dashboard principale e KPI del sistema',
          authentication: 'JWT Bearer token required',
          routes: [
            'GET /stats - Statistiche generali sistema',
            'GET /kpi - Indicatori di performance chiave',
            'GET /charts/deliveries - Dati grafici conferimenti',
            'GET /charts/materials - Dati grafici tipologie materiali',
            'GET /alerts - Alerti e notifiche sistema',
            'GET /recent-activity - Attività recenti'
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
          'IN_EVASIONE - In corso di evasione dal mittente',
          'IN_CARICO - Materiale in fase di carico sul mezzo',
          'CARICATO - Materiale caricato, documentazione completata',
          'SPEDITO - In viaggio verso destinazione',
          'COMPLETO - Peso a destino confermato, pronto per fatturazione'
        ],
        deliveryWorkflow: [
          'REGISTRAZIONE - Conferimento registrato nel sistema',
          'VALIDAZIONE - Controllo qualità e dati da parte operatore',
          'APPROVAZIONE - Conferimento approvato e contabilizzato',
          'LAVORAZIONE - Materiale avviato alla lavorazione',
          'COMPLETATO - Processo completato'
        ],
        logisticEntityTypes: [
          'SENDER - Mittenti/Fornitori logistici per trasporti',
          'RECIPIENT - Destinatari/Clienti logistici per consegne',
          'TRANSPORTER - Trasportatori/Vettori per movimentazione'
        ],
        materialTypes: [
          'MONO - Monomateriale plastica (raccolta differenziata urbana)',
          'MULTI - Multimateriale leggero (plastica + metalli)',
          'OLIO - Oli esausti e lubrificanti',
          'PLASTICA - Materiali plastici vari e specifici',
          'METALLI - Materiali metallici (alluminio, acciaio)',
          'VETRO_SARCO - Vetro e materiali assimilati',
          'CARTA - Carta e cartone da recupero',
          'ORGANICO - Frazione organica e biodegradabile',
          'TESSILE - Materiali tessili da recupero',
          'RAEE - Rifiuti da apparecchiature elettriche ed elettroniche'
        ],
        deliveryQualities: [
          'OTTIMA - Materiale di alta qualità, pronto per lavorazione',
          'BUONA - Materiale di buona qualità con minimal processing',
          'SCARSA - Materiale di qualità inferiore, necessita selezione',
          'CONTAMINATO - Materiale contaminato, necessita bonifica'
        ],
        moistureLevels: [
          'BASSO - Umidità < 5% (ideale per lavorazione)',
          'MEDIO - Umidità 5-15% (accettabile)',
          'ALTO - Umidità > 15% (necessita asciugatura)'
        ]
      },
      
      // ================================
      // AUTHENTICATION & AUTHORIZATION
      // ================================
      
      authentication: {
        type: 'JWT Bearer Token',
        headerFormat: 'Authorization: Bearer <token>',
        tokenExpiry: '24 hours',
        refreshTokenExpiry: '7 days',
        requiresAuthentication: [
          'All endpoints except /health and /info',
          'Login required for all business operations',
          'Role-based access control enforced'
        ]
      },
      
      roles: {
        USER: {
          description: 'Utente base - Solo lettura',
          permissions: ['read_deliveries', 'read_reports', 'read_calendar']
        },
        OPERATOR: {
          description: 'Operatore - Gestione operativa carico e documentazione',
          permissions: ['read_all', 'create_deliveries', 'update_deliveries', 'validate_deliveries', 'upload_documents']
        },
        MANAGER: {
          description: 'Manager - Gestione completa workflow e analisi',
          permissions: ['read_all', 'create_all', 'update_all', 'delete_deliveries', 'manage_contributors', 'view_statistics', 'generate_reports']
        },
        ADMIN: {
          description: 'Amministratore - Accesso completo sistema',
          permissions: ['full_access', 'manage_users', 'manage_system_config', 'delete_all', 'view_audit_logs']
        }
      },
      
      // ================================
      // TECHNICAL SPECIFICATIONS
      // ================================
      
      technical: {
        apiVersion: '1.0.0',
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
        database: {
          type: 'PostgreSQL',
          orm: 'Prisma',
          connectionPool: '20 connections max',
          backupFrequency: 'Daily automated backups'
        },
        authentication: {
          provider: 'JWT with RS256 signing',
          sessionManagement: 'Stateless tokens',
          passwordHashing: 'bcrypt with salt rounds 12'
        },
        fileUploads: {
          maxSize: '50MB per file',
          allowedTypes: ['PDF', 'JPG', 'PNG', 'DOC', 'XLS'],
          storage: 'Local filesystem with backup'
        },
        performance: {
          rateLimit: '100 requests per minute per IP',
          caching: 'Redis for frequently accessed data',
          logging: 'Winston with file rotation'
        },
        security: {
          cors: 'Enabled for configured frontend domains',
          headers: 'Security headers via Helmet.js',
          validation: 'Request validation with Joi schemas',
          sanitization: 'Input sanitization for XSS prevention'
        }
      },
      
      // ================================
      // DATA FORMATS & CONVENTIONS
      // ================================
      
      dataFormats: {
        dates: {
          format: 'ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)',
          timezone: 'UTC for storage, local for display',
          dateOnly: 'YYYY-MM-DD for date-only fields'
        },
        numbers: {
          weights: 'Decimal with 3 decimal places (kg)',
          distances: 'Decimal with 2 decimal places (km)',
          percentages: 'Decimal 0-100 with 2 decimal places'
        },
        strings: {
          encoding: 'UTF-8',
          maxLength: '255 characters for most fields',
          notes: '2000 characters max for notes/descriptions'
        },
        files: {
          naming: 'UUID_originalname.extension',
          metadata: 'Stored in database with file references'
        }
      },
      
      // ================================
      // ERROR CODES & RESPONSES
      // ================================
      
      errorCodes: {
        400: 'Bad Request - Invalid input data or parameters',
        401: 'Unauthorized - Authentication required or failed',
        403: 'Forbidden - Insufficient permissions for action',
        404: 'Not Found - Requested resource does not exist',
        409: 'Conflict - Resource already exists or constraint violation',
        422: 'Unprocessable Entity - Validation errors in request data',
        429: 'Too Many Requests - Rate limit exceeded',
        500: 'Internal Server Error - Unexpected server error'
      },
      
      responseFormat: {
        success: {
          data: 'Requested data or operation result',
          message: 'Human readable success message (optional)',
          meta: 'Pagination, filtering, or additional metadata (optional)'
        },
        error: {
          message: 'Human readable error description',
          code: 'Machine readable error code',
          details: 'Additional error context (optional)',
          timestamp: 'ISO timestamp of error occurrence'
        }
      }
    });
  });
  
  // ================================
  // DEVELOPMENT HELPER ENDPOINTS
  // ================================
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🛠️ Setting up development helper endpoints...');
    
    // Endpoint per reset dati demo (solo in development)
    app.post(`${apiPrefix}/dev/reset-demo-data`, (req, res) => {
      // Implementare reset dati demo se necessario
      res.json({ message: 'Demo data reset functionality would go here' });
    });
    
    // Endpoint per generazione dati fake (solo in development)
    app.post(`${apiPrefix}/dev/generate-fake-data`, (req, res) => {
      // Implementare generazione dati fake se necessario
      res.json({ message: 'Fake data generation functionality would go here' });
    });
  }
  
  // ================================
  // CATCH-ALL ERROR HANDLER
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
      
      suggestion: `Controlla la documentazione completa all'endpoint ${apiPrefix}/info`
    });
  });
  
  console.log('✅ All routes configured successfully!');
  console.log(`📚 API documentation available at: ${apiPrefix}/info`);
  console.log(`❤️ Health check available at: ${apiPrefix}/health`);
};