'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plane, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import useSWR from 'swr'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageSpinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { fetcher, type Booking } from '@/lib/api'
import { formatNgn, formatDate, getStatusColour } from '@/lib/utils'

const LIMIT = 10

export default function BookingsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useSWR<{ data: Booking[]; meta: { total: number; totalPages: number } }>(
    `/bookings/my?page=${page}&limit=${LIMIT}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  )

  if (isLoading) return <PageSpinner />

  const bookings = data?.data ?? []
  const totalPages = data?.meta?.totalPages ?? 1

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-navy">My bookings</h1>
          <p className="text-sm text-navy/60 mt-0.5">
            {data?.meta?.total ?? 0} total booking{(data?.meta?.total ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/flights/search">+ New booking</Link>
        </Button>
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          icon={<Plane size={20} />}
          title="No bookings yet"
          description="Book your first flight to see it here."
          action={{ label: 'Search flights', onClick: () => window.location.href = '/flights/search' }}
        />
      ) : (
        <>
          <Card padding="none">
            <div className="divide-y divide-navy/8">
              {bookings.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/dashboard/bookings/${booking.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-chalk transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-lg bg-sky-pale flex items-center justify-center shrink-0">
                      <Plane size={14} className="text-sky-accent -rotate-45" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold font-mono text-navy">{booking.reference}</p>
                      {booking.flight && (
                        <p className="text-xs text-navy/60">
                          {booking.flight.route.originCode} → {booking.flight.route.destinationCode}
                        </p>
                      )}
                      <p className="text-xs text-navy/40">{formatDate(booking.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:block text-right">
                      <p className="text-sm font-medium text-navy">{formatNgn(booking.totalNgn)}</p>
                      <p className="text-xs text-navy/40">{booking.passengers.length} pax</p>
                    </div>
                    <Badge color={getStatusColour(booking.status)}>{booking.status}</Badge>
                    <ArrowRight size={12} className="text-navy/30 shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft size={14} /> Previous
              </Button>
              <span className="text-xs text-navy/50">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next <ChevronRight size={14} />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
