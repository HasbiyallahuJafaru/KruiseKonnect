# KruiseKonnect — Frontend Specification (Next.js)

---

## Stack

- Next.js 14 (App Router — no Pages Router)
- TailwindCSS
- Framer Motion (page transitions, card animations)
- SWR (client-side data fetching)
- Supabase SSR helpers (auth — httpOnly cookies)

---

## Design Direction: Clean Flat Minimal SaaS

- Navy `#0F1A2E` base with chalk white surfaces
- Electric sky blue `#2563EB` as single accent colour
- Sora (headings) + Figtree (body) — loaded via `next/font`
- Tight grid, generous whitespace, sharp micro-interactions
- No purple gradients, no glassmorphism, no generic hero layouts
- Feels like a serious tool, not a travel brochure

---

## Rendering Strategy Per Page

| Page | Strategy | Revalidate | API Calls |
|---|---|---|---|
| Homepage | ISR | 1800s | 0 (static) |
| Search results | ISR | 120s | 1 (server) |
| Flight detail | ISR | 600s | 1 (server) |
| Booking form | SSR | force-dynamic | 1 (seat check) |
| Checkout | force-dynamic | never | 0 (state from prev) |
| Payment processing | force-dynamic | never | 0 (SSE) |
| Confirmation | force-dynamic | never | 1 (server) |
| Dashboard | force-dynamic | never | SWR client |
| Admin | force-dynamic | never | SWR client |

---

## Route Structure

```
app/
├── (public)/
│   ├── page.tsx                      ← Homepage
│   ├── flights/
│   │   ├── search/page.tsx           ← Search results
│   │   └── [scheduleId]/page.tsx     ← Flight detail
│   └── booking/
│       └── retrieve/page.tsx         ← Retrieve booking (no auth)
├── (auth)/
│   ├── login/page.tsx
│   └── signup/page.tsx
├── booking/
│   ├── [scheduleId]/page.tsx         ← Booking form (auth required)
│   ├── checkout/[bookingId]/page.tsx ← Checkout (auth required)
│   ├── payment/[reference]/page.tsx  ← Payment processing (auth required)
│   └── confirmation/[bookingId]/page.tsx ← Confirmation (auth required)
├── dashboard/
│   ├── page.tsx                      ← Overview
│   ├── bookings/
│   │   ├── page.tsx                  ← Booking list
│   │   └── [id]/page.tsx             ← Booking detail
│   └── profile/page.tsx
└── admin/
    ├── page.tsx                      ← Overview
    ├── bookings/page.tsx
    ├── payments/page.tsx
    ├── customers/page.tsx
    ├── routes/page.tsx
    ├── schedules/page.tsx
    ├── aircraft/page.tsx
    ├── documents/page.tsx
    ├── emails/page.tsx
    ├── reports/page.tsx
    └── users/page.tsx
```

---

## Auth Middleware (Route Protection)

```typescript
// apps/web/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse, NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const { data: { session } } = await supabase.auth.getSession()

  const isAuth = !!session
  const isAdminPath = req.nextUrl.pathname.startsWith('/admin')
  const isDashboardPath = req.nextUrl.pathname.startsWith('/dashboard')
  const isBookingPath = req.nextUrl.pathname.match(/^\/booking\/(checkout|payment|confirmation)/)

  if ((isDashboardPath || isBookingPath) && !isAuth) {
    return NextResponse.redirect(new URL('/login?redirect=' + req.nextUrl.pathname, req.url))
  }

  if (isAdminPath) {
    if (!isAuth) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    // Admin role check happens at API level — middleware just checks auth
    // If API returns 403, admin UI shows access denied
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/booking/checkout/:path*',
            '/booking/payment/:path*', '/booking/confirmation/:path*']
}
```

---

## API Client (Typed Fetch Wrapper)

