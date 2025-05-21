// client/src/app/layout/Sidebar.tsx

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, List, ListItem, ListItemIcon, ListItemText, Drawer, Divider, 
  IconButton, Collapse, useTheme, useMediaQuery } from '@mui/material';
import { Dashboard as DashboardIcon, People as PeopleIcon, Business as BusinessIcon, 
  ViewList as ViewListIcon, ChevronLeft, ChevronRight, ExpandLess, ExpandMore, 
  Menu as MenuIcon } from '@mui/icons-material';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

const Sidebar = ({ open, onToggle }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [clientsOpen, setClientsOpen] = useState(false);

  const handleClientsToggle = () => {
    setClientsOpen(!clientsOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      onToggle();
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const drawerWidth = 240;

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      anchor="left"
      open={open}
      onClose={onToggle}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', p: 1 }}>
        <IconButton onClick={onToggle}>
          {theme.direction === 'ltr' ? <ChevronLeft /> : <ChevronRight />}
        </IconButton>
      </Box>
      <Divider />
      <List>
        <ListItem button onClick={() => handleNavigation('/')} selected={isActive('/')}>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        
        <ListItem button onClick={() => handleNavigation('/users')} selected={isActive('/users')}>
          <ListItemIcon>
            <PeopleIcon />
          </ListItemIcon>
          <ListItemText primary="Utenti" />
        </ListItem>
        
        <ListItem button onClick={handleClientsToggle}>
          <ListItemIcon>
            <BusinessIcon />
          </ListItemIcon>
          <ListItemText primary="Clienti & Bacini" />
          {clientsOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        
        <Collapse in={clientsOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem 
              button 
              sx={{ pl: 4 }} 
              onClick={() => handleNavigation('/clients')} 
              selected={isActive('/clients')}
            >
              <ListItemIcon>
                <BusinessIcon />
              </ListItemIcon>
              <ListItemText primary="Gestione Clienti" />
            </ListItem>
            
            <ListItem 
              button 
              sx={{ pl: 4 }} 
              onClick={() => handleNavigation('/basins')} 
              selected={isActive('/basins')}
            >
              <ListItemIcon>
                <ViewListIcon />
              </ListItemIcon>
              <ListItemText primary="Gestione Bacini" />
            </ListItem>
          </List>
        </Collapse>
      </List>
    </Drawer>
  );
};

export default Sidebar;