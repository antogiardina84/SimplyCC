import { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Menu,
  MenuItem,
  Fab,
  Grid,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  MoreVert,
  Email,
  Phone,
  Business,
  Visibility,
  FilterList,
} from '@mui/icons-material';

// Mock data per i clienti
const mockClients = [
  {
    id: '1',
    name: 'Azienda Example Srl',
    vatNumber: 'IT12345678901',
    city: 'Milano',
    email: 'info@example.it',
    phone: '+39 02 1234567',
    bacins: 3,
    status: 'Attivo',
  },
  {
    id: '2',
    name: 'Consorzio Verde SpA',
    vatNumber: 'IT98765432109',
    city: 'Roma',
    email: 'amministrazione@verde.it',
    phone: '+39 06 9876543',
    bacins: 5,
    status: 'Attivo',
  },
  {
    id: '3',
    name: 'Eco Solutions Srl',
    vatNumber: 'IT11223344556',
    city: 'Napoli',
    email: 'contact@ecosolutions.it',
    phone: '+39 081 5555555',
    bacins: 2,
    status: 'Sospeso',
  },
  {
    id: '4',
    name: 'Green Tech Italia SpA',
    vatNumber: 'IT77889900112',
    city: 'Torino',
    email: 'info@greentech.it',
    phone: '+39 011 2233445',
    bacins: 7,
    status: 'Attivo',
  },
  {
    id: '5',
    name: 'Ricicla Bene Srl',
    vatNumber: 'IT33445566778',
    city: 'Firenze',
    email: 'contatti@ricicla.it',
    phone: '+39 055 7788990',
    bacins: 4,
    status: 'Attivo',
  },
];

const ClientList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, clientId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedClient(clientId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedClient(null);
  };

  const filteredClients = mockClients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.vatNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Attivo':
        return 'success';
      case 'Sospeso':
        return 'warning';
      case 'Inattivo':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
              Gestione Clienti
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gestisci i clienti e visualizza i loro bacini associati
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            size="large"
            sx={{ 
              minWidth: 160,
              height: 48,
              borderRadius: 3,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            Nuovo Cliente
          </Button>
        </Box>

        {/* Search and Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            placeholder="Cerca per nome, P.IVA o città..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ 
              flexGrow: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            sx={{ 
              minWidth: 120,
              borderRadius: 2,
              textTransform: 'none',
            }}
          >
            Filtri
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {mockClients.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Clienti Totali
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
              {mockClients.filter(c => c.status === 'Attivo').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Clienti Attivi
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
              {mockClients.filter(c => c.status === 'Sospeso').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Clienti Sospesi
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'info.main' }}>
              {mockClients.reduce((sum, client) => sum + client.bacins, 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Bacini Totali
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <TableContainer>
          <Table sx={{ minWidth: 1000 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '1rem', py: 2 }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '1rem', py: 2 }}>Partita IVA</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '1rem', py: 2 }}>Città</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '1rem', py: 2 }}>Contatti</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '1rem', py: 2 }}>Bacini</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '1rem', py: 2 }}>Stato</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '1rem', py: 2, width: 120 }}>Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <Business sx={{ fontSize: 64, color: 'text.disabled' }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        Nessun cliente trovato
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm ? 'Prova a modificare i criteri di ricerca' : 'Inizia aggiungendo il primo cliente'}
                      </Typography>
                      {!searchTerm && (
                        <Button
                          variant="contained"
                          startIcon={<Add />}
                          sx={{ mt: 2 }}
                        >
                          Aggiungi Cliente
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client, index) => (
                  <TableRow 
                    key={client.id}
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: 'rgba(0, 0, 0, 0.03)',
                        transform: 'scale(1.001)',
                        transition: 'all 0.2s ease',
                      },
                      '&:last-child td': { border: 0 },
                    }}
                  >
                    <TableCell sx={{ py: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            width: 52,
                            height: 52,
                            borderRadius: 3,
                            backgroundColor: `hsl(${index * 137.5}, 70%, 50%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '1.2rem',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          }}
                        >
                          {client.name.charAt(0)}
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {client.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ID: {client.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 3 }}>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontFamily: 'monospace',
                          fontSize: '0.95rem',
                          fontWeight: 500,
                          backgroundColor: 'grey.100',
                          padding: '4px 8px',
                          borderRadius: 1,
                          display: 'inline-block'
                        }}
                      >
                        {client.vatNumber}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Business sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {client.city}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 3 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Email sx={{ fontSize: 16, color: 'primary.main' }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {client.email}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Phone sx={{ fontSize: 16, color: 'success.main' }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {client.phone}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 3 }}>
                      <Chip
                        label={`${client.bacins} bacini`}
                        size="medium"
                        variant="outlined"
                        sx={{ 
                          borderRadius: 3,
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          height: 32,
                          backgroundColor: 'rgba(25, 118, 210, 0.1)',
                          borderColor: 'primary.main',
                          color: 'primary.main',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 3 }}>
                      <Chip
                        label={client.status}
                        size="medium"
                        color={getStatusColor(client.status) as any}
                        sx={{ 
                          borderRadius: 3,
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          height: 32,
                          minWidth: 80,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton 
                          size="small" 
                          sx={{ 
                            borderRadius: 3,
                            backgroundColor: 'primary.main',
                            color: 'white',
                            '&:hover': { 
                              backgroundColor: 'primary.dark',
                              transform: 'scale(1.1)'
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small"
                          sx={{ 
                            borderRadius: 3,
                            backgroundColor: 'success.main',
                            color: 'white',
                            '&:hover': { 
                              backgroundColor: 'success.dark',
                              transform: 'scale(1.1)'
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuClick(e, client.id)}
                          sx={{ 
                            borderRadius: 3,
                            backgroundColor: 'grey.300',
                            color: 'grey.700',
                            '&:hover': { 
                              backgroundColor: 'grey.400',
                              transform: 'scale(1.1)'
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 3,
            mt: 1,
            minWidth: 180,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.05)',
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem 
          onClick={() => {
            handleMenuClose();
            console.log('Visualizza cliente:', selectedClient);
          }} 
          sx={{ 
            gap: 2, 
            py: 1.5,
            '&:hover': { backgroundColor: 'primary.lighter' }
          }}
        >
          <Visibility fontSize="small" color="primary" />
          <Typography sx={{ fontWeight: 500 }}>Visualizza Dettagli</Typography>
        </MenuItem>
        <MenuItem 
          onClick={() => {
            handleMenuClose();
            console.log('Modifica cliente:', selectedClient);
          }} 
          sx={{ 
            gap: 2, 
            py: 1.5,
            '&:hover': { backgroundColor: 'success.lighter' }
          }}
        >
          <Edit fontSize="small" color="success" />
          <Typography sx={{ fontWeight: 500 }}>Modifica Cliente</Typography>
        </MenuItem>
        <MenuItem 
          onClick={() => {
            handleMenuClose();
            console.log('Elimina cliente:', selectedClient);
          }} 
          sx={{ 
            gap: 2, 
            py: 1.5,
            color: 'error.main',
            '&:hover': { backgroundColor: 'error.lighter' }
          }}
        >
          <Delete fontSize="small" />
          <Typography sx={{ fontWeight: 500 }}>Elimina Cliente</Typography>
        </MenuItem>
      </Menu>

      {/* Floating Action Button for mobile */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: { xs: 'flex', md: 'none' },
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          '&:hover': {
            transform: 'scale(1.1)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
          },
          transition: 'all 0.3s ease',
        }}
      >
        <Add />
      </Fab>
    </Container>
  );
};

export default ClientList;