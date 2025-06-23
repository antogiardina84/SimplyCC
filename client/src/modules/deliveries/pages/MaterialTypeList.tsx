// client/src/modules/deliveries/pages/MaterialTypesList.tsx

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
  FormControlLabel,
  Switch,
  Tooltip,
  Card,
  CardContent,
  Collapse,
  Alert
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { materialTypesApi } from '../services/materialTypes.api';
import type { MaterialType, MaterialTypeHierarchy } from '../types/deliveries.types';

const MaterialTypesList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  // Query per le tipologie materiali gerarchiche
  const { data: hierarchicalTypes, isLoading, error } = useQuery({
    queryKey: ['materialTypesHierarchy'],
    queryFn: () => materialTypesApi.getHierarchy(),
    refetchOnWindowFocus: false,
  });

  // Query per tutte le tipologie (incluse inattive se richiesto)
  const { data: allTypes } = useQuery({
    queryKey: ['materialTypes', showInactive],
    queryFn: () => materialTypesApi.getAll({ includeInactive: showInactive }),
    refetchOnWindowFocus: false,
  });

  // Mutation per eliminazione
  const deleteMutation = useMutation({
    mutationFn: materialTypesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materialTypes'] });
      queryClient.invalidateQueries({ queryKey: ['materialTypesHierarchy'] });
    },
  });

  const handleDeleteMaterialType = async (id: string, name: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare la tipologia "${name}"?`)) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Errore durante l\'eliminazione:', error);
      }
    }
  };

  const toggleExpanded = (typeId: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(typeId)) {
      newExpanded.delete(typeId);
    } else {
      newExpanded.add(typeId);
    }
    setExpandedTypes(newExpanded);
  };

  const filteredTypes = allTypes?.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const renderTypeRow = (type: MaterialType, level = 0) => (
    <TableRow key={type.id} hover>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: level * 3 }}>
          {type.children && type.children.length > 0 && (
            <IconButton
              size="small"
              onClick={() => toggleExpanded(type.id)}
            >
              {expandedTypes.has(type.id) ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
          
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: type.color || '#666',
              flexShrink: 0
            }}
          />
          
          <Box>
            <Typography variant="body2" fontWeight={level === 0 ? 600 : 400}>
              {type.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {type.code}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      
      <TableCell>
        {type.description && (
          <Typography variant="body2" color="text.secondary">
            {type.description.length > 50 
              ? `${type.description.substring(0, 50)}...` 
              : type.description}
          </Typography>
        )}
      </TableCell>
      
      <TableCell align="center">
        <Chip label={type.unit} size="small" variant="outlined" />
      </TableCell>
      
      <TableCell>
        {type.reference && (
          <Chip 
            label={type.reference} 
            size="small" 
            color="primary" 
            variant="outlined" 
          />
        )}
      </TableCell>
      
      <TableCell align="center">
        <Chip
          label={type.isActive ? 'Attiva' : 'Inattiva'}
          size="small"
          color={type.isActive ? 'success' : 'default'}
          variant={type.isActive ? 'filled' : 'outlined'}
        />
      </TableCell>
      
      <TableCell align="center">
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          <Tooltip title="Visualizza">
            <IconButton size="small" color="info">
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Modifica">
            <IconButton
              size="small"
              color="primary"
              onClick={() => navigate(`/deliveries/material-types/${type.id}/edit`)}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Elimina">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDeleteMaterialType(type.id, type.name)}
              disabled={deleteMutation.isPending}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </TableCell>
    </TableRow>
  );

  const renderHierarchicalView = () => {
    if (!hierarchicalTypes) return null;

    return hierarchicalTypes.map((parentType: MaterialTypeHierarchy) => (
      <React.Fragment key={parentType.id}>
        {renderTypeRow(parentType, 0)}
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
            <Collapse in={expandedTypes.has(parentType.id)} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 1 }}>
                <Table size="small">
                  <TableBody>
                    {parentType.children?.map((childType: MaterialTypeHierarchy) =>
                      renderTypeRow(childType, 1)
                    )}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </React.Fragment>
    ));
  };

  const renderFlatView = () => {
    return filteredTypes.map(type => renderTypeRow(type, 0));
  };

  if (error) {
    return (
      <Container maxWidth="xl">
        <Alert severity="error" sx={{ mt: 2 }}>
          Errore nel caricamento delle tipologie materiali: {error instanceof Error ? error.message : 'Errore sconosciuto'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          🗂️ Tipologie Materiali
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gestisci le tipologie di materiali per i conferimenti
        </Typography>
      </Box>

      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              label="Cerca tipologie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                />
              }
              label="Mostra inattive"
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/deliveries/material-types/new')}
              >
                Nuova Tipologia
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Statistiche Rapide */}
      {allTypes && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {allTypes.filter(t => t.isActive).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tipologie Attive
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {allTypes.filter(t => !t.isActive).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tipologie Inattive
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {allTypes.filter(t => !t.parentId).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Categorie Principali
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {allTypes.filter(t => t.parentId).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sotto-tipologie
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabella */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tipologia</TableCell>
              <TableCell>Descrizione</TableCell>
              <TableCell align="center">Unità</TableCell>
              <TableCell>Riferimento</TableCell>
              <TableCell align="center">Stato</TableCell>
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
            ) : searchTerm ? (
              // Vista flat quando si sta cercando
              filteredTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Nessuna tipologia trovata
                  </TableCell>
                </TableRow>
              ) : (
                renderFlatView()
              )
            ) : (
              // Vista gerarchica quando non si sta cercando
              hierarchicalTypes && hierarchicalTypes.length > 0 ? (
                renderHierarchicalView()
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Nessuna tipologia trovata
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default MaterialTypesList;