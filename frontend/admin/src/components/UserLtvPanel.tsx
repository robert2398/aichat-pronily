import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Drawer } from './Drawer'
import { marketingApi } from '../services/marketingApi'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'

export interface UserLtvPanelProps {
  userId: number
  open: boolean
  onClose: () => void
}

const COLORS = ['#22C55E', '#6366F1'] // coins (green) vs subscriptions (indigo)

function currency(n: number, cur = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(n || 0)
}

export const UserLtvPanel: React.FC<UserLtvPanelProps> = ({ userId, open, onClose }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user-ltv', userId],
    queryFn: () => marketingApi.getUserLifetimeValue({ userId }),
    enabled: open && Boolean(userId),
  })

  const total = data?.total_revenue || 0
  const pieData = [
    { name: 'Coins', value: data?.coins_purchase_value || 0 },
    { name: 'Subscriptions', value: data?.subscription_value || 0 },
  ]

  return (
    <Drawer open={open} onClose={onClose} title={`User ${userId} — Lifetime Value`}>
      {isLoading && (
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-40" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="h-64 bg-gray-100 rounded" />
            <div className="lg:col-span-2 space-y-3">
              <div className="h-10 bg-gray-100 rounded w-64" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-14 bg-gray-100 rounded" />
                <div className="h-14 bg-gray-100 rounded" />
                <div className="h-14 bg-gray-100 rounded" />
                <div className="h-14 bg-gray-100 rounded" />
              </div>
              <div className="h-24 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="text-red-600">Failed to load lifetime value.</div>
      )}

      {data && !isLoading && !error && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white border rounded p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Revenue Split</h4>
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => currency(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center mt-2 text-xs text-gray-500">Coins vs Subscriptions</div>
            </div>

            <div className="lg:col-span-2">
              <div className="mb-3">
                <div className="text-sm text-gray-600">Total Revenue</div>
                <div className="text-3xl font-semibold">{currency(total)}</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Coins Value" value={currency(data.coins_purchase_value)} color="text-emerald-600" />
                <Stat label="Subscription Value" value={currency(data.subscription_value)} color="text-indigo-600" />
                <Stat label="Coins Acquired" value={(data.total_coins_acquired||0).toLocaleString()} />
                <Stat label="Coins Spent" value={(data.total_coins_spent||0).toLocaleString()} />
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Lifetime Duration: <span className="font-medium text-gray-900">{data.lifetime_duration_months == null ? '—' : `${data.lifetime_duration_months} months`}</span>
              </div>

              <div className="mt-4">
                <button className="text-indigo-600 text-sm hover:underline" onClick={() => window.open(`/admin/users/${userId}#timeline`, '_blank')}>Open user timeline →</button>
              </div>
            </div>
          </div>

          {/* Micro charts placeholder (can be wired to additional endpoints) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-90">
            <div className="border rounded p-3">
              <div className="text-xs text-gray-500 mb-1">Revenue Breakdown</div>
              <div className="h-16 bg-gradient-to-r from-indigo-50 to-emerald-50 rounded" />
            </div>
            <div className="border rounded p-3">
              <div className="text-xs text-gray-500 mb-1">Coins Over Time</div>
              <div className="h-16 bg-gradient-to-r from-gray-50 to-gray-100 rounded" />
            </div>
            <div className="border rounded p-3">
              <div className="text-xs text-gray-500 mb-1">Activity</div>
              <div className="h-16 bg-gradient-to-r from-gray-50 to-gray-100 rounded" />
            </div>
          </div>
        </div>
      )}
    </Drawer>
  )
}

const Stat: React.FC<{ label: string; value: string | number; color?: string }> = ({ label, value, color }) => (
  <div className="border rounded p-3">
    <div className="text-xs text-gray-500">{label}</div>
    <div className={`text-lg font-semibold ${color ?? 'text-gray-900'}`}>{value}</div>
  </div>
)

export default UserLtvPanel
