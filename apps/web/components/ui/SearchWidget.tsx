'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Calendar, Users, Search } from 'lucide-react'
import { Button } from './Button'
import { Input } from './Input'

const LAGOS_ROUTES = [
  { value: 'LOS', label: 'Lagos (LOS)' },
  { value: 'ABV', label: 'Abuja (ABV)' },
  { value: 'PHC', label: 'Port Harcourt (PHC)' },
  { value: 'KAN', label: 'Kano (KAN)' },
  { value: 'CBQ', label: 'Calabar (CBQ)' },
  { value: 'BNI', label: 'Benin (BNI)' },
  { value: 'ILR', label: 'Ilorin (ILR)' },
  { value: 'ENU', label: 'Enugu (ENU)' },
]

const TODAY = new Date().toISOString().split('T')[0]

export function SearchWidget() {
  const router = useRouter()
  const [origin, setOrigin] = useState('LOS')
  const [destination, setDestination] = useState('')
  const [date, setDate] = useState('')
  const [passengers, setPassengers] = useState('1')
  const [error, setError] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!destination) { setError('Please select a destination'); return }
    if (!date) { setError('Please select a date'); return }
    if (origin === destination) { setError('Origin and destination cannot be the same'); return }

    const params = new URLSearchParams({ origin, destination, date, passengers })
    router.push(`/flights/search?${params.toString()}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white border border-navy/8 shadow-card-hover p-4 sm:p-6"
      noValidate
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Origin */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="origin" className="text-sm font-medium text-navy">
            From
          </label>
          <div className="relative">
            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/40 pointer-events-none" />
            <select
              id="origin"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full h-10 rounded-xl border border-navy/15 bg-white pl-8 pr-3 text-sm text-navy appearance-none focus:outline-none focus:ring-2 focus:ring-sky-accent focus:border-transparent"
              required
            >
              {LAGOS_ROUTES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Destination */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="destination" className="text-sm font-medium text-navy">
            To
          </label>
          <div className="relative">
            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-accent pointer-events-none" />
            <select
              id="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full h-10 rounded-xl border border-navy/15 bg-white pl-8 pr-3 text-sm text-navy appearance-none focus:outline-none focus:ring-2 focus:ring-sky-accent focus:border-transparent"
            >
              <option value="">Select destination</option>
              {LAGOS_ROUTES.filter((r) => r.value !== origin).map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="travel-date" className="text-sm font-medium text-navy">
            Date
          </label>
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/40 pointer-events-none" />
            <input
              id="travel-date"
              type="date"
              value={date}
              min={TODAY}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-10 rounded-xl border border-navy/15 bg-white pl-8 pr-3 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-sky-accent focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Passengers */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="passengers" className="text-sm font-medium text-navy">
            Passengers
          </label>
          <div className="relative">
            <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/40 pointer-events-none" />
            <select
              id="passengers"
              value={passengers}
              onChange={(e) => setPassengers(e.target.value)}
              className="w-full h-10 rounded-xl border border-navy/15 bg-white pl-8 pr-3 text-sm text-navy appearance-none focus:outline-none focus:ring-2 focus:ring-sky-accent focus:border-transparent"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={String(n)}>{n} {n === 1 ? 'passenger' : 'passengers'}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>
      )}

      <div className="mt-4 flex justify-end">
        <Button type="submit" size="lg" className="gap-2 w-full sm:w-auto">
          <Search size={16} />
          Search flights
        </Button>
      </div>
    </form>
  )
}
