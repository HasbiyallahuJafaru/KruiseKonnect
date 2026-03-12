import { NextResponse } from 'next/server'

// GET /api/documents/receipt/:bookingId
// Demo: return a placeholder PDF URL
export function GET(
  _req: Request,
  { params }: { params: { bookingId: string } }
) {
  // In production this would return a signed Supabase Storage URL.
  // For demo, point to a public sample PDF.
  const url = `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`
  return NextResponse.json({ data: { url, bookingId: params.bookingId } })
}
