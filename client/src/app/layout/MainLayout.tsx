// client/src/app/layout/MainLayout.tsx

import { useState } from 'react';
import { Box, CssBaseline, useTheme, useMediaQuery } from '@mui/material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <Navbar onMenuClick={toggleSidebar} />
      <Sidebar open={sidebarOpen} onToggle={toggleSidebar} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          transition: theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: { 
            xs: 0,
            md: sidebarOpen ? '240px' : 0 
          },
          width: { 
            xs: '100%',
            md: sidebarOpen ? 'calc(100% - 240px)' : '100%' 
          },
          paddingTop: '64px', // Spazio per la navbar
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Box sx={{ flexGrow: 1, p: { xs: 1, sm: 2, md: 3 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;