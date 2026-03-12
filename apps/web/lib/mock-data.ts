/**
 * Mock data for the KruiseKonnect demo / MVP.
 * All flight times are generated relative to today so they always appear in the future.
 */

import type {
  FlightResult,
  FlightSchedule,
  FeaturedRoute,
  Booking,
  Payment,
  Customer,
  Route,
  Aircraft,
  AdminOverview,
} from '@/lib/api'

// ─── Date helpers ─────────────────────────────────────────────────────────────

function addDays(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

function makeTime(daysAhead: number, hour: number, minute = 0): string {
  const d = addDays(daysAhead)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function addMinutes(iso: string, mins: number): string {
  return new Date(new Date(iso).getTime() + mins * 60_000).toISOString()
}

function past(daysAgo: number, hour = 10): string {
  const d = addDays(-daysAgo)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

// ─── Aircraft ─────────────────────────────────────────────────────────────────

export const MOCK_AIRCRAFT: Aircraft[] = [
  { id: 'ac-1', name: 'Boeing 737-800', registration: '5N-KKA', type: 'Narrowbody Jet', totalSeats: 162, isActive: true },
  { id: 'ac-2', name: 'Bombardier Q400', registration: '5N-KKB', type: 'Turboprop', totalSeats: 78, isActive: true },
  { id: 'ac-3', name: 'ATR 72-600', registration: '5N-KKC', type: 'Turboprop', totalSeats: 70, isActive: true },
  { id: 'ac-4', name: 'Boeing 737-700', registration: '5N-KKD', type: 'Narrowbody Jet', totalSeats: 140, isActive: true },
  { id: 'ac-5', name: 'Embraer E175', registration: '5N-KKE', type: 'Regional Jet', totalSeats: 80, isActive: false },
]

// ─── Routes ───────────────────────────────────────────────────────────────────

export const MOCK_ROUTES: Route[] = [
  { id: 'rt-1', origin: 'Lagos', destination: 'Abuja', originCode: 'LOS', destinationCode: 'ABV', isActive: true },
  { id: 'rt-2', origin: 'Lagos', destination: 'Port Harcourt', originCode: 'LOS', destinationCode: 'PHC', isActive: true },
  { id: 'rt-3', origin: 'Lagos', destination: 'Kano', originCode: 'LOS', destinationCode: 'KAN', isActive: true },
  { id: 'rt-4', origin: 'Lagos', destination: 'Enugu', originCode: 'LOS', destinationCode: 'ENU', isActive: true },
  { id: 'rt-5', origin: 'Abuja', destination: 'Lagos', originCode: 'ABV', destinationCode: 'LOS', isActive: true },
  { id: 'rt-6', origin: 'Port Harcourt', destination: 'Abuja', originCode: 'PHC', destinationCode: 'ABV', isActive: true },
]

// ─── Schedules / Flight results ───────────────────────────────────────────────

const dep1 = makeTime(1, 7, 0)
const dep2 = makeTime(1, 14, 30)
const dep3 = makeTime(1, 9, 0)
const dep4 = makeTime(1, 11, 0)
const dep5 = makeTime(1, 16, 0)
const dep6 = makeTime(2, 8, 0)
const dep7 = makeTime(2, 13, 0)

export const MOCK_SCHEDULES: FlightSchedule[] = [
  {
    scheduleId: 'los-abv-am',
    route: { origin: 'Lagos', destination: 'Abuja', originCode: 'LOS', destinationCode: 'ABV' },
    aircraft: { name: 'Boeing 737-800', type: 'Narrowbody Jet', totalSeats: 162 },
    departureAt: dep1,
    arrivalAt: addMinutes(dep1, 75),
    durationMinutes: 75,
    seatsAvailable: 45,
    priceNgn: 85_000,
    policies: 'Check-in closes 45 minutes before departure.\nFree cancellation up to 24 hours before departure.\nOne piece of carry-on (7kg) and one checked bag (23kg) included.\nRescheduling fee: ₦10,000 per passenger.',
    amenities: ['WiFi', 'Refreshments', 'Luggage'],
  },
  {
    scheduleId: 'los-abv-pm',
    route: { origin: 'Lagos', destination: 'Abuja', originCode: 'LOS', destinationCode: 'ABV' },
    aircraft: { name: 'Boeing 737-800', type: 'Narrowbody Jet', totalSeats: 162 },
    departureAt: dep2,
    arrivalAt: addMinutes(dep2, 75),
    durationMinutes: 75,
    seatsAvailable: 12,
    priceNgn: 92_000,
    policies: 'Check-in closes 45 minutes before departure.\nFree cancellation up to 24 hours before departure.\nOne piece of carry-on (7kg) and one checked bag (23kg) included.',
    amenities: ['Refreshments', 'Luggage'],
  },
  {
    scheduleId: 'los-phc-1',
    route: { origin: 'Lagos', destination: 'Port Harcourt', originCode: 'LOS', destinationCode: 'PHC' },
    aircraft: { name: 'Bombardier Q400', type: 'Turboprop', totalSeats: 78 },
    departureAt: dep3,
    arrivalAt: addMinutes(dep3, 55),
    durationMinutes: 55,
    seatsAvailable: 28,
    priceNgn: 65_000,
    policies: 'Check-in closes 30 minutes before departure.\nCancellation fee of ₦15,000 applies within 24 hours.\nCarry-on only (7kg). Checked bags: ₦5,000 per piece.',
    amenities: ['Refreshments'],
  },
  {
    scheduleId: 'los-kan-1',
    route: { origin: 'Lagos', destination: 'Kano', originCode: 'LOS', destinationCode: 'KAN' },
    aircraft: { name: 'Boeing 737-700', type: 'Narrowbody Jet', totalSeats: 140 },
    departureAt: dep4,
    arrivalAt: addMinutes(dep4, 110),
    durationMinutes: 110,
    seatsAvailable: 3,
    priceNgn: 110_000,
    policies: 'Check-in closes 45 minutes before departure.\nNo cancellations within 48 hours.\nOne carry-on (7kg) and one checked bag (23kg) included.',
    amenities: ['WiFi', 'Refreshments', 'Luggage'],
  },
  {
    scheduleId: 'los-enu-1',
    route: { origin: 'Lagos', destination: 'Enugu', originCode: 'LOS', destinationCode: 'ENU' },
    aircraft: { name: 'ATR 72-600', type: 'Turboprop', totalSeats: 70 },
    departureAt: dep5,
    arrivalAt: addMinutes(dep5, 65),
    durationMinutes: 65,
    seatsAvailable: 31,
    priceNgn: 75_000,
    policies: 'Check-in closes 30 minutes before departure.\nFree cancellation up to 48 hours before departure.\nCarry-on included. Checked bags: ₦8,000 per piece.',
    amenities: ['Refreshments'],
  },
  {
    scheduleId: 'abv-los-am',
    route: { origin: 'Abuja', destination: 'Lagos', originCode: 'ABV', destinationCode: 'LOS' },
    aircraft: { name: 'Boeing 737-800', type: 'Narrowbody Jet', totalSeats: 162 },
    departureAt: dep6,
    arrivalAt: addMinutes(dep6, 75),
    durationMinutes: 75,
    seatsAvailable: 60,
    priceNgn: 82_000,
    policies: 'Check-in closes 45 minutes before departure.\nFree cancellation up to 24 hours before departure.\nOne carry-on (7kg) and one checked bag (23kg) included.',
    amenities: ['WiFi', 'Refreshments', 'Luggage'],
  },
  {
    scheduleId: 'phc-abv-1',
    route: { origin: 'Port Harcourt', destination: 'Abuja', originCode: 'PHC', destinationCode: 'ABV' },
    aircraft: { name: 'Bombardier Q400', type: 'Turboprop', totalSeats: 78 },
    departureAt: dep7,
    arrivalAt: addMinutes(dep7, 90),
    durationMinutes: 90,
    seatsAvailable: 22,
    priceNgn: 72_000,
    policies: 'Check-in closes 30 minutes before departure.\nCancellation fee of ₦12,000 applies within 24 hours.',
    amenities: ['Refreshments'],
  },
]

// ─── Featured routes ──────────────────────────────────────────────────────────

export const MOCK_FEATURED_ROUTES: FeaturedRoute[] = [
  { id: 'rt-1', origin: 'Lagos', destination: 'Abuja', originCode: 'LOS', destinationCode: 'ABV', priceFrom: 85_000, durationMinutes: 75 },
  { id: 'rt-2', origin: 'Lagos', destination: 'Port Harcourt', originCode: 'LOS', destinationCode: 'PHC', priceFrom: 65_000, durationMinutes: 55 },
  { id: 'rt-3', origin: 'Lagos', destination: 'Kano', originCode: 'LOS', destinationCode: 'KAN', priceFrom: 110_000, durationMinutes: 110 },
  { id: 'rt-4', origin: 'Lagos', destination: 'Enugu', originCode: 'LOS', destinationCode: 'ENU', priceFrom: 75_000, durationMinutes: 65 },
]

// ─── Pre-populated demo bookings ──────────────────────────────────────────────

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'demo-booking-1',
    reference: 'KK-DEMO01',
    scheduleId: 'los-abv-am',
    status: 'confirmed',
    passengers: [
      { firstName: 'Ada', lastName: 'Okafor', passportNumber: 'A12345678', dateOfBirth: '1990-03-15', nationality: 'Nigerian' },
    ],
    contactEmail: 'ada.okafor@example.com',
    contactPhone: '+234 801 234 5678',
    totalNgn: 85_000,
    createdAt: past(5),
    flight: MOCK_SCHEDULES[0],
  },
  {
    id: 'demo-booking-2',
    reference: 'KK-DEMO02',
    scheduleId: 'los-phc-1',
    status: 'confirmed',
    passengers: [
      { firstName: 'Emeka', lastName: 'Nwosu', passportNumber: 'B98765432', dateOfBirth: '1985-07-20', nationality: 'Nigerian' },
      { firstName: 'Chisom', lastName: 'Nwosu', passportNumber: 'B98765433', dateOfBirth: '1988-11-05', nationality: 'Nigerian' },
    ],
    contactEmail: 'emeka.nwosu@example.com',
    contactPhone: '+234 802 345 6789',
    totalNgn: 130_000,
    createdAt: past(12),
    flight: MOCK_SCHEDULES[2],
  },
  {
    id: 'demo-booking-3',
    reference: 'KK-DEMO03',
    scheduleId: 'los-kan-1',
    status: 'pending',
    passengers: [
      { firstName: 'Fatima', lastName: 'Bello', passportNumber: 'C11223344', dateOfBirth: '1995-01-30', nationality: 'Nigerian' },
    ],
    contactEmail: 'fatima.bello@example.com',
    contactPhone: '+234 803 456 7890',
    totalNgn: 110_000,
    createdAt: past(1),
    flight: MOCK_SCHEDULES[3],
  },
]

// Booking returned during the demo checkout flow (status: pending so payment UI shows)
export const DEMO_CHECKOUT_BOOKING: Booking = {
  id: 'demo-checkout',
  reference: 'KK-NEW01',
  scheduleId: 'los-abv-am',
  status: 'pending',
  passengers: [
    { firstName: 'Demo', lastName: 'User', passportNumber: 'D00000001', dateOfBirth: '1992-06-10', nationality: 'Nigerian' },
  ],
  contactEmail: 'demo@kruisekonnect.ng',
  contactPhone: '+234 800 000 0000',
  totalNgn: 85_000,
  createdAt: new Date().toISOString(),
  flight: MOCK_SCHEDULES[0],
}

// Booking that is shown as confirmed on the confirmation page
export const DEMO_CONFIRMED_BOOKING: Booking = {
  ...DEMO_CHECKOUT_BOOKING,
  status: 'confirmed',
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    bookingId: 'demo-booking-1',
    reference: 'PAY-KK01',
    amountNgn: 85_000,
    status: 'success',
    createdAt: past(5),
    booking: MOCK_BOOKINGS[0],
  },
  {
    id: 'pay-2',
    bookingId: 'demo-booking-2',
    reference: 'PAY-KK02',
    amountNgn: 130_000,
    status: 'success',
    createdAt: past(12),
    booking: MOCK_BOOKINGS[1],
  },
  {
    id: 'pay-3',
    bookingId: 'demo-booking-3',
    reference: 'PAY-KK03',
    amountNgn: 110_000,
    status: 'pending',
    createdAt: past(1),
    booking: MOCK_BOOKINGS[2],
  },
]

