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
  alpha,
  Collapse
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
// Analytics submenu items nested under Dashboard
const dashboardSubItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'monetization', label: 'Monetization' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'coins', label: 'Coins' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'promotions', label: 'Promotions' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { label: 'Dashboard', id: 'dashboard', path: '/admin/dashboard', icon: HomeIcon },
  { label: 'User Management', id: 'users', path: '/admin/users', icon: PeopleIcon },
  { label: 'Pricing Management', id: 'pricing', path: '/admin/pricing', icon: PricingIcon },
  { label: 'Promo Management', id: 'promo', path: '/admin/promo', icon: TagIcon },
  { label: 'Order History', id: 'orders', path: '/admin/orders', icon: PricingIcon },
  { label: 'Coin Transactions', id: 'coin-transactions', path: '/admin/coin-transactions', icon: PricingIcon },
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
  const [dashExpandedStored, setDashExpandedStored] = React.useState<boolean>(() => {
    try { return localStorage.getItem('dashboardSubmenuExpanded') === 'true'; } catch { return false; }
  });
  const onDashboardRoute = location.pathname.startsWith('/admin/dashboard');
  const forcedOpen = onDashboardRoute; // keep expanded when on any dashboard analytics hash
  const [hoverOpen, setHoverOpen] = React.useState(false); // desktop hover preview
  const dashOpen = forcedOpen || dashExpandedStored || hoverOpen;

  React.useEffect(() => {
    try { localStorage.setItem('dashboardSubmenuExpanded', String(dashExpandedStored)); } catch {/* ignore */}
  }, [dashExpandedStored]);

  // Close hover preview when route changes away
  React.useEffect(() => { if (!onDashboardRoute && !dashExpandedStored) setHoverOpen(false); }, [onDashboardRoute, dashExpandedStored]);

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
              {item.id !== 'dashboard' && (
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
              )}
              {item.id === 'dashboard' && (
                <DashboardMenu
                  icon={Icon}
                  open={dashOpen}
                  forcedOpen={forcedOpen}
                  setHoverOpen={setHoverOpen}
                  expandedStored={dashExpandedStored}
                  setExpandedStored={setDashExpandedStored}
                />
              )}
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

interface DashboardMenuProps {
  icon: React.ElementType;
  open: boolean;
  forcedOpen: boolean;
  setHoverOpen: (v: boolean) => void;
  expandedStored: boolean;
  setExpandedStored: React.Dispatch<React.SetStateAction<boolean>>;
}

