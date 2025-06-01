// client/src/modules/clients/pages/ClientForm.tsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  Chip,
  InputAdornment,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import {
  Save,
  Cancel,
  Business,
  Email,
  Phone,
  LocationOn,
  CreditCard,
  PersonAdd,
  Edit,
  CheckCircle,
  Error,
  InfoOutlined,
  ArrowBack,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import * as clientService from '../services/clientService';
import type { CreateClientData, UpdateClientData } from '../services/clientService';

interface FormData {
  name: string;
  vatNumber: string;
  address: string;
  city: string;
  zipCode: string;
  province: string;
  phone: string;
  email: string;
  pec: string;
  contractId: string;
}

const ClientForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vatNumberStatus, setVatNumberStatus] = useState<'checking' | 'available' | 'unavailable' | null>(null);
  const [vatNumberCheckTimeout, setVatNumberCheckTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const { 
    control, 
    handleSubmit, 
    reset, 
    watch, 
    formState: { errors, isValid, isDirty } 
  } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      vatNumber: '',
      address: '',
      city: '',
      zipCode: '',
      province: '',
      phone: '',
      email: '',
      pec: '',
      contractId: '',
    }
  });

  const isEditMode = !!id;
  const watchedVatNumber = watch('vatNumber');

  // Controllo disponibilità P.IVA in tempo reale
  useEffect(() => {
    if (!watchedVatNumber || watchedVatNumber.length < 11) {
      setVatNumberStatus(null);
      return;
    }

    // Cancella il timeout precedente
    if (vatNumberCheckTimeout) {
      clearTimeout(vatNumberCheckTimeout);
    }

    // Imposta un nuovo timeout per il controllo
    const timeout = setTimeout(async () => {
      try {
        setVatNumberStatus('checking');
        const isAvailable = await clientService.checkVatNumberAvailability(
          watchedVatNumber, 
          isEditMode ? id : undefined
        );
        setVatNumberStatus(isAvailable ? 'available' : 'unavailable');
      } catch (error) {
        console.error('Error checking VAT number:', error);
        setVatNumberStatus(null);
      }
    }, 800); // Delay di 800ms per evitare troppe richieste

    setVatNumberCheckTimeout(timeout);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [watchedVatNumber, id, isEditMode]);

  // Carica i dati del cliente se in modalità modifica
  useEffect(() => {
    if (isEditMode) {
      const fetchClient = async () => {
        try {
          setInitialLoading(true);
          setError(null);
          const clientData = await clientService.getClientById(id);
          
          reset({
            name: clientData.name,
            vatNumber: clientData.vatNumber,
            address: clientData.address || '',
            city: clientData.city || '',
            zipCode: clientData.zipCode || '',
            province: clientData.province || '',
            phone: clientData.phone || '',
            email: clientData.email || '',
            pec: clientData.pec || '',
            contractId: clientData.contractId || '',
          });
        } catch (error: any) {
          console.error('Error fetching client:', error);
          setError(error.response?.data?.message || 'Errore nel caricamento dei dati del cliente');
        } finally {
          setInitialLoading(false);
        }
      };

      fetchClient();
    }
  }, [id, isEditMode, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError(null);

      if (isEditMode) {
        const updateData: UpdateClientData = {
          name: data.name.trim(),
          vatNumber: data.vatNumber.trim(),
          address: data.address.trim() || undefined,
          city: data.city.trim() || undefined,
          zipCode: data.zipCode.trim() || undefined,
          province: data.province.trim() || undefined,
          phone: data.phone.trim() || undefined,
          email: data.email.trim() || undefined,
          pec: data.pec.trim() || undefined,
          contractId: data.contractId.trim() || undefined,
        };

        await clientService.updateClient(id, updateData);
      } else {
        const createData: CreateClientData = {
          name: data.name.trim(),
          vatNumber: data.vatNumber.trim(),
          address: data.address.trim() || undefined,
          city: data.city.trim() || undefined,
          zipCode: data.zipCode.trim() || undefined,
          province: data.province.trim() || undefined,
          phone: data.phone.trim() || undefined,
          email: data.email.trim() || undefined,
          pec: data.pec.trim() || undefined,
          contractId: data.contractId.trim() || undefined,
        };

        await clientService.createClient(createData);
      }

      navigate('/clients');
    } catch (error: any) {
      console.error('Error saving client:', error);
      setError(error.response?.data?.message || `Errore durante il ${isEditMode ? 'salvataggio' : 'creazione'} del cliente`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm('Ci sono modifiche non salvate. Sei sicuro di voler uscire?')) {
        navigate('/clients');
      }
    } else {
      navigate('/clients');
    }
  };

  const getVatNumberIcon = () => {
    switch (vatNumberStatus) {
      case 'checking':
        return <CircularProgress size={20} />;
      case 'available':
        return <CheckCircle color="success" />;
      case 'unavailable':
        return <Error color="error" />;
      default:
        return null;
    }
  };

  const getVatNumberHelperText = () => {
    switch (vatNumberStatus) {
      case 'checking':
        return 'Verifica disponibilità...';
      case 'available':
        return 'Partita IVA disponibile';
      case 'unavailable':
        return 'Partita IVA già registrata';
      default:
        return errors.vatNumber?.message as string || '';
    }
  };

  if (initialLoading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={50} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton 
            onClick={() => navigate('/clients')} 
            sx={{ 
              mr: 2,
              backgroundColor: 'grey.100',
              '&:hover': { backgroundColor: 'grey.200' }
            }}
          >
            <ArrowBack />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {isEditMode ? <Edit color="primary" /> : <PersonAdd color="primary" />}
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              {isEditMode ? 'Modifica Cliente' : 'Nuovo Cliente'}
            </Typography>
          </Box>
        </Box>
        
        <Typography variant="body1" color="text.secondary">
          {isEditMode 
            ? 'Modifica i dati del cliente esistente' 
            : 'Compila i campi per aggiungere un nuovo cliente al sistema'
          }
        </Typography>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setError(null)}
            >
              ×
            </IconButton>
          }
        >
          {error}
        </Alert>
      )}

      {/* Form */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          {/* Informazioni Principali */}
          <Card sx={{ boxShadow: 'none', borderRadius: 0 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Business sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Informazioni Principali
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Controller
                    name="name"
                    control={control}
                    rules={{ 
                      required: 'Nome/Ragione Sociale è obbligatorio',
                      minLength: {
                        value: 2,
                        message: 'Il nome deve essere di almeno 2 caratteri'
                      }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Nome/Ragione Sociale"
                        placeholder="Inserisci il nome o la ragione sociale"
                        error={!!errors.name}
                        helperText={errors.name?.message as string}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="vatNumber"
                    control={control}
                    rules={{ 
                      required: 'Partita IVA è obbligatoria',
                      pattern: {
                        value: /^[0-9]{11}$/,
                        message: 'La Partita IVA deve essere di 11 cifre'
                      }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Partita IVA"
                        placeholder="Inserisci la partita IVA (11 cifre)"
                        error={!!errors.vatNumber || vatNumberStatus === 'unavailable'}
                        helperText={getVatNumberHelperText()}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              {getVatNumberIcon()}
                            </InputAdornment>
                          ),
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="contractId"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="ID Contratto"
                        placeholder="Inserisci l'ID del contratto (opzionale)"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <CreditCard color="action" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Divider />

          {/* Indirizzo */}
          <Card sx={{ boxShadow: 'none', borderRadius: 0 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <LocationOn sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Indirizzo
                </Typography>
                <Chip 
                  label="Opzionale" 
                  size="small" 
                  sx={{ ml: 2, backgroundColor: 'grey.100' }} 
                />
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Controller
                    name="address"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Indirizzo"
                        placeholder="Via, numero civico"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Controller
                    name="city"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Città"
                        placeholder="Inserisci la città"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <Controller
                    name="province"
                    control={control}
                    rules={{
                      pattern: {
                        value: /^[A-Z]{2}$/,
                        message: 'Inserisci 2 lettere maiuscole (es. MI)'
                      }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Provincia"
                        placeholder="Es. MI"
                        inputProps={{ maxLength: 2, style: { textTransform: 'uppercase' } }}
                        error={!!errors.province}
                        helperText={errors.province?.message as string}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <Controller
                    name="zipCode"
                    control={control}
                    rules={{
                      pattern: {
                        value: /^[0-9]{5}$/,
                        message: 'Il CAP deve essere di 5 cifre'
                      }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="CAP"
                        placeholder="Es. 20100"
                        inputProps={{ maxLength: 5 }}
                        error={!!errors.zipCode}
                        helperText={errors.zipCode?.message as string}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Divider />

          {/* Contatti */}
          <Card sx={{ boxShadow: 'none', borderRadius: 0 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Phone sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Informazioni di Contatto
                </Typography>
                <Chip 
                  label="Opzionale" 
                  size="small" 
                  sx={{ ml: 2, backgroundColor: 'grey.100' }} 
                />
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="phone"
                    control={control}
                    rules={{
                      pattern: {
                        value: /^[\+]?[0-9\s\-\(\)]{8,}$/,
                        message: 'Formato telefono non valido'
                      }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Telefono"
                        placeholder="Es. +39 02 1234567"
                        error={!!errors.phone}
                        helperText={errors.phone?.message as string}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Phone color="action" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="email"
                    control={control}
                    rules={{
                      pattern: {
                        value: /^\S+@\S+\.\S+$/,
                        message: 'Email non valida'
                      }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Email"
                        placeholder="nome@dominio.it"
                        type="email"
                        error={!!errors.email}
                        helperText={errors.email?.message as string}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email color="action" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Controller
                    name="pec"
                    control={control}
                    rules={{
                      pattern: {
                        value: /^\S+@\S+\.\S+$/,
                        message: 'PEC non valida'
                      }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="PEC"
                        placeholder="pec@dominio.it"
                        type="email"
                        error={!!errors.pec}
                        helperText={errors.pec?.message as string}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email color="action" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <Tooltip title="Posta Elettronica Certificata">
                                <InfoOutlined color="action" />
                              </Tooltip>
                            </InputAdornment>
                          ),
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Azioni */}
          <Box sx={{ p: 4, backgroundColor: 'grey.50', borderTop: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={handleCancel}
                sx={{ 
                  minWidth: 140,
                  height: 48,
                  borderRadius: 3,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                }}
              >
                Annulla
              </Button>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {isDirty && (
                  <Chip 
                    label="Modifiche non salvate" 
                    color="warning" 
                    size="small"
                    sx={{ animation: 'pulse 2s infinite' }}
                  />
                )}
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                  disabled={loading || (!isValid && !isEditMode) || vatNumberStatus === 'unavailable'}
                  sx={{ 
                    minWidth: 160,
                    height: 48,
                    borderRadius: 3,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                    '&:hover': {
                      boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
                    }
                  }}
                >
                  {loading 
                    ? (isEditMode ? 'Salvataggio...' : 'Creazione...') 
                    : (isEditMode ? 'Salva Modifiche' : 'Crea Cliente')
                  }
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default ClientForm;