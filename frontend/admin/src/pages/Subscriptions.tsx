import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Container,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  CircularProgress
} from '@mui/material';
import { Check } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import type { PricingPlan } from '../services/api';

// Static plan features and metadata
const planFeatures = {
  free: {
    title: 'Free',
    description: 'Perfect for casual users exploring character AI for the first time.',
    features: [
      '20 AI chats in total',
      'Create 1 custom character',
      'Access to Basic Chat Model',
      'Browse and chat with 20 default characters',
      'Cross-platform access (Web, iOS, Android)',
    ],
    buttonText: 'Get started',
    buttonVariant: 'outlined' as const,
    popular: false,
    trialText: null,
    tagline: 'Perfect for casual users exploring character AI for the first time.',
  },
  pro: {
    title: 'Pro',
    description: 'Ideal for creators, role-players, and daily users who want more.',
    features: [
      'Includes everything in Free',
      'Access to Standard Chat Model (faster, smarter replies)',
      'Full access to all default characters',
      '500 chats per day',
      'Create up to 20 custom characters',
      'Generate up to 10 AI images per character daily',
      'Save chat history & resume anytime',
      'Access to advanced character settings',
      'Search chat history',
    ],
    buttonText: 'Get started',
    buttonVariant: 'contained' as const,
    popular: true,
    trialText: '30 days free trial',
    tagline: 'Ideal for creators, role-players, and daily users who want more.',
  },
  premium: {
    title: 'Premium',
    description: 'Built for power users, streamers, community leaders, and serious creators.',
    features: [
      'Includes everything in Pro',
      'Unlimited chats — no limits, ever',
      'Create unlimited custom characters',
      'Explore and chat with unlimited characters',
      'Early access to new features & models',
      'Priority server access for peak-time performance',
      'Generate up to 30 AI images per character daily',
      'Dedicated support & feedback channel',
      'Make conversations immersive with voice chat',
      'Influence roadmap with VIP feedback voting',
    ],
    buttonText: 'Get started',
    buttonVariant: 'contained' as const,
    popular: false,
    trialText: null,
    tagline: 'Built for power users, streamers, community leaders, and serious creators.',
  },
};