const DashboardMenu: React.FC<DashboardMenuProps> = ({ icon: Icon, open, forcedOpen, setHoverOpen, expandedStored, setExpandedStored }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const buttonRef = React.useRef<HTMLDivElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  const onEnterDashboard = () => {
    if (!isMobile) setHoverOpen(true);
  };
  const onLeaveDashboard = () => {
    if (!isMobile && !forcedOpen && !expandedStored) setHoverOpen(false);
  };

  const toggleExpand = () => {
    // Repurposed: always navigate to overview and refresh KPIs; allow expand toggle only if not on dashboard route
    if (!location.pathname.startsWith('/admin/dashboard')) {
      // Preserve any existing query params when navigating to dashboard
      navigate(`/admin/dashboard${location.search}`);
      try { window.dispatchEvent(new CustomEvent('dashboard:navigate:overview')); } catch {}
      setExpandedStored(true);
      return;
    }
    // Already on dashboard route: reset to overview (clear hash) and refresh
    window.history.replaceState(null, '', `/admin/dashboard${location.search}`);
    try { window.dispatchEvent(new CustomEvent('dashboard:navigate:overview')); } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Don't collapse while on dashboard analytics (forcedOpen true)
    if (!forcedOpen) {
      setExpandedStored(v => !v);
    }
  };

  const handleSubClick = (id: string) => {
    // Dispatch global custom events so sections can eagerly refetch when navigated
    try {
      if (id === 'overview') {
        window.dispatchEvent(new CustomEvent('dashboard:navigate:overview'))
      } else if (id === 'monetization') {
        window.dispatchEvent(new CustomEvent('dashboard:navigate:monetization'))
      } else if (id === 'subscriptions') {
        window.dispatchEvent(new CustomEvent('dashboard:navigate:subscriptions'))
      } else if (id === 'coins') {
        window.dispatchEvent(new CustomEvent('dashboard:navigate:coins'))
      }
    } catch { /* ignore */ }
    if (id === 'overview') {
      if (location.pathname.startsWith('/admin/dashboard')) {
        window.history.replaceState(null, '', `/admin/dashboard${location.search}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate(`/admin/dashboard${location.search}`);
      }
      return;
    }
    if (location.pathname.startsWith('/admin/dashboard')) {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.replaceState(null, '', `/admin/dashboard${location.search}#${id}`);
      }
    } else {
      navigate(`/admin/dashboard${location.search}#${id}`);
    }
  };

  const activeHash = location.hash.replace('#','');
  const activeSub = location.pathname.startsWith('/admin/dashboard') ? (activeHash || 'overview') : null;

  // Keyboard nav
  const onTriggerKeyDown: React.KeyboardEventHandler = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(); }
    else if (e.key === 'ArrowDown' && open) {
      e.preventDefault(); panelRef.current?.querySelector<HTMLElement>('button[data-sub-item]')?.focus();
    } else if (e.key === 'Escape' && !forcedOpen) {
      setHoverOpen(false); setExpandedStored(false);
    }
  };

  const onPanelKeyDown: React.KeyboardEventHandler = (e) => {
    if (e.key === 'Escape' && !forcedOpen) { setHoverOpen(false); setExpandedStored(false); buttonRef.current?.focus(); }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const focusables = panelRef.current?.querySelectorAll<HTMLButtonElement>('button[data-sub-item]');
      if (!focusables) return;
      const idx = Array.from(focusables).indexOf(document.activeElement as HTMLButtonElement);
      const next = focusables[(idx + 1) % focusables.length];
      next.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const focusables = panelRef.current?.querySelectorAll<HTMLButtonElement>('button[data-sub-item]');
      if (!focusables) return;
      const idx = Array.from(focusables).indexOf(document.activeElement as HTMLButtonElement);
      const prev = focusables[(idx - 1 + focusables.length) % focusables.length];
      prev.focus();
    }
  };

  return (
    <div
      onMouseEnter={onEnterDashboard}
      onMouseLeave={onLeaveDashboard}
      style={{ width: '100%', position: 'relative' }}
    >
      <ListItemButton
        ref={buttonRef as any}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="dashboard-analytics-submenu"
        onKeyDown={onTriggerKeyDown}
        onClick={toggleExpand}
        sx={{
          borderRadius: 2,
          px: 2,
          py: 1.5,
            minHeight: 48,
          bgcolor: open ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
          color: open ? theme.palette.primary.main : 'grey.700',
          boxShadow: open ? 1 : 0,
          '&:hover': { bgcolor: open ? alpha(theme.palette.primary.main, 0.10) : alpha(theme.palette.grey[500], 0.1) },
          transition: 'all 0.2s ease-in-out'
        }}
      >
        <ListItemIcon sx={{ minWidth: 40 }}>
          <Icon sx={{ fontSize: 20, color: open ? 'black' : 'grey.500' }} />
        </ListItemIcon>
        <ListItemText
          primary={"Dashboard"}
          sx={{ '& .MuiListItemText-primary': { fontSize: '0.875rem', fontWeight: 600 } }}
        />
        <span aria-hidden style={{ marginLeft: 'auto', fontSize: 10, transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform .2s', color: open ? theme.palette.primary.main : theme.palette.grey[500] }}>▶</span>
      </ListItemButton>

      {/* Inline nested submenu for all breakpoints */}
      <Collapse in={open} timeout={180} unmountOnExit>
        <Box id="dashboard-analytics-submenu" role="menu" aria-label="Dashboard analytics submenu" ref={panelRef} onKeyDown={onPanelKeyDown} sx={{ pl: 4, pr: 1.5, pb: 0.5, pt: 0.25 }}>
          {dashboardSubItems.map(si => {
            const active = activeSub === si.id;
            return (
              <ListItemButton
                key={si.id}
                data-sub-item
                role="menuitem"
                onClick={() => handleSubClick(si.id)}
                sx={{
                  borderRadius: 1.5,
                  py: 0.625,
                  px: 1.25,
                  mt: 0.25,
                  fontSize: '0.875rem',
                  minHeight: 36,
                  position: 'relative',
                  bgcolor: active ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                  color: active ? theme.palette.primary.main : 'grey.700',
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    left: -16,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    borderRadius: 1,
                    bgcolor: active ? theme.palette.primary.main : 'transparent',
                    transition: 'background-color .2s'
                  },
                  '&:hover': { bgcolor: active ? alpha(theme.palette.primary.main, 0.22) : alpha(theme.palette.grey[500], 0.10) }
                }}
              >
                <ListItemText primary={si.label} primaryTypographyProps={{ fontSize: '0.800rem', fontWeight: 500 }} />
              </ListItemButton>
            );
          })}
        </Box>
      </Collapse>
    </div>
  );
};
