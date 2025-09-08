import * as React from 'react'
import { Download, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Skeleton } from '../../components/ui/skeleton'

export interface SectionCardProps {
  title: string
  description?: string
  onExport?: () => void | Promise<void>
  loading?: boolean
  error?: string | null
  children: React.ReactNode
  right?: React.ReactNode
}

/** Wrapper card with title/description and optional export + loading & error shells */
export function SectionCard({ title, description, onExport, loading = false, error = null, children, right }: SectionCardProps) {
  const [exporting, setExporting] = React.useState(false)
  const handleExport = async () => {
    if (!onExport) return
    try { setExporting(true); await onExport() } finally { setExporting(false) }
  }
  return (
    <Card data-testid={`section-${title.replace(/\s+/g,'-').toLowerCase()}`}>
      <CardHeader className="flex flex-row items-start gap-2 justify-between space-y-0 pb-4">
        <div className="space-y-1 pr-4">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          {description && <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>}
        </div>
        <div className="flex items-center gap-2">
          {right}
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              aria-label="Export CSV"
              data-testid="export-csv"
              onClick={handleExport}
              disabled={exporting}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3" aria-busy>
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : error ? (
          <div className="flex items-center text-sm text-red-600 gap-2" role="alert">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}
