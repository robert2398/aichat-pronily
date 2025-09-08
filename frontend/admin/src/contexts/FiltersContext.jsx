import React, { createContext, useContext, useState, useEffect } from 'react'
import { subDays } from 'date-fns'

const defaultFilters = {
  dateRange: {
    from: subDays(new Date(), 30),
    to: new Date(),
  },
  interval: 'daily',
  feature: 'all',
  plan: 'all',
  currency: 'USD',
}

const FiltersContext = createContext(undefined)

export function FiltersProvider({ children }) {
  const [filters, setFilters] = useState(defaultFilters)

  // Sync with URL search params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const updates = {}

    const startDate = params.get('start_date')
    const endDate = params.get('end_date')
    if (startDate && endDate) {
      updates.dateRange = {
        from: new Date(startDate),
        to: new Date(endDate),
      }
    }

    const interval = params.get('interval')
    if (interval && ['daily', 'weekly', 'monthly', 'quarterly'].includes(interval)) {
      updates.interval = interval
    }

    const feature = params.get('feature')
    if (feature) {
      updates.feature = feature
    }

    const plan = params.get('plan')
    if (plan) {
      updates.plan = plan
    }

    const currency = params.get('currency')
    if (currency && ['USD', 'EUR', 'GBP'].includes(currency)) {
      updates.currency = currency
    }

    if (Object.keys(updates).length > 0) {
      setFilters(prev => ({ ...prev, ...updates }))
    }
  }, [])

  const updateFilters = (updates) => {
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
      window.history.replaceState({}, '', newUrl)

      return newFilters
    })
  }

  const resetFilters = () => {
    setFilters(defaultFilters)
    window.history.replaceState({}, '', window.location.pathname)
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
