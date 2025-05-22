import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  List, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Drawer, 
  Divider, 
  Collapse, 
  useTheme, 
  useMediaQuery,
  Typography
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
}

const Sidebar = ({ open, onToggle }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [clientsOpen, setClientsOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'ADMIN';

  const handleClientsToggle = () => {
    setClientsOpen(!clientsOpen);
  };

  const handleOrdersToggle = () => {
    setOrdersOpen(!ordersOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      onToggle();
    }
  };

  const isActive = (path: string | string[], exact = false) => {
    if (Array.isArray(path)) {
      return path.some(p => location.pathname.startsWith(p));
    }
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  };

  const drawerWidth = 280;

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/',
      action: () => handleNavigation('/'),
      exact: true
    },
    ...(isAdmin ? [{
      text: 'Gestione Utenti',
      icon: <PeopleIcon />,
      path: '/users',
      action: () => handleNavigation('/users')
    }] : []),
    {
      text: 'Clienti & Bacini',
      icon: <BusinessIcon />,
      isExpandable: true,
      expanded: clientsOpen,
      onToggle: handleClientsToggle,
      subItems: [
        {
          text: 'Gestione Clienti',
          icon: <BusinessIcon />,
          path: '/clients',
          action: () => handleNavigation('/clients')
        },
        {
          text: 'Gestione Bacini',
          icon: <ViewListIcon />,
          path: '/basins',
          action: () => handleNavigation('/basins')
        }
      ]
    },
    {
      text: 'Ordini & Ritiri',
      icon: <AssignmentIcon />,
      isExpandable: true,
      expanded: ordersOpen,
      onToggle: handleOrdersToggle,
      subItems: [
        {
          text: 'Buoni di Ritiro',
          icon: <DescriptionIcon />,
          path: '/pickup-orders',
          action: () => handleNavigation('/pickup-orders')
        },
        {
          text: 'Conferimenti',
          icon: <AssignmentIcon />,
          path: '/deliveries',
          action: () => handleNavigation('/deliveries')
        },
        {
          text: 'Lavorazioni',
          icon: <ScienceIcon />,
          path: '/processing',
          action: () => handleNavigation('/processing')
        },
        {
          text: 'Uscite',
          icon: <ShippingIcon />,
          path: '/shipments',
          action: () => handleNavigation('/shipments')
        }
      ]
    },
    {
      text: 'Analisi Merceologiche',
      icon: <ScienceIcon />,
      path: '/analysis',
      action: () => handleNavigation('/analysis')
    },
    {
      text: 'Gestione Giacenze',
      icon: <InventoryIcon />,
      path: '/inventory',
      action: () => handleNavigation('/inventory')
    },
    {
      text: 'Report & Attestazioni',
      icon: <ReportIcon />,
      path: '/reports',
      action: () => handleNavigation('/reports')
    }
  ];

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
          top: '64px',
          height: 'calc(100% - 64px)',
          backgroundColor: '#fafafa',
          borderRight: '1px solid #e0e0e0',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#333', fontSize: '1.1rem' }}>
          Menu Principale
        </Typography>
      </Box>
      <Divider />
      
      <List sx={{ pt: 1, px: 1 }}>
        {menuItems.map((item) => (
          <Box key={item.text}>
            {item.isExpandable ? (
              <>
                <ListItemButton
                  onClick={item.onToggle}
                  sx={{
                    mb: 0.5,
                    borderRadius: '8px',
                    minHeight: '48px',
                    '&:hover': {
                      backgroundColor: '#f0f0f0',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: '#666', minWidth: '40px' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    sx={{ 
                      '& .MuiTypography-root': { 
                        fontWeight: 500,
                        fontSize: '0.95rem'
                      } 
                    }}
                  />
                  {item.expanded ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={item.expanded} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.subItems?.map((subItem) => (
                      <ListItemButton
                        key={subItem.text}
                        onClick={subItem.action}
                        selected={isActive(subItem.path)}
                        sx={{
                          pl: 4,
                          mb: 0.5,
                          borderRadius: '8px',
                          minHeight: '44px',
                          '&:hover': {
                            backgroundColor: '#f0f0f0',
                          },
                          '&.Mui-selected': {
                            backgroundColor: '#e3f2fd',
                            '&:hover': {
                              backgroundColor: '#e3f2fd',
                            },
                            '& .MuiListItemIcon-root': {
                              color: '#1976d2',
                            },
                            '& .MuiListItemText-primary': {
                              color: '#1976d2',
                              fontWeight: 600,
                            },
                          },
                        }}
                      >
                        <ListItemIcon sx={{ 
                          minWidth: '36px',
                          color: isActive(subItem.path) ? '#1976d2' : '#666'
                        }}>
                          {subItem.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={subItem.text}
                          sx={{ 
                            '& .MuiTypography-root': { 
                              fontSize: '0.9rem'
                            } 
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </>
            ) : (
              <ListItemButton
                onClick={item.action}
                selected={item.exact ? isActive(item.path!, true) : isActive(item.path!)}
                sx={{
                  mb: 0.5,
                  borderRadius: '8px',
                  minHeight: '48px',
                  '&:hover': {
                    backgroundColor: '#f0f0f0',
                  },
                  '&.Mui-selected': {
                    backgroundColor: '#e3f2fd',
                    '&:hover': {
                      backgroundColor: '#e3f2fd',
                    },
                    '& .MuiListItemIcon-root': {
                      color: '#1976d2',
                    },
                    '& .MuiListItemText-primary': {
                      color: '#1976d2',
                      fontWeight: 600,
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ 
                  color: (item.exact ? isActive(item.path!, true) : isActive(item.path!)) ? '#1976d2' : '#666',
                  minWidth: '40px'
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  sx={{ 
                    '& .MuiTypography-root': { 
                      fontWeight: 500,
                      fontSize: '0.95rem'
                    } 
                  }}
                />
              </ListItemButton>
            )}
          </Box>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;