import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Box, 
  IconButton, 
  Typography, 
  Button, 
  Avatar, 
  Stack,
  useTheme,
  alpha,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Add as AddIcon, 
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  SmartToy as ChatbotIcon
} from '@mui/icons-material';
import { CreateCharacterModal } from './CreateCharacterModal';

interface HeaderProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, isMenuOpen }) => {
  const theme = useTheme();
  const [languageAnchorEl, setLanguageAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi'>('en');
  const [createCharacterModalOpen, setCreateCharacterModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' }
  ];

  const handleLanguageClick = (event: React.MouseEvent<HTMLElement>) => {
    setLanguageAnchorEl(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setLanguageAnchorEl(null);
  };

  const handleLanguageSelect = (languageCode: 'en' | 'hi') => {
    setSelectedLanguage(languageCode);
    setLanguageAnchorEl(null);
  };

  const currentLanguage = languages.find(lang => lang.code === selectedLanguage) || languages[0];

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        bgcolor: 'white',
        backdropFilter: 'blur(10px)',
        borderBottom: 1,
        borderColor: 'grey.200',
        boxShadow: 1,
        zIndex: theme.zIndex.drawer + 1
      }}
    >
      <Toolbar sx={{ height: 80, px: { xs: 1, sm: 1.5, lg: 2 } }}>
        {/* Left Side - Logo and Menu Toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Menu Toggle */}
          <IconButton
            onClick={onMenuToggle}
            sx={{ 
              color: 'grey.600',
              '&:hover': { bgcolor: alpha(theme.palette.grey[500], 0.1) },
              borderRadius: 2,
              p: 1
            }}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            <MenuIcon />
            <Typography 
              variant="body2" 
              sx={{ 
                ml: 0.5, 
                fontWeight: 500, 
                color: 'grey.700',
                display: { xs: 'none', sm: 'block' }
              }}
            >
              Menu
            </Typography>
          </IconButton>
          
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ ml: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                bgcolor: '#2196f3',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ChatbotIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                color: 'grey.900',
                display: { xs: 'none', sm: 'block' }
              }}
            >
              AiChat
            </Typography>
          </Stack>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* Right Side - Actions */}
        <Stack direction="row" alignItems="center" spacing={1}>
          {/* Language Dropdown */}
          <Button
            variant="outlined"
            size="small"
            endIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />}
            onClick={handleLanguageClick}
            sx={{
              display: { xs: 'none', sm: 'flex' },
              borderColor: 'grey.300',
              color: 'grey.700',
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              '&:hover': {
                bgcolor: alpha(theme.palette.grey[500], 0.05),
                borderColor: 'grey.300'
              }
            }}
          >
            {currentLanguage.flag} {currentLanguage.name}
          </Button>

          <Menu
            anchorEl={languageAnchorEl}
            open={Boolean(languageAnchorEl)}
            onClose={handleLanguageClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            sx={{
              '& .MuiPaper-root': {
                minWidth: 150,
                borderRadius: 2,
                boxShadow: theme.shadows[8],
                border: 1,
                borderColor: 'grey.200'
              }
            }}
          >
            {languages.map((language) => (
              <MenuItem
                key={language.code}
                onClick={() => handleLanguageSelect(language.code as 'en' | 'hi')}
                selected={selectedLanguage === language.code}
                sx={{
                  py: 1.5,
                  px: 2,
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.15),
                    }
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Typography variant="body1">{language.flag}</Typography>
                </ListItemIcon>
                <ListItemText 
                  primary={language.name}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: selectedLanguage === language.code ? 600 : 400
                  }}
                />
              </MenuItem>
            ))}
          </Menu>

          {/* Create Character Button */}
          <Button 
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={() => setCreateCharacterModalOpen(true)}
            sx={{
              bgcolor: '#ffc54d',
              color: 'black',
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              borderRadius: 2,
              px: 2,
              py: 1.25,
              boxShadow: 1,
              '&:hover': {
                bgcolor: '#ffb929',
                boxShadow: 2
              }
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              Create Character
            </Box>
          </Button>

          {/* User Profile */}
          <IconButton
            sx={{
              p: 1,
              '&:hover': { bgcolor: alpha(theme.palette.grey[500], 0.1) },
              borderRadius: 2
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: 'grey.300',
                  border: 2,
                  borderColor: 'grey.400'
                }}
              >
                <PersonIcon sx={{ color: 'grey.600' }} />
              </Avatar>
              <Box sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'left' }}>
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'grey.900' }}>
                  Admin User
                </Typography>
                <Typography variant="caption" sx={{ color: 'grey.500' }}>
                  admin@honeylove.com
                </Typography>
              </Box>
            </Stack>
          </IconButton>
        </Stack>
      </Toolbar>

      {/* Create Character Modal */}
      <CreateCharacterModal
        open={createCharacterModalOpen}
        onClose={() => setCreateCharacterModalOpen(false)}
        onSuccess={() => {
          setSuccessMessage('Character created successfully!');
        }}
      />

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSuccessMessage('')}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </AppBar>
  );
};
