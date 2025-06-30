// client/src/app/providers/AppProviders.tsx - INTEGRATO CON IL TUO TEMA

import { type ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import 'react-toastify/dist/ReactToastify.css';

// Crea un client React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minuti
    },
  },
});

// Tema ottimizzato che mantiene i tuoi colori neri
const theme = createTheme({
  palette: {
    primary: {
      main: '#000000', // Mantieni il nero del tuo tema
      light: '#333333',
      dark: '#000000',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#424242',
      light: '#6d6d6d',
      dark: '#1b1b1b',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f5f5', // Mantieni il tuo background
      paper: '#ffffff',
    },
    text: {
      primary: '#333333', // Mantieni i tuoi colori di testo
      secondary: '#666666',
    },
    // Aggiungo gradazioni aggiuntive per la navbar
    grey: {
      50: '#f8f9fa',
      100: '#e9ecef',
      200: '#dee2e6',
      300: '#ced4da',
      400: '#adb5bd',
      500: '#6c757d',
      600: '#495057',
      700: '#343a40',
      800: '#212529',
      900: '#000000',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', // Mantieni il tuo font
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.3,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
      marginBottom: '1.5rem', // Mantieni il tuo spacing
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 500,
      fontSize: '1.125rem',
      lineHeight: 1.4,
      marginBottom: '1rem', // Mantieni il tuo spacing
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    // Mantieni le tue personalizzazioni esistenti
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '24px',
          paddingRight: '24px',
          maxWidth: '1400px !important', // Layout più ampio come il tuo
          '@media (max-width: 600px)': {
            paddingLeft: '16px',
            paddingRight: '16px',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          padding: '24px', // Mantieni il tuo padding
          borderRadius: '8px', // Mantieni il tuo border radius
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)', // Mantieni la tua shadow
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '16px', // Mantieni il tuo padding
          fontSize: '0.95rem', // Mantieni il tuo font size
        },
        head: {
          backgroundColor: '#f8f9fa', // Mantieni il tuo colore header
          fontWeight: 600,
          color: '#333333', // Mantieni il tuo colore testo
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Mantieni le tue impostazioni
          borderRadius: '6px',
          padding: '10px 20px',
          fontSize: '0.95rem',
          fontWeight: 500,
          transition: 'all 0.2s ease-in-out',
        },
        contained: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)', // Mantieni la tua shadow
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)', // Mantieni la tua hover shadow
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
      },
    },
    // AppBar con il tuo tema nero
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000', // Mantieni la tua AppBar nera
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)', // Mantieni la tua shadow
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    // Toolbar ottimizzato per la nuova navbar
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '64px !important',
          paddingLeft: '24px !important',
          paddingRight: '24px !important',
          '@media (max-width: 600px)': {
            paddingLeft: '16px !important',
            paddingRight: '16px !important',
          },
        },
      },
    },
    // Menu dropdown con il tuo stile
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: '8px', // Usa il tuo border radius
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)', // Usa la tua shadow
          marginTop: '8px',
          border: '1px solid rgba(0,0,0,0.1)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
          fontSize: '0.95rem', // Usa il tuo font size
          borderRadius: '4px',
          margin: '0 8px',
          transition: 'all 0.15s ease-in-out',
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.05)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(0,0,0,0.08)',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.12)',
            },
          },
        },
      },
    },
    // TextField con il tuo stile
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '6px', // Usa il tuo border radius
            '& fieldset': {
              borderColor: '#dee2e6',
            },
            '&:hover fieldset': {
              borderColor: '#adb5bd',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#000000', // Usa il tuo colore primario
              borderWidth: '2px',
            },
          },
        },
      },
    },
    // Chip con colori che si abbinano al tuo tema
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          fontWeight: 500,
          fontSize: '0.75rem',
        },
        filled: {
          '&.MuiChip-colorPrimary': {
            backgroundColor: '#e9ecef',
            color: '#000000',
          },
          '&.MuiChip-colorSecondary': {
            backgroundColor: '#f8f9fa',
            color: '#424242',
          },
        },
      },
    },
    // Card moderne ma che mantengono il tuo stile
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '8px', // Usa il tuo border radius
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)', // Usa la tua shadow
          border: '1px solid rgba(0,0,0,0.08)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    // CardContent
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '24px', // Mantieni il tuo padding
          '&:last-child': {
            paddingBottom: '24px',
          },
        },
      },
    },
    // IconButton
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: '6px', // Usa il tuo border radius
          padding: '8px',
          transition: 'all 0.15s ease-in-out',
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.05)',
            transform: 'scale(1.05)',
          },
        },
      },
    },
    // Avatar
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
    // Drawer per mobile con il tuo tema nero
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#000000', // Mantieni il tuo colore sidebar
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        },
      },
    },
    // List items per drawer mobile
    MuiListItem: {
      styleOverrides: {
        root: {
          padding: '12px 24px', // Mantieni il tuo padding
          borderRadius: '0 25px 25px 0', // Mantieni il tuo border radius
          margin: '4px 8px 4px 0', // Mantieni il tuo margin
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.1)', // Mantieni il tuo hover
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(255,255,255,0.2)', // Mantieni il tuo selected
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.3)',
            },
          },
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: '#ffffff', // Mantieni il tuo colore testo
          fontWeight: 500,
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: '#ffffff', // Mantieni il tuo colore icone
          minWidth: '48px', // Mantieni il tuo spacing
        },
      },
    },
  },
});

interface AppProvidersProps {
  children: ReactNode;
}

const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
          <ToastContainer 
            position="top-right" 
            autoClose={5000}
            theme="colored"
            style={{ zIndex: 9999 }}
            toastStyle={{
              borderRadius: '12px',
              fontFamily: theme.typography.fontFamily,
            }}
          />
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export default AppProviders;