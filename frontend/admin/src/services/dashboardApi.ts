import type {
  Kpis,
  UsersSeries,
  MessagesSeries,
  SubsOverview,
  SubsSeries,
  RevenueSeries,
  SessionLength,
  RoleRatio,
  CharactersSummary,
  MediaUsage,
  Funnel,
  RetentionCohorts,
  VerificationLogin,
  Heatmap,
  Geography,
  ModelAvailability,
  ContentTrends,
  PromoSummary,
  RedemptionsSeries,
  FreePaid,
  ARPULTV,
  PaidConversion
} from '../types/dashboard';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

// Helper function to build URL with date range params
const buildApiUrl = (endpoint: string, from?: string, to?: string): string => {
  const fullUrl = `${API_BASE_URL}/admin/dashboard${endpoint}`;
  const url = new URL(fullUrl);
  if (from) url.searchParams.set('from', from);
  if (to) url.searchParams.set('to', to);
  return url.toString();
};

// Generic fetch function with error handling
// Accepts an optional bearer token (preferred). If not provided, falls back to
// the signed-in user's token stored in localStorage under 'pronily:auth:token'.
const fetchData = async <T>(endpoint: string, from?: string, to?: string, token?: string): Promise<T> => {
  const url = buildApiUrl(endpoint, from, to);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Prefer explicit token param; otherwise use stored user token
  const authToken = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('pronily:auth:token') : null);
  if (authToken) {
    // Normalize: strip existing Bearer/bearer prefix and send lowercase 'bearer <token>' as backend expects
    const tokenOnly = authToken.replace(/^bearer\s+/i, '').trim();
    headers['Authorization'] = `bearer ${tokenOnly}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// API functions for each endpoint
export const dashboardApi = {
  // KPIs - Analytics & KPIs
  getKpis: (from?: string, to?: string, token?: string): Promise<Kpis> =>
    fetchData('/analytics/kpis', from, to, token),

  // Users - User Analytics
  getUsersTimeseries: (from?: string, to?: string, token?: string): Promise<UsersSeries> =>
    fetchData('/users/timeseries', from, to, token),

  getFreePaidUsers: (from?: string, to?: string, token?: string): Promise<FreePaid> =>
    fetchData('/users/free-paid', from, to, token),

  getFunnel: (from?: string, to?: string, token?: string): Promise<Funnel> =>
    fetchData('/conversions/funnel', from, to, token),

  getRetentionCohorts: (from?: string, to?: string, token?: string): Promise<RetentionCohorts> =>
    fetchData('/users/retention-cohorts', from, to, token),

  getVerificationLogin: (from?: string, to?: string, token?: string): Promise<VerificationLogin> =>
    fetchData('/users/verification-login', from, to, token),

  getGeography: (from?: string, to?: string, token?: string): Promise<Geography> =>
    fetchData('/users/geography', from, to, token),

  getPaidConversion: (from?: string, to?: string, token?: string): Promise<PaidConversion> =>
    fetchData('/conversions/paid-conversion', from, to, token),

  // Revenue & Subscriptions - Revenue Analytics
  getRevenueTimeseries: (from?: string, to?: string, token?: string): Promise<RevenueSeries> =>
    fetchData('/revenue/timeseries', from, to, token),

  getSubscriptionsOverview: (from?: string, to?: string, token?: string): Promise<SubsOverview> =>
    fetchData('/subscriptions/overview', from, to, token),

  getSubscriptionsTimeseries: (from?: string, to?: string, token?: string): Promise<SubsSeries> =>
    fetchData('/subscriptions/timeseries', from, to, token),

  // Engagement - Engagement Analytics
  getMessagesTimeseries: (from?: string, to?: string, token?: string): Promise<MessagesSeries> =>
    fetchData('/engagement/messages-timeseries', from, to, token),

  getSessionLength: (from?: string, to?: string, token?: string): Promise<SessionLength> =>
    fetchData('/engagement/session-length', from, to, token),

  getRoleRatio: (from?: string, to?: string, token?: string): Promise<RoleRatio> =>
    fetchData('/engagement/role-ratio', from, to, token),

  getMediaUsage: (from?: string, to?: string, token?: string): Promise<MediaUsage> =>
    fetchData('/media/usage', from, to, token),

  getHeatmap: (from?: string, to?: string, token?: string): Promise<Heatmap> =>
    fetchData('/engagement/heatmap', from, to, token),

  // Characters - Character Analytics
  getCharactersSummary: (from?: string, to?: string, token?: string): Promise<CharactersSummary> =>
    fetchData('/characters/summary', from, to, token),

  // Monetization - Revenue Analytics
  getArpuLtv: (from?: string, to?: string, token?: string): Promise<ARPULTV> =>
    fetchData('/revenue/arpu-ltv', from, to, token),

  // Promotions
  getPromoSummary: (from?: string, to?: string, token?: string): Promise<PromoSummary> =>
    fetchData('/promotions/summary', from, to, token),

  getRedemptionsTimeseries: (from?: string, to?: string, token?: string): Promise<RedemptionsSeries> =>
    fetchData('/promotions/redemptions-timeseries', from, to, token),

  // System
  getModelAvailability: (from?: string, to?: string, token?: string): Promise<ModelAvailability> =>
    fetchData('/system/model-availability', from, to, token),

  getContentTrends: (from?: string, to?: string, token?: string): Promise<ContentTrends> =>
    fetchData('/content/trends', from, to, token),

  getConfigChanges: (from?: string, to?: string, token?: string): Promise<{ items: Array<{
    id: number;
    category: string;
    parameter_name: string;
    parameter_value: string;
    parameter_description: string;
    updated_at: string;
  }> }> =>
    fetchData('/system/app-config/changes', from, to, token),

  getKpiMetrics: async (params: {
    asOfDate?: string;
    period?: string;
    cohort?: string;
    token?: string;
  } = {}): Promise<{
    total_revenue: number;
    active_users: number;
    conversion_rate: number;
    avg_order_value: number;
    currency: string;
    previous_period?: {
      total_revenue: number;
      active_users: number;
      conversion_rate: number;
      avg_order_value: number;
    };
  }> => {
    const searchParams = new URLSearchParams();
    if (params.asOfDate) searchParams.set('as_of_date', params.asOfDate);
    if (params.period) searchParams.set('period', params.period);
    if (params.cohort) searchParams.set('cohort', params.cohort);
    
    const url = `${API_BASE_URL}/admin/dashboard/api/monetization/metrics/summary?${searchParams}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Prefer explicit token param; otherwise use stored user token
    const authToken = params.token || (typeof localStorage !== 'undefined' ? localStorage.getItem('pronily:auth:token') : null);
    if (authToken) {
      const normalizedToken = authToken.toLowerCase().startsWith('bearer ') ? authToken.slice(7) : authToken;
      headers.Authorization = `bearer ${normalizedToken}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data;
  },
};

// Formatters
export const formatters = {
  currency: (value: number): string => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value),
  
  number: (value: number): string => 
    new Intl.NumberFormat('en-US').format(value),
  
  percentage: (value: number): string => 
    `${value.toFixed(1)}%`,
};
