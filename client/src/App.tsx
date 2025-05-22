import { useState } from 'react';
import { Box } from '@mui/material';
import AppProviders from './app/providers/AppProviders';
import Navbar from './app/layout/Navbar';
import Sidebar from './app/layout/Sidebar';
import AppRoutes from './app/routes';
import * as authService from './modules/auth/services/authService';

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isAuthenticated = authService.isAuthenticated();

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <AppProviders>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar onMenuClick={handleSidebarToggle} />
        
        <Box sx={{ display: 'flex', flex: 1, pt: '64px' }}>
          {isAuthenticated && (
            <Sidebar open={sidebarOpen} onToggle={handleSidebarToggle} />
          )}
          
          <Box 
            component="main" 
            sx={{ 
              flex: 1,
              backgroundColor: '#f8f9fa',
              minHeight: 'calc(100vh - 64px)',
              transition: 'margin-left 0.3s ease',
            }}
          >
            <AppRoutes />
          </Box>
        </Box>
      </Box>
    </AppProviders>
  );
};

export default App;