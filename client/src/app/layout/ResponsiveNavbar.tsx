// client/src/app/layout/ResponsiveNavbar.tsx - VERSIONE CORRETTA COMPLETA CON PROCESSING E INVENTORY

import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Chip,
  useTheme,
  alpha,
  useMediaQuery,
  List,
  ListItemButton,
  Collapse,
  SwipeableDrawer,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Logout,
  Person,
  Settings,
  Dashboard,
  People,
  Business,
  Assignment,
  LocalShipping,
  Science,
  Inventory,
  Assessment,
  Group,
  Domain,
  Add,
  CalendarToday,
  RecyclingOutlined,
  PersonAdd,
  KeyboardArrowDown,
  Notifications,
  Help,
  Menu as MenuIcon,
  ExpandLess,
  ExpandMore,
  Close,
  // ICONE CORRETTE PER PROCESSING E INVENTORY
  Settings as ProcessingIcon, // Sostituto per Precision
  Inventory2 as InventoryIcon,
  Factory as ProductionIcon,
  Analytics as ReportIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import * as authService from '../../modules/auth/services/authService';

interface ResponsiveNavbarProps {
  onToggleSidebar?: () => void;
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

const ResponsiveNavbar: React.FC<ResponsiveNavbarProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  
  // Stati per gestione utente corrente
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  
  // Stati per i menu dropdown (desktop)
  const [usersMenuAnchor, setUsersMenuAnchor] = useState<null | HTMLElement>(null);
  const [clientsMenuAnchor, setClientsMenuAnchor] = useState<null | HTMLElement>(null);
  const [deliveriesMenuAnchor, setDeliveriesMenuAnchor] = useState<null | HTMLElement>(null);
  const [ordersMenuAnchor, setOrdersMenuAnchor] = useState<null | HTMLElement>(null);
  const [shipmentsMenuAnchor, setShipmentsMenuAnchor] = useState<null | HTMLElement>(null);
  // NUOVI STATI AGGIUNTI PER PROCESSING E INVENTORY
  const [processingMenuAnchor, setProcessingMenuAnchor] = useState<null | HTMLElement>(null);
  const [inventoryMenuAnchor, setInventoryMenuAnchor] = useState<null | HTMLElement>(null);
  const [userProfileAnchor, setUserProfileAnchor] = useState<null | HTMLElement>(null);

