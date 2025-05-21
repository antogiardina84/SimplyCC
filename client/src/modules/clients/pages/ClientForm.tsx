// client/src/modules/clients/pages/ClientForm.tsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, TextField, Button, Paper, Box, Grid, Alert, CircularProgress } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import * as clientService from '../services/clientService';
import type { Client, CreateClientData, UpdateClientData } from '../services/clientService';

const ClientForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, reset, formState: { errors } } = useForm();
  const isEditMode = !!id;

  useEffect(() => {
    const fetchClient = async () => {
      if (!isEditMode) return;
      
      try {
        setInitialLoading(true);
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
        setError(error.response?.data?.message || 'Errore nel caricamento dei dati cliente');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchClient();
  }, [id, isEditMode, reset]);

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      setError(null);
      
      if (isEditMode) {
        const updateData: UpdateClientData = {
          name: data.name,
           vatNumber: data.vatNumber,
          address: data.address || undefined,
          city: data.city || undefined,
          zipCode: data.zipCode || undefined,
          province: data.province || undefined,
          phone: data.phone || undefined,
          email: data.email || undefined,
          pec: data.pec || undefined,
          contractId: data.contractId || undefined,
        };
        
        await clientService.updateClient(id, updateData);
      } else {
        const createData: CreateClientData = {
          name: data.name,
          vatNumber: data.vatNumber,
          address: data.address || undefined,
          city: data.city || undefined,
          zipCode: data.zipCode || undefined,
          province: data.province || undefined,
          phone: data.phone || undefined,
          email: data.email || undefined,
          pec: data.pec || undefined,
          contractId: data.contractId || undefined,
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

  if (initialLoading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {isEditMode ? 'Modifica Cliente' : 'Nuovo Cliente'}
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Controller
                name="name"
                control={control}
                defaultValue=""
                rules={{ required: 'Nome è obbligatorio' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nome/Ragione Sociale"
                    error={!!errors.name}
                    helperText={errors.name?.message as string}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="vatNumber"
                control={control}
                defaultValue=""
                rules={{ required: 'Partita IVA è obbligatoria' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Partita IVA"
                    error={!!errors.vatNumber}
                    helperText={errors.vatNumber?.message as string}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="contractId"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="ID Contratto"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Controller
                name="address"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Indirizzo"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="city"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Città"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Controller
                name="province"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Provincia"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Controller
                name="zipCode"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="CAP"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Controller
                name="phone"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Telefono"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Controller
                name="email"
                control={control}
                defaultValue=""
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
                    error={!!errors.email}
                    helperText={errors.email?.message as string}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Controller
                name="pec"
                control={control}
                defaultValue=""
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
                    error={!!errors.pec}
                    helperText={errors.pec?.message as string}
                  />
                )}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/clients')}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? 'Salvataggio...' : 'Salva'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default ClientForm;