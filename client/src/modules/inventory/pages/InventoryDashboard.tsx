// client/src/modules/inventory/pages/InventoryDashboard.tsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { format, subDays } from 'date-fns';
import { it } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

import { inventoryService } from '../services/inventoryService';
import type { InventoryStats, InventoryReport } from '../types/inventory.types';
import { MATERIAL_TYPES, REFERENCES } from '../types/inventory.types';
import LoadingSpinner from '../../../core/components/LoadingSpinner';

const InventoryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Statistiche
  const [stats, setStats] = useState<InventoryStats | null>(null);
  
  // Report
  const [report, setReport] = useState<InventoryReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  
  // Filtri per il report
  const [reportFilters, setReportFilters] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    materialType: '',
  });

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inventoryService.getStats();
      setStats(data);
    } catch (err) {
      setError('Errore durante il caricamento delle statistiche');
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReport = async () => {
    try {
      setReportLoading(true);
      const data = await inventoryService.getReport(
        reportFilters.startDate,
        reportFilters.endDate,
        reportFilters.materialType || undefined
      );
      setReport(data);
    } catch (err) {
      setError('Errore durante la generazione del report');
      console.error('Error loading report:', err);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadReport();
  }, []);

  const handleFilterChange = (field: string, value: string) => {
    setReportFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '0';
    return new Intl.NumberFormat('it-IT', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(num);
  };

  const getStockColor = (stock: number) => {
    if (stock < 0) return 'error';
    if (stock < 100) return 'warning';
    return 'success';
  };

  const exportReport = () => {
    if (!report) return;
    
    // Implementazione semplificata dell'export CSV
    const csvData = [
      ['Materiale', 'Riferimento', 'Tot. Conferimenti', 'Tot. Lavorazioni', 'Tot. Spedizioni', 'Tot. Correzioni', 'Giacenza Finale'],
      ...report.summary.map(item => [
        item.materialType,
        item.reference,
        item.totalDeliveries,
        item.totalProcessing,
        item.totalShipments,
        item.totalAdjustments,
        item.finalStock,
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_giacenze_${reportFilters.startDate}_${reportFilters.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/inventory')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Report Giacenze
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => { loadStats(); loadReport(); }}
          >
            Aggiorna
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={exportReport}
            disabled={!report}
          >
            Esporta CSV
          </Button>
        </Box>
      </Box>

      {/* Messaggio di errore */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistiche Generali */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <InventoryIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Giacenze Correnti</Typography>
                </Box>
                <Typography variant="h4" color="primary">
                  {stats.currentStocks.reduce((sum, item) => sum + (item._sum.finalStock || 0), 0).toLocaleString()} kg
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Totale giacenze attuali
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6">Conferimenti Mese</Typography>
                </Box>
                <Typography variant="h4" color="success.main">
                  {formatNumber(stats.monthlyMovements._sum.deliveries)} kg
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Materiale ricevuto questo mese
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingDownIcon color="error" sx={{ mr: 1 }} />
                  <Typography variant="h6">Spedizioni Mese</Typography>
                </Box>
                <Typography variant="h4" color="error.main">
                  {formatNumber(stats.monthlyMovements._sum.shipments)} kg
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Materiale spedito questo mese
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filtri Report */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Filtri Report Dettagliato
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Data Inizio"
                value={reportFilters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Data Fine"
                value={reportFilters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Tipo Materiale</InputLabel>
                <Select
                  value={reportFilters.materialType}
                  label="Tipo Materiale"
                  onChange={(e) => handleFilterChange('materialType', e.target.value)}
                >
                  <MenuItem value="">Tutti</MenuItem>
                  {MATERIAL_TYPES.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={loadReport}
                disabled={reportLoading}
              >
                {reportLoading ? 'Generazione...' : 'Genera Report'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Dettaglio per Materiale */}
      {stats && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Giacenze per Tipo Materiale
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Materiale</TableCell>
                    <TableCell>Riferimento</TableCell>
                    <TableCell>Giacenza Attuale</TableCell>
                    <TableCell>Stato</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.currentStocks.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ fontWeight: 'medium' }}>
                        {item.materialType}
                      </TableCell>
                      <TableCell>{item.reference}</TableCell>
                      <TableCell>
                        {formatNumber(item._sum.finalStock)} kg
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            (item._sum.finalStock || 0) < 0 ? 'Negativa' :
                            (item._sum.finalStock || 0) < 100 ? 'Bassa' : 'Normale'
                          }
                          color={getStockColor(item._sum.finalStock || 0)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Report Dettagliato */}
      {report && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Report Dettagliato ({format(new Date(reportFilters.startDate), 'dd/MM/yyyy')} - {format(new Date(reportFilters.endDate), 'dd/MM/yyyy')})
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Materiale</TableCell>
                    <TableCell>Riferimento</TableCell>
                    <TableCell>Tot. Conferimenti</TableCell>
                    <TableCell>Tot. Lavorazioni</TableCell>
                    <TableCell>Tot. Spedizioni</TableCell>
                    <TableCell>Tot. Correzioni</TableCell>
                    <TableCell>Giacenza Finale</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.summary.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ fontWeight: 'medium' }}>
                        {item.materialType}
                      </TableCell>
                      <TableCell>{item.reference}</TableCell>
                      <TableCell style={{ color: item.totalDeliveries > 0 ? 'green' : undefined }}>
                        {formatNumber(item.totalDeliveries)} kg
                      </TableCell>
                      <TableCell style={{ color: item.totalProcessing > 0 ? 'orange' : undefined }}>
                        {formatNumber(item.totalProcessing)} kg
                      </TableCell>
                      <TableCell style={{ color: item.totalShipments > 0 ? 'red' : undefined }}>
                        {formatNumber(item.totalShipments)} kg
                      </TableCell>
                      <TableCell style={{ color: item.totalAdjustments !== 0 ? (item.totalAdjustments > 0 ? 'blue' : 'purple') : undefined }}>
                        {item.totalAdjustments > 0 ? '+' : ''}{formatNumber(item.totalAdjustments)} kg
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${formatNumber(item.finalStock)} kg`}
                          color={getStockColor(item.finalStock)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default InventoryDashboard;