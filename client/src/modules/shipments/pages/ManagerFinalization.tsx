// client/src/modules/shipments/pages/ManagerFinalization.tsx - CORRETTO

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
  CardActions,
  Grid,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  CheckCircle,
  Refresh,
  Visibility
} from '@mui/icons-material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import api from '../../../core/services/api';

// ✅ INTERFACCIA CORRETTA - Allineata con il database schema
interface PendingOrder {
  id: string;
  orderNumber: string;
  status: string;
  // Campi nested dal pickupOrder
  pickupOrder?: {
    scheduledDate?: string;
    loadingDate?: string;
    completionDate?: string;
    unloadingDate?: string;
    departureWeight?: number;
    arrivalWeight?: number;
    loadedPackages?: number;
    expectedQuantity?: number;
    actualQuantity?: number;
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
    notes?: string;
    isRejected?: boolean;
    rejectionReason?: string;
  };
}

interface FinalizationData {
  departureWeight: string;
  notes: string;
}

interface CompletionData {
  arrivalWeight: string;
  isRejected: boolean;
  rejectionReason: string;
  notes: string;
}

const ManagerFinalization = () => {
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [shippedOrders, setShippedOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [finalizeDialog, setFinalizeDialog] = useState(false);
  const [completeDialog, setCompleteDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);

  const [finalizationData, setFinalizationData] = useState<FinalizationData>({
    departureWeight: '',
    notes: ''
  });

  const [completionData, setCompletionData] = useState<CompletionData>({
    arrivalWeight: '',
    isRejected: false,
    rejectionReason: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch orders ready for finalization (CARICATO)
      const pendingResponse = await api.get('/pickup-orders', {
        params: {
          status: 'CARICATO'
        }
      });

      // Fetch shipped orders waiting for destination confirmation (SPEDITO)
      const shippedResponse = await api.get('/pickup-orders', {
        params: {
          status: 'SPEDITO'
        }
      });

      setPendingOrders(pendingResponse.data || []);
      setShippedOrders(shippedResponse.data || []);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.response?.data?.message || 'Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = (order: PendingOrder) => {
    setSelectedOrder(order);
    setFinalizationData({
      departureWeight: order.pickupOrder?.actualQuantity?.toString() || '',
      notes: ''
    });
    setFinalizeDialog(true);
  };

  const handleComplete = (order: PendingOrder) => {
    setSelectedOrder(order);
    setCompletionData({
      arrivalWeight: order.pickupOrder?.departureWeight?.toString() || '',
      isRejected: false,
      rejectionReason: '',
      notes: ''
    });
    setCompleteDialog(true);
  };

  const confirmFinalization = async () => {
    if (!selectedOrder || !finalizationData.departureWeight) {
      alert('Inserisci il peso di partenza');
      return;
    }

    try {
      setLoading(true);

      await api.post(`/pickup-orders/${selectedOrder.id}/workflow/finalize-shipment`, {
        departureWeight: parseFloat(finalizationData.departureWeight),
        notes: finalizationData.notes
      });

      await fetchData();
      setFinalizeDialog(false);
      resetFinalizationForm();

    } catch (error: any) {
      console.error('Error finalizing shipment:', error);
      setError(error.response?.data?.message || 'Errore durante la finalizzazione');
    } finally {
      setLoading(false);
    }
  };

  const confirmCompletion = async () => {
    if (!selectedOrder) return;

    // Validation
    if (!completionData.isRejected && !completionData.arrivalWeight) {
      alert('Inserisci il peso di arrivo se il carico non è stato respinto');
      return;
    }

    if (completionData.isRejected && !completionData.rejectionReason) {
      alert('Inserisci il motivo del rifiuto');
      return;
    }

    try {
      setLoading(true);

      await api.post(`/pickup-orders/${selectedOrder.id}/workflow/complete-order`, {
        arrivalWeight: completionData.arrivalWeight ? parseFloat(completionData.arrivalWeight) : undefined,
        isRejected: completionData.isRejected,
        rejectionReason: completionData.rejectionReason,
        notes: completionData.notes
      });

      await fetchData();
      setCompleteDialog(false);
      resetCompletionForm();

    } catch (error: any) {
      console.error('Error completing order:', error);
      setError(error.response?.data?.message || 'Errore durante il completamento');
    } finally {
      setLoading(false);
    }
  };

  const resetFinalizationForm = () => {
    setSelectedOrder(null);
    setFinalizationData({
      departureWeight: '',
      notes: ''
    });
  };

  const resetCompletionForm = () => {
    setSelectedOrder(null);
    setCompletionData({
      arrivalWeight: '',
      isRejected: false,
      rejectionReason: '',
      notes: ''
    });
  };

  // ✅ FUNZIONI DI UTILITÀ SEMPLICI - Senza dipendenze esterne
  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'SPEDITO':
        return 'info';
      case 'COMPLETO':
        return 'success';
      case 'CARICATO':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'SPEDITO':
        return 'Spedito';
      case 'COMPLETO':
        return 'Completato';
      case 'CARICATO':
        return 'Caricato';
      default:
        return status;
    }
  };

  const getTodayStats = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayFinalized = shippedOrders.filter(order =>
      order.pickupOrder?.completionDate && order.pickupOrder.completionDate.startsWith(today)
    ).length;

    return {
      pending: pendingOrders.length,
      shipped: shippedOrders.length,
      todayFinalized
    };
  };

  const stats = getTodayStats();

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            ✅ Finalizzazione Manager
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchData}
            disabled={loading}
          >
            Aggiorna
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        
        {/* Statistiche */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">{stats.pending}</Typography>
                <Typography variant="body2">Da Finalizzare</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">{stats.shipped}</Typography>
                <Typography variant="body2">Spediti (In Attesa Conferma)</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">{stats.todayFinalized}</Typography>
                <Typography variant="body2">Finalizzati Oggi</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Ordini da Finalizzare */}
          <Grid item xs={12} lg={7}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                📦 Ordini Pronti per Finalizzazione ({pendingOrders.length})
              </Typography>
              {pendingOrders.length === 0 ? (
                <Alert severity="info">Nessun ordine in attesa di finalizzazione</Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Ordine</TableCell>
                        <TableCell>Cliente</TableCell>
                        <TableCell>Operatore</TableCell>
                        <TableCell>Caricato</TableCell>
                        <TableCell>Colli</TableCell>
                        <TableCell>Azioni</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendingOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <Typography variant="subtitle2">{order.orderNumber}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {order.pickupOrder?.basin?.code || 'N/D'}
                            </Typography>
                          </TableCell>
                          <TableCell>{order.pickupOrder?.basin?.client?.name || 'N/D'}</TableCell>
                          <TableCell>
                            {order.pickupOrder?.assignedOperator ? 
                              `${order.pickupOrder.assignedOperator.firstName || ''} ${order.pickupOrder.assignedOperator.lastName || ''}` : 
                              '-'
                            }
                          </TableCell>
                          <TableCell>
                            {order.pickupOrder?.loadingDate ? 
                              format(new Date(order.pickupOrder.loadingDate), 'dd/MM HH:mm') : 
                              '-'
                            }
                          </TableCell>
                          <TableCell>{order.pickupOrder?.loadedPackages || '-'}</TableCell>
                          <TableCell>
                            <Tooltip title="Finalizza Spedizione">
                              <IconButton onClick={() => handleFinalize(order)} color="success" size="small">
                                <CheckCircle />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Dettagli">
                              <IconButton onClick={() => window.open(`/pickup-orders/${order.id}`, '_blank')} size="small">
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>

          {/* Spediti - In Attesa di Conferma */}
          <Grid item xs={12} lg={5}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                🚛 Spediti - In Attesa Conferma ({shippedOrders.length})
              </Typography>
              {shippedOrders.length === 0 ? (
                <Alert severity="info">Nessuna spedizione in attesa di conferma</Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: '400px', overflow: 'auto' }}>
                  {shippedOrders.map((order) => (
                    <Card key={order.id} variant="outlined">
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="subtitle1">{order.orderNumber}</Typography>
                          <Chip label={getStatusLabel(order.status)} color={getStatusColor(order.status)} size="small" />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Cliente: {order.pickupOrder?.basin?.client?.name || 'N/D'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Bacino: {order.pickupOrder?.basin?.code || 'N/D'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Mittente: {order.pickupOrder?.logisticSender?.name || 'N/D'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Destinatario: {order.pickupOrder?.logisticRecipient?.name || 'N/D'}
                        </Typography>
                        {order.pickupOrder?.departureWeight && (
                          <Typography variant="body2" color="text.secondary">
                            Peso Partenza: {order.pickupOrder.departureWeight} t
                          </Typography>
                        )}
                        {order.pickupOrder?.loadingDate && (
                          <Typography variant="body2" color="text.secondary">
                            Caricato il: {format(new Date(order.pickupOrder.loadingDate), 'dd/MM/yyyy HH:mm', { locale: it })}
                          </Typography>
                        )}
                      </CardContent>
                      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                        <Tooltip title="Conferma Arrivo/Rifiuto">
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<CheckCircle />}
                            onClick={() => handleComplete(order)}
                          >
                            Conferma Arrivo
                          </Button>
                        </Tooltip>
                        <Tooltip title="Dettagli">
                          <IconButton onClick={() => window.open(`/pickup-orders/${order.id}`, '_blank')} size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </CardActions>
                    </Card>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Dialog di Finalizzazione */}
      <Dialog open={finalizeDialog} onClose={() => setFinalizeDialog(false)}>
        <DialogTitle>Finalizza Spedizione Ordine: {selectedOrder?.orderNumber}</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body1">
                Cliente: {selectedOrder.pickupOrder?.basin?.client?.name || 'N/D'} ({selectedOrder.pickupOrder?.basin?.code || 'N/D'})
              </Typography>
              <Typography variant="body2">
                Operatore Assegnato: {selectedOrder.pickupOrder?.assignedOperator ? 
                  `${selectedOrder.pickupOrder.assignedOperator.firstName || ''} ${selectedOrder.pickupOrder.assignedOperator.lastName || ''}` : 
                  'N/D'
                }
              </Typography>
              <Typography variant="body2">
                Colli Caricati: {selectedOrder.pickupOrder?.loadedPackages || 'N/D'}
              </Typography>
              <TextField
                label="Peso di Partenza (t)"
                type="number"
                value={finalizationData.departureWeight}
                onChange={(e) => setFinalizationData(prev => ({ ...prev, departureWeight: e.target.value }))}
                fullWidth
                inputProps={{ step: "0.01", min: "0" }}
                helperText="Inserisci il peso registrato alla partenza"
              />
              <TextField
                label="Note di Finalizzazione"
                value={finalizationData.notes}
                onChange={(e) => setFinalizationData(prev => ({ ...prev, notes: e.target.value }))}
                multiline
                rows={3}
                placeholder="Eventuali note sulla finalizzazione..."
                fullWidth
              />
              <Alert severity="info">
                <Typography variant="body2">
                  Una volta finalizzata, la spedizione passerà allo stato "Spedito" e sarà in attesa di conferma a destinazione.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFinalizeDialog(false)}>
            Annulla
          </Button>
          <Button
            onClick={confirmFinalization}
            variant="contained"
            disabled={loading || !finalizationData.departureWeight || parseFloat(finalizationData.departureWeight) < 0}
          >
            {loading ? 'Finalizzando...' : 'Conferma Finalizzazione'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog di Completamento (Arrivo/Rifiuto) */}
      <Dialog open={completeDialog} onClose={() => setCompleteDialog(false)}>
        <DialogTitle>Completa Ordine: {selectedOrder?.orderNumber}</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body1">
                Cliente: {selectedOrder.pickupOrder?.basin?.client?.name || 'N/D'} ({selectedOrder.pickupOrder?.basin?.code || 'N/D'})
              </Typography>
              <Typography variant="body2">
                Peso Partenza Registrato: {selectedOrder.pickupOrder?.departureWeight || 'N/D'} t
              </Typography>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={completionData.isRejected}
                    onChange={(e) => setCompletionData(prev => ({
                      ...prev,
                      isRejected: e.target.checked,
                      arrivalWeight: e.target.checked ? '' : prev.arrivalWeight
                    }))}
                    name="isRejected"
                    color="error"
                  />
                }
                label="Segna come RESPINTO"
              />

              {!completionData.isRejected && (
                <TextField
                  label="Peso di Arrivo (t)"
                  type="number"
                  value={completionData.arrivalWeight}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, arrivalWeight: e.target.value }))}
                  fullWidth
                  inputProps={{ step: "0.01", min: "0" }}
                  helperText="Inserisci il peso registrato all'arrivo"
                />
              )}

              {completionData.isRejected && (
                <TextField
                  label="Motivo del Rifiuto"
                  value={completionData.rejectionReason}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, rejectionReason: e.target.value }))}
                  multiline
                  rows={2}
                  placeholder="Specificare il motivo per cui il carico è stato respinto..."
                  fullWidth
                  error={completionData.isRejected && !completionData.rejectionReason}
                  helperText={completionData.isRejected && !completionData.rejectionReason ? "Il motivo del rifiuto è obbligatorio" : ""}
                />
              )}

              <TextField
                label="Note di Completamento"
                value={completionData.notes}
                onChange={(e) => setCompletionData(prev => ({ ...prev, notes: e.target.value }))}
                multiline
                rows={2}
                placeholder="Eventuali note sul completamento..."
                fullWidth
              />

              <Alert severity={completionData.isRejected ? "error" : "success"}>
                <Typography variant="body2">
                  {completionData.isRejected ?
                    "🚫 Il carico verrà marcato come RESPINTO e l'ordine passerà allo stato COMPLETO con flag di rifiuto." :
                    "✅ Il carico verrà confermato e l'ordine passerà allo stato COMPLETO."
                  }
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteDialog(false)}>
            Annulla
          </Button>
          <Button
            onClick={confirmCompletion}
            variant="contained"
            color={completionData.isRejected ? "error" : "success"}
            disabled={
              loading ||
              (completionData.isRejected && !completionData.rejectionReason) ||
              (!completionData.isRejected && (!completionData.arrivalWeight || parseFloat(completionData.arrivalWeight) < 0))
            }
          >
            {loading ? 'Processando...' : completionData.isRejected ? 'Conferma Rifiuto' : 'Conferma Arrivo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManagerFinalization;