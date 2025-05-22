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
  useTheme,
  useMediaQuery,
  IconButton,
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
    path: '/users',
  },
  {
    text: 'Clienti & Bacini',
    icon: <Business />,
    children: [
      {
        text: 'Gestione Clienti',
        icon: <People />,
        path: '/clients',
      },
      {
        text: 'Gestione Bacini',
        icon: <Domain />,
        path: '/basins',
      },
    ],
  },
  {
    text: 'Ordini & Ritiri',
    icon: <Assignment />,
    children: [
      {
        text: 'Buoni di Ritiro',
        icon: <Assignment />,
        path: '/pickup-orders',
      },
      {
        text: 'Conferimenti',
        icon: <LocalShipping />,
        path: '/deliveries',
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
    path: '/shipments',
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['Clienti & Bacini', 'Ordini & Ritiri']);

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
    return location.pathname === path;
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
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
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
          <Box
            sx={{
              width: 40,
              height: 40,
              backgroundColor: 'white',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            <Dashboard sx={{ color: 'black', fontSize: 24 }} />
          </Box>
          <Box sx={{ color: 'white', fontWeight: 600, fontSize: '1.1rem' }}>
            SGR
          </Box>
        </Box>
      </Box>
      
      <List sx={{ flexGrow: 1, py: 1 }}>
        {menuItems.map(item => renderMenuItem(item))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile menu button */}
      {isMobile && (
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={handleDrawerToggle}
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 1300,
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.9)',
            },
          }}
        >
          <Menu />
        </IconButton>
      )}

      {/* Desktop Drawer */}
      {!isMobile && (
        <Drawer
          variant="permanent"
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
          minHeight: '100vh',
          ml: isMobile ? 0 : 0, // No margin since drawer is permanent
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;