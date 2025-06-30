// client/src/modules/deliveries/pages/MaterialTypesList.tsx - VERSIONE PULITA

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
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Refresh,
  BugReport,
  CheckCircle,
  ErrorOutline
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { materialTypesApi } from '../services/materialTypes.api';

// ===============================
// INTERFACES LOCALI
// ===============================

interface LocalMaterialType {
  id: string;
  code: string;
  name: string;
  description?: string;
  unit: string;
  cerCode?: string;
  reference?: string;
  color?: string;
  sortOrder: number;
  parentId?: string;
  parent?: LocalMaterialType;
  children?: LocalMaterialType[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MaterialTypesFilters {
  includeInactive?: boolean;
  isParent?: boolean;
}

// ===============================
// COMPONENTE PRINCIPALE
// ===============================

const MaterialTypesList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Stati locali
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [showDebugDialog, setShowDebugDialog] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Funzione helper per ottenere il messaggio di errore
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'object' && error !== null && 'message' in error) {
      return String(error.message);
    }
    return 'Errore sconosciuto';
  };

  // ===============================
  // QUERIES
  // ===============================

  // Query per tutte le tipologie con gestione errori migliorata
  const {
    data: allTypes,
    isLoading,
    error,
    refetch,
    isError
  } = useQuery({
    queryKey: ['materialTypes', showInactive],
    queryFn: async (): Promise<LocalMaterialType[]> => {
      console.log('🔍 Fetching material types...');
      try {
        const filters: MaterialTypesFilters = { includeInactive: showInactive };
        const result = await materialTypesApi.getAll(filters);
        console.log('✅ Material types fetched successfully:', result.length);
        setDebugInfo(`✅ ${result.length} tipologie caricate con successo`);
        return result;
      } catch (error: unknown) {
        console.error('❌ Error in material types query:', error);
        const errorMessage = getErrorMessage(error);
        setDebugInfo(`❌ Errore: ${errorMessage}`);
        throw error;
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
  });

  // ===============================
  // MUTATIONS
  // ===============================

  // Mutation per eliminazione
  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      console.log('🗑️ Deleting material type:', id);
      setDebugInfo(`🗑️ Eliminazione tipologia ${id} in corso...`);
      return materialTypesApi.delete(id);
    },
    onSuccess: () => {
      console.log('✅ Material type deleted successfully');
      setDebugInfo('✅ Tipologia eliminata con successo');
      queryClient.invalidateQueries({ queryKey: ['materialTypes'] });
    },
    onError: (error: unknown) => {
      console.error('❌ Delete mutation failed:', error);
      const errorMessage = getErrorMessage(error);
      setDebugInfo(`❌ Errore eliminazione: ${errorMessage}`);
      alert(`Errore durante l'eliminazione: ${errorMessage}`);
    },
  });

  // Test di connettività
  const testMutation = useMutation({
    mutationFn: () => {
      console.log('🔍 Testing API connection...');
      setDebugInfo('🔍 Test connessione in corso...');
      return materialTypesApi.testConnection();
    },
    onSuccess: (result) => {
      const message = result
        ? '✅ Connessione API riuscita!'
        : '❌ Test connessione fallito';
      setDebugInfo(message);
      alert(message);
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorMessage(error);
      const message = `❌ Test connessione fallito: ${errorMessage}`;
      setDebugInfo(message);
      alert(message);
    },
  });

  // ===============================
  // HANDLERS
  // ===============================

  // ✅ HANDLER NAVIGAZIONE CORRETTO
  const handleCreateNew = () => {
    const timestamp = new Date().toLocaleTimeString();

    console.log('='.repeat(50));
    console.log('🔄 handleCreateNew chiamato alle:', timestamp);
    console.log('📍 URL corrente:', window.location.href);
    console.log('🎯 Target URL: /deliveries/material-types/new');

    const debugMessage = `[${timestamp}] Tentativo navigazione verso nuovo form...`;
    setDebugInfo(debugMessage);

    try {
      // Test preliminare del router
      if (typeof navigate !== 'function') {
        throw new Error('Navigate function non disponibile');
      }

      // Effettua la navigazione
      navigate('/deliveries/material-types/new');

      console.log('✅ navigate() chiamato con successo');
      setDebugInfo(prev => prev + ` -> navigate() eseguito con successo`);

      // Verifica dopo un breve delay
      setTimeout(() => {
        console.log('📍 URL dopo navigate:', window.location.href);
        console.log('='.repeat(50));
      }, 100);

    } catch (error: unknown) {
      console.error('❌ Errore durante navigate():', error);
      const errorMessage = getErrorMessage(error);
      setDebugInfo(prev => prev + ` -> ERRORE: ${errorMessage}`);
      alert(errorMessage);
    }
  };

  // ✅ HANDLER per modifica
  const handleEdit = (id: string) => {
    console.log('🔄 Editing material type:', id);
    setDebugInfo(`🔄 Navigazione verso modifica tipologia ${id}`);
    try {
      navigate(`/deliveries/material-types/${id}/edit`);
      console.log('✅ Edit navigation successful');
    } catch (error: unknown) {
      console.error('❌ Edit navigation failed:', error);
      const errorMessage = getErrorMessage(error);
      setDebugInfo(`❌ Errore navigazione modifica: ${errorMessage}`);
      alert('Errore durante la navigazione alla modifica: ' + errorMessage);
    }
  };

  // ✅ HANDLER per visualizzazione
  const handleView = (id: string) => {
    console.log('👁️ Viewing material type:', id);
    setDebugInfo(`👁️ Vista dettagli tipologia ${id}`);
    // Per ora solo log, in futuro implementare vista dettagli
    alert(`Vista dettagli per tipologia ${id} - Da implementare`);
  };

  // ✅ HANDLER per eliminazione
  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare la tipologia "${name}"?\n\nQuesta azione non può essere annullata.`)) {
      try {
        console.log('🗑️ Deleting material type:', id, name);
        await deleteMutation.mutateAsync(id);
        console.log('✅ Material type deleted successfully');
      } catch (error: unknown) {
        console.error('❌ Delete failed:', error);
        // L'errore è già gestito nella mutation onError
      }
    }
  };

  // ✅ HANDLER per test connessione
  const handleTestConnection = async () => {
    console.log('🔍 Testing API connection...');
    setDebugInfo('Testing connessione API...');
    await testMutation.mutateAsync();
  };

  // ✅ HANDLER per refresh
  const handleRefresh = () => {
    console.log('🔄 Refreshing material types...');
    setDebugInfo('Aggiornamento lista...');
    refetch();
  };

  // ===============================
  // DATA PROCESSING
  // ===============================

  // Filtro materiali
  const filteredTypes = allTypes?.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // ===============================
  // RENDER CONDITIONS
  // ===============================

  // ✅ GESTIONE ERRORI MIGLIORATA
  if (isError && error) {
    return (
      <Container maxWidth="xl">
        <Alert
          severity="error"
          sx={{ mt: 2 }}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button color="inherit" size="small" onClick={() => refetch()}>
                Riprova
              </Button>
              <Button color="inherit" size="small" onClick={handleTestConnection}>
                Test API
              </Button>
            </Box>
          }
        >
          <Typography variant="h6" gutterBottom>
            ❌ Errore nel caricamento delle tipologie materiali
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Errore:</strong> {getErrorMessage(error)}
          </Typography>
          <Typography variant="body2">
            <strong>Possibili cause:</strong>
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>Backend non avviato (controllare http://localhost:4000)</li>
            <li>Endpoint /api/deliveries/material-types non disponibile</li>
            <li>Errore di connessione al database PostgreSQL</li>
            <li>Problema di autenticazione (token scaduto)</li>
            <li>CORS non configurato correttamente</li>
          </ul>
        </Alert>

        {/* Debug Panel per errori */}
        <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.100' }}>
          <Typography variant="subtitle2" gutterBottom>
            🔧 Debug Information
          </Typography>
          <Typography variant="body2" component="div" sx={{ fontFamily: 'monospace' }}>
            URL Frontend: {window.location.href}<br/>
            Backend URL: {process.env.REACT_APP_API_URL || 'http://localhost:4000'}<br/>
            Error Type: {error instanceof Error ? error.constructor.name : 'Unknown'}<br/>
            Error Details: {JSON.stringify(error, null, 2)}
          </Typography>
        </Paper>
      </Container>
    );
  }

  // ===============================
  // MAIN RENDER
  // ===============================

  return (
    <Container maxWidth="xl">
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          🗂️ Tipologie Materiali
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gestisci le tipologie di materiali per i conferimenti del sistema
        </Typography>
      </Box>

      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Ricerca */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Cerca tipologie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nome, codice o descrizione..."
            />
          </Grid>

          {/* Switch inattive */}
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

          {/* Azioni */}
          <Grid item xs={12} md={5}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateNew}
                size="small"
                color="primary"
                sx={{ minWidth: 140 }}
              >
                Nuova Tipologia
              </Button>

              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleRefresh}
                size="small"
                disabled={isLoading}
              >
                {isLoading ? 'Caricando...' : 'Ricarica'}
              </Button>

              <Button
                variant="outlined"
                startIcon={<BugReport />}
                onClick={() => setShowDebugDialog(true)}
                size="small"
                color="secondary"
              >
                Debug
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Status Bar */}
      <Paper sx={{ p: 1, mb: 3, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isLoading ? (
              <>
                <CircularProgress size={16} />
                Caricamento tipologie materiali...
              </>
            ) : (
              <>
                <CheckCircle color="success" fontSize="small" />
                {allTypes?.length || 0} tipologie caricate ({filteredTypes.length} visualizzate)
              </>
            )}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            {debugInfo && `Debug: ${debugInfo}`}
          </Typography>
        </Box>
      </Paper>

      {/* Statistiche Rapide */}
      {allTypes && allTypes.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
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
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
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
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
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
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
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
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    <CircularProgress size={24} />
                    <Typography>Caricamento tipologie materiali...</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : filteredTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    {allTypes?.length === 0 ? (
                      <>
                        <ErrorOutline sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          Nessuna tipologia materiale presente
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Inizia creando la prima tipologia di materiale per il sistema
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<Add />}
                          onClick={handleCreateNew}
                        >
                          Crea Prima Tipologia
                        </Button>
                      </>
                    ) : (
                      <>
                        <Typography variant="h6" color="text.secondary">
                          🔍 Nessuna tipologia trovata
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Prova a modificare i filtri di ricerca
                        </Typography>
                      </>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredTypes.map((type) => (
                <TableRow key={type.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          backgroundColor: type.color || '#666',
                          flexShrink: 0,
                          border: '1px solid rgba(0,0,0,0.1)'
                        }}
                      />
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {type.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {type.code}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell>
                    {type.description ? (
                      <Typography variant="body2" color="text.secondary">
                        {type.description.length > 50
                          ? `${type.description.substring(0, 50)}...`
                          : type.description}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.disabled" fontStyle="italic">
                        Nessuna descrizione
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell align="center">
                    <Chip
                      label={type.unit}
                      size="small"
                      variant="outlined"
                      sx={{ minWidth: 40 }}
                    />
                  </TableCell>

                  <TableCell>
                    {type.reference ? (
                      <Chip
                        label={type.reference}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ) : (
                      <Typography variant="caption" color="text.disabled" fontStyle="italic">
                        Nessun riferimento
                      </Typography>
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
                      <Tooltip title="Visualizza dettagli">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleView(type.id)}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Modifica tipologia">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEdit(type.id)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Elimina tipologia">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(type.id, type.name)}
                          disabled={deleteMutation.isPending}
                        >
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

      {/* Debug Dialog */}
      <Dialog
        open={showDebugDialog}
        onClose={() => setShowDebugDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>🔧 Informazioni Debug</DialogTitle>
        <DialogContent>
          <Box sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
            <Typography variant="subtitle2" gutterBottom>Sistema:</Typography>
            <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
              URL Corrente: {window.location.href}<br/>
              Backend URL: {process.env.REACT_APP_API_URL || 'http://localhost:4000'}<br/>
              Navigate Function: {typeof navigate}<br/>
              Material Types Loaded: {allTypes?.length || 0}<br/>
              Loading State: {isLoading.toString()}<br/>
              Error State: {isError.toString()}
            </Box>

            <Typography variant="subtitle2" gutterBottom>Routes Target:</Typography>
            <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
              Lista: /deliveries/material-types<br/>
              Nuovo: /deliveries/material-types/new<br/>
              Modifica: /deliveries/material-types/:id/edit
            </Box>

            <Typography variant="subtitle2" gutterBottom>API Endpoints:</Typography>
            <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
              GET: /api/deliveries/material-types<br/>
              POST: /api/deliveries/material-types<br/>
              PUT: /api/deliveries/material-types/:id<br/>
              DELETE: /api/deliveries/material-types/:id
            </Box>

            <Typography variant="subtitle2" gutterBottom>Debug Log:</Typography>
            <Box sx={{ p: 1, bgcolor: 'grey.100', borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
              {debugInfo || 'Nessuna informazione debug disponibile'}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTestConnection} disabled={testMutation.isPending}>
            {testMutation.isPending ? 'Testing...' : 'Test API'}
          </Button>
          <Button onClick={() => setShowDebugDialog(false)}>
            Chiudi
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MaterialTypesList;