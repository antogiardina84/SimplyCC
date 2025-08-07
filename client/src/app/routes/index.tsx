// client/src/app/routes/index.tsx - ROUTES COMPLETE CON PROCESSING E INVENTORY

import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import ProtectedRoute from './ProtectedRoute';

// Lazy loading dei componenti esistenti
const Dashboard = lazy(() => import('../../modules/dashboard/pages/Dashboard'));
const Login = lazy(() => import('../../modules/auth/pages/Login'));

// ✅ CORREZIONE: Profile import corretto
const Profile = lazy(() => 
  import('../../modules/profile/pages/Profile')
    .catch(() => 
      import('../../modules/users/pages/Profile') // Fallback se in users
        .catch(() => ({
          default: () => (
            <Box sx={{ p: 3 }}>
              <h2>👤 Profilo Utente</h2>
              <p>⚠️ Componente Profile non trovato nei percorsi:</p>
              <ul>
                <li>client/src/modules/profile/pages/Profile.tsx</li>
                <li>client/src/modules/users/pages/Profile.tsx</li>
              </ul>
              <p>Utilizzare il file Profile.tsx fornito negli artefatti.</p>
            </Box>
          )
        }))
    )
);

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

// ✅ DELIVERIES - Modulo Conferimenti CON GESTIONE ERRORI CORRETTA
const DeliveriesCalendar = lazy(() => 
  import('../../modules/deliveries/pages/DeliveriesCalendar')
    .catch(() => ({ 
      default: () => (
        <Box sx={{ p: 3 }}>
          <h2>📅 Calendario Conferimenti</h2>
          <p>⚠️ Componente non trovato: client/src/modules/deliveries/pages/DeliveriesCalendar.tsx</p>
          <p>Usa gli artefatti forniti per creare questo file.</p>
        </Box>
      )
    }))
);

const DeliveriesList = lazy(() => 
  import('../../modules/deliveries/pages/DeliveriesList')
    .catch(() => ({ 
      default: () => (
        <Box sx={{ p: 3 }}>
          <h2>📋 Lista Conferimenti</h2>
          <p>Pagina in sviluppo...</p>
        </Box>
      )
    }))
);

const ContributorsList = lazy(() => 
  import('../../modules/deliveries/pages/ContributorsList')
    .catch(() => ({ 
      default: () => (
        <Box sx={{ p: 3 }}>
          <h2>👥 Gestione Conferitori</h2>
          <p>Pagina in sviluppo...</p>
        </Box>
      )
    }))
);

const ContributorForm = lazy(() => 
  import('../../modules/deliveries/pages/ContributorForm')
    .catch(() => ({ 
      default: () => (
        <Box sx={{ p: 3 }}>
          <h2>👥 Form Conferitore</h2>
          <p>⚠️ Componente non trovato: client/src/modules/deliveries/pages/ContributorForm.tsx</p>
        </Box>
      )
    }))
);

// ✅ CORREZIONE: Material Types Import con fallback
const MaterialTypesList = lazy(() => 
  import('../../modules/deliveries/pages/MaterialTypesList')
    .catch((error) => {
      console.error('❌ Errore caricamento MaterialTypesList:', error);
      return { 
        default: () => (
          <Box sx={{ p: 3 }}>
            <h2>🗂️ Tipologie Materiali</h2>
            <p>⚠️ Componente non trovato: client/src/modules/deliveries/pages/MaterialTypesList.tsx</p>
            <p>Errore: {error.message}</p>
          </Box>
        )
      };
    })
);

const MaterialTypeForm = lazy(() => 
  import('../../modules/deliveries/pages/MaterialTypeForm')
    .catch((error) => {
      console.error('❌ Errore caricamento MaterialTypeForm:', error);
      return { 
        default: () => (
          <Box sx={{ p: 3 }}>
            <h2>🗂️ Form Tipologia Materiale</h2>
            <p>⚠️ Componente non trovato: client/src/modules/deliveries/pages/MaterialTypeForm.tsx</p>
            <p>Errore: {error.message}</p>
          </Box>
        )
      };
    })
);

// ✅ SPEDIZIONI - Import con gestione errori
const ShipmentCalendar = lazy(() => 
  import('../../modules/shipments/pages/ShipmentCalendar')
    .catch(() => ({ 
      default: () => (
        <Box sx={{ p: 3 }}>
          <h2>📅 Calendario Spedizioni</h2>
          <p>Pagina in sviluppo...</p>
        </Box>
      )
    }))
);

const ShipmentOperatorDashboard = lazy(() => 
  import('../../modules/shipments/pages/ShipmentOperatorDashboard')
    .catch(() => ({ 
      default: () => (
        <Box sx={{ p: 3 }}>
          <h2>👨‍💼 Dashboard Operatore</h2>
          <p>Pagina in sviluppo...</p>
        </Box>
      )
    }))
);

const ManagerFinalization = lazy(() => 
  import('../../modules/shipments/pages/ManagerFinalization')
    .catch(() => ({ 
      default: () => (
        <Box sx={{ p: 3 }}>
          <h2>✅ Finalizzazione Manager</h2>
          <p>Pagina in sviluppo...</p>
        </Box>
      )
    }))
);

const ShippedOrderHistory = lazy(() => 
  import('../../modules/shipments/pages/ShippedOrderHistory')
    .catch(() => ({ 
      default: () => (
        <Box sx={{ p: 3 }}>
          <h2>📋 Storico Spedizioni</h2>
          <p>Pagina in sviluppo...</p>
        </Box>
      )
    }))
);

// ===== NUOVE SEZIONI: PROCESSING E INVENTORY =====

// ✅ PROCESSING - Nuove import con gestione errori
const ProcessingList = lazy(() => 
  import('../../modules/processing/pages/ProcessingList')
    .catch(() => ({ 
      default: () => (
        <Box sx={{ p: 3 }}>
          <h2>⚙️ Lista Lavorazioni</h2>
          <p>⚠️ Componente non trovato: client/src/modules/processing/pages/ProcessingList.tsx</p>
          <p>Usa gli artefatti forniti per creare questo file.</p>
        </Box>
      )
    }))
);

const ProcessingForm = lazy(() => 
  import('../../modules/processing/pages/ProcessingForm')
    .catch(() => ({ 
      default: () => (
        <Box sx={{ p: 3 }}>
          <h2>⚙️ Form Lavorazione</h2>
          <p>⚠️ Componente non trovato: client/src/modules/processing/pages/ProcessingForm.tsx</p>
          <p>Usa gli artefatti forniti per creare questo file.</p>
        </Box>
      )
    }))
);

const ProcessingDetail = lazy(() => 
  import('../../modules/processing/pages/ProcessingDetail')
    .catch(() => ({ 
      default: () => (
        <Box sx={{ p: 3 }}>
          <h2>⚙️ Dettaglio Lavorazione</h2>
          <p>⚠️ Componente non trovato: client/src/modules/processing/pages/ProcessingDetail.tsx</p>
          <p>Usa gli artefatti forniti per creare questo file.</p>
        </Box>
      )
    }))
);

// ✅ INVENTORY - Nuove import con gestione errori
const InventoryList = lazy(() => 
  import('../../modules/inventory/pages/InventoryList')
    .catch(() => ({ 
      default: () => (
        <Box sx={{ p: 3 }}>
          <h2>📦 Gestione Giacenze</h2>
          <p>⚠️ Componente non trovato: client/src/modules/inventory/pages/InventoryList.tsx</p>
          <p>Usa gli artefatti forniti per creare questo file.</p>
        </Box>
      )
    }))
);

const InventoryForm = lazy(() => 
  import('../../modules/inventory/pages/InventoryForm')
    .catch(() => ({ 
      default: () => (
        <Box sx={{ p: 3 }}>
          <h2>📦 Form Movimento Giacenza</h2>
          <p>⚠️ Componente non trovato: client/src/modules/inventory/pages/InventoryForm.tsx</p>
          <p>Usa gli artefatti forniti per creare questo file.</p>
        </Box>
      )
    }))
);

const InventoryDashboard = lazy(() => 
  import('../../modules/inventory/pages/InventoryDashboard')
    .catch(() => ({ 
      default: () => (
        <Box sx={{ p: 3 }}>
          <h2>📦 Report Giacenze</h2>
          <p>⚠️ Componente non trovato: client/src/modules/inventory/pages/InventoryDashboard.tsx</p>
          <p>Usa gli artefatti forniti per creare questo file.</p>
        </Box>
      )
    }))
);

// Loading component
const LoadingSpinner = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <CircularProgress />
  </Box>
);

