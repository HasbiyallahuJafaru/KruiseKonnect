import { NextResponse, type NextRequest } from 'next/server'
import { MOCK_BOOKINGS } from '@/lib/mock-data'

// GET /api/bookings/retrieve?reference=KK-DEMO01&email=...
export function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const reference = searchParams.get('reference')?.toUpperCase()
  const email = searchParams.get('email')?.toLowerCase()

  const booking = MOCK_BOOKINGS.find(
    (b) =>
      b.reference === reference &&
      b.contactEmail.toLowerCase() === email,
  )

  if (!booking) {
    return NextResponse.json({ message: 'Booking not found' }, { status: 404 })
  }

  return NextResponse.json({ data: booking })
}
