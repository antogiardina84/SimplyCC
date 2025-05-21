import { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { routes } from './routes';
import ProtectedRoute from './ProtectedRoute';
import { CircularProgress, Box } from '@mui/material';

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
          
          return (
            <Route
              key={route.path}
              path={route.path}
              element={
                route.protected ? (
                  <ProtectedRoute>
                    <Element />
                  </ProtectedRoute>
                ) : (
                  <Element />
                )
              }
            />
          );
        })}
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;