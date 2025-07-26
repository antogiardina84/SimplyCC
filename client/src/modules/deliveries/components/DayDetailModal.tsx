// client/src/modules/deliveries/components/DayDetailModal.tsx - VERSIONE CORRETTA CON MODALITÀ CONTINUA

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
  ListItemSecondaryAction,
  Switch,
  FormControlLabel,
  TextField,
  Snackbar
} from '@mui/material';
import { 
  Close, 
  Delete, 
  CheckCircle, 
  Speed, 
  Palette, 
  Add, 
  Save,
  Refresh,
  ContentCopy
} from '@mui/icons-material';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { deliveriesApi } from '../services/deliveries.api';
import type { MaterialType, Delivery } from '../types/deliveries.types';

interface DayDetailModalProps {
  open: boolean;
  date: string;
  onClose: () => void;
  materialTypes: MaterialType[];
}

// ✅ CORREZIONE: Modal semplificato con modalità continua
const SimpleDeliveryForm: React.FC<{
  open: boolean;
  onClose: () => void;
  date: string;
  materialType: MaterialType;
  keepOpen: boolean;
  onSuccess: () => void;
}> = ({ open, onClose, date, materialType, keepOpen, onSuccess }) => {
  const [weight, setWeight] = useState('');
  const [contributorName, setContributorName] = useState('');
  const [notes, setNotes] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const queryClient = useQueryClient();

  // ✅ CORREZIONE: Mutation per creazione conferimento
  const createDeliveryMutation = useMutation({
    mutationFn: (data: any) => deliveriesApi.create(data),
    onSuccess: () => {
      console.log('✅ Conferimento creato con successo!');
      
      // Invalida le query per aggiornare i dati
      queryClient.invalidateQueries({ queryKey: ['deliveries', date] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      
      // Mostra notifica di successo
      setShowSuccess(true);
      
      if (keepOpen) {
        // ✅ MODALITÀ CONTINUA: Reset form per nuovo inserimento
        setWeight('');
        setContributorName('');
        setNotes('');
        
        // Focus automatico sul primo campo
        setTimeout(() => {
          const firstInput = document.querySelector('input[name="contributorName"]') as HTMLInputElement;
          if (firstInput) firstInput.focus();
        }, 100);
        
        console.log('🔄 Form resettato per inserimento continuo');
      } else {
        // Modalità normale: chiudi modal
        onClose();
      }
      
      onSuccess();
    },
    onError: (error: any) => {
      console.error('❌ Errore nel salvataggio del conferimento:', error);
      
      let errorMessage = 'Errore sconosciuto';
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      alert(`Errore nel salvataggio del conferimento: ${errorMessage}`);
    },
  });

  const handleSave = async () => {
    if (!weight || !contributorName) {
      alert('Inserire peso e nome conferitore');
      return;
    }

    const dataToSubmit = {
      date: date,
      materialTypeId: materialType.id,
      weight: parseFloat(weight),
      contributorName: contributorName.trim(),
      unit: materialType.unit,
      notes: notes.trim() || undefined
    };

    console.log('💾 Salvando conferimento:', dataToSubmit);
    createDeliveryMutation.mutate(dataToSubmit);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  const saving = createDeliveryMutation.isLoading;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: materialType.color || '#666', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Speed />
            Nuovo Conferimento - {materialType.name}
            {keepOpen && (
              <Chip 
                label="MODALITÀ CONTINUA" 
                size="small" 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  fontWeight: 'bold'
                }} 
              />
            )}
          </Box>
          <IconButton 
            onClick={onClose} 
            sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              📅 Data: {format(new Date(date), 'dd MMMM yyyy', { locale: it })}
            </Typography>
            
            {keepOpen && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>Modalità Continua Attiva</strong><br />
                Dopo ogni salvataggio, il form si resetterà per un nuovo inserimento.
                Usa <strong>Ctrl+Enter</strong> per salvare rapidamente.
              </Alert>
            )}
            
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                name="contributorName"
                label="Nome Conferitore"
                value={contributorName}
                onChange={(e) => setContributorName(e.target.value)}
                placeholder="Es: Eco Service SRL"
                disabled={saving}
                fullWidth
                autoFocus
                onKeyPress={handleKeyPress}
                InputProps={{
                  endAdornment: contributorName && (
                    <Tooltip title="Copia nome">
                      <IconButton
                        size="small"
                        onClick={() => navigator.clipboard.writeText(contributorName)}
                      >
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )
                }}
              />
              
              <TextField
                name="weight"
                label={`Peso (${materialType.unit})`}
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Es: 150.5"
                disabled={saving}
                fullWidth
                inputProps={{ step: "0.1", min: "0" }}
                onKeyPress={handleKeyPress}
              />
              
              <TextField
                label="Note (opzionale)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Note aggiuntive..."
                disabled={saving}
                fullWidth
                multiline
                rows={2}
                onKeyPress={handleKeyPress}
              />
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={onClose} disabled={saving}>
            {keepOpen ? 'Chiudi' : 'Annulla'}
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSave}
            disabled={saving || !weight || !contributorName}
            startIcon={saving ? <CircularProgress size={16} /> : <Save />}
            sx={{ 
              bgcolor: materialType.color || '#666',
              '&:hover': { bgcolor: materialType.color ? `${materialType.color}dd` : '#555' }
            }}
          >
            {saving ? 'Salvando...' : keepOpen ? 'Salva e Continua' : 'Salva'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar per successo */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={2000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          ✅ Conferimento salvato con successo!
        </Alert>
      </Snackbar>
    </>
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
  
  // ✅ CORREZIONE PRINCIPALE: Stato per modalità continua
  const [keepModalOpen, setKeepModalOpen] = useState(true);

  // Query per i conferimenti del giorno
  const {
    data: dayDeliveries,
    isLoading: isLoadingDeliveries,
    isError: isErrorDeliveries,
    error: deliveriesError,
  } = useQuery<Delivery[], Error>({
    queryKey: ['deliveries', date],
    queryFn: () => deliveriesApi.getByDate(date),
    enabled: open,
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

  // ✅ CORREZIONE: Handler per gestire successo inserimento
  const handleFormSuccess = () => {
    if (!keepModalOpen) {
      setShowSimpleForm(false);
      setSelectedMaterialType(null);
    }
    // Se keepModalOpen è true, il form rimane aperto automaticamente
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

  // Calcola statistiche del giorno
  const dayStats = {
    totalDeliveries: dayDeliveries?.length || 0,
    totalWeight: dayDeliveries?.reduce((sum, d) => sum + d.weight, 0) || 0,
    materialTypes: Object.keys(deliveriesByMaterial || {}).length,
    validated: dayDeliveries?.filter(d => d.isValidated).length || 0
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box>
            <Typography variant="h6">
              📋 Conferimenti del {formattedDate}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {dayStats.totalDeliveries} conferimenti • {dayStats.totalWeight.toFixed(2)} kg • {dayStats.materialTypes} tipologie
            </Typography>
          </Box>
          
          {/* ✅ CONTROLLO MODALITÀ CONTINUA */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={keepModalOpen}
                  onChange={(e) => setKeepModalOpen(e.target.checked)}
                  size="small"
                  color="primary"
                />
              }
              label={
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" display="block">
                    Modalità Continua
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {keepModalOpen ? 'Mantieni aperta' : 'Chiudi dopo inserimento'}
                  </Typography>
                </Box>
              }
              labelPlacement="start"
              sx={{ mr: 2 }}
            />
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers sx={{ p: 2 }}>
          {isErrorDeliveries && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Errore durante il caricamento dei conferimenti: {deliveriesError?.message}
            </Alert>
          )}

          {/* SEZIONE INSERIMENTO RAPIDO */}
          <Card sx={{ 
            mb: 3, 
            bgcolor: keepModalOpen ? 'success.50' : 'primary.50', 
            border: '2px solid', 
            borderColor: keepModalOpen ? 'success.200' : 'primary.200' 
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Add color={keepModalOpen ? "success" : "primary"} />
                Inserimento Rapido Conferimenti
                {keepModalOpen && (
                  <Chip 
                    label="MODALITÀ CONTINUA ATTIVA" 
                    size="small" 
                    color="success" 
                    icon={<Refresh />}
                  />
                )}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {keepModalOpen 
                  ? '🔄 Modalità continua attiva: la finestra rimarrà aperta dopo ogni inserimento per velocizzare il lavoro'
                  : '📝 Seleziona una tipologia di materiale per aggiungere un conferimento:'
                }
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
                          backgroundColor: mt.color ? `${mt.color}dd` : '#555',
                          transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s'
                      }}
                    >
                      {mt.name}
                    </Button>
                  </Grid>
                ))}
              </Grid>
              
              {keepModalOpen && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  💡 <strong>Suggerimento:</strong> Con la modalità continua attiva, puoi inserire 
                  rapidamente più conferimenti della stessa tipologia senza chiudere la finestra.
                </Alert>
              )}
            </CardContent>
          </Card>

          <Divider sx={{ mb: 3 }} />

          {/* SEZIONE CONFERIMENTI ESISTENTI */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              📦 Conferimenti Registrati
            </Typography>
            {dayStats.validated > 0 && (
              <Chip 
                label={`${dayStats.validated}/${dayStats.totalDeliveries} validati`}
                color="success" 
                size="small"
                icon={<CheckCircle />}
              />
            )}
          </Box>

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
                  💡 Usa i bottoni sopra per aggiungere il primo conferimento!
                </Alert>
              ) : (
                Object.values(deliveriesByMaterial!).map(group => (
                  <Card key={group.materialType.id} sx={{ 
                    mb: 2, 
                    borderLeft: `5px solid ${group.materialType.color}`,
                    '&:hover': { boxShadow: 2 }
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Palette sx={{ color: group.materialType.color }} />
                          {group.materialType.name}
                        </Typography>
                        <Chip 
                          label={`${group.count} conferimenti • ${group.totalWeight.toFixed(2)} ${group.materialType.unit}`}
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      <List dense>
                        {group.deliveries.map(delivery => (
                          <ListItem key={delivery.id} disablePadding sx={{ pr: 2, py: 0.5 }}>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" fontWeight="bold">
                                    {delivery.contributor.name}
                                  </Typography>
                                  <Chip 
                                    label={`${delivery.weight} ${delivery.unit}`}
                                    size="small" 
                                    color="primary"
                                  />
                                  {delivery.isValidated && (
                                    <Chip 
                                      label="Validato" 
                                      size="small" 
                                      color="success"
                                      icon={<CheckCircle />}
                                    />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box component="span">
                                  {delivery.documentNumber && `Doc: ${delivery.documentNumber} • `}
                                  {delivery.vehiclePlate && `Targa: ${delivery.vehiclePlate} • `}
                                  {delivery.driverName && `Autista: ${delivery.driverName} • `}
                                  {delivery.notes && `Note: ${delivery.notes} • `}
                                  <Typography component="span" variant="caption" color="text.secondary">
                                    {format(new Date(delivery.date), 'dd/MM/yyyy HH:mm')}
                                  </Typography>
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                {!delivery.isValidated && (
                                  <Tooltip title="Valida conferimento">
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() => handleValidateDelivery(delivery.id)}
                                      disabled={validateMutation.isLoading}
                                    >
                                      <CheckCircle fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                {!delivery.isValidated && (
                                  <Tooltip title="Elimina conferimento">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteDelivery(delivery.id, delivery.contributor.name)}
                                      disabled={deleteMutation.isLoading}
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

        <DialogActions sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {keepModalOpen && (
                <Alert severity="success" sx={{ py: 0, px: 1 }}>
                  🔄 Modalità continua attiva
                </Alert>
              )}
            </Box>
            <Button onClick={onClose} variant="contained">
              Chiudi
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Modal Inserimento Semplificato */}
      {showSimpleForm && selectedMaterialType && (
        <SimpleDeliveryForm
          open={showSimpleForm}
          date={date}
          materialType={selectedMaterialType}
          onClose={handleCloseSimpleForm}
          keepOpen={keepModalOpen}
          onSuccess={handleFormSuccess}
        />
      )}
    </>
  );
};

export default DayDetailModal;