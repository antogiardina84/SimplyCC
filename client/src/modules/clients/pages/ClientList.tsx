import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  CircularProgress,
  Alert,
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
import * as clientService from '../services/clientService';
import type { Client } from '../services/clientService';

const ClientList = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  // Carica i clienti all'avvio
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await clientService.getClients();
        setClients(data);
        setFilteredClients(data);
      } catch (error: any) {
        console.error('Error fetching clients:', error);
        
        if (error.response?.status === 404) {
          setError('Endpoint clienti non trovato. Verifica che il server sia avviato.');
        } else if (error.response?.status === 500) {
          setError('Errore del server. Verifica che il database sia configurato correttamente.');
        } else if (error.code === 'ERR_NETWORK') {
          setError('Impossibile connettersi al server. Verifica che il backend sia in esecuzione.');
        } else {
          setError(error.response?.data?.message || 'Errore nel caricamento dei clienti');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Filtro locale per la ricerca
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.vatNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.city && client.city.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredClients(filtered);
    }
  }, [searchTerm, clients]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, clientId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedClient(clientId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedClient(null);
  };

  // Funzioni di navigazione
  const handleViewClient = (clientId: string) => {
    navigate(`/clients/${clientId}`);
  };

  const handleEditClient = (clientId: string) => {
    navigate(`/clients/edit/${clientId}`);
  };

  const handleNewClient = () => {
    navigate('/clients/new');
  };

  const handleDeleteClient = async (clientId: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo cliente?')) {
      try {
        await clientService.deleteClient(clientId);
        // Rimuovi il cliente dalla lista locale
        const updatedClients = clients.filter(client => client.id !== clientId);
        setClients(updatedClients);
        setFilteredClients(updatedClients.filter(client =>
          searchTerm === '' ||
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.vatNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (client.city && client.city.toLowerCase().includes(searchTerm.toLowerCase()))
        ));
      } catch (error: any) {
        console.error('Error deleting client:', error);
        alert(error.response?.data?.message || 'Errore durante l\'eliminazione del cliente');
      }
    }
  };

  const getStatusColor = (basinsCount: number) => {
    if (basinsCount === 0) return 'warning';
    if (basinsCount >= 5) return 'success';
    return 'info';
  };

  const getStatusLabel = (basinsCount: number) => {
    if (basinsCount === 0) return 'Nessun Bacino';
    if (basinsCount >= 5) return 'Molto Attivo';
    return 'Attivo';
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

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
            onClick={handleNewClient}
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

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {clients.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Clienti Totali
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
              {clients.filter(c => c.basins && c.basins.length > 0).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Clienti con Bacini
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
              {clients.filter(c => !c.basins || c.basins.length === 0).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Clienti senza Bacini
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'info.main' }}>
              {clients.reduce((sum, client) => sum + (client.basins?.length || 0), 0)}
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
                          onClick={handleNewClient}
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
                            ID: {client.id.slice(0, 8)}...
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
                          {client.city || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 3 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {client.email && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Email sx={{ fontSize: 16, color: 'primary.main' }} />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {client.email}
                            </Typography>
                          </Box>
                        )}
                        {client.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Phone sx={{ fontSize: 16, color: 'success.main' }} />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {client.phone}
                            </Typography>
                          </Box>
                        )}
                        {!client.email && !client.phone && (
                          <Typography variant="body2" color="text.secondary">
                            Nessun contatto
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 3 }}>
                      <Chip
                        label={`${client.basins?.length || 0} bacini`}
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
                        label={getStatusLabel(client.basins?.length || 0)}
                        size="medium"
                        color={getStatusColor(client.basins?.length || 0) as any}
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
                          onClick={() => handleViewClient(client.id)}
                          title="Visualizza Dettagli"
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
                          onClick={() => handleEditClient(client.id)}
                          title="Modifica Cliente"
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
                          title="Altre Azioni"
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
            if (selectedClient) handleViewClient(selectedClient);
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
            if (selectedClient) handleEditClient(selectedClient);
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
            if (selectedClient) handleDeleteClient(selectedClient);
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
        onClick={handleNewClient}
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