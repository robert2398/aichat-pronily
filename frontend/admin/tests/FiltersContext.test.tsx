import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter, useSearchParams } from 'react-router-dom'
import { FiltersProvider, useFilters, fromPreset } from '../src/context/FiltersContext'

function wrapper({ initialEntries = ['/admin/dashboard'] }: { initialEntries?: string[] }) {
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>
      <FiltersProvider>{children}</FiltersProvider>
    </MemoryRouter>
  )
}

describe('FiltersContext', () => {
  it('provides defaults correctly', () => {
    const { result } = renderHook(() => useFilters(), { wrapper: wrapper({}) })
    const { filters } = result.current
    expect(filters.preset).toBe('30d')
    expect(filters.interval).toBe('monthly')
    expect(filters.feature).toBe('all')
    expect(filters.plan).toBe('all')
    const { fromISO, toISO } = fromPreset('30d')
    expect(filters.fromISO).toBe(fromISO)
    expect(filters.toISO).toBe(toISO)
  })

  it('initializes from URL params', () => {
  const initial = '/admin/dashboard?preset=7d&interval=weekly&feature=chat&plan=Pro'
    const { result } = renderHook(() => useFilters(), { wrapper: wrapper({ initialEntries: [initial] }) })
    const { filters } = result.current
    expect(filters.preset).toBe('7d')
    expect(filters.interval).toBe('weekly')
    expect(filters.feature).toBe('chat')
    expect(filters.plan).toBe('Pro')
  })

  it('updates URL when preset changes (replace)', () => {
    const initial = '/admin/dashboard'
    const { result } = renderHook(() => ({ f: useFilters(), sp: useSearchParams() }), { wrapper: wrapper({ initialEntries: [initial] }) })
    act(() => { result.current.f.setPreset('7d') })
    const [searchParams] = result.current.sp
    expect(searchParams.get('preset')).toBe('7d')
    expect(searchParams.get('from')).not.toBeNull()
    expect(searchParams.get('to')).not.toBeNull()
  })
})
