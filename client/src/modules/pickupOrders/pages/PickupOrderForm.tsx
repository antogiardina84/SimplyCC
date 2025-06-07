// client/src/modules/pickupOrders/pages/PickupOrderForm.tsx - VERSIONE CORRETTA

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, TextField, Button, Paper, Box, FormControl, 
  InputLabel, Select, MenuItem, Alert, CircularProgress, Grid } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import api from '../../../core/services/api';

// Interfacce aggiornate per il nuovo schema - CON TIPI CORRETTI
interface PickupOrderFormData {
  orderNumber: string;
  issueDate: string;
  scheduledDate?: string;
  loadingDate?: string;
  unloadingDate?: string;
  completionDate?: string;
  
  // Entità logistiche
  logisticSenderId?: string;    
  logisticRecipientId?: string; 
  logisticTransporterId?: string;
  
  // Cliente convenzionato
  clientId?: string;
  
  basinId: string;
  flowType: string;
  distanceKm?: number;        // CORRETTO: number per i campi numerici
  materialType?: string;
  
  status?: string;
  
  expectedQuantity?: number;   // CORRETTO: number
  actualQuantity?: number;     // CORRETTO: number
  destinationQuantity?: number; // CORRETTO: number
  loadedPackages?: number;     // CORRETTO: number
  departureWeight?: number;    // CORRETTO: number
  arrivalWeight?: number;      // CORRETTO: number
  
  assignedOperatorId?: string;
  
  notes?: string;
  documents?: string;
  loadingPhotos?: string;
  loadingVideos?: string;
  
  isRejected?: boolean;
  rejectionReason?: string;
  rejectionDate?: string;
}

interface Client {
  id: string;
  name: string;
  vatNumber?: string;
}

interface Basin {
  id: string;
  code: string;
  description?: string;
}

interface LogisticEntity {
  id: string;
  name: string;
  address?: string;
  city?: string;
}

const PickupOrderForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [basins, setBasins] = useState<Basin[]>([]);
  const [logisticEntities, setLogisticEntities] = useState<LogisticEntity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, reset, formState: { errors } } = useForm<PickupOrderFormData>();
  const isEditMode = !!id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);
        
        // Carica tutti i dati necessari
        const [clientsResponse, basinsResponse] = await Promise.all([
          api.get('/clients'),
          api.get('/basins'),
        ]);
        
        setClients(clientsResponse.data);
        setBasins(basinsResponse.data);
        
        // Mock logistic entities per ora (implementare endpoint /logistics se necessario)
        setLogisticEntities([
          { id: '1', name: 'CC DOMUS RICYCLE', city: 'CATANIA' },
          { id: '2', name: 'CSS ECOLOGISTIC SPA', city: 'GINOSA' },
        ]);
        
        // Se è modalità modifica, carica i dati del buono di ritiro
        if (isEditMode) {
          const orderResponse = await api.get(`/pickup-orders/${id}`);
          const orderData = orderResponse.data;
          
          // CORRETTO: Gestione dei tipi per i valori numerici
          reset({
            orderNumber: orderData.orderNumber,
            issueDate: format(new Date(orderData.issueDate), 'yyyy-MM-dd'),
            scheduledDate: orderData.scheduledDate ? format(new Date(orderData.scheduledDate), 'yyyy-MM-dd') : '',
            loadingDate: orderData.loadingDate ? format(new Date(orderData.loadingDate), 'yyyy-MM-dd') : '',
            unloadingDate: orderData.unloadingDate ? format(new Date(orderData.unloadingDate), 'yyyy-MM-dd') : '',
            completionDate: orderData.completionDate ? format(new Date(orderData.completionDate), 'yyyy-MM-dd') : '',
            
            // Entità logistiche aggiornate
            logisticSenderId: orderData.logisticSenderId || '',
            logisticRecipientId: orderData.logisticRecipientId || '',
            logisticTransporterId: orderData.logisticTransporterId || '',
            
            clientId: orderData.clientId || '',
            basinId: orderData.basinId,
            flowType: orderData.flowType,
            distanceKm: orderData.distanceKm || undefined,     // CORRETTO: number o undefined
            materialType: orderData.materialType || '',
            
            status: orderData.status,
            
            expectedQuantity: orderData.expectedQuantity || undefined,       // CORRETTO: number o undefined
            actualQuantity: orderData.actualQuantity || undefined,           // CORRETTO: number o undefined
            destinationQuantity: orderData.destinationQuantity || undefined, // CORRETTO: number o undefined
            loadedPackages: orderData.loadedPackages || undefined,           // CORRETTO: number o undefined
            departureWeight: orderData.departureWeight || undefined,         // CORRETTO: number o undefined
            arrivalWeight: orderData.arrivalWeight || undefined,             // CORRETTO: number o undefined
            
            assignedOperatorId: orderData.assignedOperatorId || '',
            
            notes: orderData.notes || '',
            documents: orderData.documents || '',
            loadingPhotos: orderData.loadingPhotos || '',
            loadingVideos: orderData.loadingVideos || '',
            
            isRejected: orderData.isRejected || false,
            rejectionReason: orderData.rejectionReason || '',
            rejectionDate: orderData.rejectionDate ? format(new Date(orderData.rejectionDate), 'yyyy-MM-dd') : '',
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

  const onSubmit = async (data: PickupOrderFormData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepara i dati per l'API
      const submitData = {
        orderNumber: data.orderNumber,
        issueDate: data.issueDate,
        scheduledDate: data.scheduledDate || null,
        loadingDate: data.loadingDate || null,
        unloadingDate: data.unloadingDate || null,
        completionDate: data.completionDate || null,
        
        logisticSenderId: data.logisticSenderId || null,
        logisticRecipientId: data.logisticRecipientId || null,
        logisticTransporterId: data.logisticTransporterId || null,
        
        clientId: data.clientId || null,
        basinId: data.basinId,
        flowType: data.flowType,
        distanceKm: data.distanceKm || null,
        materialType: data.materialType || null,
        
        status: data.status || 'DA_EVADERE',
        
        expectedQuantity: data.expectedQuantity || null,
        actualQuantity: data.actualQuantity || null,
        destinationQuantity: data.destinationQuantity || null,
        loadedPackages: data.loadedPackages || null,
        departureWeight: data.departureWeight || null,
        arrivalWeight: data.arrivalWeight || null,
        
        assignedOperatorId: data.assignedOperatorId || null,
        
        notes: data.notes || null,
        documents: data.documents || null,
        loadingPhotos: data.loadingPhotos || null,
        loadingVideos: data.loadingVideos || null,
        
        isRejected: data.isRejected || false,
        rejectionReason: data.rejectionReason || null,
        rejectionDate: data.rejectionDate || null,
      };
      
      if (isEditMode) {
        await api.put(`/pickup-orders/${id}`, submitData);
      } else {
        await api.post('/pickup-orders', submitData);
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
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        {isEditMode ? 'Modifica Buono di Ritiro' : 'Nuovo Buono di Ritiro'}
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Informazioni Base */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Informazioni Generali</Typography>
            </Grid>
            
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
                    helperText={errors.orderNumber?.message}
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
                    helperText={errors.issueDate?.message}
                  />
                )}
              />
            </Grid>

            {/* Date aggiuntive */}
            <Grid item xs={12} md={4}>
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
                name="loadingDate"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Data Carico"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="unloadingDate"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Data Scarico"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>

            {/* Entità Logistiche */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Entità Logistiche</Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="logisticSenderId"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Mittente Logistico</InputLabel>
                    <Select {...field} label="Mittente Logistico">
                      <MenuItem value="">Nessuno</MenuItem>
                      {logisticEntities.map((entity) => (
                        <MenuItem key={entity.id} value={entity.id}>
                          {entity.name} {entity.city && `(${entity.city})`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="logisticRecipientId"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Destinatario Logistico</InputLabel>
                    <Select {...field} label="Destinatario Logistico">
                      <MenuItem value="">Nessuno</MenuItem>
                      {logisticEntities.map((entity) => (
                        <MenuItem key={entity.id} value={entity.id}>
                          {entity.name} {entity.city && `(${entity.city})`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="logisticTransporterId"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Trasportatore Logistico</InputLabel>
                    <Select {...field} label="Trasportatore Logistico">
                      <MenuItem value="">Nessuno</MenuItem>
                      {logisticEntities.map((entity) => (
                        <MenuItem key={entity.id} value={entity.id}>
                          {entity.name} {entity.city && `(${entity.city})`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            {/* Cliente e Bacino */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Cliente e Bacino</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="clientId"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Cliente Convenzionato</InputLabel>
                    <Select {...field} label="Cliente Convenzionato">
                      <MenuItem value="">Nessuno</MenuItem>
                      {clients.map((client) => (
                        <MenuItem key={client.id} value={client.id}>
                          {client.name} {client.vatNumber && `(${client.vatNumber})`}
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

            {/* Dettagli Flusso */}
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

            <Grid item xs={12} md={6}>
              <Controller
                name="materialType"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Tipo Materiale"
                  />
                )}
              />
            </Grid>

            {/* CORRETTO: distanceKm con defaultValue undefined per campi numerici */}
            <Grid item xs={12} md={6}>
              <Controller
                name="distanceKm"
                control={control}
                defaultValue={undefined}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Distanza (km)"
                    type="number"
                    inputProps={{ step: 0.1, min: 0 }}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                )}
              />
            </Grid>

            {isEditMode && (
              <Grid item xs={12} md={6}>
                <Controller
                  name="status"
                  control={control}
                  defaultValue="DA_EVADERE"
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Stato</InputLabel>
                      <Select {...field} label="Stato">
                        <MenuItem value="DA_EVADERE">Da Evadere</MenuItem>
                        <MenuItem value="PROGRAMMATO">Programmato</MenuItem>
                        <MenuItem value="IN_EVASIONE">In Evasione</MenuItem>
                        <MenuItem value="IN_CARICO">In Carico</MenuItem>
                        <MenuItem value="CARICATO">Caricato</MenuItem>
                        <MenuItem value="SPEDITO">Spedito</MenuItem>
                        <MenuItem value="COMPLETO">Completo</MenuItem>
                        <MenuItem value="CANCELLED">Annullato</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
            )}

            {/* Quantità e Pesi - TUTTI CORRETTI */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Quantità e Pesi</Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="expectedQuantity"
                control={control}
                defaultValue={undefined}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Quantità Prevista (t)"
                    type="number"
                    inputProps={{ step: 0.001, min: 0 }}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="actualQuantity"
                control={control}
                defaultValue={undefined}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Quantità Effettiva (t)"
                    type="number"
                    inputProps={{ step: 0.001, min: 0 }}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="destinationQuantity"
                control={control}
                defaultValue={undefined}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Quantità a Destino (t)"
                    type="number"
                    inputProps={{ step: 0.001, min: 0 }}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="departureWeight"
                control={control}
                defaultValue={undefined}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Peso Partenza (t)"
                    type="number"
                    inputProps={{ step: 0.001, min: 0 }}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="arrivalWeight"
                control={control}
                defaultValue={undefined}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Peso Arrivo (t)"
                    type="number"
                    inputProps={{ step: 0.001, min: 0 }}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="loadedPackages"
                control={control}
                defaultValue={undefined}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Numero Colli"
                    type="number"
                    inputProps={{ min: 0 }}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                )}
              />
            </Grid>

            {/* Note */}
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