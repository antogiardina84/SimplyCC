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
  Checkbox,
  CircularProgress
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

      console.log('🔄 === CARICAMENTO DATI MANAGER FINALIZATION ===');

      // Carica TUTTI gli ordini e poi filtra lato client per sicurezza
      const [pendingResponse, shippedResponse] = await Promise.all([
        api.get('/pickup-orders'),
        api.get('/pickup-orders')
      ]);

      const allPendingData = pendingResponse.data || [];
      const allShippedData = shippedResponse.data || [];

      console.log(`📦 Totale ordini caricati: ${allPendingData.length}`);

      // ✅ FILTRO RIGOROSO LATO CLIENT: Solo CARICATO
      const pendingData = allPendingData.filter((order: PendingOrder) => {
        const isCaricato = order.status === 'CARICATO';
        if (isCaricato) {
          console.log(`✅ Ordine CARICATO: ${order.orderNumber} (${order.status})`);
        } else {
          console.log(`❌ Escluso ordine ${order.orderNumber} con stato: ${order.status}`);
        }
        return isCaricato;
      });

      // ✅ FILTRO RIGOROSO LATO CLIENT: Solo SPEDITO
      const shippedData = allShippedData.filter((order: PendingOrder) => {
        const isSpedito = order.status === 'SPEDITO';
        if (isSpedito) {
          console.log(`🚛 Ordine SPEDITO: ${order.orderNumber} (${order.status})`);
        } else {
          console.log(`❌ Escluso ordine ${order.orderNumber} con stato: ${order.status}`);
        }
        return isSpedito;
      });

      console.log(`📊 RISULTATI FILTRO:`);
      console.log(`   - Da finalizzare (CARICATO): ${pendingData.length}`);
      console.log(`   - Spediti (SPEDITO): ${shippedData.length}`);

      setPendingOrders(pendingData);
      setShippedOrders(shippedData);

      console.log('✅ === FINE CARICAMENTO DATI ===');

    } catch (error: any) {
      console.error('❌ Error fetching data:', error);
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

      console.log(`🚀 Finalizzazione spedizione ${selectedOrder.orderNumber}`);

      await api.post(`/pickup-orders/${selectedOrder.id}/workflow/finalize-shipment`, {
        departureWeight: parseFloat(finalizationData.departureWeight),
        notes: finalizationData.notes
      });

      await fetchData();
      setFinalizeDialog(false);
      resetFinalizationForm();

    } catch (error: any) {
      console.error('❌ Error finalizing shipment:', error);
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

      console.log(`✅ Completamento ordine ${selectedOrder.orderNumber}`);

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
      console.error('❌ Error completing order:', error);
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
    
    // Conta gli ordini completati oggi guardando la data di completion
    const todayFinalized = shippedOrders.filter(order => {
      if (!order.pickupOrder?.completionDate) return false;
      const completionDate = order.pickupOrder.completionDate.split('T')[0]; // Solo la data
      return completionDate === today;
    }).length;

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
            {loading ? 'Aggiornamento...' : 'Aggiorna'}
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        
        {/* Statistiche */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">{stats.pending}</Typography>
                <Typography variant="body2">📦 Da Finalizzare (CARICATO)</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">{stats.shipped}</Typography>
                <Typography variant="body2">🚛 Spediti (In Attesa Conferma)</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">{stats.todayFinalized}</Typography>
                <Typography variant="body2">✅ Finalizzati Oggi</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Ordini da Finalizzare (CARICATO) */}
          <Grid item xs={12} lg={7}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                📦 Ordini CARICATI - Pronti per Finalizzazione ({pendingOrders.length})
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                  <Typography sx={{ ml: 2 }}>Caricamento ordini...</Typography>
                </Box>
              ) : pendingOrders.length === 0 ? (
                <Alert severity="info">
                  <strong>Nessun ordine con stato CARICATO</strong>
                  <br />
                  Gli ordini appariranno qui quando gli operatori avranno completato il carico e l'ordine sarà nello stato "CARICATO"
                </Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Ordine</strong></TableCell>
                        <TableCell><strong>Cliente</strong></TableCell>
                        <TableCell><strong>Operatore</strong></TableCell>
                        <TableCell><strong>Data Carico</strong></TableCell>
                        <TableCell><strong>Colli</strong></TableCell>
                        <TableCell><strong>Stato</strong></TableCell>
                        <TableCell><strong>Azioni</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendingOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {order.orderNumber}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {order.pickupOrder?.basin?.code || 'N/D'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {order.pickupOrder?.basin?.client?.name || 'N/D'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {order.pickupOrder?.assignedOperator ? 
                                `${order.pickupOrder.assignedOperator.firstName || ''} ${order.pickupOrder.assignedOperator.lastName || ''}`.trim() : 
                                '-'
                              }
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {order.pickupOrder?.loadingDate ? 
                              format(new Date(order.pickupOrder.loadingDate), 'dd/MM HH:mm') : 
                              '-'
                            }
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={order.pickupOrder?.loadedPackages || 0} 
                              color="primary" 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label="CARICATO" 
                              color="warning" 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="Finalizza Spedizione">
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  startIcon={<CheckCircle />}
                                  onClick={() => handleFinalize(order)}
                                >
                                  Finalizza
                                </Button>
                              </Tooltip>
                              <Tooltip title="Visualizza Dettagli">
                                <IconButton 
                                  onClick={() => window.open(`/pickup-orders/${order.id}`, '_blank')} 
                                  size="small"
                                  color="primary"
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>

          {/* Spediti - In Attesa di Conferma (SPEDITO) */}
          <Grid item xs={12} lg={5}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                🚛 Ordini SPEDITI - In Attesa Conferma ({shippedOrders.length})
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress size={24} />
                  <Typography sx={{ ml: 2 }}>Caricamento...</Typography>
                </Box>
              ) : shippedOrders.length === 0 ? (
                <Alert severity="info">
                  <strong>Nessun ordine con stato SPEDITO</strong>
                  <br />
                  Le spedizioni finalizzate appariranno qui quando saranno nello stato "SPEDITO" in attesa di conferma destinatario
                </Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: '500px', overflow: 'auto' }}>
                  {shippedOrders.map((order) => (
                    <Card key={order.id} variant="outlined">
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {order.orderNumber}
                          </Typography>
                          <Chip 
                            label="SPEDITO" 
                            color="info" 
                            size="small" 
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Cliente:</strong> {order.pickupOrder?.basin?.client?.name || 'N/D'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Bacino:</strong> {order.pickupOrder?.basin?.code || 'N/D'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Mittente:</strong> {order.pickupOrder?.logisticSender?.name || 'N/D'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Destinatario:</strong> {order.pickupOrder?.logisticRecipient?.name || 'N/D'}
                        </Typography>
                        {order.pickupOrder?.departureWeight && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Peso Partenza:</strong> {order.pickupOrder.departureWeight} t
                          </Typography>
                        )}
                        {order.pickupOrder?.loadingDate && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Caricato il:</strong> {format(new Date(order.pickupOrder.loadingDate), 'dd/MM/yyyy HH:mm', { locale: it })}
                          </Typography>
                        )}
                      </CardContent>
                      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircle />}
                          onClick={() => handleComplete(order)}
                        >
                          Conferma Arrivo
                        </Button>
                        <IconButton 
                          onClick={() => window.open(`/pickup-orders/${order.id}`, '_blank')} 
                          size="small"
                          color="primary"
                        >
                          <Visibility />
                        </IconButton>
                      </CardActions>
                    </Card>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Dialog di Finalizzazione (CARICATO → SPEDITO) */}
      <Dialog open={finalizeDialog} onClose={() => setFinalizeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          🚛 Finalizza Spedizione - Ordine {selectedOrder?.orderNumber}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="info">
                <strong>Stato attuale:</strong> CARICATO → <strong>Nuovo stato:</strong> SPEDITO
              </Alert>
              
              <Typography variant="body1">
                <strong>Cliente:</strong> {selectedOrder.pickupOrder?.basin?.client?.name || 'N/D'} ({selectedOrder.pickupOrder?.basin?.code || 'N/D'})
              </Typography>
              <Typography variant="body2">
                <strong>Operatore Assegnato:</strong> {selectedOrder.pickupOrder?.assignedOperator ? 
                  `${selectedOrder.pickupOrder.assignedOperator.firstName || ''} ${selectedOrder.pickupOrder.assignedOperator.lastName || ''}`.trim() : 
                  'N/D'
                }
              </Typography>
              <Typography variant="body2">
                <strong>Colli Caricati:</strong> {selectedOrder.pickupOrder?.loadedPackages || 'N/D'}
              </Typography>
              
              <TextField
                label="Peso di Partenza (tonnellate)"
                type="number"
                value={finalizationData.departureWeight}
                onChange={(e) => setFinalizationData(prev => ({ ...prev, departureWeight: e.target.value }))}
                fullWidth
                inputProps={{ step: "0.001", min: "0" }}
                helperText="Il peso verrà registrato come peso ufficiale di partenza"
                required
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
            color="success"
            disabled={loading || !finalizationData.departureWeight || parseFloat(finalizationData.departureWeight) <= 0}
          >
            {loading ? 'Finalizzando...' : 'Finalizza Spedizione'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog di Completamento (SPEDITO → COMPLETO) */}
      <Dialog open={completeDialog} onClose={() => setCompleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          ✅ Conferma Arrivo - Ordine {selectedOrder?.orderNumber}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="success">
                <strong>Stato attuale:</strong> SPEDITO → <strong>Nuovo stato:</strong> COMPLETO
              </Alert>
              
              <Typography variant="body1">
                <strong>Cliente:</strong> {selectedOrder.pickupOrder?.basin?.client?.name || 'N/D'} ({selectedOrder.pickupOrder?.basin?.code || 'N/D'})
              </Typography>
              
              <Alert severity="info">
                <strong>Peso Partenza Registrato:</strong> {selectedOrder.pickupOrder?.departureWeight || 0} t
              </Alert>

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
                label="🚫 Segna come RESPINTO dal destinatario"
              />

              {!completionData.isRejected && (
                <TextField
                  label="Peso di Arrivo (tonnellate)"
                  type="number"
                  value={completionData.arrivalWeight}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, arrivalWeight: e.target.value }))}
                  fullWidth
                  inputProps={{ step: "0.001", min: "0" }}
                  helperText="Il peso effettivamente ricevuto dal destinatario"
                  required
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
                  required
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
              (!completionData.isRejected && (!completionData.arrivalWeight || parseFloat(completionData.arrivalWeight) <= 0))
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