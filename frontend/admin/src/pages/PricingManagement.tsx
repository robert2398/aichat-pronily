import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';
import { PricingForm } from '../components/PricingForm';

// Define the PricingPlan interface locally to avoid import issues
interface PricingPlan {
  plan_id: number;
  plan_name: string;
  pricing_id: string;
  currency?: string;
  discount?: number;
  price: number;
  billing_cycle: string;
  coin_reward: number;
  status: string;
  updated_at: string;
}

const PricingManagement: React.FC = () => {
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  
  // Create form state
  const [createFormOpen, setCreateFormOpen] = useState(false);
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    pricing_id: '',
    price: 0,
    coin_reward: 0,
  status: '',
  discount: 0
  });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchPricingPlans();
  }, []);

  useEffect(() => {
    // Filter plans based on search term
    const filtered = pricingPlans.filter(plan =>
      (plan.plan_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (plan.billing_cycle?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (plan.status?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
    setFilteredPlans(filtered);
  }, [pricingPlans, searchTerm]);

  const fetchPricingPlans = async () => {
    try {
      setLoading(true);
      const data = await apiService.getPricingPlans();
      console.log('Fetched pricing plans:', data);
      setPricingPlans(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch pricing plans. Please try again.');
      console.error('Error fetching pricing plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, plan: PricingPlan) => {
    setAnchorEl(event.currentTarget);
    setSelectedPlan(plan);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    // Don't clear selectedPlan here - we need it for the edit modal
  };

  const handleEditClick = () => {
    if (selectedPlan) {
      setEditForm({
        pricing_id: selectedPlan.pricing_id,
        price: selectedPlan.price,
        coin_reward: selectedPlan.coin_reward,
  status: selectedPlan.status,
  discount: selectedPlan.discount ?? 0
      });
      setEditModalOpen(true);
      setAnchorEl(null); // Just close the menu, keep selectedPlan
    }
  };

  const handleEditFormChange = (field: string, value: string | number) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditSubmit = async () => {
    if (!selectedPlan) return;

    setEditLoading(true);
    try {
      const result = await apiService.updatePricingPlan(selectedPlan.plan_id, editForm);
      
      if (result.success) {
        // Refetch pricing plans to get the updated data
        await fetchPricingPlans();
        
        setSuccessMessage(result.message || 'Pricing plan updated successfully!');
        setEditModalOpen(false);
        setSelectedPlan(null);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pricing plan');
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditCancel = () => {
    setEditModalOpen(false);
  setEditForm({ pricing_id: '', price: 0, coin_reward: 0, status: '', discount: 0 });
    setSelectedPlan(null); // Clear selected plan when modal closes
  };

  const handleCreateSuccess = (message: string) => {
    setSuccessMessage(message);
    fetchPricingPlans(); // Refresh the list
    setCreateFormOpen(false);
  };

  const handleCreateError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const formatPrice = (price: number, currency?: string) => {
    const currencySymbol = currency === 'INR' ? '₹' : '$';
    return `${currencySymbol}${price.toFixed(2)}`;
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

  const getBillingCycleColor = (cycle: string) => {
    switch (cycle.toLowerCase()) {
      case 'monthly':
        return '#2196f3';
      case 'quarterly':
        return '#ff9800';
      case 'yearly':
        return '#4caf50';
      case 'onetime':
        return '#9c27b0';
      default:
        return '#757575';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button onClick={fetchPricingPlans} variant="outlined">
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 600,
            color: 'grey.900',
            mb: 1
          }}
        >
          Pricing Management
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            color: 'grey.600',
            maxWidth: 600
          }}
        >
          Manage pricing plans, subscription tiers, and billing configurations for your AI chatbot service.
        </Typography>
      </Box>

      {/* Header Actions */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <TextField
          placeholder="Search pricing plans..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ minWidth: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'grey.400' }} />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon sx={{ fontSize: 18 }} />}
          onClick={() => setCreateFormOpen(true)}
          aria-label="Create new plan"
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
          Add Plan
        </Button>
      </Box>

      {/* Pricing Plans Table */}
      <Paper 
        elevation={0}
        sx={{ 
          border: 1,
          borderColor: 'grey.200',
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600, color: 'grey.700' }}>Plan Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'grey.700' }}>Currency</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'grey.700' }}>Pricing ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'grey.700' }}>Discount</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'grey.700' }}>Price</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'grey.700' }}>Coin Reward</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'grey.700' }}>Billing Cycle</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'grey.700' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'grey.700' }}>Last Updated</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'grey.700' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPlans.map((plan) => (
                <TableRow 
                  key={plan.plan_id}
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
                      {plan.plan_name}
                    </Typography>
                  </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'grey.700', fontWeight: 600 }}>
                        {plan.currency || 'USD'}
                      </Typography>
                    </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        color: plan.pricing_id === 'to_be_created' ? '#ff9800' : '#1976d2',
                        bgcolor: plan.pricing_id === 'to_be_created' ? '#fff3e0' : '#e3f2fd',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        border: 1,
                        borderColor: plan.pricing_id === 'to_be_created' ? '#ffb74d' : '#90caf9'
                      }}
                    >
                      {plan.pricing_id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: 'grey.700', fontWeight: 600 }}>
                      {typeof plan.discount === 'number' ? `${plan.discount}%` : '—'}
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
                      {formatPrice(plan.price, plan.currency)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600,
                        color: '#ff9800',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}
                    >
                      🪙 {plan.coin_reward}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={plan.billing_cycle}
                      size="small"
                      sx={{
                        bgcolor: `${getBillingCycleColor(plan.billing_cycle)}20`,
                        color: getBillingCycleColor(plan.billing_cycle),
                        fontWeight: 500,
                        border: 'none'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={plan.status}
                      size="small"
                      sx={{
                        bgcolor: plan.status.toLowerCase() === 'active' ? '#e8f5e8' : '#ffebee',
                        color: plan.status.toLowerCase() === 'active' ? '#2e7d32' : '#d32f2f',
                        fontWeight: 500,
                        border: 'none'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: 'grey.600' }}>
                      {formatDate(plan.updated_at)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={(e) => handleMenuClick(e, plan)}
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
      </Paper>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => { setAnchorEl(null); setSelectedPlan(null); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleEditClick}>
          <EditIcon sx={{ mr: 1, fontSize: 18 }} />
          Edit Plan
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); setSelectedPlan(null); }} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 18 }} />
          Delete Plan
        </MenuItem>
      </Menu>

      {/* Edit Pricing Modal */}
      <Dialog 
        open={editModalOpen} 
        onClose={handleEditCancel}
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Edit Pricing Plan
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Non-editable fields for reference */}
            <Box>
              <Typography variant="subtitle2" sx={{ color: 'grey.600', mb: 1 }}>
                Plan Name (Read-only)
              </Typography>
              <TextField
                value={selectedPlan?.plan_name || ''}
                disabled
                fullWidth
                size="small"
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ color: 'grey.600', mb: 1 }}>
                Billing Cycle (Read-only)
              </Typography>
              <TextField
                value={selectedPlan?.billing_cycle || ''}
                disabled
                fullWidth
                size="small"
              />
            </Box>

            {/* Editable fields */}
            <Box>
              <Typography variant="subtitle2" sx={{ color: 'grey.900', mb: 1 }}>
                Pricing ID *
              </Typography>
              <TextField
                value={editForm.pricing_id}
                onChange={(e) => handleEditFormChange('pricing_id', e.target.value)}
                fullWidth
                size="small"
                placeholder="Enter Stripe pricing ID"
                helperText="This should match your Stripe price ID"
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ color: 'grey.900', mb: 1 }}>
                Price *
              </Typography>
              <TextField
                type="number"
                value={editForm.price}
                onChange={(e) => handleEditFormChange('price', parseFloat(e.target.value) || 0)}
                fullWidth
                size="small"
                placeholder="0.00"
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ color: 'grey.900', mb: 1 }}>
                Discount (%)
              </Typography>
              <TextField
                type="number"
                value={(editForm as any).discount ?? 0}
                onChange={(e) => handleEditFormChange('discount', parseFloat(e.target.value) || 0)}
                fullWidth
                size="small"
                placeholder="0"
                inputProps={{ min: 0, max: 100, step: 1 }}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ color: 'grey.900', mb: 1 }}>
                Coin Reward *
              </Typography>
              <TextField
                type="number"
                value={editForm.coin_reward}
                onChange={(e) => handleEditFormChange('coin_reward', parseFloat(e.target.value) || 0)}
                fullWidth
                size="small"
                placeholder="0"
                inputProps={{ min: 0, step: 1 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">🪙</InputAdornment>,
                }}
              />
            </Box>

            <Box>
              <FormControl fullWidth size="small">
                <InputLabel>Status *</InputLabel>
                <Select
                  value={editForm.status}
                  onChange={(e) => handleEditFormChange('status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                  <MenuItem value="Draft">Draft</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={handleEditCancel}
            variant="outlined"
            disabled={editLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleEditSubmit}
            variant="contained"
            disabled={editLoading}
            sx={{ 
              bgcolor: '#6366f1',
              '&:hover': { bgcolor: '#5048e5' },
              ml: 2
            }}
          >
            {editLoading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Save Changes'}
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

      {/* Empty State */}
      {filteredPlans.length === 0 && !loading && (
        <Box 
          sx={{ 
            textAlign: 'center', 
            py: 8,
            mt: 4
          }}
        >
          <Typography variant="h6" sx={{ mb: 1, color: 'grey.500' }}>
            No pricing plans found
          </Typography>
          <Typography variant="body2" sx={{ color: 'grey.400' }}>
            {searchTerm ? 'Try adjusting your search criteria' : 'Create your first pricing plan to get started'}
          </Typography>
        </Box>
      )}

      {/* Create Pricing Form */}
      <PricingForm
        open={createFormOpen}
        onClose={() => setCreateFormOpen(false)}
        onSuccess={handleCreateSuccess}
        onError={handleCreateError}
      />
    </Container>
  );
};

// Provide a named export as a compatibility shim so imports that expect a named export
// (e.g. `import { PricingManagement } from './pages/PricingManagement'`) will work.
export { PricingManagement };
export default PricingManagement;
