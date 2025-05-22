// client/src/app/routes/routes.ts

import { type ComponentType, lazy } from 'react';

// Lazy import per tutte le pagine
const Login = lazy(() => import('../../modules/auth/pages/Login'));
const Register = lazy(() => import('../../modules/auth/pages/Register'));
const Dashboard = lazy(() => import('../../modules/dashboard/pages/Dashboard'));
const Profile = lazy(() => import('../../modules/profile/pages/Profile'));
const UserList = lazy(() => import('../../modules/users/pages/UserList'));
const UserForm = lazy(() => import('../../modules/users/pages/UserForm'));
const ClientList = lazy(() => import('../../modules/clients/pages/ClientList'));
const ClientForm = lazy(() => import('../../modules/clients/pages/ClientForm'));
const BasinList = lazy(() => import('../../modules/basins/pages/BasinList'));
const BasinForm = lazy(() => import('../../modules/basins/pages/BasinForm'));
const PickupOrderList = lazy(() => import('../../modules/pickupOrders/pages/PickupOrderList'));
const PickupOrderForm = lazy(() => import('../../modules/pickupOrders/pages/PickupOrderForm'));
const PickupOrderDetail = lazy(() => import('../../modules/pickupOrders/pages/PickupOrderDetail'));
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
    path: '/profile',
    element: Profile,
    protected: true,
  },
  // Gestione Utenti (solo admin)
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
    path: '/users/edit/:id',
    element: UserForm,
    protected: true,
  },
  // Gestione Clienti
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
    path: '/clients/edit/:id',
    element: ClientForm,
    protected: true,
  },
  // Gestione Bacini
  {
    path: '/basins',
    element: BasinList,
    protected: true,
  },
  {
    path: '/basins/client/:clientId',
    element: BasinList,
    protected: true,
  },
  {
    path: '/basins/new',
    element: BasinForm,
    protected: true,
  },
  {
    path: '/basins/new/:clientId',
    element: BasinForm,
    protected: true,
  },
  {
    path: '/basins/edit/:id',
    element: BasinForm,
    protected: true,
  },
  // Gestione Buoni di Ritiro
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
    path: '/pickup-orders/edit/:id',
    element: PickupOrderForm,
    protected: true,
  },
  {
    path: '/pickup-orders/:id',
    element: PickupOrderDetail,
    protected: true,
  },
  {
    path: '*',
    element: NotFound,
    protected: false,
  },
];