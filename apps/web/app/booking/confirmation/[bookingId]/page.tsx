import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CheckCircle2, Download, Mail, LayoutDashboard } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { api } from '@/lib/api'
import { formatNgn, formatDateTime } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface ConfirmationPageProps {
  params: { bookingId: string }
}

export default async function ConfirmationPage({ params }: ConfirmationPageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let booking
  try {
    const res = await api.bookings.get(params.bookingId)
    booking = res.data
  } catch {
    redirect('/dashboard/bookings')
  }

  let itineraryUrl: string | null = null
  try {
    const res = await api.documents.getItineraryUrl(params.bookingId)
    itineraryUrl = res.data.url
  } catch {
    // Documents may not be ready yet — that's fine
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Success header */}
      <div className="text-center mb-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 mx-auto mb-4">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        <h1 className="text-2xl font-bold text-navy mb-2">Booking confirmed!</h1>
        <p className="text-navy/60">
          Your itinerary has been emailed to <strong>{booking.contactEmail}</strong>
        </p>
      </div>

      <div className="space-y-5">
        {/* Reference */}
        <Card className="text-center py-6">
          <p className="text-xs text-navy/50 mb-1">Booking reference</p>
          <p className="text-3xl font-bold font-mono text-navy tracking-widest">
            {booking.reference}
          </p>
          <Badge color="green" className="mt-3">Confirmed</Badge>
        </Card>

        {/* Flight */}
        {booking.flight && (
          <Card>
            <h2 className="font-semibold text-navy mb-4">Flight details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-navy/50 mb-0.5">Route</p>
                <p className="font-medium text-navy">
                  {booking.flight.route.originCode} → {booking.flight.route.destinationCode}
                </p>
              </div>
              <div>
                <p className="text-xs text-navy/50 mb-0.5">Departure</p>
                <p className="font-medium text-navy">{formatDateTime(booking.flight.departureAt)}</p>
              </div>
              <div>
                <p className="text-xs text-navy/50 mb-0.5">Aircraft</p>
                <p className="font-medium text-navy">{booking.flight.aircraft.name}</p>
              </div>
              <div>
                <p className="text-xs text-navy/50 mb-0.5">Total paid</p>
                <p className="font-bold text-navy">{formatNgn(booking.totalNgn)}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Passengers */}
        <Card>
          <h2 className="font-semibold text-navy mb-4">Passengers</h2>
          <ul className="space-y-3">
            {booking.passengers.map((p, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-sky-pale flex items-center justify-center text-xs font-semibold text-sky-accent shrink-0">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-navy">{p.firstName} {p.lastName}</p>
                  <p className="text-xs text-navy/50">{p.passportNumber}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {itineraryUrl && (
            <Button variant="secondary" asChild>
              <a href={itineraryUrl} download target="_blank" rel="noreferrer" className="flex items-center gap-2">
                <Download size={14} />
                Itinerary PDF
              </a>
            </Button>
          )}
          <Button variant="ghost" asChild>
            <Link href="/dashboard/bookings" className="flex items-center gap-2">
              <LayoutDashboard size={14} />
              My bookings
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/flights/search" className="flex items-center gap-2">
              Book another
            </Link>
          </Button>
        </div>

        {/* Email reminder */}
        <div className="flex items-center gap-3 rounded-xl bg-sky-pale border border-sky-accent/15 p-4">
          <Mail size={16} className="text-sky-accent shrink-0" />
          <p className="text-xs text-navy/70">
            A copy of your itinerary and receipt has been sent to <strong>{booking.contactEmail}</strong>.
            Check your spam folder if you don&apos;t see it within 5 minutes.
          </p>
        </div>
      </div>
    </div>
  )
}
