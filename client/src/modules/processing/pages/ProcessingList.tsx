// client/src/modules/processing/pages/ProcessingList.tsx

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
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

import { processingService } from '../services/processingService';
import type { Processing, ProcessingFilters } from '../types/processing.types';
import { SHIFTS } from '../types/processing.types';
import LoadingSpinner from '../../../core/components/LoadingSpinner';

const ProcessingList: React.FC = () => {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState<Processing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Paginazione
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filtri
  const [filters, setFilters] = useState<ProcessingFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  const loadProcessing = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await processingService.getAll(filters);
      setProcessing(data);
    } catch (err) {
      setError('Errore durante il caricamento delle lavorazioni');
      console.error('Error loading processing:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProcessing();
  }, [filters]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questa lavorazione?')) {
      try {
        await processingService.delete(id);
        await loadProcessing();
      } catch (err) {
        setError('Errore durante l\'eliminazione della lavorazione');
        console.error('Error deleting processing:', err);
      }
    }
  };

  const handleFilterChange = (field: keyof ProcessingFilters, value: string) => {
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
  const filteredProcessing = processing.filter(item =>
    searchTerm === '' ||
    item.inputMaterialType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.inputReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.operatorId && item.operatorId.toLowerCase().includes(searchTerm.toLowerCase())) ||
    item.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginazione
  const paginatedProcessing = filteredProcessing.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getShiftColor = (shift: string) => {
    switch (shift) {
      case 'MORNING': return 'primary';
      case 'AFTERNOON': return 'secondary';
      case 'NIGHT': return 'default';
      default: return 'default';
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Lavorazioni
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/processing/new')}
        >
          Nuova Lavorazione
        </Button>
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
                <InputLabel>Turno</InputLabel>
                <Select
                  value={filters.shift || ''}
                  label="Turno"
                  onChange={(e) => handleFilterChange('shift', e.target.value)}
                >
                  <MenuItem value="">Tutti</MenuItem>
                  {Object.entries(SHIFTS).map(([key, value]) => (
                    <MenuItem key={key} value={key}>{value}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                onClick={clearFilters}
                fullWidth
              >
                Pulisci Filtri
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
              <TableCell>Turno</TableCell>
              <TableCell>Operatore</TableCell>
              <TableCell>Materiale Input</TableCell>
              <TableCell>Peso Input (kg)</TableCell>
              <TableCell>Riferimento</TableCell>
              <TableCell>Efficienza %</TableCell>
              <TableCell>Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedProcessing.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>
                  {format(parseISO(item.date), 'dd/MM/yyyy', { locale: it })}
                </TableCell>
                <TableCell>
                  <Chip
                    label={SHIFTS[item.shift as keyof typeof SHIFTS]}
                    color={getShiftColor(item.shift) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {/* Nota: relazione operator non disponibile nello schema attuale */}
                  {item.operatorId ? `Operatore ${item.operatorId.substring(0, 8)}...` : 'Non assegnato'}
                </TableCell>
                <TableCell>{item.inputMaterialType}</TableCell>
                <TableCell>{item.inputWeight.toLocaleString()}</TableCell>
                <TableCell>{item.inputReference}</TableCell>
                <TableCell>
                  {item.efficiency ? `${item.efficiency.toFixed(1)}%` : '-'}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/processing/${item.id}`)}
                    title="Visualizza"
                  >
                    <ViewIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/processing/${item.id}/edit`)}
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
          count={filteredProcessing.length}
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

export default ProcessingList;