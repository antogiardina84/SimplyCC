// client/src/modules/basins/pages/BasinList.tsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, CircularProgress, Box, IconButton, Alert, Chip } from '@mui/material';
import { Add, Edit, Delete, ArrowBack } from '@mui/icons-material';
import * as basinService from '../services/basinService';
import * as clientService from '../../clients/services/clientService';
import type { Basin } from '../services/basinService';
import type { Client } from '../../clients/services/clientService';

const BasinList = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [basins, setBasins] = useState<Basin[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (clientId) {
          const [clientData, basinsData] = await Promise.all([
            clientService.getClientById(clientId),
            basinService.getBasinsByClientId(clientId)
          ]);
          setClient(clientData);
          setBasins(basinsData);
        } else {
          const data = await basinService.getBasins();
          setBasins(data);
        }
        setError(null);
      } catch (error: any) {
        console.error('Error fetching basins:', error);
        setError(error.response?.data?.message || 'Errore nel caricamento dei bacini');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clientId]);

  const handleEdit = (id: string) => {
    navigate(`/basins/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo bacino?')) {
      try {
        await basinService.deleteBasin(id);
        setBasins(basins.filter(basin => basin.id !== id));
      } catch (error: any) {
        console.error('Error deleting basin:', error);
        alert(error.response?.data?.message || 'Errore durante l\'eliminazione del bacino');
      }
    }
  };

  const getFlowTypeLabel = (flowType: string) => {
    switch (flowType) {
      case 'A': return 'Flusso A';
      case 'B': return 'Flusso B';
      case 'C': return 'Flusso C';
      case 'D': return 'Flusso D';
      default: return flowType;
    }
  };

  const getFlowTypeColor = (flowType: string) => {
    switch (flowType) {
      case 'A': return 'primary';
      case 'B': return 'secondary';
      case 'C': return 'success';
      case 'D': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBack />} 
            onClick={() => navigate('/clients')}
            sx={{ mb: 1 }}
          >
            Torna ai Clienti
          </Button>
          <Typography variant="h4" component="h1">
            {client ? `Bacini di ${client.name}` : 'Tutti i Bacini'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate(clientId ? `/basins/new/${clientId}` : '/basins/new')}
        >
          Nuovo Bacino
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
                <TableCell>Codice</TableCell>
                <TableCell>Descrizione</TableCell>
                <TableCell>Tipo Flusso</TableCell>
                {!clientId && <TableCell>Cliente</TableCell>}
                <TableCell align="right">Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {basins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={clientId ? 4 : 5} align="center">Nessun bacino trovato</TableCell>
                </TableRow>
              ) : (
                basins.map((basin) => (
                  <TableRow key={basin.id}>
                    <TableCell>{basin.code}</TableCell>
                    <TableCell>{basin.description || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={getFlowTypeLabel(basin.flowType)} 
                        color={getFlowTypeColor(basin.flowType) as any} 
                        size="small" 
                      />
                    </TableCell>
                    {!clientId && basin.client && (
                      <TableCell>{basin.client.name}</TableCell>
                    )}
                    <TableCell align="right">
                      <IconButton onClick={() => handleEdit(basin.id)} color="primary" title="Modifica">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(basin.id)} color="error" title="Elimina">
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

export default BasinList;