// client/src/modules/deliveries/pages/MaterialTypeForm.tsx - VERSIONE COMPLETAMENTE CORRETTA

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  Switch,
  FormControlLabel,
  IconButton,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { ArrowBack, Save, Cancel, Palette, Info } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialTypesApi } from '../services/materialTypes.api';
import type { CreateMaterialTypeData, UpdateMaterialTypeData } from '../types/deliveries.types';

interface FormData extends CreateMaterialTypeData {
  isActive?: boolean;
}

// Colori predefiniti per le tipologie materiali
const PREDEFINED_COLORS = [
  { name: 'Blu', value: '#2196F3' },
  { name: 'Verde', value: '#4CAF50' },
  { name: 'Arancione', value: '#FF9800' },
  { name: 'Viola', value: '#9C27B0' },
  { name: 'Rosso', value: '#F44336' },
  { name: 'Azzurro', value: '#00BCD4' },
  { name: 'Giallo', value: '#FFEB3B' },
  { name: 'Marrone', value: '#795548' },
  { name: 'Grigio Blu', value: '#607D8B' },
  { name: 'Rosa', value: '#E91E63' },
  { name: 'Indaco', value: '#3F51B5' },
  { name: 'Verde Acqua', value: '#009688' },
  { name: 'Verde Chiaro', value: '#8BC34A' },
  { name: 'Lime', value: '#CDDC39' },
  { name: 'Ambra', value: '#FFC107' },
  { name: 'Rosso Scuro', value: '#FF5722' },
];

// Unità di misura predefinite
const PREDEFINED_UNITS = ['kg', 'ton', 'mc', 'lt', 'pz'];

// Riferimenti predefiniti
const PREDEFINED_REFERENCES = ['COREPLA', 'CORIPET', 'COMIECO', 'CIAL', 'COREVE', 'RICREA'];

const MaterialTypeForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  // Stati locali
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Form configuration
  const { control, handleSubmit, reset, watch, setValue, formState: { errors, isValid } } = useForm<FormData>({
    defaultValues: {
      code: '',
      name: '',
      description: '',
      unit: 'kg',
      cerCode: '',
      reference: '',
      color: PREDEFINED_COLORS[0].value,
      sortOrder: 0,
      parentId: '',
      isActive: true,
    },
    mode: 'onChange',
  });

  // Watch per preview del colore
  const selectedColor = watch('color');

  // Query per il material type (solo in modalità edit)
  const { 
    data: materialType, 
    isLoading: isLoadingMaterialType, 
    isError: isErrorMaterialType,
    error: materialTypeError 
  } = useQuery({
    queryKey: ['materialTypes', id],
    queryFn: () => materialTypesApi.getById(id!),
    enabled: isEditMode,
    retry: 3,
  });

  // Query per i material types parent (solo categorie principali)
  const { 
    data: parentMaterialTypes, 
    isLoading: isLoadingParentMaterialTypes 
  } = useQuery({
    queryKey: ['materialTypes', 'parents'],
    queryFn: () => materialTypesApi.getAll({ includeInactive: false }),
    select: (data) => data.filter(mt => !mt.parentId), // Solo quelli senza parent
  });

  // Mutation per creazione
  const createMutation = useMutation({
    mutationFn: (data: CreateMaterialTypeData) => {
      console.log('🚀 Creating material type with data:', data);
      return materialTypesApi.create(data);
    },
    onSuccess: (result) => {
      console.log('✅ Material type created successfully:', result);
      setSubmitSuccess(true);
      setSubmitError(null);
      queryClient.invalidateQueries({ queryKey: ['materialTypes'] });
      
      // Reindirizza dopo un breve delay per mostrare il successo
      setTimeout(() => {
        navigate('/deliveries/material-types');
      }, 1500);
    },
    onError: (error: any) => {
      console.error('❌ Error creating material type:', error);
      setSubmitError(error.message || 'Errore durante la creazione della tipologia di materiale');
      setSubmitSuccess(false);
    },
  });

  // Mutation per aggiornamento
  const updateMutation = useMutation({
    mutationFn: (data: UpdateMaterialTypeData) => {
      console.log('🔄 Updating material type:', id, 'with data:', data);
      return materialTypesApi.update(id!, data);
    },
    onSuccess: (result) => {
      console.log('✅ Material type updated successfully:', result);
      setSubmitSuccess(true);
      setSubmitError(null);
      queryClient.invalidateQueries({ queryKey: ['materialTypes', id] });
      queryClient.invalidateQueries({ queryKey: ['materialTypes'] });
      
      // Reindirizza dopo un breve delay per mostrare il successo
      setTimeout(() => {
        navigate('/deliveries/material-types');
      }, 1500);
    },
    onError: (error: any) => {
      console.error('❌ Error updating material type:', error);
      setSubmitError(error.message || 'Errore durante l\'aggiornamento della tipologia di materiale');
      setSubmitSuccess(false);
    },
  });

  // Effetto per popolamento form in modalità edit
  useEffect(() => {
    if (isEditMode && materialType) {
      console.log('📝 Populating form with material type data:', materialType);
      
      reset({
        code: materialType.code,
        name: materialType.name,
        description: materialType.description || '',
        unit: materialType.unit,
        cerCode: materialType.cerCode || '',
        reference: materialType.reference || '',
        color: materialType.color || PREDEFINED_COLORS[0].value,
        sortOrder: materialType.sortOrder || 0,
        parentId: materialType.parentId || '',
        isActive: materialType.isActive,
      });
    }
  }, [isEditMode, materialType, reset]);

  // Handler submit
  const onSubmit = async (data: FormData) => {
    console.log('📝 Submitting material type data:', data);
    
    setSubmitError(null);
    setSubmitSuccess(false);
    
    try {
      // Validazione aggiuntiva
      if (!data.code.trim()) {
        throw new Error('Codice è obbligatorio');
      }
      if (!data.name.trim()) {
        throw new Error('Nome è obbligatorio');
      }
      if (!data.unit.trim()) {
        throw new Error('Unità di misura è obbligatoria');
      }

      // Prepara i dati per l'invio
      const dataToSave = {
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        unit: data.unit.trim(),
        cerCode: data.cerCode?.trim() || undefined,
        reference: data.reference?.trim() || undefined,
        color: data.color || PREDEFINED_COLORS[0].value,
        sortOrder: Number(data.sortOrder) || 0,
        parentId: data.parentId || undefined,
        ...(isEditMode && { isActive: data.isActive }),
      };

      console.log('📤 Prepared data for submission:', dataToSave);

      if (isEditMode) {
        await updateMutation.mutateAsync(dataToSave as UpdateMaterialTypeData);
      } else {
        await createMutation.mutateAsync(dataToSave as CreateMaterialTypeData);
      }
    } catch (error) {
      console.error('❌ Submit failed:', error);
      if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Errore sconosciuto durante il salvataggio');
      }
    }
  };

  // Handler cancel
  const handleCancel = () => {
    navigate('/deliveries/material-types');
  };

  // Loading state
  if (isEditMode && (isLoadingMaterialType || isLoadingParentMaterialTypes)) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Caricamento tipologia materiale...</Typography>
        </Box>
      </Container>
    );
  }

  // Error state
  if (isEditMode && isErrorMaterialType) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Errore durante il caricamento della tipologia di materiale:
          <br />
          {materialTypeError instanceof Error ? materialTypeError.message : 'Errore sconosciuto'}
        </Alert>
        <Button onClick={handleCancel} sx={{ mt: 2 }}>
          Torna alla Lista
        </Button>
      </Container>
    );
  }

  // Success state
  if (submitSuccess) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="h6">
            ✅ {isEditMode ? 'Tipologia aggiornata' : 'Tipologia creata'} con successo!
          </Typography>
          <Typography variant="body2">
            Reindirizzamento alla lista in corso...
          </Typography>
        </Alert>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleCancel} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1">
          {isEditMode ? 'Modifica Tipologia Materiale' : 'Nuova Tipologia Materiale'}
        </Typography>
      </Box>

      {/* Alert per errori */}
      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={3}>
          {/* Informazioni Base */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Info />
                  Informazioni Base
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  {/* Codice */}
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="code"
                      control={control}
                      rules={{ 
                        required: 'Codice è obbligatorio',
                        pattern: {
                          value: /^[A-Z0-9_-]+$/,
                          message: 'Solo lettere maiuscole, numeri, trattini e underscore'
                        }
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Codice *"
                          placeholder="es. MONO, MULTI, PLASTICA"
                          error={!!errors.code}
                          helperText={errors.code?.message || 'Codice identificativo univoco'}
                          inputProps={{ 
                            style: { textTransform: 'uppercase' },
                            maxLength: 20
                          }}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
                            field.onChange(value);
                          }}
                        />
                      )}
                    />
                  </Grid>

                  {/* Nome */}
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="name"
                      control={control}
                      rules={{ 
                        required: 'Nome è obbligatorio',
                        minLength: {
                          value: 2,
                          message: 'Il nome deve essere di almeno 2 caratteri'
                        }
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Nome *"
                          placeholder="es. Monomateriale Plastica"
                          error={!!errors.name}
                          helperText={errors.name?.message || 'Nome descrittivo della tipologia'}
                          inputProps={{ maxLength: 100 }}
                        />
                      )}
                    />
                  </Grid>

                  {/* Descrizione */}
                  <Grid item xs={12}>
                    <Controller
                      name="description"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          multiline
                          rows={3}
                          label="Descrizione"
                          placeholder="Descrizione dettagliata della tipologia di materiale..."
                          helperText="Informazioni aggiuntive sulla tipologia (opzionale)"
                          inputProps={{ maxLength: 500 }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Configurazione Tecnica */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Configurazione Tecnica
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  {/* Unità di Misura */}
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth error={!!errors.unit}>
                      <InputLabel id="unit-label">Unità di Misura *</InputLabel>
                      <Controller
                        name="unit"
                        control={control}
                        rules={{ required: 'Unità di misura è obbligatoria' }}
                        render={({ field }) => (
                          <Select
                            {...field}
                            labelId="unit-label"
                            label="Unità di Misura *"
                          >
                            {PREDEFINED_UNITS.map((unit) => (
                              <MenuItem key={unit} value={unit}>
                                {unit}
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                      {errors.unit && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                          {errors.unit.message}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  {/* Codice CER */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Controller
                      name="cerCode"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Codice CER"
                          placeholder="es. 150102"
                          helperText="Codice Europeo Rifiuti (opzionale)"
                          inputProps={{ 
                            maxLength: 10,
                            pattern: '[0-9]*'
                          }}
                        />
                      )}
                    />
                  </Grid>

                  {/* Riferimento */}
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel id="reference-label">Riferimento</InputLabel>
                      <Controller
                        name="reference"
                        control={control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            labelId="reference-label"
                            label="Riferimento"
                            value={field.value || ''}
                          >
                            <MenuItem value="">
                              <em>Nessuno</em>
                            </MenuItem>
                            {PREDEFINED_REFERENCES.map((ref) => (
                              <MenuItem key={ref} value={ref}>
                                {ref}
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                    </FormControl>
                  </Grid>

                  {/* Ordine di Visualizzazione */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Controller
                      name="sortOrder"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Ordine"
                          type="number"
                          inputProps={{ min: 0, max: 999 }}
                          helperText="Ordine di visualizzazione"
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Aspetto e Gerarchia */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Palette />
                  Aspetto e Gerarchia
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  {/* Colore */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel id="color-label">Colore</InputLabel>
                      <Controller
                        name="color"
                        control={control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            labelId="color-label"
                            label="Colore"
                            renderValue={(value) => (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box
                                  sx={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: '50%',
                                    backgroundColor: value,
                                    border: '1px solid #ccc'
                                  }}
                                />
                                {PREDEFINED_COLORS.find(c => c.value === value)?.name || value}
                              </Box>
                            )}
                          >
                            {PREDEFINED_COLORS.map((color) => (
                              <MenuItem key={color.value} value={color.value}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box
                                    sx={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: '50%',
                                      backgroundColor: color.value,
                                      border: '1px solid #ccc'
                                    }}
                                  />
                                  {color.name}
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                    </FormControl>
                  </Grid>

                  {/* Preview Colore */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
                      <Typography variant="body2">Anteprima:</Typography>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          backgroundColor: selectedColor,
                          border: '2px solid #ccc',
                          boxShadow: 1
                        }}
                      />
                    </Box>
                  </Grid>

                  {/* Tipologia Padre */}
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel id="parent-material-type-label">Tipologia Padre (Categoria)</InputLabel>
                      <Controller
                        name="parentId"
                        control={control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            labelId="parent-material-type-label"
                            label="Tipologia Padre (Categoria)"
                            value={field.value || ''}
                            disabled={isLoadingParentMaterialTypes}
                          >
                            <MenuItem value="">
                              <em>Nessuna - Categoria Principale</em>
                            </MenuItem>
                            {parentMaterialTypes?.map((parent) => (
                              <MenuItem key={parent.id} value={parent.id}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box
                                    sx={{
                                      width: 12,
                                      height: 12,
                                      borderRadius: '50%',
                                      backgroundColor: parent.color || '#666',
                                    }}
                                  />
                                  {parent.name} ({parent.code})
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Stato - Solo in modalità modifica */}
          {isEditMode && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Stato
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={field.value}
                            onChange={field.onChange}
                            color="primary"
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body1">
                              Tipologia Attiva
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {field.value 
                                ? 'La tipologia è attiva e può essere utilizzata per i conferimenti'
                                : 'La tipologia è disattivata e non sarà disponibile per nuovi conferimenti'
                              }
                            </Typography>
                          </Box>
                        }
                      />
                    )}
                  />
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        {/* Buttons */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Cancel />}
            onClick={handleCancel}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            Annulla
          </Button>

          <Button
            type="submit"
            variant="contained"
            startIcon={<Save />}
            disabled={createMutation.isPending || updateMutation.isPending || !isValid}
            size="large"
          >
            {createMutation.isPending || updateMutation.isPending 
              ? (isEditMode ? 'Aggiornamento...' : 'Creazione...') 
              : (isEditMode ? 'Aggiorna Tipologia' : 'Crea Tipologia')
            }
          </Button>
        </Box>

        {/* Debug Info in Development */}
        {process.env.NODE_ENV === 'development' && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="caption" component="div">
              Debug Form State:<br/>
              Valid: {isValid.toString()}<br/>
              Edit Mode: {isEditMode.toString()}<br/>
              Material Type ID: {id || 'N/A'}<br/>
              Submit Error: {submitError || 'None'}<br/>
              Selected Color: {selectedColor}
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default MaterialTypeForm;