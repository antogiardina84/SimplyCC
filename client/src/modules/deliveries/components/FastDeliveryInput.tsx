// client/src/modules/deliveries/components/FastDeliveryInput.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Alert,
  Paper,
  Autocomplete,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Close,
  Add,
  Delete,
  Save,
  ContentCopy
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { contributorsApi } from '../services/contributors.api';
import { deliveriesApi } from '../services/deliveries.api';
import type { MaterialType, Contributor, CreateDeliveryData } from '../types/deliveries.types';

interface DeliveryRow {
  id: string;
  contributorId: string;
  contributor?: Contributor;
  weight: number | '';
  unit: string;
  quality: string;
  documentNumber: string;
  vehiclePlate: string;
  driverName: string;
  notes: string;
  errors: Partial<Record<string, string>>; // CORREZIONE: Partial per permettere undefined
}

interface FastDeliveryInputProps {
  open: boolean;
  date: string;
  materialType: MaterialType;
  onClose: () => void;
}

const FastDeliveryInput: React.FC<FastDeliveryInputProps> = ({ 
  open, 
  date, 
  materialType, 
  onClose 
}) => {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<DeliveryRow[]>([createEmptyRow()]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => {
        onClose();
        setSaveSuccess(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess, onClose]);

  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = tableContainerRef.current.scrollHeight;
    }
  }, [rows.length]);

  function createEmptyRow(): DeliveryRow {
    return {
      id: Math.random().toString(36).substr(2, 9),
      contributorId: '',
      weight: '',
      unit: materialType.unit,
      quality: '',
      documentNumber: '',
      vehiclePlate: '',
      driverName: '',
      notes: '',
      errors: {},
    };
  }

  // CORREZIONE: Usa getAll invece di getAllContributors
  const { data: contributors, isLoading: isLoadingContributors } = useQuery({
    queryKey: ['contributors', { isActive: true }],
    queryFn: () => contributorsApi.getAll({ isActive: true }),
  });

  const handleChange = (id: string, field: keyof DeliveryRow, value: any) => {
    setRows(prevRows =>
      prevRows.map(row =>
        row.id === id
          ? { 
              ...row, 
              [field]: value, 
              errors: { ...row.errors, [field]: undefined } // CORREZIONE: undefined è ora permesso
            }
          : row
      )
    );
  };

  const handleContributorChange = (id: string, contributor: Contributor | null) => {
    setRows(prevRows =>
      prevRows.map(row =>
        row.id === id
          ? { 
              ...row, 
              contributorId: contributor ? contributor.id : '', 
              contributor: contributor || undefined, 
              errors: { ...row.errors, contributorId: undefined } // CORREZIONE: undefined è ora permesso
            }
          : row
      )
    );
  };

  const addNewRow = () => {
    setRows(prevRows => [...prevRows, createEmptyRow()]);
  };

  const deleteRow = (id: string) => {
    setRows(prevRows => prevRows.filter(row => row.id !== id));
  };

  const validateRows = (): boolean => {
    let isValid = true;
    setRows(prev => prev.map(row => {
      const errors: Partial<Record<string, string>> = {}; // CORREZIONE: Partial
      if (!row.contributorId) {
        errors.contributorId = 'Conferitore obbligatorio';
        isValid = false;
      }
      if (Number(row.weight) <= 0) {
        errors.weight = 'Peso obbligatorio e > 0';
        isValid = false;
      }
      return { ...row, errors };
    }));
    return isValid;
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    if (!validateRows()) {
      setSaving(false);
      setSaveError('Correggi gli errori nelle righe prima di salvare.');
      return;
    }

    const validRows = rows.filter(row => row.contributorId && Number(row.weight) > 0);

    if (validRows.length === 0) {
      setSaving(false);
      setSaveError('Nessun conferimento valido da salvare.');
      return;
    }

    const deliveriesToSave: CreateDeliveryData[] = validRows.map(row => ({
      date: date, // CORREZIONE: usa date invece di deliveryDate
      materialTypeId: materialType.id,
      contributorId: row.contributorId,
      weight: parseFloat(row.weight as string),
      unit: materialType.unit,
      quality: row.quality || undefined,
      documentNumber: row.documentNumber || undefined,
      vehiclePlate: row.vehiclePlate || undefined,
      driverName: row.driverName || undefined,
      notes: row.notes || undefined,
    }));

    try {
      // CORREZIONE: Usa createBatch invece di createDeliveries
      await deliveriesApi.createBatch(deliveriesToSave);
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      setSaveSuccess(true);
      setRows([createEmptyRow()]);
    } catch (error) {
      console.error('Error saving fast deliveries:', error);
      setSaveError('Errore durante il salvataggio dei conferimenti.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Inserimento Rapido - {materialType.name}
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {saveSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Conferimenti salvati con successo!
          </Alert>
        )}
        {saveError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {saveError}
          </Alert>
        )}

        {isLoadingContributors ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ maxHeight: 400 }} ref={tableContainerRef}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '30%' }}>Conferitore</TableCell>
                  <TableCell sx={{ width: '15%' }}>Peso ({materialType.unit})</TableCell>
                  <TableCell sx={{ width: '15%' }}>Qualità</TableCell>
                  <TableCell sx={{ width: '15%' }}>Doc. Num.</TableCell>
                  <TableCell sx={{ width: '15%' }}>Targa Veicolo</TableCell>
                  <TableCell sx={{ width: '10%' }}>Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Autocomplete
                        options={contributors || []}
                        getOptionLabel={(option: Contributor) => option.name || ''}
                        isOptionEqualToValue={(option: Contributor, value: Contributor) => option.id === value.id}
                        value={contributors?.find((c: Contributor) => c.id === row.contributorId) || null}
                        onChange={(_, newValue) => handleContributorChange(row.id, newValue)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Seleziona Conferitore"
                            variant="outlined"
                            size="small"
                            error={!!row.errors.contributorId}
                            helperText={row.errors.contributorId}
                          />
                        )}
                        disablePortal
                        sx={{ minWidth: 200 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={row.weight}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            handleChange(row.id, 'weight', value);
                          }
                        }}
                        type="text"
                        label="Peso"
                        variant="outlined"
                        size="small"
                        error={!!row.errors.weight}
                        helperText={row.errors.weight}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={row.quality}
                        onChange={(e) => handleChange(row.id, 'quality', e.target.value)}
                        label="Qualità"
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={row.documentNumber}
                        onChange={(e) => handleChange(row.id, 'documentNumber', e.target.value)}
                        label="Num. Doc."
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={row.vehiclePlate}
                        onChange={(e) => handleChange(row.id, 'vehiclePlate', e.target.value)}
                        label="Targa"
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {rows.length > 1 && (
                          <Tooltip title="Elimina Riga">
                            <IconButton size="small" color="error" onClick={() => deleteRow(row.id)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {index === rows.length - 1 && (
                          <Tooltip title="Duplica Riga">
                            <IconButton 
                              size="small" 
                              onClick={() => {
                                setRows(prevRows => [...prevRows, {
                                  ...row,
                                  id: Math.random().toString(36).substr(2, 9),
                                  errors: {},
                                }]);
                              }}
                            >
                              <ContentCopy fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Riepilogo */}
        {rows.some(row => Number(row.weight) > 0) && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2">
              Riepilogo: {rows.filter(row => Number(row.weight) > 0).length} conferimenti •
              Totale: {rows.reduce((sum, row) => sum + (Number(row.weight) || 0), 0).toFixed(2)} {materialType.unit}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          startIcon={<Add />}
          onClick={addNewRow}
          variant="outlined"
        >
          Aggiungi Riga
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        <Button onClick={onClose} disabled={saving}>
          Annulla
        </Button>

        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={saving || rows.every(row => !row.contributorId && Number(row.weight) <= 0)}
        >
          {saving ? 'Salvataggio...' : 'Salva'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FastDeliveryInput;