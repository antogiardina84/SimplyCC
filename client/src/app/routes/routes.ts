import { type ComponentType, lazy } from 'react';

// Lazy import corretto per TypeScript
const Login = lazy(() => import('../../modules/auth/pages/Login'));
const Register = lazy(() => import('../../modules/auth/pages/Register'));
const Dashboard = lazy(() => import('../../modules/dashboard/pages/Dashboard'));
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
    path: '*',
    element: NotFound,
    protected: false,
  },
];