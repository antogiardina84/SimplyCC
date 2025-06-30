// client/src/core/layout/MainLayout.tsx - VERSIONE CORRETTA

import { type ReactNode } from 'react';
import { Box } from '@mui/material';
import ResponsiveNavbar from './ResponsiveNavbar';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Navbar responsive con menu dropdown */}
      <ResponsiveNavbar />
      
      {/* Main content area - ora senza sidebar fissa */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          backgroundColor: '#f5f5f5', // Mantieni il tuo background
          overflow: 'auto',
          position: 'relative',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;