import React, { useState } from 'react';
import { Box, Container, useTheme, useMediaQuery } from '@mui/material';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <Header 
        onMenuToggle={handleMenuToggle}
        isMenuOpen={isSidebarOpen}
      />

      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={handleSidebarClose}
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          pt: '80px', // Account for header height
          transition: 'margin-left 0.3s ease-in-out',
          ml: isLargeScreen && isSidebarOpen ? '288px' : 0, // 72*4 = 288px for lg:ml-72
        }}
      >
        <Container 
          maxWidth="xl" 
          sx={{ 
            py: { xs: 2, lg: 2.5 },
            px: { xs: 1, sm: 1.5, lg: 2 }
          }}
        >
          {children}
        </Container>
      </Box>
    </Box>
  );
};