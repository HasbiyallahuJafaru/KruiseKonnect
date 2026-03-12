'use client'

import Link from 'next/link'
import { Plane, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { formatNgn, formatDuration } from '@/lib/utils'
import type { FeaturedRoute } from '@/lib/api'

export function PopularRouteCard({ route }: { route: FeaturedRoute }) {
  return (
    <Link
      href={`/flights/search?origin=${route.originCode}&destination=${route.destinationCode}`}
      className="group"
    >
      <Card hover className="h-full transition-all group-hover:border-sky-accent/30">
        <div className="flex items-start justify-between mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy/5 group-hover:bg-sky-pale transition-colors">
            <Plane size={16} className="text-navy -rotate-45 group-hover:text-sky-accent transition-colors" />
          </div>
          <span className="text-xs text-navy/40">{formatDuration(route.durationMinutes)}</span>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg font-bold text-navy">{route.originCode}</span>

          {/* animated arrow track */}
          <div className="flex-1 flex items-center gap-1 overflow-hidden">
            <div className="h-px flex-1 bg-navy/15" />
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-sky-accent animate-bounce-x"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
            <div className="h-px flex-1 bg-navy/15" />
          </div>

          <span className="text-lg font-bold text-navy">{route.destinationCode}</span>
        </div>

        <div className="flex items-center gap-1 text-xs text-navy/50 mb-3">
          <MapPin size={10} />
          {route.origin} → {route.destination}
        </div>

        <p className="text-sm font-semibold text-sky-accent">
          From {formatNgn(route.priceFrom)}
        </p>
      </Card>
    </Link>
  )
}
