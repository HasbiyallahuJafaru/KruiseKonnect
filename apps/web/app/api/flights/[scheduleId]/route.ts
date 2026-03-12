import { NextResponse } from 'next/server'
import { getSchedule } from '@/lib/mock-data'

export function GET(
  _req: Request,
  { params }: { params: { scheduleId: string } }
) {
  const schedule = getSchedule(params.scheduleId)
  if (!schedule) {
    return NextResponse.json({ message: 'Flight not found' }, { status: 404 })
  }
  return NextResponse.json({ data: schedule })
}
