'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Plane, Clock } from 'lucide-react'
import useSWR from 'swr'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { api, fetcher, type Booking } from '@/lib/api'
import { formatNgn, formatDateTime, formatDuration, getStatusColour } from '@/lib/utils'
import { useState } from 'react'

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [downloading, setDownloading] = useState(false)

  const { data, isLoading } = useSWR<{ data: Booking }>(
    `/bookings/${id}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )

  const booking = data?.data

  async function handleDownload() {
    if (!booking) return
    setDownloading(true)
    try {
      const res = await api.documents.getItineraryUrl(booking.id)
      window.open(res.data.url, '_blank')
    } catch {
      // handle silently — could add toast
    } finally {
      setDownloading(false)
    }
  }

  if (isLoading) return <PageSpinner />
  if (!booking) return <p className="text-navy/60">Booking not found.</p>

  return (
    <div>
      <Link
        href="/dashboard/bookings"
        className="inline-flex items-center gap-2 text-sm text-navy/60 hover:text-navy transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Back to bookings
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold font-mono text-navy">{booking.reference}</h1>
          <Badge color={getStatusColour(booking.status)} className="mt-1">{booking.status}</Badge>
        </div>
        <Button variant="secondary" size="sm" loading={downloading} onClick={handleDownload}>
          <Download size={14} />
          Itinerary PDF
        </Button>
      </div>

      <div className="space-y-5">
        {/* Flight */}
        {booking.flight && (
          <Card>
            <h2 className="font-semibold text-navy mb-4">Flight</h2>
            <div className="flex items-center gap-4 mb-4">
              <div>
                <p className="text-2xl font-bold text-navy">{booking.flight.route.originCode}</p>
                <p className="text-xs text-navy/50">{booking.flight.route.origin}</p>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <div className="flex items-center gap-2 w-full">
                  <div className="h-px flex-1 bg-navy/15" />
                  <Plane size={14} className="text-sky-accent -rotate-45" />
                  <div className="h-px flex-1 bg-navy/15" />
                </div>
                <div className="flex items-center gap-1 text-xs text-navy/50 mt-1">
                  <Clock size={9} />
                  {formatDuration(booking.flight.durationMinutes)}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-navy">{booking.flight.route.destinationCode}</p>
                <p className="text-xs text-navy/50">{booking.flight.route.destination}</p>
              </div>
            </div>
            <p className="text-sm text-navy/60">{formatDateTime(booking.flight.departureAt)}</p>
          </Card>
        )}

        {/* Passengers */}
        <Card>
          <h2 className="font-semibold text-navy mb-4">Passengers</h2>
          <ul className="space-y-3">
            {booking.passengers.map((p, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-sky-pale flex items-center justify-center text-xs font-semibold text-sky-accent">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-navy">{p.firstName} {p.lastName}</p>
                  <p className="text-xs text-navy/50">{p.passportNumber} &bull; {p.nationality}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* Payment */}
        <Card>
          <h2 className="font-semibold text-navy mb-4">Payment</h2>
          <div className="flex justify-between text-sm">
            <span className="text-navy/60">Total charged</span>
            <span className="font-bold text-navy text-base">{formatNgn(booking.totalNgn)}</span>
          </div>
        </Card>
      </div>
    </div>
  )
}
