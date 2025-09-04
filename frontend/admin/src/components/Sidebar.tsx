import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import { 
  Home as HomeIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
  Notifications as NotificationsIcon,
  Code as CodeIcon,
  LocalOffer as TagIcon,
  Bolt as BoltIcon,
  PriceChange as PricingIcon
} from '@mui/icons-material';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { label: 'Dashboard', id: 'dashboard', path: '/admin/dashboard', icon: HomeIcon },
  { label: 'User Management', id: 'users', path: '/admin/users', icon: PeopleIcon },
  { label: 'Pricing Management', id: 'pricing', path: '/admin/pricing', icon: PricingIcon },
  { label: 'Promo Management', id: 'promo', path: '/admin/promo', icon: TagIcon },
  { label: 'Content Moderation', id: 'content-moderation', path: '/admin/content-moderation', icon: SecurityIcon },
  { label: 'Character Management', id: 'characters', path: '/admin/characters', icon: PeopleIcon },
  { label: 'Push Notification', id: 'notification', path: '/admin/notification', icon: NotificationsIcon },
  { label: 'Setting & Configuration', id: 'settings', path: '/admin/settings', icon: SettingsIcon },
  { label: 'APIs Management', id: 'apis', path: '/admin/apis', icon: CodeIcon },
  { label: 'Code Injections', id: 'code-injections', path: '/admin/code-injections', icon: BoltIcon },
  { label: 'Admin login & access', id: 'admin', path: '/admin/admin', icon: AdminIcon },
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  const handleNavClick = (path: string) => {
    navigate(path);
    // Close sidebar on mobile after navigation
    if (isMobile) {
      onClose();
    }
  };

  const getActiveNavItem = () => {
    const currentPath = location.pathname;
    const activeItem = navItems.find(item => item.path === currentPath);
    return activeItem ? activeItem.id : 'dashboard';
  };

  const drawerContent = (
    <Box sx={{ width: 288, pt: 1 }}> {/* 288px = reduced sidebar width */}
      <List sx={{ px: 1.25 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = getActiveNavItem() === item.id;
          
          return (
            <ListItem key={item.id} disablePadding sx={{ mb: 0.25 }}>
              <ListItemButton
                onClick={() => handleNavClick(item.path)}
                sx={{
                  borderRadius: 2,
                  px: 2,
                  py: 1.5,
                  minHeight: 48,
                  bgcolor: isActive ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                  color: isActive ? theme.palette.primary.main : 'grey.700',
                  boxShadow: isActive ? 1 : 0,
                  '&:hover': {
                    bgcolor: isActive ? alpha(theme.palette.primary.main, 0.10) : alpha(theme.palette.grey[500], 0.1),
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Icon 
                    sx={{ 
                      fontSize: 20,
                      color: isActive ? 'black' : 'grey.500',
                    }} 
                  />
                </ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      anchor="left"
      open={isOpen}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 288,
          top: 80, // Account for header height
          height: 'calc(100vh - 80px)',
          borderRight: 1,
          borderColor: 'grey.200',
          bgcolor: 'white',
          boxSizing: 'border-box',
        },
      }}
      ModalProps={{
        keepMounted: true, // Better mobile performance
      }}
    >
      {drawerContent}
    </Drawer>
  );
};
