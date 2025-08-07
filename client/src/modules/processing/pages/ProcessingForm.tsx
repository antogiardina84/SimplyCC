// client/src/modules/processing/pages/ProcessingForm.tsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';

import { processingService } from '../services/processingService';
import type {
  CreateProcessingData,
  UpdateProcessingData,
  CreateProcessingOutputData,
  Processing,
} from '../types/processing.types';
import { SHIFTS, MATERIAL_TYPES, REFERENCES } from '../types/processing.types';
import LoadingSpinner from '../../../core/components/LoadingSpinner';

const ProcessingForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState<CreateProcessingData>({
    date: format(new Date(), 'yyyy-MM-dd'),
    shift: 'MORNING',
    inputMaterialType: '',
    inputWeight: 0,
    inputReference: '',
    efficiency: undefined,
    wasteWeight: undefined,
    operatorId: undefined,
    notes: '',
    outputs: [],
  });

  // Lista operatori (potresti volerla caricare da un servizio)
  const [operators] = useState([
    { id: '1', name: 'Mario Rossi' },
    { id: '2', name: 'Luigi Verdi' },
    { id: '3', name: 'Giuseppe Bianchi' },
  ]);

  const loadProcessing = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await processingService.getById(id);
      
      setFormData({
        date: format(new Date(data.date), 'yyyy-MM-dd'),
        shift: data.shift,
        inputMaterialType: data.inputMaterialType,
        inputWeight: data.inputWeight,
        inputReference: data.inputReference,
        efficiency: data.efficiency || undefined,
        wasteWeight: data.wasteWeight || undefined,
        operatorId: data.operatorId || undefined,
        notes: data.notes || '',
        outputs: data.outputs.map(output => ({
          outputMaterialType: output.outputMaterialType,
          outputWeight: output.outputWeight,
          outputReference: output.outputReference,
          quality: output.quality || undefined,
        })),
      });
    } catch (err) {
      setError('Errore durante il caricamento della lavorazione');
      console.error('Error loading processing:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProcessing();
  }, [id]);

  const handleInputChange = (field: keyof CreateProcessingData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const addOutput = () => {
    setFormData(prev => ({
      ...prev,
      outputs: [
        ...prev.outputs!,
        {
          outputMaterialType: '',
          outputWeight: 0,
          outputReference: '',
          quality: undefined,
        },
      ],
    }));
  };

  const updateOutput = (index: number, field: keyof CreateProcessingOutputData, value: any) => {
    setFormData(prev => ({
      ...prev,
      outputs: prev.outputs!.map((output, i) =>
        i === index ? { ...output, [field]: value } : output
      ),
    }));
  };

  const removeOutput = (index: number) => {
    setFormData(prev => ({
      ...prev,
      outputs: prev.outputs!.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Validazione base
      if (!formData.inputMaterialType || !formData.inputReference || formData.inputWeight <= 0) {
        setError('Compila tutti i campi obbligatori');
        return;
      }

      if (isEdit) {
        await processingService.update(id!, formData as UpdateProcessingData);
        setSuccess('Lavorazione aggiornata con successo');
      } else {
        await processingService.create(formData);
        setSuccess('Lavorazione creata con successo');
      }

      // Reindirizza alla lista dopo un breve delay
      setTimeout(() => {
        navigate('/processing');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore durante il salvataggio');
      console.error('Error saving processing:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/processing')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {isEdit ? 'Modifica Lavorazione' : 'Nuova Lavorazione'}
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
                  label="Data Lavorazione"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth required>
                  <InputLabel>Turno</InputLabel>
                  <Select
                    value={formData.shift}
                    label="Turno"
                    onChange={(e) => handleInputChange('shift', e.target.value)}
                  >
                    {Object.entries(SHIFTS).map(([key, value]) => (
                      <MenuItem key={key} value={key}>{value}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Operatore</InputLabel>
                  <Select
                    value={formData.operatorId || ''}
                    label="Operatore"
                    onChange={(e) => handleInputChange('operatorId', e.target.value || undefined)}
                  >
                    <MenuItem value="">Nessuno</MenuItem>
                    {operators.map(operator => (
                      <MenuItem key={operator.id} value={operator.id}>
                        {operator.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Materiale in Ingresso */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Materiale in Ingresso
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo Materiale</InputLabel>
                  <Select
                    value={formData.inputMaterialType}
                    label="Tipo Materiale"
                    onChange={(e) => handleInputChange('inputMaterialType', e.target.value)}
                  >
                    {MATERIAL_TYPES.map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Peso Input (kg)"
                  value={formData.inputWeight}
                  onChange={(e) => handleInputChange('inputWeight', parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Riferimento</InputLabel>
                  <Select
                    value={formData.inputReference}
                    label="Riferimento"
                    onChange={(e) => handleInputChange('inputReference', e.target.value)}
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

        {/* Efficienza e Scarti */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Efficienza e Scarti
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Efficienza (%)"
                  value={formData.efficiency || ''}
                  onChange={(e) => handleInputChange('efficiency', parseFloat(e.target.value) || undefined)}
                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Peso Scarti (kg)"
                  value={formData.wasteWeight || ''}
                  onChange={(e) => handleInputChange('wasteWeight', parseFloat(e.target.value) || undefined)}
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Prodotti in Uscita */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Prodotti in Uscita
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addOutput}
              >
                Aggiungi Output
              </Button>
            </Box>
            
            {formData.outputs && formData.outputs.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Tipo Materiale</TableCell>
                      <TableCell>Peso (kg)</TableCell>
                      <TableCell>Riferimento</TableCell>
                      <TableCell>Qualità</TableCell>
                      <TableCell>Azioni</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.outputs.map((output, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <FormControl fullWidth size="small">
                            <Select
                              value={output.outputMaterialType}
                              onChange={(e) => updateOutput(index, 'outputMaterialType', e.target.value)}
                            >
                              {MATERIAL_TYPES.map(type => (
                                <MenuItem key={type} value={type}>{type}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={output.outputWeight}
                            onChange={(e) => updateOutput(index, 'outputWeight', parseFloat(e.target.value) || 0)}
                            inputProps={{ min: 0, step: 0.1 }}
                          />
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth size="small">
                            <Select
                              value={output.outputReference}
                              onChange={(e) => updateOutput(index, 'outputReference', e.target.value)}
                            >
                              {REFERENCES.map(ref => (
                                <MenuItem key={ref} value={ref}>{ref}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={output.quality || ''}
                            onChange={(e) => updateOutput(index, 'quality', e.target.value || undefined)}
                            placeholder="Es: A, B, C"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeOutput(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                Nessun prodotto in uscita definito
              </Typography>
            )}
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
            {saving ? 'Salvataggio...' : (isEdit ? 'Aggiorna' : 'Crea')}
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/processing')}
            disabled={saving}
          >
            Annulla
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default ProcessingForm;