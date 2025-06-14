import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, CircularProgress, Box, IconButton, Alert, Chip, TextField } from '@mui/material';
import { Add, Edit, Delete, Visibility } from '@mui/icons-material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

import * as pickupOrderService from '../services/ocrPickupOrderService';
import type { PickupOrder, PickupOrderStatus } from '../services/ocrPickupOrderService';

const PickupOrderList = () => {
  const navigate = useNavigate();
  const [pickupOrders, setPickupOrders] = useState<PickupOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PickupOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    const fetchPickupOrders = async () => {
      try {
        setLoading(true);
        const data = await pickupOrderService.getPickupOrders();
        setPickupOrders(data);
        setFilteredOrders(data);
        setError(null);
      } catch (error: any) {
        console.error('Error fetching pickup orders:', error);
        
        if (error.response?.status === 404) {
          setError('Endpoint non trovato. Verifica che il server sia avviato.');
        } else if (error.response?.status === 500) {
          setError('Errore del server. Verifica che il database sia configurato correttamente.');
        } else if (error.code === 'ERR_NETWORK') {
          setError('Impossibile connettersi al server. Verifica che il backend sia in esecuzione.');
        } else {
          setError(error.response?.data?.message || 'Errore nel caricamento dei buoni di ritiro');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPickupOrders();
  }, []);

  useEffect(() => {
    if (filter === '') {
      setFilteredOrders(pickupOrders);
    } else {
      const filtered = pickupOrders.filter(order => 
        order.orderNumber.toLowerCase().includes(filter.toLowerCase()) ||
        // CORRETTO: Usa le entità logistiche
        (order.logisticSender?.name || '').toLowerCase().includes(filter.toLowerCase()) ||
        (order.logisticRecipient?.name || '').toLowerCase().includes(filter.toLowerCase()) ||
        (order.basin?.code || '').toLowerCase().includes(filter.toLowerCase())
      );
      setFilteredOrders(filtered);
    }
  }, [filter, pickupOrders]);

  const handleView = (id: string) => {
    navigate(`/pickup-orders/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/pickup-orders/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo buono di ritiro?')) {
      try {
        await pickupOrderService.deletePickupOrder(id);
        setPickupOrders(pickupOrders.filter(order => order.id !== id));
      } catch (error: any) {
        console.error('Error deleting pickup order:', error);
        alert(error.response?.data?.message || 'Errore durante l\'eliminazione del buono di ritiro');
      }
    }
  };

  const getStatusLabel = (status: PickupOrderStatus) => {
    switch (status) {
      case 'DA_EVADERE': return 'Da Evadere';
      case 'PROGRAMMATO': return 'Programmato';
      case 'IN_EVASIONE': return 'In Evasione';
      case 'IN_CARICO': return 'In Carico';
      case 'CARICATO': return 'Caricato';
      case 'SPEDITO': return 'Spedito';
      case 'COMPLETO': return 'Completo';
      case 'CANCELLED': return 'Annullato';
      default: return status;
    }
  };

  const getStatusColor = (status: PickupOrderStatus) => {
    switch (status) {
      case 'DA_EVADERE': return 'warning';
      case 'PROGRAMMATO': return 'info';
      case 'IN_EVASIONE': return 'info';
      case 'IN_CARICO': return 'primary';
      case 'CARICATO': return 'primary';
      case 'SPEDITO': return 'success';
      case 'COMPLETO': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestione Buoni di Ritiro
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/pickup-orders/upload')}
        >
          Nuovo Buono di Ritiro
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Cerca per numero buono, mittente, destinatario o bacino"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          sx={{ maxWidth: 400 }}
        />
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
                <TableCell>Numero Buono</TableCell>
                <TableCell>Data Carico</TableCell>
                <TableCell>Mittente</TableCell>
                <TableCell>Destinatario</TableCell>
                <TableCell>Bacino</TableCell>
                <TableCell>Stato</TableCell>
                <TableCell>Quantità Prev.</TableCell>
                <TableCell align="right">Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    {filter ? 'Nessun buono di ritiro trovato con i criteri di ricerca' : 'Nessun buono di ritiro trovato'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.orderNumber}</TableCell>
                    <TableCell>
                      {order.loadingDate 
                        ? format(new Date(order.loadingDate), 'dd/MM/yyyy', { locale: it })
                        : order.scheduledDate 
                          ? format(new Date(order.scheduledDate), 'dd/MM/yyyy', { locale: it })
                          : format(new Date(order.issueDate), 'dd/MM/yyyy', { locale: it })}
                    </TableCell>
                    <TableCell>{order.logisticSender?.name || 'N/A'}</TableCell>
                    <TableCell>{order.logisticRecipient?.name || 'N/A'}</TableCell>
                    <TableCell>
                      {order.basin?.code || 'N/A'}
                      {order.basin?.description && ` - ${order.basin.description}`}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getStatusLabel(order.status)} 
                        color={getStatusColor(order.status) as any} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      {order.expectedQuantity ? `${order.expectedQuantity} t` : 'N/A'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleView(order.id)} color="info" title="Visualizza">
                        <Visibility />
                      </IconButton>
                      <IconButton onClick={() => handleEdit(order.id)} color="primary" title="Modifica">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(order.id)} color="error" title="Elimina">
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

export default PickupOrderList;