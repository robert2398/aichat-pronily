import React, { createContext, useContext, useState, useEffect } from 'react'
import { subDays } from 'date-fns'
import type { DateRange } from 'react-day-picker'

export type FilterInterval = 'daily' | 'weekly' | 'monthly' | 'quarterly'
export type FilterFeature = 'all' | 'chat' | 'image_generation' | 'video_generation' | 'character_creation'
export type FilterPlan = 'all' | string
export type FilterCurrency = 'USD' | 'EUR' | 'GBP'

interface FiltersState {
  dateRange: DateRange | undefined
  interval: FilterInterval
  feature: FilterFeature
  plan: FilterPlan
  currency: FilterCurrency
}

interface FiltersContextType {
  filters: FiltersState
  updateFilters: (updates: Partial<FiltersState>) => void
  resetFilters: () => void
}

const defaultFilters: FiltersState = {
  dateRange: {
    from: subDays(new Date(), 30),
    to: new Date(),
  },
  interval: 'daily',
  feature: 'all',
  plan: 'all',
  currency: 'USD',
}

const FiltersContext = createContext<FiltersContextType | undefined>(undefined)

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<FiltersState>(defaultFilters)

  // Sync with URL search params
  useEffect(() => {
    const pathname = window.location.pathname || ''
    const isDashboard = pathname.startsWith('/admin/dashboard')
    if (!isDashboard) return
    const params = new URLSearchParams(window.location.search)
    const updates: Partial<FiltersState> = {}

    const startDate = params.get('start_date')
    const endDate = params.get('end_date')
    if (startDate && endDate) {
      updates.dateRange = {
        from: new Date(startDate),
        to: new Date(endDate),
      }
    }

    const interval = params.get('interval') as FilterInterval
    if (interval && ['daily', 'weekly', 'monthly', 'quarterly'].includes(interval)) {
      updates.interval = interval
    }

    const feature = params.get('feature') as FilterFeature
    if (feature) {
      updates.feature = feature
    }

    const plan = params.get('plan')
    if (plan) {
      updates.plan = plan
    }

    const currency = params.get('currency') as FilterCurrency
    if (currency && ['USD', 'EUR', 'GBP'].includes(currency)) {
      updates.currency = currency
    }

    if (Object.keys(updates).length > 0) {
      setFilters(prev => ({ ...prev, ...updates }))
    }
  }, [])

  const updateFilters = (updates: Partial<FiltersState>) => {
    setFilters(prev => {
      const newFilters = { ...prev, ...updates }
      
      // Update URL params
      const params = new URLSearchParams()
      if (newFilters.dateRange?.from) {
        params.set('start_date', newFilters.dateRange.from.toISOString().split('T')[0])
      }
      if (newFilters.dateRange?.to) {
        params.set('end_date', newFilters.dateRange.to.toISOString().split('T')[0])
      }
      params.set('interval', newFilters.interval)
      if (newFilters.feature !== 'all') {
        params.set('feature', newFilters.feature)
      }
      if (newFilters.plan !== 'all') {
        params.set('plan', newFilters.plan)
      }
      params.set('currency', newFilters.currency)

      const newUrl = `${window.location.pathname}?${params.toString()}`
      if (window.location.pathname.startsWith('/admin/dashboard')) {
        window.history.replaceState({}, '', newUrl)
      }

      return newFilters
    })
  }

  const resetFilters = () => {
    setFilters(defaultFilters)
    if (window.location.pathname.startsWith('/admin/dashboard')) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }

  return (
    <FiltersContext.Provider value={{ filters, updateFilters, resetFilters }}>
      {children}
    </FiltersContext.Provider>
  )
}

export function useFilters() {
  const context = useContext(FiltersContext)
  if (context === undefined) {
    throw new Error('useFilters must be used within a FiltersProvider')
  }
  return context
}
