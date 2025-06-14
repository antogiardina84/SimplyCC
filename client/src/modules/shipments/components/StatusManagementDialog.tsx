// client/src/modules/shipments/components/StatusManagementDialog.tsx

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Chip,
  Grid,
  Paper,
  IconButton
} from '@mui/material';
import {
  Close
} from '@mui/icons-material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import * as shipmentService from '../services/shipmentService';

interface StatusManagementDialogProps {
  open: boolean;
  onClose: () => void;
  pickupOrder: {
    id: string;
    orderNumber: string;
    status: string;
    scheduledDate?: string;
    basin: {
      code: string;
      client: {
        name: string;
      };
    };
    assignedOperator?: {
      firstName: string;
      lastName: string;
    };
  } | null;
  userRole: string;
  onStatusChanged: () => void;
}

const StatusManagementDialog = ({
  open,
  onClose,
  pickupOrder,
  userRole,
  onStatusChanged
}: StatusManagementDialogProps) => {
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    onClose();
  };

  // Azioni rapide per i cambi di stato più comuni
  const handleQuickAction = async (action: string) => {
    if (!pickupOrder) return;

    setLoading(true);
    try {
      switch (action) {
        case 'start-evading':
          if (pickupOrder.status === 'PROGRAMMATO') {
            await shipmentService.changeOrderStatus({
              pickupOrderId: pickupOrder.id,
              fromStatus: 'PROGRAMMATO',
              toStatus: 'IN_EVASIONE',
              reason: 'Avvio evasione manuale dal dialog',
              notes: 'Avviato dal manager tramite gestione stati'
            });
          }
          break;
        
        case 'cancel':
          await shipmentService.cancelOrder({
            pickupOrderId: pickupOrder.id,
            reason: 'Cancellato dal manager',
            notes: 'Cancellazione manuale'
          });
          break;
      }
      
      onStatusChanged();
      onClose();
    } catch (error: any) {
      alert('Errore: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!pickupOrder) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">
              {shipmentService.getStatusIcon(pickupOrder.status)} Gestisci Ordine #{pickupOrder.orderNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Stato attuale: <Chip 
                label={shipmentService.formatStatus(pickupOrder.status)} 
                color={shipmentService.getStatusColor(pickupOrder.status)} 
                size="small" 
              />
            </Typography>
          </Box>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Informazioni Ordine */}
        <Paper sx={{ p: 2, mb: 3, backgroundColor: 'grey.50' }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="subtitle2">Cliente</Typography>
              <Typography variant="body2">{pickupOrder.basin.client.name}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2">Bacino</Typography>
              <Typography variant="body2">{pickupOrder.basin.code}</Typography>
            </Grid>
            {pickupOrder.scheduledDate && (
              <Grid item xs={6}>
                <Typography variant="subtitle2">Data Programmata</Typography>
                <Typography variant="body2">
                  {format(new Date(pickupOrder.scheduledDate), 'dd/MM/yyyy HH:mm', { locale: it })}
                </Typography>
              </Grid>
            )}
            {pickupOrder.assignedOperator && (
              <Grid item xs={6}>
                <Typography variant="subtitle2">Operatore Assegnato</Typography>
                <Typography variant="body2">
                  {pickupOrder.assignedOperator.firstName} {pickupOrder.assignedOperator.lastName}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Azioni Rapide */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Azioni Disponibili</Typography>
          
          {pickupOrder.status === 'PROGRAMMATO' && (
            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                color="success"
                fullWidth
                onClick={() => handleQuickAction('start-evading')}
                disabled={loading}
                sx={{ mb: 1 }}
              >
                🚚 Avvia Evasione
              </Button>
              <Typography variant="caption" color="text.secondary">
                L'ordine passerà da PROGRAMMATO a IN_EVASIONE
              </Typography>
            </Box>
          )}

          {['DA_EVADERE', 'PROGRAMMATO', 'IN_EVASIONE'].includes(pickupOrder.status) && userRole === 'MANAGER' && (
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                color="error"
                fullWidth
                onClick={() => handleQuickAction('cancel')}
                disabled={loading}
                sx={{ mb: 1 }}
              >
                ❌ Annulla Ordine
              </Button>
              <Typography variant="caption" color="text.secondary">
                L'ordine verrà cancellato definitivamente
              </Typography>
            </Box>
          )}

          {!['DA_EVADERE', 'PROGRAMMATO', 'IN_EVASIONE'].includes(pickupOrder.status) && (
            <Alert severity="info">
              Per ordini in stato "{shipmentService.formatStatus(pickupOrder.status)}", 
              utilizza i pulsanti specifici nella dashboard operatore o nella finalizzazione manager.
            </Alert>
          )}
        </Box>

        <Alert severity="info">
          <Typography variant="body2">
            <strong>Suggerimento:</strong> Per azioni più complesse (assegnazione operatori, completamento carico, ecc.), 
            utilizza i pulsanti specifici nella dashboard operatore o nel calendario manager.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          Chiudi
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StatusManagementDialog;