// Componente temporaneo per moduli non implementati
const ComingSoon = ({ title, module }: { title: string; module: string }) => (
  <Box sx={{ p: 3, textAlign: 'center' }}>
    <h2>🚧 {title}</h2>
    <p>Questo modulo è attualmente in fase di sviluppo.</p>
    <p>Modulo: <code>{module}</code></p>
    <p>Path: <code>{window.location.pathname}</code></p>
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
        
        {/* ========================================
            ✅ PROFILE ROUTE - CORREZIONE CRITICA
        ======================================== */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <Profile />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        
        {/* ========================================
            PICKUP ORDERS ROUTES
        ======================================== */}
        <Route path="/pickup-orders" element={<ProtectedRoute><PickupOrderList /></ProtectedRoute>} />
        <Route path="/pickup-orders/new" element={<ProtectedRoute><PickupOrderForm /></ProtectedRoute>} />
        <Route path="/pickup-orders/upload" element={<ProtectedRoute><PickupOrderUpload /></ProtectedRoute>} />
        <Route path="/pickup-orders/:id" element={<ProtectedRoute><PickupOrderDetail /></ProtectedRoute>} />
        <Route path="/pickup-orders/edit/:id" element={<ProtectedRoute><PickupOrderForm /></ProtectedRoute>} />
        
        {/* ========================================
            USERS ROUTES
        ======================================== */}
        <Route path="/users" element={<ProtectedRoute><UserList /></ProtectedRoute>} />
        <Route path="/users/new" element={<ProtectedRoute><UserForm /></ProtectedRoute>} />
        <Route path="/users/edit/:id" element={<ProtectedRoute><UserForm /></ProtectedRoute>} />
        
        {/* ========================================
            CLIENTS ROUTES
        ======================================== */}
        <Route path="/clients" element={<ProtectedRoute><ClientList /></ProtectedRoute>} />
        <Route path="/clients/new" element={<ProtectedRoute><ClientForm /></ProtectedRoute>} />
        <Route path="/clients/edit/:id" element={<ProtectedRoute><ClientForm /></ProtectedRoute>} />
        <Route path="/clients/:id" element={<ProtectedRoute><ClientDetail /></ProtectedRoute>} />
        
        {/* ========================================
            BASINS ROUTES
        ======================================== */}
        <Route path="/basins" element={<ProtectedRoute><BasinList /></ProtectedRoute>} />
        <Route path="/basins/new" element={<ProtectedRoute><BasinForm /></ProtectedRoute>} />
        <Route path="/basins/edit/:id" element={<ProtectedRoute><BasinForm /></ProtectedRoute>} />
        
        {/* ========================================
            ✅ DELIVERIES ROUTES - NUOVO MODULO COMPLETAMENTE CORRETTO
        ======================================== */}
        <Route 
          path="/deliveries" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <DeliveriesList />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/deliveries/calendar" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <DeliveriesCalendar />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/deliveries/contributors" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <ContributorsList />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/deliveries/contributors/new" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <ContributorForm />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/deliveries/contributors/:id/edit" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <ContributorForm />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        
        {/* ✅ MATERIAL TYPES ROUTES - CORRETTE E COMPLETE */}
        <Route 
          path="/deliveries/material-types" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <MaterialTypesList />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/deliveries/material-types/new" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <MaterialTypeForm />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/deliveries/material-types/:id/edit" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <MaterialTypeForm />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        
        {/* ========================================
            ✅ SHIPMENTS ROUTES
        ======================================== */}
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
        
        {/* ========================================
            ✅ PROCESSING ROUTES - NUOVA SEZIONE
        ======================================== */}
        <Route 
          path="/processing" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <ProcessingList />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/processing/new" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <ProcessingForm />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/processing/:id" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <ProcessingDetail />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/processing/:id/edit" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <ProcessingForm />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        
        {/* ========================================
            ✅ INVENTORY ROUTES - NUOVA SEZIONE
        ======================================== */}
        <Route 
          path="/inventory" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <InventoryList />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/inventory/new" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <InventoryForm />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/inventory/report" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <InventoryDashboard />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/inventory/:id/edit" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner />}>
                <InventoryForm />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        
        {/* ========================================
            PLACEHOLDER ROUTES - FUTURE MODULES
        ======================================== */}
        <Route 
          path="/analysis" 
          element={
            <ProtectedRoute>
              <ComingSoon title="Analisi Merceologiche" module="analysis" />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute>
              <ComingSoon title="Report e Analytics" module="reports" />
            </ProtectedRoute>
          } 
        />

        {/* 404 Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;