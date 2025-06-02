// server/src/core/setup/routes.ts

import { Express } from 'express';
import { authRoutes } from '../../modules/auth/routes';
import { userRoutes } from '../../modules/users/routes';
import { clientRoutes } from '../../modules/clients/routes';
import { basinRoutes } from '../../modules/basins/routes';
import { pickupOrderRoutes } from '../../modules/pickupOrders/routes';
import { shipmentRoutes } from '../../modules/shipments/routes';
import { logisticsRoutes } from '../../modules/shipments/routes/logistics.routes';
import { dashboardRoutes } from '../../modules/dashboard/routes';

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
        'dashboard'
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
        `${apiPrefix}/dashboard`
      ]
    });
  });
};