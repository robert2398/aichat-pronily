// React import not required with the new JSX transform
import { useQuery } from '@tanstack/react-query'
import { Calendar, Download } from 'lucide-react'
import { format } from 'date-fns'

import { useFilters } from '../contexts/FiltersContext'
import { Button } from './ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { DatePickerWithRange } from './ui/date-range-picker'
import { cn } from '../lib/utils'

// Mock API call - replace with actual implementation
const fetchPlans = async () => {
  // Simulate API call
  return [
    { id: 'basic', name: 'Basic Plan' },
    { id: 'premium', name: 'Premium Plan' },
    { id: 'enterprise', name: 'Enterprise Plan' },
  ]
}

export function FilterBar({ className }: { className?: string }) {
  const { filters, updateFilters } = useFilters()

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: fetchPlans,
  })

  return (
    <div className={cn(
      "sticky top-0 z-40 bg-background border-b border-border p-4",
      className
    )}>
      <div className="flex flex-wrap items-center gap-4">
        {/* Date Range Picker */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <DatePickerWithRange
            date={filters.dateRange}
            onDateChange={(date) => updateFilters({ dateRange: date })}
          />
        </div>

        {/* Interval Select */}
        <Select
          value={filters.interval}
          onValueChange={(value) => updateFilters({ interval: value as any })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Interval" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
          </SelectContent>
        </Select>

        {/* Feature Select */}
        <Select
          value={filters.feature}
          onValueChange={(value) => updateFilters({ feature: value as any })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Feature" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Features</SelectItem>
            <SelectItem value="chat">Chat</SelectItem>
            <SelectItem value="image_generation">Image Generation</SelectItem>
            <SelectItem value="video_generation">Video Generation</SelectItem>
            <SelectItem value="character_creation">Character Creation</SelectItem>
          </SelectContent>
        </Select>

        {/* Plan Select */}
        <Select
          value={filters.plan}
          onValueChange={(value) => updateFilters({ plan: value })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            {plans.map((plan) => (
              <SelectItem key={plan.id} value={plan.id}>
                {plan.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Currency Select */}
        <Select
          value={filters.currency}
          onValueChange={(value) => updateFilters({ currency: value as any })}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Currency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
            <SelectItem value="GBP">GBP</SelectItem>
          </SelectContent>
        </Select>

        {/* Export Button */}
        <div className="ml-auto">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filter Summary */}
      <div className="mt-2 text-xs text-muted-foreground">
        {filters.dateRange?.from && filters.dateRange?.to && (
          <>
            Showing data from {format(filters.dateRange.from, 'MMM dd, yyyy')} to{' '}
            {format(filters.dateRange.to, 'MMM dd, yyyy')}
            {filters.feature !== 'all' && ` • ${filters.feature.replace('_', ' ')}`}
            {filters.plan !== 'all' && ` • ${filters.plan}`}
          </>
        )}
      </div>
    </div>
  )
}
