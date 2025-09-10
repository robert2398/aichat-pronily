import { useState, useEffect } from 'react'
import { useFilters } from '../context/FiltersContext'
import { FilterBar } from '../components/dashboard/FilterBar'
import { RevenueTrendsChart } from '../components/RevenueTrendsChart'
import { SubscriptionHistory } from '../components/SubscriptionHistory'
import { SubscriptionPlanSummary } from '../components/SubscriptionPlanSummary'
import { useQueryClient } from '@tanstack/react-query'
import { apiService } from '../services/api'
import { useScrollToHashOnMount } from '../hooks/useScrollToHashOnMount'
import { CoinsPurchasedSummary } from '../components/CoinsPurchasedSummary'
import { CoinsByFeature } from '../components/CoinsByFeature'
import { CoinsPurchasedVsSpent } from '../components/CoinsPurchasedVsSpent'
import { FeatureEngagementBreakdown } from '../components/FeatureEngagementBreakdown'
import { TopCharacters } from '../components/TopCharacters'
import { TopActiveUsersTable } from '../components/TopActiveUsersTable'
import { engagementApi } from '../services/engagementApi.ts'
import { PromotionsPerformance } from '../components/PromotionsPerformance'
import { TopSpendersTable } from '../components/TopSpendersTable'
import { UserLtvPanel } from '../components/UserLtvPanel'

// IMPORTANT: Only ONE dashboard file now (.jsx). Removed .tsx duplicate so this file is what lazy() loads.

