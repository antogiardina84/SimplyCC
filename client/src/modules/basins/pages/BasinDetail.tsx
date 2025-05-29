// client/src/modules/basins/pages/BasinDetail.tsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Paper, Box, Grid, Button, Alert, CircularProgress, 
  Divider, Chip, Card, CardContent, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, IconButton, LinearProgress } from '@mui/material';
import { Edit, ArrowBack, Domain, Business, Assignment, Visibility, 
  TrendingUp, Science, Assessment } from '@mui/icons-material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import * as basinService from '../services/basinService';
import * as pickupOrderService from '../../pickupOrders/services/ocrPickupOrderService';
import type { Basin } from '../services/basinService';
import type { PickupOrder } from '../../pickupOrders/services/ocrPickupOrderService';

const BasinDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [basin, setBasin] = useState<Basin | null>(null);
  const [orders, setOrders] = useState<PickupOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalQuantity: 0,
    avgQuantity: 0,
    pendingOrders: 0,
    completedOrders: 0,
    thisMonthOrders: 0
  });

  // Mock data per analisi (da sostituire con dati reali)
  const mockAnalysisData = [
    { date: '2024-01-15', fractionType: 'Frazione Estranea', percentage: 18.5 },
    { date: '2024-02-10', fractionType: 'Frazione Estranea', percentage: 15.2 },
    { date: '2024-03-05', fractionType: 'Frazione Estranea', percentage: 12.8 },
  ];

  const mockPerformanceData = {
    qualityScore: 85,
    complianceRate: 92,
    efficiency: 78
  };

  useEffect(() => {
    const fetchBasinData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch basin details and related orders
        const [basinData, ordersData] = await Promise.all([
          basinService.getBasinById(id),
          pickupOrderService.getPickupOrdersByBasin(id)
        ]);
        
        setBasin(basinData);
        setOrders(ordersData);
        
        // Calculate statistics
        const totalQuantity = ordersData.reduce((sum, order) => 
          sum + (order.actualQuantity || order.expectedQuantity || 0), 0
        );
        
        const thisMonth = new Date();
        thisMonth.setDate(1);
        const thisMonthOrders = ordersData.filter(order => 
          new Date(order.issueDate) >= thisMonth
        ).length;
        
        setStats({
          totalOrders: ordersData.length,
          totalQuantity,
          avgQuantity: ordersData.length > 0 ? totalQuantity / ordersData.length : 0,
          pendingOrders: ordersData.filter(order => order.status === 'PENDING').length,
          completedOrders: ordersData.filter(order => order.status === 'COMPLETED').length,
          thisMonthOrders
        });
        
        setError(null);
      } catch (error: any) {
        console.error('Error fetching basin data:', error);
        setError(error.response?.data?.message || 'Errore nel caricamento dei dati bacino');
      } finally {
        setLoading(false);
      }
    };

    fetchBasinData();
  }, [id]);

  const getFlowTypeInfo = (flowType: string) => {
    switch (flowType) {
      case 'A': 
        return {
          label: 'Flusso A - Monomateriale Urbano',
          description: 'Conferimento monomateriale di provenienza urbana',
          color: 'primary'
        };
      case 'B': 
        return {
          label: 'Flusso B - Monomateriale Non Domestico',
          description: 'Conferimento monomateriale di provenienza non domestica con presenza di traccianti',
          color: 'secondary'
        };
      case 'C': 
        return {
          label: 'Flusso C - Monomateriale CPL',
          description: 'Conferimento monomateriale urbano da raccolta dedicata per CPL',
          color: 'success'
        };
      case 'D': 
        return {
          label: 'Flusso D - Multimateriale Urbano',
          description: 'Conferimento multimateriale di provenienza urbana',
          color: 'warning'
        };
      default: 
        return {
          label: flowType,
          description: 'Tipo di flusso non riconosciuto',
          color: 'default'
        };
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

  if (!basin) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">Bacino non trovato</Alert>
      </Container>
    );
  }

  const flowInfo = getFlowTypeInfo(basin.flowType);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBack />} 
            onClick={() => navigate('/basins')}
            sx={{ mb: 1 }}
          >
            Torna ai Bacini
          </Button>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Domain />
            Bacino {basin.code}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {basin.description || 'Nessuna descrizione'}
          </Typography>
          <Chip
            label={flowInfo.label}
            color={flowInfo.color as any}
            sx={{ mt: 1 }}
          />
        </Box>
        <Button
          variant="contained"
          startIcon={<Edit />}
          onClick={() => navigate(`/basins/edit/${basin.id}`)}
        >
          Modifica Bacino
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main" sx={{ fontWeight: 600 }}>
                {stats.totalOrders}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ordini Totali
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
                {stats.totalQuantity.toFixed(1)}t
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Quantità Totale
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" sx={{ fontWeight: 600 }}>
                {stats.avgQuantity.toFixed(1)}t
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Media per Ordine
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 600 }}>
                {stats.pendingOrders}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                In Attesa
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="secondary.main" sx={{ fontWeight: 600 }}>
                {stats.completedOrders}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completati
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main" sx={{ fontWeight: 600 }}>
                {stats.thisMonthOrders}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Questo Mese
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Basin Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Domain />
              Informazioni Bacino
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">Codice Bacino</Typography>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 600, fontFamily: 'monospace' }}>
                  {basin.code}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">Descrizione</Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {basin.description || 'Nessuna descrizione disponibile'}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">Tipo di Flusso</Typography>
                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={flowInfo.label}
                    color={flowInfo.color as any}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {flowInfo.description}
                  </Typography>
                </Box>
              </Grid>
              
              {basin.client && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Business fontSize="small" />
                    Cliente Proprietario
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {basin.client.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                    P.IVA: {basin.client.vatNumber}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => navigate(`/clients/${basin.clientId}`)}
                    sx={{ mt: 1 }}
                  >
                    Visualizza Cliente
                  </Button>
                </Grid>
              )}
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Data Creazione</Typography>
                <Typography variant="body1">
                  {format(new Date(basin.createdAt), 'dd/MM/yyyy HH:mm', { locale: it })}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Ultima Modifica</Typography>
                <Typography variant="body1">
                  {format(new Date(basin.updatedAt), 'dd/MM/yyyy HH:mm', { locale: it })}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Performance Indicators */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assessment />
              Indicatori di Performance
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Qualità Materiale</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {mockPerformanceData.qualityScore}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={mockPerformanceData.qualityScore} 
                sx={{ height: 8, borderRadius: 4 }}
                color={mockPerformanceData.qualityScore >= 80 ? 'success' : 'warning'}
              />
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Conformità Normativa</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {mockPerformanceData.complianceRate}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={mockPerformanceData.complianceRate} 
                sx={{ height: 8, borderRadius: 4 }}
                color={mockPerformanceData.complianceRate >= 90 ? 'success' : 'warning'}
              />
            </Box>
            
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Efficienza Operativa</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {mockPerformanceData.efficiency}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={mockPerformanceData.efficiency} 
                sx={{ height: 8, borderRadius: 4 }}
                color={mockPerformanceData.efficiency >= 75 ? 'success' : 'warning'}
              />
            </Box>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Gli indicatori sono calcolati sulla base degli ultimi 3 mesi di attività
              </Typography>
            </Alert>
          </Paper>
        </Grid>

        {/* Recent Analysis */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Science />
              Analisi Merceologiche Recenti
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {mockAnalysisData.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Science sx={{ fontSize: 64, color: 'text.disabled' }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Nessuna analisi disponibile
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Non sono ancora state registrate analisi merceologiche per questo bacino
                </Typography>
              </Box>
            ) : (
              <Box>
                {mockAnalysisData.map((analysis, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 2,
                      mb: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      backgroundColor: analysis.percentage > 20 ? 'error.lighter' : 'success.lighter'
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {format(new Date(analysis.date), 'dd/MM/yyyy', { locale: it })}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {analysis.fractionType}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${analysis.percentage}%`}
                      size="small"
                      color={analysis.percentage > 20 ? 'error' : 'success'}
                      variant="filled"
                    />
                  </Box>
                ))}
                
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/analysis', { state: { basinFilter: basin.id } })}
                >
                  Visualizza Tutte le Analisi
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Orders */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp />
                Attività Recente
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/pickup-orders', { state: { basinFilter: basin.id } })}
              >
                Vedi Tutti
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {orders.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Assignment sx={{ fontSize: 64, color: 'text.disabled' }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Nessuna attività
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Non ci sono ordini registrati per questo bacino
                </Typography>
              </Box>
            ) : (
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {orders.slice(0, 5).map((order) => (
                  <Box
                    key={order.id}
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
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                        {order.orderNumber}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(order.issueDate), 'dd/MM/yyyy', { locale: it })}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Chip
                          label={getStatusLabel(order.status)}
                          size="small"
                          color={getStatusColor(order.status) as any}
                        />
                        {order.expectedQuantity && (
                          <Typography variant="caption" color="text.secondary">
                            {order.expectedQuantity}t
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/pickup-orders/${order.id}`)}
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
      </Grid>
    </Container>
  );
};

export default BasinDetail;