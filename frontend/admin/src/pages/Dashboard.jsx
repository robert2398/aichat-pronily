import { useState, useEffect } from 'react'
import { useFilters } from '../contexts/FiltersContext'
import { apiService } from '../services/api'
import { useScrollToHashOnMount } from '../hooks/useScrollToHashOnMount'

// IMPORTANT: Only ONE dashboard file now (.jsx). Removed .tsx duplicate so this file is what lazy() loads.

export default function Dashboard() {
  const { filters } = useFilters()
  const [kpis, setKpis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  useScrollToHashOnMount()

  useEffect(() => {
    const load = async () => {
      console.log('[Dashboard] Mount. VITE_API_BASE_URL =', import.meta.env.VITE_API_BASE_URL)
      try {
        setLoading(true)
        setError(null)
        const asOfDate = (filters?.dateRange?.to || new Date()).toISOString().split('T')[0]
        console.log('[Dashboard] Fetch KPIs with', { asOfDate, interval: filters.interval })
        const data = await apiService.getKpiMetrics({ asOfDate, period: 'monthly' })
        console.log('[Dashboard] KPI response:', data)
        setKpis(data)
      } catch (e) {
        console.error('[Dashboard] KPI fetch error:', e)
        setError('Unable to load KPI metrics')
      } finally {
        setLoading(false)
      }
    }
    load()
    // re-run if date range changes
  }, [filters.dateRange?.to, filters.interval])

  const formatCurrency = (v, cur='USD') => new Intl.NumberFormat('en-US',{style:'currency',currency:cur}).format(v||0)
  const formatPercent = v => `${(v||0).toFixed(1)}%`
  const pctChange = (curr, prev) => (prev ? ((curr - prev)/prev)*100 : 0)

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Comprehensive monetization and engagement metrics</p>
        <div className="mt-4 text-sm text-gray-500 flex flex-wrap gap-4">
          <span>Interval: {filters.interval}</span>
          <span>Feature: {filters.feature}</span>
          <span>Currency: {filters.currency}</span>
        </div>
      </div>

      <section id="kpis" className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Key Performance Indicators</h2>
        </div>
        {loading && <p className="text-gray-500">Loading KPIs...</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {!loading && !error && kpis && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="ARPU" value={(kpis.ARPU ?? 0).toFixed(2)} change={pctChange(kpis.ARPU, kpis.previous_period?.ARPU)} />
            <KpiCard title="MRR" value={(kpis.MRR ?? 0).toFixed(2)} change={pctChange(kpis.MRR, kpis.previous_period?.MRR)} />
            <KpiCard title="Churn Rate" value={formatPercent(kpis.churn_rate)} change={(kpis.churn_rate - (kpis.previous_period?.churn_rate ?? 0))} percent />
            <KpiCard title="LTV" value={(kpis.LTV ?? 0).toFixed(2)} change={pctChange(kpis.LTV, kpis.previous_period?.LTV)} />
            <KpiCard title="Conversion Rate" value={formatPercent(kpis.conversion_rate)} change={(kpis.conversion_rate - (kpis.previous_period?.conversion_rate ?? 0))} percent />
            <KpiCard title="Total Users" value={(kpis.total_users ?? 0).toLocaleString()} change={pctChange(kpis.total_users, kpis.previous_period?.total_users)} />
            <KpiCard title="Active Subscribers" value={(kpis.active_subscribers ?? 0).toLocaleString()} change={pctChange(kpis.active_subscribers, kpis.previous_period?.active_subscribers)} />
            <KpiCard title="Paying Users" value={(kpis.paying_users ?? 0).toLocaleString()} change={pctChange(kpis.paying_users, kpis.previous_period?.paying_users)} />
          </div>
        )}
        {!loading && !error && !kpis && <p className="text-gray-500">No KPI data available</p>}
      </section>

      <AnchorSection id="monetization" title="Monetization Overview">
        <Placeholder id="revenue-trends" title="Revenue Trends" />
      </AnchorSection>
      <AnchorSection id="subscriptions" title="Subscriptions Overview">
        <Placeholder id="subscription-plans" title="Subscription Plan Summary" />
        <Placeholder id="subscription-history" title="Subscription History" />
      </AnchorSection>
      <AnchorSection id="coins" title="Coins & Virtual Currency">
        <Placeholder id="coins-purchased" title="Coins Purchased Summary" />
        <Placeholder id="coins-by-feature" title="Coins Usage by Feature" />
        <Placeholder id="coins-trends" title="Coins Purchase vs Spend Trends" />
      </AnchorSection>
      <AnchorSection id="engagement" title="Engagement & Usage">
        <Placeholder id="top-active" title="Top Active Users" />
        <Placeholder id="feature-engagement" title="Feature Engagement Breakdown" />
        <Placeholder id="top-characters" title="Top Characters" />
      </AnchorSection>
      <AnchorSection id="promotions" title="Promotions & Marketing">
        <Placeholder id="promotions-performance" title="Promotions Performance" />
        <Placeholder id="top-spenders" title="Top Spenders" />
      </AnchorSection>
    </div>
  )
}

function KpiCard({ title, value, change, percent }) {
  const positive = change > 0
  const negative = change < 0
  const displayChange = isNaN(change) ? 0 : change
  return (
    <div className="p-4 rounded-lg border bg-gradient-to-br from-gray-50 to-white shadow-sm">
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className={"text-xs mt-1 " + (positive ? 'text-green-600' : negative ? 'text-red-600' : 'text-gray-500')}>
        {positive && '+'}{displayChange.toFixed(1)}{percent ? '%' : '%'} vs prev
      </p>
    </div>
  )
}

function Placeholder({ id, title }) {
  return (
    <section id={id} className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
        <p className="text-gray-500">Coming Soon</p>
      </div>
    </section>
  )
}

function AnchorSection({ id, title, children }) {
  return (
    <div id={id} className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="space-y-8">
        {children}
      </div>
    </div>
  )
}
