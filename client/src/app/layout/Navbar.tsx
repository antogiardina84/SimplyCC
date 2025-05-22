import { AppBar, Toolbar, Typography, Button, Box, IconButton, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AccountCircle, Logout } from '@mui/icons-material';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };
  
  return (
    <AppBar position="static" sx={{ zIndex: 1201 }}>
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: '70px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography 
            variant="h5" 
            component="div" 
            sx={{ 
              fontWeight: 600,
              letterSpacing: '0.5px',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/')}
          >
            Sistema Gestione Rifiuti
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {token ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)' }}>
                  <AccountCircle />
                </Avatar>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                  Utente
                </Typography>
              </Box>
              <IconButton 
                color="inherit" 
                onClick={handleLogout}
                sx={{ 
                  borderRadius: '8px',
                  padding: '8px 12px',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  }
                }}
              >
                <Logout sx={{ mr: 1 }} />
                <Typography variant="body2">Logout</Typography>
              </IconButton>
            </>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                color="inherit" 
                onClick={() => navigate('/login')}
                sx={{ 
                  borderRadius: '6px',
                  padding: '8px 16px',
                  border: '1px solid rgba(255,255,255,0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.5)',
                  }
                }}
              >
                Login
              </Button>
              <Button 
                color="inherit" 
                onClick={() => navigate('/register')}
                sx={{ 
                  borderRadius: '6px',
                  padding: '8px 16px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.2)',
                  }
                }}
              >
                Register
              </Button>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;