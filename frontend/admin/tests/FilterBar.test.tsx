import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { FiltersProvider } from '../src/contexts/FiltersContext'
import { FilterBar } from '../src/components/dashboard/FilterBar'

vi.mock('../src/api/planSummary', () => ({
  usePlansQuery: () => ({ data: ['Basic','Pro'], isLoading: false, isError: false })
}))

function setup(route: string = '/admin/dashboard') {
  const qc = new QueryClient()
  render(
    <MemoryRouter initialEntries={[route]}>
      <QueryClientProvider client={qc}>
        <FiltersProvider>
          <FilterBar />
        </FiltersProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('FilterBar', () => {
  it('renders controls with defaults', () => {
    setup()
    expect(screen.getByTestId('filterbar-preset-30d')).toBeInTheDocument()
    expect(screen.getByTestId('filterbar-interval')).toBeInTheDocument()
    expect(screen.getByTestId('filterbar-feature')).toBeInTheDocument()
    expect(screen.getByTestId('filterbar-plan')).toBeInTheDocument()
  // currency filter removed
  })

  it('clicking preset updates state and URL', async () => {
    setup()
    fireEvent.click(screen.getByTestId('filterbar-preset-7d'))
    await waitFor(() => {
      const url = window.location.href
      expect(url).toContain('preset=7d')
    })
  })

  it('shows plans options after load', () => {
    setup()
    fireEvent.click(screen.getByTestId('filterbar-plan'))
    expect(screen.getByText('Basic')).toBeInTheDocument()
    expect(screen.getByText('Pro')).toBeInTheDocument()
  })
})