// ─── Customers ────────────────────────────────────────────────────────────────

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'cust-1', email: 'ada.okafor@example.com', fullName: 'Ada Okafor', phone: '+234 801 234 5678', createdAt: past(30), bookingCount: 3 },
  { id: 'cust-2', email: 'emeka.nwosu@example.com', fullName: 'Emeka Nwosu', phone: '+234 802 345 6789', createdAt: past(45), bookingCount: 5 },
  { id: 'cust-3', email: 'fatima.bello@example.com', fullName: 'Fatima Bello', phone: '+234 803 456 7890', createdAt: past(10), bookingCount: 1 },
  { id: 'cust-4', email: 'chidi.okeke@example.com', fullName: 'Chidi Okeke', createdAt: past(60), bookingCount: 8 },
  { id: 'cust-5', email: 'ngozi.eze@example.com', fullName: 'Ngozi Eze', phone: '+234 805 678 9012', createdAt: past(20), bookingCount: 2 },
  { id: 'cust-6', email: 'tunde.adeyemi@example.com', fullName: 'Tunde Adeyemi', phone: '+234 806 789 0123', createdAt: past(3), bookingCount: 1 },
]

// ─── Admin overview ───────────────────────────────────────────────────────────

export const MOCK_ADMIN_OVERVIEW: AdminOverview = {
  bookingsToday: 7,
  revenueToday: 595_000,
  revenueMonth: 12_450_000,
  activeBookings: 42,
  pendingPayments: 3,
  totalCustomers: 218,
  recentBookings: MOCK_BOOKINGS,
}

// ─── Search helper ────────────────────────────────────────────────────────────

export function searchFlights(
  origin: string,
  destination: string,
): FlightResult[] {
  const o = origin.toUpperCase()
  const d = destination.toUpperCase()

  return MOCK_SCHEDULES.filter(
    (s) =>
      (s.route.originCode === o || s.route.origin.toUpperCase() === o) &&
      (s.route.destinationCode === d || s.route.destination.toUpperCase() === d),
  )
}

export function getSchedule(scheduleId: string): FlightSchedule | undefined {
  return MOCK_SCHEDULES.find((s) => s.scheduleId === scheduleId)
}

export function getBooking(id: string): Booking | undefined {
  if (id === 'demo-checkout') return DEMO_CHECKOUT_BOOKING
  if (id === 'demo-confirmed') return DEMO_CONFIRMED_BOOKING
  return MOCK_BOOKINGS.find((b) => b.id === id)
}
