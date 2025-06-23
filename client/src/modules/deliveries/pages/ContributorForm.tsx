// client/src/modules/deliveries/pages/ContributorForm.tsx

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
  IconButton,
  FormGroup,
  Checkbox,
  Chip
} from '@mui/material';
import { ArrowBack, Save, Cancel, Business, LocationOn } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contributorsApi } from '../services/contributors.api';
import { materialTypesApi } from '../services/materialTypes.api';
import api from '../../../core/services/api';
import type { CreateContributorData, UpdateContributorData, MaterialType } from '../types/deliveries.types';

// CORREZIONE: FormData con authorizedMaterialTypes come array
interface FormData {
  name: string;
  vatNumber?: string;
  fiscalCode?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  province?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  basinId?: string;
  authorizedMaterialTypes: string[]; // Array di ID
  notes?: string;
  isActive?: boolean;
}

const ContributorForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: '',
      vatNumber: '',
      fiscalCode: '',
      address: '',
      city: '',
      zipCode: '',
      province: '',
      phone: '',
      email: '',
      contactPerson: '',
      basinId: '',
      authorizedMaterialTypes: [],
      notes: '',
      isActive: true,
    },
  });

  // CORREZIONE: Usa getById invece di getContributorById
  const { data: contributor, isLoading: isLoadingContributor, isError: isErrorContributor } = useQuery({
    queryKey: ['contributors', id],
    queryFn: () => contributorsApi.getById(id!),
    enabled: isEditMode,
  });

  const { data: basins, isLoading: isLoadingBasins } = useQuery({
    queryKey: ['basins'],
    queryFn: () => api.get('/basins').then(res => res.data),
  });

  // CORREZIONE: Usa getAll invece di getAllMaterialTypes
  const { data: materialTypes, isLoading: isLoadingMaterialTypes } = useQuery({
    queryKey: ['materialTypes'],
    queryFn: () => materialTypesApi.getAll(),
  });

  // CORREZIONE: Usa create invece di createContributor
  const createMutation = useMutation({
    mutationFn: (data: CreateContributorData) => contributorsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributors'] });
      navigate('/deliveries/contributors');
    },
    onError: (error) => {
      console.error('Error creating contributor:', error);
      alert('Errore durante la creazione del conferitore.');
    },
  });

  // CORREZIONE: Usa update invece di updateContributor
  const updateMutation = useMutation({
    mutationFn: (data: UpdateContributorData) => contributorsApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributors', id] });
      queryClient.invalidateQueries({ queryKey: ['contributors'] });
      navigate('/deliveries/contributors');
    },
    onError: (error) => {
      console.error('Error updating contributor:', error);
      alert('Errore durante l\'aggiornamento del conferitore.');
    },
  });

  useEffect(() => {
    if (isEditMode && contributor) {
      // CORREZIONE: Parse del JSON string authorizedMaterialTypes
      const authorizedTypes = JSON.parse(contributor.authorizedMaterialTypes || '[]');
      reset({
        ...contributor,
        isActive: contributor.isActive,
        authorizedMaterialTypes: authorizedTypes,
      });
    }
  }, [isEditMode, contributor, reset]);

  const onSubmit = (data: FormData) => {
    // CORREZIONE: Converti l'array in JSON string per il backend
    const dataToSave = {
      ...data,
      authorizedMaterialTypes: data.authorizedMaterialTypes || [],
    };

    if (isEditMode) {
      updateMutation.mutate(dataToSave as UpdateContributorData);
    } else {
      updateMutation.mutate(dataToSave as CreateContributorData);
    }
  };

  const selectedMaterialTypeIds = watch('authorizedMaterialTypes');

  if (isEditMode && (isLoadingContributor || isLoadingBasins || isLoadingMaterialTypes)) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (isEditMode && isErrorContributor) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">Errore durante il caricamento del conferitore.</Alert>
        <Button onClick={() => navigate('/deliveries/contributors')} sx={{ mt: 2 }}>
          Torna ai Conferitori
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/deliveries/contributors')} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1">
          {isEditMode ? 'Modifica Conferitore' : 'Nuovo Conferitore'}
        </Typography>
      </Box>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={3}>
          {/* Dati Anagrafici */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Business /> Dati Anagrafici
              </Typography>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Ragione Sociale è obbligatoria' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Ragione Sociale *"
                    margin="normal"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
              <Controller
                name="vatNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Partita IVA"
                    margin="normal"
                  />
                )}
              />
              <Controller
                name="fiscalCode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Codice Fiscale"
                    margin="normal"
                  />
                )}
              />
              <Controller
                name="contactPerson"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Referente"
                    margin="normal"
                  />
                )}
              />
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Telefono"
                    margin="normal"
                  />
                )}
              />
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Email"
                    type="email"
                    margin="normal"
                  />
                )}
              />
            </Paper>
          </Grid>

          {/* Indirizzo e Bacino */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn /> Indirizzo e Bacino
              </Typography>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Indirizzo"
                    margin="normal"
                  />
                )}
              />
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Città"
                    margin="normal"
                  />
                )}
              />
              <Controller
                name="zipCode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="CAP"
                    margin="normal"
                  />
                )}
              />
              <Controller
                name="province"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Provincia"
                    margin="normal"
                  />
                )}
              />
              <FormControl fullWidth margin="normal">
                <InputLabel id="basin-label">Bacino</InputLabel>
                <Controller
                  name="basinId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      labelId="basin-label"
                      label="Bacino"
                      value={field.value || ''}
                    >
                      <MenuItem value="">
                        <em>Nessuno</em>
                      </MenuItem>
                      {basins?.map((basin: any) => (
                        <MenuItem key={basin.id} value={basin.id}>
                          {basin.code} - {basin.description}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>

              {/* Stato Attivo (solo in modalità modifica) */}
              {isEditMode && (
                <Box sx={{ mt: 2 }}>
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
                        label="Conferitore Attivo"
                      />
                    )}
                  />
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Tipologie di Materiale Autorizzate */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Tipologie di Materiale Autorizzate
              </Typography>
              {isLoadingMaterialTypes ? (
                <CircularProgress size={20} />
              ) : (
                <FormControl component="fieldset" fullWidth margin="normal">
                  <FormGroup row>
                    {materialTypes?.map((materialType: MaterialType) => (
                      <FormControlLabel
                        key={materialType.id}
                        control={
                          <Controller
                            name="authorizedMaterialTypes"
                            control={control}
                            render={({ field }) => (
                              <Checkbox
                                checked={selectedMaterialTypeIds.includes(materialType.id)}
                                onChange={() => {
                                  if (selectedMaterialTypeIds.includes(materialType.id)) {
                                    field.onChange(selectedMaterialTypeIds.filter((id: string) => id !== materialType.id));
                                  } else {
                                    field.onChange([...selectedMaterialTypeIds, materialType.id]);
                                  }
                                }}
                              />
                            )}
                          />
                        }
                        label={
                          <Chip
                            label={materialType.name}
                            sx={{
                              bgcolor: materialType.color || 'default',
                              color: materialType.color ? 'white' : 'black',
                              fontWeight: 'bold',
                            }}
                          />
                        }
                      />
                    ))}
                  </FormGroup>
                </FormControl>
              )}
            </Paper>
          </Grid>

          {/* Note */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Note Aggiuntive
              </Typography>

              <Controller
                name="notes"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={3}
                    label="Note"
                    placeholder="Informazioni aggiuntive sul conferitore..."
                  />
                )}
              />
            </Paper>
          </Grid>
        </Grid>

        {/* Buttons */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            startIcon={<Cancel />}
            onClick={() => navigate('/deliveries/contributors')}
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
    </Container>
  );
};

export default ContributorForm;