export const Subscriptions: React.FC = () => {
  const navigate = useNavigate();
  const [frequency, setFrequency] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [error, setError] = useState<string | null>(null);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  useEffect(() => {
    fetchPricingPlans();
  }, []);

  const fetchPricingPlans = async () => {
    try {
      setPlansLoading(true);
      const data = await apiService.getPricingPlans();
      setPricingPlans(data);
    } catch (err) {
      setError('Failed to fetch pricing plans. Please try again.');
      console.error('Error fetching pricing plans:', err);
    } finally {
      setPlansLoading(false);
    }
  };

  const formatPrice = (price: number, billingCycle: string) => {
    const cycleLabel = billingCycle.toLowerCase();
    if (cycleLabel === 'monthly') return { amount: price, period: 'per month/user' };
    if (cycleLabel === 'quarterly') return { amount: price, period: 'per quarter/user' };
    if (cycleLabel === 'yearly') return { amount: price, period: 'per year' };
    return { amount: price, period: '' };
  };

  const getPlansForFrequency = () => {
    const frequencyMap = {
      monthly: 'Monthly',
      quarterly: 'Quarterly', 
      yearly: 'Yearly'
    };

    const currentFrequency = frequencyMap[frequency];
    const filteredPlans = pricingPlans.filter(plan => 
      plan.billing_cycle === currentFrequency && plan.status.toLowerCase() === 'active'
    );

    // Group by plan name and create display data
    const plansByName = filteredPlans.reduce((acc, plan) => {
      const planKey = plan.plan_name.toLowerCase();
      if (!acc[planKey]) {
        acc[planKey] = plan;
      }
      return acc;
    }, {} as Record<string, PricingPlan>);

    // Add free plan manually since it's not in the API
    const displayPlans: any[] = [
      {
        ...planFeatures.free,
        price: { amount: 0, period: 'per month/user' },
        planName: 'free',
      }
    ];

    // Add Pro plan if exists
    if (plansByName.pro) {
      const priceInfo = formatPrice(plansByName.pro.price, plansByName.pro.billing_cycle);
      displayPlans.push({
        ...planFeatures.pro,
        price: priceInfo,
        planName: 'pro',
      });
    }

    // Add Premium plan if exists
    if (plansByName.premium) {
      const priceInfo = formatPrice(plansByName.premium.price, plansByName.premium.billing_cycle);
      displayPlans.push({
        ...planFeatures.premium,
        price: priceInfo,
        planName: 'premium',
      });
    }

    return displayPlans;
  };

  const handleSubscribe = async (planName: string) => {
    if (planName === 'free') return; // No action for free plan

    // Get the current plan data to pass to review page
    const currentPlans = getPlansForFrequency();
    const selectedPlan = currentPlans.find(p => p.planName === planName);
    
    if (selectedPlan) {
      navigate('/plan-review', {
        state: {
          planName: selectedPlan.planName,
          planTitle: selectedPlan.title,
          planDescription: selectedPlan.description,
          features: selectedPlan.features,
          price: selectedPlan.price.amount,
          frequency: frequency,
          originalPrice: selectedPlan.price.amount
        }
      });
    }
  };

  if (plansLoading) {
    return (
      <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <CircularProgress />
          </Box>
        </Container>
      </Box>
    );
  }

  const currentPlans = getPlansForFrequency();

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', py: 8 }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', color: 'grey.900', mb: 4 }}>
            Pricing Plans
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 6 }}>
            <ToggleButtonGroup
              value={frequency}
              exclusive
              onChange={(_, value) => value && setFrequency(value)}
              sx={{ 
                bgcolor: 'white',
                borderRadius: 2,
                '& .MuiToggleButton-root': { 
                  color: 'grey.700',
                  border: 'none',
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  textTransform: 'none',
                  fontWeight: 500,
                  '&.Mui-selected': { 
                    bgcolor: '#6366f1', 
                    color: 'white',
                    '&:hover': {
                      bgcolor: '#5048e5',
                    }
                  },
                  '&:hover': {
                    bgcolor: 'grey.50',
                  }
                }
              }}
            >
              <ToggleButton value="monthly">Monthly</ToggleButton>
              <ToggleButton value="quarterly">Quarterly</ToggleButton>
              <ToggleButton value="yearly">Yearly</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 4, maxWidth: '1200px', mx: 'auto' }}>
          {currentPlans.map((plan) => (
            <Card 
              key={plan.planName} 
              sx={{ 
                position: 'relative',
                borderRadius: 3,
                border: plan.popular ? '2px solid #6366f1' : '1px solid #e5e7eb',
                bgcolor: 'white',
                boxShadow: plan.popular ? '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)' : '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
                },
                display: 'flex',
                flexDirection: 'column',
                overflow: 'visible'
              }}
            >
              {plan.popular && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bgcolor: '#1e293b',
                    color: 'white',
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    zIndex: 1
                  }}
                >
                  {plan.trialText}
                </Box>
              )}
              
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'grey.900', mb: 2 }}>
                  {plan.title}
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ color: 'grey.600', mb: 1 }}>
                    Starts at
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'grey.900' }}>
                      ${plan.price.amount === 0 ? '0' : plan.price.amount}
                    </Typography>
                    {plan.price.amount > 0 && plan.price.amount < 1000 && (
                      <Typography variant="body2" sx={{ color: 'grey.600', ml: 1 }}>
                        {plan.price.period}
                      </Typography>
                    )}
                    {plan.price.amount >= 1000 && (
                      <Typography variant="body2" sx={{ color: 'grey.600', ml: 1 }}>
                        per year
                      </Typography>
                    )}
                  </Box>
                </Box>
                
                <Typography variant="body1" sx={{ color: 'grey.600', mb: 4 }}>
                  {plan.description}
                </Typography>

                <Button
                  onClick={() => handleSubscribe(plan.planName)}
                  variant={plan.buttonVariant}
                  fullWidth
                  sx={{ 
                    mb: 4,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    ...(plan.buttonVariant === 'contained' && {
                      bgcolor: '#6366f1',
                      '&:hover': { bgcolor: '#5048e5' },
                    }),
                    ...(plan.buttonVariant === 'outlined' && {
                      borderColor: '#d1d5db',
                      color: 'grey.700',
                      '&:hover': { 
                        borderColor: '#6366f1',
                        bgcolor: 'rgba(99, 102, 241, 0.04)'
                      },
                    })
                  }}
                >
                  {plan.buttonText}
                </Button>
                
                <Box sx={{ flexGrow: 1 }}>
                  {plan.price.amount === 0 && (
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'grey.900', mb: 2 }}>
                      Free, forever
                    </Typography>
                  )}
                  {plan.price.amount > 0 && plan.planName !== 'premium' && (
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'grey.900', mb: 2 }}>
                      Free plan features, plus:
                    </Typography>
                  )}
                  {plan.planName === 'premium' && (
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'grey.900', mb: 2 }}>
                      Organization plan features, plus:
                    </Typography>
                  )}
                  
                  <List dense sx={{ p: 0 }}>
                    {plan.features.map((feature: string, featureIndex: number) => (
                      <ListItem key={featureIndex} sx={{ px: 0, py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 24, mr: 1 }}>
                          <Check sx={{ fontSize: 16, color: '#22c55e' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={feature} 
                          primaryTypographyProps={{ 
                            variant: 'body2',
                            sx: { color: 'grey.700', lineHeight: 1.5 }
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mt: 4, mx: 'auto', maxWidth: '600px' }}>
            {error}
          </Alert>
        )}
      </Container>
    </Box>
  );
};