export default function Dashboard() {
  const { filters } = useFilters()
  const queryClient = useQueryClient()
  const [kpis, setKpis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [ltvOpen, setLtvOpen] = useState(false)
  const [ltvUserId, setLtvUserId] = useState('')
  useScrollToHashOnMount()

  useEffect(() => {
    const load = async () => {
      console.log('[Dashboard] Mount. VITE_API_BASE_URL =', import.meta.env.VITE_API_BASE_URL)
      try {
        setLoading(true)
        setError(null)
  const asOfDate = filters.toISO
  console.log('[Dashboard] Fetch KPIs with', { asOfDate, interval: filters.interval })
  const data = await apiService.getKpiMetrics({ asOfDate, period: filters.interval || 'monthly' })
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
  }, [filters.toISO, filters.interval])

  // Refetch KPIs when user explicitly clicks Overview in sidebar
  useEffect(() => {
    const handler = () => {
      (async () => {
        try {
          setLoading(true)
          const asOfDate = filters.toISO
          const data = await apiService.getKpiMetrics({ asOfDate, period: filters.interval || 'monthly' })
          setKpis(data)
        } catch (e) {
          setError('Unable to load KPI metrics')
        } finally {
          setLoading(false)
        }
      })()
    }
    window.addEventListener('dashboard:navigate:overview', handler)
    return () => window.removeEventListener('dashboard:navigate:overview', handler)
  }, [filters.toISO, filters.interval])

  // Prefetch subscription-related queries & trigger components to refetch when navigating to subscriptions section
  useEffect(() => {
    const handler = () => {
      const startDate = filters.fromISO
      const endDate = filters.toISO
      // Prefetch plan summary
      queryClient.prefetchQuery({
        queryKey: ['subscription-plan-summary', filters.toISO],
        queryFn: () => apiService.getSubscriptionPlanSummary({ asOfDate: filters.toISO })
      })
      // Prefetch subscription history for default metric/interval
      queryClient.prefetchQuery({
        queryKey: ['subscription-history', startDate, endDate, 'active_count', filters.interval || 'monthly'],
        queryFn: () => apiService.getSubscriptionHistory({ startDate, endDate, metric: 'active_count', interval: filters.interval || 'monthly' })
      })
      // Dispatch internal events so child components can explicitly refetch with their current local state
      window.dispatchEvent(new CustomEvent('dashboard:subscriptions:refetch'))
    }
    window.addEventListener('dashboard:navigate:subscriptions', handler)
    return () => window.removeEventListener('dashboard:navigate:subscriptions', handler)
  }, [filters.fromISO, filters.toISO, queryClient])

  // When user clicks Coins in sidebar, components already listen to 'dashboard:navigate:coins'. No extra wiring here.

  // Prefetch engagement-related queries & trigger components to refetch when navigating to engagement section
  useEffect(() => {
    const handler = () => {
      const startDate = filters.fromISO
      const endDate = filters.toISO
      try {
        // Prefetch feature breakdown (default cohort all)
        queryClient.prefetchQuery({
          queryKey: ['engagement-feature-breakdown', startDate, endDate, 'all'],
          queryFn: () => engagementApi.getFeatureBreakdown({ startDate, endDate, cohort: 'all' })
        })
      } catch (e) { console.warn('[Dashboard] Prefetch feature-breakdown failed', e) }
      try {
        // Prefetch top characters (metric coins_spent, limit 10)
        queryClient.prefetchQuery({
          queryKey: ['engagement-top-characters', startDate, endDate, 10],
          queryFn: () => engagementApi.getTopCharacters({ startDate, endDate, metric: 'coins_spent', limit: 10 })
        })
      } catch (e) { console.warn('[Dashboard] Prefetch top-characters failed', e) }
      try {
        // Prefetch top active users (metric coins_spent, feature all) – guard if fn not present
        if (typeof engagementApi.getTopActiveUsers === 'function') {
          queryClient.prefetchQuery({
            queryKey: ['engagement-top-active-users', startDate, endDate, 'coins_spent', 'all'],
            queryFn: () => engagementApi.getTopActiveUsers({ startDate, endDate, metric: 'coins_spent', feature: 'all', limit: 20 })
          })
        } else {
          console.warn('[Dashboard] engagementApi.getTopActiveUsers missing; skip prefetch')
        }
      } catch (e) { console.warn('[Dashboard] Prefetch top-active-users failed', e) }
      // Notify components to refresh using their current local controls
      window.dispatchEvent(new CustomEvent('dashboard:engagement:refetch'))
    }
    window.addEventListener('dashboard:navigate:engagement', handler)
    return () => window.removeEventListener('dashboard:navigate:engagement', handler)
  }, [filters.fromISO, filters.toISO, queryClient])

  // Prefetch promotions & marketing data when navigating to that section
  useEffect(() => {
    const handler = () => {
      const startDate = filters.fromISO
      const endDate = filters.toISO
      try {
        queryClient.prefetchQuery({
          queryKey: ['promotions-performance', startDate, endDate, 'all'],
          queryFn: () => import('../services/marketingApi').then(m => m.marketingApi.getPromotionsPerformance({ startDate, endDate, status: 'all' }))
        })
      } catch (e) { console.warn('[Dashboard] Prefetch promotions-performance failed', e) }
      try {
        queryClient.prefetchQuery({
          queryKey: ['top-spenders', startDate, endDate, 'all'],
          queryFn: () => import('../services/marketingApi').then(m => m.marketingApi.getTopSpenders({ startDate, endDate, limit: 20, metric: 'revenue', plan: 'all' }))
        })
      } catch (e) { console.warn('[Dashboard] Prefetch top-spenders failed', e) }
      window.dispatchEvent(new CustomEvent('dashboard:promotions:refetch'))
    }
    window.addEventListener('dashboard:navigate:promotions', handler)
    return () => window.removeEventListener('dashboard:navigate:promotions', handler)
  }, [filters.fromISO, filters.toISO, queryClient])

  const formatCurrency = (v, cur='USD') => new Intl.NumberFormat('en-US',{style:'currency',currency:cur}).format(v||0)
  const formatPercent = v => `${(v||0).toFixed(1)}%`
  const pctChange = (curr, prev) => (prev ? ((curr - prev)/prev)*100 : 0)

  return (
  <div className="space-y-8">
      <FilterBar />
      {/* Removed top hero section per request to reclaim vertical space */}

      <section id="kpis" className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Key Performance Indicators</h2>
        </div>
        {loading && <p className="text-gray-500">Loading KPIs...</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {!loading && !error && kpis && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard variant="indigo" title="ARPU" value={(kpis.ARPU ?? 0).toFixed(2)} change={pctChange(kpis.ARPU, kpis.previous_period?.ARPU)} />
            <KpiCard variant
a="emerald" title="MRR" value={(kpis.MRR ?? 0).toFixed(2)} change={pctChange(kpis.MRR, kpis.previous_period?.MRR)} />
            <KpiCard variant="amber" title="Churn Rate" value={formatPercent(kpis.churn_rate)} change={(kpis.churn_rate - (kpis.previous_period?.churn_rate ?? 0))} percent />
            <KpiCard variant="violet" title="LTV" value={(kpis.LTV ?? 0).toFixed(2)} change={pctChange(kpis.LTV, kpis.previous_period?.LTV)} />
            <KpiCard variant="sky" title="Conversion Rate" value={formatPercent(kpis.conversion_rate)} change={(kpis.conversion_rate - (kpis.previous_period?.conversion_rate ?? 0))} percent />
            <KpiCard variant="rose" title="Total Users" value={(kpis.total_users ?? 0).toLocaleString()} change={pctChange(kpis.total_users, kpis.previous_period?.total_users)} />
            <KpiCard variant="cyan" title="Active Subscribers" value={(kpis.active_subscribers ?? 0).toLocaleString()} change={pctChange(kpis.active_subscribers, kpis.previous_period?.active_subscribers)} />
            <KpiCard variant="lime" title="Paying Users" value={(kpis.paying_users ?? 0).toLocaleString()} change={pctChange(kpis.paying_users, kpis.previous_period?.paying_users)} />
          </div>
        )}
        {!loading && !error && !kpis && <p className="text-gray-500">No KPI data available</p>}
      </section>

      <AnchorSection id="monetization" title="Monetization Overview">
        <section id="revenue-trends" className="bg-white rounded-lg shadow p-4 md:p-6">
          <RevenueTrendsChart />
        </section>
      </AnchorSection>
      <AnchorSection id="subscriptions" title="Subscriptions Overview">
        <section id="subscription-plans" className="bg-white rounded-lg shadow p-4 md:p-6">
          <SubscriptionPlanSummary />
        </section>
        <section id="subscription-history" className="bg-white rounded-lg shadow p-4 md:p-6">
          <SubscriptionHistory />
        </section>
      </AnchorSection>
      <AnchorSection id="coins" title="Coins & Virtual Currency">
        <section id="coins-purchased" className="bg-white rounded-lg shadow p-4 md:p-6">
          <CoinsPurchasedSummary />
        </section>
        <section id="coins-by-feature" className="bg-white rounded-lg shadow p-4 md:p-6">
          <CoinsByFeature />
        </section>
        <section id="coins-trends" className="bg-white rounded-lg shadow p-4 md:p-6">
          <CoinsPurchasedVsSpent />
        </section>
      </AnchorSection>
      <AnchorSection id="engagement" title="Engagement & Usage">
        <section id="top-active" className="bg-white rounded-lg shadow p-4 md:p-6">
          <TopActiveUsersTable />
        </section>
        <section id="feature-engagement" className="bg-white rounded-lg shadow p-4 md:p-6">
          <FeatureEngagementBreakdown />
        </section>
        <section id="top-characters" className="bg-white rounded-lg shadow p-4 md:p-6">
          <TopCharacters limit={10} />
        </section>
      </AnchorSection>
      <AnchorSection id="promotions" title="Promotions & Marketing">
        <section id="promotions-performance" className="bg-white rounded-lg shadow p-4 md:p-6">
          <PromotionsPerformance />
        </section>
        <section id="top-spenders" className="bg-white rounded-lg shadow p-4 md:p-6">
          <TopSpendersTable />
        </section>
        <section id="per-user-ltv" className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Per-User LTV</h3>
            <div className="flex items-center gap-2">
              <input value={ltvUserId} onChange={(e)=>setLtvUserId(e.target.value)} placeholder="User ID" className="border rounded px-2 py-1 text-sm" style={{width:120}} />
              <button className="bg-indigo-600 text-white text-sm px-3 py-1.5 rounded" onClick={()=>{ if(ltvUserId) setLtvOpen(true) }}>Open LTV</button>
            </div>
          </div>
          <p className="text-sm text-gray-600">Open a detailed lifetime value panel for a specific user. Includes revenue split, coins metrics, and timeline link.</p>
          <UserLtvPanel open={ltvOpen} onClose={()=>setLtvOpen(false)} userId={Number(ltvUserId||0)} />
        </section>
      </AnchorSection>
    </div>
  )
}

function KpiCard({ title, value, change, percent, variant = 'indigo' }) {
  const positive = change > 0
  const negative = change < 0
  const displayChange = isNaN(change) ? 0 : change
  const bgByVariant = {
    indigo: 'from-indigo-50 to-white',
    emerald: 'from-emerald-50 to-white',
    amber: 'from-amber-50 to-white',
    violet: 'from-violet-50 to-white',
    sky: 'from-sky-50 to-white',
    rose: 'from-rose-50 to-white',
    cyan: 'from-cyan-50 to-white',
    lime: 'from-lime-50 to-white',
  }
  const gradient = bgByVariant[variant] || bgByVariant.indigo
  return (
    <div className={`p-4 rounded-lg border bg-gradient-to-br ${gradient} shadow-sm`}>
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
