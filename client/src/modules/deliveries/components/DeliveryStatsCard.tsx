// client/src/modules/deliveries/components/DeliveryStatsCard.tsx

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  alpha,
  useTheme
} from '@mui/material';

interface DeliveryStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  icon?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const DeliveryStatsCard: React.FC<DeliveryStatsCardProps> = ({
  title,
  value,
  subtitle,
  color,
  icon,
  trend
}) => {
  const theme = useTheme();
  const colorValue = theme.palette[color].main;

  return (
    <Card 
      sx={{
        background: `linear-gradient(135deg, ${alpha(colorValue, 0.1)} 0%, ${alpha(colorValue, 0.05)} 100%)`,
        border: `1px solid ${alpha(colorValue, 0.2)}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 25px ${alpha(colorValue, 0.15)}`,
          borderColor: alpha(colorValue, 0.3),
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography 
            variant="subtitle2" 
            color="text.secondary"
            sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
          >
            {title}
          </Typography>
          {icon && (
            <Box 
              sx={{ 
                fontSize: '1.5rem',
                opacity: 0.7
              }}
            >
              {icon}
            </Box>
          )}
        </Box>

        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700,
            color: colorValue,
            mb: 1,
            lineHeight: 1.2
          }}
        >
          {value}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {subtitle && (
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ fontWeight: 500 }}
            >
              {subtitle}
            </Typography>
          )}

          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography
                variant="caption"
                sx={{
                  color: trend.isPositive ? theme.palette.success.main : theme.palette.error.main,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.25
                }}
              >
                {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default DeliveryStatsCard;