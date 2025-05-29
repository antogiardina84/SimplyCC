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
  ListItemButton,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CloudUpload,
  CheckCircle,
  Warning,
  Error,
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
  onExtractedData?: (data: ExtractedPickupOrderData) => void;
}

const OCRUpload = ({ onSuccess, onExtractedData }: OCRUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedPickupOrderData | null>(null);
  const [matchedEntities, setMatchedEntities] = useState<MatchedEntities | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [corrections, setCorrections] = useState<any>({});
  const [creating, setCreating] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setExtractedData(null);
    setMatchedEntities(null);

    try {
      const result = await ocrService.extractFromPDF(file);
      
      setExtractedData(result.extractedData);
      setMatchedEntities(result.matchedEntities);
      
      // Se la qualità è bassa, apri dialog di revisione
      if (result.suggestions.qualityScore < 70 || result.suggestions.needsReview.length > 0) {
        setReviewDialogOpen(true);
      }

      if (onExtractedData) {
        onExtractedData(result.extractedData);
      }

    } catch (error: any) {
      console.error('Errore estrazione OCR:', error);
      setError(error.response?.data?.message || 'Errore durante l\'estrazione dei dati dal PDF');
    } finally {
      setUploading(false);
    }
  }, [onExtractedData]);

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
    try {
      const result = await ocrService.createFromExtractedData(
        extractedData,
        corrections,
        autoCreate
      );

      if (autoCreate && result.pickupOrder) {
        if (onSuccess) {
          onSuccess(result.pickupOrder);
        }
      }

      setReviewDialogOpen(false);
    } catch (error: any) {
      console.error('Errore creazione buono di ritiro:', error);
      setError(error.response?.data?.message || 'Errore durante la creazione del buono di ritiro');
    } finally {
      setCreating(false);
    }
  };

  const handleProcessAndCreate = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const result = await ocrService.processAndCreate(file);
      
      if (result.pickupOrder && onSuccess) {
        onSuccess(result.pickupOrder);
      }
    } catch (error: any) {
      console.error('Errore processo automatico:', error);
      setError(error.response?.data?.message || 'Errore durante il processo automatico');
    } finally {
      setUploading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'success';
    if (confidence >= 70) return 'warning';
    return 'error';
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

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
            <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
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
                      secondary={`Flusso ${extractedData.flowType || 'A'}`}
                    />
                  </ListItem>
                  {extractedData.distanceKm && (
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
                onClick={() => handleCreatePickupOrder(true)}
                disabled={creating}
              >
                {creating ? 'Creazione...' : 'Crea Buono di Ritiro'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Errori */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Dialog di Revisione */}
      <Dialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Revisione Dati Estratti
            <IconButton onClick={() => setReviewDialogOpen(false)}>
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
              </Alert>

              {/* Form di Correzione */}
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Numero Buono"
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
                    value={corrections.issueDate ?? 
                      (extractedData.issueDate ? format(new Date(extractedData.issueDate), 'yyyy-MM-dd') : '')
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
                      value={corrections.flowType ?? extractedData.flowType ?? 'A'}
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

                {extractedData.distanceKm && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Distanza (km)"
                      type="number"
                      value={corrections.distanceKm ?? extractedData.distanceKm ?? ''}
                      onChange={(e) => setCorrections({...corrections, distanceKm: parseFloat(e.target.value)})}
                      margin="normal"
                    />
                  </Grid>
                )}
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
                      onClick={() => setCorrections({...corrections, basinCode: basin.code})}
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
      <Button onClick={() => setReviewDialogOpen(false)}>
        Annulla
      </Button>
      <Button
        onClick={() => handleCreatePickupOrder(false)}
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