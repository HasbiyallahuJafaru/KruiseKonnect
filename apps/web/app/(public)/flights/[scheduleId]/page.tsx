import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Plane,
  Clock,
  Users,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Wifi,
  Coffee,
  Luggage,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { api } from '@/lib/api'
import { formatNgn, formatDuration, formatDateTime, formatTime } from '@/lib/utils'

export const revalidate = 600

interface FlightDetailPageProps {
  params: { scheduleId: string }
}

export async function generateMetadata({ params }: FlightDetailPageProps): Promise<Metadata> {
  try {
    const { data: flight } = await api.flights.getSchedule(params.scheduleId)
    return {
      title: `${flight.route.originCode} → ${flight.route.destinationCode} | Flight Details`,
    }
  } catch {
    return { title: 'Flight Details' }
  }
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  'WiFi': <Wifi size={14} />,
  'Refreshments': <Coffee size={14} />,
  'Luggage': <Luggage size={14} />,
}

export default async function FlightDetailPage({ params }: FlightDetailPageProps) {
  let flight
  try {
    const res = await api.flights.getSchedule(params.scheduleId)
    flight = res.data
  } catch {
    notFound()
  }

  const seatWarning = flight.seatsAvailable <= 5

  return (
    <div className="min-h-screen bg-chalk">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <Link
          href="/flights/search"
          className="inline-flex items-center gap-2 text-sm text-navy/60 hover:text-navy transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Back to results
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main detail */}
          <div className="lg:col-span-2 space-y-5">
            {/* Flight route card */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-lg font-bold text-navy">Flight details</h1>
                {seatWarning ? (
                  <Badge color="red">
                    <Users size={10} />
                    Only {flight.seatsAvailable} seats left
                  </Badge>
                ) : (
                  <Badge color="green">
                    <Users size={10} />
                    {flight.seatsAvailable} seats available
                  </Badge>
                )}
              </div>

              {/* Route visual */}
              <div className="flex items-center gap-4 mb-6">
                <div>
                  <p className="text-3xl font-bold text-navy">{formatTime(flight.departureAt)}</p>
                  <p className="text-sm font-medium text-navy">{flight.route.originCode}</p>
                  <p className="text-xs text-navy/50">{flight.route.origin}</p>
                </div>
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2 w-full">
                    <div className="h-px flex-1 bg-navy/15" />
                    <Plane size={16} className="text-sky-accent -rotate-45 shrink-0" />
                    <div className="h-px flex-1 bg-navy/15" />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-navy/50">
                    <Clock size={10} />
                    {formatDuration(flight.durationMinutes)}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-navy">{formatTime(flight.arrivalAt)}</p>
                  <p className="text-sm font-medium text-navy">{flight.route.destinationCode}</p>
                  <p className="text-xs text-navy/50">{flight.route.destination}</p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center gap-2 text-sm text-navy/60">
                <Calendar size={14} />
                {formatDateTime(flight.departureAt)}
              </div>
            </Card>

            {/* Aircraft */}
            <Card>
              <h2 className="font-semibold text-navy mb-4">Aircraft</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-navy/50 mb-0.5">Name</p>
                  <p className="text-sm font-medium text-navy">{flight.aircraft.name}</p>
                </div>
                <div>
                  <p className="text-xs text-navy/50 mb-0.5">Type</p>
                  <p className="text-sm font-medium text-navy">{flight.aircraft.type}</p>
                </div>
                <div>
                  <p className="text-xs text-navy/50 mb-0.5">Capacity</p>
                  <p className="text-sm font-medium text-navy">{flight.aircraft.totalSeats} seats</p>
                </div>
              </div>

              {flight.amenities.length > 0 && (
                <div className="mt-4 pt-4 border-t border-navy/8">
                  <p className="text-xs text-navy/50 mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {flight.amenities.map((a) => (
                      <span
                        key={a}
                        className="inline-flex items-center gap-1.5 rounded-full bg-sky-pale border border-sky-accent/20 px-3 py-1 text-xs font-medium text-sky-accent"
                      >
                        {AMENITY_ICONS[a] ?? <CheckCircle2 size={10} />}
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Policies */}
            {flight.policies && (
              <Card>
                <h2 className="font-semibold text-navy mb-3">Booking policies</h2>
                <p className="text-sm text-navy/60 leading-relaxed whitespace-pre-line">
                  {flight.policies}
                </p>
              </Card>
            )}
          </div>

          {/* Sidebar — price + CTA */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card>
                <div className="mb-5">
                  <p className="text-xs text-navy/50 mb-1">Price per passenger</p>
                  <p className="text-3xl font-bold text-navy">{formatNgn(flight.priceNgn)}</p>
                </div>

                <ul className="space-y-2 mb-5 text-sm text-navy/70">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    Instant booking confirmation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    PDF itinerary emailed immediately
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    Secure Paystack payment
                  </li>
                </ul>

                <Button className="w-full" asChild>
                  <Link href={`/booking/${flight.scheduleId}`}>
                    Book this flight <ArrowRight size={14} />
                  </Link>
                </Button>

                <p className="text-xs text-navy/40 text-center mt-3">
                  No hidden fees. Price shown per passenger.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
