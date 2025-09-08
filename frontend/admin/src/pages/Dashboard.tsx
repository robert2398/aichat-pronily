import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface KpiData {
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
}

export default function Dashboard() {
  console.log('🏠 Dashboard component mounted!');
  
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch KPI data using the same pattern as Users.tsx
  useEffect(() => {
    const fetchKpiData = async () => {
      try {
        console.log('🎯 Dashboard: Starting KPI data fetch...');
        setLoading(true);
        setError(null);
        const data = await apiService.getKpiMetrics({
          asOfDate: new Date().toISOString().split('T')[0],
          period: 'monthly'
        });
        console.log('✅ Dashboard: KPI data received:', data);
        setKpiData(data);
      } catch (err) {
        console.error('❌ Dashboard: Error fetching KPI data:', err);
        setError('Failed to fetch KPI metrics. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchKpiData();
  }, []);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const calculateChange = (current: number, previous: number) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-8">
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="text-center py-8 text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* KPIs Section */}
      <section id="kpis">
        <h2 className="text-2xl font-bold mb-4">Key Performance Indicators</h2>
        {kpiData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
              <p className="text-2xl font-bold">{formatCurrency(kpiData.total_revenue, kpiData.currency)}</p>
              {kpiData.previous_period && (
                <p className="text-sm text-green-600">
                  +{calculateChange(kpiData.total_revenue, kpiData.previous_period.total_revenue).toFixed(1)}% vs previous period
                </p>
              )}
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Active Users</h3>
              <p className="text-2xl font-bold">{kpiData.active_users.toLocaleString()}</p>
              {kpiData.previous_period && (
                <p className="text-sm text-green-600">
                  +{calculateChange(kpiData.active_users, kpiData.previous_period.active_users).toFixed(1)}% vs previous period
                </p>
              )}
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Conversion Rate</h3>
              <p className="text-2xl font-bold">{formatPercent(kpiData.conversion_rate)}</p>
              {kpiData.previous_period && (
                <p className="text-sm text-green-600">
                  +{(kpiData.conversion_rate - kpiData.previous_period.conversion_rate).toFixed(1)}% vs previous period
                </p>
              )}
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Average Order Value</h3>
              <p className="text-2xl font-bold">{formatCurrency(kpiData.avg_order_value, kpiData.currency)}</p>
              {kpiData.previous_period && (
                <p className="text-sm text-green-600">
                  +{calculateChange(kpiData.avg_order_value, kpiData.previous_period.avg_order_value).toFixed(1)}% vs previous period
                </p>
              )}
            </div>
          </div>
        ) : (
          <p>No KPI data available</p>
        )}
      </section>

      {/* Placeholder sections for other components */}
      <section id="revenue-trends" className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Revenue Trends - Coming Soon</p>
      </section>

      <section id="coins-purchased" className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Coins Purchased Summary - Coming Soon</p>
      </section>

      <section id="coins-by-feature" className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Coins Usage by Feature - Coming Soon</p>
      </section>

      <section id="coins-trends" className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Coins Trends - Coming Soon</p>
      </section>

      <section id="subscription-plans" className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Subscription Plan Summary - Coming Soon</p>
      </section>

      <section id="subscription-history" className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Subscription History - Coming Soon</p>
      </section>

      <section id="top-spenders" className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Top Spenders - Coming Soon</p>
      </section>

      <section id="top-active" className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Top Active Users - Coming Soon</p>
      </section>

      <section id="feature-engagement" className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Feature Engagement Breakdown - Coming Soon</p>
      </section>

      <section id="top-characters" className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Top Characters - Coming Soon</p>
      </section>

      <section id="promotions-performance" className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Promotions Performance - Coming Soon</p>
      </section>
    </div>
  )
}
