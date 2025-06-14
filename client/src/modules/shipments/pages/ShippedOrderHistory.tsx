// client/src/modules/shipments/pages/ShippedOrderHistory.tsx - VERSIONE CORRETTA

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Visibility,
  Refresh,
  Download,
  FilterList,
  Clear,
  CheckCircle,
  Cancel,
  LocalShipping
} from '@mui/icons-material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import api from '../../../core/services/api';

// ✅ INTERFACCIA CORRETTA - Allineata con lo schema del database
interface ShippedOrder {
  id: string;
  orderNumber: string;
  status: string;
  // Relazione con PickupOrder (nested object)
  pickupOrder?: {
    issueDate: string;
    scheduledDate?: string;
    loadingDate?: string;
    unloadingDate?: string;
    completionDate?: string;
    departureWeight?: number;
    arrivalWeight?: number;
    loadedPackages?: number;
    expectedQuantity?: number;
    basin: {
      code: string;
      client: {
        name: string;
      };
    };
    logisticSender?: {
      name: string;
    };
    logisticRecipient?: {
      name: string;
    };
    assignedOperator?: {
      firstName: string;
      lastName: string;
    };
    isRejected?: boolean;
    rejectionReason?: string;
  };
}

interface FilterState {
  status: string;
  client: string;
  dateFrom: string;
  dateTo: string;
  searchTerm: string;
}

