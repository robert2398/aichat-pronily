import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Stack,
  Paper,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { 
  Check, 
  ArrowBack, 
  LocalOffer,
  CreditCard,
  Security,
  Schedule 
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { apiService } from '../services/api';
import type { Promo } from '../services/api';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string);

interface PlanReviewState {
  planName: string;
  planTitle: string;
  planDescription: string;
  features: string[];
  price: number;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  originalPrice: number;
}

export const PlanReview: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const planData = location.state as PlanReviewState;

  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<Promo | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if no plan data
  useEffect(() => {
    if (!planData) {
      navigate('/subscriptions');
    }
  }, [planData, navigate]);

  if (!planData) {
    return null;
  }

  const { planName, planTitle, planDescription, features, frequency, originalPrice } = planData;

  const calculateDiscount = () => {
    if (!appliedPromo) return 0;
    return (originalPrice * appliedPromo.percent_off) / 100;
  };

  const finalPrice = originalPrice - calculateDiscount();

  const formatFrequency = (freq: string) => {
    switch (freq) {
      case 'monthly': return 'month';
      case 'quarterly': return 'quarter';
      case 'yearly': return 'year';
      default: return freq;
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    
    setPromoLoading(true);
    setPromoError('');
    
    try {
      const promos = await apiService.getPromos();
      const validPromo = promos.find(p => 
        p.coupon === promoCode.trim() && 
        p.status.toLowerCase() === 'active'
      );
      
      if (validPromo) {
        setAppliedPromo(validPromo);
        setPromoError('');
      } else {
        setPromoError('Invalid or expired promo code');
        setAppliedPromo(null);
      }
    } catch (err) {
      setPromoError('Failed to validate promo code');
      setAppliedPromo(null);
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoError('');
  };

  const handleProceedToPayment = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await apiService.createCheckoutSession(
        planName, 
        'user@example.com', 
        frequency
      );
      
      const stripe = await stripePromise;
      if (stripe && result.session_id) {
        await stripe.redirectToCheckout({ sessionId: result.session_id });
      } else {
        setError('Failed to retrieve a valid session ID.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/subscriptions')}
            sx={{ mb: 2, color: 'grey.600' }}
          >
            Back to Plans
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'grey.900' }}>
            Review Your Plan
          </Typography>
          <Typography variant="body1" sx={{ color: 'grey.600', mt: 1 }}>
            Review your selected plan and apply any promo codes before checkout
          </Typography>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          gap: 4, 
          flexDirection: { xs: 'column', lg: 'row' },
          alignItems: 'flex-start'
        }}>
          {/* Plan Details */}
          <Box sx={{ flex: 2, minWidth: 0 }}>
            <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'grey.900', mb: 1 }}>
                  {planTitle} Plan
                </Typography>
                <Typography variant="body1" sx={{ color: 'grey.600' }}>
                  {planDescription}
                </Typography>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Features */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'grey.900', mb: 2 }}>
                  What's included:
                </Typography>
                <List dense sx={{ p: 0 }}>
                  {features.map((feature, index) => (
                    <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 24, mr: 1 }}>
                        <Check sx={{ fontSize: 16, color: '#22c55e' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={feature} 
                        primaryTypographyProps={{ 
                          variant: 'body2',
                          sx: { color: 'grey.700' }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Promo Code Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'grey.900', mb: 2 }}>
                  Promo Code
                </Typography>
                
                {!appliedPromo ? (
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <TextField
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      size="small"
                      sx={{ flexGrow: 1 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocalOffer sx={{ fontSize: 20, color: 'grey.500' }} />
                          </InputAdornment>
                        ),
                      }}
                      error={!!promoError}
                      helperText={promoError}
                    />
                    <Button
                      onClick={handleApplyPromo}
                      disabled={promoLoading || !promoCode.trim()}
                      variant="outlined"
                      sx={{ 
                        minWidth: 100,
                        borderColor: '#d1d5db',
                        color: 'grey.700',
                        '&:hover': { 
                          borderColor: '#6366f1',
                          bgcolor: 'rgba(99, 102, 241, 0.04)'
                        }
                      }}
                    >
                      {promoLoading ? <CircularProgress size={20} /> : 'Apply'}
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: '#f0f9ff', 
                    border: '1px solid #0ea5e9', 
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocalOffer sx={{ color: '#0ea5e9' }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'grey.900' }}>
                          {appliedPromo.coupon}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'grey.600' }}>
                          {appliedPromo.percent_off}% off
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      size="small"
                      onClick={handleRemovePromo}
                      sx={{ color: 'grey.600' }}
                    >
                      Remove
                    </Button>
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>

          {/* Order Summary */}
          <Box sx={{ flex: 1, minWidth: { xs: '100%', lg: '300px' } }}>
            <Paper sx={{ 
              p: 4, 
              borderRadius: 3, 
              border: '1px solid #e5e7eb', 
              position: { lg: 'sticky' }, 
              top: 24,
              height: 'fit-content'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'grey.900', mb: 3 }}>
                Order Summary
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'grey.600' }}>
                    {planTitle} Plan ({formatFrequency(frequency)})
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    ${originalPrice}
                  </Typography>
                </Box>
                
                {appliedPromo && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#22c55e' }}>
                      Promo discount
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#22c55e', fontWeight: 500 }}>
                      -${calculateDiscount().toFixed(2)}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Total
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  ${finalPrice.toFixed(2)}
                </Typography>
              </Box>

              <Button
                onClick={handleProceedToPayment}
                disabled={loading}
                variant="contained"
                fullWidth
                size="large"
                startIcon={loading ? <CircularProgress size={20} /> : <CreditCard />}
                sx={{ 
                  bgcolor: '#6366f1',
                  '&:hover': { bgcolor: '#5048e5' },
                  '&:disabled': { bgcolor: 'grey.400' },
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  mb: 2
                }}
              >
                {loading ? 'Processing...' : 'Proceed to Payment'}
              </Button>

              {/* Security & Billing Info */}
              <Stack spacing={1} sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Security sx={{ fontSize: 16, color: 'grey.500' }} />
                  <Typography variant="caption" sx={{ color: 'grey.600' }}>
                    Secure payment with Stripe
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Schedule sx={{ fontSize: 16, color: 'grey.500' }} />
                  <Typography variant="caption" sx={{ color: 'grey.600' }}>
                    Cancel anytime
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 4 }}>
            {error}
          </Alert>
        )}
      </Container>
    </Box>
  );
};
