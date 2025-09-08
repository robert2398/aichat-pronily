import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SectionCard } from './SectionCard'
import { PieChart, Pie, Cell, Tooltip as RTooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { coinsApi, type UsageByFeatureResponse, type UsageByFeatureRow } from '../services/coinsApi.ts'
import { useFilters } from '../context/FiltersContext'

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16']

type SortKey = 'feature' | 'coins_spent' | 'percentage'
type SortDir = 'asc' | 'desc'

export function CoinsByFeature() {
  const { filters, setFilters } = useFilters()
  const startDate = filters.fromISO
  const endDate = filters.toISO
  const [feature, setFeature] = useState<string>(filters.feature || 'all')
  const [sortKey, setSortKey] = useState<SortKey>('coins_spent')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const { data, isLoading, error, refetch } = useQuery<UsageByFeatureResponse>({
    queryKey: ['coins-usage-by-feature', startDate, endDate, feature],
    queryFn: () => coinsApi.getUsageByFeature({ startDate, endDate, feature }),
    enabled: !!startDate && !!endDate,
  })

  useEffect(() => {
    const handler = () => {
      refetch()
    }
    window.addEventListener('dashboard:navigate:coins', handler)
    window.addEventListener('dashboard:coins:refetch', handler)
    return () => {
      window.removeEventListener('dashboard:navigate:coins', handler)
      window.removeEventListener('dashboard:coins:refetch', handler)
    }
  }, [refetch])

  const rows: UsageByFeatureRow[] = useMemo(() => {
    const list = Array.isArray(data?.by_feature) ? data!.by_feature : []
    const total = data?.total_coins_spent || list.reduce((s, r) => s + (r.coins_spent || 0), 0)
    // ensure percentage
    const enhanced = list.map(r => ({ ...r, percentage: r.percentage ?? (total ? (r.coins_spent / total) * 100 : 0) }))
    const sorted = [...enhanced].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'feature') return dir * a.feature.localeCompare(b.feature)
      return dir * (((a as any)[sortKey] || 0) - ((b as any)[sortKey] || 0))
    })
    return sorted
  }, [data, sortKey, sortDir])

  const donutData = rows.map(r => ({ name: r.feature, value: r.coins_spent }))
  const barData = rows.map(r => ({ feature: r.feature, coins_spent: r.coins_spent }))

  const toggleSort = (key: SortKey) => {
    setSortKey(prev => (prev === key ? prev : key))
    setSortDir(prev => (sortKey === key ? (prev === 'asc' ? 'desc' : 'asc') : 'desc'))
  }

  return (
    <SectionCard
      title="Coins Usage by Feature"
      description="Distribution and totals of coins spent by feature"
      isLoading={isLoading}
      error={error ? String(error) : null}
    >
      {/* Controls */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Feature:</label>
          <select
            className="border rounded-md px-2 py-1 text-sm"
            value={feature}
            onChange={(e) => {
              const val = e.target.value
              setFeature(val)
              setFilters(prev => ({ ...prev, feature: val as any }))
            }}
          >
            <option value="all">All</option>
            {/* derive options from data if present */}
            {Array.from(new Set((data?.by_feature || []).map(r => r.feature))).map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={2}>
                {donutData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <RTooltip formatter={(v: any, n: any, p: any) => [v, p?.payload?.name || n]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="feature" tick={{ fontSize: 12 }} width={120} />
              <Tooltip formatter={(v: any) => [v, 'Coins Spent']} />
              <Bar dataKey="coins_spent" fill="#10B981" name="Coins Spent" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-md mt-6">
        <table className="min-w-full text-xs">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left font-medium cursor-pointer" onClick={() => toggleSort('feature')}>Feature</th>
              <th className="px-3 py-2 text-right font-medium cursor-pointer" onClick={() => toggleSort('coins_spent')}>Coins Spent</th>
              <th className="px-3 py-2 text-right font-medium cursor-pointer" onClick={() => toggleSort('percentage')}>% Share</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.feature} className="odd:bg-background even:bg-muted/20">
                <td className="px-3 py-1.5 whitespace-nowrap">{r.feature}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{(r.coins_spent || 0).toLocaleString()}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{(r.percentage || 0).toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}

export default CoinsByFeature
