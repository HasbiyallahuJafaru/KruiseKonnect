'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ArrowRight, Plane, Clock } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { api, type FlightSchedule, type PassengerDto } from '@/lib/api'
import { formatNgn, formatDuration, formatDateTime } from '@/lib/utils'

interface BookingPageProps {
  params: { scheduleId: string }
  searchParams: { passengers?: string }
}

const EMPTY_PASSENGER: PassengerDto = {
  firstName: '',
  lastName: '',
  passportNumber: '',
  dateOfBirth: '',
  nationality: '',
}

export default function BookingPage({ params, searchParams }: BookingPageProps) {
  const router = useRouter()
  const passengerCount = Number(searchParams.passengers ?? '1')

  const [flight, setFlight] = useState<FlightSchedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [passengers, setPassengers] = useState<PassengerDto[]>(
    Array.from({ length: Math.max(1, passengerCount) }, () => ({ ...EMPTY_PASSENGER }))
  )
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')

  useEffect(() => {
    api.flights.getSchedule(params.scheduleId)
      .then((res) => setFlight(res.data))
      .catch(() => router.push('/flights/search'))
      .finally(() => setLoading(false))
  }, [params.scheduleId, router])

  function updatePassenger(index: number, field: keyof PassengerDto, value: string) {
    setPassengers((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  function addPassenger() {
    if (!flight || passengers.length >= flight.seatsAvailable) return
    setPassengers((prev) => [...prev, { ...EMPTY_PASSENGER }])
  }

  function removePassenger(index: number) {
    if (passengers.length <= 1) return
    setPassengers((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!contactEmail || !contactPhone) {
      setError('Contact email and phone are required')
      return
    }

    setSubmitting(true)
    try {
      const res = await api.bookings.create({
        scheduleId: params.scheduleId,
        passengers,
        contactEmail,
        contactPhone,
      })
      router.push(`/booking/checkout/${res.data.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Booking failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!flight) return null

  const totalPrice = flight.priceNgn * passengers.length

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form */}
      <div className="lg:col-span-2">
        <h1 className="text-xl font-bold text-navy mb-6">Passenger details</h1>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {passengers.map((passenger, i) => (
            <Card key={i}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-navy">
                  Passenger {i + 1}
                  {i === 0 && <span className="ml-2 text-xs text-navy/50 font-normal">(Lead passenger)</span>}
                </h2>
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => removePassenger(i)}
                    className="text-red-500 hover:text-red-700 transition-colors p-1"
                    aria-label={`Remove passenger ${i + 1}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="First name"
                  value={passenger.firstName}
                  onChange={(e) => updatePassenger(i, 'firstName', e.target.value)}
                  required
                  placeholder="Ada"
                />
                <Input
                  label="Last name"
                  value={passenger.lastName}
                  onChange={(e) => updatePassenger(i, 'lastName', e.target.value)}
                  required
                  placeholder="Okafor"
                />
                <Input
                  label="Passport / ID number"
                  value={passenger.passportNumber}
                  onChange={(e) => updatePassenger(i, 'passportNumber', e.target.value)}
                  required
                  placeholder="A12345678"
                />
                <Input
                  label="Date of birth"
                  type="date"
                  value={passenger.dateOfBirth}
                  onChange={(e) => updatePassenger(i, 'dateOfBirth', e.target.value)}
                  required
                />
                <Input
                  label="Nationality"
                  value={passenger.nationality}
                  onChange={(e) => updatePassenger(i, 'nationality', e.target.value)}
                  required
                  placeholder="Nigerian"
                  className="sm:col-span-2"
                />
              </div>
            </Card>
          ))}

          {/* Add passenger */}
          {passengers.length < flight.seatsAvailable && (
            <button
              type="button"
              onClick={addPassenger}
              className="flex items-center gap-2 text-sm text-sky-accent hover:text-sky-light transition-colors"
            >
              <Plus size={14} />
              Add another passenger
            </button>
          )}

          {/* Contact */}
          <Card>
            <h2 className="font-semibold text-navy mb-4">Contact details</h2>
            <p className="text-xs text-navy/50 mb-4">
              Booking confirmation and itinerary will be sent here.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email address"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
              <Input
                label="Phone number"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                required
                placeholder="+234 801 234 5678"
              />
            </div>
          </Card>

          {error && (
            <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" loading={submitting} size="lg" className="w-full">
            Continue to checkout <ArrowRight size={16} />
          </Button>
        </form>
      </div>

      {/* Sidebar summary */}
      <div className="lg:col-span-1">
        <div className="sticky top-8">
          <Card>
            <h2 className="font-semibold text-navy mb-4">Your flight</h2>

            <div className="flex items-center gap-3 mb-4">
              <Plane size={16} className="text-sky-accent -rotate-45 shrink-0" />
              <div>
                <p className="text-sm font-medium text-navy">
                  {flight.route.originCode} → {flight.route.destinationCode}
                </p>
                <p className="text-xs text-navy/50">{formatDateTime(flight.departureAt)}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs text-navy/50 mb-5">
              <Clock size={10} />
              {formatDuration(flight.durationMinutes)} &bull; {flight.aircraft.name}
            </div>

            <div className="border-t border-navy/8 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-navy/60">{formatNgn(flight.priceNgn)} × {passengers.length}</span>
                <span className="text-navy font-medium">{formatNgn(totalPrice)}</span>
              </div>
              <div className="flex justify-between font-semibold text-navy">
                <span>Total</span>
                <span>{formatNgn(totalPrice)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
