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
  Tooltip,
  CircularProgress,
  Pagination
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

// ✅ CORREZIONE: Interfaccia semplificata allineata alla struttura reale dell'API
interface ShippedOrder {
  id: string;
  orderNumber: string;
  status: string;
  issueDate: string;
  scheduledDate?: string;
  loadingDate?: string;
  unloadingDate?: string;
  completionDate?: string;
  departureWeight?: number;
  arrivalWeight?: number;
  loadedPackages?: number;
  expectedQuantity?: number;
  actualQuantity?: number;
  destinationQuantity?: number;
  isRejected?: boolean;
  rejectionReason?: string;
  rejectionDate?: string;
  basin?: {
    code: string;
    description?: string;
    client?: {
      name: string;
    };
  };
  logisticSender?: {
    name: string;
  };
  logisticRecipient?: {
    name: string;
  };
  logisticTransporter?: {
    name: string;
  };
  assignedOperator?: {
    firstName: string;
    lastName: string;
  };
  client?: {
    name: string;
  };
  [key: string]: any;
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
  
  // Stati per paginazione
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    client: '',
    dateFrom: '',
    dateTo: '',
    searchTerm: ''
  });

  // ✅ CORREZIONE: Carica i dati con gestione migliorata
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📊 === CARICAMENTO STORICO SPEDIZIONI ===');

      // ✅ CORREZIONE: Query ottimizzata per ordini completati con include esplicito
      const [ordersResponse, clientsResponse] = await Promise.all([
        api.get('/pickup-orders', {
          params: {
            status: 'COMPLETO',
            include: 'basin,basin.client,logisticSender,logisticRecipient,assignedOperator,client',
            limit: 200 // Aumenta il limite per avere più dati
          }
        }),
        api.get('/clients').catch(() => ({ data: [] })) // Fallback se endpoint non disponibile
      ]);

      const ordersData = ordersResponse.data || [];
      
      console.log(`📦 Ordini COMPLETI ricevuti dal server: ${ordersData.length}`);
      console.log('📋 Struttura primo ordine:', ordersData[0] || 'Nessun ordine');

      // ✅ CORREZIONE: Filtra e valida ordini con logging dettagliato
      const completedOrders = ordersData.filter((order: ShippedOrder) => {
        const isCompleted = order.status === 'COMPLETO' || order.completionDate;
        
        if (isCompleted) {
          console.log(`✅ Ordine valido: ${order.orderNumber}`, {
            status: order.status,
            completionDate: order.completionDate,
            departureWeight: order.departureWeight,
            arrivalWeight: order.arrivalWeight,
            clientName: order.basin?.client?.name || order.client?.name,
            senderName: order.logisticSender?.name,
            recipientName: order.logisticRecipient?.name,
            isRejected: order.isRejected
          });
        } else {
          console.log(`❌ Ordine escluso: ${order.orderNumber} (status: ${order.status})`);
        }
        
        return isCompleted;
      });

      // ✅ ORDINAMENTO per data di completamento
      const sortedOrders = completedOrders.sort((a: ShippedOrder, b: ShippedOrder) => {
        const dateA = new Date(a.completionDate || a.updatedAt || a.createdAt || 0);
        const dateB = new Date(b.completionDate || b.updatedAt || b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });

      setOrders(sortedOrders);
      setClients(clientsResponse.data || []);
      
      console.log(`📊 Totale ordini nello storico: ${sortedOrders.length}`);
      console.log('✅ === FINE CARICAMENTO STORICO ===');
      
    } catch (error: any) {
      console.error('❌ Errore nel caricamento dello storico spedizioni:', error);
      setError(error.response?.data?.message || 'Errore nel caricamento dello storico spedizioni');
    } finally {
      setLoading(false);
    }
  };

  // ✅ CORREZIONE: Filtri aggiornati per la struttura dati corretta
  useEffect(() => {
    let filtered = [...orders];

    // Filtro per cliente
    if (filters.client) {
      filtered = filtered.filter(order => {
        const clientName = order.basin?.client?.name || order.client?.name || '';
        return clientName.toLowerCase().includes(filters.client.toLowerCase());
      });
    }

    // Filtro per termine di ricerca
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(term) ||
        order.basin?.code?.toLowerCase().includes(term) ||
        order.logisticSender?.name?.toLowerCase().includes(term) ||
        order.logisticRecipient?.name?.toLowerCase().includes(term)
      );
    }

    // Filtro per data di completamento
    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter(order => {
        const orderDate = order.completionDate || order.issueDate;
        if (!orderDate) return false;

        const date = new Date(orderDate);
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const toDate = filters.dateTo ? new Date(filters.dateTo) : null;

        if (fromDate && date < fromDate) return false;
        if (toDate) {
          const endDate = new Date(toDate);
          endDate.setHours(23, 59, 59, 999);
          if (date > endDate) return false;
        }

        return true;
      });
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
  }, [orders, filters]);

  // Paginazione
  const getPaginatedOrders = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return {
      data: filteredOrders.slice(startIndex, endIndex),
      totalPages: Math.ceil(filteredOrders.length / itemsPerPage)
    };
  };

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
        { label: 'RESPINTO', color: 'error' as const, icon: <Cancel /> } :
        { label: 'COMPLETATO', color: 'success' as const, icon: <CheckCircle /> };
    }
    
    return { label: status, color: 'default' as const, icon: <LocalShipping /> };
  };

  // ✅ CORREZIONE: Calcolo statistiche con fallback
  const getStats = () => {
    const total = filteredOrders.length;
    const completed = filteredOrders.filter(o => !o.isRejected).length;
    const rejected = filteredOrders.filter(o => o.isRejected).length;
    const totalWeight = filteredOrders.reduce((sum, order) => {
      const weight = order.arrivalWeight || order.departureWeight || 0;
      return sum + weight;
    }, 0);
    
    return { total, completed, rejected, totalWeight };
  };

  // ✅ HELPER: Formatta data con fallback
  const formatDate = (dateString?: string, withTime = false) => {
    if (!dateString) return 'N/D';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/D';
      
      const formatString = withTime ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy';
      return format(date, formatString, { locale: it });
    } catch (error) {
      console.error('Errore nel formato data:', error);
      return 'N/D';
    }
  };

  const stats = getStats();
  const { data: paginatedOrders, totalPages } = getPaginatedOrders();

  useEffect(() => {
    loadData();
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          📊 Storico Spedizioni - Solo COMPLETATE
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadData}
          disabled={loading}
        >
          {loading ? 'Aggiornamento...' : 'Aggiorna'}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* ✅ Debug Info - Rimuovi in produzione */}
      {orders.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          🔍 Debug: Caricati {orders.length} ordini. 
          Primo ordine: {orders[0]?.orderNumber} - 
          Cliente: {orders[0]?.basin?.client?.name || orders[0]?.client?.name || 'N/D'}
        </Alert>
      )}

      {/* Statistiche */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="success.main">{stats.total}</Typography>
              <Typography variant="body2">✅ Totale Completate</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary.main">{stats.completed}</Typography>
              <Typography variant="body2">🎯 Accettate</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="error.main">{stats.rejected}</Typography>
              <Typography variant="body2">🚫 Respinte</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="info.main">{stats.totalWeight.toFixed(2)}</Typography>
              <Typography variant="body2">⚖️ Peso Totale (t)</Typography>
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
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {filteredOrders.length} di {orders.length} spedizioni
              </Typography>
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
                label="🔍 Cerca"
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                placeholder="Numero ordine, bacino, mittente..."
                size="small"
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="👥 Cliente"
                value={filters.client}
                onChange={(e) => setFilters(prev => ({ ...prev, client: e.target.value }))}
                placeholder="Nome cliente..."
                size="small"
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="📅 Data Da"
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
                label="📅 Data A"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  size="small"
                  sx={{ height: '40px' }}
                  fullWidth
                  disabled={filteredOrders.length === 0}
                >
                  📊 Export Excel
                </Button>
              </Box>
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
              <Typography sx={{ ml: 2 }}>Caricamento storico spedizioni...</Typography>
            </Box>
          ) : filteredOrders.length === 0 ? (
            <Alert severity="warning">
              {filters.searchTerm || filters.client || filters.dateFrom || filters.dateTo ? 
                'Nessuna spedizione completata trovata con i filtri selezionati' :
                orders.length === 0 ? 
                  'Nessuna spedizione completata presente nel sistema. Verifica che ci siano ordini con status "COMPLETO".' :
                  'Tutti gli ordini sono stati filtrati. Prova a modificare i criteri di ricerca.'
              }
            </Alert>
          ) : (
            <>
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
                    {paginatedOrders.map((order) => {
                      const statusDisplay = getStatusDisplay(order.status, order.isRejected);
                      
                      return (
                        <TableRow key={order.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {order.orderNumber || 'N/D'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {order.basin?.code || 'N/D'}
                            </Typography>
                          </TableCell>
                          
                          <TableCell>
                            <Typography variant="body2">
                              {order.basin?.client?.name || order.client?.name || 'N/D'}
                            </Typography>
                          </TableCell>
                          
                          <TableCell>
                            <Chip 
                              label={statusDisplay.label} 
                              color={statusDisplay.color} 
                              size="small"
                              icon={statusDisplay.icon}
                            />
                            {order.isRejected && order.rejectionReason && (
                              <Tooltip title={order.rejectionReason}>
                                <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                                  {order.rejectionReason.length > 30 
                                    ? `${order.rejectionReason.substring(0, 30)}...` 
                                    : order.rejectionReason
                                  }
                                </Typography>
                              </Tooltip>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <Typography variant="body2" noWrap>
                              <strong>Da:</strong> {order.logisticSender?.name || 'N/D'}
                            </Typography>
                            <Typography variant="body2" noWrap>
                              <strong>A:</strong> {order.logisticRecipient?.name || 'N/D'}
                            </Typography>
                          </TableCell>
                          
                          <TableCell>
                            {formatDate(order.issueDate)}
                          </TableCell>
                          
                          <TableCell>
                            {formatDate(order.loadingDate, true)}
                          </TableCell>
                          
                          <TableCell>
                            {formatDate(order.unloadingDate, true)}
                          </TableCell>
                          
                          <TableCell>
                            <Typography variant="body2" color="success.main" fontWeight="bold">
                              {formatDate(order.completionDate, true)}
                            </Typography>
                          </TableCell>
                          
                          <TableCell>
                            <Chip
                              label={order.departureWeight ? 
                                `${order.departureWeight} t` : 
                                'N/D'
                              }
                              color="info"
                              size="small"
                            />
                          </TableCell>
                          
                          <TableCell>
                            <Chip
                              label={order.arrivalWeight ? 
                                `${order.arrivalWeight} t` : 
                                'N/D'
                              }
                              color={order.isRejected ? "error" : "success"}
                              size="small"
                            />
                          </TableCell>
                          
                          <TableCell>
                            <Chip
                              label={order.loadedPackages || 'N/D'}
                              color="default"
                              size="small"
                            />
                          </TableCell>
                          
                          <TableCell align="center">
                            <Tooltip title="Visualizza dettagli completi">
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
              
              {/* Paginazione */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={(e, page) => setCurrentPage(page)}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
              
              {/* Info Paginazione */}
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', backgroundColor: 'grey.50' }}>
                <Typography variant="caption" color="text.secondary">
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredOrders.length)} di {filteredOrders.length} spedizioni completate
                  {stats.rejected > 0 && (
                    <Chip 
                      label={`${stats.rejected} respinte`} 
                      color="error" 
                      size="small" 
                      sx={{ ml: 2 }} 
                    />
                  )}
                </Typography>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default ShippedOrderHistory;