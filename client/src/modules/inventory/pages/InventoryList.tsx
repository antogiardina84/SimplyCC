// client/src/modules/inventory/pages/InventoryList.tsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  TextField,
  Grid,
  Card,
  CardContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

import { inventoryService } from '../services/inventoryService';
import type { Inventory, InventoryFilters } from '../types/inventory.types';
import { MATERIAL_TYPES, REFERENCES } from '../types/inventory.types';
import LoadingSpinner from '../../../core/components/LoadingSpinner';

const InventoryList: React.FC = () => {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Paginazione
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filtri
  const [filters, setFilters] = useState<InventoryFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inventoryService.getAll(filters);
      setInventory(data);
    } catch (err) {
      setError('Errore durante il caricamento delle giacenze');
      console.error('Error loading inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [filters]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo movimento di giacenza?')) {
      try {
        await inventoryService.delete(id);
        await loadInventory();
      } catch (err) {
        setError('Errore durante l\'eliminazione del movimento');
        console.error('Error deleting inventory:', err);
      }
    }
  };

  const handleFilterChange = (field: keyof InventoryFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value || undefined,
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  // Filtra i dati in base alla ricerca
  const filteredInventory = inventory.filter(item =>
    searchTerm === '' ||
    item.materialType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginazione
  const paginatedInventory = filteredInventory.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getStockColor = (finalStock: number) => {
    if (finalStock < 0) return 'error';
    if (finalStock < 100) return 'warning';
    return 'success';
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('it-IT', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(num);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestione Giacenze
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ReportIcon />}
            onClick={() => navigate('/inventory/report')}
          >
            Report
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/inventory/new')}
          >
            Nuovo Movimento
          </Button>
        </Box>
      </Box>

      {/* Filtri */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Filtri di Ricerca
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Cerca"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type="date"
                label="Data Inizio"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type="date"
                label="Data Fine"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Materiale</InputLabel>
                <Select
                  value={filters.materialType || ''}
                  label="Materiale"
                  onChange={(e) => handleFilterChange('materialType', e.target.value)}
                >
                  <MenuItem value="">Tutti</MenuItem>
                  {MATERIAL_TYPES.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Riferimento</InputLabel>
                <Select
                  value={filters.reference || ''}
                  label="Riferimento"
                  onChange={(e) => handleFilterChange('reference', e.target.value)}
                >
                  <MenuItem value="">Tutti</MenuItem>
                  {REFERENCES.map(ref => (
                    <MenuItem key={ref} value={ref}>{ref}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1}>
              <Button
                variant="outlined"
                onClick={clearFilters}
                fullWidth
              >
                Pulisci
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Messaggio di errore */}
      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography>{error}</Typography>
        </Paper>
      )}

      {/* Tabella */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Materiale</TableCell>
              <TableCell>Riferimento</TableCell>
              <TableCell>Giacenza Iniziale</TableCell>
              <TableCell>Conferimenti</TableCell>
              <TableCell>Lavorazioni</TableCell>
              <TableCell>Spedizioni</TableCell>
              <TableCell>Correzioni</TableCell>
              <TableCell>Giacenza Finale</TableCell>
              <TableCell>Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedInventory.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>
                  {format(parseISO(item.date), 'dd/MM/yyyy', { locale: it })}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {item.materialTypeRel?.color && (
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: item.materialTypeRel.color,
                        }}
                      />
                    )}
                    {item.materialTypeRel?.name || item.materialType}
                  </Box>
                </TableCell>
                <TableCell>{item.reference}</TableCell>
                <TableCell>{formatNumber(item.initialStock)} kg</TableCell>
                <TableCell style={{ color: item.deliveries > 0 ? 'green' : undefined }}>
                  {item.deliveries > 0 ? `+${formatNumber(item.deliveries)}` : formatNumber(item.deliveries)} kg
                </TableCell>
                <TableCell style={{ color: item.processing > 0 ? 'orange' : undefined }}>
                  {item.processing > 0 ? `-${formatNumber(item.processing)}` : formatNumber(item.processing)} kg
                </TableCell>
                <TableCell style={{ color: item.shipments > 0 ? 'red' : undefined }}>
                  {item.shipments > 0 ? `-${formatNumber(item.shipments)}` : formatNumber(item.shipments)} kg
                </TableCell>
                <TableCell style={{ color: item.adjustments !== 0 ? (item.adjustments > 0 ? 'blue' : 'purple') : undefined }}>
                  {item.adjustments > 0 ? `+${formatNumber(item.adjustments)}` : formatNumber(item.adjustments)} kg
                </TableCell>
                <TableCell>
                  <Chip
                    label={`${formatNumber(item.finalStock)} kg`}
                    color={getStockColor(item.finalStock)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/inventory/${item.id}`)}
                    title="Visualizza"
                  >
                    <ViewIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/inventory/${item.id}/edit`)}
                    title="Modifica"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(item.id)}
                    title="Elimina"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <TablePagination
          component="div"
          count={filteredInventory.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Righe per pagina:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} di ${count !== -1 ? count : `più di ${to}`}`
          }
        />
      </TableContainer>
    </Box>
  );
};

export default InventoryList;