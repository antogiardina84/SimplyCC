// client/src/modules/deliveries/pages/DeliveriesCalendar.tsx

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Add,
  TodayOutlined,
  Assessment
} from '@mui/icons-material';
import { format, addMonths, subMonths } from 'date-fns';
import { it } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import CalendarGrid from '../components/CalendarGrid';
import DayDetailModal from '../components/DayDetailModal';
import DeliveryStatsCard from '../components/DeliveryStatsCard';
import { deliveriesApi } from '../services/deliveries.api';
import { materialTypesApi } from '../services/materialTypes.api';
import type { MaterialType, MonthlyCalendarData } from '../types/deliveries.types';

const DeliveriesCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [materialTypeFilter, setMaterialTypeFilter] = useState<string>('');
  const [showDayModal, setShowDayModal] = useState(false);

  // Calcola anno e mese corrente
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // Query per i dati del calendario
  const { data: calendarData, isLoading: isLoadingCalendar, error: calendarError } = useQuery({
    queryKey: ['calendar', year, month, materialTypeFilter],
    queryFn: () => deliveriesApi.getMonthlyCalendar(year, month, materialTypeFilter),
    refetchOnWindowFocus: false,
  });

  // Query per le tipologie materiali
  const { data: materialTypes, isLoading: isLoadingMaterialTypes } = useQuery({
    queryKey: ['materialTypes'],
    queryFn: () => materialTypesApi.getAll(),
    refetchOnWindowFocus: false,
  });

  // Handler per navigazione mesi
  const handlePreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Handler per click su giorno
  const handleDayClick = (date: string) => {
    setSelectedDate(date);
    setShowDayModal(true);
  };

  // Handler per chiusura modal
  const handleCloseModal = () => {
    setShowDayModal(false);
    setSelectedDate(null);
  };

  // Handler per aggiungere conferimento
  const handleAddDelivery = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    setShowDayModal(true);
  };

  // Gestione errori con tipo sicuro
  const getErrorMessage = (error: unknown): string => {
    if (error && typeof error === 'object' && 'message' in error) {
      return String(error.message);
    }
    return 'Errore sconosciuto nel caricamento del calendario';
  };

  if (calendarError) {
    return (
      <Container maxWidth="xl">
        <Alert severity="error" sx={{ mt: 2 }}>
          Errore nel caricamento dei dati del calendario: {getErrorMessage(calendarError)}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          📅 Calendario Conferimenti
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gestisci i conferimenti giornalieri per tipologia di materiale
        </Typography>
      </Box>

      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Navigazione mese */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={handlePreviousMonth} size="small">
                <ChevronLeft />
              </IconButton>
              
              <Typography variant="h6" sx={{ minWidth: 200, textAlign: 'center' }}>
                {format(currentDate, 'MMMM yyyy', { locale: it })}
              </Typography>
              
              <IconButton onClick={handleNextMonth} size="small">
                <ChevronRight />
              </IconButton>
              
              <Tooltip title="Vai a oggi">
                <IconButton onClick={handleToday} size="small" color="primary">
                  <TodayOutlined />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>

          {/* Filtri */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Filtra per tipologia</InputLabel>
              <Select
                value={materialTypeFilter}
                label="Filtra per tipologia"
                onChange={(e) => setMaterialTypeFilter(e.target.value)}
                disabled={isLoadingMaterialTypes}
              >
                <MenuItem value="">Tutte le tipologie</MenuItem>
                {materialTypes?.map((type: MaterialType) => (
                  <MenuItem key={type.id} value={type.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: type.color || '#666',
                        }}
                      />
                      {type.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Azioni */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddDelivery}
                size="small"
              >
                Nuovo Conferimento
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<Assessment />}
                size="small"
              >
                Report
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Statistiche Mensili */}
      {calendarData?.monthlyTotals && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <DeliveryStatsCard
              title="Conferimenti Totali"
              value={calendarData.monthlyTotals.totalDeliveries}
              subtitle="questo mese"
              color="primary"
              icon="📦"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <DeliveryStatsCard
              title="Peso Totale"
              value={`${calendarData.monthlyTotals.totalWeight.toFixed(2)} kg`}
              subtitle="questo mese"
              color="success"
              icon="⚖️"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <DeliveryStatsCard
              title="Tipologie Diverse"
              value={calendarData.monthlyTotals.materialTypeBreakdown.length}
              subtitle="materiali conferiti"
              color="info"
              icon="🗂️"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <DeliveryStatsCard
              title="Media Giornaliera"
              value={`${(calendarData.monthlyTotals.totalWeight / new Date().getDate()).toFixed(1)} kg`}
              subtitle="peso medio/giorno"
              color="warning"
              icon="📊"
            />
          </Grid>
        </Grid>
      )}

      {/* Legenda Tipologie */}
      {materialTypes && materialTypes.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Legenda Tipologie Materiali:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {materialTypes.map((type: MaterialType) => (
              <Chip
                key={type.id}
                label={type.name}
                size="small"
                sx={{
                  backgroundColor: type.color || '#666',
                  color: 'white',
                  '& .MuiChip-label': { fontWeight: 500 }
                }}
              />
            ))}
          </Box>
        </Paper>
      )}

      {/* Calendario */}
      <Paper sx={{ p: 2 }}>
        {isLoadingCalendar ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <CalendarGrid
            calendarData={calendarData}
            currentDate={currentDate}
            onDayClick={handleDayClick}
            materialTypes={materialTypes || []}
          />
        )}
      </Paper>

      {/* Modal Dettaglio Giorno */}
      {showDayModal && selectedDate && (
        <DayDetailModal
          open={showDayModal}
          date={selectedDate}
          onClose={handleCloseModal}
          materialTypes={materialTypes || []}
        />
      )}
    </Container>
  );
};

export default DeliveriesCalendar;