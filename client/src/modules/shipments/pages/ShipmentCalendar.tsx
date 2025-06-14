// client/src/modules/shipments/pages/ShipmentCalendar.tsx - VERSIONE SEMPLIFICATA

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Edit,
  Refresh,
  Visibility,
  PlayArrow,
  LocalShipping,
  History,
  Settings
} from '@mui/icons-material';
import { format, addDays, startOfWeek } from 'date-fns';
import { it } from 'date-fns/locale';
import * as shipmentService from '../services/shipmentService';
import StatusManagementDialog from '../components/StatusManagementDialog';

// Mock AuthContext per evitare errori - da sostituire con il vero AuthContext
const useAuth = () => ({
  user: {
    id: 'mock-user-id',
    role: 'MANAGER',
    email: 'mock@example.com'
  }
});

// --- INTERFACES ---
interface PickupOrderNestedInShipment {
  id: string;
  orderNumber: string;
  status: string;
  issueDate: string;
  scheduledDate?: string;
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
  expectedQuantity?: number;
  assignedOperator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Shipment {
  id: string;
  pickupOrderId: string;
  scheduledDate: string;
  timeSlot: string;
  priority: string;
  estimatedDuration?: number;
  specialInstructions?: string;
  equipmentNeeded?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  pickupOrder: PickupOrderNestedInShipment;
  orderNumber: string;
  status: string;
}

interface EditShipmentFormData {
  id: string;
  scheduledDate: string;
  timeSlot: string;
  priority: string;
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

function ShipmentCalendar() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scheduledShipments, setScheduledShipments] = useState<Shipment[]>([]);
  
  // Stati dialogs esistenti
  const [editScheduleDialog, setEditScheduleDialog] = useState(false);
  const [editShipmentData, setEditShipmentData] = useState<EditShipmentFormData | null>(null);

  const [startEvadingDialog, setStartEvadingDialog] = useState(false);
  const [selectedShipmentForEvading, setSelectedShipmentForEvading] = useState<Shipment | null>(null);
  const [evadingNotes, setEvadingNotes] = useState<string>('');

