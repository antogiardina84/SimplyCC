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
  TextField,
  Grid,
  IconButton,
  Tooltip,
  FormControlLabel,
  Switch,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Folder,
  Science,
  TableView,
  AccountTree
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { materialTypesApi } from '../services/materialTypes.api';
import type { MaterialTypeHierarchy } from '../types/deliveries.types';

const MaterialTypesList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'hierarchy'>('table');

  // Query per tipologie materiali
  const { data: materialTypes, isLoading } = useQuery({
    queryKey: ['materialTypes', showInactive],
    queryFn: () => materialTypesApi.getAll({ includeInactive: showInactive }),
    refetchOnWindowFocus: false,
  });

  // Query per struttura gerarchica
  const { data: hierarchicalTypes } = useQuery({
    queryKey: ['materialTypesHierarchy'],
    queryFn: () => materialTypesApi.getHierarchy(),
    refetchOnWindowFocus: false,
  });

  const filteredTypes = materialTypes?.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderHierarchyItem = (type: MaterialTypeHierarchy, level: number = 0) => (
    <Box key={type.id} sx={{ ml: level * 3 }}>
      <ListItem>
        <ListItemIcon>
          {type.children && type.children.length > 0 ? <Folder /> : <Science />}
        </ListItemIcon>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: type.color || '#666',
                }}
              />
              <Typography variant="body2" fontWeight={500}>
                {type.name}
              </Typography>
              <Chip
                label={type.code}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
              {type.reference && (
                <Chip
                  label={type.reference}
                  size="small"
                  color="info"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
            </Box>
          }
          secondary={type.description}
        />
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Modifica">
            <IconButton size="small" color="primary">
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Elimina">
            <IconButton size="small" color="error">
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </ListItem>
      
      {type.children && type.children.map(child => (
        <React.Fragment key={child.id}>
          {renderHierarchyItem(child, level + 1)}
        </React.Fragment>
      ))}
      
      {level === 0 && <Divider />}
    </Box>
  );

  return (
    <Container maxWidth="xl">
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          🗂️ Tipologie Materiali
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gestisci le tipologie di materiali e la loro struttura gerarchica
        </Typography>
      </Box>

      {/* Filtri e Controlli */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Cerca tipologia"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />
              }}
              size="small"
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
              label="Mostra disattive"
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              variant={viewMode === 'table' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('table')}
              size="small"
              fullWidth
              startIcon={<TableView />}
            >
              Tabella
            </Button>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              variant={viewMode === 'hierarchy' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('hierarchy')}
              size="small"
              fullWidth
              startIcon={<AccountTree />}
            >
              Gerarchia
            </Button>
          </Grid>

          <Grid item xs={12} md={1}>
            <Button
              variant="contained"
              startIcon={<Add />}
              size="small"
              fullWidth
            >
              Nuovo
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Vista Tabella */}
      {viewMode === 'table' && (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tipologia</TableCell>
                  <TableCell>Codice</TableCell>
                  <TableCell>Riferimento</TableCell>
                  <TableCell>Unità</TableCell>
                  <TableCell>CER</TableCell>
                  <TableCell>Gerarchia</TableCell>
                  <TableCell>Stato</TableCell>
                  <TableCell align="center">Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Caricamento...
                    </TableCell>
                  </TableRow>
                ) : filteredTypes?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Nessuna tipologia trovata
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTypes?.map((type) => (
                    <TableRow key={type.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              backgroundColor: type.color || '#666',
                            }}
                          />
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {type.name}
                            </Typography>
                            {type.description && (
                              <Typography variant="caption" color="text.secondary">
                                {type.description}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          label={type.code}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      
                      <TableCell>
                        {type.reference && (
                          <Chip
                            label={type.reference}
                            size="small"
                            color="info"
                          />
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {type.unit}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        {type.cerCode && (
                          <Typography variant="body2" fontFamily="monospace">
                            {type.cerCode}
                          </Typography>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {type.parent && (
                            <Chip
                              label={`Figlio di: ${type.parent.name}`}
                              size="small"
                              variant="outlined"
                              color="secondary"
                            />
                          )}
                          {type.children && type.children.length > 0 && (
                            <Chip
                              label={`${type.children.length} sottocat.`}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          )}
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          label={type.isActive ? 'Attiva' : 'Disattiva'}
                          size="small"
                          color={type.isActive ? 'success' : 'default'}
                          variant={type.isActive ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="Modifica">
                            <IconButton size="small" color="primary">
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Elimina">
                            <IconButton size="small" color="error">
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Vista Gerarchia */}
      {viewMode === 'hierarchy' && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Struttura Gerarchica
          </Typography>
          
          {hierarchicalTypes && hierarchicalTypes.length > 0 ? (
            <List>
              {hierarchicalTypes.map(type => renderHierarchyItem(type))}
            </List>
          ) : (
            <Typography color="text.secondary">
              Caricamento struttura gerarchica...
            </Typography>
          )}
        </Paper>
      )}

      {/* Statistiche Rapide */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">
              {materialTypes?.length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tipologie Totali
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {materialTypes?.filter(t => t.isActive).length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tipologie Attive
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="info.main">
              {materialTypes?.filter(t => !t.parentId).length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Categorie Principali
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">
              {materialTypes?.filter(t => t.parentId).length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sottocategorie
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MaterialTypesList;