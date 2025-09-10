import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme, useMediaQuery, Box, ListItem, ListItemText, Collapse, alpha, ListItemButton, IconButton } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { usePinnedSubnav } from '../hooks/usePinnedSubnav';

// Sub-items definition
const items = [
  { id: 'monetization', label: 'Monetization' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'coins', label: 'Coins' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'promotions', label: 'Promotions' },
];

/**
 * AnalyticsGroup is injected under the Dashboard item. Desktop: hover preview + click pin.
 * Mobile (< lg): collapsible only.
 */
export const AnalyticsGroup: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [pinned, setPinned] = usePinnedSubnav('analyticsSubnavPinned');
  const [hoverOpen, setHoverOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const onDashboard = location.pathname.startsWith('/admin/dashboard');
  useEffect(() => {
    if (onDashboard) setHoverOpen(true); else if (!pinned) setHoverOpen(false);
  }, [onDashboard, pinned]);

  // Scroll spy
  useEffect(() => {
    if (!onDashboard) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) setActiveId(e.target.id); });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: [0, 0.25, 0.5, 1] });
    items.forEach(i => { const el = document.getElementById(i.id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [onDashboard]);

  useEffect(() => {
    if (location.hash) {
      const hashId = location.hash.replace('#','');
      if (items.some(i => i.id === hashId)) setActiveId(hashId);
    }
  }, [location.hash]);

  const togglePinned = () => setPinned(p => !p);
  const open = pinned || hoverOpen;

  const onTriggerKeyDown: React.KeyboardEventHandler = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePinned(); }
    else if (e.key === 'Escape' && !pinned) { setHoverOpen(false); }
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const first = panelRef.current?.querySelector<HTMLButtonElement>('button[data-analytics-item]');
      first?.focus();
    }
  };

  // Basic focus trap when open (hover) but not pinned on desktop
  useEffect(() => {
    if (!open || pinned || isMobile) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>('button[data-analytics-item]');
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, pinned, isMobile]);

  const handleMouseEnter = () => { if (!isMobile) setHoverOpen(true); };
  const handleMouseLeave = () => { if (!isMobile && !pinned) setHoverOpen(false); };

  const handleItemClick = useCallback((id: string) => {
    if (location.pathname.startsWith('/admin/dashboard')) {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.replaceState(null, '', `/admin/dashboard${location.search}#${id}`);
      }
    } else {
      navigate(`/admin/dashboard${location.search}#${id}`);
    }
  }, [location.pathname, navigate]);

  const triggerAriaId = 'analytics-subnav-trigger';
  const panelId = 'analytics-subnav-panel';

  const renderItems = (inline: boolean) => (
    <Box ref={panelRef} id={panelId} role="menu" aria-label="Analytics sub navigation" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, p: inline ? 0 : 1, minWidth: inline ? 'auto' : 200 }}>
      {items.map(item => {
        const isActive = activeId === item.id || location.hash === `#${item.id}`;
        return (
          <ListItemButton
            key={item.id}
            data-analytics-item
            role="menuitem"
            onClick={() => handleItemClick(item.id)}
            sx={{
              borderRadius: 1.5,
              py: 0.75,
              px: 1.5,
              fontSize: '0.75rem',
              textTransform: 'none',
              bgcolor: isActive ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
              color: isActive ? theme.palette.primary.main : 'grey.700',
              '&:hover': { bgcolor: isActive ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.grey[500], 0.1) }
            }}
          >
            <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.75rem', fontWeight: 500 }} />
          </ListItemButton>
        );
      })}
    </Box>
  );

  return (
    <Box sx={{ position: 'relative' }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <ListItem disablePadding sx={{ mb: 0.25 }}>
        <ListItemButton
          id={triggerAriaId}
          aria-haspopup="true"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={togglePinned}
          onKeyDown={onTriggerKeyDown}
          sx={{
            borderRadius: 2,
            px: 2,
            py: 1.25,
            minHeight: 44,
            bgcolor: open ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
            color: open ? theme.palette.primary.main : 'grey.700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            '&:hover': { bgcolor: open ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.grey[500], 0.08) }
          }}
        >
          <ListItemText primary="Analytics" primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: 600 }} />
          <IconButton size="small" tabIndex={-1} sx={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform .2s', color: open ? theme.palette.primary.main : 'grey.500' }}>
            <ChevronRightIcon fontSize="inherit" />
          </IconButton>
        </ListItemButton>
      </ListItem>

      {!isMobile && !pinned && hoverOpen && (
        <Box
          role="dialog"
          aria-modal="false"
          aria-labelledby={triggerAriaId}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 16,
            mt: 0.5,
            zIndex: theme.zIndex.drawer + 1,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 3,
            border: '1px solid',
            borderColor: 'grey.200'
          }}
        >
          {renderItems(false)}
        </Box>
      )}

      {(pinned || isMobile) && (
        <Collapse in={open} unmountOnExit timeout={200}>
          <Box sx={{ pl: 2.5, pr: 1.5, pb: 0.5 }}>{renderItems(true)}</Box>
        </Collapse>
      )}
    </Box>
  );
};
