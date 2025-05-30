// client/src/modules/pickupOrders/pages/PickupOrderUpload.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Tabs, Tab, Paper, Alert } from '@mui/material';
import PDFUpload from '../components/PDFUpload';
import PickupOrderForm from './PickupOrderForm';
import type { ExtractedPickupOrderData } from '../services/pdfTextService';

const PickupOrderUpload = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handlePDFSuccess = (pickupOrder: any) => {
    setSuccessMessage(`Buono di ritiro ${pickupOrder.orderNumber} creato con successo tramite estrazione PDF`);
    setError(null);
    
    // Mostra il messaggio per qualche secondo poi naviga
    setTimeout(() => {
      navigate('/pickup-orders', { 
        state: { 
          message: `Buono di ritiro ${pickupOrder.orderNumber} creato con successo`,
          pickupOrder 
        }
      });
    }, 2000);
  };

  const handleExtractedData = (data: ExtractedPickupOrderData, needsReview: boolean, message?: string) => {
    console.log('Dati estratti:', data);
    console.log('Necessita revisione:', needsReview);
    console.log('Messaggio:', message);
    
    setError(null);
    
    if (needsReview && message) {
      setError(message);
    } else {
      setSuccessMessage('Dati estratti con successo dal PDF');
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setSuccessMessage(null);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Reset messaggi quando si cambia tab
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Nuovo Buono di Ritiro
      </Typography>

      {/* Messaggi di stato */}
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      <Paper sx={{ mt: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Upload PDF (Estrazione Testo)" />
          <Tab label="Inserimento Manuale" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Caricamento Automatico da PDF
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Carica un PDF del buono di ritiro e il sistema estrarrà automaticamente tutti i dati dal testo selezionabile.
                Potrai rivedere e correggere i dati prima della creazione finale.
              </Typography>
              <Typography variant="body2" color="info.main" paragraph>
                <strong>Nota:</strong> Questo metodo funziona con PDF che contengono testo selezionabile (non immagini scansionate).
                Il sistema utilizza PDF.js per leggere direttamente il testo dal documento.
              </Typography>
              
              <PDFUpload
                onSuccess={handlePDFSuccess}
                onExtractedData={handleExtractedData}
                onError={handleError}
              />
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Inserimento Manuale
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Compila manualmente tutti i campi del buono di ritiro.
              </Typography>
              
              <PickupOrderForm />
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default PickupOrderUpload;