const ShippedOrderHistory = () => {
  const [orders, setOrders] = useState<ShippedOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ShippedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    client: '',
    dateFrom: '',
    dateTo: '',
    searchTerm: ''
  });

  // Carica i dati
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carica ordini spediti e completati
      const [ordersResponse, clientsResponse] = await Promise.all([
        api.get('/pickup-orders', {
          params: {
            status: 'SPEDITO,COMPLETO', // Stati di interesse
            include: 'basin,logisticSender,logisticRecipient,assignedOperator'
          }
        }),
        api.get('/clients')
      ]);

      setOrders(ordersResponse.data || []);
      setClients(clientsResponse.data || []);
      
    } catch (error: any) {
      console.error('Error loading shipped orders:', error);
      setError(error.response?.data?.message || 'Errore nel caricamento dello storico spedizioni');
    } finally {
      setLoading(false);
    }
  };

  // Applica i filtri
  useEffect(() => {
    let filtered = [...orders];

    // Filtro per stato
    if (filters.status) {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Filtro per cliente
    if (filters.client) {
      filtered = filtered.filter(order => 
        order.pickupOrder?.basin?.client?.name?.toLowerCase().includes(filters.client.toLowerCase())
      );
    }

    // Filtro per termine di ricerca
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(term) ||
        order.pickupOrder?.basin?.code?.toLowerCase().includes(term) ||
        order.pickupOrder?.logisticSender?.name?.toLowerCase().includes(term) ||
        order.pickupOrder?.logisticRecipient?.name?.toLowerCase().includes(term)
      );
    }

    // Filtro per data
    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter(order => {
        const orderDate = order.pickupOrder?.completionDate || order.pickupOrder?.unloadingDate;
        if (!orderDate) return false;

        const date = new Date(orderDate);
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const toDate = filters.dateTo ? new Date(filters.dateTo) : null;

        if (fromDate && date < fromDate) return false;
        if (toDate && date > toDate) return false;

        return true;
      });
    }

    setFilteredOrders(filtered);
  }, [orders, filters]);

  // Reset filtri
  const resetFilters = () => {
    setFilters({
      status: '',
      client: '',
      dateFrom: '',
      dateTo: '',
      searchTerm: ''
    });
  };

  // Formatta lo stato
  const getStatusDisplay = (status: string, isRejected?: boolean) => {
    if (status === 'COMPLETO') {
      return isRejected ? 
        { label: 'RESPINTO', color: 'error' as const } :
        { label: 'COMPLETATO', color: 'success' as const };
    }
    
    switch (status) {
      case 'SPEDITO':
        return { label: 'SPEDITO', color: 'info' as const };
      default:
        return { label: status, color: 'default' as const };
    }
  };

  // Calcola statistiche
  const getStats = () => {
    const shipped = filteredOrders.filter(o => o.status === 'SPEDITO').length;
    const completed = filteredOrders.filter(o => o.status === 'COMPLETO' && !o.pickupOrder?.isRejected).length;
    const rejected = filteredOrders.filter(o => o.pickupOrder?.isRejected).length;
    
    return { shipped, completed, rejected, total: filteredOrders.length };
  };

  const stats = getStats();

  useEffect(() => {
    loadData();
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          📋 Storico Spedizioni
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadData}
          disabled={loading}
        >
          Aggiorna
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Statistiche */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary.main">{stats.total}</Typography>
              <Typography variant="body2">Totale</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="info.main">{stats.shipped}</Typography>
              <Typography variant="body2">Spediti</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="success.main">{stats.completed}</Typography>
              <Typography variant="body2">Completati</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="error.main">{stats.rejected}</Typography>
              <Typography variant="body2">Respinti</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtri */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FilterList sx={{ mr: 1 }} />
            <Typography variant="h6">Filtri</Typography>
            <Box sx={{ ml: 'auto' }}>
              <Button
                startIcon={<Clear />}
                onClick={resetFilters}
                size="small"
              >
                Reset
              </Button>
            </Box>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Cerca"
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                placeholder="Numero ordine, bacino, mittente..."
                size="small"
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Stato</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  label="Stato"
                >
                  <MenuItem value="">Tutti</MenuItem>
                  <MenuItem value="SPEDITO">Spedito</MenuItem>
                  <MenuItem value="COMPLETO">Completato</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Cliente"
                value={filters.client}
                onChange={(e) => setFilters(prev => ({ ...prev, client: e.target.value }))}
                size="small"
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Data Da"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Data A"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            
            <Grid item xs={12} md={1}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Download />}
                size="small"
                sx={{ height: '40px' }}
              >
                Export
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabella */}
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Caricamento...</Typography>
            </Box>
          ) : filteredOrders.length === 0 ? (
            <Alert severity="info">
              Nessuna spedizione trovata con i filtri selezionati
            </Alert>
          ) : (
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Ordine</strong></TableCell>
                    <TableCell><strong>Cliente</strong></TableCell>
                    <TableCell><strong>Stato</strong></TableCell>
                    <TableCell><strong>Mittente → Destinatario</strong></TableCell>
                    <TableCell><strong>Data Emissione</strong></TableCell>
                    <TableCell><strong>Data Carico</strong></TableCell>
                    <TableCell><strong>Data Scarico</strong></TableCell>
                    <TableCell><strong>Data Completamento</strong></TableCell>
                    <TableCell><strong>Peso Partenza</strong></TableCell>
                    <TableCell><strong>Peso Arrivo</strong></TableCell>
                    <TableCell><strong>Colli</strong></TableCell>
                    <TableCell align="center"><strong>Azioni</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const statusDisplay = getStatusDisplay(order.status, order.pickupOrder?.isRejected);
                    
                    return (
                      <TableRow key={order.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {order.orderNumber}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {order.pickupOrder?.basin?.code || 'N/D'}
                          </Typography>
                        </TableCell>
                        
                        <TableCell>
                          {order.pickupOrder?.basin?.client?.name || 'N/D'}
                        </TableCell>
                        
                        <TableCell>
                          <Chip 
                            label={statusDisplay.label} 
                            color={statusDisplay.color} 
                            size="small"
                            icon={order.pickupOrder?.isRejected ? <Cancel /> : order.status === 'COMPLETO' ? <CheckCircle /> : <LocalShipping />}
                          />
                          {order.pickupOrder?.isRejected && order.pickupOrder?.rejectionReason && (
                            <Tooltip title={order.pickupOrder.rejectionReason}>
                              <Typography variant="caption" color="error" display="block">
                                {order.pickupOrder.rejectionReason.length > 30 
                                  ? `${order.pickupOrder.rejectionReason.substring(0, 30)}...` 
                                  : order.pickupOrder.rejectionReason
                                }
                              </Typography>
                            </Tooltip>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="body2" noWrap>
                            <strong>Da:</strong> {order.pickupOrder?.logisticSender?.name || 'N/D'}
                          </Typography>
                          <Typography variant="body2" noWrap>
                            <strong>A:</strong> {order.pickupOrder?.logisticRecipient?.name || 'N/D'}
                          </Typography>
                        </TableCell>
                        
                        <TableCell>
                          {order.pickupOrder?.issueDate ? 
                            format(new Date(order.pickupOrder.issueDate), 'dd/MM/yyyy', { locale: it }) : 
                            'N/D'
                          }
                        </TableCell>
                        
                        <TableCell>
                          {order.pickupOrder?.loadingDate ? 
                            format(new Date(order.pickupOrder.loadingDate), 'dd/MM/yyyy HH:mm', { locale: it }) : 
                            'N/D'
                          }
                        </TableCell>
                        
                        <TableCell>
                          {order.pickupOrder?.unloadingDate ? 
                            format(new Date(order.pickupOrder.unloadingDate), 'dd/MM/yyyy HH:mm', { locale: it }) : 
                            'N/D'
                          }
                        </TableCell>
                        
                        <TableCell>
                          {order.pickupOrder?.completionDate ? 
                            format(new Date(order.pickupOrder.completionDate), 'dd/MM/yyyy HH:mm', { locale: it }) : 
                            'N/D'
                          }
                        </TableCell>
                        
                        <TableCell>
                          <Chip
                            label={order.pickupOrder?.departureWeight ? 
                              `${order.pickupOrder.departureWeight} t` : 
                              'N/D'
                            }
                            color="info"
                            size="small"
                          />
                        </TableCell>
                        
                        <TableCell>
                          <Chip
                            label={order.pickupOrder?.arrivalWeight ? 
                              `${order.pickupOrder.arrivalWeight} t` : 
                              'N/D'
                            }
                            color={order.pickupOrder?.isRejected ? "error" : "success"}
                            size="small"
                          />
                        </TableCell>
                        
                        <TableCell>
                          {order.pickupOrder?.loadedPackages || 'N/D'}
                        </TableCell>
                        
                        <TableCell align="center">
                          <Tooltip title="Visualizza dettagli">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => window.open(`/pickup-orders/${order.id}`, '_blank')}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default ShippedOrderHistory;