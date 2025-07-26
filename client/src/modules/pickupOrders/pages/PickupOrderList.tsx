// client/src/modules/pickupOrders/pages/PickupOrderList.tsx - CON FUNZIONE PROGRAMMA

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Box,
  IconButton,
  Alert,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Search,
  FilterList,
  Clear,
  Refresh,
  Schedule,
  PlayArrow
} from '@mui/icons-material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

import * as pickupOrderService from '../services/ocrPickupOrderService';
import * as workflowService from '../services/workflowService';
import * as shipmentService from '../../shipments/services/shipmentService';
import type { PickupOrder, PickupOrderStatus } from '../services/ocrPickupOrderService';

// --- INTERFACES ---
interface ScheduleFormData {
  pickupOrderId: string;
  scheduledDate: string;
  timeSlot: string;
  priority: string;
  notes: string;
}

// --- DATI STATICI ---
const timeSlots = [
  { value: 'MATTINA', label: 'Mattina (8:00 - 12:00)' },
  { value: 'POMERIGGIO', label: 'Pomeriggio (12:00 - 17:00)' },
  { value: 'SERA', label: 'Sera (17:00 - 20:00)' },
  { value: 'FLESSIBILE', label: 'Flessibile' },
];

const priorities = [
  { value: 'LOW', label: 'Bassa' },
  { value: 'NORMAL', label: 'Normale' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'URGENT', label: 'Urgente' },
];

