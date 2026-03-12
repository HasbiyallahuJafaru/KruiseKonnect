'use client'

import { useState, type FormEvent } from 'react'
import { Search, Plane, Clock, Download } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { api, type Booking } from '@/lib/api'
import { formatNgn, formatDateTime, getStatusColour } from '@/lib/utils'

export default function RetrieveBookingPage() {
  const [reference, setReference] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    if (!booking) return
    setDownloading(true)
    try {
      const res = await api.documents.getItineraryUrl(booking.id)
      window.open(res.data.url, '_blank')
    } catch {
      // silently fail — document may not be ready yet
    } finally {
      setDownloading(false)
    }
  }

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBooking(null)
    setLoading(true)

    try {
      const res = await api.bookings.retrieve(reference.toUpperCase(), email)
      setBooking(res.data)
    } catch {
      setError('No booking found with those details. Please check your reference and email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-chalk py-16 px-4">
      <div className="mx-auto max-w-xl">
        <div className="text-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy mx-auto mb-4">
            <Plane size={24} className="text-white -rotate-45" />
          </div>
          <h1 className="text-2xl font-bold text-navy">Retrieve booking</h1>
          <p className="text-sm text-navy/60 mt-1">
            Enter your booking reference and email to find your booking.
          </p>
        </div>

        <Card>
          <form onSubmit={handleSearch} noValidate className="space-y-4">
            <Input
              label="Booking reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. KK-ABC123"
              required
            />
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="the email used when booking"
              required
            />

            {error && (
              <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} className="w-full gap-2">
              <Search size={14} />
              Find booking
            </Button>
          </form>
        </Card>

        {booking && (
          <Card className="mt-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-navy/50 mb-0.5">Reference</p>
                <p className="text-xl font-bold font-mono text-navy">{booking.reference}</p>
              </div>
              <Badge color={getStatusColour(booking.status)}>{booking.status}</Badge>
            </div>

            {booking.flight && (
              <div className="flex items-center gap-3 mb-4">
                <Plane size={14} className="text-sky-accent -rotate-45 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-navy">
                    {booking.flight.route.originCode} → {booking.flight.route.destinationCode}
                  </p>
                  <p className="text-xs text-navy/50 flex items-center gap-1">
                    <Clock size={10} />
                    {formatDateTime(booking.flight.departureAt)}
                  </p>
                </div>
              </div>
            )}

            <div className="border-t border-navy/8 pt-3 flex items-center justify-between">
              <span className="text-sm font-bold text-navy">{formatNgn(booking.totalNgn)}</span>
              <Button variant="secondary" size="sm" loading={downloading} onClick={handleDownload} className="gap-1.5">
                <Download size={13} />
                Download itinerary
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
