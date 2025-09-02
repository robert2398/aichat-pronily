import React from 'react';
import {
  Box,
  Typography,
  Container
} from '@mui/material';
import ChatLogsComponent from '../components/ChatLogs';

const ChatLogsPage: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          Chat Logs
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage all chat conversations across the platform
        </Typography>
      </Box>
      
      <ChatLogsComponent />
    </Container>
  );
};

export default ChatLogsPage;