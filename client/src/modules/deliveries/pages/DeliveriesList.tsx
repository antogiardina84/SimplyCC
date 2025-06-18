// client/src/modules/deliveries/pages/DeliveriesList.tsx

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  CheckCircle,
  Visibility,
  CalendarToday
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { deliveriesApi } from '../services/deliveries.api';
import { materialTypesApi } from '../services/materialTypes.api';
import type { MaterialType } from '../types/deliveries.types';

const DeliveriesList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [materialTypeFilter, setMaterialTypeFilter] = useState('');

  // Query per i conferimenti
  const { data: deliveries, isLoading, refetch } = useQuery({
    queryKey: ['deliveries', searchTerm, statusFilter, materialTypeFilter],
    queryFn: () => deliveriesApi.getAll({
      materialTypeId: materialTypeFilter || undefined,
      isValidated: statusFilter === 'validated' ? true : statusFilter === 'pending' ? false : undefined
    }),
    refetchOnWindowFocus: false,
  });

  // Query per le tipologie materiali
  const { data: materialTypes } = useQuery({
    queryKey: ['materialTypes'],
    queryFn: () => materialTypesApi.getAll(),
    refetchOnWindowFocus: false,
  });

  const handleValidateDelivery = async (deliveryId: string) => {
    try {
      await deliveriesApi.validate(deliveryId);
      refetch();
    } catch (error) {
      console.error('Errore nella validazione:', error);
    }
  };

  const handleDeleteDelivery = async (deliveryId: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo conferimento?')) {
      try {
        await deliveriesApi.delete(deliveryId);
        refetch();
      } catch (error) {
        console.error('Errore nella cancellazione:', error);
      }
    }
  };

  const getMaterialTypeColor = (materialTypeId: string) => {
    const materialType = materialTypes?.find(mt => mt.id === materialTypeId);
    return materialType?.color || '#666';
  };

  const getMaterialTypeName = (materialTypeId: string) => {
    const materialType = materialTypes?.find(mt => mt.id === materialTypeId);
    return materialType?.name || 'N/A';
  };

  const filteredDeliveries = deliveries?.filter(delivery => {
    const matchesSearch = delivery.contributor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  return (
    <Container maxWidth="xl">
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          📋 Lista Conferimenti
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gestisci tutti i conferimenti registrati nel sistema
        </Typography>
      </Box>

      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Cerca conferimenti..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Stato</InputLabel>
              <Select
                value={statusFilter}
                label="Stato"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">Tutti</MenuItem>
                <MenuItem value="pending">Da Validare</MenuItem>
                <MenuItem value="validated">Validati</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipologia</InputLabel>
              <Select
                value={materialTypeFilter}
                label="Tipologia"
                onChange={(e) => setMaterialTypeFilter(e.target.value)}
              >
                <MenuItem value="">Tutte</MenuItem>
                {materialTypes?.map((type: MaterialType) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/deliveries/calendar')}
                size="small"
              >
                Nuovo
              </Button>
              
              <Tooltip title="Calendario">
                <IconButton
                  onClick={() => navigate('/deliveries/calendar')}
                  color="primary"
                >
                  <CalendarToday />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabella */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Conferitore</TableCell>
              <TableCell>Tipologia</TableCell>
              <TableCell align="right">Peso</TableCell>
              <TableCell>Qualità</TableCell>
              <TableCell>Stato</TableCell>
              <TableCell align="center">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Caricamento...
                </TableCell>
              </TableRow>
            ) : filteredDeliveries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Nessun conferimento trovato
                </TableCell>
              </TableRow>
            ) : (
              filteredDeliveries.map((delivery) => (
                <TableRow key={delivery.id} hover>
                  <TableCell>
                    {format(new Date(delivery.date), 'dd/MM/yyyy', { locale: it })}
                  </TableCell>
                  
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {delivery.contributor.name}
                      </Typography>
                      {delivery.contributor.city && (
                        <Typography variant="caption" color="text.secondary">
                          {delivery.contributor.city}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={getMaterialTypeName(delivery.materialTypeId)}
                      size="small"
                      sx={{
                        backgroundColor: getMaterialTypeColor(delivery.materialTypeId),
                        color: 'white',
                        fontWeight: 500
                      }}
                    />
                  </TableCell>
                  
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={500}>
                      {delivery.weight.toFixed(2)} {delivery.unit}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    {delivery.quality && (
                      <Chip
                        label={delivery.quality}
                        size="small"
                        color={
                          delivery.quality === 'OTTIMA' ? 'success' :
                          delivery.quality === 'BUONA' ? 'info' : 'warning'
                        }
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={delivery.isValidated ? 'Validato' : 'Da Validare'}
                      size="small"
                      color={delivery.isValidated ? 'success' : 'warning'}
                      variant={delivery.isValidated ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <Tooltip title="Visualizza">
                        <IconButton size="small" color="info">
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {!delivery.isValidated && (
                        <Tooltip title="Valida">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleValidateDelivery(delivery.id)}
                          >
                            <CheckCircle fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      <Tooltip title="Modifica">
                        <IconButton size="small" color="primary">
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {!delivery.isValidated && (
                        <Tooltip title="Elimina">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteDelivery(delivery.id)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default DeliveriesList;