// client/src/modules/shipments/pages/ShipmentOperatorDashboard.tsx - AGGIORNATO CON FOTO

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
import PhotoCaptureComponent from '../components/PhotoCaptureComponent';

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

interface Photo {
  id: string;
  file: File;
  preview: string;
  timestamp: Date;
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
  const [loadingPhotos, setLoadingPhotos] = useState<Photo[]>([]);
  const [completing, setCompleting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/shipments/operator-dashboard');
      
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
    fetchTimeoutRef.current = setInterval(fetchData, 30000); 

    return () => {
      if (fetchTimeoutRef.current) {
        clearInterval(fetchTimeoutRef.current);
      }
    };
  }, []);

  const handleTakeCharge = async (orderId: string) => {
    try {
      await api.post(`/pickup-orders/${orderId}/workflow/assign-operator`, {
        notes: 'Presa in carico da dashboard operatore'
      });
      fetchData();
    } catch (err: any) {
      console.error('Errore nella presa in carico:', err);
      alert(`Errore nella presa in carico: ${err.response?.data?.message || 'Si prega di riprovare.'}`);
    }
  };

  // Upload delle foto al server
  const uploadPhotos = async (photos: Photo[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const photo of photos) {
      const formData = new FormData();
      formData.append('photo', photo.file);
      formData.append('type', 'loading-photo');
      formData.append('timestamp', photo.timestamp.toISOString());
      
      try {
        const response = await api.post('/uploads/photo', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        uploadedUrls.push(response.data.url);
      } catch (error) {
        console.error('Errore upload foto:', error);
        throw new Error(`Errore nel caricamento della foto ${photo.id}`);
      }
    }
    
    return uploadedUrls;
  };

  const handleCompleteLoading = async () => {
    if (!selectedOrder) return;

    if (parseFloat(loadedPackages) < 0) {
      alert('Il numero di colli caricati non può essere negativo.');
      return;
    }

    setCompleting(true);
    setUploadingPhotos(true);
    
    try {
      // Upload foto se presenti
      let photoUrls: string[] = [];
      if (loadingPhotos.length > 0) {
        photoUrls = await uploadPhotos(loadingPhotos);
      }
      
      setUploadingPhotos(false);

      // Completa il carico con le foto
      await api.post(`/pickup-orders/${selectedOrder.id}/workflow/complete-loading`, {
        packageCount: parseFloat(loadedPackages),
        notes: loadingNotes,
        photos: photoUrls.join(','), // Salva URLs separate da virgola
        photoCount: loadingPhotos.length
      });
      
      // Reset e chiudi dialog
      setCompleteDialog(false);
      setLoadedPackages('');
      setLoadingNotes('');
      setLoadingPhotos([]);
      setSelectedOrder(null);
      fetchData();
      
      alert(`Carico completato con successo! ${loadingPhotos.length} foto caricate.`);
      
    } catch (err: any) {
      console.error('Errore nel completamento del carico:', err);
      alert(`Errore nel completamento del carico: ${err.response?.data?.message || 'Si prega di riprovare.'}`);
    } finally {
      setCompleting(false);
      setUploadingPhotos(false);
    }
  };

  const openCompleteDialog = (order: MyOrder) => {
    setSelectedOrder(order);
    setLoadedPackages(order.expectedQuantity ? order.expectedQuantity.toString() : '');
    setLoadingNotes('');
    setLoadingPhotos([]);
    setCompleteDialog(true);
  };

  const renderOrderCard = (order: MyOrder, actions: React.ReactNode) => (
    <Card key={order.id} variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Ordine #{order.orderNumber}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              <Business sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
              Cliente: {order.basin.client.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Bacino: {order.basin.code}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            {order.scheduledDate && (
              <Typography variant="body2" color="text.secondary">
                <Schedule sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                {format(new Date(order.scheduledDate), 'dd/MM/yyyy HH:mm', { locale: it })}
              </Typography>
            )}
            
            {order.expectedQuantity && (
              <Typography variant="body2" color="text.secondary">
                <Scale sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                Qtà prevista: {order.expectedQuantity} colli
              </Typography>
            )}
          </Grid>
        </Grid>

        {order.logisticSender && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Da: {order.logisticSender.name}
          </Typography>
        )}
        
        {order.logisticRecipient && (
          <Typography variant="body2" color="text.secondary">
            A: {order.logisticRecipient.name}
          </Typography>
        )}
        
        {order.specialInstructions && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Istruzioni:</strong> {order.specialInstructions}
            </Typography>
          </Alert>
        )}
      </CardContent>
      
      <CardActions>
        {actions}
      </CardActions>
    </Card>
  );

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Caricamento dashboard operatore...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error">{error}</Alert>
        <Button onClick={fetchData} startIcon={<Refresh />} sx={{ mt: 2 }}>
          Riprova
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard Operatore
      </Typography>

      {/* Statistiche rapide */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {ordersToLoad.length}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Da Caricare
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main">
                {ordersInProgress.length}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                In Carico
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {ordersLoaded.length}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Caricati
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {assignedOrders.length}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Programmati
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sezioni ordini */}
      <Grid container spacing={3}>
        {/* Ordini in evasione */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom color="info.main">
              Ordini da Caricare ({ordersToLoad.length})
            </Typography>
            {ordersToLoad.length === 0 ? (
              <Alert severity="info">Nessun ordine disponibile per il carico.</Alert>
            ) : (
              ordersToLoad.map(order => renderOrderCard(
                order,
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PlayArrow />}
                  onClick={() => handleTakeCharge(order.id)}
                >
                  Prendi in Carico
                </Button>
              ))
            )}
          </Paper>
        </Grid>

        {/* Ordini in carico */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom color="primary.main">
              I Miei Ordini in Carico ({ordersInProgress.length})
            </Typography>
            {ordersInProgress.length === 0 ? (
              <Alert severity="info">Nessun ordine in carico.</Alert>
            ) : (
              ordersInProgress.map(order => renderOrderCard(
                order,
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircle />}
                  onClick={() => openCompleteDialog(order)}
                >
                  Completa Carico
                </Button>
              ))
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog completamento carico con foto */}
      <Dialog 
        open={completeDialog} 
        onClose={() => !completing && setCompleteDialog(false)} 
        fullWidth 
        maxWidth="md"
        disableEscapeKeyDown={completing}
      >
        <DialogTitle>
          Completa Carico: Ordine #{selectedOrder?.orderNumber}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Colli Caricati Effettivi"
                type="number"
                fullWidth
                value={loadedPackages}
                onChange={(e) => setLoadedPackages(e.target.value)}
                inputProps={{ min: 0 }}
                helperText="Inserisci il numero di colli caricati"
                disabled={completing}
              />

              <TextField
                label="Note Carico"
                value={loadingNotes}
                onChange={(e) => setLoadingNotes(e.target.value)}
                multiline
                rows={3}
                placeholder="Eventuali note sul carico effettuato..."
                disabled={completing}
              />

              {/* Componente acquisizione foto */}
              <PhotoCaptureComponent
                onPhotosChange={setLoadingPhotos}
                maxPhotos={10}
                maxSizeMB={2}
              />

              {uploadingPhotos && (
                <Alert severity="info" sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Caricamento foto in corso...
                </Alert>
              )}

              <Alert severity="info">
                <Typography variant="body2">
                  Una volta completato il carico, l'ordine passerà allo stato "Caricato" 
                  e sarà pronto per la finalizzazione da parte del manager.
                  {loadingPhotos.length > 0 && (
                    <><br />Le {loadingPhotos.length} foto verranno salvate nel sistema.</>
                  )}
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setCompleteDialog(false)}
            disabled={completing}
          >
            Annulla
          </Button>
          <Button 
            onClick={handleCompleteLoading}
            variant="contained"
            disabled={completing || uploadingPhotos}
            startIcon={completing ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            {completing ? 'Completando...' : `Completa Carico${loadingPhotos.length > 0 ? ` (+${loadingPhotos.length} foto)` : ''}`}
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