import { type ComponentType, lazy } from 'react';

// Lazy import corretto per TypeScript
const Login = lazy(() => import('../../modules/auth/pages/Login'));
const Register = lazy(() => import('../../modules/auth/pages/Register'));
const Dashboard = lazy(() => import('../../modules/dashboard/pages/Dashboard'));
const ClientList = lazy(() => import('../../modules/clients/pages/ClientList'));
const NotFound = lazy(() => import('../../core/components/NotFound'));

interface RouteConfig {
  path: string;
  element: ComponentType;
  protected: boolean;
}

export const routes: RouteConfig[] = [
  {
    path: '/',
    element: Dashboard,
    protected: true,
  },
  {
    path: '/clients',
    element: ClientList,
    protected: true,
  },
  {
    path: '/users',
    element: Dashboard, // Placeholder - da sostituire con UserList
    protected: true,
  },
  {
    path: '/basins',
    element: Dashboard, // Placeholder - da sostituire con BasinList
    protected: true,
  },
  {
    path: '/pickup-orders',
    element: Dashboard, // Placeholder - da sostituire con PickupOrderList
    protected: true,
  },
  {
    path: '/deliveries',
    element: Dashboard, // Placeholder - da sostituire con DeliveryList
    protected: true,
  },
  {
    path: '/processing',
    element: Dashboard, // Placeholder - da sostituire con ProcessingList
    protected: true,
  },
  {
    path: '/shipments',
    element: Dashboard, // Placeholder - da sostituire con ShipmentList
    protected: true,
  },
  {
    path: '/analysis',
    element: Dashboard, // Placeholder - da sostituire con AnalysisList
    protected: true,
  },
  {
    path: '/inventory',
    element: Dashboard, // Placeholder - da sostituire con InventoryList
    protected: true,
  },
  {
    path: '/reports',
    element: Dashboard, // Placeholder - da sostituire con ReportList
    protected: true,
  },
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
  {
    path: '*',
    element: NotFound,
    protected: false,
  },
];