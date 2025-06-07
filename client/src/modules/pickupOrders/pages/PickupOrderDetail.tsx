// client/src/modules/pickupOrders/pages/PickupOrderDetail.tsx - VERSIONE CORRETTA

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Chip, 
  Button, 
  Alert, 
  CircularProgress, 
  Divider,
  Card,
  CardContent
} from '@mui/material';
import { 
  Edit, 
  ArrowBack, 
  LocalShipping, 
  Business, 
  Schedule, 
  Assignment,
  Scale,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

import api from '../../../core/services/api';

// Definizione del tipo PickupOrder aggiornato
export interface PickupOrder {
  id: string;
  orderNumber: string;
  issueDate: string;
  scheduledDate?: string;
  loadingDate?: string;
  unloadingDate?: string;
  completionDate?: string;
  
  logisticSenderId?: string;
  logisticSender?: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
  };
  
  logisticRecipientId?: string;
  logisticRecipient?: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
  };
  
  logisticTransporterId?: string;
  logisticTransporter?: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
  };
  
  clientId?: string;
  client?: {
    id: string;
    name: string;
    vatNumber?: string;
    address?: string;
    city?: string;
  };
  
  basinId: string;
  basin: {
    id: string;
    code: string;
    description?: string;
    flowType?: string;
  };
  
  flowType: string;
  distanceKm?: number;
  materialType?: string;
  
  status: 'DA_EVADERE' | 'PROGRAMMATO' | 'IN_EVASIONE' | 'IN_CARICO' | 'CARICATO' | 'SPEDITO' | 'COMPLETO' | 'CANCELLED';
  
  expectedQuantity?: number;
  actualQuantity?: number;
  destinationQuantity?: number;
  loadedPackages?: number;
  departureWeight?: number;
  arrivalWeight?: number;
  
  assignedOperatorId?: string;
  assignedOperator?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email?: string;
  };
  
  notes?: string;
  documents?: string;
  loadingPhotos?: string;
  loadingVideos?: string;
  
  isRejected?: boolean;
  rejectionReason?: string;
  rejectionDate?: string;
  
  createdAt: string;
  updatedAt: string;
}

const PickupOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pickupOrder, setPickupOrder] = useState<PickupOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPickupOrder = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await api.get(`/pickup-orders/${id}`);
        const order = response.data;
        
        // DEBUG: Log per verificare tutti i campi data
        console.log('Buono di ritiro ricevuto:', order);
        console.log('Date nel buono:', {
          issueDate: order.issueDate,
          scheduledDate: order.scheduledDate,
          loadingDate: order.loadingDate,
          unloadingDate: order.unloadingDate,
          completionDate: order.completionDate
        });
        
        setPickupOrder(order);
        setError(null);
      } catch (error: any) {
        console.error('Errore nel caricamento del buono di ritiro:', error);
        setError(error.response?.data?.message || 'Errore nel caricamento del buono di ritiro');
      } finally {
        setLoading(false);
      }
    };

    fetchPickupOrder();
  }, [id]);

  const getStatusLabel = (status: PickupOrder['status']) => {
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

  const getStatusColor = (status: PickupOrder['status']): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Non specificata';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: it });
    } catch (error) {
      console.warn('Errore nel formato data:', dateString);
      return 'Data non valida';
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Non specificato';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: it });
    } catch (error) {
      console.warn('Errore nel formato data/ora:', dateString);
      return 'Data non valida';
    }
  };

  const formatUserName = (user?: PickupOrder['assignedOperator']) => {
    if (!user) return 'Non assegnato';
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return fullName || user.email || 'Nome non disponibile';
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error || !pickupOrder) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mb: 3 }}>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBack />} 
            onClick={() => navigate('/pickup-orders')}
          >
            Torna all'Elenco
          </Button>
        </Box>
        <Alert severity="error">
          {error || 'Buono di ritiro non trovato'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Header con navigazione e azioni */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBack />} 
            onClick={() => navigate('/pickup-orders')}
            sx={{ mb: 1 }}
          >
            Torna all'Elenco
          </Button>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assignment color="primary" />
            Buono di Ritiro: {pickupOrder.orderNumber}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip 
            label={getStatusLabel(pickupOrder.status)} 
            color={getStatusColor(pickupOrder.status)} 
            size="medium"  // ✅ CORRETTO: usa "medium" invece di "large"
            sx={{ fontSize: '1rem', height: '40px', px: 2 }} // Usa sx per fare il chip più grande
          />
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => navigate(`/pickup-orders/edit/${pickupOrder.id}`)}
          >
            Modifica
          </Button>
        </Box>
      </Box>
      
      {/* Sezione principale - Informazioni generali */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Schedule color="primary" />
                Informazioni Generali
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Data Emissione
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                    {formatDate(pickupOrder.issueDate)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Data Programmazione
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                    {formatDate(pickupOrder.scheduledDate)}
                  </Typography>
                </Grid>

                {/* DATE CARICO/SCARICO - SEZIONE PRINCIPALE */}
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Data Carico
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      mb: 2, 
                      fontWeight: 500,
                      color: pickupOrder.loadingDate ? 'text.primary' : 'text.secondary'
                    }}
                  >
                    {formatDate(pickupOrder.loadingDate)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Data Scarico
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      mb: 2, 
                      fontWeight: 500,
                      color: pickupOrder.unloadingDate ? 'text.primary' : 'text.secondary'
                    }}
                  >
                    {formatDate(pickupOrder.unloadingDate)}
                  </Typography>
                </Grid>

                {pickupOrder.completionDate && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Data Completamento
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                      {formatDateTime(pickupOrder.completionDate)}
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Tipo Flusso
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                    Flusso {pickupOrder.flowType}
                  </Typography>
                </Grid>

                {pickupOrder.distanceKm && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Distanza Chilometrica
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                      {pickupOrder.distanceKm.toLocaleString('it-IT')} km
                    </Typography>
                  </Grid>
                )}

                {pickupOrder.materialType && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Tipo Materiale
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                      {pickupOrder.materialType}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar - Informazioni aggiuntive */}
        <Grid item xs={12} md={4}>
          {/* Card Operatore assegnato */}
          {pickupOrder.assignedOperator && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Operatore Assegnato
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formatUserName(pickupOrder.assignedOperator)}
                </Typography>
                {pickupOrder.assignedOperator.email && (
                  <Typography variant="body2" color="textSecondary">
                    {pickupOrder.assignedOperator.email}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          {/* Card Rifiuto se applicabile */}
          {pickupOrder.isRejected && (
            <Card sx={{ mb: 3, border: '1px solid', borderColor: 'error.main' }}>
              <CardContent>
                <Typography variant="h6" color="error" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Warning />
                  Ordine Rifiutato
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Data Rifiuto
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {formatDate(pickupOrder.rejectionDate)}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Motivo
                </Typography>
                <Typography variant="body1">
                  {pickupOrder.rejectionReason || 'Non specificato'}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Sezione Entità Logistiche */}
        <Grid item xs={12}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LocalShipping color="primary" />
                Entità Logistiche
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                {/* Mittente */}
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    Mittente
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                    {pickupOrder.logisticSender?.name || 'Non specificato'}
                  </Typography>
                  {pickupOrder.logisticSender?.address && (
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {pickupOrder.logisticSender.address}
                    </Typography>
                  )}
                  {pickupOrder.logisticSender?.city && (
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {pickupOrder.logisticSender.city}
                    </Typography>
                  )}
                  {pickupOrder.logisticSender?.email && (
                    <Typography variant="body2" color="textSecondary">
                      {pickupOrder.logisticSender.email}
                    </Typography>
                  )}
                </Grid>

                {/* Destinatario */}
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    Destinatario
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                    {pickupOrder.logisticRecipient?.name || 'Non specificato'}
                  </Typography>
                  {pickupOrder.logisticRecipient?.address && (
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {pickupOrder.logisticRecipient.address}
                    </Typography>
                  )}
                  {pickupOrder.logisticRecipient?.city && (
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {pickupOrder.logisticRecipient.city}
                    </Typography>
                  )}
                  {pickupOrder.logisticRecipient?.email && (
                    <Typography variant="body2" color="textSecondary">
                      {pickupOrder.logisticRecipient.email}
                    </Typography>
                  )}
                </Grid>

                {/* Trasportatore */}
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    Trasportatore
                  </Typography>
                  {pickupOrder.logisticTransporter ? (
                    <>
                      <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                        {pickupOrder.logisticTransporter.name}
                      </Typography>
                      {pickupOrder.logisticTransporter.address && (
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          {pickupOrder.logisticTransporter.address}
                        </Typography>
                      )}
                      {pickupOrder.logisticTransporter.city && (
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          {pickupOrder.logisticTransporter.city}
                        </Typography>
                      )}
                      {pickupOrder.logisticTransporter.email && (
                        <Typography variant="body2" color="textSecondary">
                          {pickupOrder.logisticTransporter.email}
                        </Typography>
                      )}
                    </>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      Non specificato
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Sezione Cliente e Bacino */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Business color="primary" />
                Cliente Convenzionato
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {pickupOrder.client?.name || 'Non specificato'}
              </Typography>
              {pickupOrder.client?.vatNumber && (
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  P.IVA: {pickupOrder.client.vatNumber}
                </Typography>
              )}
              {pickupOrder.client?.address && (
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {pickupOrder.client.address}
                </Typography>
              )}
              {pickupOrder.client?.city && (
                <Typography variant="body2" color="textSecondary">
                  {pickupOrder.client.city}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Assignment color="primary" />
                Bacino
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {pickupOrder.basin.code}
              </Typography>
              {pickupOrder.basin.description && (
                <Typography variant="body2" color="textSecondary">
                  {pickupOrder.basin.description}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sezione Quantità e Pesi */}
        {(pickupOrder.expectedQuantity || pickupOrder.actualQuantity || 
          pickupOrder.destinationQuantity || pickupOrder.departureWeight || 
          pickupOrder.arrivalWeight || pickupOrder.loadedPackages) && (
          <Grid item xs={12}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Scale color="primary" />
                  Quantità e Pesi
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  {pickupOrder.expectedQuantity && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Quantità Prevista
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {pickupOrder.expectedQuantity} t
                      </Typography>
                    </Grid>
                  )}

                  {pickupOrder.actualQuantity && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Quantità Effettiva
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {pickupOrder.actualQuantity} t
                      </Typography>
                    </Grid>
                  )}

                  {pickupOrder.destinationQuantity && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Quantità a Destino
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {pickupOrder.destinationQuantity} t
                      </Typography>
                    </Grid>
                  )}

                  {pickupOrder.departureWeight && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Peso Partenza
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        {pickupOrder.departureWeight} t
                      </Typography>
                    </Grid>
                  )}

                  {pickupOrder.arrivalWeight && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Peso Arrivo
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        {pickupOrder.arrivalWeight} t
                      </Typography>
                    </Grid>
                  )}

                  {pickupOrder.loadedPackages && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Numero Colli
                      </Typography>
                      <Typography variant="h6" color="info.main">
                        {pickupOrder.loadedPackages}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Sezione Note */}
        {pickupOrder.notes && (
          <Grid item xs={12}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Note
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {pickupOrder.notes}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Sezione Informazioni Sistema */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informazioni Sistema
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Creato il
                  </Typography>
                  <Typography variant="body1">
                    {formatDateTime(pickupOrder.createdAt)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Ultima modifica
                  </Typography>
                  <Typography variant="body1">
                    {formatDateTime(pickupOrder.updatedAt)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PickupOrderDetail;