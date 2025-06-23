// client/src/modules/deliveries/pages/ContributorsList.tsx

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
  Visibility,
  Search,
  Person
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { contributorsApi } from '../services/contributors.api';
import { materialTypesApi } from '../services/materialTypes.api';
import type { ContributorFilters } from '../types/deliveries.types';

const ContributorsList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [materialTypeFilter, setMaterialTypeFilter] = useState('');

  // Query per i conferitori
  const { data: contributors, isLoading, refetch } = useQuery({
    queryKey: ['contributors', searchTerm, statusFilter, materialTypeFilter],
    queryFn: () => {
      const filters: ContributorFilters = {};
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter === 'active') filters.isActive = true;
      if (statusFilter === 'inactive') filters.isActive = false;
      if (materialTypeFilter) filters.materialTypeCode = materialTypeFilter;
      
      return contributorsApi.getAll(filters);
    },
    refetchOnWindowFocus: false,
  });

  // Query per le tipologie materiali
  const { data: materialTypes } = useQuery({
    queryKey: ['materialTypes'],
    queryFn: () => materialTypesApi.getAll(),
    refetchOnWindowFocus: false,
  });

  const handleDeleteContributor = async (contributorId: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo conferitore?')) {
      try {
        await contributorsApi.delete(contributorId);
        refetch();
      } catch (error) {
        console.error('Errore nella cancellazione:', error);
      }
    }
  };

  return (
    <Container maxWidth="xl">
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          👥 Lista Conferitori
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gestisci tutti i conferitori registrati nel sistema
        </Typography>
      </Box>

      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Cerca conferitori..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />
              }}
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
                <MenuItem value="active">Attivi</MenuItem>
                <MenuItem value="inactive">Disattivi</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipologia Autorizzata</InputLabel>
              <Select
                value={materialTypeFilter}
                label="Tipologia Autorizzata"
                onChange={(e) => setMaterialTypeFilter(e.target.value)}
              >
                <MenuItem value="">Tutte</MenuItem>
                {materialTypes?.map((type) => (
                  <MenuItem key={type.code} value={type.code}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/deliveries/contributors/new')}
              size="small"
              fullWidth
            >
              Nuovo
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabella */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Conferitore</TableCell>
              <TableCell>Contatti</TableCell>
              <TableCell>Bacino</TableCell>
              <TableCell>Tipologie Autorizzate</TableCell>
              <TableCell>Stato</TableCell>
              <TableCell align="center">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Caricamento...
                </TableCell>
              </TableRow>
            ) : contributors?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Nessun conferitore trovato
                </TableCell>
              </TableRow>
            ) : (
              contributors?.map((contributor) => {
                // CORREZIONE: Aggiunto punto e virgola qui
                const authorizedTypes = JSON.parse(contributor.authorizedMaterialTypes || '[]');
                
                return (
                  <TableRow key={contributor.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person color="action" />
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {contributor.name}
                          </Typography>
                          {contributor.vatNumber && (
                            <Typography variant="caption" color="text.secondary">
                              P.IVA: {contributor.vatNumber}
                            </Typography>
                          )}
                          {contributor.fiscalCode && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              CF: {contributor.fiscalCode}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box>
                        {contributor.city && (
                          <Typography variant="body2">
                            📍 {contributor.city}
                          </Typography>
                        )}
                        {contributor.phone && (
                          <Typography variant="caption" color="text.secondary">
                            📞 {contributor.phone}
                          </Typography>
                        )}
                        {contributor.email && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            ✉️ {contributor.email}
                          </Typography>
                        )}
                        {contributor.contactPerson && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            👤 {contributor.contactPerson}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      {contributor.basin ? (
                        <Chip
                          label={`${contributor.basin.code} - ${contributor.basin.description || 'N/A'}`}
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Nessun bacino
                        </Typography>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {authorizedTypes.length > 0 ? (
                          authorizedTypes.slice(0, 3).map((typeCode: string) => {
                            const materialType = materialTypes?.find(mt => mt.code === typeCode);
                            return (
                              <Chip
                                key={typeCode}
                                label={materialType?.name || typeCode}
                                size="small"
                                sx={{
                                  backgroundColor: materialType?.color || '#666',
                                  color: 'white',
                                  fontSize: '0.7rem'
                                }}
                              />
                            );
                          })
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            Nessuna tipologia
                          </Typography>
                        )}
                        {authorizedTypes.length > 3 && (
                          <Chip
                            label={`+${authorizedTypes.length - 3}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={contributor.isActive ? 'Attivo' : 'Disattivo'}
                        size="small"
                        color={contributor.isActive ? 'success' : 'default'}
                        variant={contributor.isActive ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="Visualizza">
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => navigate(`/deliveries/contributors/${contributor.id}`)}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Modifica">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => navigate(`/deliveries/contributors/${contributor.id}/edit`)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Elimina">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteContributor(contributor.id)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Statistiche Rapide */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">
              {contributors?.length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Conferitori Totali
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {contributors?.filter(c => c.isActive).length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Conferitori Attivi
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="info.main">
              {contributors?.filter(c => c.basin).length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Con Bacino Assegnato
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">
              {materialTypes?.length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tipologie Disponibili
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ContributorsList;