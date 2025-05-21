// client/src/modules/basins/pages/BasinForm.tsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, TextField, Button, Paper, Box, FormControl, 
  InputLabel, Select, MenuItem, Alert, CircularProgress, Grid } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import * as basinService from '../services/basinService';
import * as clientService from '../../clients/services/clientService';
import type { Basin } from '../services/basinService';
import type { Client } from '../../clients/services/clientService';

const BasinForm = () => {
  const { id, clientId } = useParams<{ id: string; clientId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm();
  const isEditMode = !!id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);
        
        // Carica la lista dei clienti
        const clientsData = await clientService.getClients();
        setClients(clientsData);
        
        // Se è presente il clientId dalla URL, imposta il valore
        if (clientId && !isEditMode) {
          setValue('clientId', clientId);
        }
        
        // Se è modalità modifica, carica i dati del bacino
        if (isEditMode) {
          const basinData = await basinService.getBasinById(id);
          reset({
            code: basinData.code,
            description: basinData.description || '',
            flowType: basinData.flowType,
            clientId: basinData.clientId,
          });
        }
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setError(error.response?.data?.message || 'Errore nel caricamento dei dati');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [id, clientId, isEditMode, reset, setValue]);

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      setError(null);
      
      if (isEditMode) {
        await basinService.updateBasin(id, {
          code: data.code,
          description: data.description || undefined,
          flowType: data.flowType,
          clientId: data.clientId,
        });
      } else {
        await basinService.createBasin({
          code: data.code,
          description: data.description || undefined,
          flowType: data.flowType,
          clientId: data.clientId,
        });
      }
      
      navigate(clientId ? `/basins/client/${clientId}` : '/basins');
    } catch (error: any) {
      console.error('Error saving basin:', error);
      setError(error.response?.data?.message || `Errore durante il ${isEditMode ? 'salvataggio' : 'creazione'} del bacino`);
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
        {isEditMode ? 'Modifica Bacino' : 'Nuovo Bacino'}
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Controller
                name="code"
                control={control}
                defaultValue=""
                rules={{ required: 'Codice è obbligatorio' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Codice"
                    error={!!errors.code}
                    helperText={errors.code?.message as string}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="flowType"
                control={control}
                defaultValue=""
                rules={{ required: 'Tipo Flusso è obbligatorio' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.flowType}>
                    <InputLabel>Tipo Flusso</InputLabel>
                    <Select {...field} label="Tipo Flusso">
                      <MenuItem value="A">Flusso A - Monomateriale urbano</MenuItem>
                      <MenuItem value="B">Flusso B - Monomateriale non domestico</MenuItem>
                      <MenuItem value="C">Flusso C - Monomateriale urbano CPL</MenuItem>
                      <MenuItem value="D">Flusso D - Multimateriale urbano</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Descrizione"
                    multiline
                    rows={2}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Controller
                name="clientId"
                control={control}
                defaultValue=""
                rules={{ required: 'Cliente è obbligatorio' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.clientId}>
                    <InputLabel>Cliente</InputLabel>
                    <Select {...field} label="Cliente" disabled={!!clientId}>
                      {clients.map((client) => (
                        <MenuItem key={client.id} value={client.id}>
                          {client.name} ({client.vatNumber})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={() => navigate(clientId ? `/basins/client/${clientId}` : '/basins')}
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

export default BasinForm;