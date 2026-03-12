import { NextResponse } from 'next/server'
import { getBooking } from '@/lib/mock-data'

// GET /api/bookings/:id
export function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const booking = getBooking(params.id)
  if (!booking) {
    return NextResponse.json({ message: 'Booking not found' }, { status: 404 })
  }
  return NextResponse.json({ data: booking })
}
