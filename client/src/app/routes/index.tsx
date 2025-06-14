// client/src/app/routes/index.tsx - ROUTES COMPLETE CORRETTE

import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import ProtectedRoute from './ProtectedRoute';

// Lazy loading dei componenti esistenti
const Dashboard = lazy(() => import('../../modules/dashboard/pages/Dashboard'));
const Login = lazy(() => import('../../modules/auth/pages/Login'));

// Pickup Orders
const PickupOrderList = lazy(() => import('../../modules/pickupOrders/pages/PickupOrderList'));
const PickupOrderForm = lazy(() => import('../../modules/pickupOrders/pages/PickupOrderForm'));
const PickupOrderDetail = lazy(() => import('../../modules/pickupOrders/pages/PickupOrderDetail'));
const PickupOrderUpload = lazy(() => import('../../modules/pickupOrders/pages/PickupOrderUpload'));

// Users
const UserList = lazy(() => import('../../modules/users/pages/UserList'));
const UserForm = lazy(() => import('../../modules/users/pages/UserForm'));

// Clients
const ClientList = lazy(() => import('../../modules/clients/pages/ClientList'));
const ClientForm = lazy(() => import('../../modules/clients/pages/ClientForm'));
const ClientDetail = lazy(() => import('../../modules/clients/pages/ClientDetail'));

// Basins
const BasinList = lazy(() => import('../../modules/basins/pages/BasinList'));
const BasinForm = lazy(() => import('../../modules/basins/pages/BasinForm'));

// ✅ SPEDIZIONI - Import con gestione errori dettagliata
const ShipmentCalendar = lazy(() => 
  import('../../modules/shipments/pages/ShipmentCalendar')
    .then(module => ({ default: module.default }))
    .catch(err => {
      console.error('Errore caricamento ShipmentCalendar:', err);
      return { 
        default: () => (
          <Box sx={{ p: 3 }}>
            <h2>⚠️ ShipmentCalendar non disponibile</h2>
            <p>File non trovato: client/src/modules/shipments/pages/ShipmentCalendar.tsx</p>
            <p>Errore: {err.message}</p>
          </Box>
        )
      };
    })
);

const ShipmentOperatorDashboard = lazy(() => 
  import('../../modules/shipments/pages/ShipmentOperatorDashboard')
    .then(module => ({ default: module.default }))
    .catch(err => {
      console.error('Errore caricamento ShipmentOperatorDashboard:', err);
      return { 
        default: () => (
          <Box sx={{ p: 3 }}>
            <h2>⚠️ ShipmentOperatorDashboard non disponibile</h2>
            <p>File non trovato: client/src/modules/shipments/pages/ShipmentOperatorDashboard.tsx</p>
            <p>Errore: {err.message}</p>
          </Box>
        )
      };
    })
);

const ManagerFinalization = lazy(() => 
  import('../../modules/shipments/pages/ManagerFinalization')
    .then(module => ({ default: module.default }))
    .catch(err => {
      console.error('Errore caricamento ManagerFinalization:', err);
      return { 
        default: () => (
          <Box sx={{ p: 3 }}>
            <h2>⚠️ ManagerFinalization non disponibile</h2>
            <p>File non trovato: client/src/modules/shipments/pages/ManagerFinalization.tsx</p>
            <p>Errore: {err.message}</p>
          </Box>
        )
      };
    })
);

const ShippedOrderHistory = lazy(() => 
  import('../../modules/shipments/pages/ShippedOrderHistory')
    .then(module => ({ default: module.default }))
    .catch(err => {
      console.error('Errore caricamento ShippedOrderHistory:', err);
      return { 
        default: () => (
          <Box sx={{ p: 3 }}>
            <h2>⚠️ ShippedOrderHistory non disponibile</h2>
            <p>File non trovato: client/src/modules/shipments/pages/ShippedOrderHistory.tsx</p>
            <p>Errore: {err.message}</p>
            <p>Creazione automatica del file...</p>
            <pre style={{ background: '#f5f5f5', padding: '10px', fontSize: '12px' }}>
{`// Crea questo file in: client/src/modules/shipments/pages/ShippedOrderHistory.tsx
import React from 'react';
import { Container, Typography } from '@mui/material';

const ShippedOrderHistory = () => {
  return (
    <Container>
      <Typography variant="h4">Storico Spedizioni</Typography>
      <Typography>Pagina in costruzione...</Typography>
    </Container>
  );
};

export default ShippedOrderHistory;`}
            </pre>
          </Box>
        )
      };
    })
);

