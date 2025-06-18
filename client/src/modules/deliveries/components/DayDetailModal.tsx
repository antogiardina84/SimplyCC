// client/src/modules/deliveries/components/DayDetailModal.tsx

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import { Close, Add } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { deliveriesApi } from '../services/deliveries.api';
import type { MaterialType } from '../types/deliveries.types';

interface DayDetailModalProps {
  open: boolean;
  date: string;
  onClose: () => void;
  materialTypes: MaterialType[];
}

const DayDetailModal: React.FC<DayDetailModalProps> = ({
  open,
  date,
  onClose,
  materialTypes
}) => {
  const [selectedMaterialType, setSelectedMaterialType] = useState<string>('');

  // Query per i conferimenti del giorno
  const { data: deliveries, isLoading, error } = useQuery({
    queryKey: ['dayDeliveries', date, selectedMaterialType],
    queryFn: () => deliveriesApi.getDayDeliveries(date, selectedMaterialType || undefined),
    enabled: open,
    refetchOnWindowFocus: false,
  });

  const getMaterialTypeColor = (materialTypeId: string) => {
    const materialType = materialTypes.find(mt => mt.id === materialTypeId);
    return materialType?.color || '#666';
  };

  const getMaterialTypeName = (materialTypeId: string) => {
    const materialType = materialTypes.find(mt => mt.id === materialTypeId);
    return materialType?.name || 'N/A';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Conferimenti del {format(new Date(date), 'dd MMMM yyyy', { locale: it })}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Filtro per tipologia */}
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="Tutte"
            onClick={() => setSelectedMaterialType('')}
            color={selectedMaterialType === '' ? 'primary' : 'default'}
            variant={selectedMaterialType === '' ? 'filled' : 'outlined'}
          />
          {materialTypes.map((type) => (
            <Chip
              key={type.id}
              label={type.name}
              onClick={() => setSelectedMaterialType(type.id)}
              color={selectedMaterialType === type.id ? 'primary' : 'default'}
              variant={selectedMaterialType === type.id ? 'filled' : 'outlined'}
              sx={{
                backgroundColor: selectedMaterialType === type.id 
                  ? undefined 
                  : type.color,
                color: selectedMaterialType === type.id 
                  ? undefined 
                  : 'white'
              }}
            />
          ))}
        </Box>

        {/* Contenuto */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">
            Errore nel caricamento dei conferimenti
          </Alert>
        ) : deliveries && deliveries.length > 0 ? (
          <List>
            {deliveries.map((delivery) => (
              <ListItem key={delivery.id} divider>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: getMaterialTypeColor(delivery.materialTypeId),
                        }}
                      />
                      <Typography variant="body1" fontWeight={500}>
                        {delivery.contributor.name}
                      </Typography>
                      <Chip
                        label={getMaterialTypeName(delivery.materialTypeId)}
                        size="small"
                        sx={{
                          backgroundColor: getMaterialTypeColor(delivery.materialTypeId),
                          color: 'white'
                        }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2">
                        Peso: {delivery.weight.toFixed(2)} {delivery.unit}
                      </Typography>
                      {delivery.quality && (
                        <Typography variant="caption" color="text.secondary">
                          Qualità: {delivery.quality}
                        </Typography>
                      )}
                      {delivery.notes && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Note: {delivery.notes}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              Nessun conferimento registrato per questa data
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          startIcon={<Add />}
          variant="contained"
          onClick={() => {
            // TODO: Aprire modal per aggiungere nuovo conferimento
            console.log('Aggiungi conferimento per', date);
          }}
        >
          Aggiungi Conferimento
        </Button>
        <Button onClick={onClose}>
          Chiudi
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DayDetailModal;