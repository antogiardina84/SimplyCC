// client/src/modules/pickupOrders/pages/PickupOrderForm.tsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, TextField, Button, Paper, Box, FormControl, 
  InputLabel, Select, MenuItem, Alert, CircularProgress, Grid } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import * as pickupOrderService from '../services/pickupOrderService';
import * as clientService from '../../clients/services/clientService';
import * as basinService from '../../basins/services/basinService';
import type { CreatePickupOrderData, UpdatePickupOrderData } from '../services/pickupOrderService';
import type { Client } from '../../clients/services/clientService';
import type { Basin } from '../../basins/services/basinService';

const PickupOrderForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [basins, setBasins] = useState<Basin[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, reset, formState: { errors } } = useForm();
  const isEditMode = !!id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);
        
        // Carica clienti e bacini
        const [clientsData, basinsData] = await Promise.all([
          clientService.getClients(),
          basinService.getBasins()
        ]);
        
        setClients(clientsData);
        setBasins(basinsData);
        
        // Se è modalità modifica, carica i dati del buono di ritiro
        if (isEditMode) {
          const orderData = await pickupOrderService.getPickupOrderById(id);
          reset({
            orderNumber: orderData.orderNumber,
            issueDate: format(new Date(orderData.issueDate), 'yyyy-MM-dd'),
            scheduledDate: orderData.scheduledDate ? format(new Date(orderData.scheduledDate), 'yyyy-MM-dd') : '',
            completionDate: orderData.completionDate ? format(new Date(orderData.completionDate), 'yyyy-MM-dd') : '',
            shipperId: orderData.shipperId || '',
            senderId: orderData.senderId,
            recipientId: orderData.recipientId,
            basinId: orderData.basinId,
            flowType: orderData.flowType,
            distanceKm: orderData.distanceKm || '',
            status: orderData.status,
            expectedQuantity: orderData.expectedQuantity || '',
            actualQuantity: orderData.actualQuantity || '',
            destinationQuantity: orderData.destinationQuantity || '',
            notes: orderData.notes || '',
            documents: orderData.documents || '',
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
  }, [id, isEditMode, reset]);

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      setError(null);
      
      if (isEditMode) {
        const updateData: UpdatePickupOrderData = {
          orderNumber: data.orderNumber,
          issueDate: data.issueDate,
          scheduledDate: data.scheduledDate || null,
          completionDate: data.completionDate || null,
          shipperId: data.shipperId || null,
          senderId: data.senderId,
          recipientId: data.recipientId,
          basinId: data.basinId,
          flowType: data.flowType,
          distanceKm: data.distanceKm ? parseFloat(data.distanceKm) : null,
          status: data.status,
          expectedQuantity: data.expectedQuantity ? parseFloat(data.expectedQuantity) : null,
          actualQuantity: data.actualQuantity ? parseFloat(data.actualQuantity) : null,
          destinationQuantity: data.destinationQuantity ? parseFloat(data.destinationQuantity) : null,
          notes: data.notes || null,
          documents: data.documents || null,
        };
        
        await pickupOrderService.updatePickupOrder(id, updateData);
      } else {
        const createData: CreatePickupOrderData = {
          orderNumber: data.orderNumber,
          issueDate: data.issueDate,
          scheduledDate: data.scheduledDate || undefined,
          completionDate: data.completionDate || undefined,
          shipperId: data.shipperId || undefined,
          senderId: data.senderId,
          recipientId: data.recipientId,
          basinId: data.basinId,
          flowType: data.flowType,
          distanceKm: data.distanceKm ? parseFloat(data.distanceKm) : undefined,
          status: data.status || 'PENDING',
          expectedQuantity: data.expectedQuantity ? parseFloat(data.expectedQuantity) : undefined,
          actualQuantity: data.actualQuantity ? parseFloat(data.actualQuantity) : undefined,
          destinationQuantity: data.destinationQuantity ? parseFloat(data.destinationQuantity) : undefined,
          notes: data.notes || undefined,
          documents: data.documents || undefined,
        };
        
        await pickupOrderService.createPickupOrder(createData);
      }
      
      navigate('/pickup-orders');
    } catch (error: any) {
      console.error('Error saving pickup order:', error);
      setError(error.response?.data?.message || `Errore durante il ${isEditMode ? 'salvataggio' : 'creazione'} del buono di ritiro`);
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
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        {isEditMode ? 'Modifica Buono di Ritiro' : 'Nuovo Buono di Ritiro'}
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Controller
                name="orderNumber"
                control={control}
                defaultValue=""
                rules={{ required: 'Numero buono è obbligatorio' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Numero Buono"
                    error={!!errors.orderNumber}
                    helperText={errors.orderNumber?.message as string}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="issueDate"
                control={control}
                defaultValue=""
                rules={{ required: 'Data emissione è obbligatoria' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Data Emissione"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.issueDate}
                    helperText={errors.issueDate?.message as string}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="senderId"
                control={control}
                defaultValue=""
                rules={{ required: 'Mittente è obbligatorio' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.senderId}>
                    <InputLabel>Mittente</InputLabel>
                    // client/src/modules/pickupOrders/pages/PickupOrderForm.tsx (continua)
                    <Select {...field} label="Mittente">
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

            <Grid item xs={12} md={6}>
              <Controller
                name="recipientId"
                control={control}
                defaultValue=""
                rules={{ required: 'Destinatario è obbligatorio' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.recipientId}>
                    <InputLabel>Destinatario</InputLabel>
                    <Select {...field} label="Destinatario">
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

            <Grid item xs={12} md={6}>
              <Controller
                name="basinId"
                control={control}
                defaultValue=""
                rules={{ required: 'Bacino è obbligatorio' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.basinId}>
                    <InputLabel>Bacino</InputLabel>
                    <Select {...field} label="Bacino">
                      {basins.map((basin) => (
                        <MenuItem key={basin.id} value={basin.id}>
                          {basin.code} - {basin.description || 'N/A'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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

            {isEditMode && (
              <Grid item xs={12} md={6}>
                <Controller
                  name="status"
                  control={control}
                  defaultValue="PENDING"
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Stato</InputLabel>
                      <Select {...field} label="Stato">
                        <MenuItem value="PENDING">In Attesa</MenuItem>
                        <MenuItem value="SCHEDULED">Programmato</MenuItem>
                        <MenuItem value="READY">Pronto</MenuItem>
                        <MenuItem value="COMPLETED">Completato</MenuItem>
                        <MenuItem value="CANCELLED">Annullato</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <Controller
                name="scheduledDate"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Data Programmazione"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="distanceKm"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Distanza (km)"
                    type="number"
                    inputProps={{ step: 0.1, min: 0 }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="expectedQuantity"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Quantità Prevista (t)"
                    type="number"
                    inputProps={{ step: 0.001, min: 0 }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="actualQuantity"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Quantità Effettiva (t)"
                    type="number"
                    inputProps={{ step: 0.001, min: 0 }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="notes"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Note"
                    multiline
                    rows={3}
                  />
                )}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/pickup-orders')}
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

export default PickupOrderForm;