// client/src/modules/deliveries/components/DayDetailModal.tsx

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import { Close, Delete, CheckCircle, Speed, Palette } from '@mui/icons-material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { deliveriesApi } from '../services/deliveries.api';
import FastDeliveryInput from './FastDeliveryInput';
import type { MaterialType, Delivery } from '../types/deliveries.types';

interface DayDetailModalProps {
  open: boolean;
  date: string;
  onClose: () => void;
  materialTypes: MaterialType[];
}

const DayDetailModal: React.FC<DayDetailModalProps> = ({
  open,
  date,
  onClose,
  materialTypes
}) => {
  const queryClient = useQueryClient();
  const [showFastInput, setShowFastInput] = useState(false);
  const [selectedMaterialType, setSelectedMaterialType] = useState<MaterialType | null>(null);

  // CORREZIONE: Usa getByDate invece di getDeliveriesByDate
  const {
    data: dayDeliveries,
    isLoading: isLoadingDeliveries,
    isError: isErrorDeliveries,
    error: deliveriesError,
  } = useQuery<Delivery[], Error>({
    queryKey: ['deliveries', date],
    queryFn: () => deliveriesApi.getByDate(date),
  });

  // CORREZIONE: Usa validate invece di validateDelivery
  const validateMutation = useMutation({
    mutationFn: (deliveryId: string) => deliveriesApi.validate(deliveryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries', date] });
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    },
    onError: (err) => {
      console.error("Errore durante la validazione del conferimento:", err);
      alert("Si è verificato un errore durante la validazione.");
    }
  });

  // CORREZIONE: Usa delete invece di deleteDelivery
  const deleteMutation = useMutation({
    mutationFn: (deliveryId: string) => deliveriesApi.delete(deliveryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries', date] });
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    },
    onError: (err) => {
      console.error("Errore durante l'eliminazione del conferimento:", err);
      alert("Si è verificato un errore durante l'eliminazione.");
    }
  });

  const handleOpenFastInput = (materialType: MaterialType) => {
    setSelectedMaterialType(materialType);
    setShowFastInput(true);
  };

  const handleCloseFastInput = () => {
    setShowFastInput(false);
    setSelectedMaterialType(null);
  };

  const handleValidateDelivery = (deliveryId: string) => {
    if (window.confirm('Sei sicuro di voler validare questo conferimento? Non sarà più modificabile.')) {
      validateMutation.mutate(deliveryId);
    }
  };

  const handleDeleteDelivery = (deliveryId: string, contributorName: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare il conferimento di ${contributorName}?`)) {
      deleteMutation.mutate(deliveryId);
    }
  };

  const formattedDate = format(new Date(date), 'EEEE dd MMMM yyyy', { locale: it });

  // Raggruppa i conferimenti per tipo di materiale
  const deliveriesByMaterial = dayDeliveries?.reduce((acc, delivery) => {
    const key = delivery.materialType.id;
    if (!acc[key]) {
      acc[key] = { materialType: delivery.materialType, deliveries: [], totalWeight: 0, count: 0 };
    }
    acc[key].deliveries.push(delivery);
    acc[key].totalWeight += delivery.weight;
    acc[key].count++;
    return acc;
  }, {} as Record<string, { materialType: MaterialType; deliveries: Delivery[]; totalWeight: number; count: number }>);

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Dettaglio Conferimenti del {formattedDate}
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2 }}>
          {isErrorDeliveries && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Errore durante il caricamento dei conferimenti: {deliveriesError?.message}
            </Alert>
          )}

          <Typography variant="h6" gutterBottom>
            Inserimento Rapido per Tipo Materiale:
          </Typography>
          <Grid container spacing={1} sx={{ mb: 3 }}>
            {materialTypes.filter(mt => mt.isActive).map((mt) => (
              <Grid item key={mt.id}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleOpenFastInput(mt)}
                  startIcon={<Speed sx={{ color: mt.color }} />}
                  sx={{ borderColor: mt.color, color: 'text.primary' }}
                >
                  {mt.name}
                </Button>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ mb: 3 }} />

          {isLoadingDeliveries ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              {Object.keys(deliveriesByMaterial || {}).length === 0 ? (
                <Alert severity="info">Nessun conferimento registrato per questa data.</Alert>
              ) : (
                Object.values(deliveriesByMaterial!).map(group => (
                  <Card key={group.materialType.id} sx={{ mb: 2, borderLeft: `5px solid ${group.materialType.color}` }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Palette sx={{ color: group.materialType.color }} />
                          {group.materialType.name}
                        </Typography>
                        <Chip label={`${group.count} conferimenti / ${group.totalWeight.toFixed(2)} ${group.materialType.unit}`} />
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      <List dense>
                        {group.deliveries.map(delivery => (
                          <ListItem key={delivery.id} disablePadding sx={{ pr: 2 }}>
                            <ListItemText
                              primary={`${delivery.contributor.name} - ${delivery.weight} ${delivery.unit}`}
                              secondary={
                                <Box component="span">
                                  {delivery.documentNumber && `Doc: ${delivery.documentNumber}`}
                                  {delivery.vehiclePlate && ` | Targa: ${delivery.vehiclePlate}`}
                                  {delivery.driverName && ` | Autista: ${delivery.driverName}`}
                                  {delivery.notes && ` | Note: ${delivery.notes}`}
                                  <br />
                                  {format(new Date(delivery.date), 'dd/MM/yyyy HH:mm')}
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                {!delivery.isValidated && (
                                  <Tooltip title="Valida">
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() => handleValidateDelivery(delivery.id)}
                                      disabled={validateMutation.isPending}
                                    >
                                      <CheckCircle fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                {!delivery.isValidated && (
                                  <Tooltip title="Elimina">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteDelivery(delivery.id, delivery.contributor.name)}
                                      disabled={deleteMutation.isPending}
                                    >
                                      <Delete fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                ))
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>
            Chiudi
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Inserimento Rapido */}
      {showFastInput && selectedMaterialType && (
        <FastDeliveryInput
          open={showFastInput}
          date={date}
          materialType={selectedMaterialType}
          onClose={handleCloseFastInput}
        />
      )}
    </>
  );
};

export default DayDetailModal;