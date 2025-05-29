import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Drawer, 
  Toolbar,
  List, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Collapse,
  Typography,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  People as PeopleIcon, 
  Business as BusinessIcon, 
  ViewList as ViewListIcon, 
  ExpandLess, 
  ExpandMore, 
  Assignment as AssignmentIcon, 
  LocalShipping as ShippingIcon,
  Science as ScienceIcon,
  Inventory as InventoryIcon,
  Assessment as ReportIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import * as authService from '../../modules/auth/services/authService';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  drawerWidth: number;
}

const Sidebar = ({ open, onToggle, drawerWidth }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [clientsOpen, setClientsOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'ADMIN';

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      onToggle();
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const drawer = (
    <div>
      <Toolbar />
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
          Menu Principale
        </Typography>
      </Box>
      <Divider />
      
      <List sx={{ px: 1 }}>
        <ListItemButton
          onClick={() => handleNavigation('/')}
          selected={isActive('/')}
          sx={{ mb: 0.5, borderRadius: 1 }}
        >
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>

        {isAdmin && (
          <ListItemButton
            onClick={() => handleNavigation('/users')}
            selected={isActive('/users')}
            sx={{ mb: 0.5, borderRadius: 1 }}
          >
            <ListItemIcon>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="Gestione Utenti" />
          </ListItemButton>
        )}

        <ListItemButton
          onClick={() => setClientsOpen(!clientsOpen)}
          sx={{ mb: 0.5, borderRadius: 1 }}
        >
          <ListItemIcon>
            <BusinessIcon />
          </ListItemIcon>
          <ListItemText primary="Clienti & Bacini" />
          {clientsOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        
        <Collapse in={clientsOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton
              sx={{ pl: 4, mb: 0.5, borderRadius: 1 }}
              onClick={() => handleNavigation('/clients')}
              selected={isActive('/clients')}
            >
              <ListItemIcon>
                <BusinessIcon />
              </ListItemIcon>
              <ListItemText primary="Gestione Clienti" />
            </ListItemButton>
            
            <ListItemButton
              sx={{ pl: 4, mb: 0.5, borderRadius: 1 }}
              onClick={() => handleNavigation('/basins')}
              selected={isActive('/basins')}
            >
              <ListItemIcon>
                <ViewListIcon />
              </ListItemIcon>
              <ListItemText primary="Gestione Bacini" />
            </ListItemButton>
          </List>
        </Collapse>

        <ListItemButton
          onClick={() => setOrdersOpen(!ordersOpen)}
          sx={{ mb: 0.5, borderRadius: 1 }}
        >
          <ListItemIcon>
            <AssignmentIcon />
          </ListItemIcon>
          <ListItemText primary="Ordini & Ritiri" />
          {ordersOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        
        <Collapse in={ordersOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton
              sx={{ pl: 4, mb: 0.5, borderRadius: 1 }}
              onClick={() => handleNavigation('/pickup-orders')}
              selected={isActive('/pickup-orders')}
            >
              <ListItemIcon>
                <DescriptionIcon />
              </ListItemIcon>
              <ListItemText primary="Buoni di Ritiro" />
            </ListItemButton>

            <ListItemButton
              sx={{ pl: 4, mb: 0.5, borderRadius: 1 }}
              onClick={() => handleNavigation('/pickuporder/upload')}
              selected={isActive('/pickuporder/upload')}
            >
              <ListItemIcon>
                <DescriptionIcon />
              </ListItemIcon>
              <ListItemText primary="Carica Buoni di Ritiro" />
            </ListItemButton>
            
            <ListItemButton
              sx={{ pl: 4, mb: 0.5, borderRadius: 1 }}
              onClick={() => handleNavigation('/deliveries')}
              selected={isActive('/deliveries')}
            >
              <ListItemIcon>
                <AssignmentIcon />
              </ListItemIcon>
              <ListItemText primary="Conferimenti" />
            </ListItemButton>
            
            <ListItemButton
              sx={{ pl: 4, mb: 0.5, borderRadius: 1 }}
              onClick={() => handleNavigation('/processing')}
              selected={isActive('/processing')}
            >
              <ListItemIcon>
                <ScienceIcon />
              </ListItemIcon>
              <ListItemText primary="Lavorazioni" />
            </ListItemButton>
            
            <ListItemButton
              sx={{ pl: 4, mb: 0.5, borderRadius: 1 }}
              onClick={() => handleNavigation('/shipments')}
              selected={isActive('/shipments')}
            >
              <ListItemIcon>
                <ShippingIcon />
              </ListItemIcon>
              <ListItemText primary="Uscite" />
            </ListItemButton>
          </List>
        </Collapse>

        <ListItemButton
          onClick={() => handleNavigation('/analysis')}
          selected={isActive('/analysis')}
          sx={{ mb: 0.5, borderRadius: 1 }}
        >
          <ListItemIcon>
            <ScienceIcon />
          </ListItemIcon>
          <ListItemText primary="Analisi Merceologiche" />
        </ListItemButton>
        
        <ListItemButton
          onClick={() => handleNavigation('/inventory')}
          selected={isActive('/inventory')}
          sx={{ mb: 0.5, borderRadius: 1 }}
        >
          <ListItemIcon>
            <InventoryIcon />
          </ListItemIcon>
          <ListItemText primary="Gestione Giacenze" />
        </ListItemButton>
        
        <ListItemButton
          onClick={() => handleNavigation('/reports')}
          selected={isActive('/reports')}
          sx={{ mb: 0.5, borderRadius: 1 }}
        >
          <ListItemIcon>
            <ReportIcon />
          </ListItemIcon>
          <ListItemText primary="Report & Attestazioni" />
        </ListItemButton>
      </List>
    </div>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      open={open}
      onClose={onToggle}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile
      }}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#fafafa',
          borderRight: '1px solid #e0e0e0',
        },
      }}
    >
      {drawer}
    </Drawer>
  );
};

export default Sidebar;
