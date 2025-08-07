// client/src/modules/inventory/pages/InventoryForm.tsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Calculate as CalculateIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';

import { inventoryService } from '../services/inventoryService';
import type { CreateInventoryData, UpdateInventoryData, Inventory } from '../types/inventory.types';
import { MATERIAL_TYPES, REFERENCES } from '../types/inventory.types';
import LoadingSpinner from '../../../core/components/LoadingSpinner';

const InventoryForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState<CreateInventoryData>({
    date: format(new Date(), 'yyyy-MM-dd'),
    materialType: '',
    reference: '',
    materialTypeId: undefined,
    initialStock: 0,
    deliveries: 0,
    processing: 0,
    shipments: 0,
    adjustments: 0,
    finalStock: 0,
    notes: '',
  });

  // Carica ultima giacenza per calcolo automatico
  const [lastInventory, setLastInventory] = useState<Inventory | null>(null);

  const loadInventory = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await inventoryService.getById(id);
      
      setFormData({
        date: format(new Date(data.date), 'yyyy-MM-dd'),
        materialType: data.materialType,
        reference: data.reference,
        materialTypeId: data.materialTypeId || undefined,
        initialStock: data.initialStock,
        deliveries: data.deliveries,
        processing: data.processing,
        shipments: data.shipments,
        adjustments: data.adjustments,
        finalStock: data.finalStock,
        notes: data.notes || '',
      });
    } catch (err) {
      setError('Errore durante il caricamento del movimento');
      console.error('Error loading inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLastInventory = async (materialType: string, reference: string) => {
    if (!materialType || !reference) return;

    try {
      const lastStock = await inventoryService.getLatestByMaterial(materialType, reference);
      setLastInventory(lastStock);
      
      if (lastStock && !isEdit) {
        setFormData(prev => ({
          ...prev,
          initialStock: lastStock.finalStock,
        }));
      }
    } catch (err) {
      console.error('Error loading last inventory:', err);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [id]);

  useEffect(() => {
    if (formData.materialType && formData.reference) {
      loadLastInventory(formData.materialType, formData.reference);
    }
  }, [formData.materialType, formData.reference]);

  // Calcola automaticamente la giacenza finale
  useEffect(() => {
    const finalStock = formData.initialStock + 
                      (formData.deliveries || 0) - 
                      (formData.processing || 0) - 
                      (formData.shipments || 0) + 
                      (formData.adjustments || 0);
    setFormData(prev => ({ ...prev, finalStock }));
  }, [formData.initialStock, formData.deliveries, formData.processing, formData.shipments, formData.adjustments]);

  const handleInputChange = (field: keyof CreateInventoryData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Validazione base
      if (!formData.materialType || !formData.reference) {
        setError('Tipo materiale e riferimento sono obbligatori');
        return;
      }

      if (isEdit) {
        await inventoryService.update(id!, formData as UpdateInventoryData);
        setSuccess('Movimento di giacenza aggiornato con successo');
      } else {
        await inventoryService.create(formData);
        setSuccess('Movimento di giacenza creato con successo');
      }

      // Reindirizza alla lista dopo un breve delay
      setTimeout(() => {
        navigate('/inventory');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore durante il salvataggio');
      console.error('Error saving inventory:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/inventory')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {isEdit ? 'Modifica Movimento Giacenza' : 'Nuovo Movimento Giacenza'}
        </Typography>
      </Box>

      {/* Messaggi */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Info ultima giacenza */}
      {lastInventory && !isEdit && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Ultima giacenza per {formData.materialType} - {formData.reference}: {lastInventory.finalStock.toLocaleString()} kg 
          del {format(new Date(lastInventory.date), 'dd/MM/yyyy')}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* Dati Principali */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Informazioni Generali
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="Data Movimento"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo Materiale</InputLabel>
                  <Select
                    value={formData.materialType}
                    label="Tipo Materiale"
                    onChange={(e) => handleInputChange('materialType', e.target.value)}
                  >
                    {MATERIAL_TYPES.map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Riferimento</InputLabel>
                  <Select
                    value={formData.reference}
                    label="Riferimento"
                    onChange={(e) => handleInputChange('reference', e.target.value)}
                  >
                    {REFERENCES.map(ref => (
                      <MenuItem key={ref} value={ref}>{ref}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Giacenza Iniziale */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Giacenza Iniziale
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Giacenza Iniziale (kg)"
                  value={formData.initialStock}
                  onChange={(e) => handleInputChange('initialStock', parseFloat(e.target.value) || 0)}
                  inputProps={{ step: 0.1 }}
                  helperText="Giacenza all'inizio del periodo"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Movimenti */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Movimenti del Periodo
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Conferimenti (+)"
                  value={formData.deliveries}
                  onChange={(e) => handleInputChange('deliveries', parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, step: 0.1 }}
                  helperText="Materiale in ingresso"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'success.main' },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Lavorazioni (-)"
                  value={formData.processing}
                  onChange={(e) => handleInputChange('processing', parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, step: 0.1 }}
                  helperText="Materiale utilizzato in lavorazione"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'warning.main' },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Spedizioni (-)"
                  value={formData.shipments}
                  onChange={(e) => handleInputChange('shipments', parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, step: 0.1 }}
                  helperText="Materiale spedito"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'error.main' },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Correzioni (±)"
                  value={formData.adjustments}
                  onChange={(e) => handleInputChange('adjustments', parseFloat(e.target.value) || 0)}
                  inputProps={{ step: 0.1 }}
                  helperText="Variazioni e correzioni (+ o -)"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'info.main' },
                    },
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Giacenza Finale (Calcolata) */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Giacenza Finale (Calcolata Automaticamente)
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Giacenza Finale (kg)"
                  value={formData.finalStock}
                  InputProps={{ readOnly: true }}
                  inputProps={{ step: 0.1 }}
                  helperText="Calcolata automaticamente"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'grey.50',
                      '& fieldset': { 
                        borderColor: formData.finalStock < 0 ? 'error.main' : 'primary.main',
                        borderWidth: 2,
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalculateIcon color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Formula: Iniziale + Conferimenti - Lavorazioni - Spedizioni + Correzioni
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {formData.initialStock.toFixed(1)} + {(formData.deliveries || 0).toFixed(1)} - {(formData.processing || 0).toFixed(1)} - {(formData.shipments || 0).toFixed(1)} + {(formData.adjustments || 0).toFixed(1)} = <strong>{formData.finalStock.toFixed(1)} kg</strong>
                </Typography>
                {formData.finalStock < 0 && (
                  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                    ⚠️ Attenzione: Giacenza negativa!
                  </Typography>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Note */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Note
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Note aggiuntive"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Inserisci eventuali note o osservazioni..."
            />
          </CardContent>
        </Card>

        {/* Pulsanti */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={saving}
          >
            {saving ? 'Salvataggio...' : (isEdit ? 'Aggiorna Movimento' : 'Crea Movimento')}
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/inventory')}
            disabled={saving}
          >
            Annulla
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default InventoryForm;