// Loading component
const LoadingSpinner = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <CircularProgress />
  </Box>
);

// Componente temporaneo per testing
const ShipmentFallback = ({ pageName }: { pageName: string }) => (
  <Box sx={{ p: 3 }}>
    <h2>🚧 {pageName} in Sviluppo</h2>
    <p>Questa sezione è attualmente in fase di sviluppo.</p>
    <p>Path corrente: {window.location.pathname}</p>
    <p>File previsto: client/src/modules/shipments/pages/{pageName}.tsx</p>
    
    <details style={{ marginTop: '20px' }}>
      <summary>🔧 Istruzioni per risolvere</summary>
      <ol>
        <li>Verifica che la cartella esista: <code>client/src/modules/shipments/pages/</code></li>
        <li>Crea il file mancante: <code>{pageName}.tsx</code></li>
        <li>Oppure copia i contenuti dagli artefatti forniti</li>
      </ol>
    </details>
  </Box>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        
        {/* Pickup Orders Routes */}
        <Route path="/pickup-orders" element={<ProtectedRoute><PickupOrderList /></ProtectedRoute>} />
        <Route path="/pickup-orders/new" element={<ProtectedRoute><PickupOrderForm /></ProtectedRoute>} />
        <Route path="/pickup-orders/upload" element={<ProtectedRoute><PickupOrderUpload /></ProtectedRoute>} />
        <Route path="/pickup-orders/:id" element={<ProtectedRoute><PickupOrderDetail /></ProtectedRoute>} />
        <Route path="/pickup-orders/edit/:id" element={<ProtectedRoute><PickupOrderForm /></ProtectedRoute>} />
        
        {/* Users Routes */}
        <Route path="/users" element={<ProtectedRoute><UserList /></ProtectedRoute>} />
        <Route path="/users/new" element={<ProtectedRoute><UserForm /></ProtectedRoute>} />
        <Route path="/users/edit/:id" element={<ProtectedRoute><UserForm /></ProtectedRoute>} />
        
        {/* Clients Routes */}
        <Route path="/clients" element={<ProtectedRoute><ClientList /></ProtectedRoute>} />
        <Route path="/clients/new" element={<ProtectedRoute><ClientForm /></ProtectedRoute>} />
        <Route path="/clients/edit/:id" element={<ProtectedRoute><ClientForm /></ProtectedRoute>} />
        <Route path="/clients/:id" element={<ProtectedRoute><ClientDetail /></ProtectedRoute>} />
        
        {/* Basins Routes */}
        <Route path="/basins" element={<ProtectedRoute><BasinList /></ProtectedRoute>} />
        <Route path="/basins/new" element={<ProtectedRoute><BasinForm /></ProtectedRoute>} />
        <Route path="/basins/edit/:id" element={<ProtectedRoute><BasinForm /></ProtectedRoute>} />
        
        {/* ✅ SPEDIZIONI ROUTES - Con fallback migliorati */}
        <Route 
          path="/shipments" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <ShipmentCalendar />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/shipments/calendar" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <ShipmentCalendar />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/shipments/operator" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <ShipmentOperatorDashboard />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/shipments/manager" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <ManagerFinalization />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        
        {/* ✅ ROUTE STORICO SPEDIZIONI */}
        <Route 
          path="/shipments/history" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <ShippedOrderHistory />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        
        {/* Fallback per altre route spedizioni non definite */}
        <Route 
          path="/shipments/*" 
          element={
            <ProtectedRoute>
              <ShipmentFallback pageName="Spedizioni" />
            </ProtectedRoute>
          } 
        />
        
        {/* Placeholder routes for future modules */}
        <Route path="/deliveries" element={<ProtectedRoute><div>Conferimenti - Coming Soon</div></ProtectedRoute>} />
        <Route path="/processing" element={<ProtectedRoute><div>Lavorazioni - Coming Soon</div></ProtectedRoute>} />
        <Route path="/analysis" element={<ProtectedRoute><div>Analisi - Coming Soon</div></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute><div>Giacenze - Coming Soon</div></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><div>Report - Coming Soon</div></ProtectedRoute>} />

        {/* 404 Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;