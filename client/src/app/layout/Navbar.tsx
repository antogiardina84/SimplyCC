import { AppBar, Toolbar, Typography, Button, Box, IconButton, Avatar, Menu, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AccountCircle, Logout, Person, Settings } from '@mui/icons-material';
import { useState } from 'react';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  // Mock user data - in produzione verrà da un context/store
  const currentUser = {
    name: 'Mario Rossi',
    email: 'mario.rossi@example.com',
    role: 'Manager'
  };
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleProfileClick = () => {
    handleMenuClose();
    navigate('/profile');
  };
  
  const handleLogout = () => {
    handleMenuClose();
    localStorage.removeItem('token');
    navigate('/login');
  };
  
  return (
    <AppBar position="static" sx={{ zIndex: 1201, flexShrink: 0 }}>
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64 }}>
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
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  }
                }}
                onClick={handleMenuOpen}
              >
                <Avatar 
                  sx={{ 
                    width: 36, 
                    height: 36, 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    fontSize: '1rem',
                    fontWeight: 600
                  }}
                >
                  {currentUser.name.split(' ').map(n => n[0]).join('')}
                </Avatar>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 500, lineHeight: 1.2 }}>
                    {currentUser.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1 }}>
                    {currentUser.role}
                  </Typography>
                </Box>
              </Box>
              
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
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
                    borderRadius: 2,
                    mt: 1,
                    minWidth: 200,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  }
                }}
              >
                <Box sx={{ px: 2, py: 1, borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {currentUser.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {currentUser.email}
                  </Typography>
                </Box>
                
                <MenuItem onClick={handleProfileClick} sx={{ gap: 2, py: 1.5 }}>
                  <Person fontSize="small" />
                  <Typography>Il mio profilo</Typography>
                </MenuItem>
                
                <MenuItem onClick={handleMenuClose} sx={{ gap: 2, py: 1.5 }}>
                  <Settings fontSize="small" />
                  <Typography>Impostazioni</Typography>
                </MenuItem>
                
                <MenuItem 
                  onClick={handleLogout} 
                  sx={{ 
                    gap: 2, 
                    py: 1.5,
                    color: 'error.main',
                    borderTop: '1px solid rgba(0,0,0,0.1)',
                    mt: 1
                  }}
                >
                  <Logout fontSize="small" />
                  <Typography>Logout</Typography>
                </MenuItem>
              </Menu>
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