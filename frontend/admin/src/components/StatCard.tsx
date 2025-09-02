import React from 'react';
import { Card, CardContent, Typography, Box, Avatar } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';

interface StatCardProps {
  label: string;
  value: string;
  icon?: SvgIconComponent;
  tooltip?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({ 
  label, 
  value, 
  icon: Icon,
  tooltip,
  trend 
}) => {
  return (
    <Card 
      sx={{ 
        borderRadius: 4, 
        boxShadow: 1,
        p: 2.5,
        transition: 'box-shadow 0.2s ease-in-out',
        '&:hover': {
          boxShadow: 3
        }
      }}
      title={tooltip}
    >
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'grey.600', 
                fontWeight: 500, 
                mb: 1
              }}
            >
              {label}
            </Typography>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 600, 
                color: 'grey.900',
                letterSpacing: '-0.025em'
              }}
            >
              {value}
            </Typography>
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography 
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    color: trend.isPositive ? 'success.main' : 'error.main'
                  }}
                >
                  {trend.isPositive ? '+' : ''}{trend.value}
                </Typography>
              </Box>
            )}
          </Box>
          {Icon && (
            <Box sx={{ flexShrink: 0, ml: 2 }}>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: '#fff3e0',
                  color: '#ef6c00'
                }}
              >
                <Icon sx={{ fontSize: 20 }} />
              </Avatar>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
