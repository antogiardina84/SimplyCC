// client/src/modules/deliveries/pages/MaterialTypeForm.tsx

import React, { useEffect } from 'react';
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
  IconButton
} from '@mui/material';
import { ArrowBack, Save, Cancel, Palette } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialTypesApi } from '../services/materialTypes.api';
import type { CreateMaterialTypeData, UpdateMaterialTypeData } from '../types/deliveries.types';

interface FormData extends CreateMaterialTypeData {
  isActive?: boolean;
}

const PREDEFINED_COLORS = [
  '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', '#00BCD4',
  '#FFEB3B', '#795548', '#607D8B', '#E91E63', '#3F51B5', '#009688',
  '#8BC34A', '#CDDC39', '#FFC107', '#FF5722', '#795548', '#9E9E9E',
  '#673AB7', '#4DB6AC', '#FFD54F', '#D4E157', '#EF9A9A', '#90CAF9'
];

const MaterialTypeForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      code: '',
      name: '',
      description: '',
      unit: '',
      cerCode: '',
      reference: '',
      color: PREDEFINED_COLORS[0],
      sortOrder: 0,
      parentId: '',
      isActive: true,
    },
  });

  // CORREZIONE: Usa getById invece di getMaterialTypeById
  const { data: materialType, isLoading: isLoadingMaterialType, isError: isErrorMaterialType } = useQuery({
    queryKey: ['materialTypes', id],
    queryFn: () => materialTypesApi.getById(id!),
    enabled: isEditMode,
  });

  // CORREZIONE: Usa getAll invece di getAllMaterialTypes
  const { data: parentMaterialTypes, isLoading: isLoadingParentMaterialTypes } = useQuery({
    queryKey: ['materialTypes', 'parents'],
    queryFn: () => materialTypesApi.getAll({ isParent: true }),
  });

  // CORREZIONE: Usa create invece di createMaterialType
  const createMutation = useMutation({
    mutationFn: (data: CreateMaterialTypeData) => materialTypesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materialTypes'] });
      navigate('/deliveries/material-types'); // CORREZIONE: path corretto
    },
    onError: (error) => {
      console.error('Error creating material type:', error);
      alert('Errore durante la creazione della tipologia di materiale.');
    },
  });

  // CORREZIONE: Usa update invece di updateMaterialType
  const updateMutation = useMutation({
    mutationFn: (data: UpdateMaterialTypeData) => materialTypesApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materialTypes', id] });
      queryClient.invalidateQueries({ queryKey: ['materialTypes'] });
      navigate('/deliveries/material-types'); // CORREZIONE: path corretto
    },
    onError: (error) => {
      console.error('Error updating material type:', error);
      alert('Errore durante l\'aggiornamento della tipologia di materiale.');
    },
  });

  useEffect(() => {
    if (isEditMode && materialType) {
      reset({
        ...materialType,
        isActive: materialType.isActive,
        parentId: materialType.parentId || '',
      });
    }
  }, [isEditMode, materialType, reset]);

  const onSubmit = (data: FormData) => {
    const dataToSave = {
      ...data,
      parentId: data.parentId || undefined,
    };

    if (isEditMode) {
      updateMutation.mutate(dataToSave as UpdateMaterialTypeData);
    } else {
      createMutation.mutate(dataToSave as CreateMaterialTypeData);
    }
  };

  if (isEditMode && (isLoadingMaterialType || isLoadingParentMaterialTypes)) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (isEditMode && isErrorMaterialType) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">Errore durante il caricamento della tipologia di materiale.</Alert>
        <Button onClick={() => navigate('/deliveries/material-types')} sx={{ mt: 2 }}>
          Torna a Tipologie Materiale
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/deliveries/material-types')} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1">
          {isEditMode ? 'Modifica Tipologia Materiale' : 'Nuova Tipologia Materiale'}
        </Typography>
      </Box>

      <Paper sx={{ p: 4, mt: 3 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={3}>
            {/* Codice */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="code"
                control={control}
                rules={{ required: 'Codice è obbligatorio' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Codice *"
                    error={!!errors.code}
                    helperText={errors.code?.message}
                  />
                )}
              />
            </Grid>

            {/* Nome */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Nome è obbligatorio' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nome *"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Grid>

            {/* Unità di Misura */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="unit"
                control={control}
                rules={{ required: 'Unità di Misura è obbligatoria' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Unità di Misura *"
                    error={!!errors.unit}
                    helperText={errors.unit?.message}
                  />
                )}
              />
            </Grid>

            {/* Codice CER */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="cerCode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Codice CER"
                  />
                )}
              />
            </Grid>

            {/* Riferimento */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="reference"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Riferimento (COREPLA, CORIPET, etc.)"
                    placeholder="es. COREPLA"
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
                  />
                )}
              />
            </Grid>

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
                    >
                      {PREDEFINED_COLORS.map((color) => (
                        <MenuItem key={color} value={color}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                backgroundColor: color,
                                border: '1px solid #ccc'
                              }}
                            />
                            {color}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>

            {/* Ordine di Smistamento */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="sortOrder"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Ordine di Visualizzazione"
                    type="number"
                    inputProps={{ min: 0 }}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                  />
                )}
              />
            </Grid>

            {/* Tipologia Padre */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="parent-material-type-label">Tipologia Padre</InputLabel>
                <Controller
                  name="parentId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      labelId="parent-material-type-label"
                      label="Tipologia Padre"
                      value={field.value || ''}
                    >
                      <MenuItem value="">
                        <em>Nessuna - Categoria Principale</em>
                      </MenuItem>
                      {parentMaterialTypes?.map((parent: any) => (
                        <MenuItem key={parent.id} value={parent.id}>
                          {parent.name} ({parent.code})
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>

            {/* Stato - Solo in modalità modifica */}
            {isEditMode && (
              <Grid item xs={12}>
                <Controller
                  name="isActive"
                  control={control}
                  defaultValue={true}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      }
                      label="Tipologia Attiva"
                    />
                  )}
                />
              </Grid>
            )}
          </Grid>

          {/* Buttons */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              onClick={() => navigate('/deliveries/material-types')}
            >
              Annulla
            </Button>

            <Button
              type="submit"
              variant="contained"
              startIcon={<Save />}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? 'Salvataggio...' : 'Salva'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default MaterialTypeForm;