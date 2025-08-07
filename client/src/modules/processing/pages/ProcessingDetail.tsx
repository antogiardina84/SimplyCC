// client/src/modules/processing/pages/ProcessingDetail.tsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { useNavigate, useParams } from 'react-router-dom';

import { processingService } from '../services/processingService';
import type { Processing } from '../types/processing.types';
import { SHIFTS } from '../types/processing.types';
import LoadingSpinner from '../../../core/components/LoadingSpinner';

const ProcessingDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [processing, setProcessing] = useState<Processing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProcessing = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await processingService.getById(id);
      setProcessing(data);
    } catch (err) {
      setError('Errore durante il caricamento della lavorazione');
      console.error('Error loading processing:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProcessing();
  }, [id]);

  const handleDelete = async () => {
    if (!processing || !window.confirm('Sei sicuro di voler eliminare questa lavorazione?')) {
      return;
    }

    try {
      await processingService.delete(processing.id);
      navigate('/processing');
    } catch (err) {
      setError('Errore durante l\'eliminazione della lavorazione');
      console.error('Error deleting processing:', err);
    }
  };

  const getShiftColor = (shift: string) => {
    switch (shift) {
      case 'MORNING': return 'primary';
      case 'AFTERNOON': return 'secondary';
      case 'NIGHT': return 'default';
      default: return 'default';
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('it-IT', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(num);
  };

  if (loading) return <LoadingSpinner />;

  if (!processing) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Lavorazione non trovata</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/processing')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Dettaglio Lavorazione
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/processing/${processing.id}/edit`)}
          >
            Modifica
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
          >
            Elimina
          </Button>
        </Box>
      </Box>

      {/* Messaggio di errore */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Informazioni Generali */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Informazioni Generali
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Data Lavorazione
              </Typography>
              <Typography variant="body1">
                {format(parseISO(processing.date), 'dd/MM/yyyy', { locale: it })}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Turno
              </Typography>
              <Chip
                label={SHIFTS[processing.shift as keyof typeof SHIFTS]}
                color={getShiftColor(processing.shift) as any}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Operatore
              </Typography>
              <Typography variant="body1">
                {/* Nota: relazione operator non disponibile nello schema attuale */}
                {processing.operatorId ? `Operatore ${processing.operatorId.substring(0, 8)}...` : 'Non assegnato'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Materiale in Ingresso */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Materiale in Ingresso
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Tipo Materiale
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {processing.inputMaterialType}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Peso Input
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {formatNumber(processing.inputWeight)} kg
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Riferimento
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {processing.inputReference}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Efficienza e Scarti */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Efficienza e Scarti
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Efficienza
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {processing.efficiency ? `${formatNumber(processing.efficiency)}%` : 'Non specificata'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Peso Scarti
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {processing.wasteWeight ? `${formatNumber(processing.wasteWeight)} kg` : 'Non specificato'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Prodotti in Uscita */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Prodotti in Uscita
          </Typography>
          {processing.outputs && processing.outputs.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tipo Materiale</TableCell>
                    <TableCell>Peso (kg)</TableCell>
                    <TableCell>Riferimento</TableCell>
                    <TableCell>Qualità</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {processing.outputs.map((output, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ fontWeight: 'medium' }}>
                        {output.outputMaterialType}
                      </TableCell>
                      <TableCell>
                        {formatNumber(output.outputWeight)} kg
                      </TableCell>
                      <TableCell>
                        {output.outputReference}
                      </TableCell>
                      <TableCell>
                        {output.quality || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              Nessun prodotto in uscita registrato
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Note */}
      {processing.notes && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Note
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {processing.notes}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Informazioni di Sistema */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Informazioni di Sistema
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Creato il
              </Typography>
              <Typography variant="body1">
                {format(parseISO(processing.createdAt), 'dd/MM/yyyy HH:mm', { locale: it })}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Ultimo aggiornamento
              </Typography>
              <Typography variant="body1">
                {format(parseISO(processing.updatedAt), 'dd/MM/yyyy HH:mm', { locale: it })}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProcessingDetail;