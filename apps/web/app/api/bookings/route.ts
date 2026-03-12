import { NextResponse } from 'next/server'

// POST /api/bookings — create a booking (demo: always returns demo-checkout id)
export async function POST() {
  return NextResponse.json({ data: { id: 'demo-checkout' } })
}
