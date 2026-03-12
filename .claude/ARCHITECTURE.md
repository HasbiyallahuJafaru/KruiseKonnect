# KruiseKonnect — System Architecture

---

## System Diagram

```
User Browser
     │
     ├── Static/ISR pages ──→ Netlify CDN (no backend call)
     │
     ├── Server Components ──→ Next.js on Netlify
     │                              │
     │                              ├── Redis (Upstash) ← cache hit
     │                              └── NestJS API (Render) ← cache miss
     │
     └── Client Components ──→ NestJS API (Render)
                                      │
                          ┌───────────┼───────────────┐
                          │           │               │
                    Supabase DB   Supabase Auth   Supabase Storage
                          │
                    Redis (Upstash)
                          │
                    Paystack API
                          │
                    Resend (Email)
                          │
                    BullMQ Workers (Render)
```

---

## Deployment Targets

### Frontend — Netlify
- Next.js 14 App Router
- Edge functions for coarse rate limiting
- CDN for all static assets
- ISR for public pages (homepage, routes)
- Environment: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`

### Backend — Render
- NestJS API server (Web Service)
- NestJS BullMQ workers (Background Worker)
- Both connect to same Redis and Supabase instances
- Environment: all secrets live here only

### Database — Supabase
- PostgreSQL with RLS enabled on every table
- Supabase Auth for JWT issuance
- Supabase Storage (private bucket: `booking-documents`)
- Point-in-Time Recovery enabled (Pro plan required)

### Cache / Queue — Upstash Redis
- Rate limiting state (shared across Render instances)
- Application cache (routes, schedules, aircraft)
- BullMQ job queues (PDF generation, email sending)
- Sliding window rate limit counters

---

## Monorepo Structure

```
kruisekonnect/
├── apps/
│   ├── web/                          # Next.js frontend
│   │   ├── app/
│   │   │   ├── (public)/             # Homepage, search, flight detail
│   │   │   ├── (auth)/               # Login, signup
│   │   │   ├── booking/              # Booking, checkout, payment, confirmation
│   │   │   ├── dashboard/            # Customer dashboard
│   │   │   └── admin/                # Admin dashboard
│   │   ├── components/
│   │   │   ├── ui/                   # Shared UI components
│   │   │   ├── booking/              # Booking-specific components
│   │   │   └── admin/                # Admin-specific components
│   │   ├── lib/
│   │   │   ├── api.ts                # API client (typed fetch wrappers)
│   │   │   ├── auth.ts               # Supabase auth helpers
│   │   │   └── swr.ts                # SWR configuration
│   │   └── middleware.ts             # Auth middleware, route protection
│   │
│   └── api/                          # NestJS backend
│       └── src/
│           ├── auth/
│           ├── users/
│           ├── bookings/
│           ├── payments/
│           ├── routes/
│           ├── schedules/
│           ├── aircraft/
│           ├── documents/
│           ├── emails/
│           ├── admin/
│           ├── reports/
│           ├── webhooks/
│           ├── audit/
│           ├── cache/
│           ├── queue/
│           └── common/
│               ├── guards/
│               ├── interceptors/
│               ├── decorators/
│               ├── filters/
│               └── pipes/
│
├── packages/
│   └── shared/
│       ├── types/                    # Shared TypeScript interfaces
│       └── constants/                # Shared enums and constants
│
├── .claude/                          # Claude guide files (this folder)
├── turbo.json
└── package.json
```

---

## NestJS Module List

Each module is self-contained with its own controller, service, repository, and DTOs.

```
auth        → JWT strategy, Supabase auth integration, guards
users       → User profile CRUD
bookings    → Booking creation, retrieval, status management
payments    → Paystack init, webhook, verify
routes      → Route CRUD (admin) + public search
schedules   → Schedule CRUD (admin) + public listing
aircraft    → Fleet CRUD (admin) + public listing
documents   → PDF generation, signed URL generation
emails      → Email send via Resend, email log
admin       → Admin-specific aggregation endpoints
reports     → CSV/PDF export generation
webhooks    → Paystack webhook handler
audit       → Audit log writes
cache       → Cache interceptor, invalidation helpers
queue       → BullMQ queue definitions and processors
common      → Guards, interceptors, pipes, filters, decorators
```

---

## Environment Variables

### Frontend (Netlify) — Public only
```
NEXT_PUBLIC_API_URL=https://api.kruisekonnect.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_...
NEXT_PUBLIC_SENTRY_DSN=
```

### Backend (Render) — All secrets
```
# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=        ← NEVER on frontend
SUPABASE_JWT_SECRET=

# Redis
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=

# Paystack
PAYSTACK_SECRET_KEY=sk_live_...   ← NEVER on frontend
PAYSTACK_WEBHOOK_SECRET=

# Email
RESEND_API_KEY=

# App
NODE_ENV=production
API_PORT=3001
FRONTEND_URL=https://kruisekonnect.com
JWT_EXPIRY=7d
ADMIN_JWT_EXPIRY=2h

# Sentry
SENTRY_DSN=
```

---

## Inter-Service Communication

- Frontend → Backend: HTTPS REST (JSON)
- Frontend → Supabase: Supabase JS client (anon key, RLS enforced)
- Backend → Supabase DB: Supabase service role (bypasses RLS — use carefully)
- Backend → Paystack: HTTPS REST
- Backend → Resend: HTTPS REST
- Backend → Redis: Upstash Redis REST API
- Paystack → Backend: Webhook POST (verified by HMAC)
- Backend → Frontend: SSE stream (payment status)