const PickupOrderList = () => {
  const navigate = useNavigate();
  
  // Stati per dati
  const [pickupOrders, setPickupOrders] = useState<PickupOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PickupOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Stati per filtri
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('DA_EVADERE'); // DEFAULT "Da Evadere"
  const [dateFilter, setDateFilter] = useState('all');
  
  // Stati per paginazione
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  // Stati per statistiche
  const [stats, setStats] = useState({
    total: 0,
    byStatus: {} as Record<string, number>
  });

  // NUOVI STATI per programmazione
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [selectedPickupOrder, setSelectedPickupOrder] = useState<PickupOrder | null>(null);
  const [scheduleData, setScheduleData] = useState<ScheduleFormData>({
    pickupOrderId: '',
    scheduledDate: '',
    timeSlot: '',
    priority: 'NORMAL',
    notes: '',
  });
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Carica pickup orders
  const fetchPickupOrders = async () => {
    try {
      setLoading(true);
      const data = await pickupOrderService.getPickupOrders();
      setPickupOrders(data);
      setError(null);
      
      // Calcola statistiche
      const statusCounts = data.reduce((acc: Record<string, number>, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});
      
      setStats({
        total: data.length,
        byStatus: statusCounts
      });
      
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

  // Applica filtri
  const applyFilters = () => {
    let filtered = [...pickupOrders];
    
    // Filtro per stato
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    // Filtro per ricerca
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(search) ||
        (order.logisticSender?.name || '').toLowerCase().includes(search) ||
        (order.logisticRecipient?.name || '').toLowerCase().includes(search) ||
        (order.basin?.code || '').toLowerCase().includes(search) ||
        (order.basin?.client?.name || '').toLowerCase().includes(search)
      );
    }
    
    // Filtro per data
    if (dateFilter !== 'all') {
      const today = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(order => {
            const orderDate = new Date(order.issueDate);
            orderDate.setHours(0, 0, 0, 0);
            return orderDate.getTime() === filterDate.getTime();
          });
          break;
        case 'week':
          filterDate.setDate(today.getDate() - 7);
          filtered = filtered.filter(order => 
            new Date(order.issueDate) >= filterDate
          );
          break;
        case 'month':
          filterDate.setMonth(today.getMonth() - 1);
          filtered = filtered.filter(order => 
            new Date(order.issueDate) >= filterDate
          );
          break;
      }
    }
    
    // Ordinamento: DA_EVADERE sempre in cima
    filtered.sort((a, b) => {
      // Prima per stato (DA_EVADERE sempre primi)
      if (a.status === 'DA_EVADERE' && b.status !== 'DA_EVADERE') return -1;
      if (b.status === 'DA_EVADERE' && a.status !== 'DA_EVADERE') return 1;
      
      // Poi per data (più recenti primi)
      return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
    });
    
    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset paginazione
  };

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
    setSearchTerm('');
    setStatusFilter('DA_EVADERE'); // Torna al default
    setDateFilter('all');
  };

  // Elimina ordine
  const handleDelete = async (id: string) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo buono di ritiro?')) {
      return;
    }
    
    try {
      await pickupOrderService.deletePickupOrder(id);
      await fetchPickupOrders(); // Ricarica la lista
    } catch (error: any) {
      console.error('Error deleting pickup order:', error);
      alert(error.response?.data?.message || 'Errore durante l\'eliminazione del buono di ritiro');
    }
  };

  // NUOVE FUNZIONI per programmazione
  const handleOpenScheduleDialog = (order: PickupOrder) => {
    setSelectedPickupOrder(order);
    setScheduleData({
      pickupOrderId: order.id,
      scheduledDate: format(new Date(), 'yyyy-MM-dd'),
      timeSlot: '',
      priority: 'NORMAL',
      notes: '',
    });
    setScheduleDialog(true);
  };

  const confirmSchedule = async () => {
    if (!scheduleData.timeSlot || !scheduleData.scheduledDate) {
      alert('Seleziona una data e una fascia oraria per la programmazione.');
      return;
    }

    setScheduleLoading(true);
    try {
      const scheduledDateISO = new Date(scheduleData.scheduledDate).toISOString();

      await shipmentService.scheduleShipment({
        pickupOrderId: scheduleData.pickupOrderId,
        scheduledDate: scheduledDateISO,
        timeSlot: scheduleData.timeSlot,
        priority: scheduleData.priority,
        notes: scheduleData.notes,
      });

      setScheduleDialog(false);
      await fetchPickupOrders(); // Ricarica la lista per aggiornare lo stato
    } catch (err: any) {
      console.error("Error scheduling order:", err);
      alert(`Errore durante la programmazione: ${err.message}`);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleView = (id: string) => {
    navigate(`/pickup-orders/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/pickup-orders/edit/${id}`);
  };

  useEffect(() => {
    fetchPickupOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [pickupOrders, searchTerm, statusFilter, dateFilter]);

  const { data: paginatedOrders, totalPages } = getPaginatedOrders();

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          📋 Gestione Buoni di Ritiro
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchPickupOrders}
            disabled={loading}
          >
            Aggiorna
          </Button>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => navigate('/pickup-orders/upload')}
          >
            Carica da PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/pickup-orders/new')}
          >
            Nuovo Buono
          </Button>
        </Box>
      </Box>

      {/* Statistiche Rapide */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="warning.main">
                {stats.byStatus['DA_EVADERE'] || 0}
              </Typography>
              <Typography variant="caption">🔥 Da Evadere</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="info.main">
                {stats.byStatus['PROGRAMMATO'] || 0}
              </Typography>
              <Typography variant="caption">📅 Programmati</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary.main">
                {stats.byStatus['IN_EVASIONE'] || 0}
              </Typography>
              <Typography variant="caption">🚚 In Evasione</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="success.main">
                {stats.byStatus['COMPLETO'] || 0}
              </Typography>
              <Typography variant="caption">✅ Completati</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="text.secondary">
                {stats.total}
              </Typography>
              <Typography variant="caption">📊 Totale</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="error.main">
                {stats.byStatus['CANCELLED'] || 0}
              </Typography>
              <Typography variant="caption">❌ Cancellati</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtri Avanzati */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            {/* Ricerca */}
            <TextField
              size="small"
              placeholder="Cerca per numero, cliente, mittente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
            
            {/* Filtro Stato */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Stato</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Stato"
              >
                <MenuItem value="all">Tutti</MenuItem>
                <MenuItem value="DA_EVADERE">Da Evadere</MenuItem>
                <MenuItem value="PROGRAMMATO">Programmato</MenuItem>
                <MenuItem value="IN_EVASIONE">In Evasione</MenuItem>
                <MenuItem value="IN_CARICO">In Carico</MenuItem>
                <MenuItem value="CARICATO">Caricato</MenuItem>
                <MenuItem value="SPEDITO">Spedito</MenuItem>
                <MenuItem value="COMPLETO">Completo</MenuItem>
                <MenuItem value="CANCELLED">Cancellato</MenuItem>
              </Select>
            </FormControl>
            
            {/* Filtro Data */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Periodo</InputLabel>
              <Select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                label="Periodo"
              >
                <MenuItem value="all">Tutti</MenuItem>
                <MenuItem value="today">Oggi</MenuItem>
                <MenuItem value="week">Ultima settimana</MenuItem>
                <MenuItem value="month">Ultimo mese</MenuItem>
              </Select>
            </FormControl>
            
            {/* Reset Filtri */}
            <Button
              variant="outlined"
              startIcon={<Clear />}
              onClick={resetFilters}
              size="small"
            >
              Reset
            </Button>
            
            {/* Info Filtri Attivi */}
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterList color="action" />
              <Typography variant="body2" color="text.secondary">
                {filteredOrders.length} di {stats.total} ordini
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      {/* Tabella Principale */}
      <Paper>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : filteredOrders.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {searchTerm || statusFilter !== 'DA_EVADERE' || dateFilter !== 'all' 
                ? 'Nessun ordine trovato con i filtri applicati'
                : 'Nessun buono di ritiro presente'
              }
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Stato</strong></TableCell>
                    <TableCell><strong>Numero Buono</strong></TableCell>
                    <TableCell><strong>Data Scarico</strong></TableCell>
                    <TableCell><strong>Cliente</strong></TableCell>
                    <TableCell><strong>Mittente</strong></TableCell>
                    <TableCell><strong>Destinatario</strong></TableCell>
                    <TableCell><strong>Bacino</strong></TableCell>
                    <TableCell><strong>Quantità Prev.</strong></TableCell>
                    <TableCell align="center"><strong>Azioni</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedOrders.map((order) => (
                    <TableRow 
                      key={order.id}
                      sx={{
                        // Evidenzia ordini DA_EVADERE
                        backgroundColor: order.status === 'DA_EVADERE' ? 'warning.light' : 'inherit',
                        '&:hover': {
                          backgroundColor: order.status === 'DA_EVADERE' ? 'warning.main' : 'action.hover',
                        }
                      }}
                    >
                      <TableCell>
                        <Chip 
                          label={workflowService.formatStatus(order.status)} 
                          color={workflowService.getStatusColor(order.status)}
                          size="small"
                          icon={<span>{workflowService.getStatusIcon(order.status)}</span>}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {order.orderNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {order.unloadingDate 
                          ? format(new Date(order.unloadingDate), 'dd/MM/yyyy', { locale: it })
                          : order.scheduledDate 
                            ? format(new Date(order.scheduledDate), 'dd/MM/yyyy', { locale: it })
                            : format(new Date(order.issueDate), 'dd/MM/yyyy', { locale: it })
                        }
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {order.client?.name || order.basin?.client?.name || 'N/D'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {order.logisticSender?.name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {order.logisticRecipient?.name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {order.basin?.code || 'N/A'}
                          {order.basin?.description && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              {order.basin.description}
                            </Typography>
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {order.expectedQuantity ? `${order.expectedQuantity} t` : 'N/A'}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          {/* PULSANTE PROGRAMMA - Solo per ordini DA_EVADERE */}
                          {order.status === 'DA_EVADERE' && (
                            <Tooltip title="Programma Spedizione">
                              <IconButton 
                                onClick={() => handleOpenScheduleDialog(order)} 
                                color="warning" 
                                size="small"
                                sx={{ 
                                  backgroundColor: 'warning.main', 
                                  color: 'white',
                                  '&:hover': { backgroundColor: 'warning.dark' }
                                }}
                              >
                                <Schedule />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          <IconButton 
                            onClick={() => handleView(order.id)} 
                            color="info" 
                            title="Visualizza"
                            size="small"
                          >
                            <Visibility />
                          </IconButton>
                          <IconButton 
                            onClick={() => handleEdit(order.id)} 
                            color="primary" 
                            title="Modifica"
                            size="small"
                          >
                            <Edit />
                          </IconButton>
                          <IconButton 
                            onClick={() => handleDelete(order.id)} 
                            color="error" 
                            title="Elimina"
                            size="small"
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
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
                Mostrando {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredOrders.length)} di {filteredOrders.length} elementi
              </Typography>
            </Box>
          </>
        )}
      </Paper>

      {/* Dialog per la programmazione */}
      <Dialog open={scheduleDialog} onClose={() => setScheduleDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>📅 Programma Spedizione: Ordine #{selectedPickupOrder?.orderNumber}</DialogTitle>
        <DialogContent>
          {selectedPickupOrder && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>Cliente:</strong> {selectedPickupOrder.client?.name || selectedPickupOrder.basin?.client?.name || 'N/A'}<br/>
                <strong>Bacino:</strong> {selectedPickupOrder.basin?.code || 'N/A'} - {selectedPickupOrder.basin?.description || ''}
              </Alert>

              <TextField
                label="Data Programmazione"
                type="date"
                fullWidth
                value={scheduleData.scheduledDate}
                onChange={(e) => setScheduleData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{ mb: 2 }}
              />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="time-slot-label">Fascia Oraria *</InputLabel>
                    <Select
                      labelId="time-slot-label"
                      id="time-slot-select"
                      value={scheduleData.timeSlot}
                      onChange={(e) => setScheduleData(prev => ({ ...prev, timeSlot: e.target.value as string }))}
                      label="Fascia Oraria *"
                    >
                      {timeSlots.map((slot) => (
                        <MenuItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="priority-label">Priorità</InputLabel>
                    <Select
                      labelId="priority-label"
                      id="priority-select"
                      value={scheduleData.priority}
                      onChange={(e) => setScheduleData(prev => ({ ...prev, priority: e.target.value }))}
                      label="Priorità"
                    >
                      {priorities.map((priority) => (
                        <MenuItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Note (opzionale)"
                    value={scheduleData.notes}
                    onChange={(e) => setScheduleData(prev => ({ ...prev, notes: e.target.value }))}
                    multiline
                    rows={2}
                    fullWidth
                    placeholder="Eventuali note sulla programmazione..."
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialog(false)}>
            Annulla
          </Button>
          <Button
            onClick={confirmSchedule}
            variant="contained"
            disabled={!scheduleData.timeSlot || scheduleLoading}
            startIcon={<Schedule />}
          >
            {scheduleLoading ? 'Programmando...' : 'Conferma Programmazione'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PickupOrderList;