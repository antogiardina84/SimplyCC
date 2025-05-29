// client/src/app/routes/index.tsx

import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import ProtectedRoute from './ProtectedRoute';

// Lazy loading dei componenti
const Dashboard = lazy(() => import('../../modules/dashboard/pages/Dashboard'));
const Login = lazy(() => import('../../modules/auth/pages/Login'));

// Pickup Orders - ATTENZIONE: Usa il nome corretto del file
const PickupOrderList = lazy(() => import('../../modules/pickupOrders/pages/PickupOrderList'));
const PickupOrderForm = lazy(() => import('../../modules/pickupOrders/pages/PickupOrderForm'));
const PickupOrderDetail = lazy(() => import('../../modules/pickupOrders/pages/PickupOrderDetail')); // Nome corretto
const PickupOrderUpload = lazy(() => import('../../modules/pickupOrders/pages/PickupOrderUpload'));

// Users
const UserList = lazy(() => import('../../modules/users/pages/UserList'));
const UserForm = lazy(() => import('../../modules/users/pages/UserForm'));

// Clients
const ClientList = lazy(() => import('../../modules/clients/pages/ClientList'));
const ClientForm = lazy(() => import('../../modules/clients/pages/ClientForm'));

// Basins
const BasinList = lazy(() => import('../../modules/basins/pages/BasinList'));
const BasinForm = lazy(() => import('../../modules/basins/pages/BasinForm'));

// Loading component
const LoadingSpinner = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <CircularProgress />
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
        
        {/* DETTAGLI: /pickup-orders/:id */}
        <Route path="/pickup-orders/:id" element={<ProtectedRoute><PickupOrderDetail /></ProtectedRoute>} />
        
        {/* MODIFICA: /pickup-orders/:id/edit */}
        <Route path="/pickup-orders/:id/edit" element={<ProtectedRoute><PickupOrderForm /></ProtectedRoute>} />
        
        {/* Users Routes */}
        <Route path="/users" element={<ProtectedRoute><UserList /></ProtectedRoute>} />
        <Route path="/users/new" element={<ProtectedRoute><UserForm /></ProtectedRoute>} />
        <Route path="/users/:id/edit" element={<ProtectedRoute><UserForm /></ProtectedRoute>} />
        
        {/* Clients Routes */}
        <Route path="/clients" element={<ProtectedRoute><ClientList /></ProtectedRoute>} />
        <Route path="/clients/new" element={<ProtectedRoute><ClientForm /></ProtectedRoute>} />
        <Route path="/clients/:id/edit" element={<ProtectedRoute><ClientForm /></ProtectedRoute>} />
        
        {/* Basins Routes */}
        <Route path="/basins" element={<ProtectedRoute><BasinList /></ProtectedRoute>} />
        <Route path="/basins/new" element={<ProtectedRoute><BasinForm /></ProtectedRoute>} />
        <Route path="/basins/:id/edit" element={<ProtectedRoute><BasinForm /></ProtectedRoute>} />
        
        {/* Placeholder routes for future modules */}
        <Route path="/deliveries" element={<ProtectedRoute><div>Conferimenti - Coming Soon</div></ProtectedRoute>} />
        <Route path="/processing" element={<ProtectedRoute><div>Lavorazioni - Coming Soon</div></ProtectedRoute>} />
        <Route path="/shipments" element={<ProtectedRoute><div>Spedizioni - Coming Soon</div></ProtectedRoute>} />
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