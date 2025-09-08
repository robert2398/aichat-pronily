import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group'
import { useFilters } from '../contexts/FiltersContext'
import { SectionCard } from './SectionCard'
import { formatCurrency, downloadCSV, toCSV } from '../lib/utils'

interface RevenueTrendData {
  period: string
  subscription_revenue: number
  coin_revenue: number
  total_revenue: number
}

interface RevenueTrendsResponse {
  data: RevenueTrendData[]
  total_revenue_all_periods: number
  avg_monthly_revenue: number
}

// Mock API call
const fetchRevenueTrends = async (
  startDate: string,
  endDate: string,
  interval: string,
  currency: string
): Promise<RevenueTrendsResponse> => {
  await new Promise(resolve => setTimeout(resolve, 1200))
  
  // Generate mock data based on interval
  const mockData: RevenueTrendData[] = [
    { period: '2024-01', subscription_revenue: 45000, coin_revenue: 12000, total_revenue: 57000 },
    { period: '2024-02', subscription_revenue: 48000, coin_revenue: 15000, total_revenue: 63000 },
    { period: '2024-03', subscription_revenue: 52000, coin_revenue: 18000, total_revenue: 70000 },
    { period: '2024-04', subscription_revenue: 49000, coin_revenue: 16000, total_revenue: 65000 },
    { period: '2024-05', subscription_revenue: 55000, coin_revenue: 20000, total_revenue: 75000 },
    { period: '2024-06', subscription_revenue: 58000, coin_revenue: 22000, total_revenue: 80000 },
  ]
  
  return {
    data: mockData,
    total_revenue_all_periods: mockData.reduce((sum, item) => sum + item.total_revenue, 0),
    avg_monthly_revenue: mockData.reduce((sum, item) => sum + item.total_revenue, 0) / mockData.length,
  }
}

export function RevenueTrendsChart() {
  const { filters } = useFilters()
  const [visibleSeries, setVisibleSeries] = useState(['subscription_revenue', 'coin_revenue'])
  
  const startDate = filters.dateRange?.from?.toISOString().split('T')[0] || ''
  const endDate = filters.dateRange?.to?.toISOString().split('T')[0] || ''
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['revenue-trends', startDate, endDate, filters.interval, filters.currency],
    queryFn: () => fetchRevenueTrends(startDate, endDate, filters.interval, filters.currency),
    enabled: !!startDate && !!endDate,
  })

  const handleExport = () => {
    if (data?.data) {
      const csv = toCSV(data.data)
      downloadCSV('revenue-trends.csv', csv)
    }
  }

  const toggleSeries = (series: string) => {
    setVisibleSeries(prev => 
      prev.includes(series) 
        ? prev.filter(s => s !== series)
        : [...prev, series]
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value, filters.currency)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (isLoading || error || !data) {
    return (
      <SectionCard
        title="Revenue Trends"
        description="Subscription vs coin revenue over time"
        onExport={handleExport}
        isLoading={isLoading}
        error={error?.toString()}
      />
    )
  }

  return (
    <SectionCard
      title="Revenue Trends"
      description="Subscription vs coin revenue over time"
      onExport={handleExport}
    >
      <div className="space-y-4">
        {/* Series Toggle */}
        <div className="flex items-center justify-between">
          <ToggleGroup type="multiple" value={visibleSeries} onValueChange={setVisibleSeries}>
            <ToggleGroupItem value="subscription_revenue" aria-label="Toggle subscription revenue">
              Subscription Revenue
            </ToggleGroupItem>
            <ToggleGroupItem value="coin_revenue" aria-label="Toggle coin revenue">
              Coin Revenue
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data.data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="period" className="text-xs" />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value, filters.currency)} 
              className="text-xs"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {visibleSeries.includes('subscription_revenue') && (
              <Area
                type="monotone"
                dataKey="subscription_revenue"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
                name="Subscription Revenue"
              />
            )}
            {visibleSeries.includes('coin_revenue') && (
              <Area
                type="monotone"
                dataKey="coin_revenue"
                stackId="1"
                stroke="#82ca9d"
                fill="#82ca9d"
                fillOpacity={0.6}
                name="Coin Revenue"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Revenue (All Periods)</p>
            <p className="text-2xl font-bold">
              {formatCurrency(data.total_revenue_all_periods, filters.currency)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Average Monthly Revenue</p>
            <p className="text-2xl font-bold">
              {formatCurrency(data.avg_monthly_revenue, filters.currency)}
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
