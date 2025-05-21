import { useState, useEffect } from 'react';
import { Container, Typography, Paper, Grid, CircularProgress } from '@mui/material';
import api from '../../../core/services/api';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await api.get('/health');
        setStatus(response.data.status);
      } catch (error) {
        console.error('Error checking health:', error);
        setStatus('DOWN');
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Dashboard
            </Typography>
            <Typography variant="body1">
              Benvenuto nel Sistema di Gestione Rifiuti. Questa è la dashboard principale.
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              Stato API: {loading ? <CircularProgress size={20} sx={{ ml: 1 }} /> : status}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 240 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Conferimenti Recenti
            </Typography>
            <Typography variant="body2">
              Nessun conferimento recente da visualizzare.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 240 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Buoni di Ritiro
            </Typography>
            <Typography variant="body2">
              Nessun buono di ritiro da visualizzare.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 240 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Analisi Recenti
            </Typography>
            <Typography variant="body2">
              Nessuna analisi recente da visualizzare.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;