  // STATI per gestione stati e menu contestuale
  const [statusManagementDialog, setStatusManagementDialog] = useState(false);
  const [selectedOrderForStatusChange, setSelectedOrderForStatusChange] = useState<any>(null);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    shipment: Shipment;
  } | null>(null);

  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const datesOfWeek = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 === INIZIO FETCH DATA CALENDAR ===');
      
      // Debug database
      await shipmentService.debugDatabaseStatus();
      
      // Ottieni le spedizioni per la settimana corrente
      const startDate = format(currentWeekStart, 'yyyy-MM-dd');
      const endDate = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd');
      
      console.log('📅 Caricamento spedizioni per periodo:', { startDate, endDate });
      const shipmentsResponse = await shipmentService.getShipments({
        startDate,
        endDate,
      });
      
      console.log('📦 Spedizioni caricate dal servizio:', shipmentsResponse.length);
      
      // Filtra per stati rilevanti
      const filteredShipments = shipmentsResponse.filter(shipment => {
        const includeStates = ['PROGRAMMATO', 'IN_EVASIONE', 'IN_CARICO', 'CARICATO', 'SPEDITO'];
        const shouldInclude = includeStates.includes(shipment.status);
        
        if (!shouldInclude) {
          console.log(`❌ Escluso shipment ${shipment.orderNumber} con stato: ${shipment.status}`);
        } else {
          console.log(`✅ Incluso shipment ${shipment.orderNumber} con stato: ${shipment.status}`);
        }
        
        return shouldInclude;
      });
      
      console.log('🎯 Spedizioni filtrate per calendario:', filteredShipments.length);
      setScheduledShipments(filteredShipments);
      
      console.log('✅ === FINE FETCH DATA CALENDAR ===');

    } catch (err: any) {
      console.error("❌ Errore durante il recupero dei dati del calendario:", err);
      setError("Impossibile caricare i dati. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentWeekStart]);

  // --- HANDLERS ---
  const handleStartEvading = (shipment: Shipment) => {
    setSelectedShipmentForEvading(shipment);
    setEvadingNotes('');
    setStartEvadingDialog(true);
  };

  const confirmStartEvading = async () => {
    if (!selectedShipmentForEvading) return;

    setLoading(true);
    try {
      await shipmentService.changeOrderStatus({
        pickupOrderId: selectedShipmentForEvading.pickupOrder.id,
        fromStatus: 'PROGRAMMATO',
        toStatus: 'IN_EVASIONE',
        reason: 'Avvio evasione dal calendario manager',
        notes: evadingNotes
      });

      setStartEvadingDialog(false);
      setSelectedShipmentForEvading(null);
      setEvadingNotes('');
      fetchData();
    } catch (err: any) {
      console.error('Error starting evading:', err);
      alert(`Errore durante l'avvio dell'evasione: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (shipment: Shipment) => {
    setEditShipmentData({
      id: shipment.id,
      scheduledDate: format(new Date(shipment.scheduledDate), 'yyyy-MM-dd'),
      timeSlot: shipment.timeSlot,
      priority: shipment.priority,
    });
    setEditScheduleDialog(true);
  };

  const confirmEditShipment = async () => {
    if (!editShipmentData || !editShipmentData.timeSlot || !editShipmentData.scheduledDate) {
      alert('Compila tutti i campi obbligatori (Data e Fascia Oraria).');
      return;
    }

    setLoading(true);
    try {
      const updatedDateISO = new Date(editShipmentData.scheduledDate).toISOString();

      await shipmentService.updateShipment(editShipmentData.id, {
        scheduledDate: updatedDateISO,
        timeSlot: editShipmentData.timeSlot,
        priority: editShipmentData.priority,
      });

      setEditScheduleDialog(false);
      setEditShipmentData(null);
      fetchData();
    } catch (err: any) {
      console.error('Error updating shipment:', err);
      alert(`Errore durante l'aggiornamento della spedizione: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS per gestione stati ---
  const handleContextMenu = (event: React.MouseEvent, shipment: Shipment) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      shipment,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleOpenStatusManagement = (shipment?: Shipment) => {
    const orderToManage = shipment || contextMenu?.shipment;
    if (orderToManage) {
      setSelectedOrderForStatusChange({
        id: orderToManage.pickupOrder.id,
        orderNumber: orderToManage.orderNumber,
        status: orderToManage.status,
        scheduledDate: orderToManage.scheduledDate,
        basin: orderToManage.pickupOrder.basin,
        assignedOperator: orderToManage.pickupOrder.assignedOperator
      });
      setStatusManagementDialog(true);
    }
    handleCloseContextMenu();
  };

  const handleViewDetails = (shipment: Shipment) => {
    window.open(`/pickup-orders/${shipment.pickupOrder.id}`, '_blank');
    handleCloseContextMenu();
  };

  const handleViewHistory = (shipment: Shipment) => {
    console.log('Visualizza storico per:', shipment.orderNumber);
    handleCloseContextMenu();
  };

  // Funzioni per la navigazione settimanale
  const goToPreviousWeek = () => {
    setCurrentWeekStart((prevWeekStart) => addDays(prevWeekStart, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart((prevWeekStart) => addDays(prevWeekStart, 7));
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Typography>⏳ Caricamento calendario spedizioni...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error">{error}</Alert>
        <Button onClick={fetchData} startIcon={<Refresh />}>Riprova</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        📅 Calendario Spedizioni Manager
      </Typography>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Button onClick={goToPreviousWeek}>⬅️ Settimana Precedente</Button>
        <Typography variant="h6">
          Settimana dal {format(currentWeekStart, 'dd/MM/yyyy', { locale: it })} al {format(addDays(currentWeekStart, 6), 'dd/MM/yyyy', { locale: it })}
        </Typography>
        <Button onClick={goToNextWeek}>Settimana Successiva ➡️</Button>
      </Box>

      {/* Statistiche Rapide */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {scheduledShipments.filter(s => s.status === 'PROGRAMMATO').length}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                📋 Programmati
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {scheduledShipments.filter(s => s.status === 'IN_EVASIONE').length}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                🚚 In Evasione
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main">
                {scheduledShipments.filter(s => s.status === 'CARICATO').length}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                📦 Caricati
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {scheduledShipments.filter(s => s.status === 'SPEDITO').length}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                ✈️ Spediti
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Calendario Settimanale */}
      <Paper elevation={3} sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">📅 Spedizioni Programmate</Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchData}
            disabled={loading}
          >
            Aggiorna
          </Button>
        </Box>
        
        {scheduledShipments.length === 0 ? (
          <Alert severity="info">
            <strong>Nessuna spedizione programmata per questa settimana</strong>
            <br />
            Le spedizioni programmate dalla lista buoni appariranno qui
          </Alert>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {datesOfWeek.map((date) => (
                    <TableCell key={format(date, 'yyyy-MM-dd')} align="center">
                      <Typography variant="subtitle2">
                        {format(date, 'EEEE', { locale: it })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(date, 'dd/MM', { locale: it })}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  {datesOfWeek.map((date) => {
                    const dayShipments = scheduledShipments.filter(
                      (shipment) => format(new Date(shipment.scheduledDate), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                    );
                    return (
                      <TableCell key={format(date, 'yyyy-MM-dd')} sx={{ verticalAlign: 'top', minWidth: '180px' }}>
                        {dayShipments.length === 0 ? (
                          <Typography variant="caption" color="text.secondary">Nessuna spedizione</Typography>
                        ) : (
                          dayShipments.map((shipment) => (
                            <Card 
                              key={shipment.id} 
                              variant="outlined" 
                              sx={{ 
                                mb: 1, 
                                borderColor: shipmentService.getStatusColor(shipment.status) === 'info' ? 'info.main' : 'primary.main',
                                backgroundColor: shipment.status === 'PROGRAMMATO' ? 'rgba(255, 193, 7, 0.1)' : 'inherit',
                                cursor: 'context-menu'
                              }}
                              onContextMenu={(e) => handleContextMenu(e, shipment)}
                            >
                              <CardContent sx={{ p: 1, pb: '8px !important' }}>
                                <Typography variant="subtitle2">
                                  Ordine #{shipment.orderNumber}
                                  {shipment.status === 'PROGRAMMATO' && (
                                    <Chip 
                                      label="Pronto" 
                                      size="small" 
                                      color="warning" 
                                      sx={{ ml: 0.5, fontSize: '0.6rem' }}
                                    />
                                  )}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Cliente: {(shipment.pickupOrder?.basin?.client) ? shipment.pickupOrder.basin.client.name : 'N/A'} ({shipment.pickupOrder?.basin?.code || 'N/A'})
                                </Typography>
                                <Chip
                                  label={shipmentService.formatStatus(shipment.status)}
                                  color={shipmentService.getStatusColor(shipment.status)}
                                  size="small"
                                  sx={{ mt: 0.5 }}
                                />
                                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                  Fascia: {timeSlots.find(slot => slot.value === shipment.timeSlot)?.label || shipment.timeSlot}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  Priorità: {priorities.find(prio => prio.value === shipment.priority)?.label || shipment.priority}
                                </Typography>
                                {shipment.pickupOrder.assignedOperator && (
                                  <Typography variant="caption" display="block" color="success.main">
                                    👤 {shipment.pickupOrder.assignedOperator.firstName} {shipment.pickupOrder.assignedOperator.lastName}
                                  </Typography>
                                )}
                              </CardContent>
                              <Box sx={{ p: 1, pt: 0, display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                {/* Pulsante Avvia Evasione solo per ordini PROGRAMMATO */}
                                {shipment.status === 'PROGRAMMATO' && (
                                  <Tooltip title="Avvia Evasione (Mezzo Arrivato)">
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleStartEvading(shipment)}
                                      color="success"
                                      sx={{ 
                                        backgroundColor: 'success.main', 
                                        color: 'white',
                                        '&:hover': { backgroundColor: 'success.dark' }
                                      }}
                                    >
                                      <PlayArrow fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                
                                {/* Indicatore per ordini IN_EVASIONE */}
                                {shipment.status === 'IN_EVASIONE' && (
                                  <Tooltip title="In Evasione - Attendere Operatore">
                                    <IconButton size="small" color="info" disabled>
                                      <LocalShipping fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}

                                <Tooltip title="Visualizza Dettagli">
                                  <IconButton size="small" onClick={() => handleViewDetails(shipment)}>
                                    <Visibility fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                
                                {/* Permetti modifica solo se PROGRAMMATO */}
                                {shipment.status === 'PROGRAMMATO' && (
                                  <Tooltip title="Modifica Spedizione">
                                    <IconButton size="small" onClick={() => handleEditClick(shipment)}>
                                      <Edit fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}

                                {/* Menu Gestione Stati */}
                                <Tooltip title="Gestisci Stato">
                                  <IconButton size="small" onClick={() => handleOpenStatusManagement(shipment)}>
                                    <Settings fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Card>
                          ))
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Menu Contestuale */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={() => contextMenu && handleViewDetails(contextMenu.shipment)}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>Visualizza Dettagli</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => contextMenu && handleViewHistory(contextMenu.shipment)}>
          <ListItemIcon>
            <History fontSize="small" />
          </ListItemIcon>
          <ListItemText>Storico Stati</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => handleOpenStatusManagement()}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText>Gestisci Stato</ListItemText>
        </MenuItem>
        
        {contextMenu?.shipment.status === 'PROGRAMMATO' && (
          <MenuItem onClick={() => { contextMenu && handleEditClick(contextMenu.shipment); handleCloseContextMenu(); }}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            <ListItemText>Modifica Programmazione</ListItemText>
          </MenuItem>
        )}
        
        {contextMenu?.shipment.status === 'PROGRAMMATO' && (
          <MenuItem onClick={() => { contextMenu && handleStartEvading(contextMenu.shipment); handleCloseContextMenu(); }}>
            <ListItemIcon>
              <PlayArrow fontSize="small" />
            </ListItemIcon>
            <ListItemText>Avvia Evasione</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Dialog per avvio evasione */}
      <Dialog open={startEvadingDialog} onClose={() => setStartEvadingDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>🚀 Avvia Evasione: Ordine #{selectedShipmentForEvading?.orderNumber}</DialogTitle>
        <DialogContent>
          {selectedShipmentForEvading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Cliente: {selectedShipmentForEvading.pickupOrder?.basin?.client?.name || 'N/A'} 
                ({selectedShipmentForEvading.pickupOrder?.basin?.code || 'N/A'})
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Fascia: {timeSlots.find(slot => slot.value === selectedShipmentForEvading.timeSlot)?.label || selectedShipmentForEvading.timeSlot}
              </Typography>
              
              <TextField
                label="Note Evasione"
                value={evadingNotes}
                onChange={(e) => setEvadingNotes(e.target.value)}
                multiline
                rows={3}
                fullWidth
                placeholder="Es: Mezzo arrivato alle 09:30, operatore assegnato..."
                helperText="Inserisci eventuali note sull'avvio dell'evasione"
              />
              
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  🔄 L'ordine passerà da <strong>PROGRAMMATO</strong> a <strong>IN_EVASIONE</strong>.<br/>
                  Gli operatori potranno ora prenderlo in carico dalla loro dashboard.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStartEvadingDialog(false)}>
            Annulla
          </Button>
          <Button
            onClick={confirmStartEvading}
            variant="contained"
            color="success"
            disabled={loading}
            startIcon={<PlayArrow />}
          >
            {loading ? 'Avviando...' : 'Avvia Evasione'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog per modifica spedizione */}
      <Dialog open={editScheduleDialog} onClose={() => setEditScheduleDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>✏️ Modifica Spedizione: #{editShipmentData?.id}</DialogTitle>
        <DialogContent>
          {editShipmentData && (
            <Box sx={{ mt: 2 }}>
              <TextField
                label="Nuova Data Programmazione"
                type="date"
                fullWidth
                value={editShipmentData.scheduledDate}
                onChange={(e) => setEditShipmentData(prev => prev ? { ...prev, scheduledDate: e.target.value } : null)}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{ mb: 2 }}
              />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="edit-time-slot-label">Fascia Oraria</InputLabel>
                    <Select
                      labelId="edit-time-slot-label"
                      id="edit-time-slot-select"
                      value={editShipmentData.timeSlot}
                      onChange={(e) => setEditShipmentData(prev => prev ? { ...prev, timeSlot: e.target.value as string } : null)}
                      label="Fascia Oraria"
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
                    <InputLabel id="edit-priority-label">Priorità</InputLabel>
                    <Select
                      labelId="edit-priority-label"
                      id="edit-priority-select"
                      value={editShipmentData.priority}
                      onChange={(e) => setEditShipmentData(prev => prev ? { ...prev, priority: e.target.value } : null)}
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
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditScheduleDialog(false)}>
            Annulla
          </Button>
          <Button
            onClick={confirmEditShipment}
            variant="contained"
            disabled={!editShipmentData?.timeSlot || !editShipmentData?.scheduledDate || loading}
          >
            {loading ? 'Aggiornando...' : 'Conferma Modifica'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Status Management */}
      <StatusManagementDialog
        open={statusManagementDialog}
        onClose={() => setStatusManagementDialog(false)}
        pickupOrder={selectedOrderForStatusChange}
        userRole={user?.role || 'OPERATOR'}
        onStatusChanged={() => {
          fetchData();
          setStatusManagementDialog(false);
        }}
      />
    </Container>
  );
};

export default ShipmentCalendar;