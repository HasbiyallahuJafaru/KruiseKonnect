'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard error]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
      <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertTriangle size={22} className="text-red-500" />
      </div>
      <h2 className="text-lg font-bold text-navy mb-1">Something went wrong</h2>
      <p className="text-sm text-navy/60 mb-5 max-w-sm">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <Button onClick={reset} variant="outline" size="sm">Try again</Button>
    </div>
  )
}
