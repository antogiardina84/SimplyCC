// client/src/modules/deliveries/pages/ContributorForm.tsx - VERSIONE COMPLETAMENTE RISCRITTA

import React, { useEffect, useMemo } from 'react';
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
import type { QueryKey } from '@tanstack/react-query'; // Importa QueryKey come type-only
import { contributorsApi } from '../services/contributors.api';
import { materialTypesApi } from '../services/materialTypes.api';
import api from '../../../core/services/api';

// Interfacce TypeScript
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
  authorizedMaterialTypes: string[]; // Per il form, lavoriamo con un array di stringhe
  notes?: string;
  isActive?: boolean;
}

interface Basin {
  id: string;
  code: string;
  description?: string;
  flowType: string;
  clientId: string;
}

interface MaterialType {
  id: string;
  code: string;
  name: string;
  color?: string;
  isActive: boolean;
}

// Interfaccia per i dati del conferitore come restituiti dall'API GET
interface ContributorGetResponse {
  id?: string; // Per l'aggiornamento, l'ID potrebbe essere presente
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
  authorizedMaterialTypes: string; // Dal backend arriva come stringa (JSON string)
  basinId?: string;
  notes?: string;
  isActive?: boolean;
}

// Interfaccia per i dati del conferitore come attesi dall'API POST/PUT
interface ContributorPostPutRequest {
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
  authorizedMaterialTypes: string[]; // Per l'invio all'API, è un array di stringhe
  basinId?: string;
  notes?: string;
  isActive?: boolean;
}

// Interfacce per le mutazioni che estendono ContributorPostPutRequest
interface CreateContributorData extends ContributorPostPutRequest {}
interface UpdateContributorData extends Partial<ContributorPostPutRequest> {}


const ContributorForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);

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

  // Query per il contributor (solo in modalità edit) - Usa ContributorGetResponse
  const contributorQuery = useQuery<ContributorGetResponse, Error>(
    ['contributors', id], // queryKey come primo argomento
    () => contributorsApi.getById(id!), // queryFn come secondo argomento
    { enabled: isEditMode } // opzioni come terzo argomento
  );

  // Query per i bacini
  const basinsQuery = useQuery<Basin[], Error>(
    ['basins'], // queryKey
    async () => {
      console.log('🔍 Fetching basins...');
      try {
        const response = await api.get<Basin[]>('/basins'); 
        console.log('✅ Basins loaded:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Error loading basins:', error);
        throw error;
      }
    },
    { retry: 3, retryDelay: 1000 } // opzioni
  );

  // Query per i material types
  const materialTypesQuery = useQuery<MaterialType[], Error>(
    ['materialTypes'], // queryKey
    () => materialTypesApi.getAll() // queryFn
  );

  // Mutation per creazione - Usa CreateContributorData (che è ContributorPostPutRequest)
  const createMutation = useMutation({
    mutationFn: (data: CreateContributorData) => contributorsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributors'] as QueryKey }); 
      navigate('/deliveries/contributors');
    },
    onError: (error) => {
      console.error('Error creating contributor:', error);
      alert('Errore durante la creazione del conferitore.');
    },
  });

  // Mutation per aggiornamento - Usa UpdateContributorData (che è Partial<ContributorPostPutRequest>)
  const updateMutation = useMutation({
    mutationFn: (data: UpdateContributorData) => contributorsApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributors', id] as QueryKey });
      queryClient.invalidateQueries({ queryKey: ['contributors'] as QueryKey });
      navigate('/deliveries/contributors');
    },
    onError: (error) => {
      console.error('Error updating contributor:', error);
      alert('Errore durante l\'aggiornamento del conferitore.');
    },
  });

  // Dati processati in modo sicuro
  const basins: Basin[] = useMemo(() => {
    if (!basinsQuery.data || !Array.isArray(basinsQuery.data)) return [];
    return basinsQuery.data;
  }, [basinsQuery.data]);

  const materialTypes: MaterialType[] = useMemo(() => {
    if (!materialTypesQuery.data || !Array.isArray(materialTypesQuery.data)) return [];
    return materialTypesQuery.data;
  }, [materialTypesQuery.data]);

  // Effetto per popolamento form in modalità edit
  useEffect(() => {
    if (isEditMode && contributorQuery.data) {
      const contributor = contributorQuery.data; // Questo è di tipo ContributorGetResponse

      // authorizedMaterialTypes arriva come stringa, va parsato per il form (che vuole string[])
      let authorizedTypes: string[] = [];
      if (typeof contributor.authorizedMaterialTypes === 'string') {
        try {
          const parsed = JSON.parse(contributor.authorizedMaterialTypes || '[]');
          if (Array.isArray(parsed)) {
            authorizedTypes = parsed;
          } else {
            console.warn('authorizedMaterialTypes from API was a string but not an array after parsing:', parsed);
            authorizedTypes = [];
          }
        } catch (e) {
          console.error('Error parsing authorizedMaterialTypes:', e);
          authorizedTypes = [];
        }
      } else {
        // Fallback per sicurezza, anche se il tipo ContributorGetResponse lo definisce come string
        console.warn('authorizedMaterialTypes was not a string from API GET:', contributor.authorizedMaterialTypes);
        authorizedTypes = [];
      }

      // Prepara i dati per il form (dove authorizedMaterialTypes è un array)
      const formDataToReset: FormData = {
        name: contributor.name,
        vatNumber: contributor.vatNumber,
        fiscalCode: contributor.fiscalCode,
        address: contributor.address,
        city: contributor.city,
        zipCode: contributor.zipCode,
        province: contributor.province,
        phone: contributor.phone,
        email: contributor.email,
        contactPerson: contributor.contactPerson,
        basinId: contributor.basinId,
        authorizedMaterialTypes: authorizedTypes, // Qui è un array
        notes: contributor.notes,
        isActive: contributor.isActive,
      };
      reset(formDataToReset);
    }
  }, [isEditMode, contributorQuery.data, reset]);

  // Handler submit
  const onSubmit = (data: FormData) => {
    console.log('📝 Submitting contributor data:', data);
    
    // I dati 'data' dal form sono già nel formato 'ContributorPostPutRequest'
    // (authorizedMaterialTypes è string[]), quindi possono essere passati direttamente
    // alle mutazioni senza ulteriore stringificazione.
    const dataToSave: ContributorPostPutRequest = {
      ...data,
      authorizedMaterialTypes: data.authorizedMaterialTypes || [], // Assicurati sia sempre un array
    };

    if (isEditMode) {
      updateMutation.mutate(dataToSave);
    } else {
      createMutation.mutate(dataToSave);
    }
  };

  const selectedMaterialTypeIds = watch('authorizedMaterialTypes');

  // Stati di loading
  const isLoading = isEditMode && (
    contributorQuery.isLoading || 
    basinsQuery.isLoading || 
    materialTypesQuery.isLoading
  );

  const hasError = isEditMode && contributorQuery.isError;

  // Debug
  console.log('🔍 Debug data:', {
    basins: basins.length,
    materialTypes: materialTypes.length,
    isLoadingBasins: basinsQuery.isLoading,
    basinsError: basinsQuery.error,
    contributor: contributorQuery.data
  });

  // Render condizionale per loading
  if (isLoading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  // Render condizionale per errore
  if (hasError) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">Errore durante il caricamento del conferitore.</Alert>
        <Button 
          onClick={() => navigate('/deliveries/contributors')} 
          sx={{ mt: 2 }} 
        >
          Torna ai Conferitori
        </Button>
      </Container>
    );
  }

  // Main render
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

      {/* Alert per errori bacini */}
      {basinsQuery.error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          ⚠️ Impossibile caricare i bacini. Verifica che il backend sia attivo.
          <br />
          Errore: {basinsQuery.error instanceof Error ? basinsQuery.error.message : 'Errore sconosciuto'}
        </Alert>
      )}

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
              
              {/* Select Bacini */}
              <FormControl fullWidth margin="normal" disabled={basinsQuery.isLoading}>
                <InputLabel id="basin-label">
                  {basinsQuery.isLoading ? 'Caricamento bacini...' : 'Bacino'}
                </InputLabel>
                <Controller
                  name="basinId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      labelId="basin-label"
                      label={basinsQuery.isLoading ? 'Caricamento bacini...' : 'Bacino'}
                      value={field.value || ''}
                    >
                      <MenuItem value="">
                        <em>Nessuno</em>
                      </MenuItem>
                      {basins.map((basin) => (
                        <MenuItem key={basin.id} value={basin.id}>
                          {basin.code} - {basin.description || 'N/A'}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>

              {/* Debug info */}
              <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Debug: Bacini caricati: {basins.length}
                  {basinsQuery.isLoading && ' (Caricamento...)'}
                  {basinsQuery.error && ' (Errore!)'}
                </Typography>
              </Box>

              {/* Switch Attivo */}
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

          {/* Tipologie Materiali */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Tipologie di Materiale Autorizzate
              </Typography>
              
              {materialTypesQuery.isLoading ? (
                <CircularProgress size={20} />
              ) : (
                <FormControl component="fieldset" fullWidth margin="normal">
                  <FormGroup row>
                    {materialTypes.map((materialType) => (
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
                                  // Clona l'array per evitare mutazioni dirette dello stato
                                  const current = field.value ? [...field.value] : []; 
                                  if (current.includes(materialType.id)) {
                                    field.onChange(current.filter((id) => id !== materialType.id));
                                  } else {
                                    field.onChange([...current, materialType.id]);
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