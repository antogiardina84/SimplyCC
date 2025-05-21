import AppProviders from './app/providers/appProviders';
import Navbar from './app/layout/Navbar';
import AppRoutes from './app/routes';

const App = () => {
  return (
    <AppProviders>
      <Navbar />
      <AppRoutes />
    </AppProviders>
  );
};

export default App;