import { useLocation } from 'react-router-dom';
import AppProviders from './app/providers/AppProviders';
import Navbar from './app/layout/Navbar';
import MainLayout from './app/layout/MainLayout';
import AppRoutes from './app/routes';

const AppContent = () => {
  const location = useLocation();
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  return (
    <>
      {isAuthPage ? (
        // Pagine di autenticazione senza layout
        <>
          <Navbar />
          <AppRoutes />
        </>
      ) : (
        // Pagine principali con layout completo
        <>
          <Navbar />
          <MainLayout>
            <AppRoutes />
          </MainLayout>
        </>
      )}
    </>
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