import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

export const APIsManagement: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'grey.900', mb: 1 }}>
          APIs Management
        </Typography>
        <Typography variant="body1" sx={{ color: 'grey.600' }}>
          Manage API endpoints and configurations
        </Typography>
      </Box>
      
      <Card sx={{ borderRadius: 2, boxShadow: 1, border: 1, borderColor: 'grey.200' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="body1" sx={{ color: 'grey.500' }}>
            API management features coming soon...
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};
