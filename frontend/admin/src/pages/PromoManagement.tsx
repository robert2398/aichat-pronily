import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Select,
  MenuItem as SelectMenuItem,
  InputLabel,
  Snackbar
} from '@mui/material';
import {
  // Search icon removed as the admin search field was removed
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';
import type { Promo } from '../services/api';

// Replace the named export declaration with a local const so we can export default later
const PromoManagement: React.FC = () => {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [filteredPromos, setFilteredPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // removed admin search input - keep promos -> filteredPromos mapping
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    promo_name: '',
    percent_off: 0,
    start_date: '',
    expiry_date: '',
    status: ''
  });
  const [addFormData, setAddFormData] = useState({
    promo_name: '',
    coupon: '',
    percent_off: 0,
    start_date: '',
    expiry_date: '',
    status: 'scheduled'
  });

  useEffect(() => {
    fetchPromos();
  }, []);

  useEffect(() => {
    // keep filteredPromos in sync with promos (no admin search bar)
    setFilteredPromos(promos);
  }, [promos]);

  const fetchPromos = async () => {
    try {
      setLoading(true);
      const data = await apiService.getPromos();
      setPromos(data);
  setFilteredPromos(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch promos. Please try again.');
      console.error('Error fetching promos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, promo: Promo) => {
    setAnchorEl(event.currentTarget);
    setSelectedPromo(promo);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPromo(null);
  };

  const handleEditClick = () => {
    if (selectedPromo) {
      // Format dates for datetime-local input
      const formatDateForInput = (dateString: string) => {
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
      };

      setEditFormData({
        promo_name: selectedPromo.promo_name,
        percent_off: selectedPromo.percent_off,
        start_date: formatDateForInput(selectedPromo.start_date),
        expiry_date: formatDateForInput(selectedPromo.expiry_date),
        status: selectedPromo.status
      });
      setEditModalOpen(true);
      // Close menu after setting up the modal
      setAnchorEl(null);
    }
  };

  const handleEditModalClose = () => {
    setEditModalOpen(false);
    setSelectedPromo(null);
    setEditFormData({
      promo_name: '',
      percent_off: 0,
      start_date: '',
      expiry_date: '',
      status: ''
    });
  };

  const handleEditFormChange = (field: string, value: string | number) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditSubmit = async () => {
    if (!selectedPromo) return;

    try {
      setEditLoading(true);
      
      // Format dates back to ISO string
      const updateData = {
        promo_name: editFormData.promo_name,
        percent_off: editFormData.percent_off,
        start_date: new Date(editFormData.start_date).toISOString(),
        expiry_date: new Date(editFormData.expiry_date).toISOString(),
        status: editFormData.status
      };

      // Call API to update promo
      await apiService.updatePromo(selectedPromo.promo_id, updateData);
      
      // Refresh the promos list
      await fetchPromos();
      
      // Show success message
      setSuccessMessage('Promo updated successfully!');
      
      // Close modal and reset state
      handleEditModalClose();
      setError(null);
    } catch (err) {
      setError('Failed to update promo. Please try again.');
      console.error('Error updating promo:', err);
    } finally {
      setEditLoading(false);
    }
  };

  const handleAddClick = () => {
    // Set default dates - start date as now, expiry date as 30 days from now
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    const formatDateForInput = (date: Date) => {
      return date.toISOString().slice(0, 16);
    };

    setAddFormData({
      promo_name: '',
      coupon: '',
      percent_off: 0,
      start_date: formatDateForInput(now),
      expiry_date: formatDateForInput(thirtyDaysLater),
      status: 'scheduled'
    });
    
    setAddModalOpen(true);
  };

  const handleAddModalClose = () => {
    setAddModalOpen(false);
    setAddFormData({
      promo_name: '',
      coupon: '',
      percent_off: 0,
      start_date: '',
      expiry_date: '',
      status: 'scheduled'
    });
  };

  const handleAddFormChange = (field: string, value: string | number) => {
    setAddFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddSubmit = async () => {
    // Basic validation
    if (!addFormData.promo_name.trim()) {
      setError('Promo name is required');
      return;
    }
    if (!addFormData.coupon.trim()) {
      setError('Coupon code is required');
      return;
    }
    if (addFormData.percent_off <= 0 || addFormData.percent_off > 100) {
      setError('Discount percentage must be between 0 and 100');
      return;
    }
    if (!addFormData.start_date || !addFormData.expiry_date) {
      setError('Start date and expiry date are required');
      return;
    }
    if (new Date(addFormData.start_date) >= new Date(addFormData.expiry_date)) {
      setError('Expiry date must be after start date');
      return;
    }

    try {
      setAddLoading(true);
      
      // Format dates back to ISO string
      const createData = {
        promo_name: addFormData.promo_name.trim(),
        coupon: addFormData.coupon.trim().toUpperCase(),
        percent_off: addFormData.percent_off,
        start_date: new Date(addFormData.start_date).toISOString(),
        expiry_date: new Date(addFormData.expiry_date).toISOString(),
        status: addFormData.status
      };

      // Call API to create promo
      await apiService.createPromo(createData);
      
      // Refresh the promos list
      await fetchPromos();
      
      // Show success message
      setSuccessMessage('Promo created successfully!');
      
      // Close modal and reset state
      handleAddModalClose();
      setError(null);
    } catch (err) {
      setError('Failed to create promo. Please try again.');
      console.error('Error creating promo:', err);
    } finally {
      setAddLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPercentage = (percent: number) => {
    return `${percent}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return '#2e7d32';
      case 'scheduled':
        return '#1976d2';
      case 'expired':
        return '#d32f2f';
      default:
        return '#757575';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return '#e8f5e8';
      case 'scheduled':
        return '#e3f2fd';
      case 'expired':
        return '#ffebee';
      default:
        return '#f5f5f5';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'grey.900', mb: 1 }}>
          Promo Management
        </Typography>
        <Typography variant="body1" sx={{ color: 'grey.600' }}>
          Manage promotional campaigns, discounts, and coupon codes for your AI chatbot service.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ borderRadius: 2, boxShadow: 1, border: 1, borderColor: 'grey.200' }}>
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'grey.200' }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2, flexWrap: 'nowrap' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon sx={{ fontSize: 18 }} />}
              onClick={handleAddClick}
              aria-label="Create new promo"
              disableElevation
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                fontSize: 13.5,
                borderRadius: 9999,
                px: 2,
                py: 1,
                height: 36,
                minHeight: 36,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                backgroundImage: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 60%, #38bdf8 100%)',
                color: '#fff',
                '&:hover': {
                  filter: 'brightness(0.95)',
                  backgroundImage: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 60%, #38bdf8 100%)'
                }
              }}
            >
              Add Promo
            </Button>
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600, color: 'grey.700' }}>Promo Name</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'grey.700' }}>Coupon Code</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'grey.700' }}>Discount</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'grey.700' }}>Start Date</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'grey.700' }}>Expiry Date</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'grey.700' }}>Stripe Promo ID</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'grey.700' }}>Stripe Coupon ID</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'grey.700' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'grey.700' }}>Applied Count</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'grey.700' }}>Last Updated</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'grey.700' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPromos.map((promo) => (
                <TableRow 
                  key={promo.promo_id}
                  sx={{ 
                    '&:hover': { bgcolor: 'grey.50' },
                    borderBottom: 1,
                    borderColor: 'grey.100'
                  }}
                >
                  <TableCell>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 600,
                        color: 'grey.900'
                      }}
                    >
                      {promo.promo_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        color: '#1976d2',
                        bgcolor: '#e3f2fd',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        border: 1,
                        borderColor: '#90caf9',
                        display: 'inline-block'
                      }}
                    >
                      {promo.coupon}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600,
                        color: '#2196f3'
                      }}
                    >
                      {formatPercentage(promo.percent_off)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: 'grey.600' }}>
                      {formatDate(promo.start_date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: 'grey.600' }}>
                      {formatDate(promo.expiry_date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: 'grey.700', fontWeight: 500 }}>
                      {promo.stripe_promotion_id || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: 'grey.700', fontWeight: 500 }}>
                      {promo.stripe_coupon_id || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={promo.status}
                      size="small"
                      sx={{
                        bgcolor: getStatusBgColor(promo.status),
                        color: getStatusColor(promo.status),
                        fontWeight: 500,
                        border: 'none',
                        textTransform: 'capitalize'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'grey.700',
                        fontWeight: 500
                      }}
                    >
                      {promo.applied_count}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: 'grey.600' }}>
                      {formatDate(promo.updated_at)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={(e) => handleMenuClick(e, promo)}
                      size="small"
                      sx={{ color: 'grey.600' }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredPromos.length === 0 && !loading && (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: 'grey.500', mb: 2 }}>
              No promos found
            </Typography>
            <Typography variant="body2" sx={{ color: 'grey.400' }}>
              {promos.length ? 'Try adjusting your search criteria' : 'Create your first promotional campaign'}
            </Typography>
          </Box>
        )}
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleEditClick}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Edit Promo
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          Delete Promo
        </MenuItem>
      </Menu>

      {/* Edit Promo Modal */}
      <Dialog
        open={editModalOpen}
        onClose={handleEditModalClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            minHeight: 600
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
            Edit Promo
          </Typography>
          <IconButton onClick={handleEditModalClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ px: 3 }}>
          {selectedPromo && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              {/* Read-only/reference fields (excluding promo_id and created_at per request) */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Coupon Code"
                  value={selectedPromo.coupon}
                  disabled
                  variant="outlined"
                  size="small"
                />
                <TextField
                  label="Applied Count"
                  value={selectedPromo.applied_count}
                  disabled
                  variant="outlined"
                  size="small"
                />
              </Box>

              {/* Editable fields */}
              <Typography variant="h6" sx={{ fontWeight: 600, mt: 2, color: 'primary.main' }}>
                Editable Fields
              </Typography>
              
              <TextField
                label="Promo Name"
                value={editFormData.promo_name}
                onChange={(e) => handleEditFormChange('promo_name', e.target.value)}
                variant="outlined"
                size="small"
                required
                fullWidth
              />

              <TextField
                label="Discount Percentage"
                type="number"
                value={editFormData.percent_off}
                onChange={(e) => handleEditFormChange('percent_off', parseFloat(e.target.value) || 0)}
                variant="outlined"
                size="small"
                required
                inputProps={{ min: 0, max: 100, step: 0.01 }}
                fullWidth
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Start Date"
                  type="datetime-local"
                  value={editFormData.start_date}
                  onChange={(e) => handleEditFormChange('start_date', e.target.value)}
                  variant="outlined"
                  size="small"
                  required
                  InputLabelProps={{ shrink: true }}
                />
                
                <TextField
                  label="Expiry Date"
                  type="datetime-local"
                  value={editFormData.expiry_date}
                  onChange={(e) => handleEditFormChange('expiry_date', e.target.value)}
                  variant="outlined"
                  size="small"
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Box>

              <FormControl size="small" required>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editFormData.status}
                  label="Status"
                  onChange={(e) => handleEditFormChange('status', e.target.value)}
                >
                  <SelectMenuItem value="active">Active</SelectMenuItem>
                  <SelectMenuItem value="scheduled">Scheduled</SelectMenuItem>
                  <SelectMenuItem value="expired">Expired</SelectMenuItem>
                  <SelectMenuItem value="disabled">Disabled</SelectMenuItem>
                </Select>
              </FormControl>

              {/* Read-only dates for reference */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
                <TextField
                  label="Stripe Promo ID"
                  value={selectedPromo.stripe_promotion_id || ''}
                  disabled
                  variant="outlined"
                  size="small"
                />
                <TextField
                  label="Stripe Coupon ID"
                  value={selectedPromo.stripe_coupon_id || ''}
                  disabled
                  variant="outlined"
                  size="small"
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleEditModalClose}
            variant="outlined"
            sx={{ borderRadius: 1 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditSubmit}
            variant="contained"
            disabled={editLoading}
            sx={{ borderRadius: 1, ml: 1 }}
          >
            {editLoading ? <CircularProgress size={20} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Promo Modal */}
      <Dialog
        open={addModalOpen}
        onClose={handleAddModalClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            minHeight: 600
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
            Add New Promo
          </Typography>
          <IconButton onClick={handleAddModalClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ px: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <Typography variant="body1" sx={{ color: 'grey.600', mb: 1 }}>
              Create a new promotional campaign with discount coupons for your AI chatbot service.
            </Typography>

            {/* Basic Information */}
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>
              Basic Information
            </Typography>
            
            <TextField
              label="Promo Name"
              value={addFormData.promo_name}
              onChange={(e) => handleAddFormChange('promo_name', e.target.value)}
              variant="outlined"
              size="small"
              required
              fullWidth
              placeholder="e.g., Summer Sale 2025"
              helperText="Enter a descriptive name for this promotional campaign"
            />

            <TextField
              label="Coupon Code"
              value={addFormData.coupon}
              onChange={(e) => handleAddFormChange('coupon', e.target.value.toUpperCase())}
              variant="outlined"
              size="small"
              required
              fullWidth
              placeholder="e.g., SUMMER25"
              helperText="Unique coupon code users will enter (automatically converted to uppercase)"
              inputProps={{ style: { textTransform: 'uppercase' } }}
            />

            <TextField
              label="Discount Percentage"
              type="number"
              value={addFormData.percent_off}
              onChange={(e) => handleAddFormChange('percent_off', parseFloat(e.target.value) || 0)}
              variant="outlined"
              size="small"
              required
              inputProps={{ min: 0, max: 100, step: 0.01 }}
              fullWidth
              placeholder="25.00"
              helperText="Discount percentage (0-100%)"
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>
              }}
            />

            {/* Schedule Settings */}
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mt: 2, mb: 1 }}>
              Schedule Settings
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Start Date & Time"
                type="datetime-local"
                value={addFormData.start_date}
                onChange={(e) => handleAddFormChange('start_date', e.target.value)}
                variant="outlined"
                size="small"
                required
                InputLabelProps={{ shrink: true }}
                helperText="When the promo becomes active"
              />
              
              <TextField
                label="Expiry Date & Time"
                type="datetime-local"
                value={addFormData.expiry_date}
                onChange={(e) => handleAddFormChange('expiry_date', e.target.value)}
                variant="outlined"
                size="small"
                required
                InputLabelProps={{ shrink: true }}
                helperText="When the promo expires"
              />
            </Box>

            <FormControl size="small" required>
              <InputLabel>Initial Status</InputLabel>
              <Select
                value={addFormData.status}
                label="Initial Status"
                onChange={(e) => handleAddFormChange('status', e.target.value)}
              >
                <SelectMenuItem value="scheduled">Scheduled</SelectMenuItem>
                <SelectMenuItem value="active">Active</SelectMenuItem>
                <SelectMenuItem value="disabled">Disabled</SelectMenuItem>
              </Select>
            </FormControl>

            {/* Information Box */}
            <Box sx={{ 
              bgcolor: 'info.light', 
              border: 1, 
              borderColor: 'info.main', 
              borderRadius: 1, 
              p: 2, 
              mt: 2 
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'info.dark', mb: 1 }}>
                📝 Important Notes:
              </Typography>
              <Typography variant="body2" sx={{ color: 'info.dark' }}>
                • Promo ID and Applied Count will be automatically generated<br/>
                • Coupon codes must be unique across all promotions<br/>
                • Choose "Scheduled" status to activate automatically at start date<br/>
                • Created and updated timestamps are managed automatically
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleAddModalClose}
            variant="outlined"
            sx={{ borderRadius: 1 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddSubmit}
            variant="contained"
            disabled={addLoading}
            sx={{ borderRadius: 1, ml: 1 }}
          >
            {addLoading ? <CircularProgress size={20} /> : 'Create Promo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSuccessMessage('')} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Provide a named export as a compatibility shim so imports that expect a named export
// (e.g. `import { PromoManagement } from './pages/PromoManagement'`) will work.
export { PromoManagement };
export default PromoManagement;
