// server/src/core/setup/routes.ts

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

// NUOVO: Import delle routes per conferimenti
import { deliveriesRoutes } from '../../modules/deliveries/routes';

export const setupRoutes = (app: Express, apiPrefix: string): void => {
  // Health check
  app.get(`${apiPrefix}/health`, (req, res) => {
    res.status(200).json({ 
      status: 'UP', 
      timestamp: new Date(),
      version: '1.0.0',
      modules: [
        'auth',
        'users', 
        'clients',
        'basins',
        'pickup-orders',
        'shipments',
        'logistics',
        'dashboard',
        'deliveries' // AGGIUNTO
      ]
    });
  });

  // ================================
  // CORE ROUTES
  // ================================
  
  // Autenticazione e gestione utenti
  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/users`, userRoutes);
  
  // ================================
  // BUSINESS ROUTES
  // ================================
  
  // Gestione anagrafica clienti e bacini
  app.use(`${apiPrefix}/clients`, clientRoutes);
  app.use(`${apiPrefix}/basins`, basinRoutes);
  
  // Gestione operativa: buoni di ritiro e spedizioni
  app.use(`${apiPrefix}/pickup-orders`, pickupOrderRoutes);
  app.use(`${apiPrefix}/shipments`, shipmentRoutes);
  
  // Gestione entità logistiche (mittenti/destinatari/trasportatori)
  app.use(`${apiPrefix}/logistics`, logisticsRoutes);
  
  // Dashboard e reporting
  app.use(`${apiPrefix}/dashboard`, dashboardRoutes);
  
  // NUOVO: Routes per conferimenti (include deliveries, contributors, material-types, calendar)
  app.use(`${apiPrefix}`, deliveriesRoutes);
  
  // ================================
  // API INFO ENDPOINT
  // ================================
  
  // Endpoint per informazioni sulle API disponibili
  app.get(`${apiPrefix}/info`, (req, res) => {
    res.status(200).json({
      title: 'Sistema Gestione Rifiuti API',
      version: '1.0.0',
      description: 'API per la gestione automatizzata dei processi di raccolta e smaltimento rifiuti secondo allegato tecnico ANCI-COREPLA',
      endpoints: {
        auth: {
          base: `${apiPrefix}/auth`,
          description: 'Autenticazione e autorizzazione',
        },
        users: {
          base: `${apiPrefix}/users`,
          description: 'Gestione utenti del sistema',
        },
        clients: {
          base: `${apiPrefix}/clients`,
          description: 'Gestione clienti e fornitori',
        },
        basins: {
          base: `${apiPrefix}/basins`,
          description: 'Gestione bacini di raccolta',
        },
        pickupOrders: {
          base: `${apiPrefix}/pickup-orders`,
          description: 'Gestione buoni di ritiro e workflow',
        },
        shipments: {
          base: `${apiPrefix}/shipments`,
          description: 'Gestione spedizioni e calendario operativo',
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
        },
        // NUOVO: Sezione conferimenti
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
      workflow: {
        pickupOrderStates: [
          'DA_EVADERE',
          'PROGRAMMATO',
          'IN_EVASIONE', 
          'IN_CARICO',
          'CARICATO',
          'SPEDITO',
          'COMPLETO'
        ],
        logisticEntityTypes: [
          'SENDER - Mittenti/Fornitori',
          'RECIPIENT - Destinatari/Clienti',
          'TRANSPORTER - Trasportatori/Vettori'
        ],
        // NUOVO: Tipologie materiali
        materialTypes: [
          'MONO - Monomateriale plastica',
          'MULTI - Multimateriale',
          'OLIO - Oli esausti',
          'PLASTICA - Materiali plastici vari',
          'METALLI - Materiali metallici',
          'VETRO_SARCO - Vetro e assimilati'
        ]
      },
      roles: {
        USER: 'Utente base - Solo lettura',
        OPERATOR: 'Operatore - Gestione carico e documentazione',
        MANAGER: 'Manager - Gestione completa workflow',
        ADMIN: 'Amministratore - Accesso completo sistema'
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
        `${apiPrefix}/deliveries`, // AGGIUNTO
        `${apiPrefix}/contributors`, // AGGIUNTO
        `${apiPrefix}/material-types`, // AGGIUNTO
        `${apiPrefix}/calendar` // AGGIUNTO
      ]
    });
  });
};