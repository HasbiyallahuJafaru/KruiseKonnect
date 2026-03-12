import { NextResponse, type NextRequest } from 'next/server'

// POST /api/payments/initialize
// In demo mode, skip Paystack and redirect straight to the payment-processing
// page which will call /verify and auto-confirm after the SSE fallback fires.
export async function POST(req: NextRequest) {
  const { bookingId } = await req.json() as { bookingId: string }

  const reference = `DEMO-${bookingId.toUpperCase()}`
  const origin = req.nextUrl.origin
  const authorizationUrl = `${origin}/booking/payment/${reference}`

  return NextResponse.json({ data: { authorizationUrl, reference } })
}
