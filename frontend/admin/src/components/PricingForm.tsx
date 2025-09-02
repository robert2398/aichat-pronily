import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Button,
  Box,
  Typography,
  CircularProgress,
  InputAdornment,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon
} from '@mui/icons-material';

interface PricingFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
}

interface PricingFormData {
  plan_name: string;
  pricing_id: string;
  currency: string;
  price: string;
  billing_cycle: string;
  coin_reward: string;
  status: string;
}

const initialFormData: PricingFormData = {
  plan_name: '',
  pricing_id: '',
  currency: 'USD',
  price: '',
  billing_cycle: 'Monthly',
  coin_reward: '',
  status: 'Draft'
};

const currencyOptions = [
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'INR', label: 'INR (₹)', symbol: '₹' }
];

const billingCycleOptions = [
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Quarterly', label: 'Quarterly' },
  { value: 'HalfYearly', label: 'Half Yearly' },
  { value: 'Yearly', label: 'Yearly' },
  { value: 'OneTime', label: 'One Time' }
];

const statusOptions = [
  { value: 'Active', label: 'Active', color: '#4caf50' },
  { value: 'Inactive', label: 'Inactive', color: '#f44336' },
  { value: 'Draft', label: 'Draft', color: '#ff9800' }
];

export const PricingForm: React.FC<PricingFormProps> = ({
  open,
  onClose,
  onSuccess,
  onError
}) => {
  const [formData, setFormData] = useState<PricingFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<PricingFormData>>({});

  const handleInputChange = (field: keyof PricingFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PricingFormData> = {};

    if (!formData.plan_name.trim()) {
      newErrors.plan_name = 'Plan name is required';
    }

    if (!formData.pricing_id.trim()) {
      newErrors.pricing_id = 'Pricing ID is required';
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else {
      const priceNum = parseFloat(formData.price);
      if (isNaN(priceNum) || priceNum < 0) {
        newErrors.price = 'Please enter a valid price';
      }
    }

    if (!formData.coin_reward.trim()) {
      newErrors.coin_reward = 'Coin reward is required';
    } else {
      const coinRewardNum = parseFloat(formData.coin_reward);
      if (isNaN(coinRewardNum) || coinRewardNum < 0) {
        newErrors.coin_reward = 'Please enter a valid coin reward';
      }
    }

    if (!formData.currency) {
      newErrors.currency = 'Currency is required';
    }

    if (!formData.billing_cycle) {
      newErrors.billing_cycle = 'Billing cycle is required';
    }

    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Import API service dynamically to avoid circular imports
      const { apiService } = await import('../services/api');
      
      const result = await apiService.createPricingPlan({
        plan_name: formData.plan_name.trim(),
        pricing_id: formData.pricing_id.trim(),
        currency: formData.currency,
        price: parseFloat(formData.price),
        billing_cycle: formData.billing_cycle,
        coin_reward: parseFloat(formData.coin_reward),
        status: formData.status
      });

      if (result.success) {
        onSuccess(result.message || 'Pricing plan created successfully!');
        handleClose();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create pricing plan';
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    onClose();
  };

  const selectedCurrency = currencyOptions.find(c => c.value === formData.currency);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: '#6366f1',
                color: 'white'
              }}
            >
              <AddIcon />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'grey.900' }}>
              Create New Pricing Plan
            </Typography>
          </Box>
          <Button
            onClick={handleClose}
            variant="text"
            size="small"
            sx={{ minWidth: 'auto', p: 1, color: 'grey.500' }}
          >
            <CloseIcon />
          </Button>
        </Box>
        <Typography variant="body2" sx={{ color: 'grey.600', mt: 1 }}>
          Add a new pricing plan to your subscription offerings
        </Typography>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Plan Name */}
          <Box>
            <Typography variant="subtitle2" sx={{ color: 'grey.900', mb: 1, fontWeight: 500 }}>
              Plan Name *
            </Typography>
            <TextField
              value={formData.plan_name}
              onChange={(e) => handleInputChange('plan_name', e.target.value)}
              fullWidth
              placeholder="e.g., Premium Plan, Basic Subscription"
              error={!!errors.plan_name}
              helperText={errors.plan_name}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#6366f1',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#6366f1',
                  },
                }
              }}
            />
          </Box>

          {/* Pricing ID */}
          <Box>
            <Typography variant="subtitle2" sx={{ color: 'grey.900', mb: 1, fontWeight: 500 }}>
              Pricing ID *
            </Typography>
            <TextField
              value={formData.pricing_id}
              onChange={(e) => handleInputChange('pricing_id', e.target.value)}
              fullWidth
              placeholder="e.g., stripe_price_id, plan_001"
              error={!!errors.pricing_id}
              helperText={errors.pricing_id || 'Unique identifier for this pricing plan'}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#6366f1',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#6366f1',
                  },
                }
              }}
            />
          </Box>

          {/* Currency and Price Row */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ color: 'grey.900', mb: 1, fontWeight: 500 }}>
                Currency *
              </Typography>
              <FormControl fullWidth error={!!errors.currency}>
                <Select
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  sx={{
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#6366f1',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#6366f1',
                    },
                  }}
                >
                  {currencyOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontWeight: 500 }}>{option.symbol}</Typography>
                        <Typography>{option.label}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ flex: 2 }}>
              <Typography variant="subtitle2" sx={{ color: 'grey.900', mb: 1, fontWeight: 500 }}>
                Price *
              </Typography>
              <TextField
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                fullWidth
                placeholder="0.00"
                error={!!errors.price}
                helperText={errors.price}
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography sx={{ fontWeight: 500, color: 'grey.700' }}>
                        {selectedCurrency?.symbol || '$'}
                      </Typography>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#6366f1',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#6366f1',
                    },
                  }
                }}
              />
            </Box>
          </Box>

          {/* Coin Reward */}
          <Box>
            <Typography variant="subtitle2" sx={{ color: 'grey.900', mb: 1, fontWeight: 500 }}>
              Coin Reward *
            </Typography>
            <TextField
              type="number"
              value={formData.coin_reward}
              onChange={(e) => handleInputChange('coin_reward', e.target.value)}
              fullWidth
              placeholder="0"
              error={!!errors.coin_reward}
              helperText={errors.coin_reward}
              inputProps={{ min: 0, step: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography sx={{ fontWeight: 500, color: 'grey.700' }}>
                      🪙
                    </Typography>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#6366f1',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#6366f1',
                  },
                }
              }}
            />
          </Box>

          {/* Billing Cycle */}
          <Box>
            <Typography variant="subtitle2" sx={{ color: 'grey.900', mb: 1, fontWeight: 500 }}>
              Billing Cycle *
            </Typography>
            <FormControl fullWidth error={!!errors.billing_cycle}>
              <Select
                value={formData.billing_cycle}
                onChange={(e) => handleInputChange('billing_cycle', e.target.value)}
                sx={{
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#6366f1',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#6366f1',
                  },
                }}
              >
                {billingCycleOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Status */}
          <Box>
            <Typography variant="subtitle2" sx={{ color: 'grey.900', mb: 1, fontWeight: 500 }}>
              Status *
            </Typography>
            <FormControl fullWidth error={!!errors.status}>
              <Select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                sx={{
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#6366f1',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#6366f1',
                  },
                }}
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: option.color
                        }}
                      />
                      <Typography>{option.label}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          disabled={loading}
          sx={{
            borderColor: 'grey.300',
            color: 'grey.700',
            '&:hover': {
              borderColor: 'grey.400',
              bgcolor: 'grey.50'
            }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{
            bgcolor: '#6366f1',
            '&:hover': { bgcolor: '#5048e5' },
            ml: 2,
            px: 3,
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)'
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} sx={{ color: 'white' }} />
              <Typography variant="button">Creating...</Typography>
            </Box>
          ) : (
            'Create Pricing Plan'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
