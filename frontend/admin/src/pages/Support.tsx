import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Container,
  Drawer,
  IconButton,
  Stack
} from '@mui/material';
import { Close } from '@mui/icons-material';

const tickets = [
  { id: 1, title: 'Login issue', status: 'New' },
  { id: 2, title: 'Billing error', status: 'In Progress' },
  { id: 3, title: 'Feature request', status: 'Resolved' },
];

export const Support: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [selectedTicket, setSelectedTicket] = React.useState<any>(null);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        Support Tickets
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
        {['New', 'In Progress', 'Resolved'].map(col => (
          <Card key={col} sx={{ height: 'fit-content' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                {col}
              </Typography>
              <Stack spacing={1}>
                {tickets.filter(t => t.status === col).map(ticket => (
                  <Card 
                    key={ticket.id} 
                    sx={{ 
                      p: 1, 
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }} 
                    onClick={() => { 
                      setSelectedTicket(ticket); 
                      setDrawerOpen(true); 
                    }}
                  >
                    <Typography variant="body2">
                      {ticket.title}
                    </Typography>
                  </Card>
                ))}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>
      
      <Drawer 
        anchor="right"
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)}
        sx={{ '& .MuiDrawer-paper': { width: 400, p: 2 } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            {selectedTicket?.title}
          </Typography>
          <IconButton onClick={() => setDrawerOpen(false)}>
            <Close />
          </IconButton>
        </Box>
        {selectedTicket && (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Status: {selectedTicket.status}
            </Typography>
            <Typography variant="body1">
              Details: ...
            </Typography>
          </Box>
        )}
      </Drawer>
    </Container>
  );
};
