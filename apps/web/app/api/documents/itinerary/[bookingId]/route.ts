import { NextResponse } from 'next/server'

// GET /api/documents/itinerary/:bookingId
// Demo: return a placeholder PDF URL
export function GET(
  _req: Request,
  { params }: { params: { bookingId: string } }
) {
  const url = `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`
  return NextResponse.json({ data: { url, bookingId: params.bookingId } })
}
