import { NextResponse } from 'next/server'

// GET /api/payments/verify/:reference
// Demo: all DEMO-* references resolve to success so the payment-processing page
// auto-redirects to the confirmation page.
export function GET(
  _req: Request,
  { params }: { params: { reference: string } }
) {
  const { reference } = params

  // Extract the bookingId from the demo reference format DEMO-{BOOKINGID}
  const bookingId = reference.startsWith('DEMO-')
    ? reference.slice(5).toLowerCase()
    : 'demo-checkout'

  return NextResponse.json({ data: { status: 'success', bookingId } })
}
