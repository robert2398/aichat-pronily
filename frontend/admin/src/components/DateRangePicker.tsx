import React from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  ToggleButtonGroup, 
  ToggleButton,
  Stack
} from '@mui/material';
import { format, subDays } from 'date-fns';
import { useDateRange } from '../contexts/DateRangeContext';

const presets = [
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: '90 Days', days: 90 },
];

export const DateRangePicker: React.FC = () => {
  const { from, to, setDateRange } = useDateRange();
  
  const handlePresetChange = (_: React.MouseEvent<HTMLElement>, days: number | null) => {
    if (days) {
      const newTo = new Date();
      const newFrom = subDays(newTo, days);
      setDateRange(format(newFrom, 'yyyy-MM-dd'), format(newTo, 'yyyy-MM-dd'));
    }
  };

  const getCurrentPreset = (): number | null => {
    const toDate = new Date(to);
    const fromDate = new Date(from);
    const diffDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const preset = presets.find(p => p.days === diffDays);
    return preset ? preset.days : null;
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        AiFriend Admin Dashboard
      </Typography>
      
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        <ToggleButtonGroup
          value={getCurrentPreset()}
          exclusive
          onChange={handlePresetChange}
          size="small"
          sx={{ 
            '& .MuiToggleButton-root': {
              px: 2,
              py: 0.5,
              fontSize: '0.875rem',
            }
          }}
        >
          {presets.map((preset) => (
            <ToggleButton key={preset.days} value={preset.days}>
              {preset.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            label="From"
            type="date"
            value={from}
            onChange={(e) => setDateRange(e.target.value, to)}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ width: 150 }}
          />
          <Typography variant="body2" color="text.secondary">
            to
          </Typography>
          <TextField
            label="To"
            type="date"
            value={to}
            onChange={(e) => setDateRange(from, e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ width: 150 }}
          />
        </Box>
      </Stack>
    </Box>
  );
};
