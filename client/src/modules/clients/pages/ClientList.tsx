// client/src/modules/clients/pages/ClientList.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, CircularProgress, Box, IconButton, Alert, Chip } from '@mui/material';
import { Add, Edit, Delete, ViewList } from '@mui/icons-material';
import * as clientService from '../services/clientService';
import type { Client } from '../services/clientService';

const ClientList = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const data = await clientService.getClients();
        setClients(data);
        setError(null);
      } catch (error: any) {
        console.error('Error fetching clients:', error);
        setError(error.response?.data?.message || 'Errore nel caricamento dei clienti');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const handleEdit = (id: string) => {
    navigate(`/clients/edit/${id}`);
  };

  const handleViewBasins = (id: string) => {
    navigate(`/basins/client/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo cliente?')) {
      try {
        await clientService.deleteClient(id);
        setClients(clients.filter(client => client.id !== id));
      } catch (error: any) {
        console.error('Error deleting client:', error);
        alert(error.response?.data?.message || 'Errore durante l\'eliminazione del cliente');
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestione Clienti
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/clients/new')}
        >
          Nuovo Cliente
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Partita IVA</TableCell>
                <TableCell>Città</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Bacini</TableCell>
                <TableCell align="right">Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">Nessun cliente trovato</TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>{client.name}</TableCell>
                    <TableCell>{client.vatNumber}</TableCell>
                    <TableCell>{client.city || 'N/A'}</TableCell>
                    <TableCell>{client.email || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={client.basins?.length || 0} 
                        color="primary" 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleViewBasins(client.id)} color="info" title="Visualizza bacini">
                        <ViewList />
                      </IconButton>
                      <IconButton onClick={() => handleEdit(client.id)} color="primary" title="Modifica">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(client.id)} color="error" title="Elimina">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default ClientList;