```typescript
// apps/web/lib/api.ts
// Central API client — all fetch calls go through here

const API_BASE = process.env.NEXT_PUBLIC_API_URL

async function apiFetch<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string> } = {}
): Promise<T> {
  const url = new URL(`${API_BASE}${path}`)
  if (options.params) {
    Object.entries(options.params).forEach(([k, v]) => url.searchParams.set(k, v))
  }

  const res = await fetch(url.toString(), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // always send cookies
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new ApiError(res.status, error.message)
  }

  return res.json()
}

export const api = {
  routes: {
    search: (params: SearchParams) =>
      apiFetch('/routes/search', { params }),
  },
  bookings: {
    create: (body: CreateBookingDto) =>
      apiFetch('/bookings/create', { method: 'POST', body: JSON.stringify(body) }),
    get: (id: string) =>
      apiFetch(`/bookings/${id}`),
    getMy: (params?: PaginationParams) =>
      apiFetch('/bookings/my', { params }),
  },
  payments: {
    initialize: (bookingId: string) =>
      apiFetch('/payments/initialize', { method: 'POST', body: JSON.stringify({ bookingId }) }),
    verify: (reference: string) =>
      apiFetch(`/payments/verify/${reference}`),
  },
  documents: {
    getReceiptUrl: (bookingId: string) =>
      apiFetch(`/documents/receipt/${bookingId}`),
    getItineraryUrl: (bookingId: string) =>
      apiFetch(`/documents/itinerary/${bookingId}`),
  },
}
```

---

## SWR Usage Rules

```typescript
// CORRECT — deduplicated, no polling for static data
const { data, error, isLoading } = useSWR(
  `/bookings/${id}`,
  fetcher,
  {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
    refreshInterval: 0,
  }
)

// CORRECT — admin stats, background refresh every 2 min
const { data } = useSWR('/admin/overview', fetcher, {
  refreshInterval: 120_000,
  revalidateOnFocus: true,
})

// NEVER — polling payment status (use SSE instead)
// refreshInterval: 2000 ← NEVER DO THIS for payment status
```

---

## Payment Status SSE (Client)

```typescript
// apps/web/components/booking/PaymentStatus.tsx
'use client'

export function PaymentStatus({ reference }: { reference: string }) {
  const router = useRouter()

  useEffect(() => {
    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL}/sse/payments/${reference}`,
      { withCredentials: true }
    )

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.status === 'confirmed') {
        eventSource.close()
        router.push(`/booking/confirmation/${data.bookingId}`)
      }

      if (data.status === 'failed') {
        eventSource.close()
        // Show error state
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
      // Fallback: poll verify endpoint once
      api.payments.verify(reference).then(result => {
        if (result.data.status === 'success') {
          router.push(`/booking/confirmation/${result.data.bookingId}`)
        }
      })
    }

    // Cleanup on unmount
    return () => eventSource.close()
  }, [reference, router])

  return <PaymentLoadingUI />
}
```

---

## Environment Variables Rules

### NEVER put in frontend (NEXT_PUBLIC_*):
- `SUPABASE_SERVICE_ROLE_KEY`
- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_WEBHOOK_SECRET`
- Any API key that has write access

### Safe for frontend:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` (public key only — for popup)
- `NEXT_PUBLIC_API_URL`

---

## Component Rules

1. Use `next/image` for all images — never raw `<img>`
2. Use `next/link` for all navigation — never raw `<a>` for internal links
3. Load fonts via `next/font/google` — never CDN `<link>` tags for fonts
4. Server Components by default — only add `'use client'` when you need hooks or browser APIs
5. No inline styles — Tailwind only
6. All forms use controlled components — no uncontrolled inputs
7. All forms validate client-side before submission (but server always validates too)
8. Loading states on all async operations — no silent loading
9. Error boundaries on all pages
10. Empty states on all list views

---

## Framer Motion Usage

Only animate these moments:
- Page entrance (staggered content reveal on load)
- Card hover (subtle lift — no scale above 1.02)
- Booking step transitions (slide between steps)
- Success/error state transitions (fade)

Do NOT animate:
- Navigation menus
- Form inputs
- Table rows
- Admin data tables
- Anything that updates frequently

---

## Accessibility

- All interactive elements have `aria-label` or visible text
- Forms have `<label>` elements linked to inputs
- Error messages are announced via `role="alert"`
- Colour contrast meets WCAG AA minimum
- Keyboard navigation works on all interactive elements
- Focus styles are visible (never `outline: none` without replacement)
