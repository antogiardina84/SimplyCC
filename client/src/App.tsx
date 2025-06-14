// client/src/App.tsx - VERSIONE COMPLETA CORRETTA

import { useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import AppProviders from './app/providers/AppProviders';
import Navbar from './app/layout/Navbar';
import MainLayout from './app/layout/MainLayout';
import AppRoutes from './app/routes';

const AppContent = () => {
  const location = useLocation();
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Navbar />
      {isAuthPage ? (
        // Pagine di autenticazione senza layout
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <AppRoutes />
        </Box>
      ) : (
        // Pagine principali con layout completo
        <MainLayout>
          <AppRoutes />
        </MainLayout>
      )}
    </Box>
  );
};

// App principale con providers
const App = () => {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
};

export default App;