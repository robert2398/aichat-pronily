import React, { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SectionCard } from './SectionCard'
import { useFilters } from '../context/FiltersContext'
import { marketingApi } from '../services/marketingApi'

function currency(n: number, cur = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(n || 0)
}

export const TopSpendersTable: React.FC = () => {
  const { filters, setFilters } = useFilters()
  const [plan, setPlan] = useState<string>(filters.plan || 'all')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['top-spenders', filters.fromISO, filters.toISO, plan],
    queryFn: () => marketingApi.getTopSpenders({ startDate: filters.fromISO, endDate: filters.toISO, limit: 20, metric: 'revenue', plan }),
    enabled: Boolean(filters.fromISO && filters.toISO),
  })

  useEffect(() => {
    const onRefetch = () => refetch()
    window.addEventListener('dashboard:promotions:refetch', onRefetch)
    return () => window.removeEventListener('dashboard:promotions:refetch', onRefetch)
  }, [refetch])

  useEffect(() => { setFilters(prev => ({ ...prev, plan })) }, [plan, setFilters])

  const rows = useMemo(() => {
    const list = Array.isArray((data as any)?.top_spenders) ? (data as any).top_spenders : []
    return [...list].sort((a: any, b: any) => (b.total_revenue||0) - (a.total_revenue||0))
  }, [data])

  const planOptions = useMemo(() => {
    const set = new Set<string>(['all'])
    rows.forEach((r: any) => { if (r.subscription_plan) set.add(String(r.subscription_plan)) })
    return Array.from(set)
  }, [rows])

  const copyUserId = (id: string | number) => {
    navigator.clipboard?.writeText(String(id))
  }

  const viewUser = (id: string | number) => {
    const url = `/admin/users/${id}`
    window.open(url, '_blank')
  }

  return (
    <SectionCard
      title="Top Spenders"
      description="Leaderboard of users by total revenue"
      isLoading={isLoading}
      error={error ? String(error) : null}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Plan:</label>
          <select className="border rounded px-2 py-1 text-sm" value={plan} onChange={(e) => setPlan(e.target.value)}>
            {planOptions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="text-xs text-gray-500">Range: {filters.fromISO} → {filters.toISO}</div>
      </div>

      <div className="overflow-x-auto border rounded-md">
        <table className="min-w-full text-xs">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Rank</th>
              <th className="px-3 py-2 text-left font-medium">User</th>
              <th className="px-3 py-2 text-left font-medium">Plan</th>
              <th className="px-3 py-2 text-right font-medium">Total Revenue ($)</th>
              <th className="px-3 py-2 text-right font-medium">Sub Fees ($)</th>
              <th className="px-3 py-2 text-right font-medium">Coin Purch ($)</th>
              <th className="px-3 py-2 text-right font-medium">Coins Purchased</th>
              <th className="px-3 py-2 text-right font-medium">Coins Spent</th>
              <th className="px-3 py-2 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any, idx: number) => (
              <tr key={r.user_id} className="odd:bg-background even:bg-muted/20">
                <td className="px-3 py-1.5">{idx + 1}</td>
                <td className="px-3 py-1.5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {r.avatar_url ? (
                      <img src={r.avatar_url} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-200" />
                    )}
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">{r.user_email || `User ${r.user_id}`}</span>
                      <span className="text-[10px] text-gray-500">ID: {r.user_id}</span>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-1.5">{r.subscription_plan || '—'}</td>
                <td className="px-3 py-1.5 text-right tabular-nums font-semibold">{currency(r.total_revenue||0)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{r.subscription_fees == null ? '—' : currency(r.subscription_fees)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{r.coin_purchase_revenue == null ? '—' : currency(r.coin_purchase_revenue)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{(r.coins_purchased ?? 0).toLocaleString()}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{(r.coins_spent ?? 0).toLocaleString()}</td>
                <td className="px-3 py-1.5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button className="text-indigo-600 hover:underline text-xs" onClick={() => viewUser(r.user_id)}>View</button>
                    <button className="text-slate-600 hover:underline text-xs" onClick={() => copyUserId(r.user_id)}>Copy ID</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}

export default TopSpendersTable
