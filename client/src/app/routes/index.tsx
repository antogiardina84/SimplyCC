// client/src/app/routes/index.tsx

import { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { routes } from './routes';
import ProtectedRoute from './ProtectedRoute';
import { CircularProgress, Box } from '@mui/material';
import MainLayout from '../layout/MainLayout';

const AppRoutes = () => {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      }
    >
      <Routes>
        {routes.map((route) => {
          const Element = route.element;
          
          if (route.protected) {
            return (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Element />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
            );
          } else {
            // Le route pubbliche non hanno il MainLayout
            return (
              <Route
                key={route.path}
                path={route.path}
                element={<Element />}
              />
            );
          }
        })}
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;