import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Container,
} from '@mui/material';
import {
  ErrorOutline,
} from '@mui/icons-material';

export const ActivationFailed: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <ErrorOutline sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom sx={{ color: 'error.main', fontWeight: 600 }}>
            Activation Failed
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Your activation link has expired or is invalid. Please contact support to request a new activation link.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Activation links are valid for 24 hours from when they are sent.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/dashboard')}
            sx={{ mt: 2 }}
          >
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
};
