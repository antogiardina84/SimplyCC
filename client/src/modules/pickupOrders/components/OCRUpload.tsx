// client/src/modules/pickupOrders/components/OCRUpload.tsx

import { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CloudUpload,
  CheckCircle,
  Edit,
  Visibility,
  AutoFixHigh,
  Description,
  Close
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import * as ocrService from '../services/ocrService';
import type { ExtractedPickupOrderData, MatchedEntities } from '../services/ocrService';

interface OCRUploadProps {
  onSuccess?: (pickupOrder: any) => void;
  // Modificato per includere 'needsReview' e 'message'
  onExtractedData?: (data: ExtractedPickupOrderData, needsReview: boolean, message?: string) => void;
  onError?: (errorMessage: string) => void; // Nuovo prop per la gestione degli errori
}

const OCRUpload = ({ onSuccess, onExtractedData, onError }: OCRUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedPickupOrderData | null>(null);
  const [matchedEntities, setMatchedEntities] = useState<MatchedEntities | null>(null);
  // L'errore viene gestito dal componente padre (PickupOrderUpload) tramite onError
  // const [error, setError] = useState<string | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [corrections, setCorrections] = useState<any>({});
  const [creating, setCreating] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validazione preliminare del file
    const validationResult = ocrService.validatePDFFile(file);
    if (!validationResult.isValid) {
        if (onError) onError(validationResult.error || 'File non valido');
        return;
    }

    setUploading(true);
    // setError(null); // Il padre gestisce l'errore
    setExtractedData(null);
    setMatchedEntities(null);

    try {
      // Step 1: Esegui l'estrazione OCR
      const result = await ocrService.extractFromPDF(file);
      
      setExtractedData(result.extractedData);
      setMatchedEntities(result.matchedEntities);
      setCorrections({}); // Reset any previous corrections

      // Determina se è necessaria la revisione in base a qualityScore o campi non rilevati
      const needsReview = result.suggestions.qualityScore < 70 || result.suggestions.needsReview.length > 0;
      let reviewMessage = '';
      if (needsReview) {
          reviewMessage = result.suggestions.needsReview.length > 0
              ? `Alcuni campi (${result.suggestions.needsReview.join(', ')}) potrebbero richiedere una revisione.`
              : 'La qualità dell\'estrazione è bassa, si consiglia una revisione.';
          setReviewDialogOpen(true); // Apri il dialogo di revisione se necessario
      }

      // Notifica il componente padre con i dati estratti e se è necessaria la revisione
      if (onExtractedData) {
        onExtractedData(result.extractedData, needsReview, reviewMessage);
      }

    } catch (error: any) {
      console.error('Errore estrazione OCR:', error);
      if (onError) onError(error.response?.data?.message || 'Errore durante l\'estrazione dei dati dal PDF');
    } finally {
      setUploading(false);
    }
  }, [onExtractedData, onError]); // Aggiungi onError alle dipendenze

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: uploading
  });

  const handleCreatePickupOrder = async (autoCreate: boolean = false) => {
    if (!extractedData) return;

    setCreating(true);
    // setError(null); // Il padre gestisce l'errore

    try {
      // Invia i dati estratti (e le correzioni se presenti) al backend per la creazione
      const dataToCreate = { ...extractedData, ...corrections };
      const result = await ocrService.createFromExtractedData(
        dataToCreate, // Usa i dati con le correzioni
        corrections, // Invia anche le correzioni separate se il backend le elabora
        autoCreate
      );

      if (result.success && onSuccess) {
          // Passa l'oggetto pickupOrder completo al componente padre
          onSuccess(result.pickupOrder);
          setReviewDialogOpen(false); // Chiudi il dialogo dopo la creazione
          setExtractedData(null); // Pulisci i dati dopo la creazione
          setMatchedEntities(null);
          setCorrections({});
      } else if (onError) {
          // Gestisci caso in cui la creazione non è successa ma non ha lanciato un errore HTTP
          onError(result.message || 'Errore sconosciuto durante la creazione.');
      }

    } catch (error: any) {
      console.error('Errore creazione buono di ritiro:', error);
      if (onError) onError(error.response?.data?.message || 'Errore durante la creazione del buono di ritiro');
    } finally {
      setCreating(false);
    }
  };

  const handleProcessAndCreate = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validazione preliminare del file
    const validationResult = ocrService.validatePDFFile(file);
    if (!validationResult.isValid) {
        if (onError) onError(validationResult.error || 'File non valido');
        return;
    }

    setUploading(true);
    // setError(null); // Il padre gestisce l'errore

    try {
      // Chiama il servizio che processa ed eventualmente crea l'ordine automaticamente
      const result = await ocrService.processAndCreate(file);
      
      if (result.success && result.pickupOrder && onSuccess) {
        onSuccess(result.pickupOrder);
        setExtractedData(null); // Pulisci i dati dopo il successo
        setMatchedEntities(null);
        setCorrections({});
      } else if (onError) {
          // Gestisci caso in cui il processo non è riuscito ma non ha lanciato un errore HTTP
          onError(result.message || 'Errore sconosciuto durante il processo automatico.');
      }
    } catch (error: any) {
      console.error('Errore processo automatico:', error);
      if (onError) onError(error.response?.data?.message || 'Errore durante il processo automatico');
    } finally {
      setUploading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'success';
    if (confidence >= 70) return 'warning';
    return 'error';
  };

  // La qualità del punteggio è gestita in ocrService e passata qui
  // const getQualityColor = (score: number) => { /* ... */ };

  return (
    <Box>
      {/* Area di Upload */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          textAlign: 'center',
          cursor: uploading ? 'default' : 'pointer',
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: uploading ? 'grey.300' : 'primary.main',
            backgroundColor: uploading ? 'background.paper' : 'action.hover',
          }
        }}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <Box>
            <Description sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Processamento PDF in corso...
            </Typography>
            <LinearProgress sx={{ mt: 2 }} />
          </Box>
        ) : (
          <Box>
            <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Trascina un PDF del buono di ritiro qui o clicca per selezionare
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Il sistema estrarrà automaticamente i dati dal PDF usando OCR
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Risultati Estrazione */}
      {extractedData && !uploading && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Dati Estratti dal PDF
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  icon={<AutoFixHigh />}
                  label={`Confidenza: ${extractedData.confidence}%`}
                  color={getConfidenceColor(extractedData.confidence)}
                  size="small"
                />
                <Tooltip title="Modifica dati estratti">
                  <IconButton
                    size="small"
                    onClick={() => setReviewDialogOpen(true)}
                    color="primary"
                  >
                    <Edit />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="primary">
                  Informazioni Principali
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Numero Buono"
                      secondary={extractedData.orderNumber || 'Non rilevato'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Data Emissione"
                      secondary={extractedData.issueDate ? 
                        format(new Date(extractedData.issueDate), 'dd/MM/yyyy', { locale: it }) : 
                        'Non rilevata'
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Tipo Flusso"
                      secondary={`Flusso ${extractedData.flowType || 'N/A'}`}
                    />
                  </ListItem>
                  {extractedData.distanceKm !== undefined && extractedData.distanceKm !== null && (
                    <ListItem>
                      <ListItemText
                        primary="Distanza"
                        secondary={`${extractedData.distanceKm} km`}
                      />
                    </ListItem>
                  )}
                </List>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="primary">
                  Mittente e Destinatario
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Mittente"
                      secondary={extractedData.senderName || 'Non rilevato'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Destinatario"
                      secondary={extractedData.recipientName || 'Non rilevato'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Bacino"
                      secondary={`${extractedData.basinCode || 'N/A'} - ${extractedData.basinDescription || 'N/A'}`}
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>

            {/* Azioni */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<Visibility />}
                onClick={() => setReviewDialogOpen(true)}
              >
                Rivedi Dati
              </Button>
              <Button
                variant="contained"
                startIcon={<CheckCircle />}
                // Qui potresti voler chiamare handleCreatePickupOrder(true)
                // Oppure fornire un'opzione di "processa e crea" che è più diretta
                onClick={() => handleCreatePickupOrder(true)} // Assume che il click qui significhi autoCreate
                disabled={creating}
              >
                {creating ? 'Creazione...' : 'Crea Buono di Ritiro'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Errori - Rimosso da qui in quanto gestito dal padre */}
      {/* {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )} */}

      {/* Dialog di Revisione */}
      <Dialog
        open={reviewDialogOpen}
        onClose={() => { setReviewDialogOpen(false); setCorrections({}); }} // Reset corrections on close
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Revisione Dati Estratti
            <IconButton onClick={() => { setReviewDialogOpen(false); setCorrections({}); }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {extractedData && (
            <Box>
              {/* Statistiche di Qualità */}
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="subtitle2">
                  Qualità Estrazione: {extractedData.confidence}% confidenza
                </Typography>
                {matchedEntities?.suggestions && (
                  <Typography variant="body2">
                    Suggerimenti per il miglioramento disponibili
                  </Typography>
                )}
                {/* Visualizza i campi che richiedono revisione */}
                {extractedData.confidence < 70 && (
                  <Typography variant="body2" color="text.secondary">
                    La qualità dell'estrazione è bassa, si consiglia una revisione approfondita.
                  </Typography>
                )}
                {extractedData.confidence >= 70 && extractedData.confidence < 90 && (
                  <Typography variant="body2" color="text.secondary">
                    La qualità dell'estrazione è buona, ma alcuni dettagli potrebbero richiedere attenzione.
                  </Typography>
                )}
                {extractedData.confidence >= 90 && (
                  <Typography variant="body2" color="text.secondary">
                    Qualità dell'estrazione eccellente.
                  </Typography>
                )}
              </Alert>

              {/* Form di Correzione */}
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Numero Buono"
                    // Usa corrections se esiste, altrimenti extractedData, altrimenti stringa vuota
                    value={corrections.orderNumber ?? extractedData.orderNumber ?? ''}
                    onChange={(e) => setCorrections({...corrections, orderNumber: e.target.value})}
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Data Emissione"
                    type="date"
                    value={corrections.issueDate ? 
                        format(new Date(corrections.issueDate), 'yyyy-MM-dd') : // Se già corretta
                        (extractedData.issueDate && !isNaN(extractedData.issueDate.getTime()) ? 
                            format(new Date(extractedData.issueDate), 'yyyy-MM-dd') : '') // Altrimenti da estratta
                    }
                    onChange={(e) => setCorrections({...corrections, issueDate: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                    margin="normal"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Mittente"
                    value={corrections.senderName ?? extractedData.senderName ?? ''}
                    onChange={(e) => setCorrections({...corrections, senderName: e.target.value})}
                    margin="normal"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Destinatario"
                    value={corrections.recipientName ?? extractedData.recipientName ?? ''}
                    onChange={(e) => setCorrections({...corrections, recipientName: e.target.value})}
                    margin="normal"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Codice Bacino"
                    value={corrections.basinCode ?? extractedData.basinCode ?? ''}
                    onChange={(e) => setCorrections({...corrections, basinCode: e.target.value})}
                    margin="normal"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Tipo Flusso</InputLabel>
                    <Select
                      value={corrections.flowType ?? extractedData.flowType ?? ''} // Default vuoto, o un valore sensato
                      label="Tipo Flusso"
                      onChange={(e) => setCorrections({...corrections, flowType: e.target.value})}
                    >
                      <MenuItem value="A">Flusso A - Monomateriale urbano</MenuItem>
                      <MenuItem value="B">Flusso B - Monomateriale non domestico</MenuItem>
                      <MenuItem value="C">Flusso C - Monomateriale urbano CPL</MenuItem>
                      <MenuItem value="D">Flusso D - Multimateriale urbano</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Distanza Chilometrica */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Distanza (km)"
                    type="number"
                    value={corrections.distanceKm ?? extractedData.distanceKm ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCorrections({...corrections, distanceKm: val === '' ? undefined : parseFloat(val)});
                    }}
                    margin="normal"
                  />
                </Grid>
                
                {/* Campi aggiuntivi per mittente/destinatario */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Indirizzo Mittente"
                    value={corrections.senderAddress ?? extractedData.senderAddress ?? ''}
                    onChange={(e) => setCorrections({...corrections, senderAddress: e.target.value})}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Città Mittente"
                    value={corrections.senderCity ?? extractedData.senderCity ?? ''}
                    onChange={(e) => setCorrections({...corrections, senderCity: e.target.value})}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email Mittente"
                    value={corrections.senderEmail ?? extractedData.senderEmail ?? ''}
                    onChange={(e) => setCorrections({...corrections, senderEmail: e.target.value})}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Telefono Mittente"
                    value={corrections.senderPhone ?? extractedData.senderPhone ?? ''}
                    onChange={(e) => setCorrections({...corrections, senderPhone: e.target.value})}
                    margin="normal"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Indirizzo Destinatario"
                    value={corrections.recipientAddress ?? extractedData.recipientAddress ?? ''}
                    onChange={(e) => setCorrections({...corrections, recipientAddress: e.target.value})}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Città Destinatario"
                    value={corrections.recipientCity ?? extractedData.recipientCity ?? ''}
                    onChange={(e) => setCorrections({...corrections, recipientCity: e.target.value})}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email Destinatario"
                    value={corrections.recipientEmail ?? extractedData.recipientEmail ?? ''}
                    onChange={(e) => setCorrections({...corrections, recipientEmail: e.target.value})}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Telefono Destinatario"
                    value={corrections.recipientPhone ?? extractedData.recipientPhone ?? ''}
                    onChange={(e) => setCorrections({...corrections, recipientPhone: e.target.value})}
                    margin="normal"
                  />
                </Grid>

                {/* Date Aggiuntive */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Data Carico"
                    type="date"
                    value={corrections.loadingDate ?
                        format(new Date(corrections.loadingDate), 'yyyy-MM-dd') :
                        (extractedData.loadingDate && !isNaN(extractedData.loadingDate.getTime()) ?
                            format(new Date(extractedData.loadingDate), 'yyyy-MM-dd') : '')
                    }
                    onChange={(e) => setCorrections({...corrections, loadingDate: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Data Scarico"
                    type="date"
                    value={corrections.unloadingDate ?
                        format(new Date(corrections.unloadingDate), 'yyyy-MM-dd') :
                        (extractedData.unloadingDate && !isNaN(extractedData.unloadingDate.getTime()) ?
                            format(new Date(extractedData.unloadingDate), 'yyyy-MM-dd') : '')
                    }
                    onChange={(e) => setCorrections({...corrections, unloadingDate: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Data Disponibilità"
                    type="date"
                    value={corrections.availabilityDate ?
                        format(new Date(corrections.availabilityDate), 'yyyy-MM-dd') :
                        (extractedData.availabilityDate && !isNaN(extractedData.availabilityDate.getTime()) ?
                            format(new Date(extractedData.availabilityDate), 'yyyy-MM-dd') : '')
                    }
                    onChange={(e) => setCorrections({...corrections, availabilityDate: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                    margin="normal"
                  />
                </Grid>
              </Grid>

              {/* Suggerimenti del Sistema */}
              {matchedEntities?.suggestions && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Entità Corrispondenti nel Sistema
                  </Typography>
                  
                  {matchedEntities.suggestions.senders.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Mittenti suggeriti:
                      </Typography>
                      {matchedEntities.suggestions.senders.slice(0, 3).map((sender, index) => (
                        <Chip
                          key={index}
                          label={`${sender.name} (${Math.round(sender.similarity * 100)}%)`}
                          size="small"
                          variant="outlined"
                          sx={{ mr: 1, mb: 1 }}
                          onClick={() => setCorrections({...corrections, senderName: sender.name})}
                        />
                      ))}
                    </Box>
                  )}

                  {matchedEntities.suggestions.recipients.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Destinatari suggeriti:
                      </Typography>
                      {matchedEntities.suggestions.recipients.slice(0, 3).map((recipient, index) => (
                        <Chip
                          key={index}
                          label={`${recipient.name} (${Math.round(recipient.similarity * 100)}%)`}
                          size="small"
                          variant="outlined"
                          sx={{ mr: 1, mb: 1 }}
                          onClick={() => setCorrections({...corrections, recipientName: recipient.name})}
                        />
                      ))}
                    </Box>
                  )}

                  {matchedEntities.suggestions.basins.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Bacini suggeriti:
                      </Typography>
                      {matchedEntities.suggestions.basins.slice(0, 3).map((basin, index) => (
                        <Chip
                          key={index}
                          label={`${basin.code} - ${basin.description || ''}`}
                          size="small"
                          variant="outlined"
                          sx={{ mr: 1, mb: 1 }}
                          onClick={() => setCorrections({...corrections, basinCode: basin.code, basinDescription: basin.description})}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => { setReviewDialogOpen(false); setCorrections({}); }}>
            Annulla
          </Button>
          <Button
            onClick={() => handleCreatePickupOrder(false)} // 'Prepara Dati' significa non auto-creare, ma salvare
            disabled={creating}
          >
            Prepara Dati
          </Button>
          <Button
            variant="contained"
            onClick={() => handleCreatePickupOrder(true)}
            disabled={creating}
          >
            {creating ? 'Creazione...' : 'Crea Buono di Ritiro'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OCRUpload;