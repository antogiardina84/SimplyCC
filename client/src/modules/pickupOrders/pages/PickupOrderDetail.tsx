// client/src/modules/pickupOrders/pages/PickupOrderDetail.tsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Paper, Box, Grid, Chip, Button, Alert, CircularProgress, Divider } from '@mui/material';
import { Edit, ArrowBack } from '@mui/icons-material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import * as pickupOrderService from '../services/ocrPickupOrderService';
import type { PickupOrder, PickupOrderStatus } from '../services/ocrPickupOrderService';

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
        const data = await pickupOrderService.getPickupOrderById(id);
        setPickupOrder(data);
        setError(null);
      } catch (error: any) {
        console.error('Error fetching pickup order:', error);
        setError(error.response?.data?.message || 'Errore nel caricamento del buono di ritiro');
      } finally {
        setLoading(false);
      }
    };

    fetchPickupOrder();
  }, [id]);

  const getStatusLabel = (status: PickupOrderStatus) => {
    switch (status) {
      case 'PENDING': return 'In Attesa';
      case 'SCHEDULED': return 'Programmato';
      case 'READY': return 'Pronto';
      case 'COMPLETED': return 'Completato';
      case 'CANCELLED': return 'Annullato';
      default: return status;
    }
  };

  const getStatusColor = (status: PickupOrderStatus) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'SCHEDULED': return 'info';
      case 'READY': return 'primary';
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!pickupOrder) {
    return (
      <Container maxWidth="md">
        <Alert severity="error">Buono di ritiro non trovato</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
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
          <Typography variant="h4" component="h1">
            Buono di Ritiro: {pickupOrder.orderNumber}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Edit />}
          onClick={() => navigate(`/pickup-orders/edit/${pickupOrder.id}`)}
        >
          Modifica
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Informazioni Generali</Typography>
              <Chip 
                label={getStatusLabel(pickupOrder.status)} 
                color={getStatusColor(pickupOrder.status) as any} 
                size="medium"
              />
            </Box>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">Data Emissione</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {format(new Date(pickupOrder.issueDate), 'dd/MM/yyyy', { locale: it })}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">Data Programmazione</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {pickupOrder.scheduledDate 
                ? format(new Date(pickupOrder.scheduledDate), 'dd/MM/yyyy', { locale: it }) 
                : 'Non programmata'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">Mittente</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {pickupOrder.sender?.name || 'N/A'}
              {pickupOrder.sender?.vatNumber && ` (${pickupOrder.sender.vatNumber})`}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">Destinatario</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {pickupOrder.recipient?.name || 'N/A'}
              {pickupOrder.recipient?.vatNumber && ` (${pickupOrder.recipient.vatNumber})`}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">Bacino</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {pickupOrder.basin?.code || 'N/A'}
              {pickupOrder.basin?.description && ` - ${pickupOrder.basin.description}`}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">Tipo Flusso</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Flusso {pickupOrder.flowType}
            </Typography>
          </Grid>

          {pickupOrder.distanceKm && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">Distanza</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {pickupOrder.distanceKm} km
              </Typography>
            </Grid>
          )}

          {(pickupOrder.expectedQuantity || pickupOrder.actualQuantity) && (
            <>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Quantità</Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              {pickupOrder.expectedQuantity && (
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="textSecondary">Quantità Prevista</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {pickupOrder.expectedQuantity} t
                  </Typography>
                </Grid>
              )}

              {pickupOrder.actualQuantity && (
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="textSecondary">Quantità Effettiva</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {pickupOrder.actualQuantity} t
                  </Typography>
                </Grid>
              )}

              {pickupOrder.destinationQuantity && (
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="textSecondary">Quantità a Destino</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {pickupOrder.destinationQuantity} t
                  </Typography>
                </Grid>
              )}
            </>
          )}

          {pickupOrder.notes && (
            <>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Note</Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {pickupOrder.notes}
                </Typography>
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Informazioni Sistema</Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">Creato il</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {format(new Date(pickupOrder.createdAt), 'dd/MM/yyyy HH:mm', { locale: it })}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">Ultima modifica</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {format(new Date(pickupOrder.updatedAt), 'dd/MM/yyyy HH:mm', { locale: it })}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default PickupOrderDetail;