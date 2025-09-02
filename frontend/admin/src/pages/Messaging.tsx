import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Container,
  TextField,
  Button,
  Chip,
  Stack
} from '@mui/material';
import { Send } from '@mui/icons-material';

export const Messaging: React.FC = () => (
  <Container maxWidth="xl" sx={{ py: 4 }}>
    <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
      Messaging
    </Typography>
    
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          Composer Panel
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            multiline
            rows={4}
            placeholder="Type your message..."
            fullWidth
          />
          <Stack direction="row" spacing={1}>
            <Chip label="Segment A" color="primary" />
            <Chip label="Segment B" color="primary" />
          </Stack>
          <TextField
            type="datetime-local"
            InputLabelProps={{ shrink: true }}
          />
          <Box>
            <Button variant="contained" startIcon={<Send />}>
              Send
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
    
    <Card>
      <CardContent>
        <Typography variant="h6">
          History list...
        </Typography>
      </CardContent>
    </Card>
  </Container>
);
