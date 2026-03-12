// Central API client — all fetch calls go through here

// Fallback to the built-in mock API so the app works without a backend.
// Set NEXT_PUBLIC_API_URL in .env.local (or Netlify env vars) to point at the
// real NestJS backend once it is deployed.
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== 'undefined'
    ? `${window.location.origin}/api`
    : 'http://localhost:3000/api')

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string> } = {}
): Promise<T> {
  const url = new URL(`${API_BASE}${path}`)
  if (options.params) {
    Object.entries(options.params).forEach(([k, v]) => url.searchParams.set(k, v))
  }

  const { params: _params, ...fetchOptions } = options

  const res = await fetch(url.toString(), {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
    credentials: 'include',
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new ApiError(res.status, error.message ?? 'Request failed')
  }

  return res.json() as Promise<T>
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SearchParams {
  origin: string
  destination: string
  date: string
  passengers: string
}

export interface PaginationParams {
  page?: string
  limit?: string
}

export interface CreateBookingDto {
  scheduleId: string
  passengers: PassengerDto[]
  contactEmail: string
  contactPhone: string
}

export interface PassengerDto {
  firstName: string
  lastName: string
  passportNumber: string
  dateOfBirth: string
  nationality: string
  seatNumber?: string
}

// ─── API surface ──────────────────────────────────────────────────────────────

export const api = {
  flights: {
    search: (params: SearchParams) =>
      apiFetch<{ data: FlightResult[] }>('/flights/search', { params }),
    getSchedule: (scheduleId: string) =>
      apiFetch<{ data: FlightSchedule }>(`/flights/${scheduleId}`),
    getFeaturedRoutes: () =>
      apiFetch<{ data: FeaturedRoute[] }>('/flights/featured'),
  },
  bookings: {
    create: (body: CreateBookingDto) =>
      apiFetch<{ data: { id: string } }>('/bookings', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    get: (id: string) =>
      apiFetch<{ data: Booking }>(`/bookings/${id}`),
    getMy: (params?: PaginationParams) =>
      apiFetch<{ data: Booking[]; meta: PaginationMeta }>('/bookings/my', { params }),
    retrieve: (reference: string, email: string) =>
      apiFetch<{ data: Booking }>('/bookings/retrieve', {
        params: { reference, email },
      }),
  },
  payments: {
    initialize: (bookingId: string) =>
      apiFetch<{ data: { authorizationUrl: string; reference: string } }>(
        '/payments/initialize',
        { method: 'POST', body: JSON.stringify({ bookingId }) }
      ),
    verify: (reference: string) =>
      apiFetch<{ data: { status: string; bookingId: string } }>(
        `/payments/verify/${reference}`
      ),
  },
  documents: {
    getReceiptUrl: (bookingId: string) =>
      apiFetch<{ data: { url: string } }>(`/documents/receipt/${bookingId}`),
    getItineraryUrl: (bookingId: string) =>
      apiFetch<{ data: { url: string } }>(`/documents/itinerary/${bookingId}`),
  },
  // Admin-only endpoints
  admin: {
    overview: () => apiFetch<{ data: AdminOverview }>('/admin/overview'),
    bookings: (params?: PaginationParams) =>
      apiFetch<{ data: Booking[]; meta: PaginationMeta }>('/admin/bookings', { params }),
    payments: (params?: PaginationParams) =>
      apiFetch<{ data: Payment[]; meta: PaginationMeta }>('/admin/payments', { params }),
    customers: (params?: PaginationParams) =>
      apiFetch<{ data: Customer[]; meta: PaginationMeta }>('/admin/customers', { params }),
    routes: {
      list: (params?: PaginationParams) =>
        apiFetch<{ data: Route[]; meta: PaginationMeta }>('/admin/routes', { params }),
      create: (body: Partial<Route>) =>
        apiFetch<{ data: Route }>('/admin/routes', { method: 'POST', body: JSON.stringify(body) }),
      update: (id: string, body: Partial<Route>) =>
        apiFetch<{ data: Route }>(`/admin/routes/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
      delete: (id: string) =>
        apiFetch<void>(`/admin/routes/${id}`, { method: 'DELETE' }),
    },
    schedules: {
      list: (params?: PaginationParams) =>
        apiFetch<{ data: FlightSchedule[]; meta: PaginationMeta }>('/admin/schedules', { params }),
      create: (body: Partial<FlightSchedule>) =>
        apiFetch<{ data: FlightSchedule }>('/admin/schedules', { method: 'POST', body: JSON.stringify(body) }),
    },
    aircraft: {
      list: (params?: PaginationParams) =>
        apiFetch<{ data: Aircraft[]; meta: PaginationMeta }>('/admin/aircraft', { params }),
    },
  },
}

// SWR fetcher — keys are always paths (e.g. '/bookings/my?page=1')
export const fetcher = (url: string) => apiFetch<unknown>(url)

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface FlightResult {
  scheduleId: string
  route: { origin: string; destination: string; originCode: string; destinationCode: string }
  aircraft: { name: string; type: string; totalSeats: number }
  departureAt: string
  arrivalAt: string
  durationMinutes: number
  seatsAvailable: number
  priceNgn: number
}

export interface FlightSchedule extends FlightResult {
  policies: string
  amenities: string[]
}

export interface FeaturedRoute {
  id: string
  origin: string
  destination: string
  originCode: string
  destinationCode: string
  priceFrom: number
  durationMinutes: number
  imageKey?: string
}

export interface Booking {
  id: string
  reference: string
  scheduleId: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'failed' | 'refunded'
  passengers: PassengerDto[]
  contactEmail: string
  contactPhone: string
  totalNgn: number
  createdAt: string
  flight?: FlightSchedule
}

export interface Payment {
  id: string
  bookingId: string
  reference: string
  amountNgn: number
  status: 'initialized' | 'pending' | 'success' | 'failed' | 'reversed'
  createdAt: string
  booking?: Booking
}

export interface Customer {
  id: string
  email: string
  fullName: string
  phone?: string
  createdAt: string
  bookingCount: number
}

export interface Route {
  id: string
  origin: string
  destination: string
  originCode: string
  destinationCode: string
  isActive: boolean
}

export interface Aircraft {
  id: string
  name: string
  registration: string
  type: string
  totalSeats: number
  isActive: boolean
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface AdminOverview {
  bookingsToday: number
  revenueToday: number
  revenueMonth: number
  activeBookings: number
  pendingPayments: number
  totalCustomers: number
  recentBookings: Booking[]
}
