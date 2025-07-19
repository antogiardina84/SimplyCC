// client/src/modules/deliveries/pages/MaterialTypeForm.tsx - VERSIONE CORRETTA

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper, // Re-aggiunto Paper
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
import { ArrowBack, Save, Cancel, Info } from '@mui/icons-material';
// Palette rimosso in quanto non utilizzato
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialTypesApi } from '../services/materialTypes.api';

// ===============================
// INTERFACES E TIPI
// ===============================

interface FormData {
  code: string;
  name: string;
  description?: string;
  unit: string;
  cerCode?: string;
  reference?: string;
  color?: string;
  sortOrder?: number;
  parentId?: string | null; // Modificato per accettare null
  isActive?: boolean;
}

interface CreateMaterialTypeData {
  code: string;
  name: string;
  description?: string;
  unit: string;
  cerCode?: string;
  reference?: string;
  color?: string;
  sortOrder?: number;
  parentId?: string | null; // Modificato per accettare null
  isActive?: boolean;
}

interface UpdateMaterialTypeData extends CreateMaterialTypeData {}

// Funzione helper per ottenere il messaggio di errore
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message);
  }
  return 'Errore sconosciuto';
};

// ===============================
// COMPONENTE PRINCIPALE
// ===============================

const MaterialTypeForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('#9E9E9E'); // Default color
  const [parentOptions, setParentOptions] = useState<any[]>([]); // Lista semplificata per i genitori

  // Utilizza i colori di Material UI come base per i colori predefiniti
  const defaultColors = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3',
    '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
    '#FFEB3B', '#FFC107', '#FF9800', '#FF5722', '#795548', '#9E9E9E',
    '#607D8B', '#000000'
  ];

  // Gestione del form con react-hook-form
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid, isDirty },
    watch,
  } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {
      code: '',
      name: '',
      unit: 'kg',
      sortOrder: 0,
      isActive: true,
      color: '#9E9E9E',
      parentId: null, // Default per parentId è null
    },
  });

  const watchColor = watch('color', selectedColor);

  // ===============================
  // QUERIES
  // ===============================

  // Query per ottenere i dettagli della tipologia se in modalità modifica
  const { data: materialType, isLoading: isMaterialTypeLoading, isError: isMaterialTypeError, error: materialTypeError } = useQuery({
    queryKey: ['materialType', id],
    queryFn: () => materialTypesApi.getById(id!),
    enabled: isEditMode, // Esegue la query solo se in modalità modifica
  });

  // Query per ottenere le opzioni dei genitori (solo categorie principali, non se stessi)
  const { isLoading: isParentsLoading, isError: isParentsError, error: parentsError } = useQuery({
    queryKey: ['materialTypes', { isParent: true }],
    queryFn: () => materialTypesApi.getAll({ isParent: true }),
    onSuccess: (data) => {
      // Filtra se stessi in modalità modifica
      const filteredParents = data.filter(p => p.id !== id);
      setParentOptions(filteredParents);
    }
  });

  // ===============================
  // MUTATIONS
  // ===============================

  // Mutation per la creazione
  const createMutation = useMutation({
    mutationFn: (data: CreateMaterialTypeData) => materialTypesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materialTypes'] });
      navigate('/deliveries/material-types');
    },
    onError: (error: any) => {
      setSubmitError(getErrorMessage(error)); // Usato helper function
    },
  });

  // Mutation per l'aggiornamento
  const updateMutation = useMutation({
    mutationFn: (data: UpdateMaterialTypeData) => materialTypesApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materialTypes'] });
      queryClient.invalidateQueries({ queryKey: ['materialType', id] });
      navigate('/deliveries/material-types');
    },
    onError: (error: any) => {
      setSubmitError(getErrorMessage(error)); // Usato helper function
    },
  });

  // ===============================
  // SIDE EFFECTS
  // ===============================

  // Popola il form in modalità modifica quando i dati sono caricati
  useEffect(() => {
    if (isEditMode && materialType) {
      reset({
        code: materialType.code,
        name: materialType.name,
        description: materialType.description,
        unit: materialType.unit,
        cerCode: materialType.cerCode,
        reference: materialType.reference,
        color: materialType.color || '#9E9E9E',
        sortOrder: materialType.sortOrder,
        // Assicura che parentId sia una stringa o null, non undefined
        parentId: materialType.parentId || null, 
        isActive: materialType.isActive,
      });
      setSelectedColor(materialType.color || '#9E9E9E');
    }
  }, [isEditMode, materialType, reset]);

  // Aggiorna lo stato del colore selezionato
  useEffect(() => {
    if (watchColor) {
      setSelectedColor(watchColor);
    }
  }, [watchColor]);

  // ===============================
  // HANDLERS
  // ===============================

  // Gestione invio form
  const onSubmit = (data: FormData) => {
    setSubmitError(null);

    // Corretto: Assicura che parentId sia null se è una stringa vuota (''), come richiesto dall'interfaccia.
    const dataToSubmit: CreateMaterialTypeData | UpdateMaterialTypeData = {
      ...data,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
      parentId: data.parentId === '' ? null : data.parentId,
    };

    if (isEditMode) {
      updateMutation.mutate(dataToSubmit as UpdateMaterialTypeData);
    } else {
      createMutation.mutate(dataToSubmit as CreateMaterialTypeData);
    }
  };

  const handleCancel = () => {
    navigate('/deliveries/material-types');
  };

  // ===============================
  // RENDER LOGICA
  // ===============================

  // Gestione caricamento e errori in modalità modifica
  if (isEditMode && (isMaterialTypeLoading || isParentsLoading)) {
    return (
      <Container maxWidth="md" sx={{ textAlign: 'center', mt: 5 }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Caricamento dati tipologia...
        </Typography>
      </Container>
    );
  }

  if (isEditMode && isMaterialTypeError) {
    return (
      <Container maxWidth="md" sx={{ mt: 5 }}>
        <Alert severity="error">
          <Typography variant="h6">Errore nel caricamento della tipologia</Typography>
          {/* Corretto: Utilizza getErrorMessage per un accesso sicuro */}
          <Typography>{getErrorMessage(materialTypeError)}</Typography>
          <Box sx={{ mt: 2 }}>
            <Button onClick={handleCancel} startIcon={<ArrowBack />} variant="outlined">
              Torna alla lista
            </Button>
          </Box>
        </Alert>
      </Container>
    );
  }

  if (isParentsError) {
    return (
      <Container maxWidth="md" sx={{ mt: 5 }}>
        <Alert severity="warning">
          <Typography variant="h6">Attenzione: Errore nel caricamento delle categorie genitore</Typography>
          {/* Corretto: Utilizza getErrorMessage per un accesso sicuro */}
          <Typography>Non sarai in grado di selezionare un genitore per questa tipologia. {getErrorMessage(parentsError)}</Typography>
        </Alert>
      </Container>
    );
  }

  // Visualizza un messaggio se non è stato trovato un ID in modalità modifica
  if (isEditMode && !materialType) {
    return (
      <Container maxWidth="md" sx={{ mt: 5 }}>
        <Alert severity="warning">
          <Typography variant="h6">Tipologia Materiale non trovata</Typography>
          <Typography>Impossibile caricare i dati per l'ID specificato.</Typography>
          <Box sx={{ mt: 2 }}>
            <Button onClick={handleCancel} startIcon={<ArrowBack />} variant="outlined">
              Torna alla lista
            </Button>
          </Box>
        </Alert>
      </Container>
    );
  }

  // ===============================
  // MAIN RENDER
  // ===============================

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton onClick={handleCancel} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1">
          {isEditMode ? 'Aggiorna Tipologia Materiale' : 'Crea Nuova Tipologia Materiale'}
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Grid container spacing={3}>

                {/* Sezione Base */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Dettagli Base</Typography>
                  <Divider sx={{ mb: 3 }} />
                </Grid>

                {/* Nome e Codice */}
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="name"
                    control={control}
                    rules={{ required: 'Il nome è obbligatorio' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Nome Tipologia"
                        fullWidth
                        required
                        error={!!errors.name}
                        helperText={errors.name?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="code"
                    control={control}
                    rules={{
                      required: 'Il codice è obbligatorio',
                      pattern: {
                        value: /^[A-Z0-9_-]+$/,
                        message: 'Il codice può contenere solo lettere maiuscole, numeri, trattini e underscore.',
                      },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Codice Interno"
                        fullWidth
                        required
                        error={!!errors.code}
                        helperText={errors.code?.message}
                      />
                    )}
                  />
                </Grid>

                {/* Descrizione e Unità */}
                <Grid item xs={12} sm={9}>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Descrizione (opzionale)"
                        fullWidth
                        multiline
                        rows={3}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Controller
                    name="unit"
                    control={control}
                    rules={{ required: 'L\'unità è obbligatoria' }}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.unit} required>
                        <InputLabel>Unità di Misura</InputLabel>
                        <Select {...field} label="Unità di Misura">
                          <MenuItem value="kg">Kg</MenuItem>
                          <MenuItem value="t">Tonnellate</MenuItem>
                          <MenuItem value="m³">m³</MenuItem>
                          <MenuItem value="pezzi">Pezzi</MenuItem>
                          <MenuItem value="litri">Litri</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>

                {/* Sezione Codici e Riferimenti */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Codici e Classificazioni</Typography>
                  <Divider sx={{ mb: 3 }} />
                </Grid>

                {/* Codice CER e Riferimento Esterno */}
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="cerCode"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Codice CER (opzionale)"
                        fullWidth
                        placeholder="Es. 15 01 01"
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="reference"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Riferimento Esterno (opzionale)"
                        fullWidth
                      />
                    )}
                  />
                </Grid>

                {/* Sezione Gerarchia e Ordinamento */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Gerarchia e Proprietà</Typography>
                  <Divider sx={{ mb: 3 }} />
                </Grid>

                {/* Genitore e Ordine */}
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="parentId"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Categoria Genitore (opzionale)</InputLabel>
                        <Select
                          {...field}
                          label="Categoria Genitore (opzionale)"
                          disabled={isParentsLoading}
                          value={field.value || ''}
                        >
                          <MenuItem value="">
                            <em>Nessun Genitore (Tipologia Principale)</em>
                          </MenuItem>
                          {parentOptions.map((option) => (
                            <MenuItem key={option.id} value={option.id}>
                              {option.name} ({option.code})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                  {isParentsLoading && <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>Caricamento genitori...</Typography>}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="sortOrder"
                    control={control}
                    rules={{
                      min: { value: 0, message: 'L\'ordine deve essere 0 o superiore' },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Ordine di Visualizzazione"
                        type="number"
                        fullWidth
                        error={!!errors.sortOrder}
                        helperText={errors.sortOrder?.message}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        inputProps={{
                          min: 0,
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Colore e Stato */}
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Controller
                      name="color"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Colore"
                          type="color"
                          sx={{ width: 100 }}
                          InputLabelProps={{
                            shrink: true,
                          }}
                        />
                      )}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Anteprima Colore:
                      </Typography>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          backgroundColor: watchColor || selectedColor,
                          borderRadius: '50%',
                          border: '1px solid #ccc',
                          boxShadow: 2,
                        }}
                      />
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Utilizza il selettore colori o inserisci un codice esadecimale (es. #FF5722).
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            {...field}
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                        }
                        label="Tipologia Attiva"
                        sx={{ mt: 1 }}
                      />
                    )}
                  />
                </Grid>

              </Grid>

              {/* Messaggio di errore invio */}
              {submitError && (
                <Alert severity="error" sx={{ mt: 3 }}>
                  {submitError}
                </Alert>
              )}

              {/* Azioni del form */}
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<Cancel />}
                  onClick={handleCancel}
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                >
                  Annulla
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Save />}
                  disabled={createMutation.isLoading || updateMutation.isLoading || !isValid}
                  size="large"
                >
                  {createMutation.isLoading || updateMutation.isLoading
                    ? (isEditMode ? 'Aggiornamento...' : 'Creazione...')
                    : (isEditMode ? 'Aggiorna Tipologia' : 'Crea Tipologia')
                  }
                </Button>
              </Box>

              {/* Debug Info in Development */}
              {import.meta.env.DEV && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="caption" component="div">
                    Debug Form State:<br/>
                    Valid: {isValid.toString()}<br/>
                    Dirty: {isDirty.toString()}<br/>
                    Edit Mode: {isEditMode.toString()}<br/>
                    Material Type ID: {id || 'N/A'}<br/>
                    Submit Error: {submitError || 'None'}<br/>
                    Selected Color: {selectedColor}<br/>
                    Mutations Loading: {createMutation.isLoading || updateMutation.isLoading}
                  </Typography>
                </Box>
              )}

            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Info fontSize="small" sx={{ mr: 1 }} />
                Informazioni Utili
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary" paragraph>
                Le tipologie di materiali permettono di classificare i rifiuti e i materiali recuperabili. Possono essere organizzate in una struttura gerarchica (genitore/figlio).
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Codice CER:</strong> Utilizzato per la classificazione standard dei rifiuti (Catalogo Europeo dei Rifiuti).
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                <strong>Ordine di Visualizzazione:</strong> Un numero basso (&lt; 100) garantisce che la tipologia appaia in cima alle liste ordinate per sortOrder.
              </Typography>
            </CardContent>
          </Card>

          <Card elevation={2} sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Colori Suggeriti
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={1}>
                {defaultColors.map((color, index) => (
                  <Grid item key={index}>
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        backgroundColor: color,
                        borderRadius: 1,
                        cursor: 'pointer',
                        border: selectedColor === color ? '2px solid #3f51b5' : '1px solid #ccc',
                        transition: 'transform 0.1s',
                        '&:hover': {
                          transform: 'scale(1.1)',
                        },
                      }}
                      onClick={() => {
                        setSelectedColor(color);
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MaterialTypeForm;