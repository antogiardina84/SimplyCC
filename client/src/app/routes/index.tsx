// client/src/app/routes/index.tsx

import { Routes, Route } from 'react-router-dom';
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

// === SPEDIZIONI - Import con gestione errori ===
const ShipmentCalendar = lazy(() => 
  import('../../modules/shipments/pages/ShipmentCalendar').catch(() => 
    ({ default: () => <div>⚠️ ShipmentCalendar non trovato. Controlla che il file esista in: client/src/modules/shipments/pages/ShipmentCalendar.tsx</div> })
  )
);

const ShipmentOperatorDashboard = lazy(() => 
  import('../../modules/shipments/pages/ShipmentOperatorDashboard').catch(() => 
    ({ default: () => <div>⚠️ ShipmentOperatorDashboard non trovato. Controlla che il file esista in: client/src/modules/shipments/pages/ShipmentOperatorDashboard.tsx</div> })
  )
);

const ManagerFinalization = lazy(() => 
  import('../../modules/shipments/pages/ManagerFinalization').catch(() => 
    ({ default: () => <div>⚠️ ManagerFinalization non trovato. Controlla che il file esista in: client/src/modules/shipments/pages/ManagerFinalization.tsx</div> })
  )
);

// Loading component
const LoadingSpinner = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <CircularProgress />
  </Box>
);

// Placeholder component temporaneo per testing
const ShipmentPlaceholder = () => (
  <Box sx={{ p: 3 }}>
    <h2>🚧 Spedizioni in Sviluppo</h2>
    <p>Questa sezione è attualmente in fase di sviluppo.</p>
    <p>I file esistono in: client/src/modules/shipments/pages/</p>
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
        
        {/* === SPEDIZIONI ROUTES - Usando i file esistenti === */}
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
        
        {/* Fallback per altre route spedizioni non definite */}
        <Route 
          path="/shipments/*" 
          element={
            <ProtectedRoute>
              <ShipmentPlaceholder />
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
        <Route path="*" element={<div>Pagina non trovata</div>} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;