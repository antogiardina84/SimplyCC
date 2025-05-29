// client/src/modules/clients/pages/ClientDetail.tsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Paper, Box, Grid, Button, Alert, CircularProgress, 
  Divider, Chip, Card, CardContent, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, IconButton } from '@mui/material';
import { Edit, ArrowBack, Business, Email, Phone, LocationOn, Assignment, 
  Visibility, Add } from '@mui/icons-material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import * as clientService from '../services/clientService';
import * as basinService from '../../basins/services/basinService';
import * as pickupOrderService from '../../pickupOrders/services/ocrPickupOrderService';
import type { Client } from '../services/clientService';
import type { Basin } from '../../basins/services/basinService';
import type { PickupOrder } from '../../pickupOrders/services/ocrPickupOrderService';

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [basins, setBasins] = useState<Basin[]>([]);
  const [recentOrders, setRecentOrders] = useState<PickupOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalBasins: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0
  });

  useEffect(() => {
    const fetchClientData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch client details
        const clientData = await clientService.getClientById(id);
        setClient(clientData);
        
        // Fetch related data in parallel
        const [basinsData, ordersData] = await Promise.all([
          basinService.getBasinsByClientId(id),
          pickupOrderService.getPickupOrdersByClient(id)
        ]);
        
        setBasins(basinsData);
        setRecentOrders(ordersData.slice(0, 5)); // Ultimi 5 ordini
        
        // Calculate stats
        setStats({
          totalBasins: basinsData.length,
          totalOrders: ordersData.length,
          pendingOrders: ordersData.filter(order => order.status === 'PENDING').length,
          completedOrders: ordersData.filter(order => order.status === 'COMPLETED').length
        });
        
        setError(null);
      } catch (error: any) {
        console.error('Error fetching client data:', error);
        setError(error.response?.data?.message || 'Errore nel caricamento dei dati cliente');
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [id]);

  const handleEdit = () => {
    navigate(`/clients/edit/${id}`);
  };

  const handleViewBasin = (basinId: string) => {
    navigate(`/basins/${basinId}`);
  };

  const handleViewOrder = (orderId: string) => {
    navigate(`/pickup-orders/${orderId}`);
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'In Attesa';
      case 'SCHEDULED': return 'Programmato';
      case 'READY': return 'Pronto';
      case 'COMPLETED': return 'Completato';
      case 'CANCELLED': return 'Annullato';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
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
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!client) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">Cliente non trovato</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
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
            {client.name}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            P.IVA: {client.vatNumber}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Edit />}
          onClick={handleEdit}
        >
          Modifica Cliente
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main" sx={{ fontWeight: 600 }}>
                {stats.totalBasins}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bacini Totali
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" sx={{ fontWeight: 600 }}>
                {stats.totalOrders}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ordini Totali
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 600 }}>
                {stats.pendingOrders}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ordini Pendenti
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
                {stats.completedOrders}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ordini Completati
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Client Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Business />
              Informazioni Cliente
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">Ragione Sociale</Typography>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                  {client.name}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Partita IVA</Typography>
                <Typography variant="body1" sx={{ mb: 2, fontFamily: 'monospace' }}>
                  {client.vatNumber}
                </Typography>
              </Grid>
              
              {client.contractId && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">ID Contratto</Typography>
                  <Typography variant="body1" sx={{ mb: 2, fontFamily: 'monospace' }}>
                    {client.contractId}
                  </Typography>
                </Grid>
              )}
              
              {client.address && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOn fontSize="small" />
                    Indirizzo
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {client.address}
                    {client.city && `, ${client.city}`}
                    {client.zipCode && ` ${client.zipCode}`}
                    {client.province && ` (${client.province})`}
                  </Typography>
                </Grid>
              )}
              
              {client.phone && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Phone fontSize="small" />
                    Telefono
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {client.phone}
                  </Typography>
                </Grid>
              )}
              
              {client.email && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Email fontSize="small" />
                    Email
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {client.email}
                  </Typography>
                </Grid>
              )}
              
              {client.pec && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">PEC</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {client.pec}
                  </Typography>
                </Grid>
              )}
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Data Registrazione</Typography>
                <Typography variant="body1">
                  {format(new Date(client.createdAt), 'dd/MM/yyyy HH:mm', { locale: it })}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Ultima Modifica</Typography>
                <Typography variant="body1">
                  {format(new Date(client.updatedAt), 'dd/MM/yyyy HH:mm', { locale: it })}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Basins List */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Bacini Associati ({basins.length})
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Add />}
                onClick={() => navigate(`/basins/new/${client.id}`)}
              >
                Nuovo Bacino
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {basins.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Nessun bacino associato
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Add />}
                  onClick={() => navigate(`/basins/new/${client.id}`)}
                  sx={{ mt: 1 }}
                >
                  Aggiungi Primo Bacino
                </Button>
              </Box>
            ) : (
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {basins.map((basin) => (
                  <Box
                    key={basin.id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 2,
                      mb: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                  >
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {basin.code}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {basin.description || 'Nessuna descrizione'}
                      </Typography>
                      <Chip
                        label={getFlowTypeLabel(basin.flowType)}
                        size="small"
                        color={getFlowTypeColor(basin.flowType) as any}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleViewBasin(basin.id)}
                      color="primary"
                    >
                      <Visibility />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Orders */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Buoni di Ritiro Recenti
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/pickup-orders', { state: { clientFilter: client.id } })}
              >
                Vedi Tutti
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {recentOrders.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Assignment sx={{ fontSize: 64, color: 'text.disabled' }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Nessun buono di ritiro
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Non ci sono buoni di ritiro per questo cliente
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Numero Buono</TableCell>
                      <TableCell>Data Emissione</TableCell>
                      <TableCell>Bacino</TableCell>
                      <TableCell>Stato</TableCell>
                      <TableCell>Quantità</TableCell>
                      <TableCell align="right">Azioni</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell sx={{ fontFamily: 'monospace' }}>
                          {order.orderNumber}
                        </TableCell>
                        <TableCell>
                          {format(new Date(order.issueDate), 'dd/MM/yyyy', { locale: it })}
                        </TableCell>
                        <TableCell>{order.basin?.code || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(order.status)}
                            size="small"
                            color={getStatusColor(order.status) as any}
                          />
                        </TableCell>
                        <TableCell>
                          {order.expectedQuantity ? `${order.expectedQuantity} t` : 'N/A'}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleViewOrder(order.id)}
                            color="primary"
                          >
                            <Visibility />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ClientDetail;