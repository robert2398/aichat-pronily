import React, { useMemo, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SectionCard } from './SectionCard'
import { useFilters } from '../context/FiltersContext'
import { marketingApi } from '../services/marketingApi'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type StatusOpt = 'all' | 'active' | 'expired'

function currency(n: number, cur = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(n || 0)
}

export const PromotionsPerformance: React.FC = () => {
  const { filters } = useFilters()
  const [status, setStatus] = useState<StatusOpt>('all')
  const [search, setSearch] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['promotions-performance', filters.fromISO, filters.toISO, status],
    queryFn: () => marketingApi.getPromotionsPerformance({ startDate: filters.fromISO, endDate: filters.toISO, status }),
    enabled: Boolean(filters.fromISO && filters.toISO),
  })

  useEffect(() => {
    const onRefetch = () => refetch()
    window.addEventListener('dashboard:promotions:refetch', onRefetch)
    return () => window.removeEventListener('dashboard:promotions:refetch', onRefetch)
  }, [refetch])

  const rows = useMemo(() => {
    const list = Array.isArray((data as any)?.promotions) ? (data as any).promotions : []
    return list
      .filter((p: any) => !search || String(p.promo_code).toLowerCase().includes(search.toLowerCase()))
      .sort((a: any, b: any) => (b.total_revenue_generated || 0) - (a.total_revenue_generated || 0))
  }, [data, search])

  const chartData = useMemo(() => rows.slice(0, 10).map((r: any) => ({ code: r.promo_code, revenue: r.total_revenue_generated })), [rows])

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code)
  }

  const openPromo = (code: string) => {
    // Navigate to promo management page with query param if exists
    try {
      const url = `/admin/promo?code=${encodeURIComponent(code)}`
      window.open(url, '_blank')
    } catch {}
  }

  return (
    <SectionCard
      title="Promotions Performance"
      description="Track promo usage, revenue impact, and acquisition"
      isLoading={isLoading}
      error={error ? String(error) : null}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Status:</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as StatusOpt)} className="border rounded px-2 py-1 text-sm">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Search code:</label>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. SPRING50" className="border rounded px-2 py-1 text-sm" />
        </div>
        <div className="text-xs text-gray-500">Range: {filters.fromISO} → {filters.toISO}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 overflow-x-auto border rounded-md">
          <table className="min-w-full text-xs">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Code</th>
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-right font-medium">Redeemed</th>
                <th className="px-3 py-2 text-right font-medium">Coin Purch</th>
                <th className="px-3 py-2 text-right font-medium">Subscriptions</th>
                <th className="px-3 py-2 text-right font-medium">Discount Given</th>
                <th className="px-3 py-2 text-right font-medium">Revenue Generated</th>
                <th className="px-3 py-2 text-right font-medium">Avg $/Use</th>
                <th className="px-3 py-2 text-right font-medium">New Customers</th>
                <th className="px-3 py-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.promo_code} className="odd:bg-background even:bg-muted/20">
                  <td className="px-3 py-1.5 whitespace-nowrap">
                    <span className="font-mono text-[11px]">{r.promo_code}</span>
                  </td>
                  <td className="px-3 py-1.5">{r.promo_name || '—'}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{(r.times_redeemed||0).toLocaleString()}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{(r.coin_purchase_count||0).toLocaleString()}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{(r.subscription_count||0).toLocaleString()}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{currency(r.total_discount_given||0)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums font-semibold">{currency(r.total_revenue_generated||0)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{currency(r.avg_revenue_per_use||0)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{(r.new_customers_acquired ?? 0).toLocaleString()}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button className="text-indigo-600 hover:underline text-xs" onClick={() => copyCode(r.promo_code)}>Copy code</button>
                      <button className="text-slate-600 hover:underline text-xs" onClick={() => openPromo(r.promo_code)}>Open promo</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border rounded-md p-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Top by Revenue</h4>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} layout="vertical" margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="code" width={90} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: any) => currency(Number(v))} />
                <Bar dataKey="revenue" fill="#6366F1" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

export default PromotionsPerformance
