// client/src/modules/pickupOrders/pages/PickupOrderUpload.tsx
// Esempio di integrazione del componente OCR nella pagina principale

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Tabs, Tab, Paper } from '@mui/material';
import OCRUpload from '../components/OCRUpload';
import PickupOrderForm from './PickupOrderForm';

const PickupOrderUpload = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const handleOCRSuccess = (pickupOrder: any) => {
    // Naviga alla lista dei buoni di ritiro con messaggio di successo
    navigate('/pickup-orders', { 
      state: { 
        message: `Buono di ritiro ${pickupOrder.orderNumber} creato con successo tramite OCR`,
        pickupOrder 
      }
    });
  };

  const handleExtractedData = (data: any) => {
    console.log('Dati estratti:', data);
    // Qui potresti salvare i dati estratti nello stato globale
    // o passarli a un altro componente
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Nuovo Buono di Ritiro
      </Typography>

      <Paper sx={{ mt: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Upload PDF (OCR)" />
          <Tab label="Inserimento Manuale" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Caricamento Automatico tramite OCR
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Carica un PDF del buono di ritiro e il sistema estrarrà automaticamente tutti i dati necessari.
                Potrai rivedere e correggere i dati prima della creazione finale.
              </Typography>
              
              <OCRUpload
                onSuccess={handleOCRSuccess}
                onExtractedData={handleExtractedData}
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