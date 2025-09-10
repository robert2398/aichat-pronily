import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SectionCard } from '../src/components/common/SectionCard'

describe('SectionCard', () => {
  it('shows skeleton when loading', () => {
    render(<SectionCard title="Test" loading>content</SectionCard>)
    expect(screen.getByRole('progressbar', { hidden: true }) || screen.getByText(/Export CSV/)).toBeTruthy()
  })

  it('shows error state', () => {
    render(<SectionCard title="Err" error="Boom" >X</SectionCard>)
    expect(screen.getByText('Boom')).toBeInTheDocument()
  })

  it('calls onExport and disables while pending', async () => {
    let resolve!: () => void
    const onExport = vi.fn(() => new Promise<void>(r => { resolve = r }))
    render(<SectionCard title="Export" onExport={onExport}>Body</SectionCard>)
    const btn = screen.getByTestId('export-csv')
    fireEvent.click(btn)
    expect(onExport).toHaveBeenCalledTimes(1)
    expect(btn).toBeDisabled()
    resolve()
    await waitFor(() => expect(btn).not.toBeDisabled())
  })
})
