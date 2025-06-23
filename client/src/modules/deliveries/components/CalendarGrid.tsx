// client/src/modules/deliveries/components/CalendarGrid.tsx

import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  useTheme,
  alpha
} from '@mui/material';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  startOfWeek, 
  endOfWeek 
} from 'date-fns';
import type { MaterialType } from '../types/deliveries.types';

// CORREZIONE: Interfacce locali per i dati del calendario
interface MaterialBreakdown {
  materialTypeId: string;
  materialTypeName: string;
  totalWeight: number;
  deliveryCount: number;
}

interface DayDeliveryData {
  date: string;
  hasDeliveries: boolean;
  totalWeight: number;
  totalDeliveries: number;
  materialsBreakdown: MaterialBreakdown[];
}

interface MonthlyTotals {
  totalDeliveries: number;
  totalWeight: number;
  materialTypeBreakdown: MaterialBreakdown[];
  averageDailyWeight: number;
}

interface MonthlyCalendarData {
  year: number;
  month: number;
  days: DayDeliveryData[];
  monthlyTotals: MonthlyTotals;
}

interface CalendarGridProps {
  calendarData?: MonthlyCalendarData;
  currentDate: Date;
  onDayClick: (date: string) => void;
  materialTypes: MaterialType[];
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  calendarData,
  currentDate,
  onDayClick,
  materialTypes
}) => {
  const theme = useTheme();

  // Calcola il range del calendario (include giorni della settimana precedente/successiva)
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Lunedì
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  });

  // Nomi dei giorni della settimana - CORREZIONE: tipo string esplicito
  const weekDays: string[] = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  // Trova i dati per una specifica data
  const getDayData = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return calendarData?.days.find((day: DayDeliveryData) => day.date === dateString);
  };

  // Colore della cella basato sui conferimenti
  const getDayColor = (date: Date) => {
    const dayData = getDayData(date);
    
    if (!dayData || !dayData.hasDeliveries) {
      return isToday(date) 
        ? alpha(theme.palette.primary.main, 0.1)
        : 'transparent';
    }

    // Verde per giorni con conferimenti
    return alpha(theme.palette.success.main, 0.15);
  };

  // Bordo della cella
  const getDayBorder = (date: Date) => {
    if (isToday(date)) {
      return `2px solid ${theme.palette.primary.main}`;
    }
    
    const dayData = getDayData(date);
    if (dayData?.hasDeliveries) {
      return `1px solid ${theme.palette.success.main}`;
    }
    
    return `1px solid ${theme.palette.divider}`;
  };

  return (
    <Box>
      {/* Header con giorni della settimana */}
      <Grid container sx={{ mb: 1 }}>
        {weekDays.map((day: string) => (
          <Grid item xs key={day} sx={{ textAlign: 'center' }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.secondary,
                py: 1
              }}
            >
              {day}
            </Typography>
          </Grid>
        ))}
      </Grid>

      {/* Griglia calendario */}
      <Grid container>
        {calendarDays.map((date, index) => {
          const dayData = getDayData(date);
          const isCurrentMonth = isSameMonth(date, currentDate);
          const isCurrentDay = isToday(date);
          
          return (
            <Grid item xs key={index}>
              <Card
                sx={{
                  minHeight: 120,
                  m: 0.5,
                  backgroundColor: getDayColor(date),
                  border: getDayBorder(date),
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  opacity: isCurrentMonth ? 1 : 0.4,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4],
                  }
                }}
                onClick={() => onDayClick(format(date, 'yyyy-MM-dd'))}
              >
                <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                  {/* Numero del giorno */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: isCurrentDay ? 'bold' : 'normal',
                        color: isCurrentDay 
                          ? theme.palette.primary.main 
                          : isCurrentMonth 
                            ? theme.palette.text.primary 
                            : theme.palette.text.disabled,
                        fontSize: '0.9rem'
                      }}
                    >
                      {format(date, 'd')}
                    </Typography>
                    
                    {/* Indicatore totale peso */}
                    {dayData?.hasDeliveries && (
                      <Chip
                        label={`${dayData.totalWeight.toFixed(1)}kg`}
                        size="small"
                        sx={{
                          fontSize: '0.7rem',
                          height: 16,
                          backgroundColor: theme.palette.success.main,
                          color: 'white',
                          '& .MuiChip-label': { px: 0.5 }
                        }}
                      />
                    )}
                  </Box>

                  {/* Indicatori tipologie materiali */}
                  {dayData?.materialsBreakdown && dayData.materialsBreakdown.length > 0 && (
                    <Stack spacing={0.5}>
                      {dayData.materialsBreakdown.slice(0, 3).map((material: MaterialBreakdown) => {
                        const materialType = materialTypes.find(mt => mt.id === material.materialTypeId);
                        return (
                          <Box
                            key={material.materialTypeId}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}
                          >
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: materialType?.color || '#666',
                                flexShrink: 0
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: '0.65rem',
                                color: theme.palette.text.secondary,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {material.totalWeight.toFixed(1)}kg
                            </Typography>
                          </Box>
                        );
                      })}
                      
                      {/* Indicatore "altri" se ci sono più di 3 tipologie */}
                      {dayData.materialsBreakdown.length > 3 && (
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.65rem',
                            color: theme.palette.text.disabled,
                            fontStyle: 'italic'
                          }}
                        >
                          +{dayData.materialsBreakdown.length - 3} altri
                        </Typography>
                      )}
                    </Stack>
                  )}

                  {/* Indicatore nessun conferimento */}
                  {isCurrentMonth && !dayData?.hasDeliveries && (
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.65rem',
                        color: theme.palette.text.disabled,
                        fontStyle: 'italic'
                      }}
                    >
                      Nessun conferimento
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Legenda */}
      <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              backgroundColor: alpha(theme.palette.success.main, 0.15),
              border: `1px solid ${theme.palette.success.main}`,
              borderRadius: 1
            }}
          />
          <Typography variant="caption" color="text.secondary">
            Con conferimenti
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              backgroundColor: 'transparent',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1
            }}
          />
          <Typography variant="caption" color="text.secondary">
            Senza conferimenti
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              border: `2px solid ${theme.palette.primary.main}`,
              borderRadius: 1
            }}
          />
          <Typography variant="caption" color="text.secondary">
            Oggi
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default CalendarGrid;