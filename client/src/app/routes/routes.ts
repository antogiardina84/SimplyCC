// client/src/app/routes/routes.ts - AGGIORNATO CON PROCESSING E INVENTORY

import { type ComponentType, lazy } from 'react';

// Lazy import per le pagine esistenti
const Login = lazy(() => import('../../modules/auth/pages/Login'));
const Register = lazy(() => import('../../modules/auth/pages/Register'));
const Dashboard = lazy(() => import('../../modules/dashboard/pages/Dashboard'));

// Clients
const ClientList = lazy(() => import('../../modules/clients/pages/ClientList'));
const ClientForm = lazy(() => import('../../modules/clients/pages/ClientForm'));

// Basins
const BasinList = lazy(() => import('../../modules/basins/pages/BasinList'));
const BasinForm = lazy(() => import('../../modules/basins/pages/BasinForm'));

// Users
const UserList = lazy(() => import('../../modules/users/pages/UserList'));
const UserForm = lazy(() => import('../../modules/users/pages/UserForm'));
const Profile = lazy(() => import('../../modules/profile/pages/Profile'));

// Pickup Orders
const PickupOrderList = lazy(() => import('../../modules/pickupOrders/pages/PickupOrderList'));
const PickupOrderForm = lazy(() => import('../../modules/pickupOrders/pages/PickupOrderForm'));
const PickupOrderDetail = lazy(() => import('../../modules/pickupOrders/pages/PickupOrderDetail'));
const PickupOrderUpload = lazy(() => import('../../modules/pickupOrders/pages/PickupOrderUpload'));

// === NUOVE PAGINE SPEDIZIONI ===
const ShipmentCalendar = lazy(() => import('../../modules/shipments/pages/ShipmentCalendar'));
const ShipmentOperatorDashboard = lazy(() => import('../../modules/shipments/pages/ShipmentOperatorDashboard'));
const ManagerFinalization = lazy(() => import('../../modules/shipments/pages/ManagerFinalization'));

// === NUOVE PAGINE PROCESSING ===
const ProcessingList = lazy(() => import('../../modules/processing/pages/ProcessingList'));
const ProcessingForm = lazy(() => import('../../modules/processing/pages/ProcessingForm'));
const ProcessingDetail = lazy(() => import('../../modules/processing/pages/ProcessingDetail'));

// === NUOVE PAGINE INVENTORY ===
const InventoryList = lazy(() => import('../../modules/inventory/pages/InventoryList'));
const InventoryForm = lazy(() => import('../../modules/inventory/pages/InventoryForm'));
const InventoryDashboard = lazy(() => import('../../modules/inventory/pages/InventoryDashboard'));

// Placeholder per pagine non ancora implementate
const PlaceholderPage = lazy(() => import('../../core/components/PlaceholderPage'));
const NotFound = lazy(() => import('../../core/components/NotFound'));

interface RouteConfig {
  path: string;
  element: ComponentType;
  protected: boolean;
}

export const routes: RouteConfig[] = [
  // Dashboard
  {
    path: '/',
    element: Dashboard,
    protected: true,
  },

  // Users
  {
    path: '/users',
    element: UserList,
    protected: true,
  },
  {
    path: '/users/new',
    element: UserForm,
    protected: true,
  },
  {
    path: '/users/:id/edit',
    element: UserForm,
    protected: true,
  },
  {
    path: '/profile',
    element: Profile,
    protected: true,
  },

  // Clients
  {
    path: '/clients',
    element: ClientList,
    protected: true,
  },
  {
    path: '/clients/new',
    element: ClientForm,
    protected: true,
  },
  {
    path: '/clients/:id/edit',
    element: ClientForm,
    protected: true,
  },

  // Pickup Orders
  {
    path: '/pickup-orders',
    element: PickupOrderList,
    protected: true,
  },
  {
    path: '/pickup-orders/new',
    element: PickupOrderForm,
    protected: true,
  },
  {
    path: '/pickup-orders/upload',
    element: PickupOrderUpload,
    protected: true,
  },
  {
    path: '/pickup-orders/:id',
    element: PickupOrderDetail,
    protected: true,
  },
  {
    path: '/pickup-orders/:id/edit',
    element: PickupOrderForm,
    protected: true,
  },

  // Basins
  {
    path: '/basins',
    element: BasinList,
    protected: true,
  },
  {
    path: '/basins/new',
    element: BasinForm,
    protected: true,
  },
  {
    path: '/basins/:id/edit',
    element: BasinForm,
    protected: true,
  },

  // === NUOVE ROUTES SPEDIZIONI ===
  {
    path: '/shipments/calendar',
    element: ShipmentCalendar,
    protected: true,
  },
  {
    path: '/shipments/operator',
    element: ShipmentOperatorDashboard, // CORRETTO
    protected: true,
  },
  {
    path: '/shipments/manager',
    element: ManagerFinalization,
    protected: true,
  },
  // Mantieni la route originale per compatibilità
  {
    path: '/shipments',
    element: ShipmentCalendar, // Reindirizza al calendario come default
    protected: true,
  },

  // === NUOVE ROUTES PROCESSING ===
  {
    path: '/processing',
    element: ProcessingList,
    protected: true,
  },
  {
    path: '/processing/new',
    element: ProcessingForm,
    protected: true,
  },
  {
    path: '/processing/:id',
    element: ProcessingDetail,
    protected: true,
  },
  {
    path: '/processing/:id/edit',
    element: ProcessingForm,
    protected: true,
  },

  // === NUOVE ROUTES INVENTORY ===
  {
    path: '/inventory',
    element: InventoryList,
    protected: true,
  },
  {
    path: '/inventory/new',
    element: InventoryForm,
    protected: true,
  },
  {
    path: '/inventory/report',
    element: InventoryDashboard,
    protected: true,
  },
  {
    path: '/inventory/:id/edit',
    element: InventoryForm,
    protected: true,
  },

  // Altre pagine placeholder
  {
    path: '/deliveries',
    element: PlaceholderPage,
    protected: true,
  },
  {
    path: '/analysis',
    element: PlaceholderPage,
    protected: true,
  },
  {
    path: '/reports',
    element: PlaceholderPage,
    protected: true,
  },

  // Auth
  {
    path: '/login',
    element: Login,
    protected: false,
  },
  {
    path: '/register',
    element: Register,
    protected: false,
  },

  // 404
  {
    path: '*',
    element: NotFound,
    protected: false,
  },
];