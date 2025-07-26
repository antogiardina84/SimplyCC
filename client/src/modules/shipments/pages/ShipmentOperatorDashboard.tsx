// client/src/modules/shipments/pages/ShipmentOperatorDashboard.tsx - VERSIONE FINALE CORRETTA

import { useState, useEffect, useRef } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Button,
  Card,
  CardContent,
  CardActions,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Badge,
  Fab
} from '@mui/material';
import { 
  PlayArrow,
  CheckCircle,
  Assignment,
  Schedule,
  LocalShipping,
  Refresh,
  Scale,
  Business,
  List as ListIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import api from '../../../core/services/api';
import * as shipmentService from '../services/shipmentService';

interface MyOrder {
  id: string;
  orderNumber: string;
  status: string;
  scheduledDate?: string;
  loadingDate?: string;
  expectedQuantity?: number;
  loadedPackages?: number;
  basin: {
    code: string;
    description: string;
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
  specialInstructions?: string;
}

function ShipmentOperatorDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignedOrders, setAssignedOrders] = useState<MyOrder[]>([]);
  const [ordersToLoad, setOrdersToLoad] = useState<MyOrder[]>([]);
  const [ordersInProgress, setOrdersInProgress] = useState<MyOrder[]>([]);
  const [ordersLoaded, setOrdersLoaded] = useState<MyOrder[]>([]);
  const [completeDialog, setCompleteDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<MyOrder | null>(null);
  const [loadedPackages, setLoadedPackages] = useState<string>('');
  const [loadingNotes, setLoadingNotes] = useState<string>('');
  const [completing, setCompleting] = useState(false);

  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Usa l'endpoint corretto del backend
      const response = await api.get('/shipments/operator-dashboard');
      
      // Filtra per diversi stati
      const assigned = response.data.filter(
        (order: MyOrder) => order.status === 'PROGRAMMATO'
      );
      
      const toLoad = response.data.filter(
        (order: MyOrder) => order.status === 'IN_EVASIONE'
      );
      
      const inProgress = response.data.filter(
        (order: MyOrder) => order.status === 'IN_CARICO'
      );
      
      const loaded = response.data.filter(
        (order: MyOrder) => order.status === 'CARICATO'
      );

      setAssignedOrders(assigned);
      setOrdersToLoad(toLoad);
      setOrdersInProgress(inProgress);
      setOrdersLoaded(loaded);

    } catch (err: any) {
      console.error("Errore durante il recupero degli ordini dell'operatore:", err);
      setError("Impossibile caricare gli ordini. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh automatico ogni 30 secondi
    fetchTimeoutRef.current = setInterval(fetchData, 30000); 

    return () => {
      if (fetchTimeoutRef.current) {
        clearInterval(fetchTimeoutRef.current);
      }
    };
  }, []);

  // CORREZIONE VERA: Usa l'endpoint del workflow dei pickup-orders
  const handleTakeCharge = async (orderId: string) => {
    try {
      // ENDPOINT CORRETTO: pickup-orders workflow per auto-assegnazione operatore
      await api.post(`/pickup-orders/${orderId}/workflow/assign-operator`, {
        // L'operatorId viene auto-assegnato dal backend (operatore corrente)
        notes: 'Presa in carico da dashboard operatore'
      });
      fetchData(); // Refresh data
    } catch (err: any) {
      console.error('Errore nella presa in carico:', err);
      alert(`Errore nella presa in carico: ${err.response?.data?.message || 'Si prega di riprovare.'}`);
    }
  };

  // CORREZIONE VERA: Usa l'endpoint del workflow dei pickup-orders
  const handleCompleteLoading = async () => {
    if (!selectedOrder) return;

    if (parseFloat(loadedPackages) < 0) {
      alert('Il numero di colli caricati non può essere negativo.');
      return;
    }

    setCompleting(true);
    try {
      // ENDPOINT CORRETTO: pickup-orders workflow per completare il carico
      await api.post(`/pickup-orders/${selectedOrder.id}/workflow/complete-loading`, {
        packageCount: parseFloat(loadedPackages),
        notes: loadingNotes,
      });
      setCompleteDialog(false);
      setLoadedPackages('');
      setLoadingNotes('');
      setSelectedOrder(null);
      fetchData(); // Refresh data
    } catch (err: any) {
      console.error('Errore nel completamento del carico:', err);
      alert(`Errore nel completamento del carico: ${err.response?.data?.message || 'Si prega di riprovare.'}`);
    } finally {
      setCompleting(false);
    }
  };

  const openCompleteDialog = (order: MyOrder) => {
    setSelectedOrder(order);
    setLoadedPackages(order.expectedQuantity ? order.expectedQuantity.toString() : '');
    setLoadingNotes(order.specialInstructions || '');
    setCompleteDialog(true);
  };

  const renderOrderCard = (order: MyOrder) => (
    <Card key={order.id} sx={{ mb: 1.5, borderLeft: '4px solid', borderColor: shipmentService.getStatusColor(order.status) + '.main' }}>
      <CardContent sx={{ pb: '8px !important' }}>
        <Typography variant="subtitle1">Ordine #{order.orderNumber}</Typography>
        <Typography variant="body2" color="text.secondary">
          Cliente: {order.basin.client.name} - Bacino: {order.basin.code}
        </Typography>
        {order.logisticSender && (
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
            <Business fontSize="small" sx={{ mr: 0.5 }} />Mittente: {order.logisticSender.name}
          </Typography>
        )}
        {order.logisticRecipient && (
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
            <LocalShipping fontSize="small" sx={{ mr: 0.5 }} />Destinatario: {order.logisticRecipient.name}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
          <Schedule fontSize="small" sx={{ mr: 0.5 }} />Programmato: {order.scheduledDate ? format(new Date(order.scheduledDate), 'dd/MM/yyyy HH:mm', { locale: it }) : 'N/A'}
        </Typography>
        {order.expectedQuantity && (
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
            <Assignment fontSize="small" sx={{ mr: 0.5 }} />Colli previsti: {order.expectedQuantity}
          </Typography>
        )}
        {order.loadedPackages !== undefined && (
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
            <Scale fontSize="small" sx={{ mr: 0.5 }} />Colli caricati: {order.loadedPackages}
          </Typography>
        )}
        {order.specialInstructions && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontStyle: 'italic' }}>
            Note: {order.specialInstructions}
          </Typography>
        )}
        <Chip label={shipmentService.formatStatus(order.status)} color={shipmentService.getStatusColor(order.status)} size="small" sx={{ mt: 1 }} />
      </CardContent>
      <CardActions sx={{ p: 1, pt: 0, justifyContent: 'flex-end' }}>
        {(order.status === 'PROGRAMMATO' || order.status === 'IN_EVASIONE') && (
          <Button size="small" startIcon={<PlayArrow />} onClick={() => handleTakeCharge(order.id)}>
            Prendi in Carico
          </Button>
        )}
        {order.status === 'IN_CARICO' && (
          <Button size="small" startIcon={<CheckCircle />} onClick={() => openCompleteDialog(order)}>
            Completa Carico
          </Button>
        )}
      </CardActions>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard Operatore Spedizioni
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && (
        <Grid container spacing={3}>
          {/* Ordini Assegnati (Programmati) */}
          <Grid item xs={12} md={6} lg={3}>
            <Paper elevation={3} sx={{ p: 2, minHeight: '300px' }}>
              <Box display="flex" alignItems="center" mb={2}>
                <ListIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Programmati ({assignedOrders.length})</Typography>
                <Badge badgeContent={assignedOrders.length} color="primary" sx={{ ml: 1 }} />
              </Box>
              {assignedOrders.length === 0 ? (
                <Alert severity="info">Nessun ordine programmato.</Alert>
              ) : (
                assignedOrders.map(renderOrderCard)
              )}
            </Paper>
          </Grid>

          {/* Ordini Da Caricare (In Evasione) */}
          <Grid item xs={12} md={6} lg={3}>
            <Paper elevation={3} sx={{ p: 2, minHeight: '300px' }}>
              <Box display="flex" alignItems="center" mb={2}>
                <PlayArrow color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Da Caricare ({ordersToLoad.length})</Typography>
                <Badge badgeContent={ordersToLoad.length} color="primary" sx={{ ml: 1 }} />
              </Box>
              {ordersToLoad.length === 0 ? (
                <Alert severity="info">Nessun ordine da prendere in carico.</Alert>
              ) : (
                ordersToLoad.map(renderOrderCard)
              )}
            </Paper>
          </Grid>

          {/* Ordini In Carico */}
          <Grid item xs={12} md={6} lg={3}>
            <Paper elevation={3} sx={{ p: 2, minHeight: '300px' }}>
              <Box display="flex" alignItems="center" mb={2}>
                <LocalShipping color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">In Carico ({ordersInProgress.length})</Typography>
                <Badge badgeContent={ordersInProgress.length} color="warning" sx={{ ml: 1 }} />
              </Box>
              {ordersInProgress.length === 0 ? (
                <Alert severity="info">Nessun ordine in corso di carico.</Alert>
              ) : (
                ordersInProgress.map(renderOrderCard)
              )}
            </Paper>
          </Grid>

          {/* Ordini Caricati */}
          <Grid item xs={12} md={6} lg={3}>
            <Paper elevation={3} sx={{ p: 2, minHeight: '300px' }}>
              <Box display="flex" alignItems="center" mb={2}>
                <CheckCircle color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Caricati ({ordersLoaded.length})</Typography>
                <Badge badgeContent={ordersLoaded.length} color="success" sx={{ ml: 1 }} />
              </Box>
              {ordersLoaded.length === 0 ? (
                <Alert severity="info">Nessun ordine caricato.</Alert>
              ) : (
                ordersLoaded.map(renderOrderCard)
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      <Dialog open={completeDialog} onClose={() => setCompleteDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Completa Carico: Ordine #{selectedOrder?.orderNumber}</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Colli Caricati Effettivi"
                type="number"
                fullWidth
                value={loadedPackages}
                onChange={(e) => setLoadedPackages(e.target.value)}
                inputProps={{ min: 0 }}
                helperText="Inserisci il numero di colli caricati"
              />

              <TextField
                label="Note Carico"
                value={loadingNotes}
                onChange={(e) => setLoadingNotes(e.target.value)}
                multiline
                rows={3}
                placeholder="Eventuali note sul carico effettuato..."
              />

              <Alert severity="info">
                <Typography variant="body2">
                  Una volta completato il carico, l'ordine passerà allo stato "Caricato" 
                  e sarà pronto per la finalizzazione da parte del manager.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteDialog(false)}>Annulla</Button>
          <Button 
            onClick={handleCompleteLoading}
            variant="contained"
            disabled={completing}
          >
            {completing ? 'Completando...' : 'Completa Carico'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button per refresh rapido */}
      <Fab 
        color="primary" 
        aria-label="refresh"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={fetchData}
        disabled={loading}
      >
        <Refresh />
      </Fab>
    </Container>
  );
};

export default ShipmentOperatorDashboard;