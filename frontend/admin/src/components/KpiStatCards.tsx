import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useFilters } from '../context/FiltersContext'
import { SectionCard } from './SectionCard'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { formatCurrency, formatPercent } from '../lib/utils'
import { cn } from '../lib/utils'
import dashboardApi from '../services/dashboardApi.js'

interface KpiData {
  total_revenue: number
  active_users: number
  conversion_rate: number
  avg_order_value: number
  currency: string
  previous_period?: {
    total_revenue: number
    active_users: number
    conversion_rate: number
    avg_order_value: number
  }
}

// Fetch KPI data from the real API
const fetchKpiData = async (params: any): Promise<KpiData> => {
  console.log('🚀 fetchKpiData called with params:', params)
  try {
    const response = await dashboardApi.getKpiMetrics(params)
    console.log('✅ API response:', response)
    return response
  } catch (error) {
    console.error('❌ Error fetching KPI data:', error)
    throw error
  }
}

interface StatCardProps {
  title: string
  value: string
  change?: number
  format?: 'currency' | 'percent' | 'number'
}

function StatCard({ title, value, change, format = 'number' }: StatCardProps) {
  const isPositive = change && change > 0
  const isNegative = change && change < 0
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {change !== undefined && (
          <div className={cn(
            "flex items-center text-xs",
            isPositive && "text-green-600",
            isNegative && "text-red-600",
            change === 0 && "text-muted-foreground"
          )}>
            {isPositive && <TrendingUp className="h-3 w-3 mr-1" />}
            {isNegative && <TrendingDown className="h-3 w-3 mr-1" />}
            {format === 'percent' ? formatPercent(Math.abs(change)) : Math.abs(change).toFixed(1)}%
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

export function KpiStatCards() {
  console.log('🎯 KpiStatCards component mounted!')
  
  const { filters } = useFilters()
  
  console.log('🔍 KpiStatCards filters:', filters)
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['kpi-summary', filters.toISO],
    queryFn: () => {
      console.log('🎯 React Query executing...')
      return fetchKpiData({
        asOfDate: filters.toISO,
        period: filters.interval || 'monthly'
      })
    },
    enabled: !!filters.toISO,
    retry: false,
  })

  console.log('📊 Query state:', { data, isLoading, error })

  const calculateChange = (current: number, previous: number) => {
    if (!previous) return 0
    return ((current - previous) / previous) * 100
  }

  if (isLoading || error || !data) {
    return (
      <SectionCard
        title="Key Performance Indicators"
        description="Monthly overview of monetization metrics"
        isLoading={isLoading}
        error={error?.toString()}
      />
    )
  }

  const stats = [
    {
      title: 'Total Revenue',
      value: formatCurrency(data.total_revenue, data.currency),
      change: data.previous_period ? calculateChange(data.total_revenue, data.previous_period.total_revenue) : undefined,
      format: 'currency' as const,
    },
    {
      title: 'Active Users',
      value: data.active_users.toLocaleString(),
      change: data.previous_period ? calculateChange(data.active_users, data.previous_period.active_users) : undefined,
      format: 'number' as const,
    },
    {
      title: 'Conversion Rate',
      value: formatPercent(data.conversion_rate),
      change: data.previous_period ? data.conversion_rate - data.previous_period.conversion_rate : undefined,
      format: 'percent' as const,
    },
    {
      title: 'Average Order Value',
      value: formatCurrency(data.avg_order_value, data.currency),
      change: data.previous_period ? calculateChange(data.avg_order_value, data.previous_period.avg_order_value) : undefined,
      format: 'currency' as const,
    },
  ]

  return (
    <SectionCard
      title="Key Performance Indicators"
      description="Monthly overview of monetization metrics"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            format={stat.format}
          />
        ))}
      </div>
    </SectionCard>
  )
}
