import React, { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { SectionCard } from './SectionCard'
import { useFilters } from '../context/FiltersContext'
import { engagementApi } from '../services/engagementApi.ts'

interface TopCharactersProps { limit?: number }

export const TopCharacters: React.FC<TopCharactersProps> = ({ limit = 10 }) => {
  const { filters } = useFilters()
  const startDate = filters.fromISO
  const endDate = filters.toISO

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['engagement-top-characters', startDate, endDate, limit],
    queryFn: () => engagementApi.getTopCharacters({ startDate, endDate, metric: 'coins_spent', limit }),
    enabled: Boolean(startDate && endDate),
  })

  useEffect(() => {
    const onRefetch = () => refetch()
    window.addEventListener('dashboard:engagement:refetch', onRefetch)
    return () => window.removeEventListener('dashboard:engagement:refetch', onRefetch)
  }, [refetch])

  const rows = useMemo(() => Array.isArray((data as any)?.top_characters) ? (data as any).top_characters : [], [data])

  const chartData = rows.map((r: any) => ({
    character_id: r.character_id,
    character_name: r.character_name || 'Unnamed',
    coins_spent: Number(r.coins_spent) || 0,
    interactions: Number(r.interactions) || 0,
    unique_users: Number(r.unique_users) || 0,
    avg_coins_per_user: (Number(r.coins_spent) || 0) / (Number(r.unique_users) || 1),
  }))

  return (
    <SectionCard
      title="Top Characters"
      description="Ranked by coins spent"
      isLoading={isLoading}
      error={error ? String(error) : null}
    >
      <div className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="character_name" width={140} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v, n, p) => {
              const r = p?.payload as any
              if (!r) return [v, n]
              return [String(v), `${n} (interactions: ${r.interactions}, users: ${r.unique_users})`]
            }} />
            <Bar dataKey="coins_spent" name="Coins Spent" fill="#F59E0B" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto border rounded-md mt-6">
        <table className="min-w-full text-xs">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Character</th>
              <th className="px-3 py-2 text-right font-medium">Coins Spent</th>
              <th className="px-3 py-2 text-right font-medium">Interactions</th>
              <th className="px-3 py-2 text-right font-medium">Unique Users</th>
              <th className="px-3 py-2 text-right font-medium">Avg Coins/User</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((r: any) => (
              <tr key={`${r.character_id}-${r.character_name}`} className="odd:bg-background even:bg-muted/20">
                <td className="px-3 py-1.5 whitespace-nowrap flex items-center gap-2">
                  {/* Avatar thumbnail if available – not fetched here; show initial as placeholder */}
                  <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-[10px] font-semibold">
                    {(r.character_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span>{r.character_name}</span>
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums">{r.coins_spent.toLocaleString()}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{r.interactions.toLocaleString()}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{r.unique_users.toLocaleString()}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{(r.avg_coins_per_user || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}

export default TopCharacters
