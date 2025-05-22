// client/src/modules/dashboard/pages/Dashboard.tsx

import { useState, useEffect } from 'react';
import { Container, Typography, Paper, Grid, CircularProgress, Card, CardContent, Box } from '@mui/material';
import { People, Business, Assignment, ViewList } from '@mui/icons-material';
import api from '../../../core/services/api';
import * as authService from '../../auth/services/authService';

interface DashboardStats {
  totalUsers: number;
  totalClients: number;
  totalBasins: number;
  totalPickupOrders: number;
  pendingOrders: number;
}

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [apiStatus, setApiStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const user = authService.getCurrentUser();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Controlla prima lo stato dell'API
        const healthResponse = await api.get('/health');
        setApiStatus(healthResponse.data.status);
        
        // Prova a ottenere le statistiche
        try {
          const statsResponse = await api.get('/dashboard/stats');
          setStats(statsResponse.data);
        } catch (statsError: any) {
          console.warn('Stats endpoint not available:', statsError);
          // Usa dati mock se l'endpoint non è disponibile
          setStats({
            totalUsers: 0,
            totalClients: 0,
            totalBasins: 0,
            totalPickupOrders: 0,
            pendingOrders: 0,
          });
        }
        
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        setApiStatus('DOWN');
        setError('Impossibile connettersi al server');
        
        // Dati di fallback
        setStats({
          totalUsers: 0,
          totalClients: 0,
          totalBasins: 0,
          totalPickupOrders: 0,
          pendingOrders: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color 
  }: { 
    title: string; 
    value: number; 
    icon: React.ReactNode; 
    color: string 
  }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="h2">
              {value}
            </Typography>
          </Box>
          <Box sx={{ color: color, fontSize: 40 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Benvenuto, {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email}
        </Typography>
      </Box>

      {error && (
        <Paper sx={{ p: 2, mb: 3, backgroundColor: '#ffebee' }}>
          <Typography color="error">
            {error}
          </Typography>
        </Paper>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Statistiche Principali */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Statistiche Generali
            </Typography>
          </Grid>

          {user?.role === 'ADMIN' && (
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Utenti Totali"
                value={stats?.totalUsers || 0}
                icon={<People />}
                color="#1976d2"
              />
            </Grid>
          )}

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Clienti Totali"
              value={stats?.totalClients || 0}
              icon={<Business />}
              color="#388e3c"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Bacini Totali"
              value={stats?.totalBasins || 0}
              icon={<ViewList />}
              color="#f57c00"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Buoni di Ritiro"
              value={stats?.totalPickupOrders || 0}
              icon={<Assignment />}
              color="#7b1fa2"
            />
          </Grid>

          {/* Stato Sistema */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Stato Sistema
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body1">
                  Stato API:
                </Typography>
                <Box 
                  sx={{ 
                    px: 2, 
                    py: 0.5, 
                    borderRadius: 1, 
                    backgroundColor: apiStatus === 'UP' ? '#4caf50' : '#f44336',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                >
                  {apiStatus || 'UNKNOWN'}
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Sezioni Informative */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Azioni Rapide
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Usa il menu laterale per navigare tra le diverse sezioni del sistema:
              </Typography>
              <Box component="ul" sx={{ mt: 2, pl: 2 }}>
                <li>Gestione Clienti e Bacini</li>
                <li>Buoni di Ritiro</li>
                {user?.role === 'ADMIN' && <li>Amministrazione Utenti</li>}
                <li>Profilo Utente</li>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Informazioni Sistema
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Sistema di Gestione Rifiuti conforme all'allegato tecnico ANCI-COREPLA.
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Versione:</strong> 0.1.0
                </Typography>
                <Typography variant="body2">
                  <strong>Ambiente:</strong> {import.meta.env.MODE || 'development'}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default Dashboard;