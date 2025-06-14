import { useState, type ReactNode } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  useMediaQuery,
  IconButton,
  Typography,
} from '@mui/material';
import {
  Dashboard,
  People,
  Business,
  Assignment,
  LocalShipping,
  ExpandLess,
  ExpandMore,
  Science,
  Inventory,
  Assessment,
  Menu,
  Group,
  Domain,
  Add,
  CalendarToday,
  PersonPin,
  CheckCircle,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 280;

interface MainLayoutProps {
  children: ReactNode;
}

interface MenuItem {
  text: string;
  icon: ReactNode;
  path?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    text: 'Dashboard',
    icon: <Dashboard />,
    path: '/',
  },
  {
    text: 'Gestione Utenti',
    icon: <Group />,
    children: [
      {
        text: 'Lista Utenti',
        icon: <People />,
        path: '/users',
      },
      {
        text: 'Nuovo Utente',
        icon: <Group />,
        path: '/users/new',
      },
    ],
  },
  {
    text: 'Clienti & Bacini',
    icon: <Business />,
    children: [
      {
        text: 'Lista Clienti',
        icon: <People />,
        path: '/clients',
      },
      {
        text: 'Nuovo Cliente',
        icon: <Business />,
        path: '/clients/new',
      },
      {
        text: 'Lista Bacini',
        icon: <Domain />,
        path: '/basins',
      },
      {
        text: 'Nuovo Bacino',
        icon: <Add />,
        path: '/basins/new',
      },
    ],
  },
  {
    text: 'Conferimenti',
    icon: <LocalShipping />,
    path: '/deliveries',
  },
  {
    text: 'Buoni di Ritiro',
    icon: <Assignment />,
    children: [
      {
        text: 'Lista Buoni',
        icon: <Assignment />,
        path: '/pickup-orders',
      },
      {
        text: 'Carica da PDF',
        icon: <Add />,
        path: '/pickup-orders/upload',
      },
    ],
  },
  {
    text: 'Lavorazioni',
    icon: <Science />,
    path: '/processing',
  },
  {
    text: 'Spedizioni',
    icon: <LocalShipping />,
    children: [
      {
        text: 'Calendario Spedizioni',
        icon: <CalendarToday />,
        path: '/shipments/calendar',
      },
      {
        text: 'Dashboard Operatore',
        icon: <PersonPin />,
        path: '/shipments/operator',
      },
      {
        text: 'Finalizzazione Manager',
        icon: <CheckCircle />,
        path: '/shipments/manager',
      },
    ],
  },
  {
    text: 'Analisi',
    icon: <Science />,
    path: '/analysis',
  },
  {
    text: 'Giacenze',
    icon: <Inventory />,
    path: '/inventory',
  },
  {
    text: 'Report',
    icon: <Assessment />,
    path: '/reports',
  },
];

const MainLayout = ({ children }: MainLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 1199px)');
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['Clienti & Bacini', 'Buoni di Ritiro', 'Spedizioni']);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleExpandClick = (text: string) => {
    setExpandedItems(prev =>
      prev.includes(text)
        ? prev.filter(item => item !== text)
        : [...prev, text]
    );
  };

  const isSelected = (path?: string) => {
    if (!path) return false;
    if (path === '/' && location.pathname === '/') return true;
    return location.pathname.startsWith(path) && path !== '/';
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const renderMenuItem = (item: MenuItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.text);
    const selected = isSelected(item.path);

    return (
      <Box key={item.text}>
        <ListItem disablePadding>
          <ListItemButton
            selected={selected}
            onClick={() => {
              if (hasChildren) {
                handleExpandClick(item.text);
              } else if (item.path) {
                handleNavigation(item.path);
              }
            }}
            sx={{
              pl: 2 + depth * 2,
              borderRadius: '0 25px 25px 0',
              margin: '2px 8px 2px 0',
              minHeight: '48px',
              '&.Mui-selected': {
                backgroundColor: 'rgba(255,255,255,0.15)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.2)',
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.08)',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'white', minWidth: '42px' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text}
              primaryTypographyProps={{
                fontWeight: selected ? 600 : 500,
                fontSize: '0.95rem',
              }}
            />
            {hasChildren && (
              isExpanded ? <ExpandLess sx={{ color: 'white' }} /> : <ExpandMore sx={{ color: 'white' }} />
            )}
          </ListItemButton>
        </ListItem>
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map(child => renderMenuItem(child, depth + 1))}
            </List>
          </Collapse>
        )}
      </Box>
    );
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
        <Box sx={{ textAlign: 'center', py: 1 }}>
          <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '1.2rem' }}>
            Sistema Gestione Rifiuti
          </Typography>
        </Box>
      </Box>
      
      <List sx={{ flexGrow: 1, py: 1 }}>
        {menuItems.map(item => renderMenuItem(item))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Mobile menu button */}
      <IconButton
        color="inherit"
        aria-label="open drawer"
        onClick={handleDrawerToggle}
        sx={{
          display: isMobile ? 'flex' : 'none',
          position: 'fixed',
          top: 10,
          left: 10,
          zIndex: 9999,
          backgroundColor: '#666666 !important',
          color: 'white !important',
          width: 50,
          height: 50,
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.5) !important',
          border: '2px solid #ffffff !important',
          '&:hover': {
            backgroundColor: '#555555 !important',
          },
          visibility: 'visible !important',
          opacity: '1 !important',
        }}
      >
        <Menu sx={{ fontSize: 24, color: 'white' }} />
      </IconButton>

      {/* Desktop Drawer */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          className="desktop-drawer"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: 'border-box',
              backgroundColor: '#000000',
              borderRight: 'none',
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          className="mobile-drawer"
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: 'border-box',
              backgroundColor: '#000000',
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          backgroundColor: '#f5f5f5',
          width: '100%',
          overflow: 'auto',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;