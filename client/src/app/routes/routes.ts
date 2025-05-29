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
const PickupOrderUpload = lazy(() => import('../../modules/pickupOrders/pages/PickupOrderUpload')); // <-- aggiunta

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
    path: '/pickup-orders/upload',   // <-- nuova rotta upload
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

  {
    path: '/deliveries',
    element: PlaceholderPage,
    protected: true,
  },
  {
    path: '/processing',
    element: PlaceholderPage,
    protected: true,
  },
  {
    path: '/shipments',
    element: PlaceholderPage,
    protected: true,
  },
  {
    path: '/analysis',
    element: PlaceholderPage,
    protected: true,
  },
  {
    path: '/inventory',
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
