import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  IconButton,
} from '@mui/material';
import {
  TrendingUp,
  LocalShipping,
  Assignment,
  Science,
  Refresh,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import api from '../../../core/services/api';

interface StatCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  color: string;
}

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

  const statCards: StatCard[] = [
    {
      title: 'Conferimenti Oggi',
      value: '24',
      change: '+12%',
      trend: 'up',
      icon: <LocalShipping />,
      color: '#4caf50',
    },
    {
      title: 'Buoni di Ritiro',
      value: '8',
      change: '+5%',
      trend: 'up',
      icon: <Assignment />,
      color: '#2196f3',
    },
    {
      title: 'Analisi Pendenti',
      value: '3',
      change: '-2%',
      trend: 'down',
      icon: <Science />,
      color: '#ff9800',
    },
    {
      title: 'Giacenze Totali',
      value: '1,245 t',
      change: '+8%',
      trend: 'up',
      icon: <TrendingUp />,
      color: '#9c27b0',
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 2, height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
              Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Panoramica generale del sistema di gestione rifiuti
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={`API: ${loading ? 'Checking...' : status}`}
              color={status === 'UP' ? 'success' : 'error'}
              variant="outlined"
              icon={loading ? <CircularProgress size={16} /> : undefined}
              sx={{ fontWeight: 500 }}
            />
            <IconButton 
              onClick={() => window.location.reload()}
              sx={{ 
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': { backgroundColor: 'primary.dark' }
              }}
            >
              <Refresh />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                      backgroundColor: `${card.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: card.color,
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {card.trend === 'up' ? (
                      <ArrowUpward sx={{ fontSize: 16, color: 'success.main' }} />
                    ) : (
                      <ArrowDownward sx={{ fontSize: 16, color: 'error.main' }} />
                    )}
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: card.trend === 'up' ? 'success.main' : 'error.main',
                        fontWeight: 600 
                      }}
                    >
                      {card.change}
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {card.value}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {card.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Recent Activities */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3, height: 400, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Attività Recenti
              </Typography>
              <Chip label="Oggi" size="small" variant="outlined" />
            </Box>
            
            <Box sx={{ flexGrow: 1, overflow: 'auto', pr: 1 }}>
              {[
                { time: '14:30', action: 'Nuovo conferimento registrato', client: 'Azienda Example Srl', type: 'conferimento' },
                { time: '13:15', action: 'Analisi merceologica completata', client: 'Bacino 2002048', type: 'analisi' },
                { time: '11:45', action: 'Buono di ritiro creato', client: 'Consorzio Verde SpA', type: 'ritiro' },
                { time: '10:20', action: 'Lavorazione completata', client: 'Lotto #1245', type: 'lavorazione' },
                { time: '09:15', action: 'Spedizione completata', client: 'Cliente ABC', type: 'spedizione' },
                { time: '08:30', action: 'Analisi validata', client: 'Bacino 2002051', type: 'analisi' },
              ].map((activity, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    p: 2,
                    mb: 1,
                    borderRadius: 2,
                    backgroundColor: 'grey.50',
                    '&:hover': { backgroundColor: 'grey.100' },
                    minHeight: 'auto',
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: activity.type === 'conferimento' ? 'success.main' :
                                     activity.type === 'analisi' ? 'info.main' :
                                     activity.type === 'ritiro' ? 'warning.main' : 
                                     activity.type === 'spedizione' ? 'secondary.main' : 'primary.main',
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 50, flexShrink: 0 }}>
                    {activity.time}
                  </Typography>
                  <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }} noWrap>
                      {activity.action}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {activity.client}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Quick Actions & Progress */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: 400 }}>
            {/* Progress Card */}
            <Paper sx={{ p: 3, borderRadius: 3, flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Obiettivi Mensili
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Conferimenti</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>78%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={78} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Analisi</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>92%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={92} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Spedizioni</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>65%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={65} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </Paper>

            {/* Alerts Card */}
            <Paper sx={{ p: 3, borderRadius: 3, flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Avvisi
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  backgroundColor: 'warning.lighter',
                  border: '1px solid',
                  borderColor: 'warning.light'
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.dark' }}>
                    Giacenza critica
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Materiale tipo A sotto soglia minima
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  backgroundColor: 'info.lighter',
                  border: '1px solid',
                  borderColor: 'info.light'
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'info.dark' }}>
                    Analisi in scadenza
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    3 analisi da completare entro domani
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;