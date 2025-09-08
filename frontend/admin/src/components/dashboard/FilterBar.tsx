import * as React from 'react'
import { useFilters } from '../../context/FiltersContext'
import { usePlansQuery } from '../../api/planSummary'
import { Skeleton } from '../ui/skeleton'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../ui/tooltip.tsx'

/** Horizontal toolbar of filter controls for monetization dashboard */
export function FilterBar() {
  const { filters, setPreset, setRange, setFilters } = useFilters()
  const { data: plans, isLoading: plansLoading, isError: plansError } = usePlansQuery()

  const onIntervalChange = (val: string) => setFilters(f => ({ ...f, interval: val as any }))
  const onFeatureChange = (val: string) => setFilters(f => ({ ...f, feature: val as any }))
  const onPlanChange = (val: string) => setFilters(f => ({ ...f, plan: val }))
  // Currency filter removed per design request

  // (old presetBtn helper removed; replaced by compact segmented buttons)

  const manualFrom = filters.fromISO
  const manualTo = filters.toISO
  const onManualChange = (which: 'from' | 'to', value: string) => {
    const nextFrom = which === 'from' ? value : manualFrom
    const nextTo = which === 'to' ? value : manualTo
    if (nextFrom && nextTo) setRange(nextFrom, nextTo)
  }

  const planOptions = React.useMemo(() => {
    const opts = plans ? plans.slice() : []
    return ['all', ...opts]
  }, [plans])

  return (
    <TooltipProvider>
  <div className="w-full flex flex-col gap-2 bg-white rounded-md border mt-4 px-6 pt-4 pb-4 shadow-sm mb-6" data-testid="filterbar">
        {/* Header Row */}
        <div className="flex items-center justify-between w-full">
          <h1 className="text-2xl font-bold tracking-tight leading-none">Analytics Dashboard</h1>
        </div>
        {/* Filters Row */}
        <div className="w-full flex items-center gap-4 overflow-x-auto flex-nowrap">
          {/* Preset segmented control */}
    <div className="inline-flex border rounded-md overflow-hidden shrink-0" role="group" aria-label="Date range presets">
            {(['7d','30d','90d'] as const).map(p => (
              <button
                key={p}
                type="button"
                data-testid={`filterbar-preset-${p}`}
                onClick={() => setPreset(p)}
                className={
      'px-5 py-2 text-sm font-semibold tracking-wide uppercase transition-colors ' +
                  (filters.preset === p
                    ? 'bg-gray-200 text-gray-900'
                    : 'bg-white text-gray-600 hover:bg-gray-50') +
                  (p === '7d' ? ' rounded-l-md border-r' : p === '90d' ? ' rounded-r-md border-l' : ' border-x')
                }
              >
                {p === '7d' ? '7 DAYS' : p === '30d' ? '30 DAYS' : '90 DAYS'}
              </button>
            ))}
          </div>
          {/* Manual date range */}
          <div className="flex items-center gap-1 shrink-0">
            <label className="text-xs text-muted-foreground">From</label>
            <input aria-label="From date" type="date" className="h-9 w-[130px] border rounded px-2 text-sm" value={manualFrom} onChange={e => onManualChange('from', e.target.value)} />
            <label className="text-xs text-muted-foreground">To</label>
            <input aria-label="To date" type="date" className="h-9 w-[130px] border rounded px-2 text-sm" value={manualTo} onChange={e => onManualChange('to', e.target.value)} />
          </div>
          {/* Interval */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="min-w-[130px]">
                <Select value={filters.interval} onValueChange={onIntervalChange}>
                  <SelectTrigger data-testid="filterbar-interval" aria-label="Interval" className="h-10 text-sm font-medium bg-neutral-50 hover:bg-neutral-100">
                    <SelectValue placeholder="Interval" />
                  </SelectTrigger>
                    <SelectContent className="bg-neutral-50 text-sm font-medium">
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TooltipTrigger>
            <TooltipContent className="text-sm font-semibold">Aggregation Interval</TooltipContent>
          </Tooltip>
          {/* Feature */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="min-w-[130px] w-[120px]">
                <Select value={filters.feature} onValueChange={onFeatureChange}>
                  <SelectTrigger data-testid="filterbar-feature" aria-label="Feature" className="h-10 text-sm font-medium bg-neutral-50 hover:bg-neutral-100">
                    <SelectValue placeholder="Feature" />
                  </SelectTrigger>
                    <SelectContent className="bg-neutral-50 text-sm font-medium">
                    <SelectItem value="all">All Features</SelectItem>
                    <SelectItem value="chat">Chat</SelectItem>
                    <SelectItem value="image_generation">Image Gen</SelectItem>
                    <SelectItem value="video_generation">Video Gen</SelectItem>
                    <SelectItem value="character_creation">Character Creation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TooltipTrigger>
            <TooltipContent className="text-sm font-semibold">Product Feature</TooltipContent>
          </Tooltip>
          {/* Plan */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="min-w-[135px] w-[120px]">
                {plansLoading ? (
                  <div className="flex items-center gap-2" data-testid="filterbar-plan">
                    <Skeleton className="h-8 w-[140px]" />
                  </div>
                ) : plansError ? (
                  <div className="text-[10px] text-red-600" data-testid="filterbar-plan">Failed to load plans</div>
                ) : (
                  <Select value={filters.plan} onValueChange={onPlanChange}>
                    <SelectTrigger data-testid="filterbar-plan" aria-label="Plan" className="h-10 text-sm font-medium bg-neutral-50 hover:bg-neutral-100">
                      <SelectValue placeholder="Plan" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-50 text-sm font-medium">
                      {planOptions.map(p => <SelectItem key={p} value={p}>{p === 'all' ? 'All Plans' : p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent className="text-sm font-semibold">Subscription Plan</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}