  // Stati per il menu mobile
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMobile, setExpandedMobile] = useState<string[]>([]);

  const token = localStorage.getItem('token');

  // Carica i dati dell'utente corrente
  useEffect(() => {
    const loadCurrentUser = async () => {
      if (!token) {
        setUserLoading(false);
        return;
      }

      try {
        setUserLoading(true);
        setUserError(null);
        
        console.log('🔄 Caricamento dati utente corrente...');
        
        // Prova prima a ottenere dal localStorage
        const localUser = authService.getCurrentUser();
        if (localUser) {
          const formattedUser: CurrentUser = {
            id: localUser.id,
            name: localUser.name || `${localUser.firstName || ''} ${localUser.lastName || ''}`.trim() || localUser.email,
            email: localUser.email,
            role: localUser.role,
            firstName: localUser.firstName,
            lastName: localUser.lastName,
            avatar: localUser.avatar
          };
          setCurrentUser(formattedUser);
        }

        // Aggiorna sempre dal server per avere dati freschi
        try {
          const serverUser = await authService.getCurrentUserFromServer();
          
          const formattedServerUser: CurrentUser = {
            id: serverUser.id,
            name: serverUser.name || `${serverUser.firstName || ''} ${serverUser.lastName || ''}`.trim() || serverUser.email,
            email: serverUser.email,
            role: serverUser.role,
            firstName: serverUser.firstName,
            lastName: serverUser.lastName,
            avatar: serverUser.avatar
          };

          setCurrentUser(formattedServerUser);
          
          // Aggiorna anche il localStorage con i dati freschi
          localStorage.setItem('user', JSON.stringify(serverUser));
          
          console.log('✅ Dati utente caricati dal server:', {
            id: formattedServerUser.id,
            name: formattedServerUser.name,
            email: formattedServerUser.email,
            role: formattedServerUser.role
          });
        } catch (serverError: any) {
          console.log('⚠️ Fallback al localStorage per dati utente');
          
          // Se errore 401, probabilmente token scaduto
          if (serverError.response?.status === 401) {
            console.log('🚪 Token scaduto, redirect al login');
            authService.logout();
            navigate('/login');
            return;
          }
          
          // Per altri errori, continua con i dati locali se disponibili
          if (!localUser) {
            throw serverError;
          }
        }
        
      } catch (error: any) {
        console.error('❌ Errore nel caricamento dati utente:', error);
        setUserError('Errore nel caricamento profilo utente');
        
        // Se nessun dato locale disponibile, redirect al login
        const localUser = authService.getCurrentUser();
        if (!localUser) {
          console.log('🚪 Nessun dato utente disponibile, redirect al login');
          authService.logout();
          navigate('/login');
        }
      } finally {
        setUserLoading(false);
      }
    };

    loadCurrentUser();
  }, [token, navigate]);

  // Helper per verificare se il path è attivo
  const isActivePath = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    return location.pathname.startsWith(path) && path !== '/';
  };

  // Handlers per i menu desktop
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, setAnchor: (anchor: HTMLElement | null) => void) => {
    setAnchor(event.currentTarget);
  };

  const handleMenuClose = (setAnchor: (anchor: HTMLElement | null) => void) => {
    setAnchor(null);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    // Chiudi tutti i menu
    setUsersMenuAnchor(null);
    setClientsMenuAnchor(null);
    setDeliveriesMenuAnchor(null);
    setOrdersMenuAnchor(null);
    setShipmentsMenuAnchor(null);
    // AGGIUNTI I NUOVI MENU
    setProcessingMenuAnchor(null);
    setInventoryMenuAnchor(null);
    setMobileMenuOpen(false);
  };

  // Logout con pulizia completa
  const handleLogout = () => {
    console.log('🚪 Logout utente...');
    authService.logout();
    setCurrentUser(null);
    setUserProfileAnchor(null);
    setMobileMenuOpen(false);
    navigate('/login');
  };

  // Handlers per il menu mobile
  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileExpand = (section: string) => {
    setExpandedMobile(prev => 
      prev.includes(section) 
        ? prev.filter(item => item !== section)
        : [...prev, section]
    );
  };

  // Funzione per ottenere iniziali utente
  const getUserInitials = (user: CurrentUser | null): string => {
    if (!user) return '?';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    
    if (user.name && user.name !== user.email) {
      const parts = user.name.split(' ').filter(part => part.length > 0);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      } else if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
      }
    }
    
    return user.email[0].toUpperCase();
  };

  // Style per i bottoni del menu principale
  const menuButtonStyle = (isActive: boolean) => ({
    color: 'white',
    fontWeight: 500,
    fontSize: '0.9rem',
    textTransform: 'none' as const,
    px: 1.5,
    py: 1,
    borderRadius: 1,
    backgroundColor: isActive ? alpha(theme.palette.common.white, 0.15) : 'transparent',
    '&:hover': {
      backgroundColor: alpha(theme.palette.common.white, 0.1),
    },
    '& .MuiSvgIcon-root': {
      fontSize: '1rem'
    }
  });

  // Mobile Menu Content
  const mobileMenuContent = (
    <Box sx={{ width: 280, height: '100%', backgroundColor: '#000' }}>
      {/* Header del mobile menu */}
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <RecyclingOutlined sx={{ fontSize: 24, mr: 1, color: theme.palette.primary.light }} />
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
            SGR Pro
          </Typography>
        </Box>
        <IconButton onClick={() => setMobileMenuOpen(false)} sx={{ color: 'white' }}>
          <Close />
        </IconButton>
      </Box>

      {/* Menu Items */}
      <List sx={{ py: 1 }}>
        {/* Dashboard */}
        <ListItemButton
          onClick={() => handleNavigation('/')}
          selected={isActivePath('/')}
          sx={{ 
            color: 'white',
            '&.Mui-selected': { backgroundColor: 'rgba(255,255,255,0.1)' },
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' }
          }}
        >
          <ListItemIcon sx={{ color: 'white' }}>
            <Dashboard />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>

        {/* Gestione Utenti */}
        <ListItemButton
          onClick={() => handleMobileExpand('users')}
          sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
        >
          <ListItemIcon sx={{ color: 'white' }}>
            <Group />
          </ListItemIcon>
          <ListItemText primary="Utenti" />
          {expandedMobile.includes('users') ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={expandedMobile.includes('users')}>
          <List component="div" disablePadding>
            <ListItemButton 
              sx={{ pl: 4, color: 'rgba(255,255,255,0.8)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
              onClick={() => handleNavigation('/users')}
            >
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.8)' }}>
                <People fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Lista Utenti" />
            </ListItemButton>
            <ListItemButton 
              sx={{ pl: 4, color: 'rgba(255,255,255,0.8)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
              onClick={() => handleNavigation('/users/new')}
            >
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.8)' }}>
                <PersonAdd fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Nuovo Utente" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Clienti & Bacini */}
        <ListItemButton
          onClick={() => handleMobileExpand('clients')}
          sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
        >
          <ListItemIcon sx={{ color: 'white' }}>
            <Business />
          </ListItemIcon>
          <ListItemText primary="Clienti & Bacini" />
          {expandedMobile.includes('clients') ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={expandedMobile.includes('clients')}>
          <List component="div" disablePadding>
            <ListItemButton 
              sx={{ pl: 4, color: 'rgba(255,255,255,0.8)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
              onClick={() => handleNavigation('/clients')}
            >
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.8)' }}>
                <People fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Lista Clienti" />
            </ListItemButton>
            <ListItemButton 
              sx={{ pl: 4, color: 'rgba(255,255,255,0.8)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
              onClick={() => handleNavigation('/clients/new')}
            >
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.8)' }}>
                <Business fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Nuovo Cliente" />
            </ListItemButton>
            <ListItemButton 
              sx={{ pl: 4, color: 'rgba(255,255,255,0.8)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
              onClick={() => handleNavigation('/basins')}
            >
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.8)' }}>
                <Domain fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Lista Bacini" />
            </ListItemButton>
            <ListItemButton 
              sx={{ pl: 4, color: 'rgba(255,255,255,0.8)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
              onClick={() => handleNavigation('/basins/new')}
            >
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.8)' }}>
                <Add fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Nuovo Bacino" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Conferimenti */}
        <ListItemButton
          onClick={() => handleMobileExpand('deliveries')}
          sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
        >
          <ListItemIcon sx={{ color: 'white' }}>
            <RecyclingOutlined />
          </ListItemIcon>
          <ListItemText primary="Conferimenti" />
          {expandedMobile.includes('deliveries') ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={expandedMobile.includes('deliveries')}>
          <List component="div" disablePadding>
            <ListItemButton 
              sx={{ pl: 4, color: 'rgba(255,255,255,0.8)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
              onClick={() => handleNavigation('/deliveries/calendar')}
            >
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.8)' }}>
                <CalendarToday fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Calendario" />
              <Chip label="★" size="small" sx={{ bgcolor: theme.palette.primary.main, color: 'white', fontSize: '0.7rem' }} />
            </ListItemButton>
            <ListItemButton 
              sx={{ pl: 4, color: 'rgba(255,255,255,0.8)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
              onClick={() => handleNavigation('/deliveries')}
            >
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.8)' }}>
                <RecyclingOutlined fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Lista Conferimenti" />
            </ListItemButton>
            <ListItemButton 
              sx={{ pl: 4, color: 'rgba(255,255,255,0.8)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
              onClick={() => handleNavigation('/deliveries/contributors')}
            >
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.8)' }}>
                <People fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Conferitori" />
            </ListItemButton>
            <ListItemButton 
              sx={{ pl: 4, color: 'rgba(255,255,255,0.8)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
              onClick={() => handleNavigation('/deliveries/material-types')}
            >
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.8)' }}>
                <Science fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Tipologie Materiali" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Buoni di Ritiro */}
        <ListItemButton
          onClick={() => handleMobileExpand('orders')}
          sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
        >
          <ListItemIcon sx={{ color: 'white' }}>
            <Assignment />
          </ListItemIcon>
          <ListItemText primary="Ordini" />
          {expandedMobile.includes('orders') ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={expandedMobile.includes('orders')}>
          <List component="div" disablePadding>
            <ListItemButton 
              sx={{ pl: 4, color: 'rgba(255,255,255,0.8)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
              onClick={() => handleNavigation('/pickup-orders')}
            >
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.8)' }}>
                <Assignment fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Lista Buoni" />
            </ListItemButton>
            <ListItemButton 
              sx={{ pl: 4, color: 'rgba(255,255,255,0.8)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
              onClick={() => handleNavigation('/pickup-orders/upload')}
            >
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.8)' }}>
                <Add fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Carica da PDF" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Spedizioni */}
        <ListItemButton
          onClick={() => handleMobileExpand('shipments')}
          sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
        >
          <ListItemIcon sx={{ color: 'white' }}>
            <LocalShipping />
          </ListItemIcon>
          <ListItemText primary="Spedizioni" />
          {expandedMobile.includes('shipments') ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={expandedMobile.includes('shipments')}>
          <List component="div" disablePadding>
            <ListItemButton 
              sx={{ pl: 4, color: 'rgba(255,255,255,0.8)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
              onClick={() => handleNavigation('/shipments/calendar')}
            >
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.8)' }}>
                <CalendarToday fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Calendario" />
            </ListItemButton>
            <ListItemButton 
              sx={{ pl: 4, color: 'rgba(255,255,255,0.8)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
              onClick={() => handleNavigation('/shipments/operator')}
            >
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.8)' }}>
                <People fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Dashboard Operatore" />
            </ListItemButton>
            <ListItemButton 
              sx={{ pl: 4, color: 'rgba(255,255,255,0.8)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
              onClick={() => handleNavigation('/shipments/manager')}
            >
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.8)' }}>
                <Assessment fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Finalizzazione Manager" />
            </ListItemButton>
            <ListItemButton 
              sx={{ pl: 4, color: 'rgba(255,255,255,0.8)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
              onClick={() => handleNavigation('/shipments/history')}
            >
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.8)' }}>
                <LocalShipping fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Storico Spedizioni" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* === NUOVE SEZIONI AGGIUNTE: PROCESSING E INVENTORY === */}

        {/* Lavorazioni (Processing) */}
        <ListItemButton
          onClick={() => handleMobileExpand('processing')}
          sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
        >
          <ListItemIcon sx={{ color: 'white' }}>
            <ProcessingIcon />
          </ListItemIcon>
          <ListItemText primary="Lavorazioni" />
          {expandedMobile.includes('processing') ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={expandedMobile.includes('processing')}>
          <List component="div" disablePadding>
            <ListItemButton 
              sx={{ pl: 4, color: 'rgba(255,255,255,0.8)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
              onClick={() => handleNavigation('/processing')}
            >
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.8)' }}>
                <ProductionIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Lista Lavorazioni" />
            </ListItemButton>
            <ListItemButton 
              sx={{ pl: 4, color: 'rgba(255,255,255,0.8)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
              onClick={() => handleNavigation('/processing/new')}
            >
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.8)' }}>
                <Add fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Nuova Lavorazione" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Giacenze (Inventory) */}
        <ListItemButton
          onClick={() => handleMobileExpand('inventory')}
          sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
        >
          <ListItemIcon sx={{ color: 'white' }}>
            <InventoryIcon />
          </ListItemIcon>
          <ListItemText primary="Giacenze" />
          {expandedMobile.includes('inventory') ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={expandedMobile.includes('inventory')}>
          <List component="div" disablePadding>
            <ListItemButton 
              sx={{ pl: 4, color: 'rgba(255,255,255,0.8)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
              onClick={() => handleNavigation('/inventory')}
            >
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.8)' }}>
                <Inventory fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Movimenti Giacenze" />
            </ListItemButton>
            <ListItemButton 
              sx={{ pl: 4, color: 'rgba(255,255,255,0.8)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
              onClick={() => handleNavigation('/inventory/new')}
            >
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.8)' }}>
                <Add fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Nuovo Movimento" />
            </ListItemButton>
            <ListItemButton 
              sx={{ pl: 4, color: 'rgba(255,255,255,0.8)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
              onClick={() => handleNavigation('/inventory/report')}
            >
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.8)' }}>
                <ReportIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Report Giacenze" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* === FINE NUOVE SEZIONI === */}

        {/* Menu singoli */}
        <ListItemButton
          onClick={() => handleNavigation('/analysis')}
          selected={isActivePath('/analysis')}
          sx={{ 
            color: 'white',
            '&.Mui-selected': { backgroundColor: 'rgba(255,255,255,0.1)' },
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' }
          }}
        >
          <ListItemIcon sx={{ color: 'white' }}>
            <Science />
          </ListItemIcon>
          <ListItemText primary="Analisi" />
        </ListItemButton>

        <ListItemButton
          onClick={() => handleNavigation('/reports')}
          selected={isActivePath('/reports')}
          sx={{ 
            color: 'white',
            '&.Mui-selected': { backgroundColor: 'rgba(255,255,255,0.1)' },
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' }
          }}
        >
          <ListItemIcon sx={{ color: 'white' }}>
            <Assessment />
          </ListItemIcon>
          <ListItemText primary="Report" />
        </ListItemButton>

        {/* Divider e area utente */}
        <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.12)' }} />
        
        {/* User Profile nel mobile menu */}
        {currentUser && (
          <Box sx={{ px: 2, py: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: theme.palette.primary.main,
                  fontSize: '0.9rem'
                }}
              >
                {getUserInitials(currentUser)}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 500, lineHeight: 1.2 }}>
                  {currentUser.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {currentUser.role}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        <ListItemButton
          onClick={() => { handleNavigation('/profile'); }}
          sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
        >
          <ListItemIcon sx={{ color: 'white' }}>
            <Person />
          </ListItemIcon>
          <ListItemText primary="Il mio profilo" />
        </ListItemButton>

        <ListItemButton
          onClick={handleLogout}
          sx={{ color: '#ff5252', '&:hover': { backgroundColor: 'rgba(255,82,82,0.1)' } }}
        >
          <ListItemIcon sx={{ color: '#ff5252' }}>
            <Logout />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <AppBar 
      position="static" 
      sx={{ 
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: '#000000',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}
    >
      <Toolbar sx={{ minHeight: 64, px: { xs: 2, sm: 3 } }}>
        {/* Mobile Menu Button */}
        {isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleMobileMenuToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Logo e Titolo */}
        <Box sx={{ display: 'flex', alignItems: 'center', mr: { xs: 2, lg: 4 } }}>
          <RecyclingOutlined 
            sx={{ 
              fontSize: { xs: 28, sm: 32 }, 
              mr: 1.5, 
              color: theme.palette.primary.light 
            }} 
          />
          <Typography 
            variant={isMobile ? "h6" : "h5"}
            component="div" 
            sx={{ 
              fontWeight: 700,
              letterSpacing: '0.5px',
              cursor: 'pointer',
              background: 'linear-gradient(45deg, #fff 30%, #e3f2fd 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
            onClick={() => navigate('/')}
          >
            SGR Pro
          </Typography>
        </Box>

        {/* Desktop Menu */}
        {!isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexGrow: 1 }}>
            {/* Dashboard */}
            <Button
              startIcon={<Dashboard />}
              onClick={() => handleNavigation('/')}
              sx={menuButtonStyle(isActivePath('/'))}
            >
              Dashboard
            </Button>

            {/* Gestione Utenti */}
            <Button
              startIcon={<Group />}
              endIcon={<KeyboardArrowDown />}
              onClick={(e) => handleMenuOpen(e, setUsersMenuAnchor)}
              sx={menuButtonStyle(isActivePath('/users'))}
            >
              Utenti
            </Button>

            {/* Clienti & Bacini */}
            <Button
              startIcon={<Business />}
              endIcon={<KeyboardArrowDown />}
              onClick={(e) => handleMenuOpen(e, setClientsMenuAnchor)}
              sx={menuButtonStyle(isActivePath('/clients') || isActivePath('/basins'))}
            >
              Clienti
            </Button>

            {/* Conferimenti */}
            <Button
              startIcon={<RecyclingOutlined />}
              endIcon={<KeyboardArrowDown />}
              onClick={(e) => handleMenuOpen(e, setDeliveriesMenuAnchor)}
              sx={menuButtonStyle(isActivePath('/deliveries'))}
            >
              Conferimenti
            </Button>

            {/* Buoni di Ritiro */}
            <Button
              startIcon={<Assignment />}
              endIcon={<KeyboardArrowDown />}
              onClick={(e) => handleMenuOpen(e, setOrdersMenuAnchor)}
              sx={menuButtonStyle(isActivePath('/pickup-orders'))}
            >
              Ordini
            </Button>

            {/* Spedizioni */}
            <Button
              startIcon={<LocalShipping />}
              endIcon={<KeyboardArrowDown />}
              onClick={(e) => handleMenuOpen(e, setShipmentsMenuAnchor)}
              sx={menuButtonStyle(isActivePath('/shipments'))}
            >
              Spedizioni
            </Button>

            {/* === NUOVI MENU DESKTOP AGGIUNTI === */}

            {/* Lavorazioni */}
            <Button
              startIcon={<ProcessingIcon />}
              endIcon={<KeyboardArrowDown />}
              onClick={(e) => handleMenuOpen(e, setProcessingMenuAnchor)}
              sx={menuButtonStyle(isActivePath('/processing'))}
            >
              Lavorazioni
            </Button>

            {/* Giacenze */}
            <Button
              startIcon={<InventoryIcon />}
              endIcon={<KeyboardArrowDown />}
              onClick={(e) => handleMenuOpen(e, setInventoryMenuAnchor)}
              sx={menuButtonStyle(isActivePath('/inventory'))}
            >
              Giacenze
            </Button>

            {/* === FINE NUOVI MENU === */}

            {/* Menu Singoli - Solo icone se spazio limitato */}
            <Button
              startIcon={<Science />}
              onClick={() => handleNavigation('/analysis')}
              sx={menuButtonStyle(isActivePath('/analysis'))}
            >
              Analisi
            </Button>

            <Button
              startIcon={<Assessment />}
              onClick={() => handleNavigation('/reports')}
              sx={menuButtonStyle(isActivePath('/reports'))}
            >
              Report
            </Button>
          </Box>
        )}

        {/* Area Utente */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
          {/* Error indicator se errore nel caricamento utente */}
          {userError && !isMobile && (
            <Alert severity="warning" sx={{ py: 0, px: 1 }}>
              Errore profilo utente
            </Alert>
          )}

          {token && currentUser ? (
            <>
              {/* Notifiche - Solo desktop */}
              {!isMobile && (
                <IconButton 
                  sx={{ 
                    color: 'white',
                    '&:hover': { backgroundColor: alpha(theme.palette.common.white, 0.1) }
                  }}
                >
                  <Notifications />
                </IconButton>
              )}

              {/* Help - Solo desktop */}
              {!isMobile && (
                <IconButton 
                  sx={{ 
                    color: 'white',
                    '&:hover': { backgroundColor: alpha(theme.palette.common.white, 0.1) }
                  }}
                >
                  <Help />
                </IconButton>
              )}

              {/* Profilo Utente - Solo desktop */}
              {!isMobile && (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    cursor: 'pointer',
                    padding: '8px 12px',
                    borderRadius: 2,
                    transition: 'all 0.2s',
                    opacity: userLoading ? 0.7 : 1,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.common.white, 0.1),
                    }
                  }}
                  onClick={(e) => handleMenuOpen(e, setUserProfileAnchor)}
                >
                  <Avatar 
                    sx={{ 
                      width: 36, 
                      height: 36, 
                      bgcolor: theme.palette.primary.main,
                      fontSize: '1rem',
                      fontWeight: 600
                    }}
                  >
                    {getUserInitials(currentUser)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 500, lineHeight: 1.2 }}>
                      {userLoading ? 'Caricamento...' : currentUser.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1 }}>
                      {userLoading ? '...' : currentUser.role}
                    </Typography>
                  </Box>
                  <KeyboardArrowDown sx={{ color: 'white', fontSize: '1.2rem' }} />
                </Box>
              )}

              {/* Avatar mobile */}
              {isMobile && (
                <Avatar 
                  sx={{ 
                    width: 36, 
                    height: 36, 
                    bgcolor: theme.palette.primary.main,
                    fontSize: '1rem',
                    fontWeight: 600,
                    opacity: userLoading ? 0.7 : 1
                  }}
                >
                  {getUserInitials(currentUser)}
                </Avatar>
              )}
            </>
          ) : (
            <Button 
              variant="outlined"
              onClick={() => navigate('/login')}
              sx={{ 
                color: 'white',
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.common.white, 0.1),
                  borderColor: 'rgba(255,255,255,0.5)',
                }
              }}
            >
              Login
            </Button>
          )}
        </Box>
      </Toolbar>

      {/* Mobile Drawer */}
      <SwipeableDrawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onOpen={() => setMobileMenuOpen(true)}
        disableSwipeToOpen={false}
        ModalProps={{
          keepMounted: true,
        }}
        PaperProps={{
          sx: {
            backgroundColor: '#000',
            color: 'white',
          }
        }}
      >
        {mobileMenuContent}
      </SwipeableDrawer>

      {/* DESKTOP DROPDOWN MENUS */}

      {/* Menu Gestione Utenti */}
      <Menu
        anchorEl={usersMenuAnchor}
        open={Boolean(usersMenuAnchor)}
        onClose={() => handleMenuClose(setUsersMenuAnchor)}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }
        }}
      >
        <MenuItem onClick={() => handleNavigation('/users')}>
          <ListItemIcon><People fontSize="small" /></ListItemIcon>
          <ListItemText primary="Lista Utenti" />
        </MenuItem>
        <MenuItem onClick={() => handleNavigation('/users/new')}>
          <ListItemIcon><PersonAdd fontSize="small" /></ListItemIcon>
          <ListItemText primary="Nuovo Utente" />
        </MenuItem>
      </Menu>

      {/* Menu Clienti & Bacini */}
      <Menu
        anchorEl={clientsMenuAnchor}
        open={Boolean(clientsMenuAnchor)}
        onClose={() => handleMenuClose(setClientsMenuAnchor)}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 220,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }
        }}
      >
        <MenuItem onClick={() => handleNavigation('/clients')}>
          <ListItemIcon><People fontSize="small" /></ListItemIcon>
          <ListItemText primary="Lista Clienti" />
        </MenuItem>
        <MenuItem onClick={() => handleNavigation('/clients/new')}>
          <ListItemIcon><Business fontSize="small" /></ListItemIcon>
          <ListItemText primary="Nuovo Cliente" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleNavigation('/basins')}>
          <ListItemIcon><Domain fontSize="small" /></ListItemIcon>
          <ListItemText primary="Lista Bacini" />
        </MenuItem>
        <MenuItem onClick={() => handleNavigation('/basins/new')}>
          <ListItemIcon><Add fontSize="small" /></ListItemIcon>
          <ListItemText primary="Nuovo Bacino" />
        </MenuItem>
      </Menu>

      {/* Menu Conferimenti */}
      <Menu
        anchorEl={deliveriesMenuAnchor}
        open={Boolean(deliveriesMenuAnchor)}
        onClose={() => handleMenuClose(setDeliveriesMenuAnchor)}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 240,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }
        }}
      >
        <MenuItem onClick={() => handleNavigation('/deliveries/calendar')}>
          <ListItemIcon><CalendarToday fontSize="small" /></ListItemIcon>
          <ListItemText primary="Calendario" />
          <Chip label="Principale" size="small" color="primary" sx={{ ml: 1 }} />
        </MenuItem>
        <MenuItem onClick={() => handleNavigation('/deliveries')}>
          <ListItemIcon><RecyclingOutlined fontSize="small" /></ListItemIcon>
          <ListItemText primary="Lista Conferimenti" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleNavigation('/deliveries/contributors')}>
          <ListItemIcon><People fontSize="small" /></ListItemIcon>
          <ListItemText primary="Conferitori" />
        </MenuItem>
        <MenuItem onClick={() => handleNavigation('/deliveries/material-types')}>
          <ListItemIcon><Science fontSize="small" /></ListItemIcon>
          <ListItemText primary="Tipologie Materiali" />
        </MenuItem>
      </Menu>

      {/* Menu Buoni di Ritiro */}
      <Menu
        anchorEl={ordersMenuAnchor}
        open={Boolean(ordersMenuAnchor)}
        onClose={() => handleMenuClose(setOrdersMenuAnchor)}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 220,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }
        }}
      >
        <MenuItem onClick={() => handleNavigation('/pickup-orders')}>
          <ListItemIcon><Assignment fontSize="small" /></ListItemIcon>
          <ListItemText primary="Lista Buoni" />
        </MenuItem>
        <MenuItem onClick={() => handleNavigation('/pickup-orders/upload')}>
          <ListItemIcon><Add fontSize="small" /></ListItemIcon>
          <ListItemText primary="Carica da PDF" />
        </MenuItem>
      </Menu>

      {/* Menu Spedizioni */}
      <Menu
        anchorEl={shipmentsMenuAnchor}
        open={Boolean(shipmentsMenuAnchor)}
        onClose={() => handleMenuClose(setShipmentsMenuAnchor)}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 240,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }
        }}
      >
        <MenuItem onClick={() => handleNavigation('/shipments/calendar')}>
          <ListItemIcon><CalendarToday fontSize="small" /></ListItemIcon>
          <ListItemText primary="Calendario" />
        </MenuItem>
        <MenuItem onClick={() => handleNavigation('/shipments/operator')}>
          <ListItemIcon><People fontSize="small" /></ListItemIcon>
          <ListItemText primary="Dashboard Operatore" />
        </MenuItem>
        <MenuItem onClick={() => handleNavigation('/shipments/manager')}>
          <ListItemIcon><Assessment fontSize="small" /></ListItemIcon>
          <ListItemText primary="Finalizzazione Manager" />
        </MenuItem>
        <MenuItem onClick={() => handleNavigation('/shipments/history')}>
          <ListItemIcon><LocalShipping fontSize="small" /></ListItemIcon>
          <ListItemText primary="Storico Spedizioni" />
        </MenuItem>
      </Menu>

      {/* === NUOVI MENU DROPDOWN AGGIUNTI === */}

      {/* Menu Processing (Lavorazioni) */}
      <Menu
        anchorEl={processingMenuAnchor}
        open={Boolean(processingMenuAnchor)}
        onClose={() => handleMenuClose(setProcessingMenuAnchor)}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 220,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }
        }}
      >
        <MenuItem onClick={() => handleNavigation('/processing')}>
          <ListItemIcon><ProductionIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Lista Lavorazioni" />
        </MenuItem>
        <MenuItem onClick={() => handleNavigation('/processing/new')}>
          <ListItemIcon><Add fontSize="small" /></ListItemIcon>
          <ListItemText primary="Nuova Lavorazione" />
        </MenuItem>
      </Menu>

      {/* Menu Inventory (Giacenze) */}
      <Menu
        anchorEl={inventoryMenuAnchor}
        open={Boolean(inventoryMenuAnchor)}
        onClose={() => handleMenuClose(setInventoryMenuAnchor)}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 240,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }
        }}
      >
        <MenuItem onClick={() => handleNavigation('/inventory')}>
          <ListItemIcon><Inventory fontSize="small" /></ListItemIcon>
          <ListItemText primary="Movimenti Giacenze" />
        </MenuItem>
        <MenuItem onClick={() => handleNavigation('/inventory/new')}>
          <ListItemIcon><Add fontSize="small" /></ListItemIcon>
          <ListItemText primary="Nuovo Movimento" />
        </MenuItem>
        <MenuItem onClick={() => handleNavigation('/inventory/report')}>
          <ListItemIcon><ReportIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Report Giacenze" />
        </MenuItem>
      </Menu>

      {/* === FINE NUOVI MENU === */}

      {/* Menu Profilo Utente */}
      <Menu
        anchorEl={userProfileAnchor}
        open={Boolean(userProfileAnchor)}
        onClose={() => handleMenuClose(setUserProfileAnchor)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 220,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }
        }}
      >
        {currentUser && (
          <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {currentUser.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {currentUser.email}
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip 
                label={currentUser.role} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
            </Box>
          </Box>
        )}
        
        <MenuItem onClick={() => { 
          handleMenuClose(setUserProfileAnchor); 
          navigate('/profile'); 
        }}>
          <ListItemIcon><Person fontSize="small" /></ListItemIcon>
          <ListItemText primary="Il mio profilo" />
        </MenuItem>
        
        <MenuItem onClick={() => handleMenuClose(setUserProfileAnchor)}>
          <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
          <ListItemText primary="Impostazioni" />
        </MenuItem>
        
        <Divider />
        
        <MenuItem 
          onClick={handleLogout}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><Logout fontSize="small" color="error" /></ListItemIcon>
          <ListItemText primary="Logout" />
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default ResponsiveNavbar;