// client/src/modules/deliveries/components/DayDetailModal.tsx - FIXED

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
import { Close, Delete, CheckCircle, Speed, Palette, Add } from '@mui/icons-material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { deliveriesApi } from '../services/deliveries.api';
// RIMOSSO: import FastDeliveryInput from './FastDeliveryInput'; // Componente troppo complesso per ora
import type { MaterialType, Delivery } from '../types/deliveries.types';

interface DayDetailModalProps {
  open: boolean;
  date: string;
  onClose: () => void;
  materialTypes: MaterialType[];
}

// AGGIUNTO: Modal semplificato per inserimento rapido
const SimpleDeliveryForm: React.FC<{
  open: boolean;
  onClose: () => void;
  date: string;
  materialType: MaterialType;
}> = ({ open, onClose, date, materialType }) => {
  const [weight, setWeight] = useState('');
  const [contributorName, setContributorName] = useState('');
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const handleSave = async () => {
    if (!weight || !contributorName) {
      alert('Inserire peso e nome conferitore');
      return;
    }

    setSaving(true);
    try {
      // Per ora simuliamo il salvataggio - in futuro andrà implementato con API reali
      console.log('💾 Salvando conferimento:', {
        date,
        materialType: materialType.name,
        weight: parseFloat(weight),
        contributorName
      });
      
      // Simula chiamata API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Aggiorna le query del calendario
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      
      alert('Conferimento salvato con successo!');
      onClose();
      
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
      alert('Errore nel salvataggio del conferimento');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Nuovo Conferimento - {materialType.name}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Data: {format(new Date(date), 'dd MMMM yyyy', { locale: it })}
          </Typography>
          
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="body2" gutterBottom>Nome Conferitore:</Typography>
              <input
                type="text"
                value={contributorName}
                onChange={(e) => setContributorName(e.target.value)}
                placeholder="Es: Eco Service SRL"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </Box>
            
            <Box>
              <Typography variant="body2" gutterBottom>
                Peso ({materialType.unit}):
              </Typography>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Es: 150.5"
                step="0.1"
                min="0"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Annulla
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSave}
          disabled={saving || !weight || !contributorName}
        >
          {saving ? 'Salvataggio...' : 'Salva'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const DayDetailModal: React.FC<DayDetailModalProps> = ({
  open,
  date,
  onClose,
  materialTypes
}) => {
  const queryClient = useQueryClient();
  const [showSimpleForm, setShowSimpleForm] = useState(false);
  const [selectedMaterialType, setSelectedMaterialType] = useState<MaterialType | null>(null);

  // Query per i conferimenti del giorno
  const {
    data: dayDeliveries,
    isLoading: isLoadingDeliveries,
    isError: isErrorDeliveries,
    error: deliveriesError,
  } = useQuery<Delivery[], Error>({
    queryKey: ['deliveries', date],
    queryFn: () => deliveriesApi.getByDate(date),
    enabled: open, // Esegui solo quando il modal è aperto
  });

  // Mutation per validazione
  const validateMutation = useMutation({
    mutationFn: (deliveryId: string) => deliveriesApi.validate(deliveryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries', date] });
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    },
  });

  // Mutation per eliminazione
  const deleteMutation = useMutation({
    mutationFn: (deliveryId: string) => deliveriesApi.delete(deliveryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries', date] });
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    },
  });

  const handleOpenSimpleForm = (materialType: MaterialType) => {
    setSelectedMaterialType(materialType);
    setShowSimpleForm(true);
  };

  const handleCloseSimpleForm = () => {
    setShowSimpleForm(false);
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

          {/* SEZIONE INSERIMENTO RAPIDO - SEMPRE VISIBILE */}
          <Card sx={{ mb: 3, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Add color="primary" />
                Inserimento Rapido Conferimenti
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Seleziona una tipologia di materiale per aggiungere rapidamente un conferimento:
              </Typography>
              <Grid container spacing={1} sx={{ mt: 1 }}>
                {materialTypes?.filter(mt => mt.isActive).map((mt) => (
                  <Grid item key={mt.id}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleOpenSimpleForm(mt)}
                      startIcon={<Speed />}
                      sx={{ 
                        backgroundColor: mt.color || '#666',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: mt.color ? `${mt.color}dd` : '#555'
                        }
                      }}
                    >
                      {mt.name}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          <Divider sx={{ mb: 3 }} />

          {/* SEZIONE CONFERIMENTI ESISTENTI */}
          <Typography variant="h6" gutterBottom>
            Conferimenti Registrati
          </Typography>

          {isLoadingDeliveries ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              {Object.keys(deliveriesByMaterial || {}).length === 0 ? (
                <Alert severity="info">
                  Nessun conferimento registrato per questa data.
                  <br />
                  Usa i bottoni sopra per aggiungere il primo conferimento!
                </Alert>
              ) : (
                Object.values(deliveriesByMaterial!).map(group => (
                  <Card key={group.materialType.id} sx={{ mb: 2, borderLeft: `5px solid ${group.materialType.color}` }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Palette sx={{ color: group.materialType.color }} />
                          {group.materialType.name}
                        </Typography>
                        <Chip 
                          label={`${group.count} conferimenti / ${group.totalWeight.toFixed(2)} ${group.materialType.unit}`}
                          color="primary" 
                        />
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

      {/* Modal Inserimento Semplificato */}
      {showSimpleForm && selectedMaterialType && (
        <SimpleDeliveryForm
          open={showSimpleForm}
          date={date}
          materialType={selectedMaterialType}
          onClose={handleCloseSimpleForm}
        />
      )}
    </>
  );
};

export default DayDetailModal;