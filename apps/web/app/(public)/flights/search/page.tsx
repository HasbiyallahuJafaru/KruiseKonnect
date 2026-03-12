import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Plane, Clock, Users, AlertCircle } from 'lucide-react'
import { SearchWidget } from '@/components/ui/SearchWidget'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { api, type FlightResult } from '@/lib/api'
import { formatNgn, formatDuration, formatTime, formatDate } from '@/lib/utils'

export const revalidate = 120

export const metadata: Metadata = {
  title: 'Search Flights',
}

interface SearchPageProps {
  searchParams: {
    origin?: string
    destination?: string
    date?: string
    passengers?: string
  }
}

async function searchFlights(params: SearchPageProps['searchParams']): Promise<FlightResult[]> {
  if (!params.origin || !params.destination || !params.date) return []

  try {
    const res = await api.flights.search({
      origin: params.origin,
      destination: params.destination,
      date: params.date,
      passengers: params.passengers ?? '1',
    })
    return res.data
  } catch {
    return []
  }
}

function FlightCard({ flight, passengers }: { flight: FlightResult; passengers: string }) {
  const totalPrice = flight.priceNgn * Number(passengers)
  const seatWarning = flight.seatsAvailable <= 3

  return (
    <Card hover className="transition-all hover:border-sky-accent/20">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Route & time */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-2xl font-bold text-navy">{formatTime(flight.departureAt)}</p>
              <p className="text-xs text-navy/50">{flight.route.originCode}</p>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5 w-full">
                <div className="h-px flex-1 bg-navy/15" />
                <Plane size={12} className="text-sky-accent -rotate-45 shrink-0" />
                <div className="h-px flex-1 bg-navy/15" />
              </div>
              <div className="flex items-center gap-1 text-xs text-navy/50">
                <Clock size={10} />
                {formatDuration(flight.durationMinutes)}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-navy">{formatTime(flight.arrivalAt)}</p>
              <p className="text-xs text-navy/50">{flight.route.destinationCode}</p>
            </div>
          </div>
          <p className="text-xs text-navy/40 mt-1">{formatDate(flight.departureAt)}</p>
        </div>

        {/* Aircraft */}
        <div className="hidden sm:flex flex-col items-center text-center min-w-[100px]">
          <p className="text-xs font-medium text-navy">{flight.aircraft.name}</p>
          <p className="text-xs text-navy/50">{flight.aircraft.type}</p>
        </div>

        {/* Seats */}
        <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1">
          {seatWarning ? (
            <Badge color="red">
              <Users size={10} />
              {flight.seatsAvailable} left
            </Badge>
          ) : (
            <Badge color="green">
              <Users size={10} />
              {flight.seatsAvailable} seats
            </Badge>
          )}
        </div>

        {/* Price + CTA */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 sm:min-w-[140px]">
          <div className="text-right">
            <p className="text-lg font-bold text-navy">{formatNgn(totalPrice)}</p>
            {Number(passengers) > 1 && (
              <p className="text-xs text-navy/50">{formatNgn(flight.priceNgn)} × {passengers}</p>
            )}
          </div>
          <Button size="sm" asChild>
            <Link href={`/flights/${flight.scheduleId}`}>
              Select <ArrowRight size={12} />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const hasSearch = !!(searchParams.origin && searchParams.destination && searchParams.date)
  const flights = hasSearch ? await searchFlights(searchParams) : []
  const passengers = searchParams.passengers ?? '1'

  return (
    <div className="min-h-screen bg-chalk">
      {/* Search header */}
      <div className="bg-navy py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-white font-semibold mb-5">
            {hasSearch
              ? `${searchParams.origin} → ${searchParams.destination}`
              : 'Search flights'}
          </h1>
          <SearchWidget />
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {!hasSearch && (
          <EmptyState
            icon={<Plane size={24} />}
            title="Search for flights above"
            description="Select your origin, destination, date and passenger count to find available flights."
          />
        )}

        {hasSearch && flights.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 mb-4">
              <AlertCircle size={24} className="text-amber-600" />
            </div>
            <h3 className="text-base font-semibold text-navy">No flights found</h3>
            <p className="mt-1 text-sm text-navy/60 max-w-sm">
              No flights available for this route and date. Try a different date or contact us for charter options.
            </p>
          </div>
        )}

        {hasSearch && flights.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-navy/60">
                <span className="font-semibold text-navy">{flights.length}</span>{' '}
                {flights.length === 1 ? 'flight' : 'flights'} found
              </p>
              <p className="text-xs text-navy/40">Prices for {passengers} {Number(passengers) === 1 ? 'passenger' : 'passengers'}</p>
            </div>

            <div className="space-y-4">
              {flights.map((flight) => (
                <FlightCard key={flight.scheduleId} flight={flight} passengers={passengers} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
