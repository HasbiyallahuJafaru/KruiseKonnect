import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Shield, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { api } from '@/lib/api'
import { formatNgn, formatDateTime } from '@/lib/utils'
import { PaystackButton } from '@/components/booking/PaystackButton'

export const dynamic = 'force-dynamic'

interface CheckoutPageProps {
  params: { bookingId: string }
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect(`/login?redirect=/booking/checkout/${params.bookingId}`)
  }

  let booking
  try {
    const res = await api.bookings.get(params.bookingId)
    booking = res.data
  } catch {
    redirect('/dashboard/bookings')
  }

  if (booking.status !== 'pending') {
    redirect(`/booking/confirmation/${params.bookingId}`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/booking/${booking.scheduleId}`}
        className="inline-flex items-center gap-2 text-sm text-navy/60 hover:text-navy transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Back to booking form
      </Link>

      <h1 className="text-xl font-bold text-navy mb-6">Review & pay</h1>

      <div className="space-y-5">
        {/* Booking summary */}
        <Card>
          <h2 className="font-semibold text-navy mb-4">Booking summary</h2>

          <div className="grid grid-cols-2 gap-3 text-sm mb-5">
            <div>
              <p className="text-navy/50 text-xs mb-0.5">Reference</p>
              <p className="font-mono font-semibold text-navy">{booking.reference}</p>
            </div>
            <div>
              <p className="text-navy/50 text-xs mb-0.5">Passengers</p>
              <p className="font-medium text-navy">{booking.passengers.length}</p>
            </div>
            <div>
              <p className="text-navy/50 text-xs mb-0.5">Contact email</p>
              <p className="font-medium text-navy">{booking.contactEmail}</p>
            </div>
            <div>
              <p className="text-navy/50 text-xs mb-0.5">Contact phone</p>
              <p className="font-medium text-navy">{booking.contactPhone}</p>
            </div>
          </div>

          {booking.flight && (
            <div className="border-t border-navy/8 pt-4">
              <p className="text-navy/50 text-xs mb-2">Flight</p>
              <p className="font-medium text-navy">
                {booking.flight.route.originCode} → {booking.flight.route.destinationCode}
              </p>
              <p className="text-sm text-navy/60">
                {formatDateTime(booking.flight.departureAt)}
              </p>
            </div>
          )}
        </Card>

        {/* Passengers */}
        <Card>
          <h2 className="font-semibold text-navy mb-4">Passengers</h2>
          <ul className="space-y-3">
            {booking.passengers.map((p, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-pale text-xs font-semibold text-sky-accent shrink-0">
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

        {/* Price breakdown */}
        <Card>
          <h2 className="font-semibold text-navy mb-4">Price breakdown</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-navy/60">
                Base fare × {booking.passengers.length}
              </span>
              <span className="text-navy">{formatNgn(booking.totalNgn)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-navy/60">Taxes & fees</span>
              <span className="text-navy text-xs italic">Included</span>
            </div>
            <div className="border-t border-navy/8 pt-2 flex justify-between font-bold text-navy">
              <span>Total</span>
              <span className="text-lg">{formatNgn(booking.totalNgn)}</span>
            </div>
          </div>
        </Card>

        {/* Trust signals */}
        <div className="flex items-center gap-2 text-xs text-navy/50 justify-center">
          <Shield size={12} className="text-emerald-500" />
          Secured by Paystack &bull; SSL encrypted &bull; No card data stored
        </div>

        {/* Pay button */}
        <PaystackButton bookingId={params.bookingId} amount={booking.totalNgn} />

        {/* What happens next */}
        <Card padding="sm">
          <p className="text-xs font-semibold text-navy mb-2">What happens after payment?</p>
          <ul className="space-y-1.5">
            {[
              'Your booking is instantly confirmed',
              'PDF receipt and itinerary sent to your email',
              'Documents available in your dashboard anytime',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-xs text-navy/60">
                <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
