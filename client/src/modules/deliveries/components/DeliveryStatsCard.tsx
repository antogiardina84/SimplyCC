// client/src/modules/deliveries/components/DeliveryStatsCard.tsx

import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

interface DeliveryStatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  color: 'primary' | 'success' | 'info' | 'warning' | 'error';
  icon: string;
}

const DeliveryStatsCard: React.FC<DeliveryStatsCardProps> = ({
  title,
  value,
  subtitle,
  color,
  icon
}) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ fontSize: '2rem' }}>{icon}</Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" color={`${color}.main`}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.primary">
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DeliveryStatsCard;